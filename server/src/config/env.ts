import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * 极简 .env 加载器（不引入 dotenv 依赖）。
 * 仅在当前工作环境缺少同名变量时写入 process.env，绝不覆盖真实环境变量。
 */
function loadDotEnvFile(path: string): void {
  let raw: string;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    return;
  }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  return fallback;
}

function parseIntEnv(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export interface AppConfig {
  port: number;
  dbPath: string;
  /** AC-09 采集总开关：false 时三个采集端点零落库（默认 false） */
  collectionEnabled: boolean;
  adminToken: string;
  consentVersion: string;
  consentMode: 'implied' | 'explicit';
  contactEncryptionKey: string;
  corsOrigins: string[];
  rapidFlagThresholdMs: number;
  nodeEnv: string;
}

let cached: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (cached) return cached;
  loadDotEnvFile(resolve(process.cwd(), '.env'));
  const cors = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');
  cached = {
    port: parseIntEnv(process.env.PORT, 3000),
    dbPath: process.env.DB_PATH ?? './data/scc.db',
    collectionEnabled: parseBoolean(process.env.COLLECTION_ENABLED, false),
    adminToken: process.env.ADMIN_TOKEN ?? '',
    consentVersion: process.env.CONSENT_VERSION ?? 'v1.0-2026-09',
    consentMode: process.env.CONSENT_MODE === 'explicit' ? 'explicit' : 'implied',
    contactEncryptionKey: process.env.CONTACT_ENCRYPTION_KEY ?? '',
    corsOrigins: cors,
    rapidFlagThresholdMs: parseIntEnv(process.env.RAPID_FLAG_THRESHOLD_MS, 12000),
    nodeEnv: process.env.NODE_ENV ?? 'development',
  };
  return cached;
}

/** 仅供测试使用：清空配置缓存后重新读取环境变量。 */
export function resetConfig(): void {
  cached = null;
}
