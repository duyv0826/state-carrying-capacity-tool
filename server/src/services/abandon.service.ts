import { insertAbandon } from '../repositories/abandon.repository.js';
import type { AbandonInput } from '../types/index.js';
import { newId, sanitizeSoftwareName } from '../utils/sanitize.js';
import { logger } from '../utils/logger.js';

/** 中途放弃埋点（AC-13）。只记到第几题退出，不记任何身份信息。 */

export function recordAbandon(input: AbandonInput): void {
  const softwareName = input.softwareName === null ? null : sanitizeSoftwareName(input.softwareName).value;
  insertAbandon({
    id: newId(),
    session_id: input.sessionId,
    schema_version: input.schemaVersion,
    software_name: softwareName !== null && softwareName !== '' ? softwareName : null,
    last_question_index: input.lastQuestionIndex,
    duration_ms: input.durationMs,
    created_at: new Date().toISOString(),
  });
  logger.info('abandon.recorded', { last_question_index: input.lastQuestionIndex });
}
