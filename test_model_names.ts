
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

async function testModelNames() {
    const modelsToTest = [
        // Recommended by notices
        "meta-llama/llama-4-scout-17b-16e-instruct",
        "llama-4-scout-17b-16e-instruct",

        // Other mentioned replacement
        "meta-llama/llama-4-maverick-17b-128e-instruct",
        "llama-4-maverick-17b-128e-instruct",

        // Current working fallback
        "llama-3.2-90b-vision-preview"
    ];

    const imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg";

    console.log("Testing Model Names...");
    const groq = createGroq({
        apiKey: process.env.GROQ_API_KEY,
    });

    for (const modelId of modelsToTest) {
        console.log(`\nTesting: ${modelId}`);
        try {
            const result = await generateText({
                model: groq(modelId),
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Describe this image." },
                            { type: "image", image: imageUrl }
                        ],
                    },
                ],
            });

            console.log(`✅ SUCCESS: ${modelId}`);
            console.log(`Response length: ${result.text.length}`);
        } catch (error: any) {
            console.log(`❌ FAILED: ${modelId}`);
            console.log(`Error: ${error.message.split('\n')[0]}`); // First line only
        }
    }
}

testModelNames();
