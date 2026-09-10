/**
 * 背景题 S1–S4（PRD §6.4 题面 + openapi Strata enum）。
 * 取值口径以后端 validator 的 enum 为准，前端不得自造档位（UIUX §4.4.5 已定稿）。
 */

export type StrataS1 = 'A' | 'B' | 'C';
export type StrataS2 = 'lt6m' | '6m_2y' | '2y_5y' | 'gt5y';
export type StrataS3 = 'daily' | 'weekly_multi' | 'weekly_once' | 'monthly' | 'rarer';
export type StrataS4 = 'self' | 'mandated';

export type StrataKey = 'S1' | 'S2' | 'S3' | 'S4';

export interface Strata {
  S1?: StrataS1;
  S2?: StrataS2;
  S3?: StrataS3;
  S4?: StrataS4;
}

/** openapi Strata.required —— 提交前必须三项齐全。 */
export const REQUIRED_STRATA: readonly StrataKey[] = ['S1', 'S2', 'S3'];

export interface ChoiceDef<T extends string> {
  value: T;
  label: string;
}

export interface StrataQuestionDef {
  key: StrataKey;
  /** 题面 */
  stem: string;
  /** 「为什么问这个」一行（UIUX §4.4.8 硬性要求，必须写具体机制） */
  reason: string;
  /** 题面下方的作答口径提示 */
  hint: string;
  /** S1 用陈述行（A/B/C），S2/S3/S4 用 chip。两类视觉语言刻意不同（§4.4.2）。 */
  shape: 'statement' | 'chip';
  optional: boolean;
  choices: ReadonlyArray<{ value: string; label: string; marker?: string }>;
}

export const STRATA_QUESTIONS: Record<StrataKey, StrataQuestionDef> = {
  S1: {
    key: 'S1',
    stem: '你在这个软件上花的学习成本，主要是哪一种？',
    reason: '用于检验这份量表在不同人群身上是否同样成立——同样是高危分，靠记位置的人和靠判断力的人，六个月后的选择往往不同。',
    hint: '不分对错，也不影响你的分数。选最接近的一种。',
    shape: 'statement',
    optional: false,
    choices: [
      { value: 'A', label: '主要花在记住东西在哪、怎么操作', marker: 'A' },
      { value: 'B', label: '一半一半', marker: 'B' },
      { value: 'C', label: '主要花在练出判断力（知道什么叫好、什么该改）', marker: 'C' },
    ],
  },
  S2: {
    key: 'S2',
    stem: '你用这个软件多久了？',
    reason: '用于剔除「用了三天就来打分」的噪声样本，也用于检验时间复利那一题的组间差异。',
    hint: '按累计使用时间估一个大致区间即可。',
    shape: 'chip',
    optional: false,
    choices: [
      { value: 'lt6m', label: '不到 6 个月' },
      { value: '6m_2y', label: '6 个月 – 2 年' },
      { value: '2y_5y', label: '2 – 5 年' },
      { value: 'gt5y', label: '5 年以上' },
    ],
  },
  S3: {
    key: 'S3',
    stem: '你平均每周用它多少次？',
    reason: '与使用年限一起构成使用强度，用来做效度校验：使用强度应当与状态承载那一组得分正相关。',
    hint: '按最近三个月的平均情况作答。',
    shape: 'chip',
    optional: false,
    choices: [
      { value: 'daily', label: '每天（每周 5 天及以上）' },
      { value: 'weekly_multi', label: '每周数次（2–4 次）' },
      { value: 'weekly_once', label: '每周约一次' },
      { value: 'monthly', label: '每月数次（1–3 次）' },
      { value: 'rarer', label: '更少' },
    ],
  },
  S4: {
    key: 'S4',
    stem: '这个软件是你自己选的，还是公司 / 客户 / 课程要求的？',
    reason: '被动使用者在协作锁定那一题上会系统性高分，需要分层，避免把「被锁定」误读成「安全」。',
    hint: '这一题可以不答，直接继续。',
    shape: 'chip',
    optional: true,
    choices: [
      { value: 'self', label: '我自己选的' },
      { value: 'mandated', label: '公司 / 客户 / 课程要求的' },
    ],
  },
};
