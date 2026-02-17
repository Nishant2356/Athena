const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function verify() {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        console.error("No API key found in .env.local");
        return;
    }

    console.log("Testing API Key:", apiKey.substring(0, 8) + "...");

    try {
        // 1. List Models
        console.log("Listing available models...");

        // Direct fetch to list models
        const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const listData = await listResponse.json();

        if (listData.models) {
            console.log("Available Models:");
            listData.models.forEach(m => {
                console.log(`- ${m.name} (${m.supportedGenerationMethods.join(", ")})`);
            });
        } else {
            console.error("Failed to list models:", listData);
        }

    } catch (error) {
        console.error("Fatal Error:", error);
    }
}

verify();
