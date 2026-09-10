import { honeypotError } from '../utils/errors.js';

/**
 * AC-08 蜜罐：hp 为 CSS 隐藏字段，正常用户不可见。
 * 非空 -> 疑似机器人 -> 返回成功状态码但绝不写库。
 */
export function checkHoneypot(body: unknown): void {
  if (typeof body !== 'object' || body === null) return;
  const hp = (body as { hp?: unknown }).hp;
  if (hp === undefined || hp === null) return;
  if (typeof hp !== 'string' || hp.length > 0) throw honeypotError();
}
