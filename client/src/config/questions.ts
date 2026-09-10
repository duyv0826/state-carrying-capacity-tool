/**
 * 题单唯一真源（前端侧）。与 server/src/domain/questions.ts 同口径：
 * 9 题 / A3+B3+C3 / schema_version = 2 / 反向题 A2、B1、B3（PRD §6.3）。
 * 改题必须递增 SCHEMA_VERSION，且不得与旧样本混跑 EFA（SPEC §0 硬决策 1）。
 */

export const SCHEMA_VERSION = 2;

export const ANSWER_KEYS = [
  'A1',
  'A2',
  'A3',
  'B1',
  'B2',
  'B3',
  'C1',
  'C2',
  'C3',
] as const;

export type AnswerKey = (typeof ANSWER_KEYS)[number];
export type AnswerMap = Record<AnswerKey, number>;
export type PartialAnswerMap = Partial<AnswerMap>;

export const FACTOR_KEYS = ['A', 'B', 'C'] as const;
export type FactorKey = (typeof FACTOR_KEYS)[number];

export const LIKERT_MIN = 1;
export const LIKERT_MAX = 5;

/**
 * 端点与中点标签（PRD §6.3 计分口径）。
 * UIUX §4.1.3 示意图写的是「不同意/同意」，但 9 道题均为第一人称陈述句，
 * 心理学上应配「不符合/符合」。这里集中一处，定稿后只改本数组。
 */
export const LIKERT_LABELS: readonly string[] = [
  '完全不符合',
  '不太符合',
  '说不清',
  '比较符合',
  '完全符合',
];

export interface QuestionDef {
  key: AnswerKey;
  factor: FactorKey;
  /** true = 反向题，计分时取 6 - 原始分；呈现方向绝不翻转（§4.1.3 硬约束）。 */
  reverse: boolean;
  /** 题干（PRD §6.3 题面原文；C3 取 PRD §6.6 备选「支付意愿刚性」）。 */
  stem: string;
  /** 题干下方的口径说明，避免被试把反向题读成同一方向。 */
  hint: string;
}

export const QUESTIONS: readonly QuestionDef[] = [
  {
    key: 'A1',
    factor: 'A',
    reverse: false,
    stem: '这个软件里，存着我换一个工具就带不走的东西——历史版本、素材库、我调好的配置、这个项目的来龙去脉。',
    hint: '想的是「搬走它的代价」，不是「它好不好用」。',
  },
  {
    key: 'A2',
    factor: 'A',
    reverse: true,
    stem: '我放在这个软件里的东西，可以完整地导出成别的地方也能打开、也能用的格式。',
    hint: '导出越完整，说明这份状态越容易被整体搬走。',
  },
  {
    key: 'A3',
    factor: 'A',
    reverse: false,
    stem: '我每多用这个软件一年，下一次开工就更省事一点。',
    hint: '区分「活资产」与「死资产」：复利型积累的重建成本逐年上升。',
  },
  {
    key: 'B1',
    factor: 'B',
    reverse: true,
    stem: '我用它做的事，基本都有固定套路，每次差别不大。',
    hint: '套路越固定，越容易被编码成自动流程。',
  },
  {
    key: 'B2',
    factor: 'B',
    reverse: false,
    stem: '我用它产出的东西，大多数时候还要被我或别人继续加工，很少直接作为最终交付。',
    hint: '产出只是链条中间态时，替代它等于重构整条工作流。',
  },
  {
    key: 'B3',
    factor: 'B',
    reverse: true,
    stem: '它输出的结果对不对，我能立刻客观地判断出来，而且错了代价也不大。',
    hint: '容错率高的环节，最先被概率模型渗透。',
  },
  {
    key: 'C1',
    factor: 'C',
    reverse: false,
    stem: '用它产出的东西出了问题，最后要我来兜底，而且这个后果没法转嫁给工具方或供应商。',
    hint: '责任越不可外包，越难被整包接管。',
  },
  {
    key: 'C2',
    factor: 'C',
    reverse: false,
    stem: '我用它，很大程度上是因为别人（同事、客户、协作方）也在这里，或者交付格式就要求在这里。',
    hint: '协作锁定与软件本身的功能强弱无关。',
  },
  {
    key: 'C3',
    factor: 'C',
    reverse: false,
    stem: '如果这个软件明天涨价十倍，我大概率还是会继续用。',
    hint: '支付意愿刚性：比态度题更接近真实行为。',
  },
];

export const QUESTION_BY_KEY: Record<AnswerKey, QuestionDef> = QUESTIONS.reduce(
  (acc, q) => ({ ...acc, [q.key]: q }),
  {} as Record<AnswerKey, QuestionDef>,
);

/** 量表题序号 → 题号（1..9）。题号播报用这个，不用步号。 */
export const QUESTION_INDEX: Record<AnswerKey, number> = QUESTIONS.reduce(
  (acc, q, i) => ({ ...acc, [q.key]: i + 1 }),
  {} as Record<AnswerKey, number>,
);

export const REVERSE_KEYS: readonly AnswerKey[] = QUESTIONS.filter((q) => q.reverse).map(
  (q) => q.key,
);

/** 因子元信息。short 用于结果预览（UIUX §4.3.2），full 用于结果页。 */
export const FACTORS: Record<
  FactorKey,
  { ordinal: string; short: string; full: string; keys: readonly AnswerKey[] }
> = {
  A: {
    ordinal: '一',
    short: '状态外显',
    full: '状态承载',
    keys: ['A1', 'A2', 'A3'],
  },
  B: {
    ordinal: '二',
    short: '产出形态',
    full: '任务结构与确定性',
    keys: ['B1', 'B2', 'B3'],
  },
  C: {
    ordinal: '三',
    short: '制度与协作嵌入',
    full: '制度与协作嵌入',
    keys: ['C1', 'C2', 'C3'],
  },
};
