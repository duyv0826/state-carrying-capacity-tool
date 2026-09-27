# UIUX · v2.0 Phase 2 设计细化（Token 落地片段 + 8 页面实现提示词）

> 文档类型：Phase 2 详细设计物（零歧义视觉契约，供 Phase 3 前端实现）
> 作者：颜好看（UI/UX 设计师）｜ 日期：2026-09-21
> 上游锁定契约：`docs/SPEC.v2.md`（§7 页面清单 / §8.1 新增 Token）、`docs/UIUX.v2.md`（§9 新增 Token 建议）
> 前端技术栈（来自 SPEC.v2 §4）：React 19 + Vite 7 + Tailwind 3.4.17 + react-router-dom 7；**admin 图表用 recharts `^3.8.0`**（SVG、token 配色、admin 分包懒加载）；图标 `lucide-react ^1.43.0`（16/20/24px）
> 说明：本文件**只写设计契约，不含实现代码**；`design-tokens.json` / `design-tokens.css` 的实际修改由前端 Phase 3 执行，此处给出"追加片段"。

---

## 0. 与 SPEC.v2 对齐的若干修正（设计师须知的口径变化）

| 项 | SPEC.v2 口径 | 对设计的影响 |
|----|--------------|--------------|
| 图表库 | recharts `^3.8.0`（非手写 SVG） | 所有看板图表走 recharts，颜色通过 `fill`/`stroke` 绑定本文件 §1 的 `--color-data-*` 变量；admin 路由懒加载隔离保首屏 <3s |
| calibration 词汇 | `['empirical','kmeans']`（`prior` 仅运行时回退、不入库） | 校准演进轴：生效组只可能是 empirical 或 kmeans；`prior` 仅作淡参考线（虚线、border-strong），不代表已存档 |
| IRB 状态 | `filed`（占位 `{irb_no}` 待用户补） | 备案号展示位**渲染**（非 pending 隐藏）；未补值时显「备案号 待补」不显空花括号 |
| 数据策略 | 合成种子 `scc.db`（N≈600） | 设计稿示例数字用合成量级（如 N=213、Nh=47），不编造真实统计 |

---

## 1. Token 落地片段

### 1.1 追加到 `docs/design-tokens.json` 的 JSON 片段

> 位置：在顶层 `color` 对象内新增 `data` 键（与 `bg/text/border/accent/risk` 并列）；在 `layout.container` 内新增 `admin`。
> 格式遵循现有 DTCG（`$type`/`$value`/`$extensions.mode.dark`）。不破坏现有 112 leaf。

```jsonc
"color": {
  // …… 现有 bg / text / border / accent / risk 保持不变 ……
  "data": {
    "$description": "v2.0 图表数据色。档位/风险语义图仍用 color.risk.*；本组仅用于分类系列/相关性序进/绘图区基础",
    "cat": {
      "$description": "分类多系列色，避开 risk 三色与紫粉，避免「红色=危险」被误读为「因子差」",
      "ink":   { "$type": "color", "$value": "{color.accent.default}" },
      "teal":  { "$type": "color", "$value": "#2C7A7B",
                 "$extensions": { "mode": { "dark": "#4FD1CB" } } },
      "slate": { "$type": "color", "$value": "#5A6B7E",
                 "$extensions": { "mode": { "dark": "#94A3B8" } } }
    },
    "seq": {
      "$description": "墨蓝单色序进（相关性/强度/占比）。1/2/5 复用已有 accent 系列，仅补 3/4 中间档",
      "1": { "$type": "color", "$value": "{color.accent.subtle}" },
      "2": { "$type": "color", "$value": "{color.accent.subtleBorder}" },
      "3": { "$type": "color", "$value": "#7FB0D6",
             "$extensions": { "mode": { "dark": "#3E6B8F" } } },
      "4": { "$type": "color", "$value": "#3E7CAD",
             "$extensions": { "mode": { "dark": "#5C9DD1" } } },
      "5": { "$type": "color", "$value": "{color.accent.default}" }
    },
    "plot": {
      "$description": "绘图区基础（均为引用别名，无新色字面量）",
      "bg":    { "$type": "color", "$value": "{color.bg.surface}" },
      "grid":  { "$type": "color", "$value": "{color.border.subtle}" },
      "axis":  { "$type": "color", "$value": "{color.text.tertiary}" },
      "empty": { "$type": "color", "$value": "{color.bg.sunken}" }
    }
  }
},
"layout": {
  "container": {
    // …… 现有 question / result / share 保持不变 ……
    "admin": { "$type": "dimension", "$value": "1200px" }
  }
}
```

### 1.2 追加到 `docs/design-tokens.css` 的变量清单

> 命名：`color.data.cat.teal` → `--color-data-cat-teal`（与现有 `color.accent.default → --color-accent-default` 一致）。
> 浅色块放 `:root`，深色覆盖只补 teal/slate/seq.3/seq.4（cat.ink、seq.1/2/5、plot.* 引用已有语义变量，深色自动继承，无需重声明）。

```css
/* ===== v2.0 图表数据色（追加到 :root，置于 §5 强调色之后） ===== */
--color-data-cat-ink:   var(--color-accent-default);
--color-data-cat-teal:  #2C7A7B;
--color-data-cat-slate: #5A6B7E;
--color-data-seq-1: var(--color-accent-subtle);
--color-data-seq-2: var(--color-accent-subtle-border);
--color-data-seq-3: #7FB0D6;
--color-data-seq-4: #3E7CAD;
--color-data-seq-5: var(--color-accent-default);
--color-data-plot-bg:    var(--color-bg-surface);
--color-data-plot-grid:  var(--color-border-subtle);
--color-data-plot-axis:  var(--color-text-tertiary);
--color-data-plot-empty: var(--color-bg-sunken);
--layout-container-admin: 1200px;

/* ===== 深色覆盖（仅补随主题变化的新色） ===== */
[data-theme="dark"] {
  --color-data-cat-teal:  #4FD1CB;
  --color-data-cat-slate: #94A3B8;
  --color-data-seq-3: #3E6B8F;
  --color-data-seq-4: #5C9DD1;
}
```

### 1.3 对比度核验（SPEC 要求：深色下 teal/slate 文字 ≥4.5:1、边界 ≥3:1）

按 WCAG 2.1 相对亮度公式逐对计算（背景取深色 surface `#141A21` 与 page `#0C1116`，浅色取 surface `#FFFFFF`）：

| 前景色 | 模式 | 背景 | 对比度 | 结论 |
|--------|------|------|--------|------|
| `#4FD1CB` teal | 深色 | `#141A21` | **9.41:1** | 文字 ✓ / 边界 ✓ |
| `#4FD1CB` teal | 深色 | `#0C1116` | **10.2:1** | 文字 ✓ / 边界 ✓ |
| `#94A3B8` slate | 深色 | `#141A21` | **6.83:1** | 文字 ✓ / 边界 ✓ |
| `#94A3B8` slate | 深色 | `#0C1116` | **7.39:1** | 文字 ✓ / 边界 ✓ |
| `#2C7A7B` teal | 浅色 | `#FFFFFF` | **5.02:1** | 文字 ✓（主要作图表系列色，非正文） |
| `#5A6B7E` slate | 浅色 | `#FFFFFF` | **5.47:1** | 文字 ✓ |

**结论：teal/slate 深浅两套值全部达标，无需换值。** 这两个色在看板中主要作图表系列色（柱/线/图例），与文字标签共用，即使作小字也满足 ≥4.5:1。

---

## 2. 逐页面实现提示词（8 个新路由）

> 通用约定（所有页面继承）：图标 `lucide-react ^1.43.0`，尺寸 16/20/24px，禁 emoji/禁第二库；数字一律 `--font-mono` + `tabular-nums`；动效复用 `motion.duration-*` / `entrance` 缓动，禁回弹；颜色一律经 Token，业务代码禁硬编码（除 `#fff`/`#000`）；图表色经 `--color-data-*`。

---

### 2.1 回访问卷页 `/followup/:token`

- **路由**：`/followup/:token`（公开端，无登录）
- **布局容器宽度**：复用 `PageLayout` 的 `question` 容器 **680px**（公开端，非看板 1200px）
- **复用组件**：`陈述行(S1 工艺)`（A/B/C 纵向行、序号非数字、整行可点、选中态=浅底+accent 文字）；`chip 单选(S2/S3 工艺)`（校准问）；`内联提示块`（risk 色 subtle 底，token 失效态）；`主按钮`（accent 实心 h44、16px `Check`，复用结果页分享按钮微反馈）
- **新增组件**：无（纯复用 v1.0 组件）
- **Token 引用**：`--color-accent-default`(主按钮/选中文字) · `--color-bg-surface` · `--color-border-default`(陈述行描边) · `--color-text-primary/secondary/tertiary` · `--color-risk-high-subtle`+`--color-risk-high-border`(失效提示) · `--color-risk-high-default`(AlertCircle) · `--font-mono`(题号) · `--font-sans`
- **状态矩阵**：
  - Loading：纯本地渲染，无 spinner；若需拉取软件名显示骨架块 `bg-sunken`（同 4.1.6 形状）
  - Empty：不适用
  - Error（token 失效/已用，AC-V2-02）：内联提示块 `risk-high-subtle`+`1px risk-high-border`+`radius 8px`+`padding 12-16px`，左 16px `AlertCircle`(`risk-high-default`)，13px「这个回访链接已失效或已被使用」；**不渲染问卷**
  - Populated：陈述行 A/B/C + chip 校准问 + 提交按钮
  - Edge（重复提交，AC-V2-03）：服务端 UNIQUE 拒绝 → 按钮 `disabled` + 文案「已记录，感谢参与」
- **图表规范**：无图表
- **无障碍要点**：陈述行 `role=radiogroup`/`radio`（复用 S1：A/B/C 键映射，非 1-5）；chip 复用 S2/S3 键盘；提交按钮 `aria-busy` 提交中；失效提示 `role=alert`+`aria-describedby`；全程不出现「我们记得你是谁」措辞（匿名纪律）

---

### 2.2 回访群体趋势页 `/followup/result`

- **路由**：`/followup/result`（公开端，聚合自 `follow_up_results`）
- **布局容器宽度**：`question` 容器 **680px**
- **复用组件**：`Card`（可选外框）、13px tertiary 口径文案块（复用结果页方法论区块工艺）
- **新增组件**：`RetentionBar`（横向占比条：墨蓝 seq 序进填充，右侧标绝对 N mono；非饼图）
- **Token 引用**：`--color-data-seq-1`…`--color-data-seq-5`(占比条填充，弱=1 强=5) · `--color-text-primary/secondary/tertiary` · `--font-mono`(人数/N/%) · `--color-accent-default`(标题强调) · `--color-border-default`
- **状态矩阵**：
  - Loading：骨架条 `bg-sunken`（形状同真实，防 CLS）
  - Empty：虚线框 `1px dashed border-default` + 16px `Inbox`(`text-tertiary`) + 「暂无足够回访样本」
  - Error：内联提示块 `risk-high-subtle`
  - Populated：三档（高危/观察/安全）流向占比条 + 群体说明
  - Edge（N 偏小，如 <20）：仍渲染但标注「样本较少，仅作探索性参考」
- **图表规范**：占比条（**禁止饼图**，Tufte 数据-墨水比）；墨蓝单色序进（弱=`seq.1` 强=`seq.5`）；每档旁标**绝对人数(mono)+占比%**；**必配文字标签**满足 WCAG 1.4.1（颜色非唯一编码）；**零个人字段**，开场白即声明「下面是和你一样去年测过的人整体的走向」
- **无障碍要点**：占比条 `role="img"` + `aria-label` 含各档 N/占比；数字 `tabular-nums`；流向说明文字可读屏

---

### 2.3 结果页内嵌同软件常模模块（`/result` 内嵌 `<details>`）

- **路由**：`/result`（内嵌，非独立路由）；公开只读子集来自 `GET admin/norms`
- **布局容器宽度**：`result` 容器 **880px**
- **复用组件**：`<details>`/`<summary>` 折叠（复用 4.2.5 B 方法论区块原生工艺，键盘可达）；`分段量表条 + 游标`几何（复用 4.2.1，游标标用户分数）
- **新增组件**：`NormHistogram`（recharts `BarChart`，bin=5 直方图：accent 柱 + risk band 分区阴影 + 游标）
- **Token 引用**：`--color-accent-default`(柱) · `--color-risk-high/watch/safe-default @18% 透明度`(band 分区阴影，与公开页量表条同义) · `--color-data-plot-grid`/`--color-data-plot-axis`(recharts 网格/轴) · `--color-text-tertiary`(口径) · `--font-mono`(N/中位数/百分位)
- **状态矩阵**：
  - Loading：不渲染（达标才渲染）/ 骨架直方图
  - Empty（AC-V2-05）：**N<15 整块不渲染，无假数据**
  - Error（norm 接口失败）：不渲染模块，或 tertiary 一行「常模暂不可用」
  - Populated：直方图 + N/中位数/百分位 + 口径声明
  - Edge（`low_n` 15–29）：渲染但标题标「样本较少」
- **图表规范**：直方图**零基线**（y 轴从 0 起）；band 分区用 risk 三色 @18%（与公开页量表条同义编码）；用户分数游标复用 4.2.1 游标几何；**标题强制「同软件常模，非全体常模」**（AC-V2-06）；附 N/中位数/用户百分位(mono)；多软件并排对比**不做**（Out-of-Scope）
- **无障碍要点**：`<details>` 原生键盘可达；直方图 `role="img"`+`aria-label`；提供 `<details>` 数据表兜底；band 分区配文字标签

---

### 2.4 看板入口 `/admin`（登录 + 整体布局）

- **路由**：`/admin`（env-token 登录 → 存 `sessionStorage`；刷新丢失需重登）
- **布局容器宽度**：主区 **`--layout-container-admin` = 1200px**；左侧栏固定 240px（可折叠至 64px）
- **复用组件**：`PageLayout`（扩 `container.admin`）· `Card` · `主按钮`(accent) · `输入框`（复用 v1.0 选软件输入框工艺：label+实时校验+错误态）
- **新增组件**：`AdminLogin`（单字段 token 输入 + 提交）· `AdminShell`（侧栏 + 顶部 sticky 筛选栏 + 主区 12 列栅格）· `SideNav`（可折叠，20px 图标+文字）· `FilterBar`（sticky 顶部：软件/档位/时间范围/口径）
- **Token 引用**：`--color-accent-default`(登录按钮/激活态/图标) · `--color-bg-surface`/`--color-bg-page`/`--color-bg-sunken` · `--color-border-default`/`--color-border-subtle` · `--color-text-*` · `--font-mono`(token 掩码显示后 4 位) · `--layout-container-admin` · `--z-sticky`(顶栏)
- **状态矩阵**：
  - Loading：登录态检查 skeleton（主区占位）
  - Empty：未登录 → 仅显登录表单，无看板
  - Error（令牌无效 4001）：输入框 `border` 变 `--color-risk-high-default` + 13px `AlertCircle`(`risk-high-default`)「管理令牌无效」+ `role=alert`
  - Populated：看板（概览默认视图）
  - Edge（token 仅 sessionStorage，刷新丢失）：重定向回登录，**不静默失败**
- **图表规范**：无（布局壳）
- **无障碍要点**：token 输入框 `label` 关联 + `aria-describedby`；侧栏折叠按钮 `aria-expanded`；导航 `↑↓`+Enter 键盘；顶栏 `sticky` 不遮挡焦点；侧栏底部保留 IRB 备案展示位（见 §3）

---

### 2.5 看板-概览 `/admin`（默认视图）

- **路由**：`/admin`（概览，默认落地视图）
- **布局容器宽度**：1200px，栅格 12 列（KPI 行 4×3 列 / 档位堆叠条 8 列 / 漏斗 4 列）
- **复用组件**：`Card`（KPI 卡/档位卡/漏斗卡）· `FunnelTrack`（见 2.7 衍生）
- **新增组件**：`KpiCard`（大数字 mono + 趋势图标+文字）· `BandStack`（档位横向堆叠条，risk 三色）
- **Token 引用**：`--font-mono`+`--color-text-primary`(KPI 数字，26px=`--font-size-2xl`) · `--color-accent-default`/`--color-risk-safe`/`--color-risk-watch`(趋势图标依正负，必配 +/-% 文字) · `--color-risk-high`/`--color-risk-watch`/`--color-risk-safe`(`-default`+`-subtle`，档位堆叠) · `--color-border-default` · `--color-text-tertiary`(口径)
- **状态矩阵**：
  - Loading：骨架卡 `bg-sunken`（形状同真实）
  - Empty：虚线框「暂无样本」
  - Error：内联提示块 `risk-high-subtle`「聚合失败，可重试」
  - Populated：4 KPI + 档位堆叠 + 漏斗
  - Edge（N<30）：档位卡标「样本不足，切点未校准」tertiary；KPI 标口径
- **图表规范**：档位堆叠条用 **risk 三色**（安全/观察/高危），**零基线**，每档标人数+占比(mono)；趋势图标**必配 +/-% 文字**（满足 WCAG 1.4.1，方向非仅颜色）；漏斗见 2.7
- **无障碍要点**：KPI 数字 `tabular-nums`；趋势方向用文字非仅颜色；堆叠条 `aria-label` 含各档计数；导出区（CSV/JSON/codebook 按钮，`Download`/`FileCode`，复用结果页分享微反馈）置于本视图底部

---

### 2.6 看板-量表质量 `/admin/scale-quality`

- **路由**：`/admin/scale-quality`
- **布局容器宽度**：1200px，栅格 12 列（heatmap 4 列 / 校准轴 8 列 / α 卡 3×4 列）
- **复用组件**：`Card` · `5 段迷你条`（因子分展示）· `分段量表条几何`（校准演进轴）
- **新增组件**：`FactorHeatmap`（recharts 3×3 `Heatmap`，data.seq 墨蓝序进 + 格内 r 文字）· `CalibrationAxis`（0–100 轴 + 三组垂直线，risk band@18%）· `AlphaCard`（α 三卡）
- **Token 引用**：`--color-data-seq-1`…`--color-data-seq-5`(heatmap 填充，弱=1 强=5) · `--color-risk-high/watch/safe-default @18%`(校准轴 band 分区) · `--color-accent-default`(生效切点组实线) · `--color-border-strong`(对角线=1.00 弱化 / 未生效组虚线) · `--color-text-tertiary`(口径) · `--font-mono`(r 值/切点值)
- **状态矩阵**：
  - Loading：骨架格/轴
  - Empty：虚线框「尚未计算」
  - Error：提示块
  - Populated：heatmap + 校准轴 + α 卡
  - Edge（r 越界 < -1 或 > 1）：格显「数据异常」；`calibration.method` 当前=`empirical` 或 `kmeans`（`prior` 仅作淡参考线，不存档）
- **图表规范**：heatmap 用**墨蓝单色序进**（弱=`seq.1` 强=`seq.5`），每格叠加 `r=±xx` 文字（满足 WCAG 1.4.1，颜色非唯一编码）；对角线=1.00 用 `border-strong` 弱化；校准轴复用结果页量表条几何，risk band@18%，**生效组 accent 实线**、未生效组 `border-strong` 虚线；α 卡大数字 + 阈值线（`risk.safe` 标达标 / `risk.watch` 标临界，α≥.70 可接受）；下方 13px tertiary「因子间相关应 < .85，过高提示区分效度不足」
- **无障碍要点**：heatmap 提供 `<details>` 数据表兜底；轴标签 ≥12px tertiary；所有数字 `tabular-nums`；校准轴 `aria-label` 含各组切点值

---

### 2.7 看板-漏斗诊断 `/admin/funnel`

- **路由**：`/admin/funnel`
- **布局容器宽度**：1200px
- **复用组件**：`Card`
- **新增组件**：`FunnelTrack`（由 `ProgressTrack` 衍生：纵列 14 步横条，宽∝留存人数；accent 实色=已发生 / `border-subtle`=未达；背景段 S1–S3 视觉降级）· `AbandonBar`（按题流失 bar，零基线，accent 高亮最差步）
- **Token 引用**：`--color-accent-default`(已发生/高亮) · `--color-accent-hover`(当前步) · `--color-border-subtle`(未达/背景段降级) · `--color-border-strong`(其余步) · `--color-text-tertiary`/`--color-text-secondary`(人数/流失) · `--color-data-plot-grid`/`--color-data-plot-axis`(recharts bar) · `--font-mono`(人数)
- **状态矩阵**：
  - Loading：骨架条
  - Empty：虚线框「暂无漏斗数据」
  - Error：提示块
  - Populated：漏斗 + 放弃诊断
  - Edge（某步人数=0）：仍渲染空条（不塌陷，保持步序可读）
- **图表规范**：FunnelTrack 为 div 条（非 recharts），宽度∝留存；背景段整条降为 `border-subtle`（继承 AC-04 视觉降级语言）；AbandonBar 用 recharts `BarChart` **零基线**（y 从 0），最差步 `accent` 实色、其余 `border-strong`，每柱标流失人数(mono)
- **无障碍要点**：漏斗每步 `role="img"`/列表 + `aria-label` 含人数+该步流失；bar `aria-label` 含流失数；数字 `tabular-nums`；背景段降级不靠颜色单编码（同时用更淡的描边+更小的视觉权重）

---

### 2.8 看板-反驳文本 `/admin/rebuttals`

- **路由**：`/admin/rebuttals`
- **布局容器宽度**：1200px
- **复用组件**：`Card` · 原生 `<table>`（复用 v1.0 可用性语义）· `内联提示块`
- **新增组件**：`RebuttalTable`（列：提交时间 / 软件 / 档位(band 点+文字双编码) / 反驳文本(truncate+展开) / 操作(导出单行)）· 空态虚线框 + `Inbox`
- **Token 引用**：`--color-risk-high/watch/safe`(`-default`+`-subtle`，band 点+文字双编码) · `--color-border-default`(表边框/行分隔) · `--color-text-primary/secondary/tertiary` · `--color-bg-sunken`(空态/隔行) · `--color-accent-default`(操作按钮/导出)
- **状态矩阵**：
  - Loading：骨架行 `bg-sunken`
  - Empty：虚线框 `1px dashed border-default` + 16px `Inbox`(`text-tertiary`) + 「暂无反驳文本」
  - Error：提示块
  - Populated：表格 + 顶部筛选（按档位/关键词/时间）
  - Edge（长文本）：`truncate` + 「展开」；软件名超长 `ellipsis`+`title`
- **图表规范**：无（表格）；band 用 risk **点(8px 圆)+文字双编码**（满足 WCAG 1.4.1，不靠颜色单编码）
- **无障碍要点**：`<table>` 原生语义 + `<caption>`/`scope`；band 点 `aria-label` 含档位名；筛选 chip 键盘可达；隔行 `bg-sunken` 对比达标；导出单行按钮 `aria-label` 明确

---

## 3. IRB 备案展示位（跨页面，SPEC `irb_status=filed`）

> 全站统一组件 `IrbBadge`，**irb_status=filed 时渲染**（pending 不渲染）。`{irb_no}` 由 config 注入，未补值时显「备案号 待补」，**不显空花括号**。

- **文案模板**（13px tertiary，左 16px `ShieldCheck` accent）：
  `本研究已通过澳门科技大学人文艺术学院伦理审查备案（备案号 {irb_no}）`
- **出现位置**：
  1. 首页知情同意块（v1.0 已有，追加一行）— 复用 `risk`/`accent` 提示块工艺
  2. 结果页方法论区块（v1.0 4.2.5 B，追加一行）
  3. `/admin` 侧栏底部或页脚（研究端自证）
- **Token 引用**：`--color-accent-default`(ShieldCheck) · `--color-text-tertiary` · `--color-bg-sunken`(底，可选)

---

## 4. 图标清单（v2.0 新增，lucide-react ^1.43.0，上线前 `npm ls`+grep 复核存在性）

| 场景 | 图标 | 尺寸 | 页面 |
|------|------|------|------|
| 看板导航-概览 | `LayoutDashboard` | 20 | /admin |
| 看板导航-量表质量 | `FlaskConical` | 20 | /admin |
| 看板导航-漏斗 | `Filter` | 20 | /admin |
| 看板导航-反驳文本 | `MessageSquareWarning` | 20 | /admin |
| 看板导航-导出 | `Download` | 20 | /admin |
| 看板导航-合规 | `ShieldCheck` | 20 | /admin（侧栏） |
| KPI-总样本 | `Users` | 16 | 概览 |
| KPI-本周新增 | `TrendingUp` | 16 | 概览 |
| KPI-入库率 | `CheckCircle2` | 16 | 概览 |
| KPI-完成率 | `Activity` | 16 | 概览 |
| 趋势负向 | `TrendingDown` | 16 | 概览 |
| 回访主问 | `RotateCcw` | 20（行内） | /followup/:token |
| 回访提交 | `Check` | 16 | /followup/:token |
| 常模/漏斗游标 | （复用 4.2.1 几何，无图标） | — | /result、/admin |
| 反驳空态 | `Inbox` | 24 | /admin/rebuttals、/followup/result |
| 导出-codebook | `FileCode` | 16 | 概览导出区 |
| token 失效 | `AlertCircle` | 16 | /followup/:token、/admin |
| IRB 备案 | `ShieldCheck` | 16 | 跨页面 |

> 防 SPEC.v2 §11「lucide 版本号幻觉」坑：新增图标名在 `node_modules/lucide-react` 导出表 `grep` 确认存在后再合入；版本锁定 `^1.43.0`（实测最新 1.45.0，ISC）。

---

## 5. 交付与下一步

- 本文件为 Phase 3 前端实现的**零歧义视觉契约**：§1 给出 Token 追加片段（json+css+对比度核验通过），§2 给出 8 个新路由的结构化提示词（路由/宽度/复用/新增/Token/5 态/图表规范/无障碍），§3 给出 IRB 展示位，§4 给出图标清单。
- 前端 Phase 3：将 §1.1 片段并入 `design-tokens.json`、§1.2 并入 `design-tokens.css`（保持"唯一字面量文件"规则）；按 §2 逐页实现；recharts 仅 admin 分包。
- 设计侧不再修改 `client/src`（实现归前端）；`docs/` 设计文档可继续修订。
