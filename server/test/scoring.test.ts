import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveBand, priorCalibration } from '../src/domain/bands.js';
import { detectQualityFlags, scoreAnswers, scoredValue } from '../src/services/scoring.service.js';
import { REVERSE_KEYS, type AnswerMap } from '../src/domain/questions.js';

const RAW: AnswerMap = { A1: 4, A2: 3, A3: 5, B1: 2, B2: 3, B3: 4, C1: 5, C2: 4, C3: 3 };

describe('反向计分（PRD §6.3：反向题为 A2 / B1 / B3）', () => {
  it('反向题取 6 - 原始分，正向题原值', () => {
    assert.equal(scoredValue('A2', 1), 5);
    assert.equal(scoredValue('A2', 5), 1);
    assert.equal(scoredValue('B1', 2), 4);
    assert.equal(scoredValue('B3', 4), 2);
    assert.equal(scoredValue('A1', 4), 4);
    assert.equal(scoredValue('C3', 3), 3);
  });

  it('反向题清单恰好是 A2 / B1 / B3', () => {
    assert.deepEqual([...REVERSE_KEYS].sort(), ['A2', 'B1', 'B3']);
  });
});

describe('三因子分与总分（AC-07）', () => {
  it('A=12 / B=9 / C=12，总分 33', () => {
    const result = scoreAnswers(RAW);
    assert.equal(result.factors.A, 12);
    assert.equal(result.factors.B, 9);
    assert.equal(result.factors.C, 12);
    assert.equal(result.totalScore, 33);
    assert.equal(result.scored.A2, 3);
    assert.equal(result.scored.B1, 4);
    assert.equal(result.scored.B3, 2);
  });

  it('极值：全 1 -> 总分 21（3 道反向题反转为 5，6 道正向题为 1）', () => {
    const all: AnswerMap = { A1: 1, A2: 1, A3: 1, B1: 1, B2: 1, B3: 1, C1: 1, C2: 1, C3: 1 };
    const result = scoreAnswers(all);
    assert.equal(result.totalScore, 3 * 5 + 6 * 1);
    assert.equal(result.totalScore, 21);
    assert.equal(result.straightlining, true);
  });

  it('全 5 -> 总分 33（3 道反向题反转为 1，6 道正向题为 5）', () => {
    const all: AnswerMap = { A1: 5, A2: 5, A3: 5, B1: 5, B2: 5, B3: 5, C1: 5, C2: 5, C3: 5 };
    const result = scoreAnswers(all);
    assert.equal(result.totalScore, 6 * 5 + 3 * 1);
    assert.equal(result.totalScore, 33);
  });

  it('非全同值不判 straightlining', () => {
    assert.equal(scoreAnswers(RAW).straightlining, false);
  });
});

describe('先验档位（冷启动三等分 9-21 / 22-32 / 33-45）', () => {
  const calibration = priorCalibration(0, '2026-09-09T00:00:00.000Z');

  it('边界值判定', () => {
    assert.equal(resolveBand(9, calibration), 'high_risk');
    assert.equal(resolveBand(21, calibration), 'high_risk');
    assert.equal(resolveBand(22, calibration), 'watch');
    assert.equal(resolveBand(32, calibration), 'watch');
    assert.equal(resolveBand(33, calibration), 'safe');
    assert.equal(resolveBand(45, calibration), 'safe');
  });
});

describe('质量标记', () => {
  it('过快与直线作答分别打标', () => {
    const flags = detectQualityFlags({
      straightlining: true,
      durationMs: 5000,
      rapidThresholdMs: 12000,
      duplicateSoftware: false,
      invalidName: false,
    });
    assert.deepEqual(flags, ['straightlining', 'rapid']);
  });

  it('正常作答不打标', () => {
    const flags = detectQualityFlags({
      straightlining: false,
      durationMs: 38200,
      rapidThresholdMs: 12000,
      duplicateSoftware: false,
      invalidName: false,
    });
    assert.deepEqual(flags, []);
  });
});
