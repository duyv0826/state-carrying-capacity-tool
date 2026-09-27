# 状态承载量自测工具 v2.0 · 技术架构增量文档（调研 + ADR + Schema + API）

- 撰写人：高见远（首席架构师）
- 日期：2026-09-21
- 状态：待评审
- 上游：v1.0 `docs/ARCHITECTURE.md`（2026-09-09，ADR-001~010）+ 现有代码基线
- 本文档只覆盖 v2.0 四个新增方向；v1.0 已锁定的技术栈**不推翻**。
- 文档内不含 emoji；图标唯一来源 `lucide-react`；颜色字面量仅允许出现在 `design-tokens.css`。

---

## 零、基线一致性说明（文档漂移回填）

v1.0 `ARCHITECTURE.md` 文字描述的是 **Fastify + Tailwind 4 + 无路由库**，但 as-built 代码（已读 `client/package.json`、`server/package.json`、`server/src/**`）实际为：

| 层 | v1.0 文档声称 | as-built 实际（与 team-lead 锁定基线一致） |
|---|---|---|
| 后端框架 | Fastify 5 | **Express 5.2.1** |
| 前端构建/样式 | Vite 7 + Tailwind 4.1 | **Vite 7.1.9 + Tailwind 3.4.17** |
| 路由 | 不引库（useState 状态机） | **react-router-dom 7.9.4**（已引入，admin 路由将复用） |
| 图标 | lucide-react ^1.43.0 | lucide-react ^1.43.0（一致） |

**结论**：v2.0 以 as-built + team-lead 锁定基线为准，不回退到文档声称的 Fastify/Tailwind4。本档同时回填两项已落地但文档未记录的事实：

1. **`S2` / `S3` enum 已在 `migrations.ts` 落地**（CHECK 约束 `s2_tenure_bucket IN ('lt6m','6m_2y','2y_5y','gt5y')`、`s3_frequency_bucket IN ('daily','weekly_multi','weekly_once','monthly','rarer')`），与 openapi `Strata` 同口径。
2. **`calibration` 表已支持 k-means 回写**：列 `cutpoints TEXT` + `method IN ('empirical','kmeans')`；`calibration.service.ts#currentCalibration` 消费侧已就绪（N≥150 且存在 `method='kmeans'` 行时优先采用）。v2.0 只补**生产侧回写脚本**。

---

## 一、v2.0 四个方向的技术选型

### 方向 1：纵向回访闭环

#### 1.1 定时触发：部署层调度 vs 进程内调度

| 候选 | 方案 | 依赖 | 评分(1-5) | 结论 |
|---|---|---|---|---|
| **A. 部署层调度 → 鉴权端点** | host `cron` / `systemd timer` 定时 `curl -X POST /api/v1/admin/followups/dispatch -H "X-Admin-Token:…"` | 无（复用现有 AdminToken） | **5** | **主选** |
| B. node-cron 进程内 | `node-cron@4.6.0` 在 Node 进程内起定时器 | node-cron（ISC，零依赖） | 3 | 进程内兜底（env 门控） |
| C. 独立任务容器 / 外部 runner | 额外容器或 CI 定时任务跑脚本 | 额外编排 | 2 | 过度设计，否决 |

**推荐：A 为主，B 为可选兜底。**

理由（对应 ADR-011）：
- v1.0 设计哲学是"极薄请求/响应服务 + 单 SQLite 文件"（ADR-002/003），进程保持无长驻定时器更符合"请求驱动"本质。
- 发送回访邮件是**触碰 PII（联系方式）的副作用操作**。把它做成显式、鉴权、幂等的管理端点，可被研究者手动触发（"现在发送"按钮）、可审计、可测试，不依赖定时器 tick。
- 部署目标已是 Docker + host（Caddy/systemd，ADR-003），`systemd timer` 或 host `crontab` 调用端点零改动容器镜像。
- 单实例部署，调度重复发送风险两侧都低；幂等端点（冷却期内不重发）两侧都安全。
- **兜底**：若部署到无法设 host cron 的 PaaS，设 `FOLLOWUP_SCHEDULER=inprocess` 启用 node-cron 4.6.0（ISC，零依赖，TS 原生），逻辑复用同一 `dispatchFollowups()` service。

#### 1.2 联系渠道：SMTP 邮件 vs 微信 vs Telegram

| 候选 | 身份化处理 | 搭建成本 | 学术恰当性 | 结论 |
|---|---|---|---|---|
| **SMTP 邮件** | 联系方式已是自愿提供的邮箱，不新增标识符 | 低（nodemailer + SMTP 环境变量） | 高（研究者↔被试标准通道） | **MVP 唯一渠道** |
| 微信（公众号/企业微信） | 需 OpenID / 手机号映射，引入额外身份主体 | 高（需认证服务号） | 中 | 否决（Backlog） |
| Telegram Bot | 需 chat_id，跨境外渠道，受试者数据处境复杂 | 中 | 低（国内被试覆盖差） | 否决（Backlog） |

**推荐：MVP 仅 SMTP 邮件（对应 ADR-012）。** 微信/Telegram 引入外部身份主体与更多 PII 处理义务，与"不引入身份标识"的最小化原则冲突，且国内被试覆盖差，放到 Backlog。

**不引入身份标识的落地**：`followups.contact_encrypted` 已是自愿提供的联系方式（AES-256-GCM，密钥仅环境变量）。回访发送时服务端解密→发邮件→**不落库、不进 `follow_up_results`、不导出**。纵向结果表 `follow_up_results` 仅以 `followup_token` 关联，研究数据集仍不含可直接联系到个人的字段（延续 ADR-010）。

#### 1.3 回访 token 复用

直接复用 v1.0 的 `followups.followup_token`（32 位 hex，客户端生成）。新增 `follow_up_results` 表以 `followup_token` 为外键（**不**直接引用 `submissions.id`），保持物理分表与 token-only 关联。回访链接形如 `/followup?token=<hex>&wave=2`，前端按 token 调 `POST /api/v1/followups/results` 回写。

> 注意：`follow_up_results` **不存软件名**。纵向 delta（同一软件前后承载量变化）由研究者在受控导出流程中 `follow_up_results.token → followups.token → submissions.followup_token → software_name` 一次性 join 得到（ADR-010 同口径）。回访 UI 让被试自行重选软件仅作其本人便利，不入库。

---

### 方向 2：实证分析升级

#### 2.1 k-means 切点回写（生产侧）

| 候选 | 方案 | 依赖 | 结论 |
|---|---|---|---|
| **A. 纯 TS 1D k-means 脚本** | `server/scripts/calibrate-kmeans.ts`（tsx 运行），k=3，k-means++ 种子化，Lloyd ≤100 迭代，切点为相邻质心中点 | **无重依赖** | **主选（ADR-013）** |
| B. ml-kmeans npm 库 | 通用 k-means 实现 | 引入依赖（约 30KB+） | 否决（违背"不引重依赖"） |
| C. Python + sklearn 脚本 | 导出 CSV → 本地跑 | Python 环境 | 否决（与"TS 优先"基线不一致，且 v1.0 已弃用此路） |

**算法（1D，k=3）**：对 `schema_version=2` 且 `excluded=0` 的 `total_score` 升序；k-means++ 初始化三质心（固定种子保证可复现）；迭代至收敛或 100 次；切点 `c1=(μ1+μ2)/2`、`c2=(μ2+μ3)/2`；写 `calibration` 行 `method='kmeans'`、`cutpoints=[c1,c2]`、`p33=c1`、`p67=c2`、`n=scores.length`。`currentCalibration` 已消费此行（N≥150 时优先），**消费侧零改动**。

触发方式（二选一，均写同一张表）：
- 独立脚本：`npm run calibrate`（推荐，可复现、可进版本控制）。
- 可选管理端点：`POST /api/v1/admin/calibration/kmeans`（在进程内跑同一逻辑，便于"点一下重算"）。

#### 2.2 同软件常模对比

| 候选 | 方案 | 结论 |
|---|---|---|
| **A. 内置 SQL 聚合 + TS 分位** | `GROUP BY software_name_norm` 取 COUNT/AVG；分组 `total_score` 列表在 TS 算中位数/p25/p75（复用 `calibration.service#percentile`） | **主选（ADR-015）** |
| B. 加载全表到 TS 计算 | 全量拉取后分组 | 否决（无意义全表扫描） |
| C. 引入 sqlite 扩展/分析库 | 装 percentile 扩展 | 否决（单文件 SQLite 加扩展破坏可移植性） |

端点：`GET /api/v1/admin/norms?software=&category=&schema_version=`，返回每软件 `n / mean / median / p25 / p75 / band 分布`，并附全局基线对比。样本量 < 30 的软件标注 `low_n` 警告（不隐瞒小样本）。

---

### 方向 3：研究结论看板

#### 3.1 前端图表库选型（必须满足：非 emoji 图标、可 token 化配色、排除紫粉模板味）

| 候选 | 渲染 | React19 兼容 | token 配色 | 默认调色板 | 包体 | 结论 |
|---|---|---|---|---|---|---|
| **Recharts 3.8.1** | SVG | 是（peer 含 ^19） | fill/stroke 用 CSS 变量 | 中性蓝/青/橙/红（**非紫粉**） | 中（懒加载隔离） | **主选（ADR-014）** |
| visx | SVG | 是 | 完全可控 | 无默认 | 低-中 | 备选（需更多代码） |
| ECharts | Canvas/SVG | 是 | 需 theme 配置 | 默认偏花哨/紫调风险 | 大 | 否决 |
| Chart.js | Canvas | 是 | 难（Canvas 不吃 CSS 变量） | 蓝绿系 | 中 | 否决（Canvas） |
| Nivo | SVG(d3) | 是 | 受自身 theme 锁定 | opinionated | 大 | 否决（theme 锁死） |
| uPlot | Canvas | 是 | 难 | 极简 | 极小 | 否决（Canvas） |

**推荐：Recharts 3.8.1（`^3.8.0`）。** 纯 SVG（与"禁用硬编码色、可 token 化"一致），颜色经 `fill`/`stroke` 属性映射到 `design-tokens.css` 的 CSS 变量；默认调色板为中性蓝系，**不带入紫粉渐变**；React 19 peer 兼容（实测 latest 3.8.1，2026-03，peer `react` 含 `^19`）。

**P0 合规落地**：
- 图表颜色一律 `style={{ fill: 'var(--color-chart-1)' }}` / `stroke="var(--color-chart-2)"`，来源 `design-tokens.css`；业务代码不得写色值（除 `#fff`/`#000`）。
- 关闭弹跳缓动：Recharts 动画设 `animationEasing="ease-out"` 或 `isAnimationActive={false}`，**禁止 bounce**。
- 看板路由 `React.lazy` 懒加载，Recharts **不进公开包**，保住"首屏 < 3s"P0（ADR-006 复核触发条件已满足：视图 > 6 且需跨页共享，故引入图表库，但仅限 admin 分包）。
- 图标继续用 `lucide-react`（已是依赖），**不新增第二套图标库**。

#### 3.2 admin 路由与鉴权

复用现有 `react-router-dom 7.9.4` + `requireAdminToken` 中间件（X-Admin-Token）。新增客户端 `/admin/*` 路由组（懒加载）：
- `AdminLogin`：输入 ADMIN_TOKEN → 存 `sessionStorage` → 后续 admin 请求带 `X-Admin-Token`。
- 路由守卫仅隐藏 UI；**每请求服务端强制鉴权**（延续 v1.0 模型）。
- 新管理端点：`/admin/dashboard/summary`、`/admin/norms`、`/admin/followups`、`/admin/followups/dispatch`、`/admin/followups/results`、`/admin/calibration/kmeans`（可选）。

---

### 方向 4：合规与遗留

| 项 | 处理 |
|---|---|
| openapi.yaml 更新 | 新增回访结果、常模、看板、调度、kmeans 共 7 个端点（见 §三 + 已写入 `openapi.yaml`） |
| S2/S3 enum 已落地 | 回填：见 §零，已在 `migrations.ts` 落地，无需改表 |
| i18n 评估 | **结论：v2.0 仍不做 i18n**（对应 ADR-016）。理由：单语（zh-CN）研究量表；PRD 无 i18n 要求；题面/知情同意需随 `consent_version` 版本锁定，引入 i18n 有版本漂移风险且为 YAGNI。所有用户文案已集中在 `client/src/config/`（questions/strata/software/flow.steps），将来若需，仅加一层薄 `messages.ts` wrapper 即可，无需现在引入 react-i18next |

---

## 二、DB Schema 变更（v2.0）

### 2.1 `followups` 表增量（幂等 ALTER，需 PRAGMA 守卫）

```sql
-- 在 migrations.ts 中以 PRAGMA table_info 检查后按需 ADD COLUMN，避免重复执行报错
ALTER TABLE followups ADD COLUMN contact_channel TEXT NOT NULL DEFAULT 'email'
  CHECK (contact_channel IN ('email','wechat','telegram'));
ALTER TABLE followups ADD COLUMN last_invited_at TEXT;
ALTER TABLE followups ADD COLUMN invite_count INTEGER NOT NULL DEFAULT 0 CHECK (invite_count >= 0);
ALTER TABLE followups ADD COLUMN next_invite_at TEXT;
```

> `contact_channel` 默认 `'email'`，MVP 仅用 email；微信/Telegram 留作 Backlog 扩展位。

### 2.2 新增 `follow_up_results` 表

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

> `total_score` 用 `BETWEEN 8 AND 45` 兼容 8 题(8-40)/9 题(9-45)；当前锁定 `schema_version=2`（9 题，9-45）。

### 2.3 `calibration` 表

**无需改动**。`cutpoints` + `method='kmeans'` 已就绪，回写脚本直接 `INSERT`。

### 2.4 索引

复用现有 `idx_sub_software`（按软件聚合）、`idx_sub_created`（时间趋势）、`idx_followups_token`（回访关联）。新增 `idx_fur_token`/`idx_fur_created`（§2.2）。MVP 数据量（< 1万）不建复合索引。

---

## 三、API 端点增量清单（v2.0）

统一响应 `{ code, data, message }`，`code=0` 成功。新增端点均带 `/api/v1/` 前缀。完整契约见 `openapi.yaml`（已更新至 v2.0.0）。

| Method | Path | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/api/v1/followups/results` | 无（限流） | 被试回传纵向复测结果，写 `follow_up_results` |
| GET | `/api/v1/admin/dashboard/summary` | X-Admin-Token | 看板聚合：计数/档位分布/30日趋势/样本就绪度/当前 calibration 方法 |
| GET | `/api/v1/admin/norms` | X-Admin-Token | 同软件常模对比（聚合 + 分位） |
| GET | `/api/v1/admin/followups` | X-Admin-Token | 回访登记列表（token 仅显示后 4 位，不返回联系方式明文/密文） |
| POST | `/api/v1/admin/followups/dispatch` | X-Admin-Token | 触发对到期回访发送邮件（幂等，冷却期内不重发） |
| GET | `/api/v1/admin/followups/results` | X-Admin-Token | 纵向结果列表（token 后 4 位 + wave + score + band，不含联系方式） |
| POST | `/api/v1/admin/calibration/kmeans` | X-Admin-Token | （可选）进程内触发 k-means 回写 |

### 关键请求/响应（摘要）

**POST /api/v1/followups/results**
```jsonc
// request
{ "followup_token": "32-hex", "wave_number": 1,
  "answers": { "A1":5,..."C3":4 }, "consent_version": "v1.0-2026-09",
  "client_submitted_at": "ISO8601", "duration_ms": 31000 }
// response 201 { "code": 0, "data": { "record_id": "…", "total_score": 33, "band": "safe" }, "message": "" }
```

**GET /api/v1/admin/norms?software=Figma**
```jsonc
// response 200
{ "code":0, "data": {
  "software":"Figma","n":142,
  "mean":31.2,"median":32,"p25":24,"p75":38,
  "band_distribution":{"high_risk":12,"watch":40,"safe":90},
  "global":{"n":611,"mean":29.8,"median":30,"p25":22,"p75":36},
  "low_n":false }, "message":"" }
```

**POST /api/v1/admin/followups/dispatch**
```jsonc
// request { "wave_number": 1, "max_invites": 50 }
// response 200 { "code":0, "data": { "dispatched": 23, "skipped": 4, "next_run_at": "ISO8601" }, "message":"" }
```

错误码沿用 v1.0：`1001` 校验失败 / `2001` 限流 / `4001` 管理令牌无效 / `5001` 内部错误。新增：`5002` 回访 token 不存在（POST results 时 token 未在 `followups` 命中）。

---

## 四、对现有 calibration.service 的改动评估

**结论：无需改动消费侧。** `currentCalibration`（已读）已实现完整的 N<30 先验 / [30,150) 经验 P33P67 / ≥150 优先 kmeans 解析，并消费 `calibration.cutpoints`。v2.0 的 k-means 回写是**新增独立脚本/可选端点**，只 `INSERT` 一行 `method='kmeans'`，即被现有逻辑自动采用。

**一处非阻塞命名不一致（建议顺手清理，不阻 v2.0）**：`calibration.service` 写经验行用 `method:'empirical'`，但内存 `Calibration.method` 类型与 `submissions.band_basis` 用 `'empirical_p33p67'`；DB `calibration.method` CHECK 为 `IN ('empirical','kmeans')`。三者口径略不一致但功能正确。建议后续把 `calibration.method` 取值与 `band_basis` 对齐（如经验行也存 `'empirical_p33p67'`），仅涉及写入常量，无风险。

---

## 五、技术栈版本锚定（含图标库回填，P0）

| 项 | 选型 | 版本锚定 | 证据 | 备注 |
|---|---|---|---|---|
| 图标库 | lucide-react | **^1.43.0**（实测最新 **1.45.0**，2026-09-11，ISC） | releasealert.dev / npm；1.x 仅增量图标，向后兼容 | **延续 v1.0 锁定，已回填实测版本** |
| 回访调度(兜底) | node-cron | ^4.6.0（2026-07，ISC，零依赖，TS） | Snyk/versio.io | 仅 `FOLLOWUP_SCHEDULER=inprocess` 时启用 |
| 邮件发送 | nodemailer | ^6.x（MIT；安装后以 `npm ls` 为准） | 未联网核实，标注待确认 | SMTP 通道，MVP 唯一渠道 |
| 看板图表 | recharts | ^3.8.0（实测最新 3.8.1，2026-03；peer react 含 ^19，MIT） | recharts.org / npmx | SVG、token 可配色、非紫粉 |
| k-means | 纯 TS（无依赖） | — | 自实现 | 不引 ml-kmeans |
| 前端框架 | React | ^19.2.0 | 已锁定 | 不变 |
| 构建/样式 | Vite 7 + Tailwind 3.4.17 | 已锁定 | 已锁定 | 不变 |
| 后端 | Express 5.2.1 + better-sqlite3 13.0.3 | 已锁定 | 已锁定 | 不变 |

**P0 红线在本档的落地**：图标仅 `lucide-react`（无 emoji、无第二库）；图表色来自 `design-tokens.css` CSS 变量（无硬编码紫粉、无 bounce 缓动）；admin 分包懒加载使 Recharts 不污染公开包。

---

## 六、v2.0 架构决策记录（ADR-011 ~ 016，MADR）

> 完整 MADR 文本另存于 `docs/decisions/ADR-011..016.md`；此处给出摘要。

- **ADR-011 纵向回访调度置于部署层（cron/systemd timer → 鉴权端点），node-cron 仅作进程内兜底**：状态 Accepted。理由见 §1.1。后果：进程保持无状态、调度可手动触发可审计；负面：需在 host 配置 timer（兜底层消解 PaaS 场景）。
- **ADR-012 回访联系渠道限定 SMTP 邮件（MVP）**：状态 Accepted。不引入微信/Telegram 等身份化渠道。后果：最小身份暴露；负面：仅邮箱能回访。
- **ADR-013 k-means 切点回写采用纯 TS 脚本（生产侧），不引重依赖，消费侧 currentCalibration 不变**：状态 Accepted。后果：可复现、零新增依赖、与 v1.0 消费逻辑无缝衔接。
- **ADR-014 研究看板前端图表库选用 Recharts 3.x（SVG / token 可配色 / 非紫粉），admin 路由懒加载隔离**：状态 Accepted。后果：保住首屏 P0、满足 P0 配色红线；负面：admin 包体增加（已懒加载隔离）。
- **ADR-015 同软件常模对比以内置 SQL 聚合 + TS 分位实现，不引分析型依赖**：状态 Accepted。后果：单文件 SQLite 可移植性不受损；负面：分位在 TS 算（样本量小，开销可忽略）。
- **ADR-016 v2.0 维持单语（zh-CN），不引入 i18n 框架（YAGNI）**：状态 Accepted。后果：避免 consent_version 漂移；负面：将来多语需补一层薄 wrapper（已预留 config/ 集中文案）。

---

## 七、风险与待确认

| # | 风险 | 等级 | 应对 |
|---|---|---|---|
| R-v2-1 | host cron 在某些 PaaS 不可设 | 中 | `FOLLOWUP_SCHEDULER=inprocess` 启用 node-cron 兜底 |
| R-v2-2 | SMTP 凭据/发信失败 | 中 | 环境变量注入；发送失败进日志不阻断；`dispatch` 返回 skipped 计数 |
| R-v2-3 | 回访邮件被当垃圾邮件 | 中 | 发件域 DKIM/SPF；正文含"退出回访"入口；`contact_purge_after` 承诺兑现 |
| R-v2-4 | k-means 在双峰分布下切点不稳 | 低 | 固定种子 + 仅在 N≥150 启用；切点变化如实记录 `computed_at` |
| R-v2-5 | Recharts 3.x 较新，偶有破坏性变更 | 低 | 锁 `^3.8.0`，升级走 PR；admin 分包隔离，不影响公开端 |
| R-v2-6 | 文档(v1.0)与代码基线漂移 | 低 | 本档 §零 已回填；后续以 as-built 为准 |

---

*本档所有版本/许可均标注来源与核实状态；标"待确认"者执行前以 `npm ls` 复核实测版本。*
