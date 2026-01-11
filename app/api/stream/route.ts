// app/api/stream/route.ts
import OpenAI from "openai";
import { retrieveRecipes } from "@/lib/retrieveRecipes";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

  // Retrieve semantically relevant recipes (RAG step)
  const recipes = await retrieveRecipes(prompt);

  // Build grounding context for the LLM
  const recipeContext = recipes
    .map(
      (r: { id: any; title: any; caption: any; image: any; }, i: number) =>
        `${i + 1}. ${r.id} - ${r.title} — ${r.caption} - ${r.image}`
    )
    .join("\n");

  // Inject retrieved recipes into the system prompt
  const systemMessage: OpenAI.ChatCompletionSystemMessageParam = {
  role: "system",
  content: `
    You are Hands, a cooking assistant.

    You MUST recommend recipes.

    You MUST output between 1 and ${recipes.length} <item> elements.
    Each <item> MUST use a recipe from the list below.
    You MUST NOT invent recipes.

    Available recipes:
    ${recipeContext}

    Output EXACTLY this XML structure:

    <answer>
      <text>
        One paragraph of helpful explanation.
      </text>
      <items>
        ${recipes.map(() => `
        <item>
          <id></id>
          <title></title>
          <caption></caption>
          <image></image>
        </item>
        `).join("")}
      </items>
    </answer>

    Rules:
    - Do not omit <items>
    - Do not output empty <item>
    - Do not repeat recipes
    - Do not output anything outside XML
    `.trim()
    };

  const completion = await client.chat.completions.create ({
    model: "gpt-4o-mini",
    stream: true,
    messages: [
      systemMessage, { role: "user", content: prompt },
    ]
  })

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            controller.enqueue(encoder.encode(delta));
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
  } catch (err) {
    console.error("/api/stream error:", err);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      { status: 500 }
    );
  }
}