import type { AbandonInput } from '../types/index.js';
import { asInt, asNullable, asObject, asString, asUuid } from './common.js';

/** POST /api/v1/abandon 请求体校验（openapi：session_id / schema_version / last_question_index 必填）。 */
export function parseAbandonRequest(body: unknown): AbandonInput {
  const raw = asObject(body, 'body');
  return {
    sessionId: asUuid(raw.session_id, 'session_id'),
    schemaVersion: asInt(raw.schema_version, 'schema_version', { min: 1, max: 99 }),
    softwareName: asNullable<string>(raw.software_name, 'software_name', (inner, path) =>
      asString(inner, path, { min: 1, max: 60 }),
    ),
    lastQuestionIndex: asInt(raw.last_question_index, 'last_question_index', { min: 0, max: 30 }),
    durationMs: asNullable<number>(raw.duration_ms, 'duration_ms', (inner, path) =>
      asInt(inner, path, { min: 0, max: 86_400_000 }),
    ),
  };
}
