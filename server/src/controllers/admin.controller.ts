import type { Request, Response } from 'express';
import { SCHEMA_VERSION } from '../domain/questions.js';
import { buildCodebook } from '../domain/codebook.js';
import { renderExport } from '../services/export.service.js';
import { parseExportQuery } from '../validators/admin.validator.js';
import { ok } from '../utils/response.js';

/**
 * 管理员端点。响应体按 openapi 契约：
 * codebook 走统一信封；export 的 JSON 直接返回数组，便于 pandas / R 直接消费。
 */

export function exportHandler(req: Request, res: Response): void {
  const filter = parseExportQuery(req.query as unknown);
  const rendered = renderExport(filter);
  res.setHeader('Content-Type', rendered.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${rendered.filename}"`);
  res.status(200).send(rendered.body);
}

export function codebookHandler(_req: Request, res: Response): void {
  ok(res, 200, buildCodebook(SCHEMA_VERSION));
}
