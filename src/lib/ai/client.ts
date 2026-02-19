/**
 * Central AI client — Google Gemini 2.0 Flash via OpenRouter.
 *
 * Uses OpenRouter as the API gateway to avoid needing a properly
 * configured Google Cloud project. Gemini Flash is fast (~2-5s for
 * vision) and cheap (~$0.001 per BOL extraction).
 *
 * Account has ~$4.67 remaining — enough for thousands of extractions.
 */

const MODEL = "google/gemini-2.0-flash-001";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface ContentPart {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string | ContentPart[];
}

export async function chatCompletion(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://copper-shipping.vercel.app",
      "X-Title": "Copper Shipping",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      messages,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`AI extraction failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No content in AI response");
  }
  return content;
}
