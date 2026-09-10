import { createHash, randomUUID } from 'node:crypto';

/**
 * 软件名清洗与短码派生。
 * 清洗规则（ARCHITECTURE §3.8 内容层）：长度 ≤ 60、字符白名单、重复字符 ≤ 10。
 */

const MAX_NAME_LENGTH = 60;
const MAX_REPEATED_CHAR = 10;

/** 允许：中英文、数字、常见标点与空格。其余字符一律剔除。 */
const ALLOWED_NAME_PATTERN = /[^\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}a-zA-Z0-9\s+\-_.&/'()（）·]/gu;

export interface SanitizedName {
  value: string;
  /** 清洗是否改变了原始输入（用于 invalid_name 质量标记）。 */
  changed: boolean;
}

export function sanitizeSoftwareName(input: string): SanitizedName {
  const collapsed = input.replace(/\s+/g, ' ').trim();
  const cleaned = collapsed.replace(ALLOWED_NAME_PATTERN, '').trim();
  const truncated = Array.from(cleaned).slice(0, MAX_NAME_LENGTH).join('');
  return {
    value: truncated,
    changed: truncated !== collapsed || truncated === '',
  };
}

export function isNameValid(name: string): boolean {
  if (name.length === 0 || name.length > MAX_NAME_LENGTH) return false;
  return !hasExcessiveRepeat(name);
}

function hasExcessiveRepeat(name: string): boolean {
  const chars = Array.from(name);
  let run = 1;
  for (let i = 1; i < chars.length; i += 1) {
    if (chars[i] === chars[i - 1]) {
      run += 1;
      if (run > MAX_REPEATED_CHAR) return true;
    } else {
      run = 1;
    }
  }
  return false;
}

/** 归一化：小写、去空格、去标点，用于聚合与重复提交判定。 */
export function normalizeSoftwareName(name: string): string {
  return name
    .toLowerCase()
    .replace(ALLOWED_NAME_PATTERN, '')
    .replace(/\s+/g, '')
    .slice(0, MAX_NAME_LENGTH);
}

/**
 * 导出用短码：由服务端 UUID 主键单向派生（sha256 前 8 字节）。
 * 目的（ADR-010）：导出数据集不含 id，也不含可跨表还原身份的关联键。
 */
export function toRecordId(id: string): string {
  return `R${createHash('sha256').update(id).digest('hex').slice(0, 8).toUpperCase()}`;
}

export function newId(): string {
  return randomUUID();
}
