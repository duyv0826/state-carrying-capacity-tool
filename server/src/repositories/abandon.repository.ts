import { getDb } from './db.js';

/** 中途放弃埋点（AC-13 / ARCHITECTURE §3.5）。同样受 collection_enabled 管控。 */

export interface AbandonInsert {
  id: string;
  session_id: string;
  schema_version: number;
  software_name: string | null;
  last_question_index: number;
  duration_ms: number | null;
  created_at: string;
}

export function insertAbandon(row: AbandonInsert): void {
  getDb()
    .prepare(
      `INSERT INTO abandon_events (id, session_id, schema_version, software_name, last_question_index, duration_ms, created_at)
       VALUES (@id, @session_id, @schema_version, @software_name, @last_question_index, @duration_ms, @created_at)`,
    )
    .run(row);
}

export function countAbandonEvents(): number {
  const row = getDb().prepare('SELECT COUNT(*) AS count FROM abandon_events').get() as {
    count: number;
  };
  return row.count;
}
