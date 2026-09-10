import { loadConfig } from '../config/env.js';
import { resolveBand, type Band } from '../domain/bands.js';
import { MAX_SCORE, QUESTIONS, SCHEMA_VERSION } from '../domain/questions.js';
import {
  hasSameSoftwareInSession,
  insertSubmission,
  type SubmissionInsert,
} from '../repositories/submissions.repository.js';
import type {
  SubmissionInput,
  SubmissionResultPayload,
} from '../types/index.js';
import { newId, isNameValid, normalizeSoftwareName, sanitizeSoftwareName, toRecordId } from '../utils/sanitize.js';
import { invalidSoftwareNameError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { currentCalibration } from './calibration.service.js';
import { detectQualityFlags, scoreAnswers } from './scoring.service.js';

/**
 * 提交落库流程（AC-07）：清洗 -> 服务端算分 -> 判档 -> 质量标记 -> 落库。
 * 采集开关与蜜罐判定在 controller 层完成，service 只处理"确认要写"的用例。
 */

export function createSubmission(input: SubmissionInput): SubmissionResultPayload {
  const config = loadConfig();

  const { value: softwareName, changed: nameChanged } = sanitizeSoftwareName(input.softwareName);
  if (!isNameValid(softwareName)) {
    throw invalidSoftwareNameError('软件名非法：为空、超长或含过多重复字符');
  }
  const softwareNameNorm = normalizeSoftwareName(softwareName);

  const score = scoreAnswers(input.answers);
  const { calibration, n } = currentCalibration(SCHEMA_VERSION);
  const band: Band = resolveBand(score.totalScore, calibration);

  const flags = detectQualityFlags({
    straightlining: score.straightlining,
    durationMs: input.durationMs,
    rapidThresholdMs: config.rapidFlagThresholdMs,
    duplicateSoftware: hasSameSoftwareInSession(input.sessionId, softwareNameNorm),
    invalidName: nameChanged,
  });

  const id = newId();
  const createdAt = new Date().toISOString();
  const row: SubmissionInsert = {
    id,
    session_id: input.sessionId,
    created_at: createdAt,
    client_submitted_at: input.clientSubmittedAt,
    schema_version: SCHEMA_VERSION,
    max_score: MAX_SCORE,
    consent_version: input.consentVersion,
    consent_mode: input.consentMode,
    software_name: softwareName,
    software_name_norm: softwareNameNorm,
    software_category: input.softwareCategory,
    is_custom_input: input.isCustomInput ? 1 : 0,
    factor_a_score: score.factors.A,
    factor_b_score: score.factors.B,
    factor_c_score: score.factors.C,
    total_score: score.totalScore,
    band,
    band_basis: calibration.method,
    n_at_scoring: n,
    s1_learning_type: input.strata.S1,
    s2_tenure_bucket: input.strata.S2,
    s3_frequency_bucket: input.strata.S3,
    s4_adoption_type: input.strata.S4,
    duration_ms: input.durationMs,
    device_type: input.deviceType,
    ua_family: input.uaFamily,
    source: input.source,
    region_bucket: input.regionBucket,
    sequence_index: input.sequenceIndex,
    straightlining_flag: score.straightlining ? 1 : 0,
    rapid_flag: input.durationMs < config.rapidFlagThresholdMs ? 1 : 0,
    quality_flags: JSON.stringify(flags),
    feedback_text: input.feedbackText,
    followup_token: input.followupToken,
    excluded: 0,
  };
  for (const question of QUESTIONS) {
    const key = question.key.toLowerCase();
    row[`q_${key}_raw`] = input.answers[question.key];
    row[`q_${key}_scored`] = score.scored[question.key];
  }

  insertSubmission(row);
  logger.info('submission.created', {
    band,
    band_basis: calibration.method,
    total_score: score.totalScore,
    quality_flags: flags,
  });

  return {
    record_id: toRecordId(id),
    total_score: score.totalScore,
    band,
    band_basis: calibration.method,
    n_at_scoring: n,
    quality_flags: flags,
  };
}
