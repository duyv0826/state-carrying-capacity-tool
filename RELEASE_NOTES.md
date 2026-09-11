# 状态承载量自测工具 · 发布说明（v1.0）

> 澳门科技大学（MUST）人文艺术学院 · 互动媒体艺术 / 游戏设计方向 **学位作品配套数据采集 Web 应用**。
> 本说明可作 GitHub Release 正文，或改写为社交平台（如小黑盒）发布文案。

---

## 一句话简介

一个**匿名自测工具**，帮用户评估常用软件的「状态承载量」——即工具在多大程度上承载了使用者的习惯、资产与责任，并据此预测其保留 / 迁移意愿。

## 为什么做

理论锚点来自 Rabardel (1995) 的*工具生成理论（instrumental genesis）*：工具从原始 *artifact* 被使用者改造为 *instrument* 的过程里，会超出软件本身、承载使用者的状态。由此提出 **状态承载量（state-carrying capacity）** 概念——工具保留意愿与其状态承载量正相关、与任务一次性程度负相关。本工具为这一假设采集一手量化数据。

## 核心功能

- **9 题 3 因子 Likert 量表**（A 状态外显 / B 产出形态 / C 制度与协作嵌入），反向题自动翻转
- **14 步流程**，含中场结果预览作为参与激励
- **即时算分**：前端本地算分 + 服务端独立复算（双算一致），总分 9–45，先验切点 `[21, 32]`
- **分享卡片**：离屏 canvas 生成，无外部依赖
- **可选匿名采集**：蜜罐防爬虫、中途放弃埋点（无惩罚）、数据质量标记

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 19 + Vite + Tailwind 3 + TypeScript |
| 后端 | Express 5 + better-sqlite3（单文件 SQLite） |
| 部署 | Docker（多阶段）/ 任意境外轻量机（香港、新加坡，免 ICP 备案） |

架构与部署解耦：切换主机只需改 DNS / 端口，代码零改动。

## 快速开始

**本地开发**

```bash
cd server && npm install && npm run dev      # 终端 1，:3000
cd client && npm install && npm run dev      # 终端 2，:5173（/api 代理到 3000）
```

**生产单进程**

```bash
cd client && npm install && npm run build
cd ../server && npm install && npm run build && npm start   # 单进程托管前端 + API，:3000
```

**Docker**

```bash
docker build -t scc .
docker run -d -p 3000:3000 --name scc scc
```

健康检查：`curl http://localhost:3000/healthz` → `{"ok":true}`

## 隐私与伦理

- 默认 `COLLECTION_ENABLED=false`：**前端不发起任何采集请求、服务端不落库，工具 100% 可用**。
- 开启后仅存储**匿名**字段（随机 UUID 会话标识、作答与分层背景、粗粒度环境；`region_bucket` 由被试自愿填写，**不从 IP 推断**）。
- **不采集**姓名 / 邮箱 / 手机号 / IP / 精确地理位置。
- 伦理备案说明见 `docs/IRB-备案说明.md` 与 `docs/IRB-校内表格填写要点.md`。

## 文档索引

`README.md` · `DEPLOY.md` · `docs/PRD.md` · `docs/ARCHITECTURE.md` · `docs/SPEC.md` · `docs/UIUX.md` · `docs/IRB-备案说明.md` · `docs/IRB-校内表格填写要点.md`

## 已知限制

- 档位切点为**先验值**，样本量 N≥150 后建议用 k-means 校准（详见 `docs/SPEC.md`）。
- 当前未做多语言界面。
- 开启数据采集前需先完成所在院校 IRB 备案。

## 后续计划

- 扩大样本量做探索性 / 验证性因子分析
- 基于实证数据校准风险档位切点
- 补充研究结论看板

---

*本研究为学术用途，遵循数据最小化与匿名化原则。License：MIT。*
