# Spec · 状态承载量自测工具 v2.0（锁定契约）

> 生成日期：2026-09-21
> 基于：PRD.v2 + ARCHITECTURE.v2 + UIUX.v2（三文档均已用户确认）
> 上游基线：v1.0 `docs/SPEC.md` / `docs/ARCHITECTURE.md` / `docs/UIUX.md`（已锁定项**不推翻**）
> 状态：已确认（用户 2026-09-21 确认三文档，自动进入本 Spec）
> 增量性质：v2.0 = v1.0 的**生产侧补完**（消费侧 currentCalibration / followups 采集端点已存在于 v1.0），不重写 v1.0 定义。

---

## 1. 产品定义

- **一句话描述**：在 v1.0「一次性自测 + 匿名入库」基础上，新增纵向回访闭环、实证分析升级（k-means 回写 + 同软件常模）、研究结论看板，并完成合规与遗留收口。
- **目标用户**：研究者（洪兄本人，研究端 admin）+ 被试（公众端）。
- **核心问题**：v1.0 只有横截面快照，无法验证「高危分预测换软件」的效度，也无工具把聚合数据转化为可发表的研究证据。

## 2. MVP 范围（锁定——不在此列表的功能一律不做）

| 优先级 | 功能 | 验收标准摘要 | RICE |
|--------|------|-------------|------|
| P0 | L1 纵向回访闭环 | token 邮件回访→复测入库→群体趋势页；一次性 token；零个人字段 | — |
| P1 | L2a k-means 生产侧回写 | 纯 TS 脚本 INSERT method='kmeans' 行，N≥150 时消费侧自动采用 | — |
| P1 | L2b 同软件常模对比 | 内嵌 /result（N≥15 才渲染），admin 全软件视角 | — |
| P1 | L3 研究结论看板 | admin 4 视图（概览/量表质量/漏斗/反驳）+ 导出 | — |
| P1 | L4 合规与遗留 | openapi 升 v2.0；S2/S3 回填；IRB 文案；i18n 维持不做 | — |

## 3. 明确不做（Out-of-Scope — 锁定）

| 不做的功能 | 原因 | 何时考虑 |
|------------|------|----------|
| 微信/Telegram 回访渠道 | 引入身份主体与更多 PII 义务，与最小化原则冲突 | Backlog（v3） |
| 多语言 i18n 框架 | 单语 zh-CN 研究量表；consent_version 漂移风险；YAGNI | 未来薄 wrapper |
| 多软件并排常模对比 | 小样本并排误导 | 样本量充足后 |
| 真实样本采集开关默认开启 | v1.0 已定零采集默认；隐私优先 | 用户显式开启 |
| 账号体系 / OAuth | SPEC 已定「无账号体系」，env-token 足够研究端 | 对外发布时 |

## 4. 技术架构（锁定 — 含版本锚定）

> v1.0 文档漂移回填：as-built 实际为 **Express 5.2.1 + Tailwind 3.4.17 + react-router-dom 7.9.4**，v2.0 以 as-built 为准，不回退文档声称的 Fastify/Tailwind4。

| 层 | 技术 | 版本锚定 | 锁定原因 |
|----|------|----------|----------|
| 前端框架 | React | ^19.2.0 | 不变 |
| 构建/样式 | Vite 7.1.9 + Tailwind 3.4.17 | 已锁定 | 不变 |
| 路由 | react-router-dom | ^7.9.4 | 已引入，admin 复用 |
| 图标库 | lucide-react | **^1.43.0**（实测最新 1.45.0，ISC） | P0 唯一图标来源，禁 emoji/禁第二库 |
| 看板图表 | recharts | **^3.8.0**（实测 3.8.1，MIT，peer react 含 ^19） | SVG、token 配色、非紫粉；admin 懒加载隔离 |
| 后端 | Express | ^5.2.1 | 不变 |
| 数据库 | better-sqlite3 | ^13.0.3 | 单 SQLite 文件，不变 |
| 邮件 | nodemailer | ^6.x（MIT，执行前 `npm ls` 复查） | SMTP 唯一渠道 |
| 调度兜底 | node-cron | ^4.6.0（ISC，零依赖，仅 `FOLLOWUP_SCHEDULER=inprocess` 启用） | PaaS 兜底 |
| 部署 | Docker 多阶段单进程 + host cron/systemd timer | — | 极薄请求/响应服务 |

## 5. API 端点清单（锁定——开发以 openapi.yaml v2.0.0 为准）

统一响应 `{ code, data, message }`，`code=0` 成功。错误码沿用 v1.0：`1001` 校验失败 / `2001` 限流 / `4001` 管理令牌无效 / `5001` 内部错误；新增 `5002` 回访 token 不存在、`5003` 回访重复提交（同 token+wave 已 completed，UNIQUE 冲突）。

**看板三指标口径锁定（Phase 2 裁决）**：`ingestion_rate` = excluded=0 行数 / submissions 总行数；`completion_rate` = submissions / (submissions + abandon_events)；`weekly_new` = created_at 在最近 7 日（滚动窗口）的 submissions 行数。

| Method | Path | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/api/v1/followups/results` | 无（限流） | 被试回传纵向复测，写 `follow_up_results` |
| GET | `/api/v1/admin/dashboard/summary` | X-Admin-Token | 看板聚合：计数/档位分布/30日趋势/样本就绪度/当前 calibration 方法 |
| GET | `/api/v1/admin/norms` | X-Admin-Token | 同软件常模对比（聚合 + 分位），样本量 < 30 标 `low_n` |
| GET | `/api/v1/admin/followups` | X-Admin-Token | 回访登记列表（token 仅后 4 位，不返回联系方式） |
| POST | `/api/v1/admin/followups/dispatch` | X-Admin-Token | 触发到期回访邮件（幂等，冷却期不重发） |
| GET | `/api/v1/admin/followups/results` | X-Admin-Token | 纵向结果列表（token 后 4 位 + wave + score + band，无联系方式） |
| POST | `/api/v1/admin/calibration/kmeans` | X-Admin-Token | （可选）进程内触发 k-means 回写 |

**校准方法词汇锁定（一致性修复）**：`calibration.method` DB CHECK = `IN ('empirical','kmeans')`。`prior` 仅为运行时回退、不入库。`openapi.yaml` 中 calibration 枚举当前误写为 `[prior, empirical_p33p67, kmeans]`，**Phase 2 必须修正为 `['empirical','kmeans']`**。`band_basis` 列（`empirical_p33p67`）是 submissions 的描述性元数据，保留不改（与 calibration.method 的轻微词汇差属已知非阻断项）。

## 6. 数据库表清单（锁定）

### 6.1 `followups` 表增量（幂等 ALTER，PRAGMA 守卫）

```sql
ALTER TABLE followups ADD COLUMN contact_channel TEXT NOT NULL DEFAULT 'email'
  CHECK (contact_channel IN ('email','wechat','telegram'));
ALTER TABLE followups ADD COLUMN last_invited_at TEXT;
ALTER TABLE followups ADD COLUMN invite_count INTEGER NOT NULL DEFAULT 0 CHECK (invite_count >= 0);
ALTER TABLE followups ADD COLUMN next_invite_at TEXT;
```

### 6.2 新增 `follow_up_results` 表

```sql
CREATE TABLE IF NOT EXISTS follow_up_results (
  id TEXT PRIMARY KEY,
  followup_token TEXT NOT NULL,
  wave_number INTEGER NOT NULL CHECK (wave_number >= 1),
  status TEXT NOT NULL CHECK (status IN ('invited','started','completed','declined')),
  answers_json TEXT NOT NULL,
  total_score INTEGER NOT NULL CHECK (total_score BETWEEN 8 AND 45),
  band TEXT NOT NULL CHECK (band IN ('high_risk','watch','safe')),
  consent_version TEXT NOT NULL,
  client_submitted_at TEXT,
  duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
  quality_flags TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  UNIQUE (followup_token, wave_number)
);
CREATE INDEX IF NOT EXISTS idx_fur_token ON follow_up_results(followup_token);
CREATE INDEX IF NOT EXISTS idx_fur_created ON follow_up_results(created_at);
```

> 不存软件名（与 submissions 物理分表，仅 token 关联）；纵向 delta 由研究者在受控导出流程一次性 join 得到。`total_score` 用 `BETWEEN 8 AND 45` 兼容 8/9 题；当前锁定 `schema_version=2`（9 题，9–45）。

### 6.3 `calibration` 表：无需改动（`cutpoints` + `method IN ('empirical','kmeans')` 已就绪）

### 6.4 索引
复用 `idx_sub_software` / `idx_sub_created` / `idx_followups_token`；新增 `idx_fur_token` / `idx_fur_created`。MVP 数据量 < 1万不建复合索引。

## 7. 页面清单（锁定）

| 页面 | 路由 | 核心组件 | 对应 API | 设计 Token 主题 |
|------|------|----------|----------|-----------------|
| 回访问卷 | `/followup/:token` | 陈述行(S1) + chip(S2/S3) | POST followups/results | 墨蓝 / 无 Likert |
| 回访群体趋势 | `/followup/result` | 横向占比条（墨蓝序进） | —（聚合自 follow_up_results） | 墨蓝 seq，零个人字段 |
| 结果页常模模块 | `/result`（内嵌 `<details>`） | 直方图（accent + risk band 阴影 + 游标） | GET admin/norms（公开只读子集） | risk 三色 + accent |
| 研究看板入口 | `/admin` | env-token 登录 → sessionStorage | — | 墨蓝 |
| 看板-概览 | `/admin` | KPI 卡 + 档位堆叠条 + 漏斗 | GET dashboard/summary | risk 三色 |
| 看板-量表质量 | `/admin/scale-quality` | 三因子 heatmap + 校准演进 + α 卡 | GET dashboard/summary + norms | data.seq 墨蓝序进 |
| 看板-漏斗诊断 | `/admin/funnel` | FunnelTrack + 放弃诊断 bar | GET dashboard/summary | accent |
| 看板-反驳文本 | `/admin/rebuttals` | table（band 点+文字双编码） | GET dashboard/summary | risk 三色 |
| 看板-导出 | `/admin`（导出区） | CSV/JSON/codebook 按钮 | GET admin/export（v1.0 已有） | accent |

## 8. 设计 Token（锁定）

- **主色**：墨蓝 `accent` `#17557F`（排除 indigo/Stripe 紫/Linear 紫/Vercel 蓝）。
- **风险三档**：`risk.high` `#A63A2E` / `risk.watch` `#9A6B12` / `risk.safe` `#2F6B4F`（仅语义用，必配位置+文字）。
- **图标库**：lucide-react ^1.43.0（16/20/24px），新增图标名上线前 `npm ls`+grep 复核存在性。
- **字体**：Inter + 中文回退栈；数字用 `--font-mono` + `tabular-nums`。
- **主题**：浅色为主 + 深色覆盖（37 token）。
- **对标气质**：测量仪器感（可核验优先，不花哨）。

### 8.1 新增 Token（追加到 design-tokens.json，不破坏现有 112 leaf）

```jsonc
"color.data.cat": { "ink": "{color.accent.default}", "teal": "#2C7A7B" ($dark "#4FD1CB"), "slate": "#5A6B7E" ($dark "#94A3B8") }
"color.data.seq": { "3": "#7FB0D6" ($dark "#3E6B8F"), "4": "#3E7CAD" ($dark "#5C9DD1") }  // 1/2/5 复用已有
"color.data.plot": { "bg": "{color.bg.surface}", "grid": "{color.border.subtle}", "axis": "{color.text.tertiary}", "empty": "{color.bg.sunken}" }
"layout.container.admin": "1200px"
```
> 合计新增 leaf ≈ 9（plot.* 4 个为引用别名，无新色字面量）。CSS 同步在 `design-tokens.css` 补对应 `--color-data-*` / `--layout-container-admin`（深色块补值）。

## 9. 验收标准（锁定——QA 测试唯一依据，EARS）

| 编号 | 功能 | EARS 格式验收标准 | 优先级 |
|------|------|-------------------|--------|
| AC-V2-01 | 回访复测 | When 被试带有效 followup_token 提交复测，系统**必须**写入 `follow_up_results` 并返回 201 + total_score + band | P0 |
| AC-V2-02 | 回访 token | If followup_token 不在 `followups` 表，系统**必须**返回 5002 + 不写入 | P0 |
| AC-V2-03 | 一次性 token | While 同一 token+wave 已 completed，系统**必须**拒绝重复提交（UNIQUE 约束） | P0 |
| AC-V2-04 | 回访调度 | When 研究者调 dispatch（冷却期内），系统**必须**仅对到期且未发送者发邮件，返回 dispatched/skipped 计数 | P0 |
| AC-V2-05 | 常模渲染 | If 某软件有效样本 < 15，系统**必须**不渲染公开常模模块（无假数据） | P1 |
| AC-V2-06 | 常模口径 | When 渲染常模，系统**必须**标题声明「同软件常模，非全体常模」并附 N/中位数/百分位 | P1 |
| AC-V2-07 | k-means 回写 | When 跑 calibrate-kmeans 且 N≥150，系统**必须**INSERT method='kmeans' 行；currentCalibration 须优先采用 | P1 |
| AC-V2-08 | 看板隐私 | While 返回 admin 列表/结果，系统**必须**不包含联系方式明文/密文，token 仅显后 4 位 | P1 |
| AC-V2-09 | 看板就绪度 | When 返回 dashboard/summary，系统**必须**含样本就绪度（N vs 30/150）与当前 calibration 方法 | P1 |
| AC-V2-10 | 校准枚举 | While 序列化 calibration，系统**必须**使用 vocabulary `['empirical','kmeans']`（无 prior/empirical_p33p67） | P1 |

## 10. 边界与约束

- 不支持 IE；响应式断点继承 v1.0。
- 回访联系仅 SMTP 邮件（MVP）；微信/Telegram 留 `contact_channel` 扩展位，不实现。
- 不引入身份标识：导出/列表不含可关联个人字段（延续 ADR-010）。
- 图表色一律经 Token（CSS 变量），业务代码禁硬编码色（除 `#fff`/`#000`）；禁 bounce 缓动；Recharts 仅 admin 分包（保首屏 < 3s）。
- 匿名纪律：回访/看板导出绝不出现个人字段。
- 数据策略：开发/测试用**合成种子 scc.db**（用户确认），真实库后补。

## 11. 内嵌已知坑（从项目记忆拉取）

| 坑 | 技术栈指纹 | 根因 | 修法 |
|----|------------|------|------|
| calibration.method 词汇漂移 | express/better-sqlite3 | openapi 枚举与 DB CHECK 不一致 | Phase 2 修正 openapi 为 `['empirical','kmeans']` |
| v1.0 文档与 as-built 漂移 | 全栈 | 文档写 Fastify/Tailwind4，代码是 Express/Tailwind3 | 以 as-built 为准，本 Spec §4 回填 |
| lucide 版本号幻觉 | lucide-react | 凭记忆写图标名可能不存在 | 新增图标上线前 `npm ls`+grep 复核 |
| Recharts 3.x 较新破坏性变更 | recharts | 大版本偶有 API 改动 | 锁 `^3.8.0`，升级走 PR，admin 分包隔离 |

## 12. 端到端验证步骤（Spec 锁定的最后一项）

```bash
# 0. 准备合成种子库（Phase 3 提供 scripts/seed-synthetic.ts）
npm run seed:synthetic        # 生成 server/data/scc.db（N≈600，含 ~30 份 followups + 部分 follow_up_results）

# 1. 构建
npm run build                 # client + server 均通过

# 2. 启动
npm run dev                   # 等待 Ready

# 3. 回访成功流
curl -X POST http://localhost:3000/api/v1/followups/results \
  -H "Content-Type: application/json" \
  -d '{"followup_token":"<有效hex>","wave_number":1,"answers":{"A1":5},"consent_version":"v1.0-2026-09","duration_ms":31000}'
# 断言：201 + band

# 4. 回访错误流（token 不存在）
curl -X POST http://localhost:3000/api/v1/followups/results -H "Content-Type: application/json" -d '{"followup_token":"deadbeef","wave_number":1,"answers":{},"consent_version":"v1.0-2026-09","duration_ms":1}'
# 断言：5002

# 5. k-means 回写
npm run calibrate             # N≥150 → INSERT method='kmeans'
curl http://localhost:3000/api/v1/admin/dashboard/summary -H "X-Admin-Token: $ADMIN_TOKEN"
# 断言：calibration_method = kmeans

# 6. 看板隐私断言：admin/followups 响应不含 contact_encrypted / 明文邮箱，token 仅后 4 位
```

## 13. 变更记录

| 日期 | 变更内容 | 原因 | 影响范围 |
|------|----------|------|----------|
| 2026-09-21 | SPEC.v2 初版（锁定契约） | 三文档确认后自动生成 | 全 v2.0 |
| 2026-09-21 | 锁定 calibration.method 词汇 | 修 openapi/DB 漂移 | openapi + calibration |
| 2026-09-21 | 数据策略定为合成种子 | 用户确认零采集/无本地库 | Phase 3/4 测试 |
| 2026-09-21 | IRB 状态=filed（占位 irb_no 待补） | 用户确认已备案 | UIUX §6.1 展示位 |
