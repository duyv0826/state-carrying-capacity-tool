import { BAND_VALUES, type Band } from '../domain/bands.js';
import type { FollowupInput } from '../types/index.js';
import { asEnum, asNullable, asObject, asString } from './common.js';

const FOLLOWUP_TOKEN_PATTERN = /^[0-9a-f]{32}$/;

/** POST /api/v1/followups 请求体校验（openapi：followup_token / contact / consent_version 必填）。 */
export function parseFollowupRequest(body: unknown): FollowupInput {
  const raw = asObject(body, 'body');
  return {
    followupToken: asString(raw.followup_token, 'followup_token', {
      pattern: FOLLOWUP_TOKEN_PATTERN,
    }),
    contact: asString(raw.contact, 'contact', { min: 1, max: 120 }),
    band: asNullable<Band>(raw.band, 'band', (inner, path) => asEnum<Band>(inner, path, BAND_VALUES)),
    consentVersion: asString(raw.consent_version, 'consent_version', { min: 1, max: 40 }),
  };
}
