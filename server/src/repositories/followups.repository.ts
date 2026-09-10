import { getDb } from './db.js';
import type { Band } from '../domain/bands.js';

/** 回访联系方式：物理分表，不含 session_id、不含任何答题内容（ADR-010）。 */

export interface FollowupInsert {
  id: string;
  followup_token: string;
  contact_encrypted: string;
  created_at: string;
  consent_version: string;
  band: Band | null;
  contact_purge_after: string | null;
}

/**
 * 写入回访记录。
 * 返回 false 表示 followup_token 已存在——前端离线队列重试会造成重复提交，
 * 此时按幂等处理（不报错、不覆盖），避免把一次合法重试变成 500。
 */
export function insertFollowup(row: FollowupInsert): boolean {
  try {
    getDb()
      .prepare(
        `INSERT INTO followups (id, followup_token, contact_encrypted, created_at, consent_version, band, contact_purge_after)
         VALUES (@id, @followup_token, @contact_encrypted, @created_at, @consent_version, @band, @contact_purge_after)`,
      )
      .run(row);
    return true;
  } catch (error) {
    const code = (error as { code?: unknown }).code;
    if (code === 'SQLITE_CONSTRAINT_UNIQUE' || code === 'SQLITE_CONSTRAINT_PRIMARYKEY') return false;
    throw error;
  }
}

export function countFollowups(): number {
  const row = getDb().prepare('SELECT COUNT(*) AS count FROM followups').get() as { count: number };
  return row.count;
}
