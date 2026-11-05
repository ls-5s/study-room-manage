type LogFields = Readonly<Record<string, string | number | boolean>>;

export interface Logger {
  info: (event: string, fields?: LogFields) => void;
  error: (event: string, fields?: LogFields) => void;
}

export function createLogger(): Logger {
  function write(level: 'info' | 'error', event: string, fields: LogFields = {}) {
    const line = JSON.stringify({ time: new Date().toISOString(), level, event, ...fields });
    if (level === 'error') console.error(line);
    else console.log(line);
  }

  return {
    info: (event, fields) => write('info', event, fields),
    error: (event, fields) => write('error', event, fields),
  };
}
