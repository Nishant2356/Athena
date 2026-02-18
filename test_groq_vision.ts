import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

async function testGroqVision() {
  try {
    const groq = createGroq({
      apiKey: process.env.GROQ_API_KEY,
    });

    // Test with a simple image URL (e.g. placeholder)
    // Actually, let's just check if the model is available by sending a text-only prompt to the vision model?
    // Or better, just try to list models if possible, or run a simple prompt.
    
    console.log("Testing Groq Vision model access...");
    
    const result = await generateText({
      model: groq("llama-3.2-11b-vision-preview"),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "What is in this image?" },
            // We need an image. using a public one.
            { type: "image", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg" }
          ],
        },
      ],
    });

    console.log("Success! Response:", result.text);
  } catch (error) {
    console.error("Error testing Groq Vision:", error);
  }
}

testGroqVision();
