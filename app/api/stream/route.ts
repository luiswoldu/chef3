// app/api/stream/route.ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const systemMessage: OpenAI.ChatCompletionSystemMessageParam = {
    role: "system",
    content: `
      You are Hands, a cooking assistant. 
      Always output responses in a structured streaming format:

      <answer>
        <text>
          Plain-language response as continuous text.
        </text>

        "If recommending a dish, then follow the guidelines below"
        <items>
          <item>
            <title>Recipe name</title>
            <description>One-line description</description>
          </item>
        </items>
      </answer>

      Strict rules:
      - No duplicate words.
      - Never repeat tokens.
      - Never restate earlier output.
      - Always follow the XML structure.
      - Stream output in small, self-contained chunks.
    `,
  };

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    stream: true,
    messages: [
      systemMessage,
      { role: "user", content: prompt },
    ],
  });

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
}