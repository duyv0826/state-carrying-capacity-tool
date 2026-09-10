import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors.js';
import { fail, silent } from '../utils/response.js';
import { logger } from '../utils/logger.js';

/**
 * 全局异常捕获（第三层错误处理）：
 * 记录完整错误到日志，向客户端只回错误码与不含技术细节的提示。
 */
export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (res.headersSent) return;

  if (err instanceof AppError) {
    if (err.silentSuccess) {
      silent(res, err.status, err.code);
      return;
    }
    if (err.status >= 500) logger.error('request.failed', { path: req.path, code: err.code });
    else logger.warn('request.rejected', { path: req.path, code: err.code });
    fail(res, err.status, err.code, err.message);
    return;
  }

  // express.json 抛出的实体解析错误属于客户端错误，不按 500 处理
  const bodyError = err as { type?: string; status?: number };
  if (bodyError?.type === 'entity.parse.failed') {
    logger.warn('request.bad_json', { path: req.path });
    fail(res, 400, 1001, '请求体不是合法 JSON');
    return;
  }
  if (bodyError?.type === 'entity.too.large') {
    logger.warn('request.payload_too_large', { path: req.path });
    fail(res, 413, 1001, '请求体过大');
    return;
  }

  logger.error('request.unhandled', { path: req.path, error: err instanceof Error ? err.message : String(err) });
  fail(res, 500, 5001, '服务端内部错误');
}

export function notFoundMiddleware(req: Request, res: Response): void {
  fail(res, 404, 1001, `未知端点: ${req.method} ${req.path}`);
}
