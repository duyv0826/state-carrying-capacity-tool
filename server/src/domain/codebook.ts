import type { Band } from './bands.js';
import { QUESTIONS } from './questions.js';

/**
 * 变量字典（ARCHITECTURE §3.9：供 SPSS 批量设置变量标签与值标签）。
 * 逐题变量由 QUESTIONS 派生，避免题单变更时字典与实现脱节。
 */

export type CodebookType = 'numeric' | 'string' | 'boolean';
export type CodebookScale = 'nominal' | 'ordinal' | 'scale';

export interface CodebookValue {
  value: number;
  label: string;
}

export interface CodebookVariable {
  name: string;
  label: string;
  type: CodebookType;
  scale: CodebookScale;
  values?: CodebookValue[];
  reverse_coded?: boolean;
}

const LIKERT_VALUES: CodebookValue[] = [
  { value: 1, label: '完全不符合' },
  { value: 2, label: '不太符合' },
  { value: 3, label: '说不清' },
  { value: 4, label: '比较符合' },
  { value: 5, label: '完全符合' },
];

/** 反向题的值标签含义不随反转改变：存的是原始分，标签仍按原始题面口径。 */
function likertValues(isReverse: boolean): CodebookValue[] {
  if (!isReverse) return LIKERT_VALUES;
  return LIKERT_VALUES.map((item) => ({
    value: item.value,
    label: `${item.label}（反向题，计分取 6 - 原始分）`,
  }));
}

const BAND_VALUES_LABELS: CodebookValue[] = [
  { value: 1, label: 'high_risk 高危区' },
  { value: 2, label: 'watch 观察区' },
  { value: 3, label: 'safe 安全区' },
];

const BASE_VARIABLES: CodebookVariable[] = [
  { name: 'record_id', label: '记录短码（由服务端 id 派生，导出用主键）', type: 'string', scale: 'nominal' },
  { name: 'session_id', label: '会话标识（不跨会话追踪）', type: 'string', scale: 'nominal' },
  { name: 'created_at', label: '服务端写入时间（ISO8601 UTC）', type: 'string', scale: 'scale' },
  { name: 'client_submitted_at', label: '客户端提交时间（用于时钟诊断）', type: 'string', scale: 'scale' },
  { name: 'schema_version', label: '题单版本（9 题 = 2）', type: 'numeric', scale: 'nominal' },
  { name: 'max_score', label: '该版本满分（45）', type: 'numeric', scale: 'scale' },
  { name: 'consent_version', label: '知情同意文本版本', type: 'string', scale: 'nominal' },
  {
    name: 'consent_mode',
    label: '同意方式',
    type: 'string',
    scale: 'nominal',
  },
  { name: 'software_name', label: '被试填写的软件名（已做字符白名单清洗）', type: 'string', scale: 'nominal' },
  { name: 'software_name_norm', label: '软件名归一化值（小写去空格去标点）', type: 'string', scale: 'nominal' },
  { name: 'software_category', label: '软件类别', type: 'string', scale: 'nominal' },
  { name: 'is_custom_input', label: '是否自由输入（非预设列表）', type: 'boolean', scale: 'nominal' },
];

const DERIVED_VARIABLES: CodebookVariable[] = [
  { name: 'factor_a_score', label: 'A 因子 状态承载（3-15）', type: 'numeric', scale: 'scale' },
  { name: 'factor_b_score', label: 'B 因子 任务结构与确定性（3-15）', type: 'numeric', scale: 'scale' },
  { name: 'factor_c_score', label: 'C 因子 制度与协作嵌入（3-15）', type: 'numeric', scale: 'scale' },
  { name: 'total_score', label: '总分（9-45）', type: 'numeric', scale: 'scale' },
  {
    name: 'band',
    label: '风险档位',
    type: 'string',
    scale: 'ordinal',
    values: BAND_VALUES_LABELS,
  },
  { name: 'band_basis', label: '判档依据（prior / empirical_p33p67 / kmeans）', type: 'string', scale: 'nominal' },
  { name: 'n_at_scoring', label: '判档时后端样本量', type: 'numeric', scale: 'scale' },
  {
    name: 's1_learning_type',
    label: 'S1 学习成本形态（调节变量，不计分）',
    type: 'string',
    scale: 'nominal',
  },
  {
    name: 's2_tenure_bucket',
    label: 'S2 使用年限分档',
    type: 'string',
    scale: 'ordinal',
    values: [
      { value: 1, label: 'lt6m 不足 6 个月' },
      { value: 2, label: '6m_2y 满 6 个月不足 2 年' },
      { value: 3, label: '2y_5y 满 2 年不足 5 年' },
      { value: 4, label: 'gt5y 满 5 年及以上' },
    ],
  },
  {
    name: 's3_frequency_bucket',
    label: 'S3 每周使用频次分档',
    type: 'string',
    scale: 'ordinal',
    values: [
      { value: 1, label: 'daily 每周 5 天及以上' },
      { value: 2, label: 'weekly_multi 每周 2-4 次' },
      { value: 3, label: 'weekly_once 每周约 1 次' },
      { value: 4, label: 'monthly 每月 1-3 次' },
      { value: 5, label: 'rarer 数月一次或更少' },
    ],
  },
  {
    name: 's4_adoption_type',
    label: 'S4 采纳方式（选做）',
    type: 'string',
    scale: 'nominal',
  },
  { name: 'duration_ms', label: '从第一题渲染到提交的总时长（毫秒）', type: 'numeric', scale: 'scale' },
  { name: 'device_type', label: '设备类型（前端粗判上报）', type: 'string', scale: 'nominal' },
  { name: 'ua_family', label: '浏览器族（前端粗判上报）', type: 'string', scale: 'nominal' },
  { name: 'source', label: '渠道标记（渠道级，非个体级）', type: 'string', scale: 'nominal' },
  { name: 'region_bucket', label: '地区（被试自愿填写，不从 IP 推断）', type: 'string', scale: 'nominal' },
  { name: 'sequence_index', label: '本 session 内第几次自测', type: 'numeric', scale: 'scale' },
  { name: 'straightlining_flag', label: '9 题全选同一值', type: 'boolean', scale: 'nominal' },
  { name: 'rapid_flag', label: '作答过快（低于阈值）', type: 'boolean', scale: 'nominal' },
  { name: 'quality_flags', label: '质量标记数组', type: 'string', scale: 'nominal' },
  { name: 'feedback_text', label: '反驳入口自由文本', type: 'string', scale: 'nominal' },
  { name: 'excluded', label: '分析阶段是否剔除', type: 'boolean', scale: 'nominal' },
];

function questionVariables(): CodebookVariable[] {
  const rows: CodebookVariable[] = [];
  for (const question of QUESTIONS) {
    const lower = question.key.toLowerCase();
    rows.push({
      name: `q_${lower}_raw`,
      label: `${question.label}（原始分）`,
      type: 'numeric',
      scale: 'ordinal',
      values: likertValues(question.reverse),
      reverse_coded: question.reverse,
    });
    rows.push({
      name: `q_${lower}_scored`,
      label: `${question.label}（反转后得分）`,
      type: 'numeric',
      scale: 'scale',
      reverse_coded: question.reverse,
    });
  }
  return rows;
}

export function buildCodebook(schemaVersion: number): {
  schema_version: number;
  variables: CodebookVariable[];
} {
  return {
    schema_version: schemaVersion,
    variables: [
      ...BASE_VARIABLES,
      ...questionVariables(),
      ...DERIVED_VARIABLES,
    ],
  };
}

export const BAND_LABELS: Readonly<Record<Band, string>> = {
  high_risk: '高危区',
  watch: '观察区',
  safe: '安全区',
};
