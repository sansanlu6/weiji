# 个人健康记录应用 - 研发规范

## 应用概览

微迹 - 个人健康记录应用，提供睡眠、情绪、病痛、饮食、运动、喝水、用药、排便八大健康维度的轻量化记录、数据化存档与多维度分析。

## 技术架构

- **前端**: React 19 + TypeScript + Tailwind CSS + shadcn/ui
- **后端**: NestJS 10 + TypeScript + Drizzle ORM
- **数据库**: PostgreSQL
- **图表**: ReactECharts
- **认证**: 内置用户系统 + JWT

## 设计规范（喜茶风）

### 品牌叙事

**「记录健康，像清晨林间的深呼吸一样自然清新」**

整体气质清新、自然、有生命力，像清晨的青柠绿树林——通透干净、充满生机，低饱和度的青柠绿主色搭配大面积纯白留白，呈现现代 SaaS 产品的利落感与自然治愈感的平衡。

### 色彩系统（青柠绿清新自然系）

| Token | 值 | 用途 |
|-------|-----|------|
| primary | hsl(95 55% 60%) | 主色：青柠绿（按钮、关键数据、选中态） |
| primary-light | hsl(95 60% 90%) | 主色浅（标签背景、hover态） |
| secondary | hsl(95 40% 94%) | 次背景：极浅青柠色（次级按钮背景） |
| accent | hsl(15 70% 78%) | 辅助色：低饱和珊瑚粉（强调、点缀） |
| accent-light | hsl(15 75% 94%) | 辅助色浅（accent 标签/标签背景） |
| warning | hsl(40 75% 70%) | 警示色：暖杏黄 |
| success | hsl(95 55% 60%) | 成功色（同主色） |
| destructive | hsl(0 65% 70%) | 危险色（柔和化处理） |
| info | hsl(200 45% 70%) | 信息色：天空蓝 |
| background | hsl(90 40% 98%) | 页面背景：浅青柠白（更清新） |
| card | hsl(0 0% 100%) | 卡片背景：纯白 |
| foreground | hsl(160 15% 15%) | 主文字：深绿灰 |
| muted-foreground | hsl(160 8% 50%) | 次要文字：中灰 |
| border | hsl(90 15% 90%) | 边框：暖调极浅灰 |
| muted | hsl(90 20% 96%) | 弱背景色（暖调） |

### 图表配色

| Token | 值 | 描述 |
|-------|-----|------|
| chart-1 | hsl(95 55% 60%) | 青柠绿（主色） |
| chart-2 | hsl(15 70% 78%) | 杏粉（辅助色） |
| chart-3 | hsl(40 70% 72%) | 杏黄 |
| chart-4 | hsl(170 40% 72%) | 浅青 |
| chart-5 | hsl(280 30% 78%) | 浅紫 |
| chart-6 | hsl(200 45% 75%) | 天空蓝 |

### 模块专属色

每个健康记录模块拥有低饱和专属点缀色，用于卡片左上装饰条、图标底色、Tag 背景等，帮助用户快速区分记录类型。浅色背景版用于卡片底色或大片块。

| 模块 | Token | 值 | 浅色背景版 | 描述 |
|------|-------|-----|-----------|------|
| 睡眠 | module-sleep | hsl(230 35% 78%) | hsl(230 40% 94%) | 浅紫蓝（静谧夜晚） |
| 情绪 | module-mood | hsl(45 70% 75%) | hsl(45 70% 94%) | 暖黄（阳光心情） |
| 病痛 | module-pain | hsl(0 55% 80%) | hsl(0 60% 94%) | 浅粉（柔和提醒） |
| 饮食 | module-diet | hsl(25 65% 78%) | hsl(25 65% 94%) | 杏橙（食欲暖色） |
| 运动 | module-exercise | hsl(95 50% 72%) | hsl(95 50% 92%) | 青柠绿（活力清新） |
| 喝水 | module-water | hsl(195 50% 78%) | hsl(195 50% 94%) | 天空蓝（清透水感） |
| 用药 | module-medication | hsl(270 30% 80%) | hsl(270 30% 94%) | 薰衣草（温柔疗愈） |
| 排便 | module-poop | hsl(100 40% 78%) | hsl(100 40% 92%) | 浅柠绿（轻盈自然） |

用法：
- 模块卡片/图标：`bg-module-xxx-bg text-module-xxx`
- 左侧装饰条：`border-l-4 border-module-xxx`
- Tag 标签：`bg-module-xxx-bg text-foreground/70`

### 字体与文案气质

- **正文字体**：无衬线字体（`font-sans`），字重 300-600 为主，标题用 font-semibold
- **标题层级**：text-3xl (30px) / text-2xl (24px) / text-xl (20px) / text-lg (18px)
- **正文**：text-base (16px) / text-sm (14px)
- **数据数字**：font-semibold，数字用 tabular-nums
- **文案语气**：清晰、简洁、鼓励性，避免过于文艺或手写风
- **Hero 标题**：大号清晰有力（text-4xl font-semibold），副文案简洁克制

### 圆角与阴影

- 基础圆角 `--radius`：`1.25rem`（20px），比默认更柔和
- 卡片圆角：`rounded-2xl`（约 28px）
- 按钮圆角：`rounded-full` 或 `rounded-xl`（约 24px）
- 输入框圆角：`rounded-xl`
- 阴影：柔和轻阴影 `shadow-sm`，hover 时 `shadow-md` 微浮起
- 阴影不透明度整体降低 30-40%，模糊半径增大，走轻盈通透路线
- 阴影颜色：中性低饱和，避免冷灰或深重阴影

### 装饰元素

克制地使用以下元素，宁缺毋滥：
- **自然质感渐变**：首页 Hero 卡片使用青柠绿系水彩/晕染渐变，搭配山峦剪影 SVG，呼应自然清新主题
- **晨光光斑**：用 `blur-3xl` 圆形渐变模拟阳光穿透树叶的散景效果
- **细横线**：章节分隔用 1px 浅灰线 + 留白，不取整宽，左右留 1/4 空白
- **成就徽章**：圆形图标 + 简短文字，克制简洁
- **避免**：大渐变、强投影、复杂图案、手写体、3D 效果

### 动效原则

- **轻盈缓慢**：过渡时长默认 300ms，缓动 `ease-out`，不做快速闪动
- **hover 微浮起**：卡片 hover 时 `translateY(-2px)` + 阴影加深，幅度克制
- **入场渐现**：页面内容 200-400ms 淡入 + 轻微上移
- **状态切换**：颜色、大小变化走平滑过渡，不跳变
- **避免**：夸张弹跳、旋转、大幅位移等容易让用户分心的动效

### 间距与留白

- 页面左右边距：移动端 px-4，桌面端 px-6
- 卡片内边距：p-5 或 p-6
- 卡片间距：gap-4 或 gap-5
- 区块间距：mt-8 或 mt-10
- 充足留白，信息呼吸感强

### 视觉元素

- 卡片：纯白背景 + 大圆角 + 柔和阴影 + 细暖灰边框或无边框
- 按钮：主色填充圆角按钮，文字按钮用主色文字
- 标签/Chip：浅底色 + 主色文字 + 圆角胶囊
- 进度条：圆角进度条，主色填充
- 分割线：极浅暖灰细线条或留白分割

## 页面结构

### 路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 今日概览 + 快捷记录 + 最近记录流 |
| `/records` | 记录中心 | 八大记录模块列表入口 |
| `/records/sleep` | 睡眠记录 | 睡眠记录列表 + 新增/编辑 |
| `/records/mood` | 情绪记录 | 情绪记录列表 + 新增/编辑 |
| `/records/pain` | 病痛记录 | 病痛记录列表 + 新增/编辑 |
| `/records/diet` | 饮食记录 | 饮食记录列表 + 新增/编辑 |
| `/records/exercise` | 运动记录 | 运动记录列表 + 新增/编辑 |
| `/records/water` | 喝水记录 | 喝水记录列表 + 新增/编辑 |
| `/records/medication` | 用药记录 | 用药记录列表 + 新增/编辑 |
| `/records/poop` | 排便记录 | 排便记录列表 + 新增/编辑 |
| `/stats` | 统计看板 | 趋势图 + 分布 + 关联分析 + 异常预警 |
| `/goals` | 目标管理 | 喝水/睡眠/运动目标设置 |
| `/reminders` | 提醒设置 | 喝水/吃药/活动提醒配置 |
| `/data` | 数据管理 | 搜索筛选 + 回收站 + 批量操作 |
| `/report` | 健康报告 | 周期报告生成与导出 |
| `/profile` | 个人中心 | 账号信息 + 修改密码 + 退出登录 |

### 底部导航（移动端）/ 侧边栏（桌面端）

- 首页 / 记录 / 统计 / 我的（4 个 tab）

## 数据模型

### 核心表
- health_sleep - 睡眠记录
- health_mood - 情绪记录
- health_pain - 病痛记录
- health_diet - 饮食记录
- health_exercise - 运动记录
- health_water - 喝水记录
- health_medication - 用药记录
- health_poop - 排便记录
- health_goals - 目标配置
- health_reminders - 提醒配置
- health_recycle_bin - 回收站

所有记录表均含 user_id 字段做数据隔离。

## 模块组织

### 后端模块
- `health-records` - 统一的健康记录 CRUD 模块（8 类记录）
- `health-stats` - 统计分析模块
- `health-goals` - 目标管理模块
- `health-reminders` - 提醒模块
- `health-data` - 数据管理模块（回收站、批量操作）
- `health-report` - 报告生成模块

### 前端页面
- `pages/HomePage` - 首页
- `pages/RecordsPage` - 记录中心（含8个子页）
- `pages/StatsPage` - 统计看板
- `pages/GoalsPage` - 目标管理
- `pages/RemindersPage` - 提醒设置
- `pages/DataPage` - 数据管理
- `pages/ReportPage` - 健康报告
- `pages/ProfilePage` - 个人中心

## 关键约定

1. 所有记录使用统一的 CRUD 模式：列表（分页+筛选）、创建、更新、软删除（进回收站）、恢复、永久删除
2. 记录弹窗为统一设计风格，默认填充当前时间
3. 快捷记录通过 Dialog 弹窗实现，2 步点击完成
4. 时间字段统一使用 ISO string，前端用 dayjs 格式化
5. 图表使用 ReactECharts，遵循 charts-skill 规范
6. 用户认证使用内置用户系统，数据通过 user_id 隔离
7. 所有接口前缀 `/api/health/`
