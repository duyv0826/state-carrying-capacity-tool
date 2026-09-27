# ADR-016: v2.0 维持单语（zh-CN），不引入 i18n 框架（YAGNI）

**Status**: Accepted (2026-09-21)

**Background**
v2.0 是否引入 i18n（react-i18next vs 轻量自建）？PRD 无 i18n 要求；题面与知情同意是科研量表，需随 `consent_version` 版本锁定。

**Decision**
v2.0 不做 i18n。所有用户文案已集中在 `client/src/config/`（questions.ts / strata.ts / software.ts / flow.steps.ts）。若将来需要多语，仅加一层薄 `messages.ts` wrapper（键值抽离 + 运行时选择），无需现在引入 react-i18next 等框架。

**Consequences**
正面：避免 `consent_version` 漂移风险；符合 YAGNI，零新增依赖与构建复杂度；科研量表单语即可。
负面：将来多语需补一层 wrapper（已在 config/ 集中预留，成本极低）。
**Related ADRs**: 无
