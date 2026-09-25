import { Router } from 'express';
import { createSubmissionHandler, getSubmissionHandler } from '../controllers/submissions.controller.js';
import { collectionGate } from '../middlewares/collection-gate.middleware.js';
import { rateLimitMiddleware } from '../middlewares/rate-limit.middleware.js';

const router = Router();

router.post('/submissions', rateLimitMiddleware, collectionGate, createSubmissionHandler);
router.get('/submissions/:recordId', rateLimitMiddleware, collectionGate, getSubmissionHandler);

export default router;
