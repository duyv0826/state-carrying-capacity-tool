import type { Request, Response } from 'express';
import { createSubmission, getSubmissionByRecordId } from '../services/submissions.service.js';
import { parseSubmissionRequest } from '../validators/submissions.validator.js';
import { ok, fail } from '../utils/response.js';
import { checkHoneypot } from './honeypot.js';
import { ERROR_CODES, recordNotFoundError } from '../utils/errors.js';

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

/**
 * GET /api/v1/submissions/:recordId
 * 结果找回：凭客户端持有的 record_id 取回结果视图。
 * 采集开关（collectionGate）关闭时直接返回 3001，不落库也无记录可取；
 * 令牌不存在/已排除时返回 404（RECORD_NOT_FOUND）。
 */
export function getSubmissionHandler(req: Request, res: Response): void {
  const recordId = typeof req.params.recordId === 'string' ? req.params.recordId : '';
  if (recordId.length === 0) {
    fail(res, 400, ERROR_CODES.VALIDATION_FAILED, '缺少 record_id');
    return;
  }
  const view = getSubmissionByRecordId(recordId);
  if (!view) {
    const err = recordNotFoundError();
    fail(res, err.status, err.code, err.message);
    return;
  }
  ok(res, 200, view);
}
