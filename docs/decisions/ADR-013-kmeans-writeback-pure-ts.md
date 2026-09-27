# ADR-013: k-means 切点回写采用纯 TS 脚本（生产侧），不引重依赖，消费侧 currentCalibration 不变

**Status**: Accepted (2026-09-21)

**Background**
v1.0 `calibration` 表已支持 `cutpoints` 与 `method='kmeans'`，且 `calibration.service#currentCalibration` 消费侧已就绪（N≥150 且存在 kmeans 行时优先）。缺的是"生产侧"把切点算出来并回写的那一步。团队要求"纯 TS 不引重依赖优先"。

**Decision**
新增独立脚本 `server/scripts/calibrate-kmeans.ts`（tsx 运行），实现 1D k-means（k=3）：k-means++ 固定种子初始化，Lloyd 迭代 ≤100 次，切点为相邻质心中点；写 `calibration` 行 `method='kmeans'`、`cutpoints=[c1,c2]`、`p33=c1`、`p67=c2`、`n=scores.length`。可选再暴露 `POST /api/v1/admin/calibration/kmeans` 端点复用同一逻辑。不引入 `ml-kmeans` 等依赖。

**Consequences**
正面：零新增运行时依赖；固定种子保证可复现；与 v1.0 消费逻辑无缝衔接，`currentCalibration` **无需改动**。
负面：自实现聚类（但 1D k=3 简单且充分）；仅 N≥150 启用。
**Related ADRs**: ADR-007
