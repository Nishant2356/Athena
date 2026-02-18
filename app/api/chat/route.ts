import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { supabase } from "@/lib/supabase";
import { PERSONAS } from "@/lib/personas";

const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { messages: rawMessages, personaId } = await req.json();

        // Convert messages to CoreMessage format (content string) to avoid schema errors
        const messages = rawMessages.map((m: any) => ({
            role: m.role,
            content: m.content || m.parts?.map((p: any) => p.text).join('') || "",
        }));

        const lastMessage = messages[messages.length - 1];
        const persona = PERSONAS.find((p) => p.id === personaId) || PERSONAS[0];

        let context = "";

        // RAG: Retrieve relevant context using vector similarity search
        try {
            const { HfInference } = await import("@huggingface/inference");
            const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

            // 1. Generate embedding for the user's question
            const embeddingResponse = await hf.featureExtraction({
                model: "BAAI/bge-small-en-v1.5",
                inputs: lastMessage.content,
            });

            // Convert to array
            const embedding = Array.isArray(embeddingResponse)
                ? embeddingResponse
                : Array.from(embeddingResponse as any);

            // 2. Query Supabase for similar documents using vector search
            const { data: matches, error } = await supabase.rpc("match_documents", {
                query_embedding: embedding,
                match_threshold: 0.15, // Very low threshold for maximum recall
                match_count: 15, // More chunks to ensure complete coverage
            });

            if (error) {
                console.warn("RAG query error:", error);
            } else if (matches && matches.length > 0) {
                // Format context with similarity scores and sources
                context = matches
                    .map((match: any, idx: number) => {
                        const similarity = (match.similarity * 100).toFixed(1);
                        const source = match.metadata?.filename || 'Unknown';
                        return `[Source: ${source}, Relevance: ${similarity}%]\n${match.content}`;
                    })
                    .join("\n\n---\n\n");
                console.log(`Retrieved ${matches.length} relevant document chunks (vector similarity)`);
                console.log(`Similarity scores: ${matches.map((m: any) => (m.similarity * 100).toFixed(1) + '%').join(', ')}`);
            }
        } catch (err) {
            console.warn("RAG Context retrieval failed:", err);
        }

        // 3. Construct System Prompt
        const systemPrompt = `
        ${persona.systemPrompt}
        
        ${context ? `
=== RELEVANT INFORMATION FROM UPLOADED DOCUMENTS ===
${context}
=== END OF DOCUMENT CONTEXT ===

IMPORTANT INSTRUCTIONS:
1. Use the document context above to answer the question accurately
2. If the answer is clearly in the documents, cite the source
3. If the documents don't contain the answer, say so and answer from general knowledge
4. Don't make up information that's not in the documents
5. Pay attention to the relevance scores - higher scores are more relevant
        ` : "No uploaded documents available. Answer from general knowledge."}
      `;

        // 4. Stream Response
        const result = await streamText({
            model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
            system: systemPrompt,
            messages,
            onChunk: ({ chunk }) => {
                // Log partial text to terminal to verify generation
                if (chunk.type === 'text-delta') {
                    console.log("Server Chunk:", chunk.text);
                }
            },
        });
        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error("Chat API Fatal Error:", error);
        return new Response(JSON.stringify({ error: "Failed to process chat request" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
