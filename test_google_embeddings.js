const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

async function testEmbeddings() {
    console.log("Testing Google AI embedding models...\n");

    const modelsToTest = [
        "text-embedding-001",
        "embedding-001",
        "models/text-embedding-001",
        "models/embedding-001",
    ];

    for (const modelName of modelsToTest) {
        try {
            console.log(`Trying model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const result = await model.embedContent("Hello world test");
            console.log(`✅ SUCCESS with ${modelName}`);
            console.log(`Embedding dimensions: ${result.embedding.values.length}`);
            console.log(`First 5 values: ${result.embedding.values.slice(0, 5)}\n`);

            return { model: modelName, dimensions: result.embedding.values.length };
        } catch (error) {
            console.log(`❌ FAILED: ${error.message}\n`);
        }
    }

    console.log("❌ No working embedding models found");
    return null;
}

testEmbeddings()
    .then(result => {
        if (result) {
            console.log(`\n✅ FOUND WORKING MODEL: ${result.model}`);
            console.log(`Dimensions: ${result.dimensions}`);
            console.log(`\nUse this in your code!`);
        } else {
            console.log("\n❌ Google API key doesn't support embeddings");
            console.log("Will need to use alternative like Hugging Face");
        }
    })
    .catch(err => console.error("Fatal error:", err));
