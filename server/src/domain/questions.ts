/**
 * 题单唯一真源（Spec §0 硬决策 1：题单锁 9 题，schema_version = 2）。
 * 计分、导出列名、codebook 全部从本文件派生；改题必须递增 SCHEMA_VERSION。
 */

export const SCHEMA_VERSION = 2;
export const MAX_SCORE = 45;
export const MIN_SCORE = 9;
export const LIKERT_MIN = 1;
export const LIKERT_MAX = 5;

export type AnswerKey = 'A1' | 'A2' | 'A3' | 'B1' | 'B2' | 'B3' | 'C1' | 'C2' | 'C3';
export type FactorKey = 'A' | 'B' | 'C';

export interface QuestionDef {
  key: AnswerKey;
  factor: FactorKey;
  /** true = 反向题，计分时取 6 - 原始分 */
  reverse: boolean;
  label: string;
  /** 反向计分的方法论依据（PRD §6.3 逐题"方向"列） */
  directionNote: string;
}

/**
 * 反向题依据（PRD §6.3「8 题维度的专业建议」，9 题版沿用同一口径；
 * openapi.yaml 的 AnswerKey 描述亦明确「反向题为 A2、B1、B3」）：
 *
 * - A2 状态可迁移性：PRD 原文「反向题，A1 的调节项。解释了为什么承载量大不等于安全
 *   ——Obsidian 里 3000 篇 Markdown 承载量极大，但纯文本可被 AI 一次性重建」。
 *   即：可迁移性越高 -> 状态越容易被 AI 整体搬走 -> 风险越高，故反向。
 * - B1 任务常规化程度：PRD 原文方向列为「反向」，机制来自 Frey & Osborne（2017）
 *   核心论点——可被编码的常规任务最先被自动化。固定套路越强 -> 越易被替代，故反向。
 * - B3 结果确定性与容错率：PRD 原文方向列为「反向」。生成式 AI 是概率模型，
 *   高容错率环节最先被渗透；且「结果可客观验证 -> 人退居质检者 -> 更易被替代」，故反向。
 *
 * 其余 6 题（A1 状态沉淀量、A3 时间复利、B2 中间态、C1 责任归属、C2 协作锁定、
 * C3 支付意愿刚性）均为正向，反向计分不得外扩到这 6 题。
 */
export const QUESTIONS: readonly QuestionDef[] = [
  {
    key: 'A1',
    factor: 'A',
    reverse: false,
    label: 'A1 状态沉淀量',
    directionNote: '正向：沉淀越多，替代需一并搬走使用者的过去',
  },
  {
    key: 'A2',
    factor: 'A',
    reverse: true,
    label: 'A2 状态可迁移性',
    directionNote: 'PRD §6.3 反向：可迁移性高意味着状态可被 AI 一次性重建',
  },
  {
    key: 'A3',
    factor: 'A',
    reverse: false,
    label: 'A3 状态时间复利',
    directionNote: '正向：随时间复利的积累重建成本递增',
  },
  {
    key: 'B1',
    factor: 'B',
    reverse: true,
    label: 'B1 任务常规化程度',
    directionNote: 'PRD §6.3 反向：常规化任务最先被自动化（Frey & Osborne）',
  },
  {
    key: 'B2',
    factor: 'B',
    reverse: false,
    label: 'B2 中间态 vs 终态',
    directionNote: '正向：产出为链条中间态时替代需重构整条工作流',
  },
  {
    key: 'B3',
    factor: 'B',
    reverse: true,
    label: 'B3 结果确定性与容错率',
    directionNote: 'PRD §6.3 反向：高容错率环节最易被概率模型渗透',
  },
  {
    key: 'C1',
    factor: 'C',
    reverse: false,
    label: 'C1 责任归属不可外包性',
    directionNote: '正向：责任越不可外包，AI 越难整包接管',
  },
  {
    key: 'C2',
    factor: 'C',
    reverse: false,
    label: 'C2 协作锁定与网络效应',
    directionNote: '正向：AI 无法单方面迁移他人与交付格式',
  },
  {
    key: 'C3',
    factor: 'C',
    reverse: false,
    label: 'C3 支付意愿刚性',
    directionNote: '正向：PRD §6.6 建议一备选 C3，行为化的锁定表达',
  },
];

export const ANSWER_KEYS: readonly AnswerKey[] = QUESTIONS.map((q) => q.key);

export const REVERSE_KEYS: readonly AnswerKey[] = QUESTIONS.filter((q) => q.reverse).map(
  (q) => q.key,
);

export const QUESTION_BY_KEY: Readonly<Record<AnswerKey, QuestionDef>> = Object.freeze(
  Object.fromEntries(QUESTIONS.map((q) => [q.key, q])) as Record<AnswerKey, QuestionDef>,
);

export type AnswerMap = Record<AnswerKey, number>;

export function isAnswerKey(value: string): value is AnswerKey {
  return (ANSWER_KEYS as readonly string[]).includes(value);
}
