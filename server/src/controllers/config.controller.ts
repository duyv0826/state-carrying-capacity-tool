import type { Request, Response } from 'express';
import { getRuntimeConfig } from '../services/config.service.js';
import { ok } from '../utils/response.js';

/** GET /api/v1/config —— 无鉴权，前端启动时拉取。 */
export function getConfig(_req: Request, res: Response): void {
  ok(res, 200, getRuntimeConfig());
}
