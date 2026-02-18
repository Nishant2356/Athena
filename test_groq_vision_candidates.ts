
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

async function testGroqVisionModels() {
    const modelsToTest = [
        "meta-llama/llama-4-scout-17b-16e-instruct", // User recommended
        "llama-3.2-90b-vision-preview", // 90b alternative
        "llama-3.2-11b-vision-preview", // Deprecated one (just to see error)
    ];

    // Use a simple public image
    const imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg";

    console.log("Testing Groq Vision Models...");
    console.log(`API Key present: ${!!process.env.GROQ_API_KEY}`);

    const groq = createGroq({
        apiKey: process.env.GROQ_API_KEY,
    });

    for (const modelId of modelsToTest) {
        console.log(`\n-----------------------------------`);
        console.log(`Testing: ${modelId}`);
        try {
            const result = await generateText({
                model: groq(modelId),
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "What is in this image? Describe it briefly." },
                            { type: "image", image: imageUrl }
                        ],
                    },
                ],
            });

            console.log(`✅ SUCCESS: ${modelId}`);
            console.log(`Response: ${result.text.substring(0, 100)}...`);
            // We found a working one?
            // Let's continue testing others just in case, or stop? 
            // If the user recommended one works, we prefer that.
            if (modelId === "meta-llama/llama-4-scout-17b-16e-instruct") return;

        } catch (error: any) {
            console.log(`❌ FAILED: ${modelId}`);
            console.log(`Error: ${error.message.split('\n')[0]}`);
        }
    }
}

testGroqVisionModels();
