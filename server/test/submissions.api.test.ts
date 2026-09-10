import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getDb } from '../src/repositories/db.js';
import { countSubmissions } from '../src/repositories/submissions.repository.js';
import { postJson, sampleSubmission, setupTestEnv, withServer } from './helpers.js';

interface SubmissionEnvelope {
  code: number;
  data: {
    record_id: string;
    total_score: number;
    band: string;
    band_basis: string;
    n_at_scoring: number;
    quality_flags: string[];
  };
  message: string;
}

describe('POST /api/v1/submissions', () => {
  it('正常提交返回 201，且服务端算分正确（总分 33 / safe 档）', async () => {
    setupTestEnv();
    await withServer(async (base) => {
      const response = await postJson<SubmissionEnvelope>(
        base,
        '/api/v1/submissions',
        sampleSubmission(),
      );

      assert.equal(response.status, 201);
      assert.equal(response.body.code, 0);
      assert.equal(response.body.data.total_score, 33);
      assert.equal(response.body.data.band, 'safe');
      assert.equal(response.body.data.band_basis, 'prior');
      assert.deepEqual(response.body.data.quality_flags, []);
      assert.match(response.body.data.record_id, /^R[0-9A-F]{8}$/);

      const row = getDb().prepare('SELECT * FROM submissions').get() as Record<string, unknown>;
      assert.equal(row.total_score, 33);
      assert.equal(row.factor_a_score, 12);
      assert.equal(row.factor_b_score, 9);
      assert.equal(row.factor_c_score, 12);
      assert.equal(row.q_a2_raw, 3);
      assert.equal(row.q_a2_scored, 3);
      assert.equal(row.q_b1_raw, 2);
      assert.equal(row.q_b1_scored, 4);
      assert.equal(row.q_b3_raw, 4);
      assert.equal(row.q_b3_scored, 2);
      assert.equal(row.max_score, 45);
      assert.equal(row.schema_version, 2);
      assert.equal(row.straightlining_flag, 0);
      assert.equal(row.rapid_flag, 0);
      assert.equal(row.s4_adoption_type, 'self');
    });
  });

  it('strata enum 非法值返回 400（code 1001）', async () => {
    setupTestEnv();
    await withServer(async (base) => {
      const payload = sampleSubmission();
      (payload.strata as Record<string, unknown>).S2 = 'gt10y';
      const response = await postJson(base, '/api/v1/submissions', payload);
      assert.equal(response.status, 400);
      assert.equal((response.body as { code: number }).code, 1001);
      assert.equal(countSubmissions(), 0);
    });
  });

  it('题原始分越界返回 400（code 1001）', async () => {
    setupTestEnv();
    await withServer(async (base) => {
      const payload = sampleSubmission();
      (payload.answers as Record<string, unknown>).C3 = 9;
      const response = await postJson(base, '/api/v1/submissions', payload);
      assert.equal(response.status, 400);
      assert.equal(countSubmissions(), 0);
    });
  });

  it('同 session 同软件再次提交打 duplicate_software 标记（不拦截）', async () => {
    setupTestEnv();
    await withServer(async (base) => {
      const first = await postJson<SubmissionEnvelope>(base, '/api/v1/submissions', sampleSubmission());
      assert.equal(first.status, 201);
      const second = await postJson<SubmissionEnvelope>(
        base,
        '/api/v1/submissions',
        sampleSubmission({ sequence_index: 2 }),
      );
      assert.equal(second.status, 201);
      assert.deepEqual(second.body.data.quality_flags, ['duplicate_software']);
    });
  });
});
