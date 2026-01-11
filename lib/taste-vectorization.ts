"use server";

import { askOpenAI } from "@/lib/openai";

function cleanJSON(str: string) {
  return str.replace(/```json|```/g, "").trim();
}

export async function createTasteVectors(tasteText: string) {
  const result = await askOpenAI({
    promptId: "pmpt_69406cd8596c8197a7f08a7dd5d592510ca08c3d1237f0c5",
    version: "4",
    variables: {
      taste_text: tasteText
    }
  });

  const cleaned = cleanJSON(result);

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("JSON parse error in createTasteVectors:", error);
    return {};
  }
}
