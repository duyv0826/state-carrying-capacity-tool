/**
 * 步序唯一真源（SPEC §0 硬决策 3 / AC-11）。
 * 进度轨段数、翻页、播报、按钮文案全部读这份数组；组件里不得出现任何步数或题号常量。
 *
 * 切方案只改一个常量：ACTIVE_PLAN = 'A' | 'B'
 *   A（当前落地，结果前置）：第 0 步选软件 → 9 题 → 预览 → S1 / S2 / S3(+S4)   = 14 步
 *   B（预批准降级开关）：    第 0 步选软件(+S2/S3) → 9 题 → 预览 → S1(+S4)     = 12 步
 * 切 B 时 S2/S3 从第 0 步采集，背景段只剩 1 屏，§4.4 的 S2/S3 两屏自动消失，不会重复采集。
 */

import { ANSWER_KEYS, QUESTIONS, type AnswerKey } from './questions';
import type { StrataKey } from './strata';

export type StepKind = 'select' | 'likert' | 'preview' | 'strata';
export type StepGroup = 'core' | 'background';

export interface StepDef {
  id: string;
  route: string;
  kind: StepKind;
  /** core = 核心 11 段，background = 背景 3 段。进度轨据此分组 + 视觉降级（AC-04）。 */
  group: StepGroup;
  /** likert 步：题号 1..9 与题号 key */
  questionIndex?: number;
  answerKey?: AnswerKey;
  /** strata 步：本屏承载的背景题（S4 与 S3 同屏，不单独占段） */
  strataKeys?: readonly StrataKey[];
  /** select 步：是否顺带采集背景题（方案 B 用） */
  collectStrata?: boolean;
  /** 主按钮文案。第 9 题禁「提交」「完成」（SPEC §7）。 */
  nextLabel: string;
}

const select = (
  id: string,
  route: string,
  nextLabel: string,
  strataKeys?: readonly StrataKey[],
): StepDef => ({
  id,
  route,
  kind: 'select',
  group: 'core',
  nextLabel,
  ...(strataKeys && strataKeys.length > 0
    ? { strataKeys, collectStrata: true }
    : {}),
});

const likert = (index: number): StepDef => ({
  id: `q${index}`,
  route: `/q/${index}`,
  kind: 'likert',
  group: 'core',
  questionIndex: index,
  answerKey: ANSWER_KEYS[index - 1] as AnswerKey,
  nextLabel: index === QUESTIONS.length ? '查看结果' : '下一题',
});

const preview = (): StepDef => ({
  id: 'preview',
  route: '/preview',
  kind: 'preview',
  group: 'core',
  nextLabel: '继续（约 40 秒）',
});

const strata = (
  id: string,
  route: string,
  nextLabel: string,
  strataKeys: readonly StrataKey[],
): StepDef => ({
  id,
  route,
  kind: 'strata',
  group: 'background',
  strataKeys,
  nextLabel,
});

const FLOW_PLANS = {
  /** 方案 A：结果前置（SPEC §7 页面清单，14 段） */
  A: [
    select('start', '/', '开始自测'),
    ...ANSWER_KEYS.map((_, i) => likert(i + 1)),
    preview(),
    strata('S1', '/s/S1', '下一题', ['S1']),
    strata('S2', '/s/S2', '下一题', ['S2']),
    strata('S3', '/s/S3', '完成并提交', ['S3', 'S4']),
  ],
  /** 方案 B：S2/S3 前移回第 0 步，背景段压到 1 屏（UIUX §4.5.3 防线 #7） */
  B: [
    select('start', '/', '开始自测', ['S2', 'S3']),
    ...ANSWER_KEYS.map((_, i) => likert(i + 1)),
    preview(),
    strata('S1', '/s/S1', '完成并提交', ['S1', 'S4']),
  ],
} as const;

export type FlowPlan = keyof typeof FLOW_PLANS;

/** 切方案只改这一行。 */
export const ACTIVE_PLAN: FlowPlan = 'A';

export const STEPS: readonly StepDef[] = FLOW_PLANS[ACTIVE_PLAN];
export const TOTAL_STEPS = STEPS.length;

export const CORE_STEPS = STEPS.filter((s) => s.group === 'core');
export const BACKGROUND_STEPS = STEPS.filter((s) => s.group === 'background');
export const BACKGROUND_TOTAL = BACKGROUND_STEPS.length;

export function stepIndexOf(step: StepDef): number {
  return STEPS.findIndex((s) => s.id === step.id);
}

export function findStep(predicate: (s: StepDef) => boolean): StepDef | undefined {
  return STEPS.find(predicate);
}

export function stepByQuestionIndex(index: number): StepDef | undefined {
  return findStep((s) => s.kind === 'likert' && s.questionIndex === index);
}

export function stepByStrataId(id: string): StepDef | undefined {
  return findStep((s) => s.kind === 'strata' && s.id.toUpperCase() === id.toUpperCase());
}

export function firstStrataStep(): StepDef | undefined {
  return BACKGROUND_STEPS[0];
}

export function nextStepOf(step: StepDef): StepDef | undefined {
  return STEPS[stepIndexOf(step) + 1];
}

export function prevStepOf(step: StepDef): StepDef | undefined {
  const i = stepIndexOf(step);
  return i > 0 ? STEPS[i - 1] : undefined;
}

/** 背景段内序号（1..BACKGROUND_TOTAL），用于「背景信息 1 / 3」播报。 */
export function backgroundOrdinal(step: StepDef): number {
  return BACKGROUND_STEPS.findIndex((s) => s.id === step.id) + 1;
}

export function isLastStep(step: StepDef): boolean {
  return stepIndexOf(step) === TOTAL_STEPS - 1;
}
