# ADR-015: 同软件常模对比以内置 SQL 聚合 + TS 分位实现，不引分析型依赖

**Status**: Accepted (2026-09-21)

**Background**
v2.0 需要"同软件常模对比"：按软件聚合均值/中位数/p25/p75/档位分布并附全局基线。候选：内置 SQL 聚合 + TS 分位、全表拉取计算、引入 sqlite percentile 扩展或分析库。

**Decision**
采用内置 SQL：`GROUP BY software_name_norm` 取 `COUNT`/`AVG`；分组 `total_score` 列表在 TS 内用复用 `calibration.service#percentile`（nearest-rank）算中位数/p25/p75。端点是 `GET /api/v1/admin/norms`。不引入任何分析型依赖或 SQLite 扩展。

**Consequences**
正面：单文件 SQLite 可移植性不受损（不加扩展）；无新增依赖；样本量小（< 1万）TS 计算开销可忽略。
负面：分位在应用层算（非 SQL 原生）；若未来数据量到十万级需重评。
**Related ADRs**: ADR-002
