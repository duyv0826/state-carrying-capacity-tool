import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getDb } from '../src/repositories/db.js';
import {
  postJson,
  sampleAbandon,
  sampleFollowup,
  sampleSubmission,
  setupTestEnv,
  withServer,
} from './helpers.js';

/**
 * AC-09 采集开关：COLLECTION_ENABLED=false 时三个采集端点仍返回成功状态码，
 * 但零落库（工具核心流程不受影响——本服务不参与结果计算）。
 */

interface Envelope {
  code: number;
  data: unknown;
  message: string;
}

function countOf(table: string): number {
  return (getDb().prepare(`SELECT COUNT(*) AS c FROM ${table}`).get() as { c: number }).c;
}

describe('collection_enabled = false', () => {
  it('三个采集端点全部返回成功状态码且零落库', async () => {
    setupTestEnv({ COLLECTION_ENABLED: 'false' });
    await withServer(async (base) => {
      const submission = await postJson<Envelope>(base, '/api/v1/submissions', sampleSubmission());
      const abandon = await postJson<Envelope>(base, '/api/v1/abandon', sampleAbandon());
      const followup = await postJson<Envelope>(base, '/api/v1/followups', sampleFollowup());

      for (const response of [submission, abandon, followup]) {
        assert.equal(response.status, 200, '采集关闭时仍返回成功状态码');
        assert.equal(response.body.code, 3001);
      }

      assert.equal(countOf('submissions'), 0);
      assert.equal(countOf('abandon_events'), 0);
      assert.equal(countOf('followups'), 0);
    });
  });

  it('GET /api/v1/config 如实上报 collection_enabled=false', async () => {
    setupTestEnv({ COLLECTION_ENABLED: 'false' });
    await withServer(async (base) => {
      const response = await fetch(`${base}/api/v1/config`);
      const body = (await response.json()) as {
        code: number;
        data: { collection_enabled: boolean; schema_version: number; max_score: number };
      };
      assert.equal(response.status, 200);
      assert.equal(body.data.collection_enabled, false);
      assert.equal(body.data.schema_version, 2);
      assert.equal(body.data.max_score, 45);
    });
  });
});
