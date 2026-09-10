import type { Request, Response } from 'express';
import { recordAbandon } from '../services/abandon.service.js';
import { parseAbandonRequest } from '../validators/abandon.validator.js';
import { ok } from '../utils/response.js';
import { checkHoneypot } from './honeypot.js';

/** POST /api/v1/abandon —— 记录中途放弃发生在第几题（AC-13）。 */
export function createAbandonHandler(req: Request, res: Response): void {
  const body: unknown = req.body;
  const input = parseAbandonRequest(body);
  checkHoneypot(body);
  recordAbandon(input);
  ok(res, 201, null);
}
