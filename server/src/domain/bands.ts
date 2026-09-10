/**
 * 档位基线（ARCHITECTURE §四 ADR-007：分位基线快照 + 先验兜底）。
 * 冷启动（N < 30）使用先验三等分，切点随 schema_version 锁定，不原地改写语义。
 */

export type Band = 'high_risk' | 'watch' | 'safe';
export type BandBasis = 'prior' | 'empirical_p33p67' | 'kmeans';

export const BAND_VALUES: readonly Band[] = ['high_risk', 'watch', 'safe'];
export const BAND_BASIS_VALUES: readonly BandBasis[] = ['prior', 'empirical_p33p67', 'kmeans'];

/**
 * 先验切点：9 题量程 9-45 三等分。
 * 高危 9-21 / 观察 22-32 / 安全 33-45（Spec §2 与 ARCHITECTURE §四均为此口径）。
 */
export const PRIOR_CUTPOINTS: readonly [number, number] = [21, 32];

/** 经验分位判档的最小样本量；不足则用先验（ARCHITECTURE §四）。 */
export const MIN_N_FOR_EMPIRICAL = 30;
/** k-means 校准的最小样本量（PRD §6.5）。 */
export const MIN_N_FOR_KMEANS = 150;
/** 距上次校准新增多少条即重算（ARCHITECTURE §四：每新增 50 条或每 24 小时）。 */
export const RECALIBRATE_EVERY_N = 50;
export const RECALIBRATE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface Calibration {
  method: BandBasis;
  n: number;
  p33: number | null;
  p67: number | null;
  cutpoints: number[] | null;
  computedAt: string;
}

export function priorCalibration(n: number, computedAt: string): Calibration {
  return {
    method: 'prior',
    n,
    p33: null,
    p67: null,
    cutpoints: [PRIOR_CUTPOINTS[0], PRIOR_CUTPOINTS[1]],
    computedAt,
  };
}

/**
 * 判档：切点为闭区间上界。
 * prior / empirical_p33p67 / kmeans 三种依据共用同一比较逻辑，
 * 保证切换依据时只有切点变、语义不变。
 */
export function resolveBand(totalScore: number, calibration: Calibration): Band {
  const [first, second] = cutpointsOf(calibration);
  if (totalScore <= first) return 'high_risk';
  if (totalScore <= second) return 'watch';
  return 'safe';
}

function cutpointsOf(calibration: Calibration): [number, number] {
  if (calibration.method === 'empirical_p33p67') {
    const p33 = calibration.p33 ?? PRIOR_CUTPOINTS[0];
    const p67 = calibration.p67 ?? PRIOR_CUTPOINTS[1];
    return [Math.floor(p33), Math.floor(p67)];
  }
  if (calibration.cutpoints && calibration.cutpoints.length >= 2) {
    const first = calibration.cutpoints[0] ?? PRIOR_CUTPOINTS[0];
    const second = calibration.cutpoints[1] ?? PRIOR_CUTPOINTS[1];
    return [first, second];
  }
  return [PRIOR_CUTPOINTS[0], PRIOR_CUTPOINTS[1]];
}
