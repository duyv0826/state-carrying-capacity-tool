import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getBuffer,
  getJson,
  getText,
  postJson,
  sampleSubmission,
  setupTestEnv,
  withServer,
} from './helpers.js';

/** 管理员端点：X-Admin-Token 鉴权 + 导出排除 token/id 列（ADR-010）。 */

const TOKEN = { 'X-Admin-Token': 'test-admin-token' };

describe('GET /api/v1/admin/export', () => {
  it('无令牌返回 401（code 4001）', async () => {
    setupTestEnv();
    await withServer(async (base) => {
      const response = await getText(base, '/api/v1/admin/export');
      assert.equal(response.status, 401);
    });
  });

  it('错误令牌返回 401', async () => {
    setupTestEnv();
    await withServer(async (base) => {
      const response = await getText(base, '/api/v1/admin/export', {
        'X-Admin-Token': 'wrong-token',
      });
      assert.equal(response.status, 401);
    });
  });

  it('CSV 导出带 BOM，且不含 id / followup_token 列', async () => {
    setupTestEnv();
    await withServer(async (base) => {
      await postJson(
        base,
        '/api/v1/submissions',
        sampleSubmission({ followup_token: 'a1b2c3d4e5f60718293a4b5c6d7e8f90' }),
      );
      const response = await getBuffer(base, '/api/v1/admin/export?format=csv', TOKEN);
      assert.equal(response.status, 200);
      // UTF-8 BOM = EF BB BF（坑 W10：不带 BOM 时 Excel 打开中文乱码）
      assert.deepEqual([...response.buffer.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
      const text = response.buffer.subarray(3).toString('utf8');
      const header = (text.split('\r\n')[0] ?? '').split(',');
      assert.ok(header.includes('record_id'));
      assert.ok(header.includes('q_a1_raw'));
      assert.ok(header.includes('q_a1_scored'));
      assert.equal(header.includes('followup_token'), false);
      assert.equal(header.includes('id'), false);
    });
  });

  it('JSON 导出为数组，且不含 id / followup_token 键', async () => {
    setupTestEnv();
    await withServer(async (base) => {
      await postJson(
        base,
        '/api/v1/submissions',
        sampleSubmission({ followup_token: 'a1b2c3d4e5f60718293a4b5c6d7e8f90' }),
      );
      const response = await getText(base, '/api/v1/admin/export?format=json', TOKEN);
      const rows = JSON.parse(response.body) as Record<string, unknown>[];
      assert.ok(Array.isArray(rows));
      assert.equal(rows.length, 1);
      const keys = Object.keys(rows[0] ?? {});
      assert.equal(keys.includes('followup_token'), false);
      assert.equal(keys.includes('id'), false);
      assert.equal(rows[0]?.total_score, 33);
    });
  });

  it('长表导出为 record_id / question_id / raw / scored 四列', async () => {
    setupTestEnv();
    await withServer(async (base) => {
      await postJson(base, '/api/v1/submissions', sampleSubmission());
      const response = await getText(base, '/api/v1/admin/export?format=json&shape=long', TOKEN);
      const rows = JSON.parse(response.body) as Record<string, unknown>[];
      assert.equal(rows.length, 9);
      assert.deepEqual(Object.keys(rows[0] ?? {}), ['record_id', 'question_id', 'raw', 'scored']);
    });
  });
});

describe('GET /api/v1/admin/codebook', () => {
  it('无令牌返回 401；有令牌返回变量字典', async () => {
    setupTestEnv();
    await withServer(async (base) => {
      const denied = await getJson(base, '/api/v1/admin/codebook');
      assert.equal(denied.status, 401);

      const allowed = await getJson<{
        code: number;
        data: { schema_version: number; variables: { name: string; reverse_coded?: boolean }[] };
      }>(base, '/api/v1/admin/codebook', TOKEN);
      assert.equal(allowed.status, 200);
      assert.equal(allowed.body.code, 0);
      assert.equal(allowed.body.data.schema_version, 2);
      const names = allowed.body.data.variables.map((variable) => variable.name);
      assert.ok(names.includes('q_a1_raw'));
      assert.ok(names.includes('q_a2_scored'));
      assert.ok(names.includes('band'));
      assert.equal(names.includes('followup_token'), false);
      const a2 = allowed.body.data.variables.find((variable) => variable.name === 'q_a2_raw');
      assert.equal(a2?.reverse_coded, true);
    });
  });
});
