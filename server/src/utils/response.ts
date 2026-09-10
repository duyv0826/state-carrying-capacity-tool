import type { Response } from 'express';

/**
 * 统一响应格式（ARCHITECTURE §7.1）：{ code, data, message }。
 * code = 0 成功；非 0 见 utils/errors.ts 的错误码表。
 * message 面向人类但不暴露技术栈细节；采集类错误对前端一律静默处理。
 */

export interface ApiEnvelope<T> {
  code: number;
  data: T | null;
  message: string;
}

export function ok<T>(res: Response, status: number, data: T | null = null): void {
  const body: ApiEnvelope<T> = { code: 0, data, message: '' };
  res.status(status).json(body);
}

/** 静默成功：HTTP 2xx 但 code 非 0，表示客户端无需重试也无需提示用户。 */
export function silent<T>(res: Response, status: number, code: number, data: T | null = null): void {
  const body: ApiEnvelope<T> = { code, data, message: '' };
  res.status(status).json(body);
}

export function fail(res: Response, status: number, code: number, message: string): void {
  const body: ApiEnvelope<null> = { code, data: null, message };
  res.status(status).json(body);
}
