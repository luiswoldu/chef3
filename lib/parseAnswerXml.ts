// NOT IN USE YET, still integrate fetching recipe images from database 
// lib/parseAnswerXml.ts
export type ParsedItem = {
  title: string;
  description: string;
};

export type ParsedAnswer = {
  text: string;
  items: ParsedItem[];
};

// Super simple XML-ish parser for our constrained format
export function parseAnswerXml(xml: string): ParsedAnswer | null {
  // Ensure we at least see the root tags
  if (!xml.includes("<answer")) return null;

  const textMatch = xml.match(/<text[^>]*>([\s\S]*?)<\/text>/i);
  const itemsBlockMatch = xml.match(/<items[^>]*>([\s\S]*?)<\/items>/i);

  const text = textMatch ? cleanInner(textMatch[1]) : "";
  const items: ParsedItem[] = [];

  if (itemsBlockMatch) {
    const itemsBlock = itemsBlockMatch[1];
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let itemMatch: RegExpExecArray | null;

    while ((itemMatch = itemRegex.exec(itemsBlock)) !== null) {
      const itemContent = itemMatch[1];

      const titleMatch = itemContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const descMatch = itemContent.match(/<description[^>]*>([\s\S]*?)<\/description>/i);

      const title = titleMatch ? cleanInner(titleMatch[1]) : "";
      const description = descMatch ? cleanInner(descMatch[1]) : "";

      if (title || description) {
        items.push({ title, description });
      }
    }
  }

  if (!text && items.length === 0) return null;
  return { text, items };
}

function cleanInner(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}