/**
 * 内存限流器（ARCHITECTURE §3.8 网络层 / 会话层 / 全局层）。
 * 隐私硬约束：IP 仅作为内存哈希键参与计数，进程退出即消失，绝不落库、绝不写日志（ADR-008）。
 */

interface Bucket {
  hits: number[];
  windowMs: number;
}

export interface RateRule {
  limit: number;
  windowMs: number;
}

export class MemoryRateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly timer: NodeJS.Timeout;

  constructor(private readonly sweepIntervalMs = 60_000) {
    this.timer = setInterval(() => this.sweep(), this.sweepIntervalMs);
    this.timer.unref();
  }

  /**
   * 固定窗口计数。返回 true 表示允许通过（未超限）。
   * @param key 内存键（IP 哈希 / session_id / 全局常量）
   */
  tryConsume(key: string, rule: RateRule): boolean {
    const now = Date.now();
    const { limit, windowMs } = rule;
    const bucketKey = `${key}:${windowMs}`;
    const bucket = this.buckets.get(bucketKey);
    if (!bucket) {
      this.buckets.set(bucketKey, { hits: [now], windowMs });
      return true;
    }
    const cutoff = now - bucket.windowMs;
    bucket.hits = bucket.hits.filter((ts) => ts > cutoff);
    if (bucket.hits.length >= limit) return false;
    bucket.hits.push(now);
    return true;
  }

  /** 需在多个窗口（如每分钟 + 每小时）全部通过。 */
  tryConsumeAll(key: string, rules: readonly RateRule[]): boolean {
    for (const rule of rules) {
      if (!this.tryConsume(key, rule)) return false;
    }
    return true;
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, bucket] of this.buckets) {
      if (bucket.hits.every((ts) => ts <= now - bucket.windowMs)) {
        this.buckets.delete(key);
      }
    }
  }

  dispose(): void {
    clearInterval(this.timer);
    this.buckets.clear();
  }
}
