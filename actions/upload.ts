"use server";

import { HfInference } from "@huggingface/inference";
import { supabase } from "@/lib/supabase";
import pdf from "pdf-parse";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
// @ts-ignore
import { convertPdfToImages } from "@/lib/pdf-to-image";

// Initialize Hugging Face client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function uploadDocument(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        if (!file) {
            return { success: false, error: "No file provided" };
        }

        console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

        let text = "";
        const isImage = file.type.startsWith("image/");
        const isPdf = file.type === "application/pdf";

        if (isPdf) {
            // 1. Extract text from PDF (Hybrid Approach)
            try {
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                // A. Raw Text Extraction (Fast & Accurate for text)
                const pdfData = await pdf(buffer);
                const rawText = pdfData.text;

                // Smart Mode: Detect Scanned PDF
                // If raw text is very short, it's likely a scanned document (images only)
                const isScanned = rawText.trim().length < 100;
                console.log(`PDF Extraction: ${rawText.trim().length} chars. Mode: ${isScanned ? 'SCANNED (OCR)' : 'HYBRID (Enhancement)'}`);

                // B. Visual Analysis (Capture charts/diagrams via Llama 4 Scout)
                let visionText = "";
                if (process.env.GROQ_API_KEY) {
                    try {
                        console.log("Starting PDF Vision analysis...");

                        // Convert PDF pages to images using pure JS helper
                        const allImages = await convertPdfToImages(buffer);

                        const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

                        for (let i = 0; i < allImages.length; i++) {
                            const imgBuffer = allImages[i];
                            // imgBuffer is Uint8Array or Buffer? It's Uint8Array (from node buffer in browser? or Buffer in node).
                            // pdf-img-convert returns Uint8Array[] in most contexts, or string[] base64 if specified.
                            // Let's assume it returns Uint8Array or Buffer suitable for base64 conversion.

                            const base64Image = Buffer.from(imgBuffer).toString('base64');

                            console.log(`Analyzing PDF Page ${i + 1}/${allImages.length} with Vision...`);

                            try {
                                const result = await generateText({
                                    model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
                                    messages: [
                                        {
                                            role: "user",
                                            content: [
                                                {
                                                    type: "text",
                                                    text: isScanned
                                                        ? `This is a scanned document (Page ${i + 1}). Transcribe ALL visible text on this page exactly as it appears. Do not summarize. Output the full text content.`
                                                        : `Analyze this PDF page (Page ${i + 1}). Summarize the visual layout, extract any charts, diagrams, or tables in detail, and transcribe any text that might be missed by standard extraction.`
                                                },
                                                { type: "image", image: `data:image/png;base64,${base64Image}` }
                                            ],
                                        },
                                    ],
                                });
                                visionText += `\n--- Page ${i + 1} Visual Analysis ---\n${result.text}\n`;
                            } catch (pageErr: any) {
                                console.warn(`Failed to analyze page ${i + 1}: ${pageErr.message}`);
                            }
                        }
                    } catch (visionErr: any) {
                        console.error("PDF Vision failed:", visionErr);
                        // Fallback to just raw text if vision fails completely
                    }
                }

                // Combine them
                text = `=== RAW TEXT CONTENT ===\n${rawText}\n\n=== VISUAL ANALYSIS (CHARTS/DIAGRAMS) ===\n${visionText}`;

                if (!text || text.trim().length === 0) {
                    return { success: false, error: "No text extracted from PDF." };
                }
            } catch (err: any) {
                console.error("PDF Parsing failed:", err);
                return { success: false, error: "Failed to parse PDF file." };
            }
        } else if (isImage) {
            // 2. Process Image with Groq Vision
            if (!process.env.GROQ_API_KEY) {
                console.error("Missing Groq API Key");
                return { success: false, error: "Groq API Key is missing. Cannot process images." };
            }

            try {
                const groq = createGroq({
                    apiKey: process.env.GROQ_API_KEY,
                });

                const arrayBuffer = await file.arrayBuffer();
                const base64Data = Buffer.from(arrayBuffer).toString("base64");

                // Use Llama 4 Scout model
                const result = await generateText({
                    model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: "Analyze this image in detail. Extract all visible text and describe any diagrams, charts, or visual elements comprehensively. Return the information as structured text." },
                                { type: "image", image: `data:${file.type};base64,${base64Data}` }
                            ],
                        },
                    ],
                });

                text = result.text;
                // append some metadata about it being an image description
                text = `[Image Description for ${file.name}]\n${text}`;

                console.log(`Generated description for image ${file.name}, length: ${text.length}`);
            } catch (err: any) {
                console.error("Groq Image processing failed:", err);
                return { success: false, error: `Image processing failed: ${err.message}. Ensure your GROQ_API_KEY is valid.` };
            }
        } else {
            return { success: false, error: "Unsupported file type. Please upload a PDF or an Image (JPG/PNG/WEBP)." };
        }

        if (!text || text.trim().length === 0) {
            return { success: false, error: "No content extracted from file." };
        }

        // 3. Split text into chunks using Recursive Character Splitting
        // We use a larger chunk size for semantic completeness
        const chunks = recursiveTextSplitter(text, 1000, 200);
        console.log(`Generated ${chunks.length} chunks from ${file.name}`);

        // 4. Generate embeddings and store in Supabase
        let successCount = 0;

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];

            try {
                // Generate embedding using Hugging Face (BAAI/bge-small-en-v1.5 - 384 dimensions)
                const embeddingResponse = await hf.featureExtraction({
                    model: "BAAI/bge-small-en-v1.5",
                    inputs: chunk,
                });

                // Convert to array if needed
                const embedding = Array.isArray(embeddingResponse)
                    ? embeddingResponse
                    : Array.from(embeddingResponse as any);

                // Store in Supabase
                const { error } = await supabase.from("documents").insert({
                    content: chunk,
                    metadata: {
                        filename: file.name,
                        fileType: file.type,
                        chunkIndex: i,
                        totalChunks: chunks.length,
                        uploadedAt: new Date().toISOString(),
                    },
                    embedding: embedding,
                });

                if (error) {
                    console.error(`Error storing chunk ${i}:`, error);
                    // We continue even if one chunk fails, but log it
                } else {
                    successCount++;
                }

                // Add a small delay to avoid rate limits if many chunks
                if (i % 10 === 0) await new Promise(r => setTimeout(r, 100));

            } catch (embeddingError: any) {
                console.error(`Error generating embedding for chunk ${i}:`, embeddingError);
            }
        }

        if (successCount === 0) {
            return { success: false, error: "Failed to store any chunks to the database." };
        }

        console.log(`Successfully locally stored ${successCount}/${chunks.length} chunks for ${file.name}`);
        return { success: true, chunks: successCount };
    } catch (error: any) {
        console.error("Upload error:", error);
        return { success: false, error: error.message || "Upload failed" };
    }
}

// Improved Recursive Character Text Splitter
function recursiveTextSplitter(
    text: string,
    chunkSize: number,
    chunkOverlap: number
): string[] {
    const separators = ["\n\n", "\n", ".", "!", "?", " ", ""];
    const chunks: string[] = [];
    let currentChunk = "";

    // Normalize text
    text = text.replace(/\r\n/g, "\n");

    // Helper to add a chunk
    const addChunk = (chunk: string) => {
        if (chunk.trim().length > 0) {
            chunks.push(chunk.trim());
        }
    };

    // First split by paragraphs
    const paragraphs = text.split("\n\n");

    for (const paragraph of paragraphs) {
        // If paragraph fits, add to current chunk or start new
        if ((currentChunk.length + paragraph.length + 2) <= chunkSize) {
            currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
        } else {
            // Paragraph itself needs splitting?
            if (paragraph.length > chunkSize) {
                // Push current chunk if exists
                if (currentChunk) {
                    addChunk(currentChunk);
                    currentChunk = "";
                }

                // Split this long paragraph recursively
                const subChunks = splitLongText(paragraph, chunkSize, chunkOverlap, ["\n", ".", " ", ""]);

                // Add all but the last subchunk (which might be growable)
                for (let i = 0; i < subChunks.length - 1; i++) {
                    addChunk(subChunks[i]);
                }
                currentChunk = subChunks[subChunks.length - 1];

            } else {
                // Paragraph fits in a new chunk
                addChunk(currentChunk);
                currentChunk = paragraph;
            }
        }
    }

    if (currentChunk) {
        addChunk(currentChunk);
    }

    return chunks;
}

function splitLongText(text: string, chunkSize: number, chunkOverlap: number, separators: string[]): string[] {
    const finalChunks: string[] = [];
    let separator = separators[0];
    let nextSeparators = separators.slice(1);

    if (separator === undefined) {
        // Base case: just slice by characters
        for (let i = 0; i < text.length; i += (chunkSize - chunkOverlap)) {
            finalChunks.push(text.slice(i, i + chunkSize));
        }
        return finalChunks;
    }

    const parts = text.split(separator);
    let current = "";

    for (const part of parts) {
        const proposed = current ? (current + separator + part) : part;
        if (proposed.length <= chunkSize) {
            current = proposed;
        } else {
            if (current) {
                finalChunks.push(current);
                current = "";
            }

            if (part.length > chunkSize && nextSeparators.length > 0) {
                // Recursively split the part
                const subChunks = splitLongText(part, chunkSize, chunkOverlap, nextSeparators);
                finalChunks.push(...subChunks);
            } else {
                // Force split if no more separators
                if (part.length > chunkSize) {
                    const forcedRequest = splitLongText(part, chunkSize, chunkOverlap, []);
                    finalChunks.push(...forcedRequest);
                } else {
                    current = part;
                }
            }
        }
    }

    if (current) finalChunks.push(current);

    return finalChunks;
}
