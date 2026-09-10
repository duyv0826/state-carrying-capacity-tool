/**
 * 结构化日志（JSON 行）。
 * 隐私约束：禁止在此记录 IP、UA 原文、联系方式等任何可识别字段（AC-10 / ADR-008）。
 */

type Level = 'info' | 'warn' | 'error';

export interface LogFields {
  [key: string]: unknown;
}

function write(level: Level, event: string, fields: LogFields = {}): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  });
  if (level === 'error') process.stderr.write(`${line}\n`);
  else process.stdout.write(`${line}\n`);
}

export const logger = {
  info(event: string, fields?: LogFields): void {
    write('info', event, fields);
  },
  warn(event: string, fields?: LogFields): void {
    write('warn', event, fields);
  },
  error(event: string, fields?: LogFields): void {
    write('error', event, fields);
  },
};
