const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

async function listModels() {
    console.log("Listing all available Google AI models...\n");

    try {
        // List all models
        const models = await genAI.listModels();

        console.log("Available models:");
        for await (const model of models) {
            console.log(`\nModel: ${model.name}`);
            console.log(`  Display Name: ${model.displayName}`);
            console.log(`  Supported Methods: ${model.supportedGenerationMethods?.join(', ')}`);
        }
    } catch (error) {
        console.error("Error listing models:", error.message);
    }
}

listModels();
