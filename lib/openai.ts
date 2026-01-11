import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function askOpenAI({
  promptId,
  version,
  variables,
}: {
  promptId: string;
  version?: string;
  variables?: Record<string, any>;
}) {
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    prompt: {
      id: promptId,
      version,
    },
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify(variables ?? {}),
          },
        ],
      },
    ],
  });

  return response.output_text;
}