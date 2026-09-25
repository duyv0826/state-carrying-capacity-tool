import { getDb } from './db.js';
import { QUESTIONS } from '../domain/questions.js';
import type { ExportFilter, SubmissionLookupView, SubmissionRow } from '../types/index.js';

/** 落库列清单：由题单派生，任何可识别字段（IP / UA 原文）都不在列内（AC-10）。 */
export const SUBMISSION_COLUMNS: readonly string[] = [
  'id',
  'record_id',
  'session_id',
  'created_at',
  'client_submitted_at',
  'schema_version',
  'max_score',
  'consent_version',
  'consent_mode',
  'software_name',
  'software_name_norm',
  'software_category',
  'is_custom_input',
  ...QUESTIONS.flatMap((q) => {
    const key = q.key.toLowerCase();
    return [`q_${key}_raw`, `q_${key}_scored`];
  }),
  'factor_a_score',
  'factor_b_score',
  'factor_c_score',
  'total_score',
  'band',
  'band_basis',
  'n_at_scoring',
  's1_learning_type',
  's2_tenure_bucket',
  's3_frequency_bucket',
  's4_adoption_type',
  'duration_ms',
  'device_type',
  'ua_family',
  'source',
  'region_bucket',
  'sequence_index',
  'straightlining_flag',
  'rapid_flag',
  'quality_flags',
  'feedback_text',
  'followup_token',
  'excluded',
];

export type SubmissionInsert = Record<string, string | number | null>;

const INSERT_SQL = `INSERT INTO submissions (${SUBMISSION_COLUMNS.join(', ')}) VALUES (${SUBMISSION_COLUMNS.map(
  (column) => `@${column}`,
).join(', ')})`;

export function insertSubmission(row: SubmissionInsert): void {
  const params: SubmissionInsert = {};
  for (const column of SUBMISSION_COLUMNS) {
    params[column] = row[column] ?? null;
  }
  getDb().prepare(INSERT_SQL).run(params);
}

export function countSubmissions(options: {
  schemaVersion?: number;
  includeExcluded?: boolean;
} = {}): number {
  const conditions: string[] = [];
  const params: Record<string, number> = {};
  if (options.schemaVersion !== undefined) {
    conditions.push('schema_version = @schemaVersion');
    params.schemaVersion = options.schemaVersion;
  }
  if (options.includeExcluded !== true) conditions.push('excluded = 0');
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const row = getDb().prepare(`SELECT COUNT(*) AS count FROM submissions ${where}`).get(params) as {
    count: number;
  };
  return row.count;
}

export function listForExport(filter: ExportFilter): SubmissionRow[] {
  const conditions: string[] = [];
  const params: Record<string, string | number> = {};
  if (filter.schemaVersion !== null) {
    conditions.push('schema_version = @schemaVersion');
    params.schemaVersion = filter.schemaVersion;
  }
  if (!filter.includeExcluded) conditions.push('excluded = 0');
  if (filter.from !== null) {
    conditions.push('created_at >= @from');
    params.from = filter.from;
  }
  if (filter.to !== null) {
    conditions.push('created_at <= @to');
    params.to = filter.to;
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT ${SUBMISSION_COLUMNS.join(', ')} FROM submissions ${where} ORDER BY created_at ASC, id ASC`;
  return getDb().prepare(sql).all(params) as SubmissionRow[];
}

/** 分位计算用：仅取总分，避免整行读入内存。 */
export function listTotalScores(schemaVersion: number): number[] {
  const rows = getDb()
    .prepare('SELECT total_score FROM submissions WHERE schema_version = ? AND excluded = 0 ORDER BY total_score ASC')
    .all(schemaVersion) as { total_score: number }[];
  return rows.map((row) => row.total_score);
}

/** 同 session 同软件重复提交判定（ARCHITECTURE §3.8 分析层，仅标记不拦截）。 */
export function hasSameSoftwareInSession(sessionId: string, softwareNameNorm: string): boolean {
  const row = getDb()
    .prepare(
      'SELECT 1 AS hit FROM submissions WHERE session_id = ? AND software_name_norm = ? LIMIT 1',
    )
    .get(sessionId, softwareNameNorm) as { hit: number } | undefined;
  return row !== undefined;
}

/**
 * 结果找回：按公钥令牌 record_id 取回一条结果视图。
 * 仅 SELECT 结果展示字段，不返回 IP/UA/自由文本等任何可识别信息（AC-10）。
 * 旧库里 record_id 为 NULL 的历史行不会被命中（它们早于找回功能）。
 */
export function getByRecordId(recordId: string): SubmissionLookupView | undefined {
  const row = getDb()
    .prepare(
      `SELECT record_id, software_name, software_category,
              factor_a_score, factor_b_score, factor_c_score,
              total_score, band, band_basis, n_at_scoring,
              s1_learning_type, s2_tenure_bucket, s3_frequency_bucket, s4_adoption_type,
              created_at
       FROM submissions WHERE record_id = ? AND excluded = 0 LIMIT 1`,
    )
    .get(recordId) as SubmissionLookupView | undefined;
  return row;
}
