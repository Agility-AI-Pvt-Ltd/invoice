/**
 * Structured logger for standardized JSON logging.
 * Enables better searchability and monitoring in production.
 */

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
  meta?: Record<string, unknown>;
  requestId?: string;
}

export const logger = {
  info: (context: string, message: string, meta?: Record<string, unknown>) => {
    log('INFO', context, message, undefined, meta);
  },
  warn: (context: string, message: string, error?: unknown, meta?: Record<string, unknown>) => {
    log('WARN', context, message, error, meta);
  },
  error: (context: string, message: string, error?: unknown, meta?: Record<string, unknown>) => {
    log('ERROR', context, message, error, meta);
  },
  debug: (context: string, message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      log('DEBUG', context, message, undefined, meta);
    }
  },
};

function log(
  level: LogLevel,
  context: string,
  message: string,
  error?: unknown,
  meta?: Record<string, unknown>
) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    context,
    message,
    meta,
  };

  if (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    entry.error = {
      message: err.message,
      name: err.name,
      stack: err.stack,
    };
  }

  // In production, we log JSON for parsing by monitoring tools
  // In development, we use a more readable format
  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify(entry));
  } else {
    const color = level === 'ERROR' ? '\x1b[31m' : level === 'WARN' ? '\x1b[33m' : '\x1b[36m';
    const reset = '\x1b[0m';
    console.log(
      `${color}[${level}]${reset} [${context}] ${message}`,
      error ? error : '',
      meta ? JSON.stringify(meta) : ''
    );
  }
}
