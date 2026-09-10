import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getDb } from '../src/repositories/db.js';
import { countSubmissions } from '../src/repositories/submissions.repository.js';
import { postJson, sampleSubmission, setupTestEnv, withServer } from './helpers.js';

/** AC-08 蜜罐：hp 非空返回成功状态码，但数据库不新增任何记录。 */

interface SilentEnvelope {
  code: number;
  data: null;
  message: string;
}

describe('POST /api/v1/submissions 蜜罐（AC-08）', () => {
  it('hp 非空时返回 200 且不落库', async () => {
    setupTestEnv();
    await withServer(async (base) => {
      const response = await postJson<SilentEnvelope>(
        base,
        '/api/v1/submissions',
        sampleSubmission({ hp: 'bot' }),
      );

      assert.equal(response.status, 200);
      assert.equal(response.body.code, 2002);
      assert.equal(countSubmissions(), 0);
      assert.equal(
        (getDb().prepare('SELECT COUNT(*) AS c FROM submissions').get() as { c: number }).c,
        0,
      );
    });
  });

  it('蜜罐判定优先于落库：即使请求体其它字段合法也不写库', async () => {
    setupTestEnv();
    await withServer(async (base) => {
      const response = await postJson<SilentEnvelope>(
        base,
        '/api/v1/submissions',
        sampleSubmission({ hp: 'x', software_name: 'Photoshop' }),
      );
      assert.equal(response.status, 200);
      assert.equal(countSubmissions(), 0);
    });
  });
});

describe('POST /api/v1/abandon 蜜罐（AC-08）', () => {
  it('hp 非空时返回 200 且不落库', async () => {
    setupTestEnv();
    await withServer(async (base) => {
      const response = await postJson<SilentEnvelope>(base, '/api/v1/abandon', {
        session_id: '8f14e45f-ceea-467a-9542-5b1c0a5f7d21',
        schema_version: 2,
        last_question_index: 4,
        hp: 'spam',
      });
      assert.equal(response.status, 200);
      assert.equal(response.body.code, 2002);
      assert.equal(
        (getDb().prepare('SELECT COUNT(*) AS c FROM abandon_events').get() as { c: number }).c,
        0,
      );
    });
  });
});
