import type { Request, Response } from 'express';
import { registerFollowup } from '../services/followups.service.js';
import { parseFollowupRequest } from '../validators/followups.validator.js';
import { ok } from '../utils/response.js';

/** POST /api/v1/followups —— 回访联系方式入物理分表（openapi 未定义 hp，故不做蜜罐判定）。 */
export function createFollowupHandler(req: Request, res: Response): void {
  const input = parseFollowupRequest(req.body as unknown);
  registerFollowup(input);
  ok(res, 201, null);
}
