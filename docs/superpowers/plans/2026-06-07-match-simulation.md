# 对阵模拟（H2H Match Simulation）实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现单场比赛模拟功能，用户选择两支球队后展示雷达图对比、球队信息卡片，并基于能力数据模拟比赛结果。

**Architecture:** 服务端组件加载全部球队数据，传递给客户端交互组件。模拟引擎为纯函数（确定性概率计算 + 随机比分生成）。SVG 雷达图手写渲染，零第三方依赖。

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Vitest, SVG

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `my-world-cup/src/components/TopNav.tsx` | 改为客户端组件，用 `usePathname()` 自动检测当前路径 |
| Modify | `my-world-cup/src/app/layout.tsx` | 移除 `currentPath` 硬编码参数 |
| Modify | `my-world-cup/src/lib/data.ts` | 新增 `getAllTeamsWithRadar()` 函数 |
| Create | `my-world-cup/src/lib/simulation.ts` | 模拟引擎：概率计算 + 比分生成 + 分析依据 |
| Create | `my-world-cup/src/lib/__tests__/simulation.test.ts` | 模拟引擎单元测试 |
| Create | `my-world-cup/src/types/simulation.ts` | 模拟相关类型定义 |
| Create | `my-world-cup/src/components/RadarCompareChart.tsx` | SVG 雷达图对比组件 |
| Create | `my-world-cup/src/components/TeamSelect.tsx` | 球队搜索下拉选择器 |
| Create | `my-world-cup/src/components/TeamInfoCard.tsx` | 球队信息卡片（含能力条形图） |
| Create | `my-world-cup/src/components/MatchResult.tsx` | 比赛结果展示（含分析依据） |
| Create | `my-world-cup/src/components/H2HClient.tsx` | 主交互客户端组件（状态管理） |
| Create | `my-world-cup/src/app/h2h/page.tsx` | 页面路由（服务端组件，加载数据） |

---

## Task 1: Fix TopNav 自动检测当前路径

**Files:**
- Modify: `my-world-cup/src/components/TopNav.tsx`
- Modify: `my-world-cup/src/app/layout.tsx`

- [ ] **Step 1: 改 TopNav 为客户端组件，用 usePathname**

替换 `my-world-cup/src/components/TopNav.tsx` 全部内容：

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "赛事概览", href: "/" },
  { label: "球队画像", href: "/team" },
  { label: "对阵模拟", href: "/h2h" },
];

export function TopNav() {
  const currentPath = usePathname();

  return (
    <header className="bg-[#1a1a2e] px-5 py-2.5 flex items-center gap-4">
      <span className="text-white font-bold text-base">🏆 WC 2026</span>
      <span className="text-white/30 text-sm">|</span>
      <nav className="flex gap-5 text-sm">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`pb-0.5 ${
                isActive
                  ? "text-white font-semibold border-b-2 border-[#e53e3e]"
                  : "text-white/50 hover:text-white/80 transition-colors"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: 更新 layout.tsx 移除 currentPath prop**

修改 `my-world-cup/src/app/layout.tsx`，将 `<TopNav currentPath="/" />` 改为 `<TopNav />`：

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/TopNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "2026 World Cup Dashboard",
  description: "2026 美加墨世界杯球队能力看板",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} antialiased`}>
        <TopNav />
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: 验证首页正常渲染**

Run: `cd my-world-cup && npm run build`
Expected: 构建成功，无错误

- [ ] **Step 4: Commit**

```bash
cd K:/AI_Coding/My_World_Cup
git add my-world-cup/src/components/TopNav.tsx my-world-cup/src/app/layout.tsx
git commit -m "refactor: TopNav auto-detect current path via usePathname"
```

---

## Task 2: 新增模拟类型定义

**Files:**
- Create: `my-world-cup/src/types/simulation.ts`

- [ ] **Step 1: 创建模拟类型文件**

创建 `my-world-cup/src/types/simulation.ts`：

```ts
import type { TeamProfile, RadarMetrics } from "./team";

/** 传入模拟引擎的完整球队数据 */
export interface TeamMatchData {
  profile: TeamProfile;
  metrics: RadarMetrics;
  overall_score: number;
}

/** 模拟引擎传递给客户端的全部数据 */
export interface H2HPageData {
  teams: Array<TeamProfile & { overall_score: number }>;
  radarMap: Record<string, RadarMetrics>;
}

/** 单个维度分析 */
export interface DimensionAnalysis {
  dimension: string; // "进攻"
  dimensionKey: string; // "attack"
  valueA: number; // 90
  valueB: number; // 88
  weight: number; // 1.5
  contribution: string; // "进攻权重 ×1.5，贡献约 +3% 胜率"
  favorTeam: "A" | "B" | "neutral";
}

/** 关键数据对比 */
export interface KeyStats {
  fifaRankA: number;
  fifaRankB: number;
  valueA: string;
  valueB: string;
  expectedGoalsA: number;
  expectedGoalsB: number;
}

/** 确定性概率计算结果（不含随机因素） */
export interface BaseProbabilities {
  weightedScoreA: number;
  weightedScoreB: number;
  scoreDiff: number;
  baseWinRateA: number;
  baseDrawRate: number;
  baseWinRateB: number;
  analyses: DimensionAnalysis[];
}

/** 完整模拟结果 */
export interface SimulationResult {
  scoreA: number;
  scoreB: number;
  winRateA: number;
  drawRate: number;
  winRateB: number;
  analyses: DimensionAnalysis[];
  keyStats: KeyStats;
  randomFactor: number;
}
```

- [ ] **Step 2: Commit**

```bash
cd K:/AI_Coding/My_World_Cup
git add my-world-cup/src/types/simulation.ts
git commit -m "feat: add simulation type definitions"
```

---

## Task 3: 模拟引擎（TDD）

**Files:**
- Create: `my-world-cup/src/lib/__tests__/simulation.test.ts`
- Create: `my-world-cup/src/lib/simulation.ts`

- [ ] **Step 1: 写失败测试**

创建 `my-world-cup/src/lib/__tests__/simulation.test.ts`：

```ts
import { describe, it, expect } from "vitest";
import {
  calculateBaseProbabilities,
  simulateMatch,
  DIMENSION_META,
} from "../simulation";
import type { TeamMatchData } from "@/types/simulation";
import type { RadarMetrics, TeamProfile } from "@/types/team";

// ---- 测试用 Mock 数据 ----

const argentinaProfile: TeamProfile = {
  team_id: "ARG",
  team_name: "阿根廷",
  team_name_en: "Argentina",
  confederation: "CONMEBOL",
  head_coach: "斯卡洛尼",
  total_value_m_euros: 850,
  fifa_ranking: 1,
  base_formation: "4-3-3",
  country_code: "ar",
  group: "A",
};

const argentinaMetrics: RadarMetrics = {
  attack: 90,
  defense: 93,
  control: 90,
  status: 83,
  experience: 92,
  place_kick: 95,
  superstar: 86,
  penalty: 86,
};

const newZealandProfile: TeamProfile = {
  team_id: "NZL",
  team_name: "新西兰",
  team_name_en: "New Zealand",
  confederation: "OFC",
  head_coach: "巴兹利",
  total_value_m_euros: 40,
  fifa_ranking: 95,
  base_formation: "5-3-2",
  country_code: "nz",
  group: "A",
};

const newZealandMetrics: RadarMetrics = {
  attack: 50,
  defense: 60,
  control: 47,
  status: 58,
  experience: 53,
  place_kick: 52,
  superstar: 46,
  penalty: 64,
};

const franceProfile: TeamProfile = {
  team_id: "FRA",
  team_name: "法国",
  team_name_en: "France",
  confederation: "UEFA",
  head_coach: "德尚",
  total_value_m_euros: 1300,
  fifa_ranking: 2,
  base_formation: "4-2-3-1",
  country_code: "fr",
  group: "A",
};

const franceMetrics: RadarMetrics = {
  attack: 95,
  defense: 82,
  control: 91,
  status: 86,
  experience: 89,
  place_kick: 84,
  superstar: 86,
  penalty: 90,
};

function makeTeam(profile: TeamProfile, metrics: RadarMetrics): TeamMatchData {
  const values = Object.values(metrics);
  const overall_score = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  return { profile, metrics, overall_score };
}

// ---- Tests ----

describe("DIMENSION_META", () => {
  it("should have 8 dimensions with keys matching RadarMetrics", () => {
    expect(DIMENSION_META).toHaveLength(8);
    const keys = DIMENSION_META.map((d) => d.key);
    expect(keys).toEqual([
      "attack", "defense", "control", "status",
      "experience", "place_kick", "superstar", "penalty",
    ]);
  });

  it("should have weight > 0 for all dimensions", () => {
    DIMENSION_META.forEach((d) => {
      expect(d.weight).toBeGreaterThan(0);
      expect(d.label).toBeTruthy();
    });
  });
});

describe("calculateBaseProbabilities", () => {
  it("should return probabilities that sum to ~1.0", () => {
    const argentina = makeTeam(argentinaProfile, argentinaMetrics);
    const newZealand = makeTeam(newZealandProfile, newZealandMetrics);
    const result = calculateBaseProbabilities(argentina, newZealand);

    const sum = result.baseWinRateA + result.baseDrawRate + result.baseWinRateB;
    expect(sum).toBeCloseTo(1.0, 2);
  });

  it("should heavily favor the stronger team (Argentina vs New Zealand)", () => {
    const argentina = makeTeam(argentinaProfile, argentinaMetrics);
    const newZealand = makeTeam(newZealandProfile, newZealandMetrics);
    const result = calculateBaseProbabilities(argentina, newZealand);

    expect(result.baseWinRateA).toBeGreaterThan(0.7);
    expect(result.weightedScoreA).toBeGreaterThan(result.weightedScoreB);
    expect(result.scoreDiff).toBeGreaterThan(0);
  });

  it("should give close probabilities for evenly matched teams", () => {
    const argentina = makeTeam(argentinaProfile, argentinaMetrics);
    const france = makeTeam(franceProfile, franceMetrics);
    const result = calculateBaseProbabilities(argentina, france);

    // Both between 30% and 60%
    expect(result.baseWinRateA).toBeGreaterThan(0.3);
    expect(result.baseWinRateA).toBeLessThan(0.6);
    expect(result.baseWinRateB).toBeGreaterThan(0.3);
    expect(result.baseWinRateB).toBeLessThan(0.6);
  });

  it("should return 8 dimension analyses", () => {
    const argentina = makeTeam(argentinaProfile, argentinaMetrics);
    const newZealand = makeTeam(newZealandProfile, newZealandMetrics);
    const result = calculateBaseProbabilities(argentina, newZealand);

    expect(result.analyses).toHaveLength(8);
    result.analyses.forEach((a) => {
      expect(a.dimension).toBeTruthy();
      expect(a.dimensionKey).toBeTruthy();
      expect(a.weight).toBeGreaterThan(0);
      expect(a.contribution).toBeTruthy();
      expect(["A", "B", "neutral"]).toContain(a.favorTeam);
    });
  });

  it("should correctly identify which team each dimension favors", () => {
    const argentina = makeTeam(argentinaProfile, argentinaMetrics);
    const newZealand = makeTeam(newZealandProfile, newZealandMetrics);
    const result = calculateBaseProbabilities(argentina, newZealand);

    // Argentina attack 90 > NZ 50, should favor A
    const attackAnalysis = result.analyses.find((a) => a.dimensionKey === "attack")!;
    expect(attackAnalysis.favorTeam).toBe("A");
    expect(attackAnalysis.valueA).toBe(90);
    expect(attackAnalysis.valueB).toBe(50);
  });
});

describe("simulateMatch", () => {
  it("should return valid score (0-7 goals each)", () => {
    const argentina = makeTeam(argentinaProfile, argentinaMetrics);
    const newZealand = makeTeam(newZealandProfile, newZealandMetrics);

    for (let i = 0; i < 20; i++) {
      const result = simulateMatch(argentina, newZealand);
      expect(result.scoreA).toBeGreaterThanOrEqual(0);
      expect(result.scoreA).toBeLessThanOrEqual(7);
      expect(result.scoreB).toBeGreaterThanOrEqual(0);
      expect(result.scoreB).toBeLessThanOrEqual(7);
    }
  });

  it("should return probabilities that sum to ~1.0", () => {
    const argentina = makeTeam(argentinaProfile, argentinaMetrics);
    const newZealand = makeTeam(newZealandProfile, newZealandMetrics);
    const result = simulateMatch(argentina, newZealand);

    const sum = result.winRateA + result.drawRate + result.winRateB;
    expect(sum).toBeCloseTo(1.0, 2);
  });

  it("should favor stronger team over many simulations (statistical test)", () => {
    const argentina = makeTeam(argentinaProfile, argentinaMetrics);
    const newZealand = makeTeam(newZealandProfile, newZealandMetrics);

    let argentinaWins = 0;
    const trials = 200;
    for (let i = 0; i < trials; i++) {
      const result = simulateMatch(argentina, newZealand);
      if (result.scoreA > result.scoreB) argentinaWins++;
    }

    // Argentina should win more than 50% of the time
    expect(argentinaWins / trials).toBeGreaterThan(0.5);
  });

  it("should include key stats with expected goals > 0", () => {
    const argentina = makeTeam(argentinaProfile, argentinaMetrics);
    const newZealand = makeTeam(newZealandProfile, newZealandMetrics);
    const result = simulateMatch(argentina, newZealand);

    expect(result.keyStats.expectedGoalsA).toBeGreaterThan(0);
    expect(result.keyStats.expectedGoalsB).toBeGreaterThan(0);
    expect(result.keyStats.fifaRankA).toBe(1);
    expect(result.keyStats.fifaRankB).toBe(95);
  });

  it("should include random factor in [-0.15, 0.15] range", () => {
    const argentina = makeTeam(argentinaProfile, argentinaMetrics);
    const newZealand = makeTeam(newZealandProfile, newZealandMetrics);

    for (let i = 0; i < 50; i++) {
      const result = simulateMatch(argentina, newZealand);
      expect(Math.abs(result.randomFactor)).toBeLessThanOrEqual(0.15);
    }
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `cd my-world-cup && npx vitest run src/lib/__tests__/simulation.test.ts`
Expected: FAIL — module `../simulation` 不存在

- [ ] **Step 3: 实现模拟引擎**

创建 `my-world-cup/src/lib/simulation.ts`：

```ts
import type { RadarMetrics } from "@/types/team";
import type {
  TeamMatchData,
  DimensionAnalysis,
  KeyStats,
  BaseProbabilities,
  SimulationResult,
} from "@/types/simulation";

/** 维度元数据：键、中文名、权重 */
export const DIMENSION_META: Array<{
  key: keyof RadarMetrics;
  label: string;
  weight: number;
}> = [
  { key: "attack", label: "进攻", weight: 1.5 },
  { key: "defense", label: "防守", weight: 1.2 },
  { key: "control", label: "控球", weight: 1.0 },
  { key: "status", label: "状态", weight: 0.8 },
  { key: "experience", label: "经验", weight: 1.3 },
  { key: "place_kick", label: "定位球", weight: 1.0 },
  { key: "superstar", label: "球星", weight: 1.2 },
  { key: "penalty", label: "点球", weight: 0.8 },
];

/**
 * 计算加权总分
 */
function calculateWeightedScore(metrics: RadarMetrics): number {
  return DIMENSION_META.reduce(
    (sum, dim) => sum + metrics[dim.key] * dim.weight,
    0
  );
}

/**
 * 生成各维度分析
 */
function buildAnalyses(
  metricsA: RadarMetrics,
  metricsB: RadarMetrics,
  weightedScoreA: number,
  weightedScoreB: number
): DimensionAnalysis[] {
  const maxWeighted = Math.max(weightedScoreA, weightedScoreB);
  const diff = weightedScoreA - weightedScoreB;

  return DIMENSION_META.map((dim) => {
    const valA = metricsA[dim.key];
    const valB = metricsB[dim.key];
    const diffVal = (valA - valB) * dim.weight;
    const contributionPct = maxWeighted > 0
      ? Math.round((diffVal / maxWeighted) * 100)
      : 0;

    const absPct = Math.abs(contributionPct);
    const direction = contributionPct > 0 ? "+" : contributionPct < 0 ? "-" : "";
    const favorTeam: "A" | "B" | "neutral" =
      contributionPct > 0 ? "A" : contributionPct < 0 ? "B" : "neutral";

    const contribution =
      absPct === 0
        ? `${dim.label}相当，无明显优势`
        : `${dim.label}权重 ×${dim.weight}，${favorTeam === "A" ? "主队" : "客队"}${direction}${absPct}% 胜率贡献`;

    return {
      dimension: dim.label,
      dimensionKey: dim.key,
      valueA: valA,
      valueB: valB,
      weight: dim.weight,
      contribution,
      favorTeam,
    };
  });
}

/**
 * 计算基础胜率概率（纯函数，确定性）
 */
export function calculateBaseProbabilities(
  teamA: TeamMatchData,
  teamB: TeamMatchData
): BaseProbabilities {
  const weightedScoreA = calculateWeightedScore(teamA.metrics);
  const weightedScoreB = calculateWeightedScore(teamB.metrics);
  const maxWeighted = Math.max(weightedScoreA, weightedScoreB);
  const scoreDiff = maxWeighted > 0
    ? (weightedScoreA - weightedScoreB) / maxWeighted
    : 0;

  // sigmoid 风格映射：scoreDiff 越大，A 胜率越高
  const baseWinRateA = 0.5 + scoreDiff * 1.8;
  // 实力越接近，平局概率越高
  const baseDrawRate = 0.15 + (1 - Math.abs(scoreDiff)) * 0.12;
  const baseWinRateB = 1 - baseWinRateA - baseDrawRate;

  const analyses = buildAnalyses(
    teamA.metrics,
    teamB.metrics,
    weightedScoreA,
    weightedScoreB
  );

  return {
    weightedScoreA,
    weightedScoreB,
    scoreDiff,
    baseWinRateA: Math.max(0.05, Math.min(0.85, baseWinRateA)),
    baseDrawRate: Math.max(0.05, Math.min(0.35, baseDrawRate)),
    baseWinRateB: Math.max(0.05, Math.min(0.85, baseWinRateB)),
    analyses,
  };
}

/**
 * Poisson 随机数（用于模拟进球数）
 */
function poissonRandom(lambda: number): number {
  if (lambda <= 0) return 0;
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

/**
 * 格式化身价值
 */
function formatValue(valueM: number): string {
  if (valueM >= 1000) return `€${(valueM / 1000).toFixed(1)}B`;
  return `€${valueM}M`;
}

/**
 * 完整比赛模拟（含随机因素）
 */
export function simulateMatch(
  teamA: TeamMatchData,
  teamB: TeamMatchData
): SimulationResult {
  const base = calculateBaseProbabilities(teamA, teamB);

  // 随机扰动 ±15%
  const randomFactor = (Math.random() - 0.5) * 0.3;
  const rawWinRateA = base.baseWinRateA + randomFactor;

  const winRateA = Math.max(0.05, Math.min(0.9, rawWinRateA));
  const drawRate = Math.max(0.05, Math.min(0.3, base.baseDrawRate - Math.abs(randomFactor) * 0.3));
  const winRateB = Math.max(0.05, 1 - winRateA - drawRate);

  // 基于攻防计算预期进球
  const baseFactor = 1.2;
  const expectedGoalsA = (teamA.metrics.attack / teamB.metrics.defense) * baseFactor;
  const expectedGoalsB = (teamB.metrics.attack / teamA.metrics.defense) * baseFactor;

  const scoreA = poissonRandom(expectedGoalsA);
  const scoreB = poissonRandom(expectedGoalsB);

  const keyStats: KeyStats = {
    fifaRankA: teamA.profile.fifa_ranking,
    fifaRankB: teamB.profile.fifa_ranking,
    valueA: formatValue(teamA.profile.total_value_m_euros),
    valueB: formatValue(teamB.profile.total_value_m_euros),
    expectedGoalsA: Math.round(expectedGoalsA * 10) / 10,
    expectedGoalsB: Math.round(expectedGoalsB * 10) / 10,
  };

  return {
    scoreA,
    scoreB,
    winRateA: Math.round(winRateA * 100) / 100,
    drawRate: Math.round(drawRate * 100) / 100,
    winRateB: Math.round(winRateB * 100) / 100,
    analyses: base.analyses,
    keyStats,
    randomFactor: Math.round(randomFactor * 100) / 100,
  };
}
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `cd my-world-cup && npx vitest run src/lib/__tests__/simulation.test.ts`
Expected: 所有测试 PASS

- [ ] **Step 5: Commit**

```bash
cd K:/AI_Coding/My_World_Cup
git add my-world-cup/src/lib/simulation.ts my-world-cup/src/lib/__tests__/simulation.test.ts
git commit -m "feat: add match simulation engine with weighted probability calculation"
```

---

## Task 4: 新增数据加载函数

**Files:**
- Modify: `my-world-cup/src/lib/data.ts`

- [ ] **Step 1: 在 data.ts 底部新增 `getAllTeamsWithRadar` 函数**

在 `my-world-cup/src/lib/data.ts` 文件末尾（`formatValue` 函数之后）追加：

```ts
/**
 * 获取所有球队的完整数据（profile + radar），用于对阵模拟页面
 */
export function getAllTeamsWithRadar(): H2HPageData {
  const profiles = getAllTeamProfiles();
  const teams = profiles.map((profile) => {
    const radar = getRadarData(profile.team_name_en);
    const overall_score = radar ? calculateOverallScore(radar) : 0;
    return { ...profile, overall_score };
  });

  const radarMap: Record<string, RadarMetrics> = {};
  for (const profile of profiles) {
    const radar = getRadarData(profile.team_name_en);
    if (radar) {
      radarMap[profile.team_name_en] = radar;
    }
  }

  return { teams, radarMap };
}
```

同时在文件顶部的 import 中添加 `H2HPageData` 类型：

```ts
import type { TeamProfile, RadarMetrics, TeamOverall, OddsEntry, GroupData } from "@/types/team";
import type { H2HPageData } from "@/types/simulation";
```

- [ ] **Step 2: 验证构建**

Run: `cd my-world-cup && npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 3: Commit**

```bash
cd K:/AI_Coding/My_World_Cup
git add my-world-cup/src/lib/data.ts
git commit -m "feat: add getAllTeamsWithRadar data utility for H2H page"
```

---

## Task 5: SVG 雷达图组件

**Files:**
- Create: `my-world-cup/src/components/RadarCompareChart.tsx`

- [ ] **Step 1: 创建雷达图组件**

创建 `my-world-cup/src/components/RadarCompareChart.tsx`：

```tsx
"use client";

import type { RadarMetrics } from "@/types/team";

interface RadarCompareChartProps {
  metricsA: RadarMetrics;
  metricsB: RadarMetrics;
  nameA: string;
  nameB: string;
}

const DIMENSIONS: Array<{ key: keyof RadarMetrics; label: string }> = [
  { key: "attack", label: "进攻" },
  { key: "control", label: "控球" },
  { key: "defense", label: "防守" },
  { key: "experience", label: "经验" },
  { key: "status", label: "状态" },
  { key: "place_kick", label: "定位球" },
  { key: "superstar", label: "球星" },
  { key: "penalty", label: "点球" },
];

const CX = 200;
const CY = 200;
const RADIUS = 140;
const GRID_LEVELS = [25, 50, 75, 100];

function polarToCartesian(axisIndex: number, value: number) {
  const angle = -Math.PI / 2 + axisIndex * (2 * Math.PI / 8);
  const r = (value / 100) * RADIUS;
  return {
    x: CX + r * Math.cos(angle),
    y: CY + r * Math.sin(angle),
  };
}

function getAxisEnd(axisIndex: number) {
  const angle = -Math.PI / 2 + axisIndex * (2 * Math.PI / 8);
  return {
    x: CX + RADIUS * Math.cos(angle),
    y: CY + RADIUS * Math.sin(angle),
  };
}

function getLabelPos(axisIndex: number) {
  const angle = -Math.PI / 2 + axisIndex * (2 * Math.PI / 8);
  const labelR = RADIUS + 28;
  const pos = {
    x: CX + labelR * Math.cos(angle),
    y: CY + labelR * Math.sin(angle),
  };
  return pos;
}

function buildPolygonPoints(metrics: RadarMetrics): string {
  return DIMENSIONS.map((dim, i) => {
    const pt = polarToCartesian(i, metrics[dim.key]);
    return `${pt.x},${pt.y}`;
  }).join(" ");
}

function buildGridOctagon(level: number): string {
  return Array.from({ length: 8 }, (_, i) => {
    const pt = polarToCartesian(i, level);
    return `${pt.x},${pt.y}`;
  }).join(" ");
}

export function RadarCompareChart({
  metricsA,
  metricsB,
  nameA,
  nameB,
}: RadarCompareChartProps) {
  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 400 420"
        className="w-full max-w-[400px]"
        role="img"
        aria-label={`${nameA} vs ${nameB} 能力雷达图对比`}
      >
        {/* Grid octagons */}
        {GRID_LEVELS.map((level) => (
          <polygon
            key={level}
            points={buildGridOctagon(level)}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={level === 100 ? 1.5 : 0.8}
            strokeDasharray={level === 100 ? "none" : "3,3"}
          />
        ))}

        {/* Axis lines */}
        {DIMENSIONS.map((_, i) => {
          const end = getAxisEnd(i);
          return (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={end.x}
              y2={end.y}
              stroke="#e2e8f0"
              strokeWidth={0.8}
            />
          );
        })}

        {/* Team B polygon (blue, drawn first so A is on top) */}
        <polygon
          points={buildPolygonPoints(metricsB)}
          fill="rgba(49,130,206,0.15)"
          stroke="#3182ce"
          strokeWidth={2}
        />

        {/* Team A polygon (red) */}
        <polygon
          points={buildPolygonPoints(metricsA)}
          fill="rgba(229,62,62,0.15)"
          stroke="#e53e3e"
          strokeWidth={2}
        />

        {/* Vertex dots - Team A */}
        {DIMENSIONS.map((dim, i) => {
          const pt = polarToCartesian(i, metricsA[dim.key]);
          return (
            <circle
              key={`a-${dim.key}`}
              cx={pt.x}
              cy={pt.y}
              r={3.5}
              fill="white"
              stroke="#e53e3e"
              strokeWidth={2}
            />
          );
        })}

        {/* Vertex dots - Team B */}
        {DIMENSIONS.map((dim, i) => {
          const pt = polarToCartesian(i, metricsB[dim.key]);
          return (
            <circle
              key={`b-${dim.key}`}
              cx={pt.x}
              cy={pt.y}
              r={3.5}
              fill="white"
              stroke="#3182ce"
              strokeWidth={2}
            />
          );
        })}

        {/* Axis labels + values */}
        {DIMENSIONS.map((dim, i) => {
          const pos = getLabelPos(i);
          const valA = metricsA[dim.key];
          const valB = metricsB[dim.key];
          // 根据轴方向微调文本对齐
          const angle = -Math.PI / 2 + i * (2 * Math.PI / 8);
          let textAnchor: "start" | "middle" | "end" = "middle";
          if (Math.cos(angle) > 0.3) textAnchor = "start";
          if (Math.cos(angle) < -0.3) textAnchor = "end";

          return (
            <g key={`label-${dim.key}`}>
              <text
                x={pos.x}
                y={pos.y - 6}
                textAnchor={textAnchor}
                className="text-[10px] fill-[#1a1a2e] font-medium"
              >
                {dim.label}
              </text>
              <text
                x={pos.x}
                y={pos.y + 7}
                textAnchor={textAnchor}
                className="text-[9px]"
              >
                <tspan fill="#e53e3e" fontWeight={600}>{valA}</tspan>
                <tspan fill="#94a3b8"> / </tspan>
                <tspan fill="#3182ce" fontWeight={600}>{valB}</tspan>
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-1 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#e53e3e] opacity-60 inline-block" />
          {nameA}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#3182ce] opacity-60 inline-block" />
          {nameB}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 验证构建**

Run: `cd my-world-cup && npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 3: Commit**

```bash
cd K:/AI_Coding/My_World_Cup
git add my-world-cup/src/components/RadarCompareChart.tsx
git commit -m "feat: add SVG radar compare chart component"
```

---

## Task 6: 球队选择器组件

**Files:**
- Create: `my-world-cup/src/components/TeamSelect.tsx`

- [ ] **Step 1: 创建球队选择器**

创建 `my-world-cup/src/components/TeamSelect.tsx`：

```tsx
"use client";

import { useState, useRef, useEffect } from "react";

interface TeamOption {
  team_id: string;
  team_name: string;
  team_name_en: string;
  confederation: string;
  group: string;
}

interface TeamSelectProps {
  teams: TeamOption[];
  value: string | null;
  onChange: (teamNameEn: string | null) => void;
  placeholder?: string;
  disabled?: string | null; // team_name_en of the other team (to disable)
}

export function TeamSelect({
  teams,
  value,
  onChange,
  placeholder = "选择球队...",
  disabled,
}: TeamSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = teams.find((t) => t.team_name_en === value);

  const filtered = teams.filter((t) => {
    if (t.team_name_en === disabled) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.team_name.toLowerCase().includes(q) ||
      t.team_name_en.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-[260px]">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2.5 rounded-lg border text-left text-sm flex items-center justify-between gap-2 transition-colors ${
          isOpen
            ? "border-[#3182ce] bg-white ring-2 ring-[#3182ce]/20"
            : "border-[#e2e8f0] bg-white hover:border-gray-300"
        }`}
      >
        <span className={selected ? "text-[#1a1a2e] font-medium" : "text-gray-400"}>
          {selected ? selected.team_name : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg border border-[#e2e8f0] shadow-lg max-h-[280px] overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-[#eef0f3]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索球队..."
              className="w-full px-2 py-1.5 text-sm border border-[#e2e8f0] rounded focus:outline-none focus:border-[#3182ce]"
              autoFocus
            />
          </div>

          {/* Options */}
          <div className="overflow-y-auto max-h-[220px]">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-400">无匹配结果</div>
            ) : (
              filtered.map((team) => (
                <button
                  key={team.team_id}
                  type="button"
                  onClick={() => {
                    onChange(team.team_name_en);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-[#f7f8fa] transition-colors flex items-center justify-between ${
                    team.team_name_en === value ? "bg-[#3182ce]/5 text-[#3182ce]" : "text-[#1a1a2e]"
                  }`}
                >
                  <span className="font-medium">{team.team_name}</span>
                  <span className="text-[10px] text-gray-400 uppercase">{team.confederation}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 验证构建**

Run: `cd my-world-cup && npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 3: Commit**

```bash
cd K:/AI_Coding/My_World_Cup
git add my-world-cup/src/components/TeamSelect.tsx
git commit -m "feat: add team search select dropdown component"
```

---

## Task 7: 球队信息卡片组件

**Files:**
- Create: `my-world-cup/src/components/TeamInfoCard.tsx`

- [ ] **Step 1: 创建球队信息卡片**

创建 `my-world-cup/src/components/TeamInfoCard.tsx`：

```tsx
"use client";

import type { RadarMetrics, TeamProfile } from "@/types/team";
import type { TeamMatchData } from "@/types/simulation";

interface TeamInfoCardProps {
  team: TeamMatchData;
  accentColor: string; // "red" | "blue" → 卡片左侧边框颜色
}

const ABILITY_LABELS: Array<{ key: keyof RadarMetrics; label: string }> = [
  { key: "attack", label: "进攻" },
  { key: "defense", label: "防守" },
  { key: "control", label: "控球" },
  { key: "status", label: "状态" },
  { key: "experience", label: "经验" },
  { key: "place_kick", label: "定位球" },
  { key: "superstar", label: "球星" },
  { key: "penalty", label: "点球" },
];

const ACCENT_COLORS = {
  red: { border: "border-l-[#e53e3e]", bg: "bg-[#e53e3e]", bar: "#e53e3e" },
  blue: { border: "border-l-[#3182ce]", bg: "bg-[#3182ce]", bar: "#3182ce" },
};

function formatValue(valueM: number): string {
  if (valueM >= 1000) return `€${(valueM / 1000).toFixed(1)}B`;
  return `€${valueM}M`;
}

export function TeamInfoCard({ team, accentColor }: TeamInfoCardProps) {
  const colors = ACCENT_COLORS[accentColor as "red" | "blue"];
  const { profile, metrics, overall_score } = team;

  return (
    <div className={`bg-white rounded-lg border border-[#eef0f3] p-4 border-l-4 ${colors.border}`}>
      {/* Header: team name + overall */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-[#1a1a2e]">{profile.team_name}</h3>
        <span className="text-xl font-bold" style={{ color: colors.bar }}>
          {overall_score}
        </span>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 mb-4 text-xs">
        <div>
          <span className="text-gray-400">教练</span>
          <p className="text-[#1a1a2e] font-medium">{profile.head_coach}</p>
        </div>
        <div>
          <span className="text-gray-400">阵型</span>
          <p className="text-[#1a1a2e] font-medium">{profile.base_formation}</p>
        </div>
        <div>
          <span className="text-gray-400">总身价</span>
          <p className="text-[#1a1a2e] font-medium">{formatValue(profile.total_value_m_euros)}</p>
        </div>
        <div>
          <span className="text-gray-400">FIFA 排名</span>
          <p className="text-[#1a1a2e] font-medium">#{profile.fifa_ranking}</p>
        </div>
        <div>
          <span className="text-gray-400">足联</span>
          <p className="text-[#1a1a2e] font-medium">{profile.confederation}</p>
        </div>
        <div>
          <span className="text-gray-400">小组</span>
          <p className="text-[#1a1a2e] font-medium">{profile.group} 组</p>
        </div>
      </div>

      {/* Ability bars */}
      <div className="space-y-1.5">
        {ABILITY_LABELS.map((dim) => {
          const val = metrics[dim.key];
          return (
            <div key={dim.key} className="flex items-center gap-2 text-[11px]">
              <span className="w-10 text-gray-500 shrink-0">{dim.label}</span>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${val}%`,
                    backgroundColor: colors.bar,
                    opacity: 0.7,
                  }}
                />
              </div>
              <span className="w-7 text-right font-medium text-[#1a1a2e]">{val}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 验证构建**

Run: `cd my-world-cup && npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 3: Commit**

```bash
cd K:/AI_Coding/My_World_Cup
git add my-world-cup/src/components/TeamInfoCard.tsx
git commit -m "feat: add team info card component with ability bars"
```

---

## Task 8: 比赛结果展示组件

**Files:**
- Create: `my-world-cup/src/components/MatchResult.tsx`

- [ ] **Step 1: 创建比赛结果组件**

创建 `my-world-cup/src/components/MatchResult.tsx`：

```tsx
"use client";

import type { SimulationResult, TeamMatchData } from "@/types/simulation";

interface MatchResultProps {
  result: SimulationResult;
  teamA: TeamMatchData;
  teamB: TeamMatchData;
  onResimulate: () => void;
}

export function MatchResult({ result, teamA, teamB, onResimulate }: MatchResultProps) {
  const { scoreA, scoreB, winRateA, drawRate, winRateB, analyses, keyStats, randomFactor } = result;

  return (
    <div className="bg-white rounded-lg border border-[#eef0f3] p-5 mt-4">
      <h3 className="text-sm font-bold text-[#1a1a2e] mb-4 flex items-center gap-1.5">
        ⚽ 比赛模拟结果
      </h3>

      {/* Score */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <span className="text-base font-bold text-[#e53e3e]">{teamA.profile.team_name}</span>
        <div className="flex items-center gap-2">
          <span className="text-4xl font-black text-[#1a1a2e]">{scoreA}</span>
          <span className="text-xl text-gray-300">:</span>
          <span className="text-4xl font-black text-[#1a1a2e]">{scoreB}</span>
        </div>
        <span className="text-base font-bold text-[#3182ce]">{teamB.profile.team_name}</span>
      </div>

      {/* Probability bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-[#e53e3e] font-medium">{teamA.profile.team_name} {(winRateA * 100).toFixed(0)}%</span>
          <span className="text-gray-500">平局 {(drawRate * 100).toFixed(0)}%</span>
          <span className="text-[#3182ce] font-medium">{teamB.profile.team_name} {(winRateB * 100).toFixed(0)}%</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden flex bg-gray-100">
          <div className="bg-[#e53e3e] transition-all duration-500" style={{ width: `${winRateA * 100}%` }} />
          <div className="bg-gray-300 transition-all duration-500" style={{ width: `${drawRate * 100}%` }} />
          <div className="bg-[#3182ce] transition-all duration-500" style={{ width: `${winRateB * 100}%` }} />
        </div>
      </div>

      {/* Analysis bullet points */}
      <div className="bg-[#f7f8fa] rounded-lg p-3.5 mb-4">
        <h4 className="text-xs font-bold text-[#1a1a2e] mb-2">📊 分析依据</h4>
        <ul className="space-y-1.5 text-[11px] text-gray-600">
          <li className="flex items-start gap-1.5">
            <span className="text-gray-400 mt-0.5">•</span>
            <span>
              综合评分：{teamA.profile.team_name} {teamA.overall_score} vs {teamB.profile.team_name} {teamB.overall_score}
              {teamA.overall_score !== teamB.overall_score && (
                <span className="text-gray-400">
                  {" "}→ 评分差距 {Math.abs(teamA.overall_score - teamB.overall_score).toFixed(1)}，贡献约{" "}
                  {Math.abs(teamA.overall_score - teamB.overall_score) > 5 ? "+5% 以上" : "+2~5%"} 胜率贡献
                </span>
              )}
            </span>
          </li>

          {analyses.map((a) => (
            <li key={a.dimensionKey} className="flex items-start gap-1.5">
              <span className={`mt-0.5 ${a.favorTeam === "A" ? "text-[#e53e3e]" : a.favorTeam === "B" ? "text-[#3182ce]" : "text-gray-400"}`}>•</span>
              <span>
                {a.dimension}：{teamA.profile.team_name} {a.valueA} vs {teamB.profile.team_name} {a.valueB}
                <span className="text-gray-400"> → {a.contribution}</span>
              </span>
            </li>
          ))}

          <li className="flex items-start gap-1.5">
            <span className="text-gray-400 mt-0.5">•</span>
            <span className="text-gray-400">
              随机因素扰动：本次 {randomFactor > 0 ? "+" : ""}{(randomFactor * 100).toFixed(0)}%
            </span>
          </li>
        </ul>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-3 gap-3 mb-4 text-center text-xs">
        <div className="bg-[#f7f8fa] rounded-lg p-2">
          <span className="text-gray-400 block mb-0.5">FIFA 排名</span>
          <span className="font-bold text-[#1a1a2e]">#{keyStats.fifaRankA} vs #{keyStats.fifaRankB}</span>
        </div>
        <div className="bg-[#f7f8fa] rounded-lg p-2">
          <span className="text-gray-400 block mb-0.5">总身价</span>
          <span className="font-bold text-[#1a1a2e]">{keyStats.valueA} vs {keyStats.valueB}</span>
        </div>
        <div className="bg-[#f7f8fa] rounded-lg p-2">
          <span className="text-gray-400 block mb-0.5">预期进球</span>
          <span className="font-bold text-[#1a1a2e]">{keyStats.expectedGoalsA} vs {keyStats.expectedGoalsB}</span>
        </div>
      </div>

      {/* Resimulate button */}
      <div className="flex justify-center">
        <button
          onClick={onResimulate}
          className="px-5 py-2 bg-[#1a1a2e] text-white text-sm font-medium rounded-lg hover:bg-[#2d2d4a] transition-colors active:scale-95"
        >
          🔄 重新模拟
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 验证构建**

Run: `cd my-world-cup && npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 3: Commit**

```bash
cd K:/AI_Coding/My_World_Cup
git add my-world-cup/src/components/MatchResult.tsx
git commit -m "feat: add match result display with analysis breakdown"
```

---

## Task 9: 组装 H2H 主页面

**Files:**
- Create: `my-world-cup/src/components/H2HClient.tsx`
- Create: `my-world-cup/src/app/h2h/page.tsx`

- [ ] **Step 1: 创建客户端交互主组件**

创建 `my-world-cup/src/components/H2HClient.tsx`：

```tsx
"use client";

import { useState, useMemo } from "react";
import type { H2HPageData, SimulationResult, TeamMatchData } from "@/types/simulation";
import { TeamSelect } from "./TeamSelect";
import { RadarCompareChart } from "./RadarCompareChart";
import { TeamInfoCard } from "./TeamInfoCard";
import { MatchResult } from "./MatchResult";
import { simulateMatch } from "@/lib/simulation";

interface H2HClientProps {
  data: H2HPageData;
}

export function H2HClient({ data }: H2HClientProps) {
  const { teams, radarMap } = data;
  const [teamAName, setTeamAName] = useState<string | null>(null);
  const [teamBName, setTeamBName] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const teamA: TeamMatchData | null = useMemo(() => {
    if (!teamAName) return null;
    const profile = teams.find((t) => t.team_name_en === teamAName);
    const metrics = radarMap[teamAName];
    if (!profile || !metrics) return null;
    return { profile, metrics, overall_score: profile.overall_score };
  }, [teamAName, teams, radarMap]);

  const teamB: TeamMatchData | null = useMemo(() => {
    if (!teamBName) return null;
    const profile = teams.find((t) => t.team_name_en === teamBName);
    const metrics = radarMap[teamBName];
    if (!profile || !metrics) return null;
    return { profile, metrics, overall_score: profile.overall_score };
  }, [teamBName, teams, radarMap]);

  const bothSelected = teamA !== null && teamB !== null;

  function handleSimulate() {
    if (!teamA || !teamB) return;
    const simResult = simulateMatch(teamA, teamB);
    setResult(simResult);
  }

  function handleResimulate() {
    if (!teamA || !teamB) return;
    const simResult = simulateMatch(teamA, teamB);
    setResult(simResult);
  }

  // 重新选择球队时清除结果
  function handleTeamAChange(name: string | null) {
    setTeamAName(name);
    setResult(null);
  }

  function handleTeamBChange(name: string | null) {
    setTeamBName(name);
    setResult(null);
  }

  return (
    <div className="px-5 py-4 max-w-4xl mx-auto">
      {/* Step 1: Team selection */}
      <div className="mb-6">
        <h1 className="text-lg font-bold text-[#1a1a2e] mb-1">对阵模拟</h1>
        <p className="text-[11px] text-gray-400 mb-4">选择两支球队，模拟一场比赛</p>

        <div className="flex items-center justify-center gap-4">
          <TeamSelect
            teams={teams}
            value={teamAName}
            onChange={handleTeamAChange}
            placeholder="选择主队..."
            disabled={teamBName}
          />
          <span className="text-lg font-black text-gray-300 shrink-0">VS</span>
          <TeamSelect
            teams={teams}
            value={teamBName}
            onChange={handleTeamBChange}
            placeholder="选择客队..."
            disabled={teamAName}
          />
        </div>

        {bothSelected && (
          <div className="flex justify-center mt-4">
            <button
              onClick={handleSimulate}
              className="px-6 py-2.5 bg-[#e53e3e] text-white text-sm font-semibold rounded-lg hover:bg-[#c53030] transition-colors active:scale-95"
            >
              ⚽ 开始模拟
            </button>
          </div>
        )}
      </div>

      {/* Step 2: Pre-match analysis */}
      {bothSelected && teamA && teamB && (
        <>
          {/* Radar chart */}
          <div className="mb-6">
            <h2 className="text-[15px] font-bold text-[#1a1a2e] mb-3">能力对比</h2>
            <RadarCompareChart
              metricsA={teamA.metrics}
              metricsB={teamB.metrics}
              nameA={teamA.profile.team_name}
              nameB={teamB.profile.team_name}
            />
          </div>

          {/* Team info cards */}
          <div className="mb-4">
            <h2 className="text-[15px] font-bold text-[#1a1a2e] mb-3">球队信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TeamInfoCard team={teamA} accentColor="red" />
              <TeamInfoCard team={teamB} accentColor="blue" />
            </div>
          </div>
        </>
      )}

      {/* Step 3: Match result */}
      {result && teamA && teamB && (
        <MatchResult
          result={result}
          teamA={teamA}
          teamB={teamB}
          onResimulate={handleResimulate}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: 创建页面路由（服务端组件）**

创建 `my-world-cup/src/app/h2h/page.tsx`：

```tsx
import { getAllTeamsWithRadar } from "@/lib/data";
import { H2HClient } from "@/components/H2HClient";

export default function H2HPage() {
  const data = getAllTeamsWithRadar();

  return (
    <div className="bg-[#f7f8fa] min-h-screen flex flex-col">
      <H2HClient data={data} />
    </div>
  );
}
```

- [ ] **Step 3: 构建验证**

Run: `cd my-world-cup && npm run build`
Expected: 构建成功

- [ ] **Step 4: 手动验证**

Run: `cd my-world-cup && npm run dev`

打开 http://localhost:3000/h2h，验证：
1. 导航栏 "对阵模拟" 高亮
2. 下拉选择两支球队，雷达图和信息卡片自动渲染
3. 点击 "开始模拟" 显示比分和分析依据
4. 点击 "重新模拟" 生成新结果
5. 切换球队后结果自动清除

- [ ] **Step 5: Commit**

```bash
cd K:/AI_Coding/My_World_Cup
git add my-world-cup/src/components/H2HClient.tsx my-world-cup/src/app/h2h/page.tsx
git commit -m "feat: implement H2H match simulation page with team comparison"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** 设计文档中每个需求都有对应 Task
  - 雷达图对比 → Task 5
  - 球队信息卡片 → Task 7
  - 模拟引擎 → Task 3
  - 分析依据 → Task 8
  - 页面路由 → Task 9
  - TopNav 修复 → Task 1
- [x] **Placeholder scan:** 无 TBD/TODO/模糊描述，每步都有完整代码
- [x] **Type consistency:** 类型定义在 Task 2，后续 Task 引用一致
