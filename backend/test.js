// Run this file with: node test-models.js
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    const models = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
    // Actually, we need to list them via the API, but the library simplifies this.
    // Let's just try to hit the API directly to check permissions.
    console.log("Checking API Key...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello");
    console.log("Success! Model is working:", result.response.text());
  } catch (error) {
    console.error("Error:", error.message);
  }
}
listModels();