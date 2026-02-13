// AI Prompt/Response Logger
// Captures exact prompts sent to OpenAI and responses received.
// Outputs to server console and optionally writes to a local markdown file.
//
// Enable via env var:  AI_LOGGING=true  (defaults to ON in development)
// File output via:     AI_LOG_FILE=true (writes to ai-logs/ directory)

import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { AI_CONFIG } from "@/lib/ai/config";

// ===================================
// Types
// ===================================

interface AILogEntry {
  timestamp: string;
  endpoint: string;          // e.g. "chat", "follow-ups", "concept-extraction-enhanced"
  model: string;             // e.g. "gpt-4", "gpt-3.5-turbo"
  modelTier: "PRIMARY" | "FALLBACK"; // Which tier is this?
  streaming: boolean;
  messages: Array<{
    role: string;
    content: string;
  }>;
  params: {
    max_tokens?: number;
    temperature?: number;
    response_format?: string;
    [key: string]: unknown;
  };
  response?: string;         // The full response content
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  } | null;
  durationMs?: number;
  error?: string;
}

// ===================================
// Configuration
// ===================================

const isEnabled = () => {
  // Default ON in development, OFF in production unless explicitly set
  const env = process.env.AI_LOGGING;
  if (env === "false" || env === "0") return false;
  if (env === "true" || env === "1") return true;
  return process.env.NODE_ENV !== "production";
};

const isFileLoggingEnabled = () => {
  return process.env.AI_LOG_FILE === "true" || process.env.AI_LOG_FILE === "1";
};

// ===================================
// Console Formatting
// ===================================

const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  gray: "\x1b[90m",
  white: "\x1b[37m",
};

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + `... [${text.length - maxLen} more chars]`;
}

function logToConsole(entry: AILogEntry) {
  const tierColor = entry.modelTier === "PRIMARY" ? COLORS.magenta : COLORS.cyan;
  const tierLabel = entry.modelTier === "PRIMARY" ? "⚡ PRIMARY" : "💰 FALLBACK";

  console.log(
    `\n${COLORS.bright}${COLORS.blue}╔══════════════════════════════════════════════════════════════╗${COLORS.reset}`
  );
  console.log(
    `${COLORS.bright}${COLORS.blue}║${COLORS.reset} ${COLORS.bright}🤖 AI CALL: ${COLORS.yellow}${entry.endpoint}${COLORS.reset}` +
    `  ${tierColor}${tierLabel}${COLORS.reset}` +
    `  ${COLORS.dim}${entry.timestamp}${COLORS.reset}`
  );
  console.log(
    `${COLORS.bright}${COLORS.blue}╠══════════════════════════════════════════════════════════════╣${COLORS.reset}`
  );

  // Model & params
  console.log(
    `${COLORS.blue}║${COLORS.reset} Model: ${COLORS.bright}${entry.model}${COLORS.reset}` +
    `  │  Streaming: ${entry.streaming ? "✅" : "❌"}` +
    `  │  Temp: ${entry.params.temperature ?? "default"}` +
    `  │  Max tokens: ${entry.params.max_tokens ?? "default"}`
  );

  if (entry.params.response_format) {
    console.log(
      `${COLORS.blue}║${COLORS.reset} Response format: ${entry.params.response_format}`
    );
  }

  // Messages
  console.log(
    `${COLORS.blue}╠──────────────── MESSAGES ─────────────────────────────────────╣${COLORS.reset}`
  );
  for (const msg of entry.messages) {
    const roleColor = msg.role === "system" ? COLORS.magenta
      : msg.role === "user" ? COLORS.green
      : COLORS.cyan;
    const roleIcon = msg.role === "system" ? "🔧"
      : msg.role === "user" ? "👤"
      : "🤖";
    console.log(
      `${COLORS.blue}║${COLORS.reset} ${roleIcon} ${roleColor}${COLORS.bright}[${msg.role.toUpperCase()}]${COLORS.reset}`
    );
    // Print the message content with slight indentation, truncated for console
    const lines = truncate(msg.content, 2000).split("\n");
    for (const line of lines) {
      console.log(`${COLORS.blue}║${COLORS.reset}   ${COLORS.dim}${line}${COLORS.reset}`);
    }
  }

  // Response
  if (entry.response) {
    console.log(
      `${COLORS.blue}╠──────────────── RESPONSE ─────────────────────────────────────╣${COLORS.reset}`
    );
    const responseLines = truncate(entry.response, 3000).split("\n");
    for (const line of responseLines) {
      console.log(`${COLORS.blue}║${COLORS.reset}   ${COLORS.green}${line}${COLORS.reset}`);
    }
  }

  if (entry.error) {
    console.log(
      `${COLORS.blue}╠──────────────── ERROR ────────────────────────────────────────╣${COLORS.reset}`
    );
    console.log(`${COLORS.blue}║${COLORS.reset}   ${COLORS.red}${entry.error}${COLORS.reset}`);
  }

  // Footer with stats
  const stats: string[] = [];
  if (entry.usage) {
    stats.push(`Tokens: ${entry.usage.prompt_tokens || "?"}→${entry.usage.completion_tokens || "?"} (${entry.usage.total_tokens || "?"})`);
  }
  if (entry.durationMs !== undefined) {
    stats.push(`Duration: ${entry.durationMs}ms`);
  }

  console.log(
    `${COLORS.bright}${COLORS.blue}╠──────────────── STATS ────────────────────────────────────────╣${COLORS.reset}`
  );
  console.log(
    `${COLORS.blue}║${COLORS.reset} ${stats.join("  │  ") || "No usage data"}`
  );
  console.log(
    `${COLORS.bright}${COLORS.blue}╚══════════════════════════════════════════════════════════════╝${COLORS.reset}\n`
  );
}

// ===================================
// File Logging (Markdown)
// ===================================

async function logToFile(entry: AILogEntry) {
  if (!isFileLoggingEnabled()) return;

  try {
    const logDir = path.resolve(process.cwd(), "ai-logs");
    await mkdir(logDir, { recursive: true });

    // One file per day
    const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const logPath = path.join(logDir, `${date}.md`);

    const tierLabel = entry.modelTier === "PRIMARY" ? "⚡ PRIMARY" : "💰 FALLBACK";

    let md = `\n---\n\n`;
    md += `## ${entry.endpoint} — ${entry.model} (${tierLabel})\n`;
    md += `**Time:** ${entry.timestamp}  \n`;
    md += `**Streaming:** ${entry.streaming ? "Yes" : "No"}  \n`;
    md += `**Temperature:** ${entry.params.temperature ?? "default"}  \n`;
    md += `**Max tokens:** ${entry.params.max_tokens ?? "default"}  \n`;
    if (entry.params.response_format) {
      md += `**Response format:** ${entry.params.response_format}  \n`;
    }
    md += `\n`;

    // Messages
    for (const msg of entry.messages) {
      const roleIcon = msg.role === "system" ? "🔧" : msg.role === "user" ? "👤" : "🤖";
      md += `### ${roleIcon} ${msg.role.toUpperCase()}\n\n`;
      md += "```\n" + msg.content + "\n```\n\n";
    }

    // Response
    if (entry.response) {
      md += `### ✅ RESPONSE\n\n`;
      md += "```\n" + entry.response + "\n```\n\n";
    }

    if (entry.error) {
      md += `### ❌ ERROR\n\n`;
      md += "```\n" + entry.error + "\n```\n\n";
    }

    // Stats
    md += `**Stats:** `;
    const stats: string[] = [];
    if (entry.usage) {
      stats.push(`Tokens: ${entry.usage.prompt_tokens || "?"}→${entry.usage.completion_tokens || "?"} (total: ${entry.usage.total_tokens || "?"})`);
    }
    if (entry.durationMs !== undefined) {
      stats.push(`Duration: ${entry.durationMs}ms`);
    }
    md += stats.join(" | ") || "No usage data";
    md += "\n\n";

    await writeFile(logPath, md, { flag: "a" }); // Append
  } catch (err) {
    console.error("Failed to write AI log file:", err);
  }
}

// ===================================
// Public API
// ===================================

/**
 * Log an OpenAI API call (non-streaming).
 * Call this AFTER you have the response.
 */
export function logAICall(params: {
  endpoint: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  callParams?: {
    max_tokens?: number;
    temperature?: number;
    response_format?: { type: string };
    [key: string]: unknown;
  };
  response?: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null;
  durationMs?: number;
  error?: string;
}): void {
  if (!isEnabled()) return;

  const modelTier: "PRIMARY" | "FALLBACK" =
    params.model === AI_CONFIG.PRIMARY_MODEL ? "PRIMARY" : "FALLBACK";

  const entry: AILogEntry = {
    timestamp: new Date().toISOString(),
    endpoint: params.endpoint,
    model: params.model,
    modelTier,
    streaming: false,
    messages: params.messages,
    params: {
      max_tokens: params.callParams?.max_tokens,
      temperature: params.callParams?.temperature,
      response_format: params.callParams?.response_format?.type,
    },
    response: params.response,
    usage: params.usage,
    durationMs: params.durationMs,
    error: params.error,
  };

  logToConsole(entry);
  logToFile(entry).catch(() => {}); // fire-and-forget
}

/**
 * Log a streaming OpenAI API call.
 * Call this AFTER streaming is complete and you have the full response text.
 */
export function logAIStreamingCall(params: {
  endpoint: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  callParams?: {
    max_tokens?: number;
    temperature?: number;
    [key: string]: unknown;
  };
  fullResponse: string;
  estimatedTokens?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  durationMs?: number;
}): void {
  if (!isEnabled()) return;

  const modelTier: "PRIMARY" | "FALLBACK" =
    params.model === AI_CONFIG.PRIMARY_MODEL ? "PRIMARY" : "FALLBACK";

  const entry: AILogEntry = {
    timestamp: new Date().toISOString(),
    endpoint: params.endpoint,
    model: params.model,
    modelTier,
    streaming: true,
    messages: params.messages,
    params: {
      max_tokens: params.callParams?.max_tokens,
      temperature: params.callParams?.temperature,
    },
    response: params.fullResponse,
    usage: params.estimatedTokens || null,
    durationMs: params.durationMs,
  };

  logToConsole(entry);
  logToFile(entry).catch(() => {}); // fire-and-forget
}
