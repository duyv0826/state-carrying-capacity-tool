import {
  LIKERT_MAX,
  LIKERT_MIN,
  QUESTIONS,
  type AnswerKey,
  type AnswerMap,
  type FactorKey,
} from '../domain/questions.js';
import type { QualityFlag, ScoreResult } from '../types/index.js';

/**
 * 服务端算分（AC-07）。
 * 计分逻辑只在服务端实现一处，不接受前端传来的任何计算结果（ARCHITECTURE §7.4）。
 */

/**
 * 反向计分：反向题取 6 - 原始分（5 点 Likert，1+5=6），正向题原值。
 * 反向题清单与依据见 domain/questions.ts —— A2、B1、B3，依据 PRD §6.3 逐题「方向」列。
 */
export function scoredValue(key: AnswerKey, raw: number): number {
  const question = QUESTIONS.find((q) => q.key === key);
  if (!question) throw new Error(`未知题号: ${key}`);
  if (raw < LIKERT_MIN || raw > LIKERT_MAX) throw new Error(`第 ${key} 题原始分越界: ${raw}`);
  return question.reverse ? LIKERT_MAX + 1 - raw : raw;
}

export function scoreAnswers(raw: AnswerMap): ScoreResult {
  const scored = {} as AnswerMap;
  const factors: Record<FactorKey, number> = { A: 0, B: 0, C: 0 };

  for (const question of QUESTIONS) {
    const value = scoredValue(question.key, raw[question.key]);
    scored[question.key] = value;
    factors[question.factor] += value;
  }

  const totalScore = factors.A + factors.B + factors.C;
  const values = QUESTIONS.map((q) => raw[q.key]);
  return {
    scored,
    factors,
    totalScore,
    straightlining: values.every((value) => value === values[0]),
  };
}

/**
 * 质量标记（ARCHITECTURE §3.8 行为层 / 内容层）。
 * 原则：不拦截用户，只标记数据，留待分析阶段剔除。
 */
export function detectQualityFlags(input: {
  straightlining: boolean;
  durationMs: number;
  rapidThresholdMs: number;
  duplicateSoftware: boolean;
  invalidName: boolean;
}): QualityFlag[] {
  const flags: QualityFlag[] = [];
  if (input.straightlining) flags.push('straightlining');
  if (input.durationMs < input.rapidThresholdMs) flags.push('rapid');
  if (input.duplicateSoftware) flags.push('duplicate_software');
  if (input.invalidName) flags.push('invalid_name');
  return flags;
}
