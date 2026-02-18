
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

async function testGroqModel() {
    const modelId = "meta-llama/llama-4-scout-17b-16e-instruct"; // User provided ID
    // Also try simpler ID if that fails? e.g. "llama-4-scout-17b-16e-instruct"

    console.log(`Testing Groq model: ${modelId}`);

    try {
        const groq = createGroq({
            apiKey: process.env.GROQ_API_KEY,
        });

        const result = await generateText({
            model: groq(modelId),
            messages: [
                {
                    role: "user",
                    content: "Hello, are you functional?",
                },
            ],
        });

        console.log("Success!");
        console.log("Response:", result.text);
    } catch (error) {
        console.error("Error testing model:", error.message);

        // Fallback test
        /*
        const fallbackId = "llama-4-scout-17b-16e-instruct"; 
        console.log(`\nRetrying with short ID: ${fallbackId}`);
        try {
            // ... code ...
        } catch ...
        */
    }
}

testGroqModel();
