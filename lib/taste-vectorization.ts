"use server";

import { askOpenAI } from "@/lib/openai";

// reformats JSON object string returned by LLM prompt
function cleanJSON(str: string) {
  return str
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

// processes user taste description into standardized taste vectors
// TODO: research which taste vectors are best suited for food recommendation
export async function createTasteVectors(tasteText: string) {
    const prompt = `
      You are a food profiling model.
      Convert the following user taste description into 12 standardized taste dimensions (0–1).
      NEVER wrap your output in code blocks.
  
      Output ONLY valid JSON with the following keys:
      sweet, savoury, spicy, sour, umami,
      bitter, creamy, crunchy,
      healthy, indulgent,
      vegetarian, seafood_liking
  
      Text:
      "${tasteText}"
    `;
  
    const result = await askOpenAI(prompt); 
    const cleanedResult = cleanJSON(result);
  
    try {
      return JSON.parse(cleanedResult);
    } catch (error) {
      console.error("JSON parse error in processTaste:", error);
      return {};
    }
  }