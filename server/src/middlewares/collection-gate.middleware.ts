import type { NextFunction, Request, Response } from 'express';
import { loadConfig } from '../config/env.js';
import { collectionDisabledError } from '../utils/errors.js';

/**
 * AC-09 采集开关闸门：collection_enabled = false 时三个采集端点一律不落库，
 * 但仍返回成功状态码（HTTP 200 + code 3001），工具的可用性与本服务无关。
 */
export function collectionGate(_req: Request, _res: Response, next: NextFunction): void {
  if (!loadConfig().collectionEnabled) {
    next(collectionDisabledError());
    return;
  }
  next();
}
