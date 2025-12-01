// backend/check_models.js
require('dotenv').config();
const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("ERROR: No GEMINI_API_KEY found in .env file");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log("Checking available models for your API key...");

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (response.error) {
        console.error("\nAPI ERROR:");
        console.error(response.error.message);
      } else {
        console.log("\n--- SUCCESS! YOU CAN USE THESE MODELS ---");
        // Filter for chat-capable models
        const chatModels = response.models
          .filter(m => m.supportedGenerationMethods.includes("generateContent"))
          .map(m => m.name.replace('models/', ''));
        
        console.log(chatModels.join('\n'));
        console.log("-----------------------------------------");
      }
    } catch (e) {
      console.error("Error parsing response:", e);
    }
  });
}).on('error', (e) => {
  console.error("Connection error:", e);
});