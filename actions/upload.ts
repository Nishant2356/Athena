"use server";

import { HfInference } from "@huggingface/inference";
import { supabase } from "@/lib/supabase";
import pdf from "pdf-parse";

// Initialize Hugging Face client with API token for reliable access
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function uploadDocument(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        if (!file) {
            return { success: false, error: "No file provided" };
        }

        // 1. Extract text from PDF
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const pdfData = await pdf(buffer);
        const text = pdfData.text;

        if (!text || text.trim().length === 0) {
            return { success: false, error: "No text content found in PDF" };
        }

        // 2. Split text into chunks (smaller chunks = more precise retrieval)
        const chunks = splitIntoChunks(text, 600, 100);
        console.log(`Processing ${chunks.length} chunks from ${file.name}`);

        // 3. Generate embeddings and store in Supabase
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
                        chunkIndex: i,
                        totalChunks: chunks.length,
                        uploadedAt: new Date().toISOString(),
                    },
                    embedding: embedding,
                });

                if (error) {
                    console.error(`Error storing chunk ${i}:`, error);
                    return { success: false, error: `Failed to store chunk ${i}: ${error.message}` };
                }

                console.log(`Processed chunk ${i + 1}/${chunks.length}`);
            } catch (embeddingError: any) {
                console.error(`Error generating embedding for chunk ${i}:`, embeddingError);
                return { success: false, error: `Failed to generate embedding: ${embeddingError.message}` };
            }
        }

        console.log(`Successfully uploaded ${file.name} with ${chunks.length} chunks`);
        return { success: true, chunks: chunks.length };
    } catch (error: any) {
        console.error("Upload error:", error);
        return { success: false, error: error.message || "Upload failed" };
    }
}

// Helper function to split text into chunks with overlap
function splitIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        const chunk = text.slice(start, end).trim();

        if (chunk.length > 0) {
            chunks.push(chunk);
        }

        start += chunkSize - overlap;
    }

    return chunks;
}
