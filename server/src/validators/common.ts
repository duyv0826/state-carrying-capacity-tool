import { validationError } from '../utils/errors.js';

/**
 * 极简请求体校验（不引入 zod 等依赖）。
 * 全部走白名单：类型、长度、枚举、区间逐项检查，任何一项不符直接 400 / 1001。
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface StringOptions {
  min?: number;
  max?: number;
  pattern?: RegExp;
}

export function asObject(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw validationError(`字段 ${path} 必须是对象`);
  }
  return value as Record<string, unknown>;
}

export function asString(value: unknown, path: string, options: StringOptions = {}): string {
  if (typeof value !== 'string') throw validationError(`字段 ${path} 必须是字符串`);
  const trimmed = options.pattern ? value : value.trim();
  const length = Array.from(trimmed).length;
  if (options.min !== undefined && length < options.min) {
    throw validationError(`字段 ${path} 长度不足 ${options.min}`);
  }
  if (options.max !== undefined && length > options.max) {
    throw validationError(`字段 ${path} 长度超过 ${options.max}`);
  }
  if (options.pattern && !options.pattern.test(trimmed)) {
    throw validationError(`字段 ${path} 格式不合法`);
  }
  return trimmed;
}

export function asInt(
  value: unknown,
  path: string,
  options: { min?: number; max?: number } = {},
): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw validationError(`字段 ${path} 必须是整数`);
  }
  if (options.min !== undefined && value < options.min) {
    throw validationError(`字段 ${path} 不得小于 ${options.min}`);
  }
  if (options.max !== undefined && value > options.max) {
    throw validationError(`字段 ${path} 不得大于 ${options.max}`);
  }
  return value;
}

export function asBoolean(value: unknown, path: string, fallback = false): boolean {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'boolean') throw validationError(`字段 ${path} 必须是布尔值`);
  return value;
}

export function asEnum<T extends string>(
  value: unknown,
  path: string,
  allowed: readonly T[],
): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw validationError(`字段 ${path} 取值必须是 ${allowed.join(' / ')} 之一`);
  }
  return value as T;
}

/** null / undefined -> null；否则交给传入的校验函数。 */
export function asNullable<T>(
  value: unknown,
  path: string,
  parse: (inner: unknown, innerPath: string) => T,
): T | null {
  if (value === undefined || value === null) return null;
  return parse(value, path);
}

export function asUuid(value: unknown, path: string): string {
  return asString(value, path, { pattern: UUID_PATTERN });
}

export function asDateTime(value: unknown, path: string): string {
  const text = asString(value, path, { max: 40 });
  if (Number.isNaN(Date.parse(text))) throw validationError(`字段 ${path} 不是合法时间`);
  return text;
}
