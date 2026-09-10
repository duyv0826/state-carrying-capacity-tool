import type { NextFunction, Request, Response } from 'express';
import { rateLimitedError } from '../utils/errors.js';
import { ipMemoryKey } from '../utils/crypto.js';
import { MemoryRateLimiter } from '../utils/rate-limit.js';
import { logger } from '../utils/logger.js';

/**
 * 分层限流（ARCHITECTURE §3.8）：
 * 网络层 单 IP 10 次/分钟 + 60 次/小时；会话层 单 session 25 条/天；全局 2000 条/天。
 * IP 只在此处作为内存哈希键存在，不落库、不写日志（ADR-008）。
 */

const IP_RULES = [
  { limit: 10, windowMs: 60_000 },
  { limit: 60, windowMs: 3_600_000 },
] as const;
const SESSION_RULE = { limit: 25, windowMs: 86_400_000 } as const;
const GLOBAL_RULE = { limit: 2000, windowMs: 86_400_000 } as const;

const limiter = new MemoryRateLimiter();

function sessionKeyOf(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null;
  const sessionId = (body as { session_id?: unknown }).session_id;
  return typeof sessionId === 'string' && sessionId !== '' ? sessionId : null;
}

export function rateLimitMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const ipKey = ipMemoryKey(req.ip ?? 'unknown');
  if (!limiter.tryConsumeAll(ipKey, IP_RULES)) {
    logger.warn('rate_limit.ip', { key: ipKey });
    next(rateLimitedError());
    return;
  }
  if (!limiter.tryConsume('global', GLOBAL_RULE)) {
    logger.warn('rate_limit.global');
    next(rateLimitedError());
    return;
  }
  const sessionKey = sessionKeyOf(req.body);
  if (sessionKey !== null && !limiter.tryConsume(sessionKey, SESSION_RULE)) {
    logger.warn('rate_limit.session');
    next(rateLimitedError());
    return;
  }
  next();
}
