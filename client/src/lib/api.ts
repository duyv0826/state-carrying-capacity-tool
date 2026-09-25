/**
 * 三处网络出口（UIUX §4.0）：
 *   GET  /api/v1/config       —— 启动即拉，失败不阻塞流程
 *   POST /api/v1/submissions  —— 仅在 S3（S4 选填）之后发一次
 *   POST /api/v1/abandon      —— 用户离开作答流程时 best-effort 上报（AC-13）
 * 传输最小化（AC-09）：前端在 config.collection_enabled === false 时，submissions 与 abandon
 * 根本不发任何请求；enabled 或 config 未知时才发，服务端 3001 仅为兜底、绝不入库。
 */

import type { ConfigPayload, Envelope, SubmissionLookup, SubmissionRequest, SubmissionResult } from '../types/api';

const BASE = '/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: number,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** 采集已关闭（openapi 200 + code=3001）。不是异常，是正常分支。 */
export const COLLECTION_DISABLED_CODE = 3001;

async function readEnvelope<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!body || typeof body !== 'object') {
    throw new ApiError('响应格式无法解析', -1, res.status);
  }
  if (body.code !== 0) {
    throw new ApiError(body.message || `请求失败（code=${body.code}）`, body.code, res.status);
  }
  return body.data;
}

export async function fetchConfig(signal?: AbortSignal): Promise<ConfigPayload> {
  const res = await fetch(`${BASE}/config`, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new ApiError('配置拉取失败', -1, res.status);
  return readEnvelope<ConfigPayload>(res);
}

export interface SubmitOutcome {
  submitted: boolean;
  result: SubmissionResult | null;
  /** 采集关闭 / 蜜罐命中：工具照常出结果，只是不入库。 */
  reason?: 'collection_disabled';
}

export async function postSubmission(body: SubmissionRequest): Promise<SubmitOutcome> {
  const res = await fetch(`${BASE}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError('提交失败', -1, res.status);
  const data = await readEnvelope<SubmissionResult | null>(res).catch((err: unknown) => {
    if (err instanceof ApiError && err.code === COLLECTION_DISABLED_CODE) return null;
    throw err;
  });
  if (data === null) return { submitted: false, result: null, reason: 'collection_disabled' };
  return { submitted: true, result: data };
}

/**
 * 结果找回：凭 record_id 从服务端取回结果视图。
 * 采集关闭（HTTP 200 + code 3001，data=null）或令牌无效（HTTP 404，data=null）均返回 null，
 * 由调用方决定展示空态，不抛异常。
 */
export async function fetchSubmission(recordId: string): Promise<SubmissionLookup | null> {
  if (!recordId) return null;
  try {
    const res = await fetch(`${BASE}/submissions/${encodeURIComponent(recordId)}`);
    if (!res.ok) return null;
    const body = (await res.json()) as Envelope<SubmissionLookup | null>;
    if (body.code !== 0 || !body.data) return null;
    return body.data;
  } catch {
    return null;
  }
}

export interface AbandonRequest {
  session_id: string;
  schema_version: number;
  software_name: string | null;
  last_question_index: number;
  duration_ms: number | null;
  /** 蜜罐：必须为空字符串（AC-08）。 */
  hp: string;
}

/**
 * 中途放弃埋点（AC-13）。best-effort、fire-and-forget：
 * 优先 navigator.sendBeacon（不阻塞卸载），不可用时降级 fetch keepalive。
 * 不读取响应、不抛错影响体验；collection 关闭时调用方不应调用本函数（同 AC-09 口径）。
 */
export function postAbandon(body: AbandonRequest): void {
  const url = `${BASE}/abandon`;
  const payload = JSON.stringify(body);
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' });
      if (navigator.sendBeacon(url, blob)) return;
    }
  } catch {
    /* sendBeacon 失败不影响体验 */
  }
  try {
    if (typeof fetch === 'function') {
      void fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* 忽略：放弃埋点不计成败 */
  }
}

/** 客户端粗判，服务端从不读取 UA（openapi device_type 描述）。 */
export function detectDeviceType(): 'mobile' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  return window.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop';
}

export function detectUaFamily(): 'wechat' | 'safari_mobile' | 'other' {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/MicroMessenger/i.test(ua)) return 'wechat';
  if (/iPhone|iPad|iPod/i.test(ua) && /Safari/i.test(ua)) return 'safari_mobile';
  return 'other';
}

export function newSessionId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  // 无 crypto.randomUUID 的旧 WebView：退化为 32 hex，仍是 UUIDv4 形态
  const bytes = new Uint8Array(16);
  if (c && typeof c.getRandomValues === 'function') c.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
