import { SCHEMA_VERSION, QUESTIONS } from '../domain/questions.js';
import { buildCodebook } from '../domain/codebook.js';
import { listForExport } from '../repositories/submissions.repository.js';
import type { ExportFilter, SubmissionRow } from '../types/index.js';
import { toCsv, type CsvValue } from '../utils/csv.js';
import { scanPii } from '../utils/crypto.js';
import { logger } from '../utils/logger.js';
import { toRecordId } from '../utils/sanitize.js';

/**
 * 研究数据导出（ARCHITECTURE §3.9）。
 * 默认排除 id 与 followup_token（ADR-010），改用派生的 record_id 短码；
 * CSV 强制 UTF-8 BOM；导出动作留痕（时间、条数），不记录内容。
 */

type Cell = string | number | boolean | string[] | null;

/** 导出列名以 codebook 为准，保证字典与数据列永远一致。 */
const EXPORT_COLUMNS: readonly string[] = buildCodebook(SCHEMA_VERSION).variables.map(
  (variable) => variable.name,
);

const LONG_COLUMNS: readonly string[] = ['record_id', 'question_id', 'raw', 'scored'];

export interface RenderedExport {
  contentType: string;
  body: string;
  filename: string;
  count: number;
}

function parseFlags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

function toWideRow(row: SubmissionRow): Record<string, Cell> {
  const record: Record<string, Cell> = {
    record_id: toRecordId(row.id),
    session_id: row.session_id,
    created_at: row.created_at,
    client_submitted_at: row.client_submitted_at,
    schema_version: row.schema_version,
    max_score: row.max_score,
    consent_version: row.consent_version,
    consent_mode: row.consent_mode,
    software_name: row.software_name,
    software_name_norm: row.software_name_norm,
    software_category: row.software_category,
    is_custom_input: row.is_custom_input === 1,
    factor_a_score: row.factor_a_score,
    factor_b_score: row.factor_b_score,
    factor_c_score: row.factor_c_score,
    total_score: row.total_score,
    band: row.band,
    band_basis: row.band_basis,
    n_at_scoring: row.n_at_scoring,
    s1_learning_type: row.s1_learning_type,
    s2_tenure_bucket: row.s2_tenure_bucket,
    s3_frequency_bucket: row.s3_frequency_bucket,
    s4_adoption_type: row.s4_adoption_type,
    duration_ms: row.duration_ms,
    device_type: row.device_type,
    ua_family: row.ua_family,
    source: row.source,
    region_bucket: row.region_bucket,
    sequence_index: row.sequence_index,
    straightlining_flag: row.straightlining_flag === 1,
    rapid_flag: row.rapid_flag === 1,
    quality_flags: parseFlags(row.quality_flags),
    feedback_text: row.feedback_text,
    excluded: row.excluded === 1,
  };
  for (const question of QUESTIONS) {
    const key = question.key.toLowerCase();
    record[`q_${key}_raw`] = row[`q_${key}_raw`] ?? null;
    record[`q_${key}_scored`] = row[`q_${key}_scored`] ?? null;
  }
  return record;
}

function toLongRows(rows: readonly SubmissionRow[]): Record<string, Cell>[] {
  const out: Record<string, Cell>[] = [];
  for (const row of rows) {
    for (const question of QUESTIONS) {
      const key = question.key.toLowerCase();
      out.push({
        record_id: toRecordId(row.id),
        question_id: question.key,
        raw: row[`q_${key}_raw`] ?? null,
        scored: row[`q_${key}_scored`] ?? null,
      });
    }
  }
  return out;
}

function cellToCsvValue(cell: Cell): CsvValue {
  if (Array.isArray(cell)) return cell.join('|');
  return cell;
}

function toCsvRows(columns: readonly string[], rows: readonly Record<string, Cell>[]): Record<string, CsvValue>[] {
  return rows.map((row) => {
    const out: Record<string, CsvValue> = {};
    for (const column of columns) out[column] = cellToCsvValue(row[column] ?? null);
    return out;
  });
}

/** 自由文本隐私扫描：命中记录只提示人工复核，不自动删改（ARCHITECTURE §3.7）。 */
function warnPii(rows: readonly SubmissionRow[]): void {
  const hits = rows.filter((row) => scanPii(row.feedback_text).length > 0).map((row) => toRecordId(row.id));
  if (hits.length > 0) logger.warn('export.pii_review_required', { count: hits.length, record_ids: hits });
}

export function renderExport(filter: ExportFilter): RenderedExport {
  const rows = listForExport(filter);
  warnPii(rows);
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  if (filter.shape === 'long') {
    const longRows = toLongRows(rows);
    return {
      contentType: filter.format === 'json' ? 'application/json; charset=utf-8' : 'text/csv; charset=utf-8',
      body:
        filter.format === 'json'
          ? JSON.stringify(longRows)
          : toCsv(LONG_COLUMNS, toCsvRows(LONG_COLUMNS, longRows)),
      filename: `scc-export-long-${stamp}.${filter.format}`,
      count: longRows.length,
    };
  }

  const wideRows = rows.map(toWideRow);
  logger.info('export.performed', { rows: rows.length, format: filter.format, shape: filter.shape });
  return {
    contentType: filter.format === 'json' ? 'application/json; charset=utf-8' : 'text/csv; charset=utf-8',
    body:
      filter.format === 'json'
        ? JSON.stringify(wideRows)
        : toCsv(EXPORT_COLUMNS, toCsvRows(EXPORT_COLUMNS, wideRows)),
    filename: `scc-export-wide-${stamp}.${filter.format}`,
    count: wideRows.length,
  };
}

export { EXPORT_COLUMNS };
