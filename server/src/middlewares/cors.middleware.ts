import type { NextFunction, Request, Response } from 'express';
import { loadConfig } from '../config/env.js';

/**
 * 前后端分离部署的跨域配置。
 * 生产环境禁止 origin 通配（*）：只允许 CORS_ORIGINS 环境变量列出的前端域名。
 */

const ALLOWED_METHODS = 'GET, POST, OPTIONS';
const ALLOWED_HEADERS = 'Content-Type, X-Admin-Token';
const MAX_AGE_SECONDS = '86400';

export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.header('origin');
  const allowed = loadConfig().corsOrigins;
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS);
    res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
    res.setHeader('Access-Control-Max-Age', MAX_AGE_SECONDS);
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
}
