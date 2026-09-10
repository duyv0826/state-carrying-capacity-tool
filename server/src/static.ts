import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';

/**
 * 部署接线层：让单进程 Node 服务同时托管静态前端 + SPA history fallback。
 *
 * 调用方（app.ts）必须在本函数之前注册 /api/v1 路由，
 * 确保任何 /api/* 请求永远先被 API 路由/404 中间件处理，不被静态层拦截。
 *
 * 解析优先级：
 *   1. 环境变量 CLIENT_DIST（Docker / 自定义路径）
 *   2. 默认回退 .../client/dist（相对 server/dist 或 server/src 都是上两级）
 */
export function mountStatic(app: Express): void {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const clientDist = process.env.CLIENT_DIST
    ? path.resolve(process.env.CLIENT_DIST)
    : path.resolve(here, '../../client/dist');
  const indexHtml = path.join(clientDist, 'index.html');

  // 静态资源（JS/CSS/图片/字体等）；目录不存在时静默放过，不影响 API。
  app.use(express.static(clientDist));

  // 健康检查：独立于 /api 版本号，便于 LB / 容器探针与本地冒烟。
  app.get('/healthz', (_req: Request, res: Response) => {
    res.status(200).json({ ok: true });
  });

  // SPA history fallback：所有非 /api 的 GET 都回退到 index.html。
  // 以 /api 开头（含任何子路径）的请求放行给后续 notFoundMiddleware，保持 API 404 契约。
  app.get('/{*splat}', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(indexHtml, (err) => {
      if (err) next(err);
    });
  });
}
