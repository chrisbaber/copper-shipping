/**
 * Central AI client configuration.
 * Priority: Google Gemini (direct) → OpenRouter (fallback).
 * Google Gemini free tier: 15 RPM, 1M tokens/day for Flash models.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

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

/** Generic chat completion — picks provider based on available env vars */
export async function chatCompletion(messages: ChatMessage[]): Promise<string> {
  const googleKey = process.env.GOOGLE_AI_API_KEY?.trim();
  if (googleKey) {
    return geminiCompletion(messages, googleKey);
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (openRouterKey) {
    return openRouterCompletion(messages, openRouterKey);
  }

  throw new Error(
    "No AI API key configured. Set GOOGLE_AI_API_KEY (preferred) or OPENROUTER_API_KEY."
  );
}

/** Google Gemini direct — fast, free tier available */
async function geminiCompletion(
  messages: ChatMessage[],
  apiKey: string
): Promise<string> {
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
  const genAI = new GoogleGenerativeAI(apiKey);
  const gemini = genAI.getGenerativeModel({ model });

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
          // Parse data URL: "data:image/jpeg;base64,..."
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

/** OpenRouter fallback — OpenAI-compatible API */
async function openRouterCompletion(
  messages: ChatMessage[],
  apiKey: string
): Promise<string> {
  const model =
    process.env.ANTHROPIC_MODEL?.trim() || "google/gemini-2.0-flash-exp:free";

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://copper-shipping.vercel.app",
      "X-Title": "Copper Shipping",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      messages,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No content in OpenRouter response");
  }
  return content;
}
