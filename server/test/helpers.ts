import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import type { AddressInfo, Server } from 'node:net';
import type { Express } from 'express';
import { createApp } from '../src/app.js';
import { resetConfig } from '../src/config/env.js';
import { closeDb, getDb } from '../src/repositories/db.js';

/** 每个测试文件独立进程（node --test 默认行为），因此可安全改写环境变量与临时库路径。 */
export function setupTestEnv(overrides: Record<string, string> = {}): void {
  const dir = mkdtempSync(join(tmpdir(), 'scc-test-'));
  process.env.DB_PATH = join(dir, 'test.db');
  process.env.COLLECTION_ENABLED = 'true';
  process.env.ADMIN_TOKEN = 'test-admin-token';
  process.env.CONTACT_ENCRYPTION_KEY = 'test-contact-key';
  process.env.CONSENT_VERSION = 'v1.0-2026-09';
  process.env.CONSENT_MODE = 'implied';
  process.env.CORS_ORIGINS = 'http://localhost:5173';
  process.env.RAPID_FLAG_THRESHOLD_MS = '12000';
  for (const [key, value] of Object.entries(overrides)) process.env[key] = value;
  closeDb();
  resetConfig();
  getDb();
}

export async function withServer(fn: (base: string) => Promise<void>): Promise<void> {
  const app: Express = createApp();
  const server: Server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address() as AddressInfo;
  const base = `http://127.0.0.1:${address.port}`;
  try {
    await fn(base);
  } finally {
    server.close();
    closeDb();
  }
}

export interface JsonResponse<T> {
  status: number;
  body: T;
}

export async function postJson<T = Record<string, unknown>>(
  base: string,
  path: string,
  payload: unknown,
): Promise<JsonResponse<T>> {
  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = (await response.json()) as T;
  return { status: response.status, body };
}

export async function getJson<T = Record<string, unknown>>(
  base: string,
  path: string,
  headers: Record<string, string> = {},
): Promise<JsonResponse<T>> {
  const response = await fetch(`${base}${path}`, { headers });
  const body = (await response.json()) as T;
  return { status: response.status, body };
}

export async function getText(
  base: string,
  path: string,
  headers: Record<string, string> = {},
): Promise<JsonResponse<string>> {
  const response = await fetch(`${base}${path}`, { headers });
  const body = await response.text();
  return { status: response.status, body };
}

/**
 * 合法提交样例：总分 33（A=12 / B=9 / C=12），先验切点下为 safe 档。
 * 反向题 A2 / B1 / B3 的反转效果见 scoring.test.ts。
 */
export function sampleSubmission(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    session_id: '8f14e45f-ceea-467a-9542-5b1c0a5f7d21',
    schema_version: 2,
    software_name: 'Figma',
    software_category: 'design',
    is_custom_input: false,
    answers: { A1: 4, A2: 3, A3: 5, B1: 2, B2: 3, B3: 4, C1: 5, C2: 4, C3: 3 },
    strata: { S1: 'C', S2: '2y_5y', S3: 'daily', S4: 'self' },
    region_bucket: null,
    duration_ms: 38200,
    sequence_index: 1,
    device_type: 'desktop',
    ua_family: null,
    source: null,
    client_submitted_at: '2026-09-09T12:31:05+08:00',
    consent_version: 'v1.0-2026-09',
    consent_mode: 'implied',
    feedback_text: null,
    followup_token: null,
    hp: '',
  };
  return { ...base, ...overrides };
}

/** 注意：fetch 的 text() 会按规范剥离 UTF-8 BOM，验证 BOM 必须读原始字节。 */
export async function getBuffer(
  base: string,
  path: string,
  headers: Record<string, string> = {},
): Promise<{ status: number; buffer: Buffer }> {
  const response = await fetch(`${base}${path}`, { headers });
  const buffer = Buffer.from(await response.arrayBuffer());
  return { status: response.status, buffer };
}

export function sampleAbandon(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    session_id: '8f14e45f-ceea-467a-9542-5b1c0a5f7d21',
    schema_version: 2,
    software_name: 'Figma',
    last_question_index: 4,
    duration_ms: 9000,
    hp: '',
    ...overrides,
  };
}

export function sampleFollowup(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    followup_token: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
    contact: 'someone@example.com',
    band: 'safe',
    consent_version: 'v1.0-2026-09',
    ...overrides,
  };
}
