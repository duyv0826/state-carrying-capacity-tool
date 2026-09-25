import type { Band, BandBasis } from '../domain/bands.js';
import type { AnswerKey, AnswerMap, FactorKey } from '../domain/questions.js';

export type StrataS1 = 'A' | 'B' | 'C';
export type StrataS2 = 'lt6m' | '6m_2y' | '2y_5y' | 'gt5y';
export type StrataS3 = 'daily' | 'weekly_multi' | 'weekly_once' | 'monthly' | 'rarer';
export type StrataS4 = 'self' | 'mandated';
export type DeviceType = 'mobile' | 'desktop';
export type UaFamily = 'wechat' | 'safari_mobile' | 'other';
export type ConsentMode = 'implied' | 'explicit';
export type SoftwareCategory =
  | 'design'
  | 'video'
  | '3d'
  | 'doc'
  | 'code'
  | 'sheet'
  | 'note'
  | 'audio'
  | 'other';

export type QualityFlag =
  | 'straightlining'
  | 'rapid'
  | 'duplicate_software'
  | 'invalid_name';

export interface StrataInput {
  S1: StrataS1;
  S2: StrataS2;
  S3: StrataS3;
  S4: StrataS4 | null;
}

/** 通过校验后的提交请求（校验在 validators/ 层完成，service 只接可信数据）。 */
export interface SubmissionInput {
  sessionId: string;
  schemaVersion: number;
  softwareName: string;
  softwareCategory: SoftwareCategory;
  isCustomInput: boolean;
  answers: AnswerMap;
  strata: StrataInput;
  regionBucket: string | null;
  durationMs: number;
  sequenceIndex: number;
  deviceType: DeviceType;
  uaFamily: UaFamily | null;
  source: string | null;
  clientSubmittedAt: string | null;
  consentVersion: string;
  consentMode: ConsentMode;
  feedbackText: string | null;
  followupToken: string | null;
}

export interface AbandonInput {
  sessionId: string;
  schemaVersion: number;
  softwareName: string | null;
  lastQuestionIndex: number;
  durationMs: number | null;
}

export interface FollowupInput {
  followupToken: string;
  contact: string;
  band: Band | null;
  consentVersion: string;
}

export interface SubmissionRow {
  id: string;
  session_id: string;
  created_at: string;
  client_submitted_at: string | null;
  schema_version: number;
  max_score: number;
  consent_version: string;
  consent_mode: ConsentMode;
  software_name: string;
  software_name_norm: string;
  software_category: SoftwareCategory;
  is_custom_input: 0 | 1;
  factor_a_score: number;
  factor_b_score: number;
  factor_c_score: number;
  total_score: number;
  band: Band;
  band_basis: BandBasis;
  n_at_scoring: number;
  s1_learning_type: StrataS1;
  s2_tenure_bucket: StrataS2;
  s3_frequency_bucket: StrataS3;
  s4_adoption_type: StrataS4 | null;
  duration_ms: number;
  device_type: DeviceType;
  ua_family: UaFamily | null;
  source: string | null;
  region_bucket: string | null;
  sequence_index: number;
  straightlining_flag: 0 | 1;
  rapid_flag: 0 | 1;
  quality_flags: string;
  feedback_text: string | null;
  followup_token: string | null;
  excluded: 0 | 1;
  [key: `q_${string}_raw`]: number | null;
  [key: `q_${string}_scored`]: number | null;
}

export type SubmissionRowAnswers = Record<`q_${Lowercase<AnswerKey>}_raw`, number> &
  Record<`q_${Lowercase<AnswerKey>}_scored`, number>;

export interface SubmissionResultPayload {
  record_id: string;
  total_score: number;
  band: Band;
  band_basis: BandBasis;
  n_at_scoring: number;
  quality_flags: QualityFlag[];
}

/**
 * 结果找回视图（GET /api/v1/submissions/:recordId 的响应）。
 * 仅含结果展示所需字段，不含任何可识别字段（IP / UA 原文 / 自由文本等），符合 AC-10。
 * 前端据此用 factor_score/3 复算因子均值、用 (total-9)/36 复算归一化，无需回传原始作答。
 */
export interface SubmissionLookupView {
  record_id: string;
  software_name: string;
  software_category: SoftwareCategory;
  factor_a_score: number;
  factor_b_score: number;
  factor_c_score: number;
  total_score: number;
  band: Band;
  band_basis: BandBasis;
  n_at_scoring: number;
  s1_learning_type: StrataS1;
  s2_tenure_bucket: StrataS2;
  s3_frequency_bucket: StrataS3;
  s4_adoption_type: StrataS4 | null;
  created_at: string;
}

export interface ScoreResult {
  scored: AnswerMap;
  factors: Record<FactorKey, number>;
  totalScore: number;
  straightlining: boolean;
}

export interface ExportFilter {
  format: 'csv' | 'json';
  shape: 'wide' | 'long';
  schemaVersion: number | null;
  includeExcluded: boolean;
  from: string | null;
  to: string | null;
}
