# 赛事概览页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建世界杯数据看板的赛事概览首页（路由 `/`），包含 48 强分组卡片网格和三个数据排行图表。

**Architecture:** Next.js App Router SSG 页面，从本地 JSON 文件读取数据，纯 CSS 水平条形图（Tailwind），组件化拆分为 TopNav / GroupCard / TeamRow / RankingChart / Footer。

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons

**Design Spec:** `docs/superpowers/specs/2026-06-06-overview-page-design.md`

---

## File Structure

```
my-world-cup/                          # Next.js project root
├── database/
│   └── 2_ability_models/
│       ├── odds.json                   # 48队夺冠赔率
│       ├── Argentina/
│       │   ├── profile.json
│       │   └── radar_data.json
│       ├── France/
│       │   ├── profile.json
│       │   └── radar_data.json
│       └── ... (48支球队目录)
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # 根布局 + TopNav
│   │   ├── page.tsx                    # 概览页
│   │   └── globals.css
│   ├── components/
│   │   ├── TopNav.tsx                  # 顶部导航
│   │   ├── GroupCard.tsx               # 分组卡片
│   │   ├── TeamRow.tsx                 # 卡片内球队行
│   │   ├── RankingChart.tsx            # 水平条形图排行
│   │   └── OverviewFooter.tsx          # 概览页页脚
│   ├── lib/
│   │   ├── data.ts                     # 数据加载
│   │   └── score.ts                    # 综合评分计算
│   └── types/
│       └── team.ts                     # TS 类型定义
├── scripts/
│   └── generate-mock-data.mjs          # Mock 数据生成脚本
└── package.json
```

---

### Task 1: 初始化 Next.js 项目 + 安装依赖

**Files:**
- Create: `my-world-cup/` (Next.js project)
- Create: `package.json` (dependencies)

- [ ] **Step 1: 创建 Next.js 项目**

Run:
```bash
cd K:\AI_Coding\My_World_Cup
npx create-next-app@latest my-world-cup --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack
```

Expected: 项目创建成功，`my-world-cup/` 目录生成

- [ ] **Step 2: 安装额外依赖**

Run:
```bash
cd K:\AI_Coding\My_World_Cup\my-world-cup
npx shadcn@latest init -d
npm install lucide-react
```

Expected: shadcn/ui 初始化完成，`lucide-react` 安装成功

- [ ] **Step 3: 创建项目目录结构**

Run:
```bash
cd K:\AI_Coding\My_World_Cup\my-world-cup
mkdir -p src/types src/lib src/components
mkdir -p database/2_ability_models
mkdir -p scripts
```

- [ ] **Step 4: 验证开发服务器启动**

Run:
```bash
cd K:\AI_Coding\My_World_Cup\my-world-cup
npm run dev
```

Expected: 服务器在 `http://localhost:3000` 启动，浏览器打开显示 Next.js 默认页面。停止服务器后继续。

- [ ] **Step 5: Commit**

```bash
cd K:\AI_Coding\My_World_Cup\my-world-cup
git init
git add .
git commit -m "feat: initialize Next.js project with Tailwind, shadcn/ui, Lucide"
```

---

### Task 2: TypeScript 类型定义

**Files:**
- Create: `src/types/team.ts`

- [ ] **Step 1: 创建类型文件**

```typescript
// src/types/team.ts

export interface TeamProfile {
  team_id: string;
  team_name: string;
  team_name_en: string;
  confederation: string;
  head_coach: string;
  total_value_m_euros: number;
  fifa_ranking: number;
  base_formation: string;
  country_code: string;
  group: string;
}

export interface RadarMetrics {
  attack: number;
  defense: number;
  control: number;
  status: number;
  experience: number;
  place_kick: number;
  superstar: number;
  penalty: number;
}

export interface RadarData {
  team_id: string;
  metrics: RadarMetrics;
  update_time: string;
}

export interface TeamOverall extends TeamProfile {
  overall_score: number;
}

export interface OddsEntry {
  team_id: string;
  team_name: string;
  team_name_en: string;
  country_code: string;
  odds: number;
}

export interface GroupData {
  group_name: string;
  color: string;
  teams: TeamOverall[];
}

export const GROUP_COLORS: Record<string, string> = {
  A: "#e53e3e",
  B: "#3182ce",
  C: "#38a169",
  D: "#d69e2e",
  E: "#805ad5",
  F: "#ed8936",
  G: "#e53e3e",
  H: "#3182ce",
  I: "#38a169",
  J: "#d69e2e",
  K: "#805ad5",
  L: "#ed8936",
};

export const BAR_GRADIENTS = [
  "linear-gradient(90deg, #e53e3e, #fc8181)",
  "linear-gradient(90deg, #3182ce, #90cdf4)",
  "linear-gradient(90deg, #38a169, #9ae6b4)",
  "linear-gradient(90deg, #d69e2e, #fefcbf)",
  "linear-gradient(90deg, #805ad5, #d6bcfa)",
];
```

- [ ] **Step 2: Commit**

```bash
git add src/types/team.ts
git commit -m "feat: add TypeScript type definitions for team data"
```

---

### Task 3: Mock 数据生成

**Files:**
- Create: `scripts/generate-mock-data.mjs`
- Create: `database/2_ability_models/` 下 48 支球队的 `profile.json` 和 `radar_data.json`
- Create: `database/2_ability_models/odds.json`

- [ ] **Step 1: 编写数据生成脚本**

```javascript
// scripts/generate-mock-data.mjs
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_DIR = join(__dirname, "..", "database", "2_ability_models");

const TEAMS = [
  // Group A
  { id: "ARG", name: "阿根廷", nameEn: "Argentina", code: "ar", conf: "CONMEBOL", coach: "斯卡洛尼", value: 850, fifa: 1, form: "4-3-3", group: "A" },
  { id: "FRA", name: "法国", nameEn: "France", code: "fr", conf: "UEFA", coach: "德尚", value: 1300, fifa: 2, form: "4-2-3-1", group: "A" },
  { id: "MEX", name: "墨西哥", nameEn: "Mexico", code: "mx", conf: "CONCACAF", coach: "洛萨诺", value: 250, fifa: 15, form: "4-3-3", group: "A" },
  { id: "NZL", name: "新西兰", nameEn: "New Zealand", code: "nz", conf: "OFC", coach: "巴兹利", value: 40, fifa: 95, form: "5-3-2", group: "A" },
  // Group B
  { id: "BRA", name: "巴西", nameEn: "Brazil", code: "br", conf: "CONMEBOL", coach: "安切洛蒂", value: 1100, fifa: 5, form: "4-3-3", group: "B" },
  { id: "GER", name: "德国", nameEn: "Germany", code: "de", conf: "UEFA", coach: "纳格尔斯曼", value: 820, fifa: 3, form: "4-2-3-1", group: "B" },
  { id: "JPN", name: "日本", nameEn: "Japan", code: "jp", conf: "AFC", coach: "森保一", value: 280, fifa: 18, form: "4-2-3-1", group: "B" },
  { id: "CMR", name: "喀麦隆", nameEn: "Cameroon", code: "cm", conf: "CAF", coach: "里格贝特·宋", value: 150, fifa: 45, form: "4-3-3", group: "B" },
  // Group C
  { id: "ENG", name: "英格兰", nameEn: "England", code: "gb-eng", conf: "UEFA", coach: "图赫尔", value: 1400, fifa: 4, form: "4-3-3", group: "C" },
  { id: "ESP", name: "西班牙", nameEn: "Spain", code: "es", conf: "UEFA", coach: "德拉富恩特", value: 1050, fifa: 8, form: "4-3-3", group: "C" },
  { id: "USA", name: "美国", nameEn: "USA", code: "us", conf: "CONCACAF", coach: "波普", value: 350, fifa: 13, form: "4-3-3", group: "C" },
  { id: "QAT", name: "卡塔尔", nameEn: "Qatar", code: "qa", conf: "AFC", coach: "洛佩兹", value: 50, fifa: 55, form: "5-3-2", group: "C" },
  // Group D
  { id: "POR", name: "葡萄牙", nameEn: "Portugal", code: "pt", conf: "UEFA", coach: "马丁内斯", value: 950, fifa: 6, form: "4-3-3", group: "D" },
  { id: "NED", name: "荷兰", nameEn: "Netherlands", code: "nl", conf: "UEFA", coach: "科曼", value: 680, fifa: 7, form: "3-4-3", group: "D" },
  { id: "KOR", name: "韩国", nameEn: "South Korea", code: "kr", conf: "AFC", coach: "洪明甫", value: 200, fifa: 23, form: "4-4-2", group: "D" },
  { id: "SEN", name: "塞内加尔", nameEn: "Senegal", code: "sn", conf: "CAF", coach: "西塞", value: 180, fifa: 20, form: "4-2-3-1", group: "D" },
  // Group E
  { id: "ITA", name: "意大利", nameEn: "Italy", code: "it", conf: "UEFA", coach: "斯帕莱蒂", value: 700, fifa: 9, form: "3-5-2", group: "E" },
  { id: "CRO", name: "克罗地亚", nameEn: "Croatia", code: "hr", conf: "UEFA", coach: "达利奇", value: 380, fifa: 10, form: "4-3-3", group: "E" },
  { id: "COL", name: "哥伦比亚", nameEn: "Colombia", code: "co", conf: "CONMEBOL", coach: "洛伦佐", value: 320, fifa: 12, form: "4-3-3", group: "E" },
  { id: "AUS", name: "澳大利亚", nameEn: "Australia", code: "au", conf: "AFC", coach: "波波维奇", value: 60, fifa: 40, form: "4-4-2", group: "E" },
  // Group F
  { id: "BEL", name: "比利时", nameEn: "Belgium", code: "be", conf: "UEFA", coach: "鲁迪·加西亚", value: 550, fifa: 11, form: "3-4-3", group: "F" },
  { id: "URU", name: "乌拉圭", nameEn: "Uruguay", code: "uy", conf: "CONMEBOL", coach: "贝尔萨", value: 450, fifa: 14, form: "4-2-3-1", group: "F" },
  { id: "TUN", name: "突尼斯", nameEn: "Tunisia", code: "tn", conf: "CAF", coach: "卡德里", value: 70, fifa: 35, form: "4-3-3", group: "F" },
  { id: "CAN", name: "加拿大", nameEn: "Canada", code: "ca", conf: "CONCACAF", coach: "马什", value: 180, fifa: 30, form: "4-4-2", group: "F" },
  // Group G
  { id: "SUI", name: "瑞士", nameEn: "Switzerland", code: "ch", conf: "UEFA", coach: "雅金", value: 350, fifa: 16, form: "3-4-3", group: "G" },
  { id: "DEN", name: "丹麦", nameEn: "Denmark", code: "dk", conf: "UEFA", coach: "里默尔", value: 320, fifa: 21, form: "3-4-3", group: "G" },
  { id: "IRN", name: "伊朗", nameEn: "Iran", code: "ir", conf: "AFC", coach: "盖勒努伊", value: 50, fifa: 25, form: "4-2-3-1", group: "G" },
  { id: "PER", name: "秘鲁", nameEn: "Peru", code: "pe", conf: "CONMEBOL", coach: "福萨蒂", value: 40, fifa: 38, form: "4-3-3", group: "G" },
  // Group H
  { id: "SRB", name: "塞尔维亚", nameEn: "Serbia", code: "rs", conf: "UEFA", coach: "斯托利洛维奇", value: 280, fifa: 33, form: "3-4-3", group: "H" },
  { id: "POL", name: "波兰", nameEn: "Poland", code: "pl", conf: "UEFA", coach: "普罗别日", value: 260, fifa: 28, form: "4-2-3-1", group: "H" },
  { id: "CHI", name: "智利", nameEn: "Chile", code: "cl", conf: "CONMEBOL", coach: "加雷卡", value: 120, fifa: 50, form: "4-3-3", group: "H" },
  { id: "GHA", name: "加纳", nameEn: "Ghana", code: "gh", conf: "CAF", coach: "阿多", value: 110, fifa: 42, form: "4-2-3-1", group: "H" },
  // Group I
  { id: "UKR", name: "乌克兰", nameEn: "Ukraine", code: "ua", conf: "UEFA", coach: "雷布罗夫", value: 220, fifa: 24, form: "4-3-3", group: "I" },
  { id: "SWE", name: "瑞典", nameEn: "Sweden", code: "se", conf: "UEFA", coach: "托姆安德森", value: 180, fifa: 26, form: "4-4-2", group: "I" },
  { id: "MAR", name: "摩洛哥", nameEn: "Morocco", code: "ma", conf: "CAF", coach: "雷格拉吉", value: 300, fifa: 13, form: "4-3-3", group: "I" },
  { id: "PRY", name: "巴拉圭", nameEn: "Paraguay", code: "py", conf: "CONMEBOL", coach: "阿尔法罗", value: 90, fifa: 52, form: "4-4-2", group: "I" },
  // Group J
  { id: "AUT", name: "奥地利", nameEn: "Austria", code: "at", conf: "UEFA", coach: "朗尼克", value: 280, fifa: 22, form: "4-2-3-1", group: "J" },
  { id: "TUR", name: "土耳其", nameEn: "Turkey", code: "tr", conf: "UEFA", coach: "蒙特拉", value: 320, fifa: 27, form: "4-3-3", group: "J" },
  { id: "NGA", name: "尼日利亚", nameEn: "Nigeria", code: "ng", conf: "CAF", coach: "埃瓜沃恩", value: 200, fifa: 36, form: "4-3-3", group: "J" },
  { id: "ECU", name: "厄瓜多尔", nameEn: "Ecuador", code: "ec", conf: "CONMEBOL", coach: "贝卡切切", value: 150, fifa: 32, form: "4-2-3-1", group: "J" },
  // Group K
  { id: "CZE", name: "捷克", nameEn: "Czech Republic", code: "cz", conf: "UEFA", coach: "希尔哈维", value: 200, fifa: 34, form: "4-2-3-1", group: "K" },
  { id: "SCO", name: "苏格兰", nameEn: "Scotland", code: "gb-sct", conf: "UEFA", coach: "克拉克", value: 130, fifa: 39, form: "4-3-3", group: "K" },
  { id: "RSA", name: "南非", nameEn: "South Africa", code: "za", conf: "CAF", coach: "布罗姆奎斯特", value: 35, fifa: 60, form: "4-4-2", group: "K" },
  { id: "KSA", name: "沙特", nameEn: "Saudi Arabia", code: "sa", conf: "AFC", coach: "雷纳尔", value: 45, fifa: 48, form: "4-2-3-1", group: "K" },
  // Group L
  { id: "WAL", name: "威尔士", nameEn: "Wales", code: "gb-wls", conf: "UEFA", coach: "佩奇", value: 140, fifa: 29, form: "3-4-3", group: "L" },
  { id: "HUN", name: "匈牙利", nameEn: "Hungary", code: "hu", conf: "UEFA", coach: "罗西", value: 120, fifa: 31, form: "3-5-2", group: "L" },
  { id: "CRC", name: "哥斯达黎加", nameEn: "Costa Rica", code: "cr", conf: "CONCACAF", coach: "古斯曼", value: 25, fifa: 46, form: "5-3-2", group: "L" },
  { id: "CHN", name: "中国", nameEn: "China", code: "cn", conf: "AFC", coach: "伊万科维奇", value: 15, fifa: 80, form: "4-4-2", group: "L" },
];

// 根据实力等级生成雷达数据
function generateRadar(team, index) {
  const fifa = team.fifa;
  const tier = fifa <= 5 ? "top" : fifa <= 15 ? "high" : fifa <= 30 ? "mid" : fifa <= 50 ? "low" : "bottom";
  const ranges = {
    top:   { min: 82, max: 96 },
    high:  { min: 75, max: 88 },
    mid:   { min: 65, max: 80 },
    low:   { min: 55, max: 72 },
    bottom:{ min: 45, max: 65 },
  };
  const r = ranges[tier];
  const rand = (min, max) => Math.round(min + Math.random() * (max - min));
  return {
    team_id: team.id,
    metrics: {
      attack: rand(r.min, r.max),
      defense: rand(r.min, r.max),
      control: rand(r.min, r.max),
      status: rand(r.min, r.max),
      experience: rand(r.min, r.max),
      place_kick: rand(r.min - 5, r.max - 5),
      superstar: rand(r.min - 5, r.max),
      penalty: rand(r.min, r.max),
    },
    update_time: "2026-06-04T12:00:00Z",
  };
}

// 生成
for (const team of TEAMS) {
  const teamDir = join(DB_DIR, team.nameEn);
  mkdirSync(teamDir, { recursive: true });

  const profile = {
    team_id: team.id,
    team_name: team.name,
    team_name_en: team.nameEn,
    confederation: team.conf,
    head_coach: team.coach,
    total_value_m_euros: team.value,
    fifa_ranking: team.fifa,
    base_formation: team.form,
    country_code: team.code,
    group: team.group,
  };

  const radar = generateRadar(team, TEAMS.indexOf(team));

  writeFileSync(join(teamDir, "profile.json"), JSON.stringify(profile, null, 2));
  writeFileSync(join(teamDir, "radar_data.json"), JSON.stringify(radar, null, 2));
}

// 生成 odds.json
const odds = TEAMS.map((t) => {
  const base = t.fifa <= 5 ? 3 + Math.random() * 4 : t.fifa <= 15 ? 6 + Math.random() * 10 : 10 + Math.random() * 30;
  return {
    team_id: t.id,
    team_name: t.name,
    team_name_en: t.nameEn,
    country_code: t.code,
    odds: Math.round(base * 10) / 10,
  };
}).sort((a, b) => a.odds - b.odds);

writeFileSync(join(DB_DIR, "odds.json"), JSON.stringify(odds, null, 2));
console.log(`Generated data for ${TEAMS.length} teams across 12 groups.`);
```

- [ ] **Step 2: 运行生成脚本**

Run:
```bash
cd K:\AI_Coding\My_World_Cup\my-world-cup
node scripts/generate-mock-data.mjs
```

Expected: 输出 "Generated data for 48 teams across 12 groups."，`database/2_ability_models/` 下生成 48 个球队目录和 `odds.json`

- [ ] **Step 3: 验证数据文件**

Run:
```bash
ls database/2_ability_models/Argentina/
cat database/2_ability_models/Argentina/profile.json
cat database/2_ability_models/Argentina/radar_data.json
cat database/2_ability_models/odds.json | head -20
```

Expected: 每个球队目录包含 `profile.json` 和 `radar_data.json`，`odds.json` 包含 48 条赔率数据

- [ ] **Step 4: Commit**

```bash
git add scripts/ database/
git commit -m "feat: add mock data generator and 48 teams' JSON data"
```

---

### Task 4: 综合评分计算工具函数 + 测试

**Files:**
- Create: `src/lib/score.ts`
- Create: `src/lib/__tests__/score.test.ts`

- [ ] **Step 1: 编写 score 计算函数**

```typescript
// src/lib/score.ts

import type { RadarData, RadarMetrics } from "@/types/team";

/**
 * 计算八维雷达指标的算术平均值作为综合评分
 */
export function calculateOverallScore(metrics: RadarMetrics): number {
  const values = Object.values(metrics);
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / values.length) * 10) / 10;
}
```

- [ ] **Step 2: 安装测试依赖**

Run:
```bash
cd K:\AI_Coding\My_World_Cup\my-world-cup
npm install -D vitest @testing-library/react @vitejs/plugin-react
```

- [ ] **Step 3: 创建 vitest 配置**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

在 `package.json` 的 `scripts` 中添加:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: 编写测试**

```typescript
// src/lib/__tests__/score.test.ts

import { describe, it, expect } from "vitest";
import { calculateOverallScore } from "../score";

describe("calculateOverallScore", () => {
  it("should calculate the arithmetic mean of 8 metrics", () => {
    const metrics = {
      attack: 80,
      defense: 80,
      control: 80,
      status: 80,
      experience: 80,
      place_kick: 80,
      superstar: 80,
      penalty: 80,
    };
    expect(calculateOverallScore(metrics)).toBe(80.0);
  });

  it("should round to one decimal place", () => {
    const metrics = {
      attack: 92,
      defense: 85,
      control: 88,
      status: 90,
      experience: 95,
      place_kick: 70,
      superstar: 80,
      penalty: 89,
    };
    // (92+85+88+90+95+70+80+89)/8 = 689/8 = 86.125 → 86.1
    expect(calculateOverallScore(metrics)).toBe(86.1);
  });

  it("should handle all max scores", () => {
    const metrics = {
      attack: 100,
      defense: 100,
      control: 100,
      status: 100,
      experience: 100,
      place_kick: 100,
      superstar: 100,
      penalty: 100,
    };
    expect(calculateOverallScore(metrics)).toBe(100.0);
  });
});
```

- [ ] **Step 5: 运行测试验证通过**

Run:
```bash
cd K:\AI_Coding\My_World_Cup\my-world-cup
npm test
```

Expected: 3 个测试全部 PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/score.ts src/lib/__tests__/ vitest.config.ts package.json package-lock.json
git commit -m "feat: add overall score calculation with tests"
```

---

### Task 5: 数据加载工具函数

**Files:**
- Create: `src/lib/data.ts`

- [ ] **Step 1: 编写数据加载函数**

```typescript
// src/lib/data.ts

import fs from "fs";
import path from "path";
import type { TeamProfile, RadarData, TeamOverall, OddsEntry, GroupData } from "@/types/team";
import { GROUP_COLORS } from "@/types/team";
import { calculateOverallScore } from "./score";

const DB_DIR = path.join(process.cwd(), "database", "2_ability_models");

/**
 * 读取所有球队的 profile.json
 */
export function getAllTeamProfiles(): TeamProfile[] {
  const entries = fs.readdirSync(DB_DIR, { withFileTypes: true });
  const teams: TeamProfile[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const profilePath = path.join(DB_DIR, entry.name, "profile.json");
    if (fs.existsSync(profilePath)) {
      const raw = fs.readFileSync(profilePath, "utf-8");
      teams.push(JSON.parse(raw));
    }
  }

  return teams;
}

/**
 * 读取指定球队的 radar_data.json
 */
export function getRadarData(teamNameEn: string): RadarData | null {
  const filePath = path.join(DB_DIR, teamNameEn, "radar_data.json");
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

/**
 * 获取所有球队的综合数据 (profile + overall_score)
 */
export function getAllTeamsWithOverall(): TeamOverall[] {
  const profiles = getAllTeamProfiles();
  return profiles.map((profile) => {
    const radar = getRadarData(profile.team_name_en);
    const overall_score = radar ? calculateOverallScore(radar.metrics) : 0;
    return { ...profile, overall_score };
  });
}

/**
 * 按分组组织球队数据
 */
export function getGroupsData(): GroupData[] {
  const teams = getAllTeamsWithOverall();
  const groupOrder = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  const groups: GroupData[] = [];

  for (const g of groupOrder) {
    const groupTeams = teams
      .filter((t) => t.group === g)
      .sort((a, b) => b.overall_score - a.overall_score);
    groups.push({
      group_name: g,
      color: GROUP_COLORS[g],
      teams: groupTeams,
    });
  }

  return groups;
}

/**
 * 读取夺冠赔率数据
 */
export function getOddsData(): OddsEntry[] {
  const filePath = path.join(DB_DIR, "odds.json");
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

/**
 * 格式化身价值
 */
export function formatValue(valueM: number): string {
  if (valueM >= 1000) {
    return `€${(valueM / 1000).toFixed(1)}B`;
  }
  return `€${valueM}M`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/data.ts
git commit -m "feat: add data loading utilities for team profiles and groups"
```

---

### Task 6: TopNav 组件 + 根布局

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/components/TopNav.tsx`

- [ ] **Step 1: 创建 TopNav 组件**

```tsx
// src/components/TopNav.tsx

import Link from "next/link";

const NAV_ITEMS = [
  { label: "赛事概览", href: "/" },
  { label: "球队画像", href: "/team" },
  { label: "对阵模拟", href: "/h2h" },
];

export function TopNav({ currentPath = "/" }: { currentPath?: string }) {
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

- [ ] **Step 2: 更新根布局**

```tsx
// src/app/layout.tsx

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
        <TopNav currentPath="/" />
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/TopNav.tsx src/app/layout.tsx
git commit -m "feat: add TopNav component and root layout"
```

---

### Task 7: TeamRow 组件

**Files:**
- Create: `src/components/TeamRow.tsx`

- [ ] **Step 1: 创建 TeamRow 组件**

```tsx
// src/components/TeamRow.tsx

import Link from "next/link";
import type { TeamOverall } from "@/types/team";

export function TeamRow({ team }: { team: TeamOverall }) {
  const flagUrl = `https://flagcdn.com/w20/${team.country_code}.png`;

  return (
    <Link
      href={`/team/${team.team_id}`}
      className="flex items-center justify-between py-1 px-0.5 rounded hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={flagUrl}
          alt={team.team_name}
          width={18}
          height={13}
          className="rounded-[1px] object-cover"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = "none";
            const fallback = document.createElement("span");
            fallback.textContent = team.team_id;
            fallback.className = "text-[9px] text-gray-400 font-mono w-[18px] text-center";
            target.parentNode?.insertBefore(fallback, target);
          }}
        />
        <span className="font-medium text-[11px]">{team.team_name}</span>
      </div>
      <span className="text-[#3b82f6] font-bold text-[10px]">
        {team.overall_score}
      </span>
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TeamRow.tsx
git commit -m "feat: add TeamRow component with flag image and score"
```

---

### Task 8: GroupCard 组件

**Files:**
- Create: `src/components/GroupCard.tsx`

- [ ] **Step 1: 创建 GroupCard 组件**

```tsx
// src/components/GroupCard.tsx

import type { GroupData } from "@/types/team";
import { TeamRow } from "./TeamRow";

export function GroupCard({ group }: { group: GroupData }) {
  return (
    <div className="bg-white rounded-lg p-2.5 border border-[#eef0f3] hover:-translate-y-0.5 hover:shadow-md transition-all cursor-default">
      <div
        className="text-[10px] font-bold uppercase tracking-wider mb-1.5"
        style={{ color: group.color }}
      >
        {group.group_name}组
      </div>
      <div className="flex flex-col gap-0.5">
        {group.teams.map((team) => (
          <TeamRow key={team.team_id} team={team} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/GroupCard.tsx
git commit -m "feat: add GroupCard component for group display"
```

---

### Task 9: RankingChart 组件

**Files:**
- Create: `src/components/RankingChart.tsx`

- [ ] **Step 1: 创建 RankingChart 组件**

```tsx
// src/components/RankingChart.tsx

import { BAR_GRADIENTS } from "@/types/team";
import { formatValue } from "@/lib/data";

interface RankingItem {
  team_name: string;
  country_code: string;
  value: number;
  displayValue: string;
}

interface RankingChartProps {
  title: string;
  icon: string;
  items: RankingItem[];
  /** 值越大条越长（true）还是越小条越长（false，如赔率） */
  higherIsBetter?: boolean;
  /** 是否使用统一蓝色渐变 */
  uniformColor?: boolean;
}

export function RankingChart({
  title,
  icon,
  items,
  higherIsBetter = true,
  uniformColor = false,
}: RankingChartProps) {
  const maxVal = Math.max(...items.map((i) => i.value));
  const minVal = Math.min(...items.map((i) => i.value));
  const range = maxVal - minVal || 1;

  return (
    <div className="bg-white rounded-lg p-3 border border-[#eef0f3]">
      <div className="text-xs font-bold mb-2.5 flex items-center gap-1">
        {icon} {title}
      </div>
      <div className="flex flex-col gap-1.5">
        {items.map((item, idx) => {
          const normalized = higherIsBetter
            ? ((item.value - minVal) / range) * 60 + 35 // 35%-95%
            : (1 - (item.value - minVal) / range) * 60 + 35;
          const gradient = uniformColor
            ? "linear-gradient(90deg, #3b82f6, #60a5fa)"
            : BAR_GRADIENTS[idx % BAR_GRADIENTS.length];

          return (
            <div key={item.team_name} className="flex items-center gap-1 text-[10px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://flagcdn.com/w16/${item.country_code}.png`}
                alt={item.team_name}
                width={14}
                height={10}
                className="rounded-[1px] object-cover"
              />
              <span className="w-8 font-medium truncate">{item.team_name}</span>
              <div className="flex-1 bg-[#eef0f3] rounded-[3px] h-3.5 overflow-hidden">
                <div
                  className="h-full rounded-[3px]"
                  style={{
                    width: `${normalized}%`,
                    background: gradient,
                  }}
                />
              </div>
              <span className="w-6 text-right font-bold">{item.displayValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 构建夺冠赔率排行数据
 */
export function buildOddsRanking(
  oddsData: { team_name: string; country_code: string; odds: number }[]
): RankingItem[] {
  return oddsData.slice(0, 10).map((o) => ({
    team_name: o.team_name,
    country_code: o.country_code,
    value: o.odds,
    displayValue: String(o.odds),
  }));
}

/**
 * 构建总身价排行数据
 */
export function buildValueRanking(
  teams: { team_name: string; country_code: string; total_value_m_euros: number }[]
): RankingItem[] {
  return [...teams]
    .sort((a, b) => b.total_value_m_euros - a.total_value_m_euros)
    .slice(0, 10)
    .map((t) => ({
      team_name: t.team_name,
      country_code: t.country_code,
      value: t.total_value_m_euros,
      displayValue: formatValue(t.total_value_m_euros),
    }));
}

/**
 * 构建综合能力排行数据
 */
export function buildOverallRanking(
  teams: { team_name: string; country_code: string; overall_score: number }[]
): RankingItem[] {
  return [...teams]
    .sort((a, b) => b.overall_score - a.overall_score)
    .slice(0, 10)
    .map((t) => ({
      team_name: t.team_name,
      country_code: t.country_code,
      value: t.overall_score,
      displayValue: String(t.overall_score),
    }));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/RankingChart.tsx
git commit -m "feat: add RankingChart component with horizontal bar charts"
```

---

### Task 10: OverviewFooter 组件

**Files:**
- Create: `src/components/OverviewFooter.tsx`

- [ ] **Step 1: 创建页脚组件**

```tsx
// src/components/OverviewFooter.tsx

export function OverviewFooter() {
  return (
    <footer className="bg-[#f7f8fa] px-5 py-2.5 border-t border-[#e2e8f0] flex justify-between text-[10px] text-[#aaa]">
      <span>数据更新时间：2026-06-04 12:00 UTC</span>
      <span>数据源：API-Football · Bet365 · 综合模型</span>
    </footer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/OverviewFooter.tsx
git commit -m "feat: add OverviewFooter component"
```

---

### Task 11: 概览页组装

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: 清理 globals.css 为最小必要样式**

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
}
```

- [ ] **Step 2: 组装概览页**

```tsx
// src/app/page.tsx

import { getGroupsData, getAllTeamsWithOverall, getOddsData } from "@/lib/data";
import { GroupCard } from "@/components/GroupCard";
import {
  RankingChart,
  buildOddsRanking,
  buildValueRanking,
  buildOverallRanking,
} from "@/components/RankingChart";
import { OverviewFooter } from "@/components/OverviewFooter";

export default function OverviewPage() {
  const groups = getGroupsData();
  const teams = getAllTeamsWithOverall();
  const oddsData = getOddsData();

  const oddsRanking = buildOddsRanking(oddsData);
  const valueRanking = buildValueRanking(teams);
  const overallRanking = buildOverallRanking(teams);

  return (
    <div className="bg-[#f7f8fa] min-h-screen flex flex-col">
      {/* Section: 分组概览 */}
      <div className="px-5 pt-4 pb-0">
        <h1 className="text-lg font-bold text-[#1a1a2e]">48强分组概览</h1>
        <p className="text-[11px] text-gray-400 mt-0.5">
          2026 美加墨世界杯 · 12组 · 48支球队
        </p>
      </div>

      {/* Group Cards Grid */}
      <div className="px-5 py-3">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {groups.map((group) => (
            <GroupCard key={group.group_name} group={group} />
          ))}
        </div>
      </div>

      {/* Section: 数据排行 */}
      <div className="px-5 mt-2">
        <h2 className="text-[15px] font-bold text-[#1a1a2e]">数据排行</h2>
      </div>

      <div className="px-5 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          <RankingChart
            title="夺冠赔率排行"
            icon="🏆"
            items={oddsRanking}
            higherIsBetter={false}
          />
          <RankingChart
            title="总身价排行"
            icon="💰"
            items={valueRanking}
            higherIsBetter={true}
          />
          <RankingChart
            title="综合能力排行"
            icon="📊"
            items={overallRanking}
            higherIsBetter={true}
            uniformColor={true}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto">
        <OverviewFooter />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 启动开发服务器验证编译通过**

Run:
```bash
cd K:\AI_Coding\My_World_Cup\my-world-cup
npm run dev
```

Expected: 编译无错误，浏览器打开 `http://localhost:3000` 显示概览页

- [ ] **Step 4: 运行测试确保无回归**

Run:
```bash
cd K:\AI_Coding\My_World_Cup\my-world-cup
npm test
```

Expected: 所有测试 PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/globals.css
git commit -m "feat: assemble overview page with group cards and ranking charts"
```

---

### Task 12: 视觉验证 + 微调

**Files:**
- Possibly modify: CSS classes for spacing/alignment fixes

- [ ] **Step 1: 浏览器打开页面，逐项检查**

打开 `http://localhost:3000`，检查以下要点：
- [ ] 顶部导航栏显示正确，"赛事概览"高亮
- [ ] 12 个分组卡片正确显示，4×3 网格
- [ ] 每张卡片内 4 支球队按评分降序排列
- [ ] 国旗图片正确加载（阿根廷蓝白旗、法国三色旗等）
- [ ] 综合评分蓝色粗体，右对齐
- [ ] 三个排行图并排显示
- [ ] 夺冠赔率条长度与赔率成反比
- [ ] 总身价格式正确（€1.4B / €850M）
- [ ] 综合能力排行使用统一蓝色
- [ ] 页脚显示数据更新时间和数据源

- [ ] **Step 2: 检查响应式**

调整浏览器窗口大小：
- [ ] ≥1280px：分组4列，图表3列
- [ ] 768–1279px：分组3列，图表2列
- [ ] <768px：分组2列，图表1列

- [ ] **Step 3: 检查交互**

- [ ] 点击任意球队名跳转到 `/team/[team_id]`（目前是 404，正常）
- [ ] 分组卡片 hover 上浮效果

- [ ] **Step 4: 最终 Commit**

```bash
git add -A
git commit -m "feat: complete overview page with visual polish"
```

---

## Self-Review Checklist

- [x] **Spec coverage**: 每个设计规格章节都有对应 Task (2.1→Task6, 2.2→Task7+8, 2.3→Task9, 2.4→Task10, 组件拆分→Task6-10, 数据需求→Task3+5, 综合评分→Task4, 响应式→Task11 CSS classes)
- [x] **Placeholder scan**: 无 TBD/TODO/placeholder
- [x] **Type consistency**: `TeamOverall.overall_score` 在 Task2 定义，Task4 计算函数返回 `number`，Task5 的 `getAllTeamsWithOverall` 返回 `TeamOverall[]`，Task7/8/9 使用一致的类型
- [x] **File paths**: 所有文件路径一致，无冲突
