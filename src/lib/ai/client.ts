/**
 * Central AI client — Google Gemini Flash (direct API).
 * Free tier: 15 RPM, 1M tokens/day.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = "gemini-2.0-flash";

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
  const apiKey = process.env.GOOGLE_AI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const gemini = genAI.getGenerativeModel({ model: MODEL });

  // Convert our message format to Gemini parts
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

  for (const msg of messages) {
    if (typeof msg.content === "string") {
      parts.push({ text: msg.content });
    } else {
      for (const part of msg.content) {
        if (part.type === "text" && part.text) {
          parts.push({ text: part.text });
        } else if (part.type === "image_url" && part.image_url?.url) {
          const dataUrl = part.image_url.url;
          const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
          if (match) {
            parts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2],
              },
            });
          }
        }
      }
    }
  }

  const result = await gemini.generateContent(parts);
  const text = result.response.text();
  if (!text) {
    throw new Error("No content in Gemini response");
  }
  return text;
}
