type LogLevel = "info" | "warn" | "error" | "debug";

function log(level: LogLevel, component: string, message: string, data?: unknown) {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}] [${component}]`;
  if (data) {
    console[level === "error" ? "error" : "log"](`${prefix} ${message}`, data);
  } else {
    console[level === "error" ? "error" : "log"](`${prefix} ${message}`);
  }
}

export const logger = {
  info: (component: string, message: string, data?: unknown) =>
    log("info", component, message, data),
  warn: (component: string, message: string, data?: unknown) =>
    log("warn", component, message, data),
  error: (component: string, message: string, data?: unknown) =>
    log("error", component, message, data),
  debug: (component: string, message: string, data?: unknown) => {
    if (process.env.DEBUG) log("debug", component, message, data);
  },
};
