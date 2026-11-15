export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogFields = Readonly<Record<string, string | number | boolean>>;

const LEVEL_WEIGHT: Readonly<Record<LogLevel, number>> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface Logger {
  debug: (event: string, fields?: LogFields) => void;
  info: (event: string, fields?: LogFields) => void;
  warn: (event: string, fields?: LogFields) => void;
  error: (event: string, fields?: LogFields) => void;
}

export interface LoggerOptions {
  level?: LogLevel;
  sink?: (level: LogLevel, line: string) => void;
  now?: () => Date;
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const minimum = LEVEL_WEIGHT[options.level ?? 'info'];
  const now = options.now ?? (() => new Date());
  const sink =
    options.sink ??
    ((level: LogLevel, line: string) => {
      if (level === 'error' || level === 'warn') console.error(line);
      else console.log(line);
    });

  function write(level: LogLevel, event: string, fields: LogFields = {}) {
    if (LEVEL_WEIGHT[level] < minimum) return;
    const line = JSON.stringify({
      time: now().toISOString(),
      level,
      event,
      ...fields,
    });
    sink(level, line);
  }

  return {
    debug: (event, fields) => write('debug', event, fields),
    info: (event, fields) => write('info', event, fields),
    warn: (event, fields) => write('warn', event, fields),
    error: (event, fields) => write('error', event, fields),
  };
}

export function isLogLevel(value: string): value is LogLevel {
  return value === 'debug' || value === 'info' || value === 'warn' || value === 'error';
}
