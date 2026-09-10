import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * 联系方式加密存储（ADR-010）：密钥来自环境变量 CONTACT_ENCRYPTION_KEY，不进代码库。
 * 格式：v1.<iv_b64>.<tag_b64>.<ciphertext_b64>（AES-256-GCM）
 */

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;

function deriveKey(secret: string): Buffer {
  return createHash('sha256').update(secret, 'utf8').digest().subarray(0, KEY_LENGTH);
}

export function hasEncryptionKey(secret: string): boolean {
  return secret.trim().length > 0;
}

export function encryptContact(plaintext: string, secret: string): string {
  const key = deriveKey(secret);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64'), tag.toString('base64'), ciphertext.toString('base64')].join(
    '.',
  );
}

export function decryptContact(payload: string, secret: string): string {
  const [version, ivB64, tagB64, dataB64] = payload.split('.');
  if (version !== 'v1' || !ivB64 || !tagB64 || !dataB64) {
    throw new Error('联系方式密文格式不正确');
  }
  const decipher = createDecipheriv(ALGORITHM, deriveKey(secret), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

/** 常量时间比较，避免令牌比较被计时侧信道利用。 */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * IP 内存哈希键：加当日盐，使键不可跨天关联，且仅存在于内存（ADR-008）。
 * 仅用于限流计数，不落库、不写日志。
 */
export function ipMemoryKey(ip: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return createHash('sha256').update(`${day}:${ip}`).digest('hex').slice(0, 16);
}

/** 自由文本中的身份信息扫描（ARCHITECTURE §3.7）：命中则提示人工复核。 */
const PII_PATTERNS: readonly { name: string; pattern: RegExp }[] = [
  { name: 'phone_cn', pattern: /1[3-9]\d{9}/ },
  { name: 'email', pattern: /[\w.+-]+@[\w-]+\.[\w.]+/ },
  { name: 'id_card', pattern: /\b\d{17}[\dXx]\b/ },
  { name: 'wechat_like', pattern: /\b(?:wx|weixin|微信)\s*[:：]?\s*[\w-]{5,}\b/i },
];

export function scanPii(text: string | null): string[] {
  if (!text) return [];
  return PII_PATTERNS.filter((item) => item.pattern.test(text)).map((item) => item.name);
}
