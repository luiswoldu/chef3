// config for openai model and prompting function
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function askOpenAI(prompt: string) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { role: "user", content: prompt }
      ]
    });
  
    return response.choices[0].message.content ?? "";
  }