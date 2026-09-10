import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getDb } from '../src/repositories/db.js';
import { postJson, sampleFollowup, sampleSubmission, setupTestEnv, withServer } from './helpers.js';

/**
 * AC-10 / ADR-008 / ADR-010 隐私最小化：
 * - IP 仅在内存参与限流，绝不落库 -> 表结构中不存在任何 IP 相关字段
 * - 地区来自被试自愿填写（region_bucket），不由 IP 推断
 * - 联系方式物理分表，导出时排除 token 列
 */

const IP_LIKE = /(^|_)(ip|ipv4|ipv6|ip_addr|ip_address|remote_addr|client_ip|address)(_|$)|addr|remote/i;

function columnsOf(table: string): string[] {
  const rows = getDb().prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return rows.map((row) => row.name);
}

function tableNames(): string[] {
  const rows = getDb()
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
    .all() as { name: string }[];
  return rows.map((row) => row.name).sort();
}

describe('落库后查库：无任何 IP 字段（AC-10）', () => {
  it('submissions / abandon_events / followups 三表均无 IP 类字段', async () => {
    setupTestEnv();
    await withServer(async (base) => {
      await postJson(base, '/api/v1/submissions', sampleSubmission({ region_bucket: '华南' }));
      await postJson(base, '/api/v1/abandon', {
        session_id: '8f14e45f-ceea-467a-9542-5b1c0a5f7d21',
        schema_version: 2,
        last_question_index: 7,
        hp: '',
      });

      for (const table of ['submissions', 'abandon_events', 'followups']) {
        const columns = columnsOf(table);
        const offenders = columns.filter((column) => IP_LIKE.test(column));
        assert.deepEqual(offenders, [], `表 ${table} 出现 IP 类字段: ${offenders.join(', ')}`);
      }
    });
  });

  it('submissions 整行数据不含 IP 值，地区来自被试填写', async () => {
    setupTestEnv();
    await withServer(async (base) => {
      await postJson(
        base,
        '/api/v1/submissions',
        sampleSubmission({ region_bucket: '华东', device_type: 'mobile' }),
      );
      const row = getDb().prepare('SELECT * FROM submissions').get() as Record<string, unknown>;
      assert.equal(row.region_bucket, '华东');
      for (const [key, value] of Object.entries(row)) {
        assert.equal(IP_LIKE.test(key), false, `字段 ${key} 疑似 IP 字段`);
        if (typeof value === 'string') {
          assert.doesNotMatch(value, /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, `字段 ${key} 含 IP 值`);
        }
      }
      // device_type 由前端粗判上报，服务端不读 UA —— 表中无 ua 原文字段
      assert.equal('user_agent' in row, false);
      assert.equal('ua' in row, false);
    });
  });
});

describe('联系方式物理分表（ADR-010）', () => {
  it('followups 独立成表且不含 session_id / 答题字段', async () => {
    setupTestEnv();
    await withServer(async (base) => {
      await postJson(base, '/api/v1/followups', sampleFollowup());
      const tables = tableNames();
      assert.ok(tables.includes('followups'));
      const columns = columnsOf('followups');
      assert.equal(columns.includes('session_id'), false);
      assert.equal(columns.includes('software_name'), false);
      assert.equal(columns.includes('total_score'), false);
      assert.ok(columns.includes('contact_encrypted'));

      const row = getDb().prepare('SELECT * FROM followups').get() as Record<string, unknown>;
      // 明文联系方式不落库
      assert.notEqual(row.contact_encrypted, 'someone@example.com');
      assert.match(String(row.contact_encrypted), /^v1\..+/);
      // 主表中不含任何联系方式
      const submissionColumns = columnsOf('submissions');
      assert.equal(submissionColumns.includes('contact'), false);
      assert.equal(submissionColumns.includes('email'), false);
    });
  });

  it('重复 token 重试按幂等处理：仍返回 201，只保留一条记录', async () => {
    setupTestEnv();
    await withServer(async (base) => {
      const first = await postJson(base, '/api/v1/followups', sampleFollowup());
      const retry = await postJson(base, '/api/v1/followups', sampleFollowup());
      assert.equal(first.status, 201);
      assert.equal(retry.status, 201);
      assert.equal(
        (getDb().prepare('SELECT COUNT(*) AS c FROM followups').get() as { c: number }).c,
        1,
      );
    });
  });
});
