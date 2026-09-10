# 状态承载量自测工具 · UI/UX 设计规范

> 版本 v0.1 ｜ 设计：颜好看 ｜ 技术栈：React 19 + Vite + Tailwind，图标库锁定 Lucide（`lucide-react`）
> 本文件是项目级设计契约。前端实现以本文件 + `design-tokens.json` 为准；有歧义时以本文件的「判断 + 理由」为准。

---

## 0. 一句话设计立场

**这是一个测量仪器，不是一个内容产品。**

界面上的每一个像素都要服务于两件事之一：让被试准确作答，或让评审相信这个分数是算出来的。任何不服务于这两件事的装饰，都是要被删掉的。

---

## 1. 竞品 UI 调研

### 1.1 第一类：在线测评 / 问卷类产品

**观察对象：Typeform、16Personalities、OpenPsychometrics**

**Typeform（对话式表单的行业定义者）**
- 一屏一题 + 进度条 + Enter 自动跳题 + 全屏滑动转场
- 官方与第三方数据一致：对话式表单比传统多字段表单完成率高 15%~30%
- 官方自己给出的关键数字：题目超过 6 道后完成率跌破 50%
- 官方明确建议「不要在开头暴露总题数」以降低放弃率

**16Personalities（大众测评的视觉天花板）**
- 人格类型昵称化（「建筑师」「提倡者」）、专属插画与配色、雷达图 + 百分比条
- 结果页社交货币属性极强，截图传播成本极低
- 中文实测口碑中的硬伤：**滑杆设计会让被试产生「中庸」倾向，导致结果区分度不高**；模型非正统、复测信度低

**OpenPsychometrics（学术向开源量表站）**
- 界面停留在 Web 2.0，几乎无设计
- 但「算法开源可核验 + 数据透明度高」让它在学术人群里口碑极好

**这里有一条对整个项目最关键的结论**：可信度不来自视觉精致度，来自**可核验性**。OpenPsychometrics 用最难看的界面拿到了最高的学术信任。我们要做的是——**把 Typeform 的完成率工程，装进 OpenPsychometrics 的诚实感里**。

### 1.2 第二类：风险评估 / 数据可视化产品

**观察对象：企业 ERM 风险驾驶舱、信用风险评分界面**

- 通用语法：红 / 黄 / 绿交通灯、5×5 可能性×影响热力矩阵、仪表盘（gauge）、趋势箭头
- 有效的部分：**分段阈值 + 当前值标记 + 趋势方向**、每页最多三张图、每个指标配一段人话解读
- 失效的部分：仪表盘是数据-墨水比最差的图表类型之一——用掉一个圆盘的面积只编码一个数值；3D 效果与截断坐标轴会直接误导读者
- 交通灯配色在 8% 男性色觉障碍人群下会崩塌；且红/绿在学术语境里情绪过载

### 1.3 第三类：克制型工具 / 文档类产品

**观察对象：Linear、Stripe Dashboard / Stripe Docs、Observable Plot 默认样式**

- **Linear**：近单色表面、单一强调色、hairline 边框、键盘优先、深色优先。其公开设计哲学里最该抄的一条是——**强调色像荧光笔，一屏只能用一次**
- **Stripe**：表格优先于图表、数字右对齐 + tabular figures、弱网格线、图表只做摘要而表格才是真相。它教育了一代人「财务数据应该长什么样」，即得可信感的方法
- **Observable Plot / 学术图表传统**：直接标注优于图例（读者不需要来回对色）、无 3D、无阴影、无装饰、网格线极弱或省略、数据-墨水比最大化

2026 年的行业共识：**边框、阴影、装饰持续缩小，信息密度上升，层级只由字重与间距产生，颜色只保留给状态与语义。**

### 1.4 明确不能照搬的清单（及其破坏机制）

| 做法 | 出处 | 为什么不能照搬 |
|---|---|---|
| 对话式口吻（「谢谢你，小明！再来一题～」） | Typeform | 测量工具的施测语气必须中性。亲昵口吻会引入**社会期许偏差**，且评审会直接质疑施测标准化 |
| 开头隐藏总题数 | Typeform 官方建议 | 这是增长技巧，不是研究伦理。**被试知情同意要求预先告知题量与时长**。本项目明确拒绝 |
| Enter 自动跳下一题 | Typeform | 5 点量表上误触跳题 = 数据污染且被试无法察觉。改为：数字键 1-5 选中，Enter 显式确认才翻页 |
| 全屏滑动 / 弹入转场 | Typeform | 施测节奏被动画拖慢，注意力被转场夺走。且违反「禁弹性缓动」红线 |
| 滑杆作答 | 16Personalities | CHI'24 实证研究（Farzand et al.）：滑杆比单选按钮更难用、更易产生响应偏差；**滑杆初始位置会显著影响作答，智能手机上尤其严重**。中文实测口碑也证实滑杆导致中庸倾向、区分度下降。**本项目禁用滑杆** |
| 类型昵称 + 专属插画（「建筑师」） | 16Personalities | 娱乐化签名。本项目档位命名必须是中性的描述性名词 |
| 雷达图 | 16Personalities / IDRlabs | 面积随维度顺序变化而失真，且不可比。我们的「逐维度解释」用水平条形更准 |
| 仪表盘 / 环形 / 信用分大圆环 | 消费级信用 App | 数据-墨水比极差，且是 AI 模板套路重灾区 |
| 红黄绿交通灯作为唯一编码 | ERM 驾驶舱 | 色觉障碍下失效；且情绪过载，削弱学术中立 |
| 星形 / 表情量表 | 消费级评分 | 图形量表在效度上表现差于文字标注量表，且直接触发「娱乐测试」的观感 |
| 巨型 Hero + 渐变 CTA | SaaS 落地页 | 违反 P0 红线 5。本项目首屏直接是问卷第一步 |

### 1.5 反过来，必须吸收的

1. **一屏一题**（完成率 + 认知负荷双重收益）
2. **进度可见**（无进度指示的表单放弃率显著更高）
3. **全标注 + 保留中点 + 方向一致**（量表设计的文献共识：5 点、含中点、全点标注、所有题目正向一致）
4. **数字排版纪律**：tabular-nums、右对齐、弱网格线（Stripe）
5. **直接标注优于图例**（Observable / Tufte）
6. **颜色只用于状态与语义**（Linear）
7. **每个指标配一段人话解读**（ERM 驾驶舱）
8. **结果页提供方法论与局限说明**（OpenPsychometrics 的信任来源）

---

## 2. 设计定位与对标

### 2.1 寄存器与三轴刻度

- **主寄存器：Product（产品型）** —— 设计服务产品，标杆是「赢得熟悉感」
- **局部寄存器：结果分享卡片走 Brand 寄存器** —— 它是唯一允许有视觉记忆点的地方，因为它要被截图传播

| 刻度 | 取值 | 理由 |
|---|---|---|
| `DESIGN_VARIANCE` | **3 / 10** | 测量仪器必须对称、可预测、无艺术化偏移。任何非对称布局都会让人怀疑「是不是在引导我」 |
| `MOTION_INTENSITY` | **2 / 10** | 只保留 hover / active / focus 的 150ms 收敛反馈，以及结果页量表条一次性 600ms 游标入场。**零装饰动画、零弹跳** |
| `VISUAL_DENSITY` | **3 / 10**（问卷页） / **4 / 10**（结果页） | 留白是「克制感」最便宜也最有效的来源。结果页因维度条 + 解释需要略升 |

### 2.2 对标品牌（3 正 1 反）

**主对标：Linear —— 交互密度与克制**
- 抄什么：hairline 边框代替阴影、近单色表面、单一强调色、键盘优先、深色模式质感
- 为什么适合：问卷是「用一整天也不该累」的工具型界面，Linear 正是这个品类里把「安静」做到极致的那一个。它的克制本身就是一种可信声明

**次对标：Stripe Dashboard / Stripe Docs —— 数据的可信感**
- 抄什么：tabular figures、右对齐数字、弱网格线、图表做摘要而表格做真相、语义色只用于状态
- 为什么适合：结果页的核心任务是让人相信「62 分」是被算出来的而不是被编出来的。Stripe 是「数字可信」这个命题上被验证最久的答案

**第三对标：Observable Plot 默认样式 / 学术图表传统 —— 图表的诚实**
- 抄什么：直接标注而非图例、无 3D、无装饰、数据-墨水比最大化、网格线极弱
- 为什么适合：档位可视化要能经得住导师追问「你这个条为什么这么画」。Tufte / 学术制图传统是唯一一套能自证清白的语法

**反面参照：OpenPsychometrics —— 可信来自透明，不来自美观**
- 它的界面是差的，但它的信任度是高的。提醒我们：**方法论说明区、局限性声明、样本量透明，这些「不性感」的区块才是学位作品的护城河**，不许为了好看把它们藏起来或弱化

---

## 3. 设计系统

### 3.1 色彩

#### 3.1.1 设计原则

- **浅色为主**，深色模式为完整对等实现（不是简单反色）
- 中性色占 85%+，强调色 ≤10%，语义色 ≤5%
- 强调色**每屏最多 2 处可见使用**
- 全部中性色带轻微冷调（蓝灰 / slate），不使用纯灰；不使用纯黑纯白做大面积背景
- 深色模式通过**表面亮度递进**表达层级，而非阴影
- 三档风险色**永不作为唯一区分手段**，必须与「位置 + 文字标签」三重编码

#### 3.1.2 主色选型说明

**强调色 = 墨蓝 `#17557F`（Ink Blue）**

选它的理由，以及为什么不选别的：
- 不是 Tailwind 默认 indigo `#6366F1`（AI 味首罪）
- 不是 Stripe 紫 `#635BFF`、Linear 紫 `#5E6AD2`、Vercel 蓝 `#0070F3`（都是被抄烂的签名色）
- 冷、暗、低饱和 —— 接近印刷油墨的感觉，天然带「文档 / 学术 / 档案」联想
- 与三档风险色（砖红 / 赭黄 / 松绿）在色相上分离干净，不会互相干扰
- 白底对比度 **7.8 : 1**，同时满足正文文本与「白字实心底」两种用法

#### 3.1.3 中性色阶（primitive，仅供 Token 内部引用，组件禁止直接使用）

| Token | 浅色值 | 深色值 |
|---|---|---|
| `palette.neutral.000` | `#FFFFFF` | — |
| `palette.neutral.025` | `#FBFCFD` | `#0C1116` |
| `palette.neutral.050` | `#F4F6F8` | `#141A21` |
| `palette.neutral.100` | `#E9EDF1` | `#1B222A` |
| `palette.neutral.200` | `#DFE4E9` | `#2A333D` |
| `palette.neutral.300` | `#C6CDD5` | `#3A4551` |
| `palette.neutral.400` | `#9AA5B1` | `#5A6674` |
| `palette.neutral.500` | `#67727F` | `#7A8794` |
| `palette.neutral.600` | `#53616E` | `#9AA7B4` |
| `palette.neutral.700` | `#35414D` | `#B9C4CF` |
| `palette.neutral.800` | `#1F2A35` | `#D8DEE5` |
| `palette.neutral.900` | `#101A24` | `#E6EBF1` |
| `palette.neutral.950` | `#0A1219` | `#F2F5F8` |

注意：深浅两套是**各自独立定义**的，不是同一个色阶的镜像。深色的 `025`/`050` 是表面（暗），`900` 是主文本（亮）。

#### 3.1.4 语义色（组件唯一允许引用的一层）

**浅色模式**

| 语义 Token | 色值 | 用途 | 白底对比度 |
|---|---|---|---|
| `color.accent.default` | `#17557F` | 主按钮底、选中态底、链接、进度条已完成段 | 7.8:1 |
| `color.accent.hover` | `#0F4266` | 悬停 | 10.4:1 |
| `color.accent.active` | `#0B3452` | 按下 | 12.9:1 |
| `color.accent.subtle` | `#E8F1F8` | 选中项浅底、info 块底 | — |
| `color.accent.subtleBorder` | `#B8D4E8` | 选中项浅底描边 | — |
| `color.accent.ring` | `rgba(23,85,127,0.35)` | 焦点环 | — |
| `color.risk.high.default` | `#A63A2E` | 高危区：色块、文字、游标段 | 6.5:1 |
| `color.risk.high.subtle` | `#FBEEEC` | 高危区标签底、段底 15% | — |
| `color.risk.high.border` | `#EFC9C3` | 高危区描边 | — |
| `color.risk.watch.default` | `#9A6B12` | 观察区 | 4.7:1 |
| `color.risk.watch.subtle` | `#FAF2DF` | 观察区底 | — |
| `color.risk.watch.border` | `#EBD9A8` | 观察区描边 | — |
| `color.risk.safe.default` | `#2F6B4F` | 安全区 | 6.4:1 |
| `color.risk.safe.subtle` | `#EAF3EE` | 安全区底 | — |
| `color.risk.safe.border` | `#C0DCCB` | 安全区描边 | — |

**深色模式**

| 语义 Token | 色值 |
|---|---|
| `color.accent.default` | `#5C9DD1` |
| `color.accent.hover` | `#7BB2DC` |
| `color.accent.active` | `#94C3E4` |
| `color.accent.subtle` | `#14242F` |
| `color.accent.subtleBorder` | `#28485C` |
| `color.accent.ring` | `rgba(92,157,209,0.45)` |
| `color.risk.high.default` | `#E8846F` |
| `color.risk.high.subtle` | `#2E1A17` |
| `color.risk.high.border` | `#5A2E26` |
| `color.risk.watch.default` | `#D9A441` |
| `color.risk.watch.subtle` | `#2A2114` |
| `color.risk.watch.border` | `#584324` |
| `color.risk.safe.default` | `#5FB38A` |
| `color.risk.safe.subtle` | `#12281E` |
| `color.risk.safe.border` | `#24483A` |

#### 3.1.5 表面与文本（浅色）

| Token | 值 | 说明 |
|---|---|---|
| `color.bg.page` | `#FBFCFD` | 页面底 |
| `color.bg.surface` | `#FFFFFF` | 卡片 / 内容容器 |
| `color.bg.sunken` | `#F4F6F8` | 三级表面：hover 底、分组底、进度条轨道 |
| `color.text.primary` | `#101A24` | 题干、正文、分数（17:1） |
| `color.text.secondary` | `#53616E` | 维度解释、辅助正文（6.3:1） |
| `color.text.tertiary` | `#67727F` | 题号、脚注、元信息（4.8:1，不可再浅） |
| `color.text.onAccent` | `#FFFFFF` | 强调色底上的文字 |
| `color.border.subtle` | `#E9EDF1` | 行分隔线（divider） |
| `color.border.default` | `#DFE4E9` | 卡片、输入框、按钮描边 |
| `color.border.strong` | `#C6CDD5` | hover 描边、进度条未答段 |

**深色模式**：`bg.page` `#0C1116` / `bg.surface` `#141A21` / `bg.sunken` `#1B222A`；`text.primary` `#E6EBF1` / `secondary` `#9AA7B4` / `tertiary` `#7A8794`；`border.subtle` `#1B222A` / `default` `#2A333D` / `strong` `#3A4551`。

#### 3.1.6 颜色使用禁令

- 禁止任何渐变作为主视觉（尤其紫→粉、indigo→pink）
- 禁止 `background-clip: text` 渐变文字
- 禁止 `border-left` / `border-right` 宽度 > 1px 的彩色强调条（AI 味红线）
- 禁止同一元素上同时出现 `1px solid 边框` 与 `blur ≥ 16px 阴影`（幽灵卡片）
- 禁止三档风险色用于装饰；它们只出现在风险语境
- 风险色不得作为唯一区分：必须同时有文字标签 + 量表条位置

### 3.2 字体

#### 3.2.1 字体栈

```css
--font-sans: "Inter", "PingFang SC", "HarmonyOS Sans SC", "Noto Sans SC",
             "Microsoft YaHei", system-ui, -apple-system, sans-serif;
--font-mono: "JetBrains Mono", "SFMono-Regular", "Roboto Mono",
             ui-monospace, monospace;
```

- **西文**：Inter。它作为 UI 正文字体是被允许的默认选择，但本项目**不**把它当展示字体用，也不靠它制造「高级感」；层级全靠字重与间距
- **中文**：PingFang SC（macOS/iOS）优先 → HarmonyOS Sans SC → Noto Sans SC → 微软雅黑。全部走系统栈，**不加载中文字体文件**（中文 Web Font 体积不可接受）
- **等宽**：JetBrains Mono，仅用于题号、量表刻度数字、分数、样本编号、N 计数

#### 3.2.2 中英混排规则（关键）

1. Inter 放在字体栈最前，中文字符自动回落到中文字体 —— 这是混排的正确姿势，不要给中文单独加 class
2. **中文正文最小 15px**。西文可以 14px，中文 14px 在小屏会糊
3. 中文行高 1.7，西文/标题行高 1.2~1.3
4. 中西文之间**不加空格**，由 `text-autospace` 或直接不处理（浏览器默认已足够）
5. 所有数字（分数、题号、N 计数、量表刻度）强制 `font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1;` —— 防止翻页时数字宽度跳动
6. 中文**不使用 font-weight 700**。最重只到 600，否则笔画糊成一团

#### 3.2.3 字号 / 行高 / 字距（8 级）

| Token | 字号 | 行高 | 字重 | 字距 | 用途 |
|---|---|---|---|---|---|
| `text.xs` | 12px | 18px | 400 | 0 | 题号、脚注、卡片元信息 |
| `text.sm` | 13px | 20px | 400/500 | 0.01em | 量表端点标签、chip、维度组小标题 |
| `text.base` | 15px | 25px | 400 | 0 | 次级正文、维度解释 |
| `text.md` | 16px | 27px | 400 | 0 | 正文主体 |
| `text.lg` | 18px | 30px | 500 | 0 | **题干**（必须够大，量表施测的前提） |
| `text.xl` | 21px | 30px | 600 | -0.01em | 区块标题、软件名 |
| `text.2xl` | 26px | 36px | 600 | -0.01em | 页面标题 |
| `text.metric` | 44px | 48px | 500 | -0.02em | 结果页主分数（mono, tabular-nums） |
| `text.metricLg` | 64px | 68px | 500 | -0.02em | 分享卡片主分数（mono, tabular-nums） |

- 字重只有三档：**400（读）/ 500（强调）/ 600（宣告）**。禁止 300（中文太细）、禁止 700（中文太糊）
- 全大写英文标签（若有）必须 `letter-spacing: 0.06em` 以上。但本项目**不建议使用全大写小标签**（属 AI 语法红线），故基本不用

### 3.3 间距 / 圆角 / 边框 / 阴影

**间距（4px 基准网格）**

```
space.hair  2px   仅用于进度条段间、量表条段间（唯一非 4 倍数，且只做间隙不做内边距）
space.2xs   4px
space.xs    8px
space.sm   12px
space.md   16px
space.lg   20px
space.xl   24px
space.2xl  32px
space.3xl  40px
space.4xl  48px
space.5xl  64px
space.6xl  80px
```

节区垂直节奏：桌面 **80px** / 平板 **48px** / 手机 **32px**。
禁止 5 / 7 / 13 / 15 / 22 / 30 等非标值。

**圆角**

```
radius.xs    4px   chip、小标签
radius.sm    6px   按钮、输入框
radius.md    8px   卡片、内容容器（卡片上限，不得超过）
radius.lg   12px   浮层 / 模态 / 分享卡片
radius.pill 9999px 圆点、胶囊
```

禁止 ≥16px 圆角（AI 过度圆滑红线）。

**边框**

```
border.hair      1px solid var(--color-border-subtle)
border.default   1px solid var(--color-border-default)
border.strong    1px solid var(--color-border-strong)
```

卡片默认 = 1px `--border-default` + **无阴影**。层级靠背景色阶，不靠阴影。

**阴影（仅两级，且只给浮层）**

```
shadow.none     none
shadow.overlay  0 1px 2px rgba(16,26,36,.06), 0 4px 12px rgba(16,26,36,.06)   下拉/提示/软件候选列表
shadow.modal    0 8px 32px rgba(16,26,36,.14)                                  模态框
shadow.card     none（默认卡片不投影）
```

**焦点环**

```
focus.ring  0 0 0 2px var(--color-bg-page), 0 0 0 4px var(--color-accent-ring)
```

2px 底色隔离 + 2px 强调环。禁止 `outline: none`。

**层级（z-index）**

```
z.base 0 ／ z.sticky 10 ／ z.overlay 100 ／ z.modal 200 ／ z.toast 300
```

### 3.4 动效

| Token | 值 | 场景 |
|---|---|---|
| `duration.instant` | 80ms | 按钮按下、radio 选中 |
| `duration.fast` | 150ms | hover、focus、颜色过渡（跨系统收敛值） |
| `duration.base` | 200ms | 下拉展开、Toast 弹出 |
| `duration.slow` | 280ms | 题目翻页（淡入 + 8px 上移） |
| `duration.reveal` | 600ms | 结果页量表条游标入场（**全局唯一一次**装饰性动效） |

**缓动**

```
easing.standard  cubic-bezier(0.2, 0, 0, 1)      默认
easing.entrance  cubic-bezier(0.16, 1, 0.3, 1)   入场
easing.exit      cubic-bezier(0.4, 0, 1, 1)      退场
```

**禁止** `cubic-bezier(0.68, -0.55, 0.265, 1.55)` 及任何带回弹 / 过冲的缓动。

**只动 transform 与 opacity**，禁止动画 `width` / `height` / `top` / `left`（会触发布局与 CLS）。
量表条游标用 `transform: translateX()`。

**`prefers-reduced-motion: reduce`**：所有 transition / animation 降为 `0.01ms`，量表条游标直接落位无动画，题目翻页改为瞬时替换。

### 3.5 图标（Lucide，全项目唯一来源）

- 引入：`lucide-react`，全局 `strokeWidth={1.5}`（Lucide 默认 2 偏重，1.5 更贴合克制调性）
- 尺寸只有三档：**16px（行内 / 按钮内）/ 20px（独立图标按钮内）/ 24px（空状态与区块标识）**
- 颜色：继承 `currentColor`，禁止单独设色（语义色通过文字色传递）
- 禁止第二套图标库、禁止图标字体、禁止 emoji 作功能图标

**本项目图标映射表（固定，不得另选）**

| 语义 | Lucide 图标 | 尺寸 |
|---|---|---|
| 下一题 | `ArrowRight` | 16 |
| 上一题 | `ArrowLeft` | 16 |
| 已选中 / 确认 | `Check` | 16 |
| 软件搜索（combobox） | `Search` | 16 |
| 保存结果图 | `Download` | 16 |
| 复制文案 | `Copy` | 16 |
| 复制链接 | `Link` | 16 |
| 再测一个软件 | `RotateCcw` | 16 |
| 折叠展开 | `ChevronDown` | 16 |
| 关闭 | `X` | 20 |
| 方法说明 / 信息 | `Info` | 16 |
| 局限与注意 | `AlertTriangle` | 16 |
| 匿名与隐私 | `ShieldCheck` | 16 |
| 深色模式切换 | `Moon` / `Sun` | 20 |
| 维度 / 因子分组 | `Layers` | 16 |
| 错误 | `AlertCircle` | 16 |
| 加载中 | `Loader2`（配 `animate-spin`） | 16 |
| 空状态 | `Inbox` | 24 |

### 3.6 `design-tokens.json` 结构草案

命名全部语义化（按用途，不按色相）。采用 W3C Design Tokens 近似格式，主题切换用 `$extensions.mode.dark` 承载。前端消费方式见 3.7。

```json
{
  "$description": "状态承载量自测工具 Design Tokens v0.1",
  "$extensions": { "themeStrategy": "extensions.mode.dark" },

  "palette": {
    "$description": "primitive 层，仅供语义层引用，组件禁止直接使用",
    "neutral": {
      "000": { "$type": "color", "$value": "#FFFFFF" },
      "025": { "$type": "color", "$value": "#FBFCFD", "$extensions": { "mode": { "dark": "#0C1116" } } },
      "050": { "$type": "color", "$value": "#F4F6F8", "$extensions": { "mode": { "dark": "#141A21" } } },
      "100": { "$type": "color", "$value": "#E9EDF1", "$extensions": { "mode": { "dark": "#1B222A" } } },
      "200": { "$type": "color", "$value": "#DFE4E9", "$extensions": { "mode": { "dark": "#2A333D" } } },
      "300": { "$type": "color", "$value": "#C6CDD5", "$extensions": { "mode": { "dark": "#3A4551" } } },
      "400": { "$type": "color", "$value": "#9AA5B1", "$extensions": { "mode": { "dark": "#5A6674" } } },
      "500": { "$type": "color", "$value": "#67727F", "$extensions": { "mode": { "dark": "#7A8794" } } },
      "600": { "$type": "color", "$value": "#53616E", "$extensions": { "mode": { "dark": "#9AA7B4" } } },
      "700": { "$type": "color", "$value": "#35414D", "$extensions": { "mode": { "dark": "#B9C4CF" } } },
      "800": { "$type": "color", "$value": "#1F2A35", "$extensions": { "mode": { "dark": "#D8DEE5" } } },
      "900": { "$type": "color", "$value": "#101A24", "$extensions": { "mode": { "dark": "#E6EBF1" } } },
      "950": { "$type": "color", "$value": "#0A1219", "$extensions": { "mode": { "dark": "#F2F5F8" } } }
    }
  },

  "color": {
    "bg": {
      "page":     { "$type": "color", "$value": "{palette.neutral.025}", "$extensions": { "mode": { "dark": "{palette.neutral.025}" } } },
      "surface":  { "$type": "color", "$value": "{palette.neutral.000}", "$extensions": { "mode": { "dark": "{palette.neutral.050}" } } },
      "sunken":   { "$type": "color", "$value": "{palette.neutral.050}", "$extensions": { "mode": { "dark": "{palette.neutral.100}" } } }
    },
    "text": {
      "primary":   { "$type": "color", "$value": "{palette.neutral.900}", "$extensions": { "mode": { "dark": "{palette.neutral.900}" } } },
      "secondary": { "$type": "color", "$value": "{palette.neutral.600}", "$extensions": { "mode": { "dark": "{palette.neutral.600}" } } },
      "tertiary":  { "$type": "color", "$value": "{palette.neutral.500}", "$extensions": { "mode": { "dark": "{palette.neutral.500}" } } },
      "onAccent":  { "$type": "color", "$value": "#FFFFFF", "$extensions": { "mode": { "dark": "#0A1219" } } }
    },
    "border": {
      "subtle":  { "$type": "color", "$value": "{palette.neutral.100}", "$extensions": { "mode": { "dark": "{palette.neutral.100}" } } },
      "default": { "$type": "color", "$value": "{palette.neutral.200}", "$extensions": { "mode": { "dark": "{palette.neutral.200}" } } },
      "strong":  { "$type": "color", "$value": "{palette.neutral.300}", "$extensions": { "mode": { "dark": "{palette.neutral.300}" } } }
    },
    "accent": {
      "default":      { "$type": "color", "$value": "#17557F", "$extensions": { "mode": { "dark": "#5C9DD1" } } },
      "hover":        { "$type": "color", "$value": "#0F4266", "$extensions": { "mode": { "dark": "#7BB2DC" } } },
      "active":       { "$type": "color", "$value": "#0B3452", "$extensions": { "mode": { "dark": "#94C3E4" } } },
      "subtle":       { "$type": "color", "$value": "#E8F1F8", "$extensions": { "mode": { "dark": "#14242F" } } },
      "subtleBorder": { "$type": "color", "$value": "#B8D4E8", "$extensions": { "mode": { "dark": "#28485C" } } },
      "ring":         { "$type": "color", "$value": "rgba(23,85,127,0.35)", "$extensions": { "mode": { "dark": "rgba(92,157,209,0.45)" } } }
    },
    "risk": {
      "high":  { "default": { "$type": "color", "$value": "#A63A2E", "$extensions": { "mode": { "dark": "#E8846F" } } },
                 "subtle":  { "$type": "color", "$value": "#FBEEEC", "$extensions": { "mode": { "dark": "#2E1A17" } } },
                 "border":  { "$type": "color", "$value": "#EFC9C3", "$extensions": { "mode": { "dark": "#5A2E26" } } } },
      "watch": { "default": { "$type": "color", "$value": "#9A6B12", "$extensions": { "mode": { "dark": "#D9A441" } } },
                 "subtle":  { "$type": "color", "$value": "#FAF2DF", "$extensions": { "mode": { "dark": "#2A2114" } } },
                 "border":  { "$type": "color", "$value": "#EBD9A8", "$extensions": { "mode": { "dark": "#584324" } } } },
      "safe":  { "default": { "$type": "color", "$value": "#2F6B4F", "$extensions": { "mode": { "dark": "#5FB38A" } } },
                 "subtle":  { "$type": "color", "$value": "#EAF3EE", "$extensions": { "mode": { "dark": "#12281E" } } },
                 "border":  { "$type": "color", "$value": "#C0DCCB", "$extensions": { "mode": { "dark": "#24483A" } } } }
    }
  },

  "font": {
    "family": {
      "sans": { "$type": "fontFamily", "$value": "\"Inter\", \"PingFang SC\", \"HarmonyOS Sans SC\", \"Noto Sans SC\", \"Microsoft YaHei\", system-ui, sans-serif" },
      "mono": { "$type": "fontFamily", "$value": "\"JetBrains Mono\", \"SFMono-Regular\", \"Roboto Mono\", ui-monospace, monospace" }
    },
    "weight": {
      "read":     { "$type": "fontWeight", "$value": 400 },
      "emphasis": { "$type": "fontWeight", "$value": 500 },
      "announce": { "$type": "fontWeight", "$value": 600 }
    },
    "size": {
      "xs":       { "$type": "dimension", "$value": "0.75rem" },
      "sm":       { "$type": "dimension", "$value": "0.8125rem" },
      "base":     { "$type": "dimension", "$value": "0.9375rem" },
      "md":       { "$type": "dimension", "$value": "1rem" },
      "lg":       { "$type": "dimension", "$value": "1.125rem" },
      "xl":       { "$type": "dimension", "$value": "1.3125rem" },
      "2xl":      { "$type": "dimension", "$value": "1.625rem" },
      "metric":   { "$type": "dimension", "$value": "2.75rem" },
      "metricLg": { "$type": "dimension", "$value": "4rem" }
    },
    "lineHeight": {
      "xs":     { "$type": "dimension", "$value": "1.125rem" },
      "sm":     { "$type": "dimension", "$value": "1.25rem" },
      "base":   { "$type": "dimension", "$value": "1.5625rem" },
      "md":     { "$type": "dimension", "$value": "1.6875rem" },
      "lg":     { "$type": "dimension", "$value": "1.875rem" },
      "xl":     { "$type": "dimension", "$value": "1.875rem" },
      "2xl":    { "$type": "dimension", "$value": "2.25rem" },
      "metric": { "$type": "dimension", "$value": "3rem" }
    },
    "letterSpacing": {
      "normal":  { "$type": "dimension", "$value": "0" },
      "small":   { "$type": "dimension", "$value": "0.01em" },
      "tight":   { "$type": "dimension", "$value": "-0.01em" },
      "tighter": { "$type": "dimension", "$value": "-0.02em" }
    }
  },

  "space": {
    "hair": { "$type": "dimension", "$value": "0.125rem" },
    "2xs":  { "$type": "dimension", "$value": "0.25rem" },
    "xs":   { "$type": "dimension", "$value": "0.5rem" },
    "sm":   { "$type": "dimension", "$value": "0.75rem" },
    "md":   { "$type": "dimension", "$value": "1rem" },
    "lg":   { "$type": "dimension", "$value": "1.25rem" },
    "xl":   { "$type": "dimension", "$value": "1.5rem" },
    "2xl":  { "$type": "dimension", "$value": "2rem" },
    "3xl":  { "$type": "dimension", "$value": "2.5rem" },
    "4xl":  { "$type": "dimension", "$value": "3rem" },
    "5xl":  { "$type": "dimension", "$value": "4rem" },
    "6xl":  { "$type": "dimension", "$value": "5rem" }
  },

  "radius": {
    "xs":   { "$type": "dimension", "$value": "4px" },
    "sm":   { "$type": "dimension", "$value": "6px" },
    "md":   { "$type": "dimension", "$value": "8px" },
    "lg":   { "$type": "dimension", "$value": "12px" },
    "pill": { "$type": "dimension", "$value": "9999px" }
  },

  "border": {
    "hair":    { "$type": "border", "$value": { "width": "1px", "style": "solid", "color": "{color.border.subtle}" } },
    "default": { "$type": "border", "$value": { "width": "1px", "style": "solid", "color": "{color.border.default}" } },
    "strong":  { "$type": "border", "$value": { "width": "1px", "style": "solid", "color": "{color.border.strong}" } }
  },

  "shadow": {
    "none":    { "$type": "boxShadow", "$value": "none" },
    "overlay": { "$type": "boxShadow", "$value": "0 1px 2px rgba(16,26,36,.06), 0 4px 12px rgba(16,26,36,.06)" },
    "modal":   { "$type": "boxShadow", "$value": "0 8px 32px rgba(16,26,36,.14)" }
  },

  "focus": {
    "ring": { "$type": "boxShadow", "$value": "0 0 0 2px {color.bg.page}, 0 0 0 4px {color.accent.ring}" }
  },

  "motion": {
    "duration": {
      "instant": { "$type": "duration", "$value": "80ms" },
      "fast":    { "$type": "duration", "$value": "150ms" },
      "base":    { "$type": "duration", "$value": "200ms" },
      "slow":    { "$type": "duration", "$value": "280ms" },
      "reveal":  { "$type": "duration", "$value": "600ms" }
    },
    "easing": {
      "standard": { "$type": "cubicBezier", "$value": [0.2, 0, 0, 1] },
      "entrance": { "$type": "cubicBezier", "$value": [0.16, 1, 0.3, 1] },
      "exit":     { "$type": "cubicBezier", "$value": [0.4, 0, 1, 1] }
    }
  },

  "layout": {
    "container": {
      "question": { "$type": "dimension", "$value": "680px" },
      "result":   { "$type": "dimension", "$value": "880px" },
      "share":    { "$type": "dimension", "$value": "540px" }
    },
    "gutter": {
      "phone":   { "$type": "dimension", "$value": "20px" },
      "tablet":  { "$type": "dimension", "$value": "24px" },
      "desktop": { "$type": "dimension", "$value": "32px" }
    },
    "sectionY": {
      "desktop": { "$type": "dimension", "$value": "80px" },
      "tablet":  { "$type": "dimension", "$value": "48px" },
      "phone":   { "$type": "dimension", "$value": "32px" }
    }
  },

  "z": {
    "base":    { "$type": "number", "$value": 0 },
    "sticky":  { "$type": "number", "$value": 10 },
    "overlay": { "$type": "number", "$value": 100 },
    "modal":   { "$type": "number", "$value": 200 },
    "toast":   { "$type": "number", "$value": 300 }
  }
}
```

### 3.7 前端消费方式

1. Token 源文件放 `src/design/tokens.json`，用 Style Dictionary（或一段 20 行的 node 脚本）编译成：
   - `src/styles/tokens.css` —— `:root { --color-bg-page: #FBFCFD; ... }` 与 `[data-theme="dark"] { ... }` 两块
   - `src/design/tokens.ts` —— 供 JS 侧（Canvas 绘制分享卡片）读取
2. **Tailwind 只映射语义层，不暴露 primitive 色阶**（防止组件里直接写 `bg-neutral-200`）
3. 主题切换：`<html data-theme="light|dark">`，首屏用内联脚本读 `localStorage.theme`（fallback `prefers-color-scheme`），避免主题闪烁
4. 加 `<meta name="color-scheme" content="light dark">`
5. 分享卡片渲染**固定读 light 分支**（见 4.2.5）

**Tailwind 配置片段**

```js
// tailwind.config.js
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg:      { page: 'var(--color-bg-page)', surface: 'var(--color-bg-surface)', sunken: 'var(--color-bg-sunken)' },
        fg:      { DEFAULT: 'var(--color-text-primary)', muted: 'var(--color-text-secondary)', subtle: 'var(--color-text-tertiary)', onAccent: 'var(--color-text-onAccent)' },
        line:    { DEFAULT: 'var(--color-border-default)', subtle: 'var(--color-border-subtle)', strong: 'var(--color-border-strong)' },
        accent:  { DEFAULT: 'var(--color-accent-default)', hover: 'var(--color-accent-hover)', active: 'var(--color-accent-active)', subtle: 'var(--color-accent-subtle)', subtleBorder: 'var(--color-accent-subtleBorder)' },
        high:    { DEFAULT: 'var(--color-risk-high-default)', subtle: 'var(--color-risk-high-subtle)', border: 'var(--color-risk-high-border)' },
        watch:   { DEFAULT: 'var(--color-risk-watch-default)', subtle: 'var(--color-risk-watch-subtle)', border: 'var(--color-risk-watch-border)' },
        safe:    { DEFAULT: 'var(--color-risk-safe-default)', subtle: 'var(--color-risk-safe-subtle)', border: 'var(--color-risk-safe-border)' },
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        xs:   ['0.75rem',   { lineHeight: '1.125rem' }],
        sm:   ['0.8125rem', { lineHeight: '1.25rem' }],
        base: ['0.9375rem', { lineHeight: '1.5625rem' }],
        md:   ['1rem',      { lineHeight: '1.6875rem' }],
        lg:   ['1.125rem',  { lineHeight: '1.875rem' }],
        xl:   ['1.3125rem', { lineHeight: '1.875rem' }],
        '2xl':['1.625rem',  { lineHeight: '2.25rem' }],
        metric:   ['2.75rem', { lineHeight: '3rem' }],
        metricLg: ['4rem',    { lineHeight: '1.05' }],
      },
      borderRadius: { xs: '4px', sm: '6px', md: '8px', lg: '12px' },
      spacing: { hair: '2px', '2xs': '4px', xs: '8px', sm: '12px', md: '16px', lg: '20px', xl: '24px', '2xl': '32px', '3xl': '40px', '4xl': '48px', '5xl': '64px', '6xl': '80px' },
      boxShadow: {
        overlay: '0 1px 2px rgba(16,26,36,.06), 0 4px 12px rgba(16,26,36,.06)',
        modal:   '0 8px 32px rgba(16,26,36,.14)',
        focus:   '0 0 0 2px var(--color-bg-page), 0 0 0 4px var(--color-accent-ring)',
      },
      maxWidth: { question: '680px', result: '880px', share: '540px' },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2,0,0,1)',
        entrance: 'cubic-bezier(0.16,1,0.3,1)',
      },
      transitionDuration: { instant: '80ms', fast: '150ms', base: '200ms', slow: '280ms', reveal: '600ms' },
    },
  },
};
```

---

## 4. 页面设计提示词

### 4.0 信息架构与路由

| 路由 | 页面 | 步序 | 容器宽 |
|---|---|---|---|
| `/` | 第 0 步：选软件 + 知情同意 | 步 1 | 680px |
| `/q/:id`（1..9） | 第 N 题（量表题） | 步 2–10 | 680px |
| `/preview` | 结果预览（**第 10 步的产出画面，非独立步**） | 步 11 | 680px |
| `/s/:id`（S1/S2/S3） | 背景信息第 N 题 | 步 12–14 | 680px |
| `/result/:sessionId` | 结果页（两种入口：S3 后提交 / 「到此为止」本地结果） | 终 | 880px |

不设独立落地页。**首屏即第 0 步**（P0 红线 5）。
URL 可深链，支持刷新不丢答案（答案存 `sessionStorage` + 每步同步到内存 store）。
**中途关页再回来**：从 `sessionStorage` 恢复到上次所在步（含背景题已答值），不重头开始 —— 这是降低有效流失的第一道防线。

**步序由配置驱动，不写死。** 前端实现为一份 `flow.steps.ts`（数组，`{ id, route, kind: 'select'|'likert'|'preview'|'strata', required }`），进度条、翻页、播报全部读这份数组。理由见 §4.5.3：上线后可能需要把 S2/S3 前移到第 0 步，写死就得改 5 处。

**API 调用只有两次（与屏数无关）：**
- `GET /api/v1/config` —— 启动时拉 `calibration`（p33/p67 或 k-means cutpoints）与 `max_score`，**结果预览在本地用这份基线算**，不发任何请求
- `POST /api/v1/submissions` —— 只在答完 S3 之后发一次，`answers` 与 `strata` 同时非空
- `POST /api/v1/abandon` —— 离开/关闭页面时上报 `last_question_index`，用于校准 §4.5 的完成率预估

**全局 Header（三页共用，高度 56px）**

```
左：工具名「状态承载量自测」14px/500 + 右侧竖分隔线 + 「澳门科技大学 · 互动媒体艺术」12px tertiary
右：深色模式切换（20px Moon/Sun，44×44 热区）
```
- 背景 `--color-bg-page`，底部 1px `--color-border-subtle`
- 滚动时 `position: sticky; top: 0`，加 `backdrop-filter: blur(8px)` + 背景 90% 透明（**这是唯一的毛玻璃用例，且有明确功能目的：保持 header 内容可读**，不违反红线）
- 移动端隐藏机构署名，只留工具名

---

### 4.1 问卷页

#### 4.1.1 判断一：一屏一题，不用列表式

**结论：一屏一题（每屏一道题）。**

理由（按重要性排序）：

1. **完成率**：对话式表单比传统多字段表单完成率高 15%~30%；且行业基准显示题目超过 6 道后完成率跌破 50% —— 我们有 9 道，正处在高流失区间，必须靠分页把感知长度压下来
2. **认知负荷**：列表式下 9 题 × 5 选项 = 45 个可见控件，远超工作记忆的 4 项/组上限，被试会开始「扫读 + 直线作答」（straight-lining），这是量表数据最常见的污染源
3. **移动端物理约束**：5 点 Likert 在 360px 宽下若保持横向等距，每格仅约 62px，四字中文标签（「比较不同意」）必然挤断换行，**破坏等距性** —— 而等距性是 Likert 量表可被视为等距数据的前提
4. **量表完整性**：量表题的作答应是一次一个判断，而非跨题比较

**但必须做 4 项改造，否则一屏一题会引入它自己的问题：**

| 常见做法 | 本项目做法 | 原因 |
|---|---|---|
| Typeform 建议隐藏总题数 | **明确显示「第 3 / 9 题」** | 增长技巧 vs 研究伦理。被试必须知情 |
| 不允许回看 | **保留「上一题」，且进度条已答段可点击回跳** | 一屏一题最大的抱怨是无法检查修改。学术上也应允许被试修正 |
| 花哨转场 | **280ms 淡入 + 8px 上移，仅此** | 动画会拖慢施测节奏、分散注意力；且禁弹性缓动 |
| Enter 自动跳题 | **数字键 1-5 选中（不跳页），Enter 显式确认才进入下一题** | 防误触导致的数据污染 |

#### 4.1.2 判断二：进度指示 = 分段细条 + 文字计数

**结论：顶部 2px 高的分段进度轨 + 「第 3 / 9 题」文字。**

规格：
- 轨道：`height: 2px`，宽 = 内容区宽（680px），置于题干上方 24px 处
- **段数 = 14 段，分两组**（完整步序见 §4.0）：
  - **核心组 11 段**：第 0 步 + 第 1–9 题 + 结果预览。段高 2px，`gap: 2px`
  - **背景组 3 段**：S1 / S2 / S3（S4 与 S3 同屏，不占段）。段高 2px
  - 组间 `gap: 8px` —— 这 8px 是唯一的分组信号，不用文字、不用分隔线
- 状态色：
  - 已完成（核心组）→ `--color-accent-default` 实色
  - 已完成（背景组）→ `--color-accent-default` **50% 透明度**（视觉上"附加产出"，弱于核心）
  - 当前 → `--color-accent-default` 30% 透明度 + 高度提升到 4px（负 margin 保持不撑高布局）
  - 未开始（核心组）→ `--color-border-strong`
  - 未开始（背景组）→ `--color-border-subtle`（**比核心组更淡** —— 用户答到第 9 题时，右侧三段应该是几乎看不见的，而不是三段刺眼的"还有三段"）
- 过渡：`background-color 150ms standard`，`height` **不做动画**（防 CLS）
- 无障碍：`role="progressbar"` + `aria-valuemin="0"` + `aria-valuemax="14"`
  - 核心步：`aria-valuenow="4"` + `aria-valuetext="第 4 步，共 14 步"`
  - 预览步：`aria-valuenow="11"` + `aria-valuetext="第 11 步，共 14 步，结果预览"`
  - 背景步：`aria-valuenow="12"` + `aria-valuetext="背景信息第 1 步，共 3 步；全流程第 12 步，共 14 步"`
- 已完成的段可点击回跳：`<button>` 包裹，热区通过 `padding: 8px 0` + `margin: -8px 0` 扩到 ≥20px 高（视觉仍是 2px），`title` 写「返回第 2 步」
- 移动端同样显示，不隐藏，不改为百分比环形

**明确不做**：百分比大数字、渐变填充条、环形进度、动画弹跳、完成后打勾的庆祝动效。

#### 4.1.2b 「步」与「题」两个数字的播报规则（扩展版，含背景题）

两个数字并存是有意的，不是笔误。规则如下，**前端不得混用**：

| 术语 | 指什么 | 分母 | 出现在哪 | 为什么这样切 |
|---|---|---|---|---|
| **题** | 只指 9 道计入分数的 Likert 量表题 | 9 | 量表题屏「第 3 / 9 题 · 维度二」 | 「题」在用户心智里 = "影响我分数的题"。背景题不进这个分母 |
| **背景信息** | S1–S3（+S4 选填），不计分 | 3 | 背景题屏「背景信息 1 / 3」 | 明确告知"这不是第 10 题"，避免用户以为分数还会变 |
| **步** | 一屏 = 一步 | 14 | 进度轨 `aria-valuetext`、知情同意页 | 唯一的跨阶段总进度口径 |

**禁止**的播报：
- 背景题屏写「第 10 / 12 题」—— 用户会以为还有 2 道量表题，且以为分数会变
- 量表题屏写「第 3 / 14 步」—— 第 3 题时给 14 步的分母，会让人觉得"才走了 1/5，太长了"
- 任何地方写「第 10 题」—— 第 10 步是结果预览，不是题

#### 4.1.3 判断三：5 点 Likert = 全标注分段按钮组（radio group）

**结论：横向等宽 5 格的分段按钮组（`<input type="radio">` 视觉隐藏 + `<label>` 可见），全点标注，移动端转纵向堆叠。**

排除项的理由：

| 候选 | 结论 | 理由 |
|---|---|---|
| 滑杆 | **禁用** | CHI'24 实证（Farzand et al.）：滑杆交互成本更高、更易产生响应偏差；**滑杆初始位置显著影响作答，智能手机上尤其严重**。中文实测口碑也证实滑杆诱发中庸倾向、降低区分度 |
| 星形 / 表情 | **禁用** | 图形量表效度差于文字标注量表；且直接触发娱乐测试观感 |
| 5 张大卡片 | 不用 | 占屏过大、移动端无法并排、视觉噪音超过信息量 |
| 下拉选择 | 不用 | 下拉的认知负荷高于单选按钮，且隐藏了量表的等距结构 |

规格（桌面 / 平板 ≥640px）：

```
┌──────────────────────────────────────────────────────┐
│  1          2          3          4          5       │  ← mono 12px，tertiary
│ 完全不同意  不太同意  一般/中立  比较同意  完全同意   │  ← 13px/500
└──────────────────────────────────────────────────────┘
   等宽 5 格 · 每格 min-width 88px · gap 2px · 高 56px
```

- 容器：外框 `1px solid --border-default`，`border-radius: 8px`，`overflow: hidden`，段间用 **2px `--color-bg-page` 分隔**（不是真 gap，是背景色透出）
- 每格内部：`padding: 10px 8px`，数字在上（mono 12px tertiary），标签在下（13px/500）
- 状态：
  - Default：底 `--color-bg-surface`，文字 `--color-text-secondary`
  - Hover：底 `--color-bg-sunken`，边框不变
  - **Selected**：底 `--color-accent-default`，文字 `--color-text-on-accent`，数字也变白（此时 tertiary 不适用）
  - Focus-visible：`box-shadow: focus.ring`，`z-index` 提升保证环不被相邻格裁切（用 `position: relative; z-index: 1`）
  - Disabled：底 `--color-bg-sunken`，文字 `--color-text-tertiary`，`cursor: not-allowed`
- 过渡：`background-color / color` 各 150ms standard
- 键盘：原生 radio group 语义。`←/→` 或 `↑/↓` 移动并同时选中，`Home/End` 跳首尾，**数字键 1-5 直选**（`keydown` 监听在容器上，不改变选中则不跳页）
- 语义：外层 `role="radiogroup"` + `aria-labelledby="{题干 id}"`，每格 `<input type="radio">` 视觉隐藏（**不是 `display:none`**，用 `sr-only` 保证可聚焦），`<label>` 承载可见内容

规格（手机 <640px）：**纵向堆叠 5 行**

```
┌────────────────────────────────┐
│ ①  完全不同意                  │  高 48px
│ ②  不太同意                    │
│ ③  一般 / 中立                 │
│ ④  比较同意                    │
│ ⑤  完全同意                    │
└────────────────────────────────┘
```

- 每行高 **48px**（≥44px 触摸目标），`gap: 2px`，整行可点
- 左侧 20px 圆形序号（选中时 accent 实心 + 白字；未选中时 1px border + tertiary 数字）
- 标签 15px/400（手机端放大，因为中文 13px 在小屏偏小）
- 选中态：整行底 `--color-accent-subtle`，**文字用 `--color-accent-default`**（不用白底实心 —— 小屏上五格全实心太吵，且弱化了「选中一格」的精确感）
- 理由：横向 5 格在 360px 下每格仅 62px，四字标签必然换行断裂。而**标签必须可见**（全标注是文献共识），所以只能转纵向

**量表设计硬约束（不可违反）：**
- 5 点，含中点，全点标注，所有题目**方向一致**（不同意在左、同意在右，永不翻转）
- 若题目含反向计分（reverse-worded），**计分在后端反转，呈现方向绝不改变** —— 前端不要自作聪明翻转选项顺序
- 端点标签与中点标签由研究侧（洪兄）定稿，前端不得改写

#### 4.1.4 判断四：选软件 = 预置 chip + 自由输入 combobox（必填）

**结论：混合式。上方 12 个预置 chip 快速选择，下方自由输入 combobox，二者共享同一个值，必填。**

第 0 步完整结构（自上而下）：

```
[1] 区块标题  16px/600：「先选一个你常用的软件」
[2] 说明      15px secondary：「本工具测量的是你与这个软件之间积累的状态承载量。
                              请选择一款你持续使用三个月以上的软件。」
[3] 预置 chip 区（12 个，两行 wrap，gap 8px）
    Photoshop · Excel · PowerPoint · Word · Figma · Premiere
    Blender · Obsidian · Notion · 格式工厂 · 剪映 · AutoCAD
    每个 chip：h 32px，padding 0 12px，radius pill，1px border-default，
               底 bg-surface，文字 13px secondary
    Hover：底 bg-sunken；Selected：底 accent-subtle + border accent + 文字 accent，
            右侧嵌 16px Check 图标
[4] 分隔：12px 间距 + 一行 13px tertiary「或直接输入软件名称」
[5] 输入框 combobox：
    - 高 44px，radius 6px，1px border-default，padding 0 12px 0 36px
    - 左侧嵌 16px Search 图标（tertiary，绝对定位 left 12px）
    - placeholder：「例如：AutoCAD 2024」（真实示例，不用「请输入...」）
    - 输入时实时模糊匹配预置列表 + 一个扩展别名表（PS→Photoshop、pr→Premiere、
      格式工厂→FormatFactory…），候选浮层用 shadow.overlay，最多 6 条，
      每条 44px 高，keyboard ↑↓ 选择 Enter 确认 Esc 关闭
    - WAI-ARIA 1.2 combobox 模式：role="combobox" aria-expanded aria-controls
      aria-autocomplete="list" aria-activedescendant
[6] 【本项已从第 0 步移除】原「选填协变量：使用年限 / 使用频率」两项
    = openapi `Strata.S2` / `Strata.S3`，现已迁移为**必答背景题**，位置在
    结果预览之后（见 §4.4）。第 0 步不再重复采集。
    前端注意：第 0 步若仍保留这两题，会与 §4.4 重复采集且档位口径不一致
    （第 0 步是 4/5 档 chip，S2/S3 是 openapi string enum）→ 直接删掉，不要"同步"。
    若启用 §4.5.3 方案 B，则本项恢复并改为必填 —— 二者二选一，不可同时存在。
[7] 知情同意块：13px，bg-sunken 底，radius 8px，padding 16px，
    左侧 16px ShieldCheck（accent）
    文案要点：匿名、不采集任何个人身份信息、结果用于学位作品与学术研究、
              可随时关闭页面终止、数据不用于商业用途
    **必须明示流程结构**（§7 学位作品专项「总题数在研究开始前明示」）：
      「10 步出结果（选 1 个软件 + 回答 9 道题，约 2 分钟）；
        之后再答 3 步背景信息（不计入你的得分，约 40 秒）即可纳入研究样本；
        背景信息中最后一题可跳过。全程约 3 分钟，中途可随时关闭。」
      排版：块内独立一行，13px/20，前面加 16px ListChecks（accent），
            三个数字（10 / 9 / 3）用 mono 并加 tabular-nums
    + 一个 checkbox「我已阅读并同意」（**必勾才能开始**，不勾选时「开始」按钮 disabled）
    说明：这里不隐藏总长度。§1.1 已经记录 Typeform 官方建议「不要在开头暴露总题数」
    —— 那条建议是增长技巧，与本研究伦理冲突，本工具一律不采用（4.1.1 判断一已裁定）。
[8] 主按钮「开始自测 →」：accent 实心，h 44px，radius 6px，padding 0 20px，
    右侧 16px ArrowRight。全宽（手机）/ 自适应（桌面）
```

**校验与错误：**
- 未选/未填软件点「开始」→ 按钮 disabled + 输入框下方 8px 处显示 13px `color-risk-high-default` 文字 + 16px `AlertCircle`：「请先选择或输入一款软件名称」
- 错误用 `role="alert"` + `aria-describedby` 关联到输入框，焦点自动移到输入框
- **错误必须紧贴字段下方**，不能只在页面顶部（违反可用性基本原则）
- 输入框 border 变 `--color-risk-high-default`

**数据提示（给前端 / 后端）：**
- 存两个字段：`software_raw`（用户原始输入）与 `software_key`（归一化：trim、小写、去空格、别名表映射）
- 归一化规则集中在一份 `softwareAliases.ts`，前后端共用
- 选了预置 chip 时 `software_raw === software_key === 预置名`

#### 4.1.5 题干区与翻页控制

```
[进度条 2px]
[24px 间距]
[12px mono tertiary：「第 3 / 9 题 · 维度二」]      ← 题号用等宽
[8px 间距]
[18px/30 500 primary：题干正文]                     ← 必须 18px
[32px 间距]
[Likert 组件]
[32px 间距]
[底部操作行]
  左：上一题（ghost 按钮：透明底 + 1px border + ArrowLeft 16px + 「上一题」）
  右：下一题（accent 实心 + 「下一题」+ ArrowRight 16px）
  第 1 题无「上一题」（隐藏，不是 disabled）
  第 9 题右按钮文案改「查看结果」—— 进入 §4.3 结果预览步，**不发任何请求**
  注意： 此处不要写「提交」「完成」。用户看到的不是终点，提交发生在 S3 之后（§4.4）
```

- 「下一题」在未作答时 **disabled**（不是隐藏），下方 8px 处 13px tertiary 提示「选择一项后继续」
- 禁用态：`opacity` 不降（避免对比度不达标），改用底 `--color-bg-sunken` + 文字 `--color-text-tertiary` + `cursor: not-allowed`
- 翻页动效：题干 + Likert 容器整体 `opacity 0→1` + `translateY(8px→0)`，280ms entrance
- 翻页时用 `aria-live="polite"` 的区域播报「第 4 题，共 9 题」
- 翻页后焦点移到新题干（给题干容器 `tabIndex={-1}` 并 `.focus()`），**不要**把焦点丢回 body

#### 4.1.6 问卷页状态矩阵

| 状态 | 表现 |
|---|---|
| Loading（首屏） | 题干位置显示骨架块（宽 70% 高 30px + 宽 100% 高 56px），`bg-sunken` 圆角 6px，**不用 spinner**（量表加载极快，spinner 反而制造等待感） |
| Loading（提交中） | 「查看结果」按钮内文字换为「计算中」+ 16px `Loader2` 旋转 + 按钮 disabled + `aria-busy="true"` |
| Empty | 不适用（每题都有选项） |
| Error（提交失败） | 页面内 inline 错误块（非弹窗）：`bg risk-high-subtle` + 1px `border risk-high-border` + radius 8px + padding 16px，含 16px `AlertCircle`、标题「结果计算失败」、说明「你的答案已保存在本地，可重试」、右侧 accent 描边按钮「重试」。**答案存 sessionStorage，重试不丢** |
| Error（网络不可达） | 同上，但说明改为「当前无法提交，结果已缓存在本地，恢复后可继续」+ 提供「仅查看本地结果（不入库）」次按钮 |
| Edge（超长题干） | 题干容器 `overflow-wrap: break-word`，中文自动换行，行高 30px 自适应；不截断、不省略号 |
| Disabled | 见上，用底色变化而非 opacity |

---

### 4.2 结果页

#### 4.2.1 判断五：档位可视化 = 分段量表条 + 游标

**结论：水平分段量表条（segmented scale bar）+ 游标标记。不用仪表盘、不用环形、不用雷达图。**

理由：
- 状态承载量是**单变量连续分数映射到三档** —— 单轴量表条是数据-墨水比最优的表达（Tufte）
- 仪表盘用一个圆盘的面积只编码一个值，是效率最差的图表类型之一；且是消费级信用分 App 的套路，AI 模板味重
- 雷达图的面积随维度顺序变化而失真，不可比、不可比就不可证
- 分段条 + 游标天然实现**双重编码**：位置（连续精确）+ 色块（分档语义）。色觉障碍下位置仍可读 → 满足 WCAG 1.4.1「不能仅靠颜色」

规格：

```
0 ────────────── 33 ────────────── 66 ────────────── 100
[   安全区   ][    观察区     ][     高危区      ]
                    ▲
                  62 分
     承载量低 ←                       → 承载量高
```

- 轨道：`height: 12px`，`border-radius: 6px`，`overflow: hidden`，宽 100%（最大 880px）
- 三段按比例（可由研究侧配置），段间 **2px `--color-bg-page` 间隙**
  - 安全区 0–33：底 `risk.safe.default` @ 18% 透明度（不是浅色 subtle，要在条上保持可见但克制）
  - 观察区 33–66：`risk.watch.default` @ 18%
  - 高危区 66–100：`risk.high.default` @ 18%
- 当前段（62 分落在观察区）：该段透明度提到 **100%**，其余段保持 18% —— 这就是「当前档位」的视觉表达，比换个色更精确
- 游标：
  - 竖线：宽 2px、高 24px（超出轨道上下各 6px）、`--color-text-primary`
  - 顶部标记：宽 28px 高的圆角矩形（radius 4px），内含分数 mono 13px 白字，底 `--color-text-primary`
  - 入场：`transform: translateX(-50%) scale(.8)` → `translateX(-50%) scale(1)`，`opacity 0→1`，600ms entrance，**仅一次**，`prefers-reduced-motion` 下直接落位
  - 定位：`left: {score}%` + `transform: translateX(-50%)`，外层 `position: relative`
- 轴标签：轨道下方 12px 处，左右两端各一个 12px tertiary 文字：「0 · 承载量低」/「100 · 承载量高」。**方向标注必须有**，否则读者无法解释分数含义
- 档位标签：轴标签下方 16px 处，三档名称横排（13px），当前档位用 **600 字重 + 对应 risk.default 色 + 下方 2px 下划线**，非当前档位用 tertiary
- 无障碍：容器 `role="meter"` + `aria-valuemin="0"` + `aria-valuemax="100"` + `aria-valuenow="62"` + `aria-valuetext="62 分，落入观察区"` + `aria-labelledby`

**主分数排版（量表条上方）：**

```
62  /100
│    │
│    └─ 16px tertiary，mono
└────── 44px mono，weight 500，letter-spacing -0.02em，tabular-nums
```
下方 8px 处一行 13px tertiary：「状态承载量得分 · 基于 9 题自陈量表」
**禁止**渐变文字、禁止发光、禁止把分数做成超大数字 + 小标签的「Hero 指标模板」（AI 红线）。

#### 4.2.2 逐维度解释排版

**结论：按因子分 3 组，组内逐条，用「维度名 + 迷你 5 段条 + 解释文字」的行结构。**

理由：8-9 条平铺会超过工作记忆上限（≤4 项/组）；按因子分 3 组后每组 2-3 条，符合分块原则。

```
────────────────────────────────────────────────────────  ← 1px border-subtle（组分隔）
一、状态外显                                    13px/500 secondary
────────────────────────────────────────────────────────

状态痕迹可见度                              ▮▮▮▯▯  3/5
你在 Photoshop 里的工作过程留下了清晰可追溯的中间状态
（图层、历史记录、参数面板）。这些痕迹是你与工具之间
共同生成的，也是承载量的主要来源。                15px/26 secondary

操作可逆性                                  ▮▮▮▮▯  4/5
...
```

- 组标题：13px/500 `--color-text-secondary`，上 `padding-top: 24px`，下 `margin-bottom: 16px`
- **不用卡片盒子**（避免「相同卡片网格」红线），用 `border-top: 1px solid --color-border-subtle` 分组 + 间距分层
- 每条结构（grid）：
  - 桌面：`grid-template-columns: 1fr auto`，左 = 维度名 15px/500，右 = 迷你条
  - 迷你条：5 段，每段 6×6px（选中实心 accent，未选 1px border-strong），`gap: 2px`，右对齐，后跟 mono 12px tertiary「3/5」宽 32px
  - 解释文字：`grid-column: 1 / -1`，`margin-top: 4px`，15px/26 `--color-text-secondary`
- 条与条之间 `margin-top: 24px`
- 移动端 <640px：维度名与迷你条仍同一行（右对齐），解释文字换行；迷你条缩到 5×5px

**解释文案硬要求（前端只负责排版，文案由研究侧定稿，但需满足）：**
- 必须**点名用户填的那个软件**（「你在 Photoshop 里…」），不能是通用模板句
- 必须**引用该题实际得分**（「你给出了 4/5」），让读者确认系统确实用了他的答案
- 必须有**可操作的一句话**，不能是「你很棒」「要小心了」这类空话
- 禁止 AI 套话腔（赋能 / 一站式 / 颠覆性 / 无缝 / 释放潜能）
- 单条 2-3 句，不超过 90 字

#### 4.2.3 分享卡片（ShareCard）规格

**结论：固定 1080 × 1350（3:4），页面内预览 540 × 675（2x），Canvas 渲染导出 PNG。**

- 尺寸选择理由：3:4 在知乎、小红书、小黑盒信息流里都是高占比版式；1080 宽保证文字在压缩后仍清晰
- 渲染方式：`html-to-image`（或 `html2canvas`）对预览 DOM 截图，`scale: 2`；**或**直接用 Canvas 绘制（更可控，推荐后者，因为要保证浅色固定）

**自上而下的内容结构（卡片内 padding 64px）：**

| # | 内容 | 排版 |
|---|---|---|
| 1 | 顶栏：左「状态承载量自测」21px/600；右「澳门科技大学 · 互动媒体艺术」15px tertiary | `border-bottom` 1px line-subtle，`padding-bottom` 24px |
| 2 | 「被测软件」12px tertiary + 软件名 32px/600（如「Adobe Photoshop」） | `margin-top` 40px |
| 3 | 主分数 64px mono/500 + 「/100」20px tertiary | `margin-top` 32px |
| 4 | 分段量表条（与页面同款几何，宽 = 卡片内容宽 952px，高 20px，游标标记 44px 高） | `margin-top` 24px |
| 5 | 档位标签：28px/600 + 8px 圆点（对应 risk 色）+ 一行 15px secondary 档位定义 | `margin-top` 24px |
| 6 | 「得分最高的三个维度」12px tertiary + 3 行紧凑条（维度名 15px + 迷你 5 段条 + 数字） | `margin-top` 40px |
| 7 | 底栏（卡片最底部，`border-top` 1px line-subtle，`padding-top` 24px）：左 = 「样本编号 #A7F3（匿名）」+「N = 213 份」13px tertiary；右 = 二维码 120 × 120（白底，静区 ≥ 4 模块宽） | 左文右码，flex |
| 8 | 底部一行 12px tertiary：「本工具为 design research 自测，结果基于 9 题自陈量表，非替代概率预测。」 | `margin-top` 16px |

**必须包含的三个要素（这是学位作品与市场娱乐测试的分界线）：**

1. **机构署名**「澳门科技大学 · 互动媒体艺术」—— 学位作品署名 + 传播时的可信度锚点
2. **方法论一行声明**「基于 9 题自陈量表，非替代概率预测」—— 防止被误读为预言工具，也是对导师的免责
3. **样本编号 + N 计数**—— 证明这是一个在跑的真实研究，不是一次性的玩具

**二维码：要。** 位置在卡片右下角，120 × 120px，静区充足，指向工具 URL。理由：截图在信息流里传播时，二维码是唯一的回收路径（图片里的文字链接不可点）。

**卡片视觉规则：**
- 背景**固定浅色**（`--color-bg-surface` = `#FFFFFF`），**与 App 当前主题解耦** —— 深色模式下导出也必须是白底卡片，否则在浅色信息流里会是一个突兀的黑块
- 圆角 12px（卡片内），导出时在四周加 40px 纯白外留白
- 1px `--color-border-default` 外框
- **禁止**渐变背景、禁止 emoji、禁止插画、禁止发光
- 深色模式下，卡片预览区在页面中用 `bg-surface` 包裹 + 1px border，与页面其他部分区分

#### 4.2.4 分享与导出入口

**位置：维度解释区块之后、方法论区块之前，一个横向 action row。**

```
[保存结果图 (PNG)]  [复制分享文案]  [复制链接]  [再测一个软件]
   主按钮 accent       次描边 ×2        次描边      ghost 文字按钮
```

- 桌面：一行，左对齐，`gap: 12px`
- 移动端 <640px：**全宽纵向堆叠**，`gap: 8px`，主按钮在最上
- 主按钮：accent 实心，h 44px，padding 0 20px，16px `Download` + 文字（图标左，间距 8px）
- 次按钮：透明底 + 1px `--color-border-default`，h 44px，文字 `--color-text-primary`，hover 底 `--color-bg-sunken`。图标分别 `Copy` / `Link`
- 「再测一个软件」：ghost（无边框），文字 `--color-text-secondary`，16px `RotateCcw`
- 点击反馈：
  - 保存图片 → 按钮内 `Download` 换 `Loader2` 旋转 + 文字「生成中」，完成后换 `Check` + 文字「已保存」，2s 后复原
  - 复制文案 → `Copy` 换 `Check` + 文字「已复制」，1.5s 后复原；同时右下角 Toast（`role="status"`）「分享文案已复制到剪贴板」
  - 全部操作结果用 `aria-live="polite"` 播报
- **不做**：浮动分享球、居中大 CTA 堆叠、社交平台图标彩色的那套分享条

**「复制分享文案」的文案模板**（200 字左右，前端拼接，不得用 AI 腔）：
```
我用「状态承载量自测」测了 {软件名}，得分 {分数}/100，落在{档位}。
{一句该档位的核心含义，来自维度解释中最高分维度的第一句}
这个工具是我学位作品的一部分，用 9 道量表题测量人与软件之间积累的状态。
你也可以试试：{URL}
```
（具体措辞由洪兄定稿，前端只做变量替换）

#### 4.2.5 结果页其余必设区块

**A. 匿名入库确认（维度解释之后，分享之前）**

```
bg-sunken 底 · radius 8px · padding 16px · 左侧 16px ShieldCheck(accent)
13px/20：本次结果尚未纳入研究样本。自测数据不含任何个人身份信息，
         仅记录软件名、9 道题的作答与两个选填协变量。
[ 加入匿名样本库 ]（accent 描边次按钮，h 36px）
已加入状态：整块变 accent-subtle 底 + 16px Check + 「已加入，感谢参与」
```
- **默认不入库**，必须显式点击。这是研究伦理要求，也是评审会看的点
- 点击后按钮变 disabled + 文案变「已加入」，并展示 `样本编号 #A7F3`（mono 13px，前端生成或从后端取）

**B. 方法论与局限（页面最底部，`<details>` 原生折叠，默认收起）**

```
<summary> 方法说明与局限  + 16px ChevronDown（展开时旋转 180deg，150ms）
  内部内容（13px/20 secondary，分 4 小段）：
  1. 量表来源与题目构成（N 题，X 个因子，5 点 Likert）
  2. 计分方式（各题权重、归一化到 0-100、三档阈值依据）
  3. 样本说明（当前已收集 N 份，匿名，采集时间范围）
  4. 局限（自陈量表存在主观偏差；本工具测量的是「状态承载量」这一构念，
         不等于客观替代概率；样本非概率抽样，不可推广到总体）
```
- 用原生 `<details>` / `<summary>` —— 天然键盘可达、无需 ARIA 补丁
- 展开区域左侧 16px `Info`（accent），上方 16px `AlertTriangle`（`risk-watch-default`）配一行「局限」小标题
- **这个区块不许弱化、不许藏到二级页面** —— 它是学位作品面对评审的核心自证

**C. 页脚**

```
12px tertiary，居中或左对齐：
状态承载量自测 · 澳门科技大学人文艺术学院 互动媒体艺术 硕士学位论文作品
数据仅用于学术研究 · 匿名采集 · 无 Cookie 追踪
```

#### 4.2.6 结果页状态矩阵

| 状态 | 表现 |
|---|---|
| Loading（计算中） | 量表条区域显示骨架：一条 100% 宽 12px 的 `bg-sunken` 圆角条 + 一个 44px 高的骨架数字块；维度区显示 3 条骨架行。**骨架形状必须与真实内容一致**（防 CLS，也防「加载像出错」） |
| Empty | 不适用（总是有结果） |
| Error（提交/入库失败） | inline 错误块（同 4.1.6），但**结果仍完整展示**（本地已算完），只是入库按钮区显示错误 + 重试 |
| Edge（分数 = 0 或 = 100） | 游标在端点，`translateX(-50%)` 会溢出轨道 → 用 `clamp()` 限制游标标记在轨道内（竖线仍精确落点，只是顶部标签框内收） |
| Edge（软件名超长） | 卡片与页面标题均用 `text-overflow: ellipsis` + `title` 属性兜底；卡片内最多 2 行，`line-clamp: 2` |
| Edge（维度解释文字长短不一） | 用 grid 对齐，不做等高拉伸；长文字自然换行 |
| Success（入库/复制/保存） | 见 4.2.4 的微反馈，全部 ≤2s 复原，不用常驻成功态 |

---

### 4.3 结果预览步（步 11 · `/preview`）

> **存在的唯一理由：履约。** 用户答完 9 道题，此刻已经付了成本，我们必须先交付，再开口要东西。
> 这不是"做个过渡动画让用户不那么痛"，这是把请求放到价值之后 —— 两者在伦理和转化率上都不是一回事。

#### 4.3.1 判断六：预览展示"档位 + 三因子雏形"，不展示解释

**结论：给分数、给档位、给三个因子的形状；不给逐维度解释、不给分享卡片、不给入库按钮。**

| 内容 | 预览（步 11） | 终页（`/result`） |
|---|---|---|
| 主分数（0–100） | 有（36px mono） | 有（44px mono） |
| 分段量表条 + 游标 | 有（轨道 8px） | 有（轨道 12px） |
| 档位名（高危/观察/安全） | 有 | 有 |
| 三因子名 + 因子分 + 迷你条 | 有 **连续条**（雏形） | 有 **5 段条**（精确刻度） |
| 9 条维度解释文字 | 无 | 有 |
| 分享卡片 / 保存 PNG / 复制文案 | 无 | 有 |
| 匿名入库 opt-in | 无 | 有 |
| 方法论与局限 `<details>` | 无 | 有 |
| 纵向回访入口 | 无 | 有 |

**为什么必须有区别，而且区别要让用户看见：** 如果预览和终页长得一样，用户在 S1 看到"还有 3 步"时的第一反应是"刚才那是假的？"，信任立刻崩塌 —— 这比多答三道题的代价大得多。所以预览**主动声明自己是预览**。

#### 4.3.2 版式（容器 680px）

```
[进度轨：核心组 11 段全 accent 实色 · 背景组 3 段 border-subtle]
[32px]
┌──────────────────────────────────────────────────────┐
│ 结果预览                                    [预览]   │  ← 左 12px mono tertiary
│                                                       │     右 12px pill「预览」
│ 62 /100                                               │  ← 36px mono/500 tabular-nums
│ 状态承载量得分 · 基于 9 题自陈量表   13px tertiary    │
│                                                       │
│ 0 ──────────── 33 ──────────── 66 ──────────── 100   │  ← 轨道 8px（终页是 12px）
│                     ▲                                 │
│                   62 分                               │
│      承载量低 ←                        → 承载量高     │
│  安全区    观察区（当前）    高危区                    │  ← 13px，当前档 600 + risk 色
│                                                       │
│ ──────────────────────────────────────────────────    │  ← 1px border-subtle
│ 一、状态外显                        ▬▬▬▬▬▬░░░░  3.7   │  ← 连续条 96×6px
│ 二、产出形态                        ▬▬▬░░░░░░░  2.3   │     mono 12px
│ 三、制度与协作嵌入                  ▬▬▬▬▬▬▬▬░  4.3   │
│                                                       │
│ 13px tertiary：完整解读（9 个维度逐条说明 + 可保存的   │
│                结果图）在你答完背景信息后生成。        │
└──────────────────────────────────────────────────────┘
[32px]
[16px/600 primary] 还剩 3 道背景信息，用来检验这份量表准不准
[8px]
[13px/20 secondary] 它们不计入你的得分。我们需要知道「用了三年的人」和「用了三天
                    的人」答案是不是该不一样 —— 如果一样，说明这份量表本身有问题。
                    [继续（约 40 秒）]  〔到此为止〕
```

#### 4.3.3 与终页的四重视觉区分（不允许被"优化"掉）

1. **尺寸降级**：主分数 44px → **36px**；量表条轨道 12px → **8px**；容器 880px → **680px**
2. **形态降级**：因子条用**连续填充条**（96×6px，底 `--color-bg-sunken`，填充 `--color-accent-default`），终页用 **5 段条**（6×6px 段）。形态差异本身就是"草图 vs 成品"的信号 —— 连续条是粗略印象，5 段条精确对应 5 点量表的刻度
3. **显式标记**：右上角 `--color-border-default` 描边 + `--color-text-tertiary` 文字的 12px pill「预览」。**不许用 accent 色、不许做成徽章**
4. **动效降级**：分数 `opacity 0→1` 200ms；游标 **200ms 直接落位**（终页是 600ms `scale(.8)→1` 的仪式感入场，那个仪式感只给终页一次）

**反向要求：不许做得比终页更像"结果"。** 禁止在预览页加"你的结果已生成"式文案、禁止恭喜语、禁止任何庆祝动效。

#### 4.3.4 底部的两个出口

| 按钮 | 形态 | 行为 |
|---|---|---|
| **继续（约 40 秒）** | accent 实心主按钮，h 44px，16px `ArrowRight` | → `/s/S1` |
| **到此为止** | ghost 文字按钮，13px `--color-text-secondary`，无边框无图标 | → `/result/:sessionId`（**本地模式**，见下） |

**「到此为止」是伦理要求，不是流失漏洞 —— 但它同时是我们最好的第二入口。**

点击后进入结果页，但页面顶部多一条内联提示（不是弹窗、不是拦截）：

```
bg risk-watch-subtle · 1px risk-watch-border · radius 8px · padding 12px 16px
左 16px Info（risk-watch-default）
13px/20：你选择先不填背景信息，本次结果未纳入研究样本。
         [ 补填 3 道背景题（约 40 秒） ]      ← 次描边按钮 h 32px，13px
```

- 这个提示条**可关闭**（16px `X`，ghost），关闭后不再出现
- 「补填」按钮点击 → 回 `/s/S1`，S3 答完正常提交，`strata` 补齐后该条记录转为完整样本
- 与 §4.2.5 A「默认不入库，必须显式点击」完全同构：用户在预览步退出 = 拿到结果但没入库，与终页不点「加入匿名样本库」是同一种状态，不需要新增一条数据模型

**为什么不给「到此为止」加确认弹窗：** 加确认框就是黑暗模式（dark pattern）—— 用户已经明确表达了"我要走"，拦截他换来的样本带有抵触，而且违反知情同意里"可随时关闭页面终止"的承诺。

#### 4.3.5 预览步状态矩阵

| 状态 | 表现 |
|---|---|
| Loading | 不适用（**纯本地计算**，9 个整数 + config 基线，同步算完）。这里出现任何 spinner 都是设计错误 |
| Error（config 拉取失败 / 无样本基线） | **分数照常显示**（原始分本地可算），档位区不显示三档条，改为 13px tertiary 一行：「当前样本量不足以校准档位（N < 30），暂不给出档位」。**禁止编造档位** |
| Error（未答完 9 题直接深链进入） | 重定向到第一个未答题，不报错 |
| Edge（分数 = 0 或 = 100） | 游标 `clamp()` 限制在轨道内（同 4.2.6） |
| Edge（`calibration.method = prior`，即尚未做经验校准） | 档位标签下方加 12px tertiary 一行：「档位依据理论切点，样本量达标后将用实际分布重新校准」—— 这是 §4.2.5 B 方法论区块的诚实要求，预览页就要兑现 |
| Populated | 见 4.3.2 |

---

### 4.4 背景信息题 S1–S4（步 12–14 · `/s/:id`）

> 题面与取值严格取自 `PRD.md §6.4` 与 `openapi.yaml → Strata`，不做二次创作。
> `Strata.required = [S1, S2, S3]`，S4 选做。全部**不计入总分**（schema `description` 明写）。

#### 4.4.1 三道题的契约来源

| # | 题面（PRD §6.4 原文） | openapi 取值 | 必答 | 屏 |
|---|---|---|---|---|
| **S1** | 你在这个软件上花的学习成本，主要是哪一种？<br>A 主要花在记住东西在哪、怎么操作<br>B 一半一半<br>C 主要花在练出判断力（知道什么叫好、什么该改） | `enum: [A, B, C]` | 必答 | 步 12 |
| **S2** | 你用这个软件多久了？ | `type: string`，example `gt3y` — **无 enum，档位待定稿**（见 4.4.5） | 必答 | 步 13 |
| **S3** | 你平均每周用它多少次？ | `type: string`，example `daily` — **无 enum，档位待定稿** | 必答 | 步 14 |
| **S4** | 这个软件是你自己选的，还是公司 / 客户 / 课程要求的？ | `enum: [self, mandated]` | 选做 | **与 S3 同屏**（见 4.4.4） |

**S1 是分类题，不是程度题 —— 这是整个 §4.4 最重要的一条设计约束。**
PRD §6.4 明确：A 类成本可被 AI 用自然语言压平，C 类压不平，用于检验"同为高危分，A 类用户 6 个月后真的换了吗"。如果它长得像 Likert（5 格等距），被试会以为 A→B→C 是"从少到多"的程度轴，从而按程度作答，**直接污染这个调节变量**。这比界面丑严重得多。

#### 4.4.2 判断七：S1 用纵向三行"陈述行"，绝不用 Likert 分段组

**结论：纵向 3 行，每行一句完整陈述，整行可点，序号用 A/B/C 而非 1/2/3。**

```
[12px mono tertiary：背景信息 1 / 3 · 不计入得分]
[8px]
[18px/30 500 primary：你在这个软件上花的学习成本，主要是哪一种？]
[8px]
[13px tertiary：不分对错，也不影响你的分数。选最接近的一种。]
[24px]
┌──────────────────────────────────────────────────────┐
│ Ⓐ  主要花在记住东西在哪、怎么操作                    │  ← 高 64px（允许 2 行）
│ Ⓑ  一半一半                                           │
│ Ⓒ  主要花在练出判断力（知道什么叫好、什么该改）      │
└──────────────────────────────────────────────────────┘
```

- 容器：`1px solid --color-border-default` + `border-radius: 8px` + `overflow: hidden`，行间 **2px `--color-bg-page` 透出**（与 Likert 同工艺，保持家族感）
- 每行：`display: grid; grid-template-columns: 24px 1fr; align-items: center; gap: 12px`，`padding: 0 16px`，**最小高 64px**（2 行文字留余量，远超 44px 触摸目标）
- 序号：24px 圆形，**写 A / B / C 而不是 1 / 2 / 3**（`mono 12px`）。用字母是为了切断"序数=程度"的联想
  - 实现：`<span>` + `border-radius: 9999px` + 24×24px 定宽 + 文字居中，**不要用 `Ⓐ` 这类预组合字符**（字形依赖字体，等宽字体下可能缺字或宽度不一致。上图 `Ⓐ` 仅为示意）
  - 未选：1px `--color-border-strong` 描边 + `--color-text-tertiary` 文字
  - 选中：`--color-accent-default` 实心 + `--color-text-on-accent` 文字
- 行状态：
  - Default：底 `--color-bg-surface`，文字 15px/400 `--color-text-primary`
  - Hover：底 `--color-bg-sunken`
  - **Selected**：整行底 `--color-accent-subtle`，文字转 `--color-accent-default` 600 字重，序号转 accent 实心。**不许用 `border-left` 做彩色强调**（红线 1）—— 用底色与字重区分，不用侧边条
  - Focus-visible：`box-shadow: focus.ring` + `position: relative; z-index: 1`
- **与 Likert 的选中态刻意不同**：Likert 选中是**整格 accent 实心 + 白字**（强调"选中了一个刻度"）；S1 选中是**浅底 + accent 文字**（强调"选中了一个类别"）。视觉语言差异 = 题型差异
- 语义：`role="radiogroup"` + `aria-labelledby`，`<input type="radio">` sr-only，方向键 + `A/B/C` 键直选（**不是数字键 1-3**，键盘映射也必须避免"数字=程度"）
- 移动端 <640px：同一结构，行高自动撑开，`padding: 12px 16px`

#### 4.4.3 S2 / S3 用 chip 单选，不用 Likert、不用下拉

**结论：横向 wrap 的 chip 单选组（与第 0 步 chip 同规格），不是分段按钮组。**

理由：chip 的形态暗示"从一堆离散标签里挑一个"，与"在一条刻度轴上定位"完全不同 —— 这正是年限/频次这类**分档事实题**的正确隐喻。且 chip 天然支持 wrap，4-5 档在 360px 下也不挤。

```
[12px mono tertiary：背景信息 2 / 3 · 不计入得分]
[18px/30 500：你用这个软件多久了？]
[24px]
┌──────────────────────────────────────┐
│  [ 不到 6 个月 ] [ 6 个月 – 2 年 ]   │   chip: h 36px, padding 0 14px,
│  [ 2 – 5 年 ]    [ 5 年以上 ]        │   radius pill, 1px border-default,
└──────────────────────────────────────┘   底 bg-surface, 文字 14px secondary
                                           gap 8px, wrap
```

- 状态：Default → Hover 底 `--color-bg-sunken` → **Selected** 底 `--color-accent-subtle` + border `--color-accent-default` + 文字 `--color-accent-default` + 右侧嵌 16px `Check`（与第 0 步选软件 chip 完全一致）
- 键盘：`role="radiogroup"`，`←/→` 移动，Tab 单停靠点
- **档位顺序必须按时间/频次升序排列**，永不打乱（有序分类变量的前提）

#### 4.4.4 S4 与 S3 同屏 —— 把"新增屏数"从 4 压到 3

**结论：S4 不单独占一屏，放在 S3 屏的底部，用 `border-top` 分隔，标注「选填」。**

```
[背景信息 3 / 3 · 不计入得分]
[18px/30 500：你平均每周用它多少次？]
[chip × 5]
──────────────────────────────────────  ← 1px border-subtle，上下各 20px
[12px tertiary：选填] 这个软件是你自己选的，还是公司 / 客户 / 课程要求的？
[chip × 2：我自己选的] [公司 / 客户 / 课程要求的]      ← h 32px（比必答题 chip 矮 4px）
[13px tertiary：这一题可以不答，直接继续。]
```

为什么合并：
1. **S3（频次）与 S4（来源）同属"使用行为"**，语义同组，分开反而割裂
2. S4 是选做题，占一整屏会让用户觉得"又多一步"，同屏底部的「选填」标签是更诚实的表达
3. 认知负荷：S3 是 5 选 1 的事实回忆，S4 是 2 选 1，同屏合计 7 个 chip —— 但**事实题零判断成本**，不适用"每题一屏"的规则（那条规则针对的是需要判断的量表题）
4. 进度轨只增加 1 段（总 14 段），与对用户承诺的"3 步背景信息"完全对齐

#### 4.4.5 取值口径 —— 有一处契约缺口需要洪兄定稿

`openapi.yaml` 里 `Strata.S2` / `Strata.S3` 只写了 `type: string` + `example`（`gt3y` / `daily`），**没有 enum**。前端不能自己发明档位，否则后端做组间分析时拿到的是自由文本。

**建议取值（前端按此实现，待定稿）：**

| # | 建议 enum | 展示文案 | 对齐原第 0 步设计 |
|---|---|---|---|
| S2 | `lt6m` | 不到 6 个月 | 有（原 4 档一致） |
| | `6m_2y` | 6 个月 – 2 年 | 有 |
| | `2y_5y` | 2 – 5 年 | 有 |
| | `gt5y` | 5 年以上 | 有 |
| S3 | `daily` | 每天 | 有（openapi example 即此值） |
| | `weekly_multi` | 每周数次 | 有（原 5 档一致） |
| | `weekly_once` | 每周一次 | 有 |
| | `monthly` | 每月数次 | 有 |
| | `rarer` | 更少 | 有 |

**两个待裁决点（已写入附录 B）：**
1. openapi 的 example 是 `gt3y`（3 年以上），暗示另一种切法（`lt1y` / `1_3y` / `gt3y`）。**4 档与 3 档二选一**，建议 4 档（信息量更大，且与原第 0 步 UI 一致，改动成本为 0）
2. `Strata` schema 应补上 `S2` / `S3` 的 `enum` 约束。**这一条要改 openapi.yaml（加 enum 不改契约结构，只收紧取值），不是改 UIUX**

#### 4.4.6 默认值：全题无默认值（硬规定）

**S1 / S2 / S3 / S4 一律不预选，初始态为全未选。**

理由（这是数据质量问题，不是体验偏好）：
- 预选任一档 = 启动偏差（priming）。用户会把预选项读作"标准答案"，直接点下一步
- 对 S1 尤其致命：它是本项目的原创调节变量，任何系统性偏移都会让"同为高危分，A 类 vs C 类"的对比失效
- 「下一题」在未答时 **disabled**（与量表题一致），下方 13px tertiary 提示「选择一项后继续」

**S4 例外**：未答时「完成」按钮**不** disabled，因为它是选做题。点击后 `strata` 只带 S1/S2/S3，不带 S4 key（符合 `required: [S1, S2, S3]`）。

#### 4.4.7 跳过入口

| 题 | 跳过入口 | 位置 |
|---|---|---|
| S1 / S2 / S3 | **不提供** | —— 契约必填。给跳过口 = 前端允许产出非法 `strata`，提交必 400 |
| S4 | 隐式跳过 | 不点任何 chip 直接按「完成」即跳过。**不额外放「跳过」按钮** —— 按钮会诱导本来愿意答的人跳过 |

**一致性说明：S1/S2/S3 不提供跳过，但整段背景信息可以通过预览页的「到此为止」整体退出。** 这两件事不矛盾：前者是"逐题略过"（会产生半份 `strata`，非法，提交必 400），后者是"整体不参与"（不产生提交，合法）。前端必须区分这两种语义。

#### 4.4.8 翻页与播报

```
[进度轨：核心 11 段 accent 实色 · 背景组当前段 30% + 4px · 其余 border-subtle]
[12px mono tertiary：背景信息 1 / 3 · 不计入得分]
[18px/30 500：题干]
[8px]
[13px tertiary：为什么问这个 —— 用于检验这份量表在不同人群身上是否同样成立（一行，13px）]
[24px]
[选项组]
[32px]
左：上一题（ghost + ArrowLeft 16px）      右：下一题 / 完成（accent 实心 + ArrowRight 16px）
```

- **「为什么问这个」一行必须有。** 这是把"催收"变成"请求协助"的关键动作 —— 用户知道这题的用途是验证量表效度，而不是我们在收集他的隐私。措辞由洪兄定稿，但必须是**具体机制**（"检验量表在不同人群身上是否同样成立"），不能是"帮助我们改进产品"这类空话
- S1 屏的「上一题」→ 回 `/preview`（**不是回第 9 题**）。用户可能想再看一眼预览
- 步 14（S3+S4）右按钮文案 = **「完成并提交」**（这是全流程唯一一次带"提交"字样的按钮）
- 提交中：按钮内文字换「提交中」+ 16px `Loader2` 旋转 + disabled + `aria-busy="true"`
- 提交成功后 → `/result/:sessionId`，`POST /submissions` 携带完整 `answers` + `strata`

#### 4.4.9 背景题屏状态矩阵

| 状态 | 表现 |
|---|---|
| Loading | 不适用（静态题，无异步） |
| Empty | 不适用（选项恒在） |
| Error（提交失败 4xx） | inline 错误块（同 4.1.6），说明「答案已保存在本地，可重试」。**答案存 sessionStorage，重试不丢，S1–S3 的选择也不丢** |
| Error（提交失败 5xx / 网络） | 同上 + 次按钮「仅查看本地结果（不入库）」→ `/result/:sessionId` 本地模式 |
| Error（`collection_enabled=false`） | 提交按钮整块替换为 13px tertiary 提示：「研究采集已暂停，本次结果不入库。」+ 主按钮改为「仅查看本地结果」→ 本地模式 |
| Edge（超长选项文案） | 行高自适应，`overflow-wrap: break-word`，不截断 |
| Success（提交成功） | 不显示 toast，直接路由到结果页 —— 结果页本身就是反馈 |

---

### 4.5 流程结构与完成率工程

#### 4.5.1 我对「中场激励 + 结果前置」方案的专业判断

**结论：同意，而且是这个局面下唯一正确的结构。我不再提 13 步顺序方案，那一版撤回。**

三条支持理由（都不是"感觉"，是可归因的机制）：

1. **互惠（reciprocity）**：用户答完 9 题已经付出成本，此时先交付结果是履约；履约之后请求协助，接受率显著高于索取之前请求。**顺序本身就是变量**，不是文案能补回来的
2. **承诺一致性（commitment & consistency）**：用户在预览页看见的是**关于他自己那个软件**的分数，不是通用结果。已投入 + 已个性化 = 中途放弃的心理成本陡增
3. **流失点前移可控**：9 道量表题的流失是**可测量的**（`/api/v1/abandon` 的 `last_question_index` 能定位到第几题），而"结果锁到最后"造成的流失发生在最后一步，**我们连它为什么流失都不知道**。前者能迭代，后者不能

**但我要补一条修正（不是推翻）：** 单纯"结果前置"只解决"要不要继续"，没解决"继续时看到什么"。所以我在 4.1.2 加的**背景段视觉降级**（未答段用 `--color-border-subtle` 而非 `--color-border-strong`）是这套方案的第二半 —— 用户答到第 9 题时，进度条右侧应该是"几乎看不见的三段"，而不是"刺眼的还差三段"。**这两条必须一起上，只做结果前置、进度条还照常亮着三段，效果会打折。**

#### 4.5.2 完成率预估

基线：Typeform 官方「题目超过 6 道后完成率跌破 50%」（§1.1）。我们有 9 道量表题，正落在悬崖上。

分段条件完成率预估（**这是预估，不是承诺；上线后用 `/api/v1/abandon` 的真实数据替换**）：

| 阶段 | 条件完成率 | 累计 | 依据 |
|---|---|---|---|
| 进入第 0 步 → 选完软件 + 同意 → 进入第 1 题 | **90%** | 90% | 无注册、无邮箱、无 PII，选一个软件是零成本动作 |
| 第 1 题 → 第 9 题答完 | **66%** | 59% | 9 道判断题，逐题保活 ~95.5%。一屏一题 + 明示进度 + 答案持久化对冲了 6 题悬崖 |
| 第 9 题 → 预览（自动跳转，无操作） | **99%** | 59% | 无交互，不会在此流失 |
| 预览 → 答完 S3（3 屏） | **86%** | 51% | 互惠 + 已个性化 + "还剩 3 道"的心理短距 |
| 其中「到此为止」→ 结果页后回补 | (+3%) | | 二次入口的回收量，已计入 86% 内 |
| S3 → 提交成功 | **97%** | **49%** | 单次请求，失败可重试且不丢答案 |
| **端到端（开始 → 成功入库一条完整记录）** | | **≈ 49%** | 区间 45–55% |

**对照组（若结果锁到最后，13 步顺序）：** 预览→提交那一段从 86% 掉到约 **70%**（用户此时还没拿到任何东西，却被要求再答 3 题，且不知道为什么），端到端约 **40%**。
**结果前置的净收益 ≈ +9 个百分点（相对提升 ~23%）。**

**换算成运营目标（这条请洪兄注意）：**

目标 N ≥ 200 份**入库**样本，而 §4.2.5 A 规定入库是**显式 opt-in、默认不入库**，预估 opt-in 率 70–85%（取 78%）：

```
需要开始次数 = 200 ÷ 49% ÷ 78% ≈ 524 次
```

即：**约 520 次「进入第 0 步」才能换到 200 份入库样本。** 如果 opt-in 率实测低于 70%，需要约 580 次。这个数字应该反过来决定投放策略，而不是等收不满再想办法。

#### 4.5.3 防线清单（按触发成本从低到高）

| # | 措施 | 状态 | 触发/生效条件 |
|---|---|---|---|
| 1 | 结果前置（§4.3） | **已裁决，本轮落地** | 始终 |
| 2 | 背景段进度条视觉降级（§4.1.2） | **已裁决，本轮落地** | 始终 |
| 3 | 答案 + 背景题选择存 `sessionStorage`，关页可续答 | **已裁决，本轮落地** | 始终 |
| 4 | S4 与 S3 同屏（§4.4.4） | **已裁决，本轮落地** | 始终 |
| 5 | 「为什么问这个」一行微说明（§4.4.8） | **已裁决，本轮落地** | 始终 |
| 6 | 「到此为止」→ 结果页二次补填入口（§4.3.4） | **已裁决，本轮落地** | 回收预览步流失 |
| 7 | **方案 B：S2 / S3 前移回第 0 步** | **待触发** | 见下 |
| 8 | 第 0 步说明文案弱化"三个月以上"门槛 | 不建议 | 会引入噪声样本，PRD §6.4 明确要用 S2 剔除 |

**方案 B（预批准降级开关，暂不启用）：把 S2 / S3 前移回第 0 步，后面只留 S1（+S4 同屏）。**

- **做什么**：恢复 §4.1.4 [6] 的两组 chip 并改为**必填**（"选填"标签去掉）；背景段从 3 屏压到 1 屏（S1 + S4）
- **为什么它是一个真实的改进**：S2/S3 是**事实回忆题**（用多久、多频繁），判断成本近乎为零。Typeform 的 6 题悬崖针对的是需要判断的题 —— 把两道零成本事实题挪到第 0 步，用户甚至感知不到流程变长，但背景段从 3 屏变成 1 屏
- **代价**：第 0 步变长（多两组 chip），且用户在"还没开始答题"时就要交代使用情况，轻微增加入口摩擦
- **触发条件**：上线后若 `/api/v1/abandon` 显示 `last_question_index` 集中在 11–13（即预览之后流失）**且** 预览→S3 完成率 < 75%，切 B
- **实现前提**：§4.0 已要求步序由 `flow.steps.ts` 配置驱动 —— 切 B 只需改这个数组 + 第 0 步的 `[6]`，**不改组件、不改进度条算法**
- **注意：** 切 B 后第 0 步 [6] 与 §4.4 的 S2/S3 **不可同时存在**（重复采集）。切 B 时 §4.4 的 S2/S3 两屏必须从数组里移除，只保留 S1

**方案 B 之外我不建议再做的三件事**（提前挡掉）：
不做的三件事（提前挡掉）：
- **进度条只在核心段显示**：欺骗，违反知情同意
- **背景题默认预选**：制造系统性偏差，见 §4.4.6
- **把 S1 也前移凑成"一步背景"**：S1 需要用户对"学习成本"有自觉，答完 9 题后答 S1 反而更准（用户刚被 9 道题提醒过自己与这个软件的关系）

---

## 5. 无障碍与响应式

### 5.1 键盘可达性

| 场景 | 要求 |
|---|---|
| 全局 | 首个可聚焦元素是「跳到主内容」skip link（`:focus` 时可见） |
| Tab 顺序 | Header → 进度条已答段 → 题干容器 → Likert radio group → 上一题 → 下一题 |
| Likert | 原生 radio group：单 Tab 停靠点 + `←/→/↑/↓` 移动并选中 + `Home/End` 跳首尾 + **数字键 1-5 直选** |
| 选软件 | combobox 完整支持：`↑↓` 移动候选、`Enter` 确认、`Esc` 关闭且不丢失已输入内容、`Tab` 跳出 |
| 题目翻页 | 翻页后焦点移到新题干容器（`tabIndex={-1}` + `.focus()`），**不回落到 body** |
| 焦点可见 | 全部交互元素 `:focus-visible` 加 `focus.ring`。**禁止 `outline: none`** |
| 焦点环对比度 | 环与相邻背景 ≥ 3:1（`--color-accent-ring` 在浅深两色下均已校准） |
| 屏幕阅读器播报 | 翻页 `aria-live="polite"` 播报「第 N 题，共 9 题」；提交态 `aria-busy`；操作结果 Toast 用 `role="status"` |
| 表单错误 | `role="alert"` + `aria-describedby` 关联 + 焦点自动移到错误字段 |
| 折叠区 | 原生 `<details>`/`<summary>`，不加自定义 ARIA |
| 量表条 | `role="meter"` + `aria-valuenow/min/max/valuetext` |
| 图标按钮 | 所有纯图标按钮必须有 `aria-label`（如深色模式切换：`aria-label="切换到深色模式"`，且 `aria-pressed`） |

### 5.2 对比度要求

| 内容类型 | 最低对比度 | 本项目实际 |
|---|---|---|
| 正文 / 题干（`text.primary` on `bg.page`） | 4.5:1 | **17:1** |
| 次级正文（`text.secondary`） | 4.5:1 | **6.3:1** |
| 元信息（`text.tertiary`） | 4.5:1 | **4.8:1** |
| 大文本 ≥18px 或 ≥14px 粗体 | 3:1 | 全部超额 |
| UI 组件边界 / 图标（`border.default` on `bg.page`） | 3:1 | `border.strong` 用于控件边界，达标 |
| 焦点指示器 | 3:1 | 已校准 |
| 深色模式 `text.tertiary` on `bg.page` | 4.5:1 | **5.1:1** |

**`text.tertiary`（4.8:1）是本系统允许的最浅文本色，不得再浅。** 禁止使用 `neutral.400`（浅色下 2.9:1）承载任何文字。

**WCAG 1.4.1（不能仅靠颜色传达信息）在本项目的三个落实点：**
1. 三档风险：色块 + **位置**（量表条）+ **文字标签**（「高危区」）三重编码
2. Likert 选中态：底色 + 白字 + 可选中 radio 语义（SR 可读 `aria-checked`）
3. 表单错误：红色文字 + **图标** `AlertCircle` + **文案**（不只变边框色）

### 5.3 响应式断点

| 断点 | 宽度 | 问卷页 | 结果页 |
|---|---|---|---|
| xs | <640px | 容器 100%，gutter 20px；Likert **纵向堆叠**（行高 48px）；底部操作行全宽纵向（下一题在上） | 量表条全宽；维度行保持一行；分享按钮**全宽纵向堆叠**；卡片预览缩到容器宽 |
| sm | 640–767px | 容器 680px 居中；Likert 横向 5 格（min 88px）；操作行两端对齐 | 同桌面，容器收窄到 680px |
| md | 768–1023px | 同 sm | 容器 880px 开始生效；维度名与迷你条并排 |
| lg | ≥1024px | 容器 680px | 容器 880px；维度解释用 `grid-template-columns: 1fr auto` 完整两列 |

**触摸与手势**
- 所有可点元素最小 **44 × 44px**（Likert 纵向行 48px、按钮 44px、chip 32px 高但热区通过 padding 扩到 44px）
- 相邻可点元素间距 ≥ 8px
- 不使用任何自定义手势（左滑/长按）承载必需功能 —— 量表工具不该有隐藏操作

**其他**
- `<meta name="viewport" content="width=device-width, initial-scale=1">`，**禁止** `user-scalable=no` / `maximum-scale=1`
- 页面在 200% 缩放下不破版（WCAG 1.4.4）；Likert 纵向布局天然满足
- 所有图片/卡片有 `alt` 或 `aria-label`；装饰性 SVG 加 `aria-hidden="true"`
- 深链 `/q/5` 与 `/result/:id` 可直接访问（刷新不丢，答案在 `sessionStorage`）
- `prefers-reduced-motion: reduce` → 全部动效降为 0.01ms，量表条游标直接落位

---

## 6. 组件状态矩阵汇总

| 组件 | Loading | Empty | Error | Populated | Edge |
|---|---|---|---|---|---|
| Likert 按钮组 | 骨架块（100%×56px，bg-sunken） | 不适用 | 无（选项恒在） | 5 格全标注 | 标签换行：桌面允许 2 行，纵向布局单行 ellipsis + title |
| 软件 combobox | 输入时候选区 3 条骨架行 | 无匹配时显示「未找到匹配项，可直接输入软件名称」（13px tertiary，**不是空列表**） | 未填提交 → 字段下方红字 + 图标 | 12 chip + 输入框 | 超长输入：`maxlength=60` + 超出提示 |
| 进度条 | 骨架（100%×2px，bg-sunken） | 第 0 步时全未填色 | 不适用 | 按步数填充 | 步骤数变化不影响布局（flex 均分） |
| 量表条（结果） | 骨架条 + 骨架数字块 | 不适用 | 不适用 | 游标 + 三段 | 0/100 分：游标标记 clamp 在轨道内 |
| 维度列表 | 3 条骨架行（形状同真实行） | 不适用 | 不适用 | 3 组 × 2-3 条 | 长解释文字自然换行，不等高 |
| 分享卡片 | 生成中：按钮内 Loader2 + disabled | 不适用 | 生成失败 → Toast「图片生成失败，可长按页面截图」+ 重试 | 1080×1350 PNG | 软件名 2 行截断 |
| 主按钮 | 文字换「计算中」+ Loader2 + `aria-busy` | 不适用 | 见各页 Error 行 | 正常 | 文案长度变化不引起位移（min-width 固定） |
| 结果预览（步 11） | 不适用（纯本地同步计算，**出现任何 spinner 都是设计错误**） | 不适用 | 无基线 → 只给分数不给档位 + 13px 说明 | 分数 + 8px 量表条 + 3 条连续因子条 | 0/100 分：游标 clamp 在轨道内 |
| 背景题选项组（S1 陈述行 / S2·S3 chip） | 不适用（静态题，无异步） | 不适用 | 提交失败 → inline 错误块 + 重试，答案与选择不丢 | S1 = 3 行陈述；S2 = 4 chip；S3 = 5 chip + S4 2 chip | 长选项文案自适应行高，不截断 |
| 进度轨（14 段） | 骨架（100%×2px，bg-sunken） | 第 1 步时全未填色 | 不适用 | 核心组 11 段 + 背景组 3 段 | 步数由 `flow.steps.ts` 驱动，切方案 B 时自动变段数，布局不破 |

---

## 7. 交付前自检清单

**P0 红线（任一不通过 = 退回）**

- [ ] 零 emoji 作为功能图标，正则 `[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]` 扫描全仓库通过
- [ ] 图标 100% 来自 `lucide-react`，无第二套图标库、无图标字体，尺寸仅 16/20/24，`strokeWidth` 统一 1.5
- [ ] 无紫→粉渐变、无 indigo→pink 任意组合
- [ ] 无「Welcome to」「Lorem ipsum」「以上就是全部内容」类空洞文案
- [ ] 无硬编码色值（除 `#fff` / `#000` 与 rgba 阴影外），全部走 CSS 变量
- [ ] 首屏即问卷第 0 步（选软件），无巨型 Hero + 空泛副标题 + CTA
- [ ] 无 `cubic-bezier(0.68,-0.55,0.265,1.55)` 及任何回弹缓动
- [ ] 无「赋能 / 一站式 / 颠覆性 / 无缝 / 释放潜能」类套话

**设计质量**

- [ ] 强调色每屏可见使用 ≤ 2 处
- [ ] 卡片默认无阴影（1px border 即可），无「1px border + blur≥16px shadow」同元素共存
- [ ] 无 `border-left/right` 宽度 > 1px 的彩色强调条
- [ ] 无 `background-clip: text` 渐变文字
- [ ] 圆角最大 12px（卡片 ≤8px）
- [ ] 间距全为 4 的倍数（2px 仅用于段间间隙）
- [ ] 无「每节都有小型大写追踪标签」、无「01 · 关于」编号 section 标记
- [ ] 分数/题号/N 计数全部 `tabular-nums`
- [ ] 中文字重不超过 600
- [ ] 无虚构数据（N 计数用真实值，初期显示 N=23 就写 23）

**无障碍**

- [ ] 所有交互元素 `:focus-visible` 有焦点环，无 `outline: none`
- [ ] Likert 是原生 radio 语义，支持方向键与数字键 1-5
- [ ] 三档风险有色块 + 位置 + 文字三重编码
- [ ] 表单错误 `role="alert"` 且紧贴字段
- [ ] 翻页有 `aria-live` 播报，焦点移到新题干
- [ ] `prefers-reduced-motion` 生效
- [ ] 触摸目标 ≥44×44px
- [ ] 200% 缩放不破版

**学位作品专项（评审会看的）**

- [ ] 知情同意在研究开始前（不是结束后）
- [ ] 总题数在研究开始前明示（现为「10 步出结果 + 3 步背景信息」，见 §4.1.4 [7]）
- [ ] 结果页有方法论说明（题目来源 / 计分方式 / 阈值依据）
- [ ] 结果页有局限性声明（自陈偏差 / 非概率抽样 / 非替代概率预测）
- [ ] 样本入库是显式 opt-in，默认不入库
- [ ] 分享卡片含机构署名 + 方法论一行 + 样本编号
- [ ] 量表方向全题一致，反向计分在后端处理而非前端翻转

**本轮新增（S1–S4 / 结果预览 专项，任一不通过 = 退回）**

- [ ] `POST /submissions` 的 `strata` 含 S1/S2/S3 且非空，S4 可缺省 —— 提交不返回 400
- [ ] 第 0 步**没有**残留的使用年限 / 使用频率 chip（与 S2/S3 重复采集）
- [ ] S1 **不是** Likert 分段组：3 行陈述、序号是 A/B/C、键盘映射是 A/B/C 键不是 1/2/3
- [ ] S1/S2/S3 初始态全未选，**无任何预选默认值**
- [ ] S4 未答时「完成」按钮不 disabled；S1/S2/S3 未答时 disabled
- [ ] 结果预览页**有**「预览」pill 标记，且**没有**分享卡片 / 入库按钮 / 维度解释
- [ ] 预览页因子条是连续条，终页是 5 段条 —— 两者形态不可互换
- [ ] 预览页「到此为止」无确认弹窗，进入本地结果页且顶部有未入库提示 + 补填入口
- [ ] 进度轨 14 段分两组，背景组未答段用 `--color-border-subtle`（不是 `--color-border-strong`）
- [ ] 量表题屏播报「第 N / 9 题」、背景题屏播报「背景信息 N / 3」，**不出现「第 10 / 11 / 12 题」**
- [ ] `aria-valuemax="14"`，背景步 `aria-valuetext` 同时含「背景信息 X/3」与「全流程 X/14」
- [ ] 无样本基线时预览页**只给分数不给档位**，不编造档位
- [ ] 步序由 `flow.steps.ts` 配置驱动，未写死（方案 B 可切换）

---

## 附录 A：给前端的实现顺序建议

1. 先建 `src/design/tokens.json` → 编译 `tokens.css` + `tokens.ts` → Tailwind 映射（**不要跳过，后面所有样式都依赖它**）
2. 建主题切换（含防闪烁内联脚本）
3. 建 Likert 组件（含桌面横排 / 移动纵向两套 + 完整键盘交互 + 5 态）—— 这是全项目最难的组件，先做
4. 建进度条、按钮、chip、combobox 基础件
5. 建进度轨（**段数由 `flow.steps.ts` 生成，不写死 10 或 14**）、按钮、chip、combobox 基础件
6. 拼问卷页（第 0 步 + 第 1-9 题 + 状态）
7. 拼结果预览页（步 11）—— 纯本地计算，先做这个再拼终页，因为它会暴露计分函数的边界情况
8. 拼背景题（S1 陈述行 / S2·S3 chip / S4 同屏选填）
9. 拼结果页（量表条 + 维度列表 + 分享卡片）+ 本地模式（未入库提示条 + 补填入口）
10. 无障碍走查（键盘全程走一遍 + axe DevTools + 对比度实测 + 200% 缩放）
11. `prefers-reduced-motion` 与深色模式双跑
12. 接 `/api/v1/abandon` 埋点，用真实 `last_question_index` 校准 §4.5.2 的完成率预估，判定是否触发方案 B

## 附录 B：待研究侧（洪兄）定稿的内容

- [ ] 9 道题题干（端点标签与中点标签措辞）
- [ ] 维度 / 因子分组（3 组，每组 2-3 条）
- [ ] 计分权重与三档阈值（0-33 / 33-66 / 66-100 需按实际分布校准）
- [ ] 每档的解释文案（须点名软件 + 引用得分 + 可操作建议）
- [ ] 方法论说明 4 段正文
- [ ] 分享文案模板措辞
- [ ] 软件预置列表 12 个 + 别名映射表
- [ ] **S2 使用年限档位取值定稿**（建议 4 档 `lt6m` / `6m_2y` / `2y_5y` / `gt5y`）—— openapi 现只有 example `gt3y`，暗示 3 档切法，需二选一
- [ ] **S3 每周频次档位取值定稿**（建议 5 档 `daily` / `weekly_multi` / `weekly_once` / `monthly` / `rarer`）
- [ ] **S1 / S2 / S3 / S4 的题面最终措辞**（本文档用 PRD §6.4 原文，未做改写）
- [ ] **背景题屏「为什么问这个」一行微说明的措辞**（须写具体机制：检验量表在不同人群身上是否同样成立）
- [ ] **预览页「还剩 3 道背景信息」标题与正文措辞**（本文档给了意图与信息结构，未定字句）
- [ ] **预览页「到此为止」后结果页提示条措辞**
