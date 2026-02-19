/**
 * Central AI client configuration.
 * Supports both OpenRouter (OpenAI-compatible) and direct Anthropic API.
 * Model is configurable via ANTHROPIC_MODEL env var — never hardcode model strings.
 */

import { aiConfig } from "@/lib/config/env";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export function getModel(): string {
  return aiConfig.model;
}

export function getProvider(): "openrouter" | "anthropic" {
  return aiConfig.provider;
}

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

/** Generic chat completion via configured provider */
export async function chatCompletion(messages: ChatMessage[]): Promise<string> {
  const provider = aiConfig.provider;

  if (provider === "openrouter") {
    return openRouterCompletion(messages);
  }
  // Future: direct Anthropic SDK path
  throw new Error("Direct Anthropic API not yet implemented — use OPENROUTER_API_KEY");
}

async function openRouterCompletion(messages: ChatMessage[]): Promise<string> {
  const apiKey = aiConfig.openRouterApiKey;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://copper-shipping.vercel.app",
      "X-Title": "Copper Shipping",
    },
    body: JSON.stringify({
      model: aiConfig.model.trim(),
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
