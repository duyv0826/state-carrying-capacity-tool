import { Router } from 'express';
import { codebookHandler, exportHandler } from '../controllers/admin.controller.js';
import { requireAdminToken } from '../middlewares/admin-auth.middleware.js';

const router = Router();

router.get('/admin/export', requireAdminToken, exportHandler);
router.get('/admin/codebook', requireAdminToken, codebookHandler);

export default router;
