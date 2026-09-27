# ADR-012: 回访联系渠道限定 SMTP 邮件（MVP）

**Status**: Accepted (2026-09-21)

**Background**
纵向回访需联系被试。候选渠道：SMTP 邮件、微信（公众号/企业微信）、Telegram Bot。项目红线是"不引入身份标识""最小化 PII 处理"。v1.0 的 `followups.contact_encrypted` 已是自愿提供的联系方式（AES-256-GCM，密钥仅环境变量）。

**Decision**
MVP 仅支持 SMTP 邮件渠道（服务端 `nodemailer` + SMTP 环境变量发送）。`followups` 表新增 `contact_channel TEXT NOT NULL DEFAULT 'email'`，为微信/Telegram 预留扩展位但 MVP 不使用。微信/Telegram 放到 Backlog。

**Consequences**
正面：最小身份暴露（邮箱即被试自愿提供，不新增标识符）；搭建成本低；研究者↔被试标准学术通道。邮件发送时服务端解密→发信→不落库、不进 `follow_up_results`、不导出，延续 ADR-010 匿名性。
负面：仅持有邮箱的被试能被回访；微信/Telegram 被试暂不可达。
**Related ADRs**: ADR-010, ADR-011
