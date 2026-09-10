import { getDb } from './db.js';

/** 档位基线快照表（ADR-007）。k-means 切点由本地脚本回写，后端不实现聚类。 */

export interface CalibrationRow {
  id: number;
  computed_at: string;
  schema_version: number;
  n: number;
  p33: number | null;
  p67: number | null;
  method: 'empirical' | 'kmeans';
  cutpoints: string | null;
}

export function latestCalibration(schemaVersion: number): CalibrationRow | null {
  const row = getDb()
    .prepare(
      'SELECT * FROM calibration WHERE schema_version = ? ORDER BY id DESC LIMIT 1',
    )
    .get(schemaVersion) as CalibrationRow | undefined;
  return row ?? null;
}

export function insertCalibration(row: {
  computed_at: string;
  schema_version: number;
  n: number;
  p33: number | null;
  p67: number | null;
  method: 'empirical' | 'kmeans';
  cutpoints: number[] | null;
}): void {
  getDb()
    .prepare(
      `INSERT INTO calibration (computed_at, schema_version, n, p33, p67, method, cutpoints)
       VALUES (@computed_at, @schema_version, @n, @p33, @p67, @method, @cutpoints)`,
    )
    .run({
      ...row,
      cutpoints: row.cutpoints === null ? null : JSON.stringify(row.cutpoints),
    });
}

export function countCalibration(): number {
  const row = getDb().prepare('SELECT COUNT(*) AS count FROM calibration').get() as {
    count: number;
  };
  return row.count;
}
