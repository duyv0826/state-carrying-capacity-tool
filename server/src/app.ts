import express, { type Express } from 'express';
import adminRouter from './routes/admin.route.js';
import collectRouter from './routes/collect.route.js';
import configRouter from './routes/config.route.js';
import submissionsRouter from './routes/submissions.route.js';
import { corsMiddleware } from './middlewares/cors.middleware.js';
import { errorMiddleware, notFoundMiddleware } from './middlewares/error.middleware.js';
import { mountStatic } from './static.js';

/**
 * 应用装配：只挂中间件与路由，不含任何业务逻辑。
 * 路由前缀 /api/v1 从第一天就带上（ARCHITECTURE §7.2）。
 */
export function createApp(): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', false);

  app.use(express.json({ limit: '32kb' }));
  app.use(corsMiddleware);

  app.use('/api/v1', configRouter, submissionsRouter, collectRouter, adminRouter);

  mountStatic(app); // 静态资源 + /healthz + SPA history fallback（必须在 notFoundMiddleware 之前）

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
