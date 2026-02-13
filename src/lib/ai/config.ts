// OpenAI service configuration and helpers

import OpenAI from "openai";

// Lazy-initialized OpenAI client (avoids throwing during next build when env
// vars aren't available)
let _openai: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return _openai;
}

/** @deprecated Use getOpenAI() instead – kept for backward compatibility */
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getOpenAI() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// Configuration
export const AI_CONFIG = {
  PRIMARY_MODEL: process.env.OPENAI_MODEL_PRIMARY || "gpt-4",
  FALLBACK_MODEL: process.env.OPENAI_MODEL_FALLBACK || "gpt-3.5-turbo",
  MAX_TOKENS: parseInt(process.env.OPENAI_MAX_TOKENS || "2000"),
  TEMPERATURE: parseFloat(process.env.OPENAI_TEMPERATURE || "0.7"),
} as const;

// Utility: Test OpenAI connection
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    const response = await getOpenAI().chat.completions.create({
      model: AI_CONFIG.FALLBACK_MODEL,
      messages: [{ role: "user", content: "Hi" }],
      max_tokens: 10,
    });
    return !!response.choices[0]?.message;
  } catch (error) {
    console.error("OpenAI connection test failed:", error);
    return false;
  }
}
