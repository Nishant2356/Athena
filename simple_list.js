const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function verify() {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    try {
        const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const listData = await listResponse.json();

        if (listData.models) {
            const models = listData.models.map(m => m.name).join('\n');
            fs.writeFileSync('models.txt', models);
            console.log("Wrote models to models.txt");
        } else {
            fs.writeFileSync('models.txt', "ERROR: " + JSON.stringify(listData));
        }
    } catch (error) {
        fs.writeFileSync('models.txt', "FATAL: " + error.message);
    }
}
verify();
