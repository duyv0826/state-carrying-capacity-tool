import type { Request, Response } from 'express';
import { createSubmission } from '../services/submissions.service.js';
import { parseSubmissionRequest } from '../validators/submissions.validator.js';
import { ok } from '../utils/response.js';
import { checkHoneypot } from './honeypot.js';

/**
 * POST /api/v1/submissions
 * 顺序：校验（400）-> 蜜罐（静默成功）-> 采集开关（由 collectionGate 拦截）-> 落库（201）。
 */
export function createSubmissionHandler(req: Request, res: Response): void {
  const body: unknown = req.body;
  const input = parseSubmissionRequest(body);
  checkHoneypot(body);
  ok(res, 201, createSubmission(input));
}
