import { LIKERT_MAX, LIKERT_MIN, SCHEMA_VERSION, type AnswerKey, type AnswerMap } from '../domain/questions.js';
import type {
  ConsentMode,
  DeviceType,
  SoftwareCategory,
  StrataInput,
  StrataS1,
  StrataS2,
  StrataS3,
  StrataS4,
  SubmissionInput,
  UaFamily,
} from '../types/index.js';
import { validationError } from '../utils/errors.js';
import { asBoolean, asEnum, asInt, asNullable, asObject, asString, asUuid } from './common.js';

/** openapi.yaml Strata enum —— 与建表 CHECK 约束同口径，改边界必须升 schema_version。 */
const S1_VALUES = ['A', 'B', 'C'] as const;
const S2_VALUES = ['lt6m', '6m_2y', '2y_5y', 'gt5y'] as const;
const S3_VALUES = ['daily', 'weekly_multi', 'weekly_once', 'monthly', 'rarer'] as const;
const S4_VALUES = ['self', 'mandated'] as const;
const CATEGORY_VALUES = [
  'design',
  'video',
  '3d',
  'doc',
  'code',
  'sheet',
  'note',
  'audio',
  'other',
] as const;
const DEVICE_VALUES = ['mobile', 'desktop'] as const;
const UA_VALUES = ['wechat', 'safari_mobile', 'other'] as const;
const CONSENT_MODE_VALUES = ['implied', 'explicit'] as const;

const ANSWER_KEYS: readonly AnswerKey[] = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];
const FOLLOWUP_TOKEN_PATTERN = /^[0-9a-f]{32}$/;

function parseAnswers(value: unknown): AnswerMap {
  const raw = asObject(value, 'answers');
  const keys = Object.keys(raw);
  const missing = ANSWER_KEYS.filter((key) => !keys.includes(key));
  if (missing.length > 0) throw validationError(`缺少题目原始分: ${missing.join(', ')}`);
  const unknown = keys.filter((key) => !ANSWER_KEYS.includes(key as AnswerKey));
  if (unknown.length > 0) throw validationError(`存在未知题号: ${unknown.join(', ')}`);

  const answers = {} as AnswerMap;
  for (const key of ANSWER_KEYS) {
    answers[key] = asInt(raw[key], `answers.${key}`, { min: LIKERT_MIN, max: LIKERT_MAX });
  }
  return answers;
}

function parseStrata(value: unknown): StrataInput {
  const raw = asObject(value, 'strata');
  return {
    S1: asEnum<StrataS1>(raw.S1, 'strata.S1', S1_VALUES),
    S2: asEnum<StrataS2>(raw.S2, 'strata.S2', S2_VALUES),
    S3: asEnum<StrataS3>(raw.S3, 'strata.S3', S3_VALUES),
    S4: asNullable<StrataS4>(raw.S4, 'strata.S4', (inner, path) =>
      asEnum<StrataS4>(inner, path, S4_VALUES),
    ),
  };
}

/**
 * POST /api/v1/submissions 请求体校验。
 * 注意：hp 不在此处判空——蜜罐命中属于业务规则，走 AC-08 的静默成功分支，不是 400。
 */
export function parseSubmissionRequest(body: unknown): SubmissionInput {
  const raw = asObject(body, 'body');
  const schemaVersion = asInt(raw.schema_version, 'schema_version', { min: 1, max: 99 });
  if (schemaVersion !== SCHEMA_VERSION) {
    throw validationError(`schema_version 必须是 ${SCHEMA_VERSION}（题单已锁定 9 题）`);
  }

  return {
    sessionId: asUuid(raw.session_id, 'session_id'),
    schemaVersion,
    softwareName: asString(raw.software_name, 'software_name', { min: 1, max: 60 }),
    softwareCategory: asEnum<SoftwareCategory>(
      raw.software_category,
      'software_category',
      CATEGORY_VALUES,
    ),
    isCustomInput: asBoolean(raw.is_custom_input, 'is_custom_input', false),
    answers: parseAnswers(raw.answers),
    strata: parseStrata(raw.strata),
    regionBucket: asNullable<string>(raw.region_bucket, 'region_bucket', (inner, path) =>
      asString(inner, path, { min: 1, max: 40 }),
    ),
    durationMs: asInt(raw.duration_ms, 'duration_ms', { min: 0, max: 86_400_000 }),
    sequenceIndex: asInt(raw.sequence_index, 'sequence_index', { min: 1, max: 99 }),
    deviceType: asEnum<DeviceType>(raw.device_type, 'device_type', DEVICE_VALUES),
    uaFamily: asNullable<UaFamily>(raw.ua_family, 'ua_family', (inner, path) =>
      asEnum<UaFamily>(inner, path, UA_VALUES),
    ),
    source: asNullable<string>(raw.source, 'source', (inner, path) =>
      asString(inner, path, { min: 1, max: 40 }),
    ),
    clientSubmittedAt: asNullable<string>(raw.client_submitted_at, 'client_submitted_at', (inner, path) => {
      const text = asString(inner, path, { max: 40 });
      if (Number.isNaN(Date.parse(text))) throw validationError(`字段 ${path} 不是合法时间`);
      return text;
    }),
    consentVersion: asString(raw.consent_version, 'consent_version', { min: 1, max: 40 }),
    consentMode: asEnum<ConsentMode>(raw.consent_mode, 'consent_mode', CONSENT_MODE_VALUES),
    feedbackText: asNullable<string>(raw.feedback_text, 'feedback_text', (inner, path) =>
      asString(inner, path, { min: 1, max: 500 }),
    ),
    followupToken: asNullable<string>(raw.followup_token, 'followup_token', (inner, path) =>
      asString(inner, path, { pattern: FOLLOWUP_TOKEN_PATTERN }),
    ),
  };
}
