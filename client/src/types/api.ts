/**
 * 前后端共享的接口契约（源：docs/openapi.yaml）。
 * 字段名一律按 openapi 的 snake_case，前端不做 camelCase 映射，
 * 避免"看起来一样但字段名不同"的联调事故。
 */

import type { AnswerKey, AnswerMap } from '../config/questions';
import type { SoftwareCategory } from '../config/software';
import type { Strata } from '../config/strata';

export interface Envelope<T> {
  code: number;
  data: T;
  message: string;
}

export type ConsentMode = 'implied' | 'explicit';
export type DeviceType = 'mobile' | 'desktop';
export type UaFamily = 'wechat' | 'safari_mobile' | 'other';
export type BandBasis = 'prior' | 'empirical_p33p67' | 'kmeans';

export interface CalibrationPayload {
  method: BandBasis;
  n: number;
  p33: number | null;
  p67: number | null;
  computed_at: string;
}

export interface ConfigPayload {
  collection_enabled: boolean;
  consent_version: string;
  consent_mode: ConsentMode;
  schema_version: number;
  max_score: number;
  calibration: CalibrationPayload;
  total_count: number;
}

/**
 * POST /api/v1/submissions 请求体。
 * 注意：openapi 与 server validator 的字段名是 `answers`（不是 scores），
 * 服务端拒绝未知字段之外的缺失字段，提交必须与之逐字对齐。
 */
export interface SubmissionRequest {
  session_id: string;
  schema_version: number;
  software_name: string;
  software_category: SoftwareCategory;
  is_custom_input: boolean;
  answers: AnswerMap;
  strata: Required<Pick<Strata, 'S1' | 'S2' | 'S3'>> & Pick<Strata, 'S4'>;
  region_bucket: string | null;
  duration_ms: number;
  sequence_index: number;
  device_type: DeviceType;
  ua_family: UaFamily | null;
  source: string | null;
  client_submitted_at: string | null;
  consent_version: string;
  consent_mode: ConsentMode;
  feedback_text: string | null;
  followup_token: string | null;
  /** 蜜罐。必须为空字符串（AC-08）。 */
  hp: string;
}

export type QualityFlag =
  | 'straightlining'
  | 'rapid'
  | 'duplicate_software'
  | 'invalid_name';

export interface SubmissionResult {
  record_id: string;
  total_score: number;
  band: 'high_risk' | 'watch' | 'safe';
  band_basis: BandBasis;
  n_at_scoring: number;
  quality_flags: QualityFlag[];
}

export type AnswerKeyOf = AnswerKey;
