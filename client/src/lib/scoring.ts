/**
 * 本地计分（AC-03 结果预览不发任何请求，必须能在前端同步算完）。
 * 口径与 server/src/domain/{questions,bands}.ts 完全一致：
 *   反向题 A2 / B1 / B3 取 6 - 原始分；总分 9–45；先验切点 [21, 32]。
 */

import {
  ANSWER_KEYS,
  FACTORS,
  FACTOR_KEYS,
  LIKERT_MAX,
  LIKERT_MIN,
  QUESTION_BY_KEY,
  type AnswerKey,
  type FactorKey,
  type PartialAnswerMap,
} from '../config/questions';

export const MIN_TOTAL = ANSWER_KEYS.length * LIKERT_MIN; // 9
export const MAX_TOTAL = ANSWER_KEYS.length * LIKERT_MAX; // 45
export const REVERSE_BASE = LIKERT_MIN + LIKERT_MAX; // 6

/** 先验三等分切点（闭区间上界）：<=21 高危 / <=32 观察 / >32 安全。 */
export const PRIOR_CUTPOINTS: readonly [number, number] = [21, 32];

export type Band = 'high_risk' | 'watch' | 'safe';
export type BandBasis = 'prior' | 'empirical_p33p67' | 'kmeans';

export interface Calibration {
  method: BandBasis;
  n: number;
  p33: number | null;
  p67: number | null;
  computedAt: string;
}

export const DEFAULT_CALIBRATION: Calibration = {
  method: 'prior',
  n: 0,
  p33: null,
  p67: null,
  computedAt: '',
};

/** 反转分：反向题取 6 - 原始分；正向题原样。越界输入先夹紧再反。 */
export function reverseScore(key: AnswerKey, raw: number): number {
  const clamped = Math.min(LIKERT_MAX, Math.max(LIKERT_MIN, Math.round(raw)));
  return QUESTION_BY_KEY[key].reverse ? REVERSE_BASE - clamped : clamped;
}

export type ScoredMap = Record<AnswerKey, number>;

/**
 * 未作答的题计 0（不参与总分），而不是夹紧成 1 —— 否则「只答 1 题」也会显示 25 分，
 * 是一个会把未完成的作答渲染成有效分数的沉默错误。
 */
export function scoredAnswers(answers: PartialAnswerMap): ScoredMap {
  const out = {} as ScoredMap;
  for (const key of ANSWER_KEYS) {
    const raw = answers[key];
    out[key] = typeof raw === 'number' ? reverseScore(key, raw) : 0;
  }
  return out;
}

export interface FactorScore {
  key: FactorKey;
  /** 因子内各题反转分之和，范围 3–15 */
  sum: number;
  /** 因子均分，1 位小数，范围 1.0–5.0 */
  mean: number;
}

export interface ScoreResult {
  scored: ScoredMap;
  factors: Record<FactorKey, FactorScore>;
  /** 9–45 */
  total: number;
  /** 归一化到 0–100，仅用于展示，不参与判档 */
  normalized: number;
  complete: boolean;
  answeredCount: number;
}

export function scoreAnswers(answers: PartialAnswerMap): ScoreResult {
  const scored = scoredAnswers(answers);
  const factors = {} as Record<FactorKey, FactorScore>;
  let total = 0;
  let answeredCount = 0;

  for (const key of FACTOR_KEYS) {
    const keys = FACTORS[key].keys;
    let sum = 0;
    for (const q of keys) {
      sum += scored[q];
    }
    factors[key] = {
      key,
      sum,
      mean: Math.round((sum / keys.length) * 10) / 10,
    };
    total += sum;
  }

  for (const key of ANSWER_KEYS) {
    if (typeof answers[key] === 'number') answeredCount += 1;
  }

  return {
    scored,
    factors,
    total,
    normalized: normalizeTotal(total),
    complete: answeredCount === ANSWER_KEYS.length,
    answeredCount,
  };
}

export function normalizeTotal(total: number): number {
  const ratio = (total - MIN_TOTAL) / (MAX_TOTAL - MIN_TOTAL);
  return Math.round(Math.min(1, Math.max(0, ratio)) * 100);
}

/** 切点取用顺序与服务端 resolveBand 一致：经验分位优先，缺失回退先验。 */
export function cutpointsOf(calibration: Calibration): readonly [number, number] {
  if (calibration.method === 'empirical_p33p67') {
    const p33 = calibration.p33 ?? PRIOR_CUTPOINTS[0];
    const p67 = calibration.p67 ?? PRIOR_CUTPOINTS[1];
    return [p33, p67];
  }
  return PRIOR_CUTPOINTS;
}

export function resolveBand(total: number, calibration: Calibration = DEFAULT_CALIBRATION): Band {
  const [first, second] = cutpointsOf(calibration);
  if (total <= first) return 'high_risk';
  if (total <= second) return 'watch';
  return 'safe';
}

export const BAND_META: Record<Band, { label: string; zone: string; tone: string }> = {
  high_risk: { label: '高危', zone: '高危区', tone: 'high' },
  watch: { label: '观察', zone: '观察区', tone: 'watch' },
  safe: { label: '安全', zone: '安全区', tone: 'safe' },
};

/** 档位依据的诚实说明（UIUX §4.3.5 Edge：method=prior 时必须写）。 */
export function bandBasisNote(calibration: Calibration): string | null {
  if (calibration.method === 'prior') {
    return '档位依据理论切点，样本量达标后将用实际分布重新校准';
  }
  return null;
}
