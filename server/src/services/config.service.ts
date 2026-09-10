import { loadConfig } from '../config/env.js';
import { SCHEMA_VERSION } from '../domain/questions.js';
import { countSubmissions } from '../repositories/submissions.repository.js';
import { currentCalibration } from './calibration.service.js';

/**
 * GET /api/v1/config 载荷（openapi ConfigPayload）。
 * 前端据此决定是否采集、用哪套知情同意文案、展示多少样本量。
 */

export interface ConfigPayload {
  collection_enabled: boolean;
  consent_version: string;
  consent_mode: string;
  schema_version: number;
  max_score: number;
  calibration: {
    method: string;
    n: number;
    p33: number | null;
    p67: number | null;
    computed_at: string;
  };
  total_count: number;
}

export function getRuntimeConfig(): ConfigPayload {
  const config = loadConfig();
  const { calibration } = currentCalibration(SCHEMA_VERSION);
  const maxScore = SCHEMA_VERSION === 2 ? 45 : 40;
  return {
    collection_enabled: config.collectionEnabled,
    consent_version: config.consentVersion,
    consent_mode: config.consentMode,
    schema_version: SCHEMA_VERSION,
    max_score: maxScore,
    calibration: {
      method: calibration.method,
      n: calibration.n,
      p33: calibration.p33,
      p67: calibration.p67,
      computed_at: calibration.computedAt,
    },
    total_count: countSubmissions(),
  };
}
