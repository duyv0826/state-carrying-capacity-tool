import {
  MIN_N_FOR_EMPIRICAL,
  MIN_N_FOR_KMEANS,
  RECALIBRATE_EVERY_N,
  RECALIBRATE_MAX_AGE_MS,
  priorCalibration,
  type Calibration,
} from '../domain/bands.js';
import { SCHEMA_VERSION } from '../domain/questions.js';
import { insertCalibration, latestCalibration } from '../repositories/calibration.repository.js';
import { countSubmissions, listTotalScores } from '../repositories/submissions.repository.js';
import { logger } from '../utils/logger.js';

/**
 * 档位基线解析（ADR-007）：
 * N < 30 用先验三等分；N ∈ [30, 150) 用经验 P33/P67（每新增 50 条或每 24 小时重算）；
 * N ≥ 150 若已有本地脚本回写的 k-means 切点则优先使用。
 */

export interface ResolvedCalibration {
  calibration: Calibration;
  /** 判档时样本量（写入 n_at_scoring，事后补不回来）。 */
  n: number;
}

function parseCutpoints(raw: string | null): number[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'number')) {
      return parsed as number[];
    }
  } catch {
    logger.warn('calibration.cutpoints_invalid');
  }
  return null;
}

/** 经验分位：升序最近秩法（nearest-rank），与常见统计软件的离散分位口径一致。 */
function percentile(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return 0;
  const rank = Math.ceil((p / 100) * sorted.length);
  const index = Math.min(Math.max(rank - 1, 0), sorted.length - 1);
  return sorted[index] ?? 0;
}

export function currentCalibration(schemaVersion: number = SCHEMA_VERSION): ResolvedCalibration {
  const n = countSubmissions({ schemaVersion });
  if (n < MIN_N_FOR_EMPIRICAL) {
    return { calibration: priorCalibration(n, new Date().toISOString()), n };
  }

  const row = latestCalibration(schemaVersion);
  if (row && row.method === 'kmeans' && n >= MIN_N_FOR_KMEANS) {
    const cutpoints = parseCutpoints(row.cutpoints);
    if (cutpoints && cutpoints.length >= 2) {
      return {
        calibration: {
          method: 'kmeans',
          n: row.n,
          p33: row.p33,
          p67: row.p67,
          cutpoints,
          computedAt: row.computed_at,
        },
        n,
      };
    }
  }

  const stale =
    row === null ||
    row.method !== 'empirical' ||
    n - row.n >= RECALIBRATE_EVERY_N ||
    Date.now() - Date.parse(row.computed_at) > RECALIBRATE_MAX_AGE_MS;

  if (stale || row === null) {
    const scores = listTotalScores(schemaVersion);
    const p33 = percentile(scores, 33);
    const p67 = percentile(scores, 67);
    const computedAt = new Date().toISOString();
    insertCalibration({
      computed_at: computedAt,
      schema_version: schemaVersion,
      n: scores.length,
      p33,
      p67,
      method: 'empirical',
      cutpoints: null,
    });
    logger.info('calibration.recomputed', { schema_version: schemaVersion, n: scores.length, p33, p67 });
    return {
      calibration: { method: 'empirical_p33p67', n: scores.length, p33, p67, cutpoints: null, computedAt },
      n,
    };
  }

  return {
    calibration: {
      method: 'empirical_p33p67',
      n: row.n,
      p33: row.p33,
      p67: row.p67,
      cutpoints: null,
      computedAt: row.computed_at,
    },
    n,
  };
}
