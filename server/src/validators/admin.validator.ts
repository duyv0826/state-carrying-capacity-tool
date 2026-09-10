import type { ExportFilter } from '../types/index.js';
import { validationError } from '../utils/errors.js';
import { asEnum, asObject } from './common.js';

const FORMAT_VALUES = ['csv', 'json'] as const;
const SHAPE_VALUES = ['wide', 'long'] as const;

function asBooleanQuery(value: unknown, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  throw validationError('include_excluded 取值必须是 true 或 false');
}

function asOptionalInt(value: unknown, path: string): number | null {
  if (value === undefined || value === '') return null;
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed)) throw validationError(`查询参数 ${path} 必须是整数`);
  return parsed;
}

function asOptionalDateTime(value: unknown, path: string): string | null {
  if (value === undefined || value === '') return null;
  const text = String(value);
  if (Number.isNaN(Date.parse(text))) throw validationError(`查询参数 ${path} 不是合法时间`);
  return new Date(text).toISOString();
}

/** GET /api/v1/admin/export 查询参数校验（openapi 同名参数）。 */
export function parseExportQuery(query: unknown): ExportFilter {
  const raw = asObject(query, 'query');
  return {
    format: asEnum(raw.format ?? 'csv', 'format', FORMAT_VALUES),
    shape: asEnum(raw.shape ?? 'wide', 'shape', SHAPE_VALUES),
    schemaVersion: asOptionalInt(raw.schema_version, 'schema_version'),
    includeExcluded: asBooleanQuery(raw.include_excluded, false),
    from: asOptionalDateTime(raw.from, 'from'),
    to: asOptionalDateTime(raw.to, 'to'),
  };
}
