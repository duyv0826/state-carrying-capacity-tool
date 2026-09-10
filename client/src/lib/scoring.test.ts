import { describe, expect, it } from 'vitest';
import { ANSWER_KEYS, type AnswerKey, type PartialAnswerMap } from '../config/questions';
import {
  DEFAULT_CALIBRATION,
  MAX_TOTAL,
  MIN_TOTAL,
  normalizeTotal,
  resolveBand,
  reverseScore,
  scoreAnswers,
  type Calibration,
} from './scoring';

const fill = (value: number): PartialAnswerMap =>
  ANSWER_KEYS.reduce((acc, key) => ({ ...acc, [key]: value }), {} as PartialAnswerMap);

const withAnswers = (overrides: Partial<Record<AnswerKey, number>>): PartialAnswerMap => ({
  ...fill(3),
  ...overrides,
});

describe('reverseScore', () => {
  it('反向题 A2 / B1 / B3 取 6 - 原始分', () => {
    expect(reverseScore('A2', 1)).toBe(5);
    expect(reverseScore('A2', 5)).toBe(1);
    expect(reverseScore('B1', 4)).toBe(2);
    expect(reverseScore('B3', 3)).toBe(3);
  });

  it('正向题不反转，且方向绝不翻转', () => {
    for (const key of ['A1', 'A3', 'B2', 'C1', 'C2', 'C3'] as AnswerKey[]) {
      expect(reverseScore(key, 1)).toBe(1);
      expect(reverseScore(key, 5)).toBe(5);
    }
  });

  it('越界输入夹紧到 1–5 后再算', () => {
    expect(reverseScore('A2', 0)).toBe(5);
    expect(reverseScore('A2', 9)).toBe(1);
  });
});

describe('scoreAnswers 边界值', () => {
  it('全选 1 分：反向题转为 5，总分 21，落高危区上界', () => {
    const r = scoreAnswers(fill(1));
    expect(r.scored).toEqual({ A1: 1, A2: 5, A3: 1, B1: 5, B2: 1, B3: 5, C1: 1, C2: 1, C3: 1 });
    expect(r.factors.A.sum).toBe(7);
    expect(r.factors.B.sum).toBe(11);
    expect(r.factors.C.sum).toBe(3);
    expect(r.total).toBe(21);
    expect(r.normalized).toBe(33);
    expect(resolveBand(r.total)).toBe('high_risk');
  });

  it('全选 5 分：反向题转为 1，总分 33，落安全区下界', () => {
    const r = scoreAnswers(fill(5));
    expect(r.scored).toEqual({ A1: 5, A2: 1, A3: 5, B1: 1, B2: 5, B3: 1, C1: 5, C2: 5, C3: 5 });
    expect(r.factors.A.sum).toBe(11);
    expect(r.factors.B.sum).toBe(7);
    expect(r.factors.C.sum).toBe(15);
    expect(r.total).toBe(33);
    expect(r.normalized).toBe(67);
    expect(resolveBand(r.total)).toBe('safe');
  });

  it('全选 3 分：总分 27，观察区', () => {
    const r = scoreAnswers(fill(3));
    expect(r.total).toBe(27);
    expect(r.normalized).toBe(50);
    expect(resolveBand(r.total)).toBe('watch');
  });

  it('含反向题的混合作答与手写期望一致', () => {
    const r = scoreAnswers(withAnswers({ A1: 5, A2: 5, A3: 4, B1: 2, B2: 4, B3: 1, C1: 3, C2: 2, C3: 5 }));
    expect(r.scored.A2).toBe(1);
    expect(r.scored.B1).toBe(4);
    expect(r.scored.B3).toBe(5);
    expect(r.factors.A.mean).toBe(3.3);
    expect(r.total).toBe(33);
    expect(resolveBand(r.total)).toBe('safe');
  });

  it('未答完时 complete=false，未答题计 0 而不是夹紧成 1', () => {
    const r = scoreAnswers({ A1: 5 });
    expect(r.complete).toBe(false);
    expect(r.answeredCount).toBe(1);
    expect(r.total).toBe(5);
  });
});

describe('resolveBand 先验切点', () => {
  it('9–21 高危 / 22–32 观察 / 33–45 安全', () => {
    expect(resolveBand(MIN_TOTAL)).toBe('high_risk');
    expect(resolveBand(21)).toBe('high_risk');
    expect(resolveBand(22)).toBe('watch');
    expect(resolveBand(32)).toBe('watch');
    expect(resolveBand(33)).toBe('safe');
    expect(resolveBand(MAX_TOTAL)).toBe('safe');
  });

  it('经验分位可用时优先用分位，缺失则回退先验', () => {
    const empirical: Calibration = {
      method: 'empirical_p33p67',
      n: 60,
      p33: 18,
      p67: 30,
      computedAt: '2026-09-10T00:00:00Z',
    };
    expect(resolveBand(20, empirical)).toBe('watch');
    expect(resolveBand(31, empirical)).toBe('safe');
    const broken: Calibration = { ...empirical, p33: null, p67: null };
    expect(resolveBand(21, broken)).toBe('high_risk');
    expect(resolveBand(22, broken)).toBe('watch');
  });

  it('kmeans 无切点下发时回退先验', () => {
    const kmeans: Calibration = { ...DEFAULT_CALIBRATION, method: 'kmeans', n: 200 };
    expect(resolveBand(21, kmeans)).toBe('high_risk');
    expect(resolveBand(33, kmeans)).toBe('safe');
  });
});

describe('normalizeTotal', () => {
  it('夹紧在 0–100，不因脏数据越界', () => {
    expect(normalizeTotal(MIN_TOTAL)).toBe(0);
    expect(normalizeTotal(MAX_TOTAL)).toBe(100);
    expect(normalizeTotal(0)).toBe(0);
    expect(normalizeTotal(999)).toBe(100);
  });
});
