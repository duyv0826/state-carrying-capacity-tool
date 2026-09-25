/**
 * 建表与索引（ARCHITECTURE §3.2 - §3.6）。
 * 隐私硬约束：任何表中都不存在 IP / UA 原文 / Cookie 等可识别字段（AC-10、ADR-008）。
 */

import Database from 'better-sqlite3';

function answerColumns(): string {
  const keys = ['a1', 'a2', 'a3', 'b1', 'b2', 'b3', 'c1', 'c2', 'c3'];
  return keys
    .flatMap((key) => [
      `q_${key}_raw INTEGER NOT NULL CHECK (q_${key}_raw BETWEEN 1 AND 5)`,
      `q_${key}_scored INTEGER NOT NULL CHECK (q_${key}_scored BETWEEN 1 AND 5)`,
    ])
    .join(',\n    ');
}

const CREATE_SUBMISSIONS = `
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    record_id TEXT,
    session_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    client_submitted_at TEXT,
    schema_version INTEGER NOT NULL CHECK (schema_version IN (1, 2)),
    max_score INTEGER NOT NULL CHECK (max_score IN (40, 45)),
    consent_version TEXT NOT NULL,
    consent_mode TEXT NOT NULL CHECK (consent_mode IN ('implied', 'explicit')),
    software_name TEXT NOT NULL,
    software_name_norm TEXT NOT NULL,
    software_category TEXT NOT NULL CHECK (software_category IN ('design', 'video', '3d', 'doc', 'code', 'sheet', 'note', 'audio', 'other')),
    is_custom_input INTEGER NOT NULL CHECK (is_custom_input IN (0, 1)),
    ${answerColumns()},
    factor_a_score INTEGER NOT NULL CHECK (factor_a_score BETWEEN 3 AND 15),
    factor_b_score INTEGER NOT NULL CHECK (factor_b_score BETWEEN 3 AND 15),
    factor_c_score INTEGER NOT NULL CHECK (factor_c_score BETWEEN 3 AND 15),
    total_score INTEGER NOT NULL CHECK (total_score BETWEEN 9 AND 45),
    band TEXT NOT NULL CHECK (band IN ('high_risk', 'watch', 'safe')),
    band_basis TEXT NOT NULL CHECK (band_basis IN ('prior', 'empirical_p33p67', 'kmeans')),
    n_at_scoring INTEGER NOT NULL CHECK (n_at_scoring >= 0),
    s1_learning_type TEXT NOT NULL CHECK (s1_learning_type IN ('A', 'B', 'C')),
    s2_tenure_bucket TEXT NOT NULL CHECK (s2_tenure_bucket IN ('lt6m', '6m_2y', '2y_5y', 'gt5y')),
    s3_frequency_bucket TEXT NOT NULL CHECK (s3_frequency_bucket IN ('daily', 'weekly_multi', 'weekly_once', 'monthly', 'rarer')),
    s4_adoption_type TEXT CHECK (s4_adoption_type IS NULL OR s4_adoption_type IN ('self', 'mandated')),
    duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
    device_type TEXT NOT NULL CHECK (device_type IN ('mobile', 'desktop')),
    ua_family TEXT CHECK (ua_family IS NULL OR ua_family IN ('wechat', 'safari_mobile', 'other')),
    source TEXT,
    region_bucket TEXT,
    sequence_index INTEGER NOT NULL CHECK (sequence_index >= 1),
    straightlining_flag INTEGER NOT NULL CHECK (straightlining_flag IN (0, 1)),
    rapid_flag INTEGER NOT NULL CHECK (rapid_flag IN (0, 1)),
    quality_flags TEXT NOT NULL,
    feedback_text TEXT,
    followup_token TEXT,
    excluded INTEGER NOT NULL DEFAULT 0 CHECK (excluded IN (0, 1))
)`;

const CREATE_FOLLOWUPS = `
CREATE TABLE IF NOT EXISTS followups (
    id TEXT PRIMARY KEY,
    followup_token TEXT NOT NULL UNIQUE,
    contact_encrypted TEXT NOT NULL,
    created_at TEXT NOT NULL,
    consent_version TEXT NOT NULL,
    band TEXT CHECK (band IS NULL OR band IN ('high_risk', 'watch', 'safe')),
    contact_purge_after TEXT
)`;

const CREATE_ABANDON_EVENTS = `
CREATE TABLE IF NOT EXISTS abandon_events (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    schema_version INTEGER NOT NULL,
    software_name TEXT,
    last_question_index INTEGER NOT NULL CHECK (last_question_index BETWEEN 0 AND 30),
    duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0),
    created_at TEXT NOT NULL
)`;

const CREATE_CALIBRATION = `
CREATE TABLE IF NOT EXISTS calibration (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    computed_at TEXT NOT NULL,
    schema_version INTEGER NOT NULL,
    n INTEGER NOT NULL,
    p33 REAL,
    p67 REAL,
    method TEXT NOT NULL CHECK (method IN ('empirical', 'kmeans')),
    cutpoints TEXT
)`;

const INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_sub_created ON submissions(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_sub_session ON submissions(session_id)',
  'CREATE INDEX IF NOT EXISTS idx_sub_software ON submissions(software_name_norm)',
  'CREATE INDEX IF NOT EXISTS idx_sub_version ON submissions(schema_version)',
  'CREATE INDEX IF NOT EXISTS idx_abandon_created ON abandon_events(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_followups_token ON followups(followup_token)',
];

export const MIGRATIONS: readonly string[] = [
  CREATE_SUBMISSIONS,
  CREATE_FOLLOWUPS,
  CREATE_ABANDON_EVENTS,
  CREATE_CALIBRATION,
  ...INDEXES,
];

/**
 * 结果找回功能（GET /api/v1/submissions/:recordId）所需的列。
 * record_id 由服务端 UUID 主键单向派生（sha256 前 8 位，见 utils/sanitize.ts），
 * 因此客户端持有的令牌无法反推主键，必须落地存储才能按令牌取回。
 * 该列也顺带满足 ADR-010：导出数据集用 record_id 而非主键 id。
 * 旧库可能无此列，启动时用 pragma 探测后幂等追加，保证任何环境首次启动可用。
 */
export function ensureRecordIdColumn(db: Database.Database): void {
  const has = db
    .prepare("SELECT COUNT(*) AS c FROM pragma_table_info('submissions') WHERE name = 'record_id'")
    .get() as { c: number };
  if (has.c === 0) {
    db.exec('ALTER TABLE submissions ADD COLUMN record_id TEXT');
    db.exec('CREATE INDEX IF NOT EXISTS idx_sub_record_id ON submissions(record_id)');
  }
}
