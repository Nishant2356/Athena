
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

async function test90b() {
    const modelId = "llama-3.2-90b-vision-preview";
    console.log(`Testing ${modelId}...`);

    const imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg";

    try {
        const groq = createGroq({
            apiKey: process.env.GROQ_API_KEY,
        });

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

        console.log("✅ SUCCESS");
        console.log(result.text.substring(0, 50));
    } catch (error: any) {
        console.log("❌ FAILED");
        console.log(error.message);
    }
}

test90b();
