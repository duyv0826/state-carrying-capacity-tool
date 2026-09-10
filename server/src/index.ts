import { createApp } from './app.js';
import { loadConfig } from './config/env.js';
import { closeDb, getDb } from './repositories/db.js';
import { logger } from './utils/logger.js';

/** 进程入口：只做装配与生命周期管理，不含业务逻辑。 */

const config = loadConfig();
const app = createApp();

getDb();

const server = app.listen(config.port, () => {
  logger.info('server.started', {
    port: config.port,
    collection_enabled: config.collectionEnabled,
    node: process.version,
  });
});

function shutdown(signal: string): void {
  logger.info('server.stopping', { signal });
  server.close(() => {
    closeDb();
    logger.info('server.stopped');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
