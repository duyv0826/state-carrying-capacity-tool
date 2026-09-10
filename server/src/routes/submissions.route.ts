import { Router } from 'express';
import { createSubmissionHandler } from '../controllers/submissions.controller.js';
import { collectionGate } from '../middlewares/collection-gate.middleware.js';
import { rateLimitMiddleware } from '../middlewares/rate-limit.middleware.js';

const router = Router();

router.post('/submissions', rateLimitMiddleware, collectionGate, createSubmissionHandler);

export default router;
