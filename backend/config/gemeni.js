import { GoogleGenAI } from "@google/genai";
import 'dotenv/config'

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is not set in .env file!");
}

const geminiAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default geminiAI;