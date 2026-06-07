# H2H 赛前深度分析设计文档

> 日期：2026-06-07
> 状态：已确认
> 关联：对阵模拟页 `/h2h`，PRD 第 3 节

---

## 1. 需求概述

为 H2H 对阵模拟页新增"赛前深度分析"模块，在用户选择两队后、点击模拟前，展示三个维度的专业分析：

1. **赔率对比分析** — 基于 odds 数据展示对阵赔率和博彩倾向
2. **近期战绩对比** — 近 10 场赛果、胜率、场均进球/失球对比
3. **战术克制分析** — 基于阵型风格推断克制关系和战术影响

---

## 2. 新增数据层

### 2.1 `strategy.json`（每队新增）

路径：`database/2_ability_models/{TeamName}/strategy.json`

```json
{
  "team_id": "ARG",
  "formation": "4-3-3",
  "style": "possession",
  "pressing_intensity": "high",
  "defensive_line": "mid",
  "transition_speed": "fast"
}
```

**字段说明**：
- `style`：5 种战术风格之一
  - `possession` — 控球渗透
  - `counter_attack` — 防守反击
  - `pressing` — 高位逼抢
  - `balanced` — 均衡
  - `defensive` — 深度防守
- `pressing_intensity`：逼抢强度 `high | medium | low`
- `defensive_line`：防线位置 `high | mid | low`
- `transition_speed`：攻防转换速度 `fast | medium | slow`

**战术克制模型**（循环克制）：
```
possession → 克制 → defensive
counter_attack → 克制 → possession
pressing → 克制 → counter_attack
defensive → 克制 → pressing
balanced — 无明显克制
```

克制方获得 +5% 胜率修正；被克制方 -5%。

### 2.2 `recent_form.json`（每队新增）

路径：`database/2_ability_models/{TeamName}/recent_form.json`

```json
{
  "team_id": "ARG",
  "last_10": [
    { "opponent": "巴西", "result": "W", "score": "2-1", "type": "friendly" },
    { "opponent": "智利", "result": "W", "score": "3-0", "type": "qualifier" }
  ],
  "summary": {
    "wins": 7,
    "draws": 2,
    "losses": 1,
    "goals_scored": 18,
    "goals_conceded": 6
  }
}
```

**字段说明**：
- `result`：`W`（胜）/ `D`（平）/ `L`（负）
- `type`：`friendly`（友谊赛）/ `qualifier`（预选赛）/ `tournament`（杯赛）
- `summary`：近 10 场汇总统计

### 2.3 扩展 `odds.json`

为每支球队新增 H2H 对阵基础赔率字段：

```json
{
  "team_id": "ARG",
  "team_name": "阿根廷",
  "team_name_en": "Argentina",
  "country_code": "ar",
  "odds": 4,
  "win_odds_base": 1.85,
  "draw_odds_base": 3.40,
  "loss_odds_base": 4.50
}
```

**H2H 赔率计算**：基于两队实力差自动调整基础赔率。强队 vs 弱队时，强队胜赔降低，弱队胜赔升高。

---

## 3. 前端组件架构

### 3.1 页面布局（从上到下）

```
┌─────────────────────────────────────────┐
│  [选队区] 主队 VS 客队                    │  ← 已有
├─────────────────────────────────────────┤
│  [能力对比] 雷达图                        │  ← 已有
├─────────────────────────────────────────┤
│  [球队信息] 左右对比卡                     │  ← 已有
├─────────────────────────────────────────┤
│  ★ [赛前深度分析] 新增区域 ★              │
│  ┌───────────┐ ┌───────────┐ ┌─────────┐│
│  │ 📊 赔率   │ │ 📈 近期   │ │ ⚔️ 战术 ││
│  │    对比    │ │    战绩    │ │   克制  ││
│  └───────────┘ └───────────┘ └─────────┘│
├─────────────────────────────────────────┤
│  [开始模拟] 按钮                          │  ← 已有
├─────────────────────────────────────────┤
│  [比赛结果]                               │  ← 已有
└─────────────────────────────────────────┘
```

三个新卡片位于"球队信息"和"开始模拟"按钮之间，使用 3 列 grid 布局（移动端堆叠为单列）。

### 3.2 新增组件

#### `OddsCompare.tsx`（赔率对比卡）

**数据输入**：两队 OddsEntry + 实力差

**展示内容**：
- 卡片标题：`📊 赔率对比`
- 三行赔率对比（胜/平/负），每行格式：`主队赔率 [概率条] 平赔 [概率条] 客队赔率`
- 底部结论文字：`"博彩机构更看好 {球队名}"` 或 `"赔率接近，势均力敌"`

**样式**：
- 白色卡片，圆角 8px，`border: 1px solid #eef0f3`
- 概率条颜色：主队红 `#e53e3e` / 平局灰 `#a0aec0` / 客队蓝 `#3182ce`

#### `RecentForm.tsx`（近期战绩卡）

**数据输入**：两队 RecentFormData

**展示内容**：
- 卡片标题：`📈 近期战绩`
- 近 10 场结果序列：彩色圆点（W 绿 `#38a169` / D 灰 `#a0aec0` / L 红 `#e53e3e`）
- 关键统计对比表：
  - 胜率（如 70% vs 50%）
  - 场均进球
  - 场均失球
- 底部状态评价：基于胜率的文字（`状态火热` / `状态平稳` / `状态低迷`）

**样式**：
- 白色卡片同上
- 圆点直径 8px，间距 4px
- 统计表使用左右对齐 + 中间 VS 分隔

#### `TacticsAnalysis.tsx`（战术克制卡）

**数据输入**：两队 StrategyData + RadarMetrics

**展示内容**：
- 卡片标题：`⚔️ 战术分析`
- 双方阵型展示：`4-3-3 vs 4-2-3-1`
- 风格标签：圆角 badge（如 `控球渗透` / `防守反击`）
- 克制关系判定：
  - 存在克制：`{克制方} 的 {风格} 战术克制 {被克制方} 的 {风格}`
  - 无克制：`双方战术风格无明显克制关系`
- 克制影响量化：`预计影响 ±5% 胜率`
- 基于八维指标的战术匹配分析文字

**样式**：
- 白色卡片同上
- 克制关系高亮显示：克克制文字用绿色 `#38a169`，被克制用橙色 `#ed8936`

### 3.3 数据流

```
page.tsx (Server Component)
  │
  ├─ getAllTeamsWithRadar()      → teams, radarMap
  ├─ getStrategiesMap()          → strategyMap  (新增)
  ├─ getRecentFormsMap()         → formMap      (新增)
  └─ getOddsData()               → oddsMap      (已有，需扩展)
  │
  └─→ H2HClient (Client Component)
        │
        ├─ OddsCompare(teamA, teamB, oddsA, oddsB)
        ├─ RecentForm(teamA, teamB, formA, formB)
        └─ TacticsAnalysis(teamA, teamB, stratA, stratB)
```

### 3.4 新增 TypeScript 类型

```typescript
// src/types/team.ts 新增

export interface StrategyData {
  team_id: string;
  formation: string;
  style: "possession" | "counter_attack" | "pressing" | "balanced" | "defensive";
  pressing_intensity: "high" | "medium" | "low";
  defensive_line: "high" | "mid" | "low";
  transition_speed: "fast" | "medium" | "slow";
}

export interface MatchRecord {
  opponent: string;
  result: "W" | "D" | "L";
  score: string;
  type: "friendly" | "qualifier" | "tournament";
}

export interface RecentFormData {
  team_id: string;
  last_10: MatchRecord[];
  summary: {
    wins: number;
    draws: number;
    losses: number;
    goals_scored: number;
    goals_conceded: number;
  };
}

// odds.json 条目扩展
export interface OddsEntry {
  team_id: string;
  team_name: string;
  team_name_en: string;
  country_code: string;
  odds: number;
  win_odds_base: number;   // 新增
  draw_odds_base: number;  // 新增
  loss_odds_base: number;  // 新增
}
```

### 3.5 H2HPageData 扩展

```typescript
// src/types/simulation.ts 扩展

export interface H2HPageData {
  teams: Array<TeamProfile & { overall_score: number }>;
  radarMap: Record<string, RadarMetrics>;
  strategyMap: Record<string, StrategyData>;      // 新增
  formMap: Record<string, RecentFormData>;         // 新增
  oddsMap: Record<string, OddsEntry>;              // 新增
}
```

---

## 4. Mock 数据生成

使用 Python 脚本 `scripts/generate_pre_match_data.py` 为 48 支球队生成：

1. **strategy.json** — 基于球队实力和 profile 中的 `base_formation` 合理分配战术风格：
   - 顶级球队（overall > 85）：偏好 `possession` 或 `pressing`
   - 中游球队：偏好 `balanced`
   - 弱队：偏好 `defensive` 或 `counter_attack`

2. **recent_form.json** — 基于球队实力生成合理的近期战绩：
   - 强队：7-8 胜 1-2 平 0-1 负
   - 中游队：4-5 胜 2-3 平 2-3 负
   - 弱队：2-3 胜 2-3 平 4-5 负

3. **扩展 odds.json** — 为每支球队补充 H2H 基础赔率，基于夺冠赔率推算

---

## 5. 文件变更清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 新增 | `scripts/generate_pre_match_data.py` | Mock 数据生成脚本 |
| 新增 | `database/2_ability_models/{Team}/strategy.json` × 48 | 战术数据 |
| 新增 | `database/2_ability_models/{Team}/recent_form.json` × 48 | 近期战绩数据 |
| 修改 | `database/2_ability_models/odds.json` | 新增 H2H 赔率字段 |
| 修改 | `src/types/team.ts` | 新增 StrategyData, MatchRecord, RecentFormData 类型 |
| 修改 | `src/types/simulation.ts` | 扩展 H2HPageData |
| 修改 | `src/lib/data.ts` | 新增读取 strategy/recent_form/odds 的函数 |
| 新增 | `src/components/OddsCompare.tsx` | 赔率对比组件 |
| 新增 | `src/components/RecentForm.tsx` | 近期战绩组件 |
| 新增 | `src/components/TacticsAnalysis.tsx` | 战术克制组件 |
| 修改 | `src/components/H2HClient.tsx` | 集成三个新组件 |
| 修改 | `src/app/h2h/page.tsx` | 传递新增数据 |

---

## 6. 设计约束

- 三个分析卡片在移动端（< 768px）垂直堆叠为单列
- 所有 mock 数据需在合理范围内（胜率 20%-90%，赔率 1.1-15.0）
- 组件不依赖外部库，使用已有的 Tailwind + 内联 SVG 风格
- 战术克制结论需结合八维指标做二次校验，避免纯风格匹配的片面结论
