# 状态承载量自测工具 (State-Carrying Capacity Self-Assessment)

> 澳门科技大学（MUST）人文艺术学院 · 互动媒体艺术 / 游戏设计方向 **学位作品配套数据采集 Web 应用**
> 理论锚点：Rabardel (1995) *工具生成理论（instrumental genesis）* —— 提出"状态承载量"概念：工具保留意愿与其状态承载量正相关、与任务一次性程度负相关。

---

## 这是什么

一个**匿名自测问卷**工具：用户选择/输入一款常用软件，完成 **9 道 Likert 量表题（3 因子各 3 题）+ 4 道分层背景题**，即时获得自身软件的"状态承载量"评估与风险档位。数据用于学位论文的实证分析。

核心设计原则：**功能与数据采集解耦（IRB 友好）**。默认零采集，工具 100% 可用；研究者通过环境变量开启采集前需先完成伦理备案。

---

## 功能特性

- 9 题 3 因子量表（A 状态外显 / B 产出形态 / C 制度与协作嵌入），5 点 Likert，反向题自动翻转
- 14 步流程，含中场结果预览作为参与激励
- 前端本地即时算分 + 服务端独立复算（双算一致），总分 9–45，先验切点 `[21, 32]`
- 分享卡片（离屏 canvas 生成，无外部依赖）
- 可选匿名采集：蜜罐防爬虫、中途放弃埋点（无惩罚）、数据质量标记
- 单进程部署：Node 服务同时托管前端静态资源 + SPA fallback + 健康检查

---

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 19 + Vite + Typewind(Tailwind 3) + TypeScript |
| 后端 | Express 5 + better-sqlite3（单文件 SQLite） |
| 部署 | Docker（多阶段）/ 任意境外轻量机（香港、新加坡，免 ICP 备案） |

---

## 目录结构

```
状态承载量工具/
├── client/            # 前端（React + Vite）
│   ├── src/
│   │   ├── components/    # 设计系统组件
│   │   ├── pages/         # 5 个页面（首页/答题/预览/分层/结果）
│   │   ├── config/        # 题目/分层/流程配置
│   │   ├── lib/           # 计分 / 分享卡 / API
│   │   ├── store/         # 会话状态
│   │   └── styles/        # 设计 Token
│   └── vite.config.ts
├── server/            # 后端（Express + better-sqlite3）
│   ├── src/
│   │   ├── controllers/ routes/ services/ repositories/
│   │   ├── middlewares/   # 采集闸门 / CORS / 限流
│   │   ├── domain/        # 计分 / 档位 / 题面
│   │   └── static.ts      # 静态托管 + SPA fallback + /healthz
│   └── .env.example
├── docs/              # PRD / ARCHITECTURE / SPEC / UIUX / IRB 文档
├── Dockerfile
├── .dockerignore
└── DEPLOY.md          # 详细部署手册
```

---

## 本地开发

需要 Node ≥ 22。

```bash
# 终端 1：后端（默认 3000 端口）
cd server
npm install
npm run dev            # tsx watch，热重载

# 终端 2：前端（默认 5173 端口，/api 代理到 3000）
cd client
npm install
npm run dev
```

打开 http://localhost:5173 即可使用。

---

## 生产构建与运行（单进程）

```bash
# 1. 构建前端
cd client && npm install && npm run build    # 产物在 client/dist

# 2. 构建并启动后端（后端同时托管 client/dist）
cd ../server && npm install && npm run build && npm start
```

访问 http://localhost:3000 —— 单进程同时提供 API 与前端页面。

---

## Docker 部署（香港 / 新加坡轻量机）

```bash
docker build -t scc .
docker run -d -p 3000:3000 --name scc scc
```

反向代理（Caddy / Nginx）做 HTTPS 终止 + 域名解析即可。架构与部署解耦，**切换主机只需改 DNS / 端口，代码零改动**。详见 `DEPLOY.md`。

健康检查：

```bash
curl http://localhost:3000/healthz     # → {"ok":true}
```

---

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3000` | 服务端口 |
| `COLLECTION_ENABLED` | `false` | **数据采集开关**。默认关闭 = 零采集、工具照常可用；IRB 备案通过后设 `true` 开启 |
| `CONSENT_MODE` | `implied` | 知情同意模式，`explicit` 时要求显式同意 |
| `CONSENT_VERSION` | `v1.0-2026-09` | 同意文本版本，需与 `docs/IRB-*` 文档一致 |
| `CLIENT_DIST` | 自动推断 | 前端构建产物路径，容器内一般无需手动设 |

---

## 数据采集与 IRB

- **默认 `COLLECTION_ENABLED=false`**：前端不发起任何采集请求，服务端不落库，工具完全可用。
- 开启后仅存储**匿名**字段：随机 UUID 会话标识、9 题作答与分层背景、粗粒度环境信息（`region_bucket` 由被试自愿填写，**不从 IP 推断**）、可选自由文本。
- **不采集**姓名 / 邮箱 / 手机号 / IP / 精确地理位置。唯一可能含联系方式的是 `followups` 表，且仅当用户显式勾选"愿意后续联系"时才创建，并加密存储、设自动清理时限。
- 伦理备案说明见 `docs/IRB-备案说明.md` 与 `docs/IRB-校内表格填写要点.md`。

---

## 文档索引

| 文档 | 内容 |
|------|------|
| `docs/PRD.md` | 产品需求 |
| `docs/ARCHITECTURE.md` | 系统架构 |
| `docs/SPEC.md` | 验收规格（AC-01..15） |
| `docs/UIUX.md` | 交互与视觉规范 |
| `docs/design-tokens.json` / `design-tokens.css` | 设计 Token |
| `docs/openapi.yaml` | API 定义 |
| `docs/IRB-备案说明.md` | 研究伦理备案底稿 |
| `docs/IRB-校内表格填写要点.md` | 校内审查表填写速查 |
| `DEPLOY.md` | 部署手册 |

---

## License

MIT —— 详见仓库根目录 [`LICENSE`](./LICENSE)。

---

*本项目为学术研究用途，数据采集遵循最小化与匿名化原则。*
