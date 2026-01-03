type LogLevel = "log" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
}

const buffer: LogEntry[] = [];
const MAX_ENTRIES = 200;
const MAX_ENTRY_LENGTH = 800;
let enabled = false;

const serialize = (args: unknown[]): string => {
  try {
    const str = args
      .map(arg => {
        if (typeof arg === "string") return arg;
        if (arg instanceof Error)
          return `${arg.name}: ${arg.message}\n${arg.stack}`;
        return JSON.stringify(arg, null, 2);
      })
      .join(" ");
    return str.length > MAX_ENTRY_LENGTH
      ? `${str.slice(0, MAX_ENTRY_LENGTH)}…`
      : str;
  } catch {
    return "[unserializable log]";
  }
};

const pushLog = (level: LogLevel, args: unknown[]) => {
  const entry: LogEntry = {
    level,
    message: serialize(args),
    timestamp: Date.now(),
  };
  buffer.push(entry);
  if (buffer.length > MAX_ENTRIES) {
    buffer.splice(0, buffer.length - MAX_ENTRIES);
  }
};

export const enableConsoleBuffer = () => {
  if (enabled) return;
  enabled = true;
  ("log info warn error".split(" ") as LogLevel[]).forEach(level => {
    const original = console[level];
    console[level] = (...args: unknown[]) => {
      try {
        pushLog(level, args);
      } catch {
        // ignore buffer errors
      }
      original.apply(console, args as []);
    };
  });
};

export const getConsoleBuffer = (): LogEntry[] => buffer.slice();
