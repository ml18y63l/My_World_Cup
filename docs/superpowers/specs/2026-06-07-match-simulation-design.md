# 对阵模拟（H2H Match Simulation）设计文档

**日期：** 2026-06-07
**状态：** 已批准

## 概述

实现单场比赛模拟功能页面 `/h2h`。用户选择两支球队，系统展示雷达图能力对比、球队信息卡片，并基于能力数据模拟比赛结果。每个维度对胜负概率的贡献以 Bullet point 形式透明呈现。

## 页面路由

- **路径：** `/h2h`
- **导航入口：** TopNav 已定义 "对阵模拟" → `/h2h`
- **组件类型：** `"use client"` 客户端组件（需要下拉交互和模拟按钮）

## 交互流程

### Step 1: 选择球队
- 两个带搜索过滤的下拉选择框（Select），分别选择队A和队B
- 约束：不能选择同一支球队
- 下拉列表数据从服务端 API Route 获取（48 支球队列表）

### Step 2: 赛前分析（选择后自动渲染）
- 雷达图对比（居中大图）
- 球队信息卡片（左右并排）

### Step 3: 模拟结果（点击按钮触发）
- 点击"开始模拟"按钮
- 显示比分、胜负平概率
- 以 Bullet point 形式展示每个维度对胜率的贡献分析
- 每次点击产生新的随机结果

## 组件架构

```
src/
├── app/
│   └── h2h/
│       └── page.tsx              # 主页面（客户端组件）
├── components/
│   ├── TeamSelect.tsx            # 球队搜索下拉选择
│   ├── RadarCompareChart.tsx     # SVG 雷达图对比组件
│   ├── TeamInfoCard.tsx          # 球队信息卡片
│   └── MatchResult.tsx           # 比赛模拟结果展示
└── lib/
    └── simulation.ts             # 模拟引擎（胜率计算 + 比分生成）
```

## 组件详细设计

### 1. RadarCompareChart（SVG 雷达图）

**渲染方案：** 纯 SVG + React，零第三方依赖

**坐标系：** 正八边形，8 个维度轴均匀分布（每 45°），按以下顺序顺时针：
- 上方：attack（进攻）
- 右上：control（控球）
- 右：defense（防守）
- 右下：experience（经验）
- 下方：status（状态）
- 左下：place_kick（定位球）
- 左：superstar（球星）
- 左上：penalty（点球）

**视觉层次：**
- 网格线：3 层同心八边形（25/50/75 刻度），浅灰色虚线
- 轴线：从中心到各顶点的浅灰直线
- 队A 数据区：红色半透明填充 `rgba(229,62,62,0.15)` + 红色实线描边 `#e53e3e`
- 队B 数据区：蓝色半透明填充 `rgba(49,130,206,0.15)` + 蓝色实线描边 `#3182ce`
- 顶点标记：4px 圆点，白色填充 + 对应颜色描边
- 轴标签：8 个维度名称 + 对应颜色数值
- 图例：图表底部简洁标注 "● 队A名称  ● 队B名称"

**数据范围：** 0-100

### 2. TeamInfoCard（球队信息卡片）

**展示字段（均来自现有数据）：**

| 字段 | 数据来源 | 示例 |
|------|---------|------|
| 球队名称 | `team_name` | 阿根廷 |
| 教练 | `head_coach` | 斯卡洛尼 |
| 阵型 | `base_formation` | 4-3-3 |
| 总身价 | `total_value_m_euros` | €850M |
| FIFA 排名 | `fifa_ranking` | #1 |
| 足联 | `confederation` | CONMEBOL |
| 综合评分 | 计算 `overall_score` | 89.4 |

**额外内容：** 8 维能力水平条形图（水平条，具体数值标注）

### 3. TeamSelect（球队选择器）

- 搜索过滤下拉框
- 显示：球队名称 + 足联标签
- 禁止选择已选的另一支球队

### 4. MatchResult（模拟结果展示）

**结构：**
- 比分展示：队A名称 比分 : 比分 队B名称
- 胜负平概率条：队A胜率 | 平局 | 队B胜率
- 分析依据（Bullet points）：
  - 综合评分差 → 贡献方向和幅度
  - 加权维度逐一分析（进攻、防守、经验、球星、定位球等）
  - 随机因素扰动说明
- 关键数据对比（FIFA 排名、身价、预期进球）
- "重新模拟"按钮

## 模拟引擎（simulation.ts）

### 胜率计算算法

```
1. 对 8 个维度应用权重：
   - attack × 1.5（进攻）
   - defense × 1.2（防守）
   - control × 1.0（控球）
   - status × 0.8（状态，波动大降权）
   - experience × 1.3（大赛经验）
   - place_kick × 1.0（定位球）
   - superstar × 1.2（球星影响力）
   - penalty × 0.8（点球，淘汰赛才关键）

2. 计算加权总分：weightedA, weightedB

3. 基于分差计算基础胜率：
   scoreDiff = (weightedA - weightedB) / max(weightedA, weightedB)
   baseWinRate = 0.5 + scoreDiff * sigmoid_factor

4. 引入随机扰动：
   randomness = (Math.random() - 0.5) * 0.3  // ±15%
   finalWinRate = clamp(baseWinRate + randomness, 0.05, 0.95)

5. 分配三态概率：
   winA = finalWinRate
   draw = 0.15 + (1 - abs(scoreDiff)) * 0.1  // 实力接近时平局概率高
   winB = 1 - winA - draw
```

### 比分生成

```
expectedGoalsA = (attackA / defenseB) * base_factor
expectedGoalsB = (attackB / defenseA) * base_factor
goalsA = PoissonRandom(expectedGoalsA)
goalsB = PoissonRandom(expectedGoalsB)
```

### 分析依据输出

模拟函数返回结构化数据，包含每个维度的贡献分析：

```typescript
interface SimulationResult {
  scoreA: number;
  scoreB: number;
  winRateA: number;
  drawRate: number;
  winRateB: number;
  analyses: DimensionAnalysis[];
  keyStats: KeyStats;
}

interface DimensionAnalysis {
  dimension: string;       // "进攻"
  valueA: number;          // 90
  valueB: number;          // 88
  weight: number;          // 1.5
  contribution: string;    // "进攻权重 ×1.5，贡献约 +3% 胜率"
  favorTeam: 'A' | 'B' | 'neutral';
}

interface KeyStats {
  fifaRankA: number;
  fifaRankB: number;
  valueA: string;
  valueB: string;
  expectedGoalsA: number;
  expectedGoalsB: number;
}
```

## 数据流

1. 页面加载时，服务端 API Route (`/api/teams`) 返回 48 支球队列表
2. 用户选择两队后，前端分别请求 `/api/teams/[name]/profile` 和 `/api/teams/[name]/radar`
3. 或者更简单：页面初始加载时一次性获取所有球队数据（数据量小，48 × ~200 bytes），前端过滤选择

**选择方案 2**（一次性加载），因为数据量极小，避免多次请求。

## 页面布局 CSS

- 顶部区域：球队选择器，`flex` 居中，中间 VS 标志
- 中间区域：雷达图（`max-w-md mx-auto`）
- 下方区域：两张球队信息卡片，`grid grid-cols-2 gap-4`
- 底部区域：模拟结果卡片
- 整体配色跟随项目风格：`bg-[#f7f8fa]` 背景，`#1a1a2e` 标题，卡片白色背景 + 阴影

## 不做的事（YAGNI）

- 球员数据（后续扩展）
- 历史对战记录（无数据源）
- 动画/实况直播（过度设计）
- 赛事全流程模拟（独立需求）
- 持久化/保存模拟结果（无价值）
