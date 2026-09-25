/**
 * 真机端到端验证（E2E）：启动真实 dist 进程 + 真实 SQLite 文件，走完整 HTTP 链路。
 *
 * 与 test/*.test.ts 的区别：那些是进程内 Express app + 内存/临时库；本脚本验证的是
 * 「node dist/index.js 真起来之后，客户端能否提交并凭 record_id 取回结果」，
 * 覆盖构建产物、进程装配、SQLite 文件持久化三个单测覆盖不到的环节。
 *
 * 运行：npm run e2e（会先 build）
 *
 * 限流约束（memory 限流器，单 IP 10 次/分钟）：本脚本每个服务实例只打 2-3 次请求，
 * 且每个实例是独立进程（限流计数不共享），不会触发 2001。
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const serverRoot = join(here, '..');
const entry = join(serverRoot, 'dist', 'index.js');

const results = [];
let failed = 0;

function check(name, condition, detail) {
  if (condition) {
    results.push(`  PASS  ${name}`);
  } else {
    failed += 1;
    results.push(`  FAIL  ${name}${detail ? ` -> ${detail}` : ''}`);
  }
}

/** 启动一个真实服务进程，等待 stdout 出现 server.started 后返回句柄。 */
function startServer({ port, dbPath, collectionEnabled }) {
  const child = spawn(process.execPath, [entry], {
    cwd: serverRoot,
    env: {
      ...process.env,
      PORT: String(port),
      DB_PATH: dbPath,
      COLLECTION_ENABLED: collectionEnabled ? 'true' : 'false',
      ADMIN_TOKEN: 'e2e-admin-token',
      CONTACT_ENCRYPTION_KEY: 'e2e-contact-key',
      CONSENT_VERSION: 'v1.0-2026-09',
      CONSENT_MODE: 'implied',
      CORS_ORIGINS: 'http://localhost:5173',
      RAPID_FLAG_THRESHOLD_MS: '12000',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('服务启动超时（10s）')), 10_000);
    let buf = '';
    child.stdout.on('data', (chunk) => {
      buf += chunk.toString();
      if (buf.includes('"event":"server.started"')) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.stderr.on('data', (chunk) => {
      buf += chunk.toString();
      if (buf.includes('"event":"server.started"')) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`服务进程提前退出，code=${code}\n${buf}`));
    });
  });

  return {
    ready,
    async stop() {
      child.kill('SIGINT');
      await new Promise((r) => {
        child.on('exit', r);
        setTimeout(() => {
          child.kill('SIGKILL');
          r();
        }, 3000);
      });
    },
  };
}

async function post(base, path, payload) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { status: res.status, body: await res.json() };
}

async function get(base, path) {
  const res = await fetch(`${base}${path}`);
  return { status: res.status, body: await res.json() };
}

function sampleSubmission(overrides = {}) {
  return {
    session_id: '8f14e45f-ceea-467a-9542-5b1c0a5f7d21',
    schema_version: 2,
    software_name: 'Figma',
    software_category: 'design',
    is_custom_input: false,
    answers: { A1: 4, A2: 3, A3: 5, B1: 2, B2: 3, B3: 4, C1: 5, C2: 4, C3: 3 },
    strata: { S1: 'C', S2: '2y_5y', S3: 'daily', S4: 'self' },
    region_bucket: null,
    duration_ms: 38200,
    sequence_index: 1,
    device_type: 'desktop',
    ua_family: null,
    source: null,
    client_submitted_at: '2026-09-26T00:10:00+08:00',
    consent_version: 'v1.0-2026-09',
    consent_mode: 'implied',
    feedback_text: null,
    followup_token: null,
    hp: '',
    ...overrides,
  };
}

const tmp = mkdtempSync(join(tmpdir(), 'scc-e2e-'));
const dbPath = join(tmp, 'e2e.db');
const portA = 38101;
const portB = 38102;
const portC = 38103;

try {
  // ---- 阶段 A：采集开启，提交 + 凭 record_id 取回 + 令牌不存在 ----
  results.push('阶段 A · 采集开启（真实进程 + 真实 SQLite 文件）');
  const serverA = startServer({ port: portA, dbPath, collectionEnabled: true });
  await serverA.ready;
  const baseA = `http://127.0.0.1:${portA}`;

  const created = await post(baseA, '/api/v1/submissions', sampleSubmission());
  check(
    'POST /api/v1/submissions 返回 201 且 code=0',
    created.status === 201 && created.body.code === 0,
    JSON.stringify(created.body),
  );
  const view0 = created.body.data ?? {};
  check('服务端算分正确（总分 33 / safe 档）', view0.total_score === 33 && view0.band === 'safe', JSON.stringify(view0));
  check('返回 record_id 令牌（R + 8 位十六进制大写）', /^R[0-9A-F]{8}$/.test(view0.record_id ?? ''), view0.record_id);

  const fetched = await get(baseA, `/api/v1/submissions/${view0.record_id}`);
  const v = fetched.body.data ?? {};
  check('GET /api/v1/submissions/:recordId 返回 200 且 code=0', fetched.status === 200 && fetched.body.code === 0, JSON.stringify(fetched.body));
  check('取回结果与提交一致（record_id / 软件名 / 总分 / 档位）',
    v.record_id === view0.record_id && v.software_name === 'Figma' && v.total_score === 33 && v.band === 'safe',
    JSON.stringify(v));
  check('取回视图含三因子分（A=12 / B=9 / C=12）',
    v.factor_a_score === 12 && v.factor_b_score === 9 && v.factor_c_score === 12, JSON.stringify(v));
  check('取回视图不含可识别字段（无 session_id / q_*_raw / feedback_text）',
    !('session_id' in v) && !('q_a1_raw' in v) && !('feedback_text' in v), Object.keys(v).join(','));

  const missing = await get(baseA, '/api/v1/submissions/R00000000');
  check('令牌不存在时返回 404 + code 4040', missing.status === 404 && missing.body.code === 4040, JSON.stringify(missing.body));

  await serverA.stop();

  // ---- 阶段 B：采集关闭，POST / GET 均静默成功且不落库 ----
  results.push('阶段 B · 采集关闭（COLLECTION_ENABLED=false）');
  const serverB = startServer({ port: portB, dbPath, collectionEnabled: false });
  await serverB.ready;
  const baseB = `http://127.0.0.1:${portB}`;

  const closedPost = await post(baseB, '/api/v1/submissions', sampleSubmission({ sequence_index: 2 }));
  check('采集关闭时 POST 返回 200 + code 3001（静默成功）',
    closedPost.status === 200 && closedPost.body.code === 3001, JSON.stringify(closedPost.body));

  const closedGet = await get(baseB, `/api/v1/submissions/${view0.record_id}`);
  check('采集关闭时 GET 取回返回 200 + code 3001（不外泄数据）',
    closedGet.status === 200 && closedGet.body.code === 3001, JSON.stringify(closedGet.body));

  await serverB.stop();

  // ---- 阶段 C：进程重启后凭同一 record_id 仍能取回（SQLite 持久化）----
  results.push('阶段 C · 进程重启后结果找回（验证落盘而非内存）');
  const serverC = startServer({ port: portC, dbPath, collectionEnabled: true });
  await serverC.ready;
  const baseC = `http://127.0.0.1:${portC}`;

  const afterRestart = await get(baseC, `/api/v1/submissions/${view0.record_id}`);
  const v2 = afterRestart.body.data ?? {};
  check('重启后仍可凭 record_id 取回（总分 33 / Figma）',
    afterRestart.status === 200 && v2.total_score === 33 && v2.software_name === 'Figma',
    JSON.stringify(afterRestart.body));

  await serverC.stop();
} catch (error) {
  failed += 1;
  results.push(`  ERROR  ${error.message}`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

console.log('\n真机 E2E · 状态承载量自测工具（结果找回链路）');
console.log(results.join('\n'));
console.log(`\n合计 ${results.filter((r) => r.includes('PASS')).length} 项通过 / ${failed} 项失败`);

process.exit(failed === 0 ? 0 : 1);
