import { loadConfig } from '../config/env.js';
import { insertFollowup } from '../repositories/followups.repository.js';
import type { FollowupInput } from '../types/index.js';
import { encryptContact, hasEncryptionKey } from '../utils/crypto.js';
import { internalError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { newId } from '../utils/sanitize.js';

/**
 * 回访联系方式登记（ADR-010）：写入物理分表，联系方式加密存储。
 * 不写 session_id、不写任何答题内容——本表与主表仅靠客户端生成的随机 token 关联。
 */

const PURGE_AFTER_MONTHS = 12;

export function registerFollowup(input: FollowupInput): void {
  const config = loadConfig();
  if (!hasEncryptionKey(config.contactEncryptionKey)) {
    logger.error('followup.missing_encryption_key');
    throw internalError();
  }

  const createdAt = new Date();
  const purgeAt = new Date(createdAt);
  purgeAt.setMonth(purgeAt.getMonth() + PURGE_AFTER_MONTHS);

  const inserted = insertFollowup({
    id: newId(),
    followup_token: input.followupToken,
    contact_encrypted: encryptContact(input.contact, config.contactEncryptionKey),
    created_at: createdAt.toISOString(),
    consent_version: input.consentVersion,
    band: input.band,
    contact_purge_after: purgeAt.toISOString(),
  });
  if (!inserted) {
    logger.warn('followup.duplicate_token_ignored');
    return;
  }
  logger.info('followup.registered', { band: input.band });
}
