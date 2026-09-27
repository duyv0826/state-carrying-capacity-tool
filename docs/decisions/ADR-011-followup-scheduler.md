# ADR-011: 纵向回访调度置于部署层（cron/systemd timer → 鉴权端点），node-cron 仅作进程内兜底

**Status**: Accepted (2026-09-21)

**Background**
v2.0 需要定时联系回流被试做纵向复测。调度可放在 Node 进程内（node-cron）或部署层（host cron / systemd timer）。v1.0 设计哲学是"极薄请求/响应服务 + 单 SQLite 文件"（ADR-002/003），进程应尽量无长驻状态。发送回访邮件是触碰 PII（联系方式）的副作用操作，需要可审计、可手动触发、可测试。

**Decision**
主选：部署层调度器（host `crontab` 或 `systemd timer`）定时调用新增的鉴权端点 `POST /api/v1/admin/followups/dispatch`（携带 `X-Admin-Token`）。该端点幂等（冷却期内不重发）。
兜底：设环境变量 `FOLLOWUP_SCHEDULER=inprocess` 时，在 Node 进程内用 `node-cron@4.6.0`（ISC，零依赖，TS 原生）起定时器，逻辑复用同一 `dispatchFollowups()` service。

**Consequences**
正面：进程保持无状态、符合"请求驱动"本质；调度动作显式、鉴权、幂等、可手动触发、可审计；容器镜像不变；单实例无重复发送风险。
负面：需在 host 配置 timer（PaaS 场景由 node-cron 兜底消解）。
**Related ADRs**: ADR-002, ADR-012
