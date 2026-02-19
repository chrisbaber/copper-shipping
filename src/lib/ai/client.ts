/**
 * Central AI client — Google Gemini Flash (direct API).
 * Falls back to OpenRouter if Google quota is exhausted.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_MODEL = "gemini-2.0-flash";
const OPENROUTER_MODEL = "google/gemini-2.0-flash-exp:free";

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
  const googleKey = process.env.GOOGLE_AI_API_KEY?.trim();
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();

  // Try Google direct first
  if (googleKey) {
    try {
      return await geminiCompletion(messages, googleKey);
    } catch (err) {
      // If quota exceeded and we have OpenRouter, fall back
      if (openRouterKey && String(err).includes("429")) {
        console.warn("Google AI quota exceeded, falling back to OpenRouter");
        return openRouterCompletion(messages, openRouterKey);
      }
      throw err;
    }
  }

  if (openRouterKey) {
    return openRouterCompletion(messages, openRouterKey);
  }

  throw new Error("No AI API key configured. Set GOOGLE_AI_API_KEY or OPENROUTER_API_KEY.");
}

async function geminiCompletion(messages: ChatMessage[], apiKey: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const gemini = genAI.getGenerativeModel({ model: GEMINI_MODEL });

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
              inlineData: { mimeType: match[1], data: match[2] },
            });
          }
        }
      }
    }
  }

  const result = await gemini.generateContent(parts);
  const text = result.response.text();
  if (!text) throw new Error("No content in Gemini response");
  return text;
}

async function openRouterCompletion(messages: ChatMessage[], apiKey: string): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://copper-shipping.vercel.app",
      "X-Title": "Copper Shipping",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
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
  if (!content) throw new Error("No content in OpenRouter response");
  return content;
}
