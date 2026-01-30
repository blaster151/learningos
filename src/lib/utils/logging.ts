type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  userId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

function log(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, message, ...context };

  if (process.env.NODE_ENV === "development") {
    // Pretty print in dev
    console[level](JSON.stringify(logEntry, null, 2));
  } else {
    // Production: could send to Sentry, LogRocket, etc.
    console[level](JSON.stringify(logEntry));
  }
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => log("debug", msg, ctx),
  info: (msg: string, ctx?: LogContext) => log("info", msg, ctx),
  warn: (msg: string, ctx?: LogContext) => log("warn", msg, ctx),
  error: (msg: string, ctx?: LogContext) => log("error", msg, ctx),
};
