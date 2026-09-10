import { Router } from 'express';
import { createAbandonHandler } from '../controllers/abandon.controller.js';
import { createFollowupHandler } from '../controllers/followups.controller.js';
import { collectionGate } from '../middlewares/collection-gate.middleware.js';
import { rateLimitMiddleware } from '../middlewares/rate-limit.middleware.js';

const router = Router();

router.post('/abandon', rateLimitMiddleware, collectionGate, createAbandonHandler);
router.post('/followups', rateLimitMiddleware, collectionGate, createFollowupHandler);

export default router;
