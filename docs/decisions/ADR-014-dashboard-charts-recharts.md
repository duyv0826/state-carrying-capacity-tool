# ADR-014: 研究看板前端图表库选用 Recharts 3.x（SVG / token 可配色 / 非紫粉），admin 路由懒加载隔离

**Status**: Accepted (2026-09-21)

**Background**
v2.0 需要 admin 看板（分布直方图、档位饼图、常模条形、30 日趋势）。P0 红线：非 emoji 图标、可 token 化配色、排除紫粉模板味、禁止硬编码色（除 #fff/#000）、禁止弹跳缓动。v1.0 ADR-006 曾规定"不引图表库"，但其复核触发条件（视图 > 6 或跨页共享复杂状态）已被看板满足。

**Decision**
图表库选用 **Recharts 3.8.1**（`^3.8.0`，MIT，peer `react` 含 `^19`）。理由：纯 SVG（与"禁用硬编码色、可 token 化"一致），颜色经 `fill`/`stroke` 映射到 `design-tokens.css` 的 CSS 变量；默认调色板中性蓝系，不带入紫粉渐变；React 19 兼容。看板路由 `React.lazy` 懒加载，Recharts 不进公开包（保住首屏 < 3s P0）。图标继续用 `lucide-react`（已是依赖），不新增第二套图标库。图表动画设 `animationEasing="ease-out"` 或 `isAnimationActive={false}`，禁止 bounce。排除 ECharts/Nivo/Chart.js/uPlot（Canvas 或 theme 锁死或紫调风险）。

**Consequences**
正面：满足全部 P0 配色/图标红线；admin 分包隔离不影响公开端性能；React 原生组件组合。
负面：admin 包体增加（已懒加载隔离）；Recharts 3.x 较新需锁版本升级走 PR。
**Related ADRs**: ADR-006
