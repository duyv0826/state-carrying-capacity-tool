import type { NextFunction, Request, Response } from 'express';
import { loadConfig } from '../config/env.js';
import { adminTokenError } from '../utils/errors.js';
import { safeEqual } from '../utils/crypto.js';
import { logger } from '../utils/logger.js';

/**
 * 管理员端点鉴权（openapi securitySchemes.AdminToken：X-Admin-Token 请求头）。
 * 未配置 ADMIN_TOKEN 时一律拒绝，避免"空令牌等于放行"的默认不安全状态。
 */
export function requireAdminToken(req: Request, _res: Response, next: NextFunction): void {
  const expected = loadConfig().adminToken;
  const provided = req.header('x-admin-token') ?? '';
  if (expected === '' || provided === '' || !safeEqual(provided, expected)) {
    logger.warn('admin.auth_failed', { path: req.path });
    next(adminTokenError());
    return;
  }
  next();
}
