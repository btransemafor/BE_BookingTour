const axios = require('axios');
require('dotenv').config();

async function generateText(prompt) {
  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/gpt2', // or any fine-tuned model
      { inputs: prompt },
      { headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` } }
    );
    return response.data[0]?.generated_text || "Sorry, I couldn't think of a reply.";
  } catch (err) {
    console.error("HuggingFace generation error:", err);
    throw err;
  }
}

module.exports = { generateText };
