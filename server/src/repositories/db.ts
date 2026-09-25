import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import Database from 'better-sqlite3';
import { loadConfig } from '../config/env.js';
import { MIGRATIONS, ensureRecordIdColumn } from './migrations.js';

type Db = Database.Database;

let instance: Db | null = null;

/**
 * SQLite 单文件连接（ADR-002）。WAL 模式，数据量小、零运维、备份即 cp。
 * 迁移在打开时执行一次，保证任何环境首次启动即可用。
 */
export function getDb(): Db {
  if (instance) return instance;
  const config = loadConfig();
  const file = resolve(process.cwd(), config.dbPath);
  mkdirSync(dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  for (const statement of MIGRATIONS) {
    db.exec(statement);
  }
  ensureRecordIdColumn(db);
  instance = db;
  return instance;
}

export function closeDb(): void {
  if (instance) {
    instance.close();
    instance = null;
  }
}
