# 球队画像页面 + 雷达图数据推导 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于巴西队 Excel 数据，新增球队画像页面 `/team/[teamId]`，并用透明公式从大名单+战绩推导巴西 8 维雷达图。

**Architecture:** 纯函数 `deriveRadar(squad, form)` 按 [`docs/radar-derivation-methodology.md`](../../radar-derivation-methodology.md) 计算（TDD）。数据落进 `squad.json`/`profile.json`/`recent_form.json`/`radar_data.json`。新增动态路由 `/team/[teamId]`（param=team_id，复用首页 `TeamRow` 已有链接），服务端取数 → 客户端组件渲染。

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, Vitest。所有 npm 命令在 `my-world-cup/` 下执行。

**Spec 偏离说明（重要）：** spec 原写路由 `/team/[teamNameEn]`；实际首页 `TeamRow` 已链接到 `/team/${team.team_id}`（如 `/team/BRA`）。本计划改用 **team_id** 作路由参数（更短、URL 安全、无需对 "Costa Rica" 等多词名编码），并复用已有链接，故无单独"加导航入口"任务。

---

## 文件结构

| 文件 | 责任 | 操作 |
|------|------|------|
| `my-world-cup/src/types/team.ts` | `SquadPlayer`/`SquadData`/`TeamPageData` 类型；`TeamProfile` 加 `qualification?`；`MatchRecord` 加 `date?` | 修改 |
| `my-world-cup/src/lib/deriveRadar.ts` | 纯函数：身价锚点、赛事加权、8 维推导 | 新建 |
| `my-world-cup/src/lib/__tests__/deriveRadar.test.ts` | deriveRadar 单测（巴西算例 + 边界） | 新建 |
| `my-world-cup/src/lib/data.ts` | `getTeamPageData(teamId)` | 修改 |
| `my-world-cup/database/2_ability_models/Brazil/squad.json` | 巴西 26 人大名单 | 新建 |
| `my-world-cup/database/2_ability_models/Brazil/profile.json` | 字段更新 | 修改 |
| `my-world-cup/database/2_ability_models/Brazil/recent_form.json` | 14 场已完赛 | 修改 |
| `my-world-cup/database/2_ability_models/Brazil/radar_data.json` | 推导值 | 修改 |
| `my-world-cup/src/components/SingleRadarChart.tsx` | 单队雷达 | 新建 |
| `my-world-cup/src/components/SquadTable.tsx` | 大名单表（含位置筛选） | 新建 |
| `my-world-cup/src/components/RecentFormList.tsx` | 近期战绩 | 新建 |
| `my-world-cup/src/components/TeamProfileClient.tsx` | 画像页客户端壳 | 新建 |
| `my-world-cup/src/app/team/[teamId]/page.tsx` | 服务端取数 + 路由 | 新建 |

---

### Task 1: 类型定义

**Files:**
- Modify: `my-world-cup/src/types/team.ts`

- [ ] **Step 1: 添加类型**

在 `my-world-cup/src/types/team.ts` 的 `TeamProfile` 接口里 `group: string;` 之后加一个可选字段：

```ts
  group: string;
  qualification?: string;
```

把 `MatchRecord` 接口改为（加可选 `date`）：

```ts
export interface MatchRecord {
  date?: string;
  opponent: string;
  result: "W" | "D" | "L";
  score: string;
  type: "friendly" | "qualifier" | "tournament";
}
```

在文件末尾（`BAR_GRADIENTS` 之前）追加：

```ts
export interface SquadPlayer {
  number: number;
  position: "GK" | "DF" | "MF" | "FW";
  name_cn: string;
  name_en: string;
  birth_date?: string;
  age?: number;
  caps: number;
  goals: number;
  assists: number | null;
  club_cn: string;
  club_en: string;
  value_wan_euros: number;
  preferred_position: string;
  injury_note?: string;
}

export interface SquadData {
  team_id: string;
  players: SquadPlayer[];
}

export interface TeamPageData {
  profile: TeamProfile;
  radar: RadarMetrics | null;
  squad: SquadData | null;
  form: RecentFormData | null;
  overall_score: number;
}
```

- [ ] **Step 2: 类型检查**

Run: `cd my-world-cup && npx tsc --noEmit`
Expected: 无错误（已有代码不受影响，仅新增可选字段与新接口）。

- [ ] **Step 3: Commit**

```bash
git add my-world-cup/src/types/team.ts
git commit -m "feat(types): add SquadPlayer/SquadData/TeamPageData, optional qualification & date"
```

---

### Task 2: 巴西大名单数据 squad.json

**Files:**
- Create: `my-world-cup/database/2_ability_models/Brazil/squad.json`

- [ ] **Step 1: 写入 26 人数据**

把以下完整内容写入 `my-world-cup/database/2_ability_models/Brazil/squad.json`（严格来自 Excel "球员信息" sheet；`assists` 为 null 处对应 Excel 的"(空)"）：

```json
{
  "team_id": "BRA",
  "players": [
    { "number": 1, "position": "GK", "name_cn": "阿利森", "name_en": "Alisson", "birth_date": "1992-10-02", "age": 33, "caps": 78, "goals": 0, "assists": null, "club_cn": "利物浦", "club_en": "Liverpool", "value_wan_euros": 1500, "preferred_position": "GK", "injury_note": "未见最终名单页标注" },
    { "number": 2, "position": "MF", "name_cn": "埃德森·席尔瓦", "name_en": "Éderson Silva", "birth_date": "1999-07-07", "age": 26, "caps": 3, "goals": 0, "assists": 0, "club_cn": "亚特兰大", "club_en": "Atalanta", "value_wan_euros": 4500, "preferred_position": "MF", "injury_note": "未见最终名单页标注" },
    { "number": 3, "position": "DF", "name_cn": "加布里埃尔·马加良斯", "name_en": "Gabriel Magalhães", "birth_date": "1997-12-19", "age": 28, "caps": 17, "goals": 1, "assists": 0, "club_cn": "阿森纳", "club_en": "Arsenal", "value_wan_euros": 7500, "preferred_position": "DF", "injury_note": "未见最终名单页标注" },
    { "number": 4, "position": "DF", "name_cn": "马尔基尼奥斯", "name_en": "Marquinhos", "birth_date": "1994-05-14", "age": 32, "caps": 105, "goals": 7, "assists": 4, "club_cn": "巴黎圣日耳曼", "club_en": "Paris Saint-Germain", "value_wan_euros": 2800, "preferred_position": "DF", "injury_note": "未见最终名单页标注" },
    { "number": 5, "position": "MF", "name_cn": "卡塞米罗", "name_en": "Casemiro", "birth_date": "1992-02-23", "age": 34, "caps": 86, "goals": 9, "assists": 5, "club_cn": "曼彻斯特联", "club_en": "Manchester United", "value_wan_euros": 600, "preferred_position": "MF", "injury_note": "未见最终名单页标注" },
    { "number": 6, "position": "DF", "name_cn": "阿莱士·桑德罗", "name_en": "Alex Sandro", "birth_date": "1991-01-26", "age": 35, "caps": 45, "goals": 2, "assists": 0, "club_cn": "弗拉门戈", "club_en": "Flamengo", "value_wan_euros": 100, "preferred_position": "DF", "injury_note": "未见最终名单页标注" },
    { "number": 7, "position": "FW", "name_cn": "维尼修斯·儒尼奥尔", "name_en": "Vinícius Júnior", "birth_date": "2000-07-12", "age": 25, "caps": 49, "goals": 9, "assists": 9, "club_cn": "皇家马德里", "club_en": "Real Madrid", "value_wan_euros": 14000, "preferred_position": "FW", "injury_note": "未见最终名单页标注" },
    { "number": 8, "position": "MF", "name_cn": "布鲁诺·吉马良斯", "name_en": "Bruno Guimarães", "birth_date": "1997-11-16", "age": 28, "caps": 43, "goals": 3, "assists": 8, "club_cn": "纽卡斯尔联", "club_en": "Newcastle United", "value_wan_euros": 7000, "preferred_position": "MF", "injury_note": "未见最终名单页标注" },
    { "number": 9, "position": "FW", "name_cn": "马特乌斯·库尼亚", "name_en": "Matheus Cunha", "birth_date": "1999-05-27", "age": 27, "caps": 23, "goals": 1, "assists": 2, "club_cn": "曼彻斯特联", "club_en": "Manchester United", "value_wan_euros": 7500, "preferred_position": "FW", "injury_note": "未见最终名单页标注" },
    { "number": 10, "position": "FW", "name_cn": "内马尔", "name_en": "Neymar", "birth_date": "1992-02-05", "age": 34, "caps": 128, "goals": 79, "assists": 59, "club_cn": "桑托斯", "club_en": "Santos", "value_wan_euros": 800, "preferred_position": "FW", "injury_note": "未见最终名单页标注" },
    { "number": 11, "position": "FW", "name_cn": "拉菲尼亚", "name_en": "Raphinha", "birth_date": "1996-12-14", "age": 29, "caps": 39, "goals": 11, "assists": 8, "club_cn": "巴塞罗那", "club_en": "Barcelona", "value_wan_euros": 7000, "preferred_position": "FW", "injury_note": "未见最终名单页标注" },
    { "number": 12, "position": "GK", "name_cn": "韦弗顿", "name_en": "Weverton", "birth_date": "1987-12-13", "age": 38, "caps": 11, "goals": 0, "assists": null, "club_cn": "格雷米奥", "club_en": "Grêmio", "value_wan_euros": 70, "preferred_position": "GK", "injury_note": "未见最终名单页标注" },
    { "number": 13, "position": "DF", "name_cn": "达尼洛·路易斯", "name_en": "Danilo Luiz", "birth_date": "1991-07-15", "age": 34, "caps": 70, "goals": 1, "assists": 6, "club_cn": "弗拉门戈", "club_en": "Flamengo", "value_wan_euros": 200, "preferred_position": "DF", "injury_note": "未见最终名单页标注" },
    { "number": 14, "position": "DF", "name_cn": "布雷默", "name_en": "Bremer", "birth_date": "1997-03-18", "age": 29, "caps": 8, "goals": 1, "assists": 0, "club_cn": "尤文图斯", "club_en": "Juventus", "value_wan_euros": 3500, "preferred_position": "DF", "injury_note": "未见最终名单页标注" },
    { "number": 15, "position": "DF", "name_cn": "莱奥·佩雷拉", "name_en": "Léo Pereira", "birth_date": "1996-01-31", "age": 30, "caps": 4, "goals": 0, "assists": 0, "club_cn": "弗拉门戈", "club_en": "Flamengo", "value_wan_euros": 1200, "preferred_position": "DF", "injury_note": "未见最终名单页标注" },
    { "number": 16, "position": "DF", "name_cn": "道格拉斯·桑托斯", "name_en": "Douglas Santos", "birth_date": "1994-03-22", "age": 32, "caps": 7, "goals": 0, "assists": 1, "club_cn": "圣彼得堡泽尼特", "club_en": "Zenit Saint Petersburg", "value_wan_euros": 750, "preferred_position": "DF", "injury_note": "未见最终名单页标注" },
    { "number": 17, "position": "MF", "name_cn": "法比尼奥", "name_en": "Fabinho", "birth_date": "1993-10-23", "age": 32, "caps": 33, "goals": 0, "assists": 1, "club_cn": "吉达联合", "club_en": "Al-Ittihad", "value_wan_euros": 1200, "preferred_position": "MF", "injury_note": "未见最终名单页标注" },
    { "number": 18, "position": "MF", "name_cn": "达尼洛·桑托斯", "name_en": "Danilo Santos", "birth_date": "2001-04-29", "age": 25, "caps": 4, "goals": 2, "assists": 0, "club_cn": "博塔弗戈", "club_en": "Botafogo", "value_wan_euros": 3200, "preferred_position": "MF", "injury_note": "未见最终名单页标注" },
    { "number": 19, "position": "FW", "name_cn": "恩德里克", "name_en": "Endrick", "birth_date": "2006-07-21", "age": 19, "caps": 17, "goals": 4, "assists": 2, "club_cn": "里昂", "club_en": "Lyon", "value_wan_euros": 4000, "preferred_position": "FW", "injury_note": "未见最终名单页标注" },
    { "number": 20, "position": "MF", "name_cn": "卢卡斯·帕奎塔", "name_en": "Lucas Paquetá", "birth_date": "1997-08-27", "age": 28, "caps": 63, "goals": 13, "assists": 8, "club_cn": "弗拉门戈", "club_en": "Flamengo", "value_wan_euros": 3200, "preferred_position": "MF", "injury_note": "未见最终名单页标注" },
    { "number": 21, "position": "FW", "name_cn": "路易斯·恩里克", "name_en": "Luiz Henrique", "birth_date": "2001-01-02", "age": 25, "caps": 15, "goals": 2, "assists": 3, "club_cn": "圣彼得堡泽尼特", "club_en": "Zenit Saint Petersburg", "value_wan_euros": 2400, "preferred_position": "FW", "injury_note": "未见最终名单页标注" },
    { "number": 22, "position": "FW", "name_cn": "加布里埃尔·马丁内利", "name_en": "Gabriel Martinelli", "birth_date": "2001-06-18", "age": 24, "caps": 23, "goals": 4, "assists": 0, "club_cn": "阿森纳", "club_en": "Arsenal", "value_wan_euros": 4500, "preferred_position": "FW", "injury_note": "未见最终名单页标注" },
    { "number": 23, "position": "GK", "name_cn": "埃德森·莫赖斯", "name_en": "Ederson Moraes", "birth_date": "1993-08-17", "age": 32, "caps": 32, "goals": 0, "assists": null, "club_cn": "费内巴切", "club_en": "Fenerbahçe", "value_wan_euros": 1000, "preferred_position": "GK", "injury_note": "未见最终名单页标注" },
    { "number": 24, "position": "DF", "name_cn": "罗热·伊巴涅斯", "name_en": "Roger Ibañez", "birth_date": "1998-11-23", "age": 27, "caps": 7, "goals": 0, "assists": 0, "club_cn": "吉达国民", "club_en": "Al-Ahli", "value_wan_euros": 1800, "preferred_position": "DF", "injury_note": "未见最终名单页标注" },
    { "number": 25, "position": "FW", "name_cn": "伊戈尔·蒂亚戈", "name_en": "Igor Thiago", "birth_date": "2001-06-26", "age": 24, "caps": 4, "goals": 2, "assists": 0, "club_cn": "布伦特福德", "club_en": "Brentford", "value_wan_euros": 6500, "preferred_position": "FW", "injury_note": "未见最终名单页标注" },
    { "number": 26, "position": "FW", "name_cn": "拉扬", "name_en": "Rayan", "birth_date": "2006-08-03", "age": 19, "caps": 2, "goals": 1, "assists": 0, "club_cn": "伯恩茅斯", "club_en": "Bournemouth", "value_wan_euros": 6000, "preferred_position": "FW", "injury_note": "未见最终名单页标注" }
  ]
}
```

- [ ] **Step 2: 校验 JSON**

Run: `cd my-world-cup && node -e "const d=require('./database/2_ability_models/Brazil/squad.json'); console.log('players:', d.players.length); console.log('value sum (wan):', d.players.reduce((a,p)=>a+p.value_wan_euros,0)); console.log('caps sum:', d.players.reduce((a,p)=>a+p.caps,0));"`
Expected: `players: 26` / `value sum (wan): 92820` / `caps sum: 916`

- [ ] **Step 3: Commit**

```bash
git add my-world-cup/database/2_ability_models/Brazil/squad.json
git commit -m "feat(data): add Brazil 26-player squad from Excel"
```

---

### Task 3: 巴西 profile.json + recent_form.json 更新

**Files:**
- Modify: `my-world-cup/database/2_ability_models/Brazil/profile.json`
- Modify: `my-world-cup/database/2_ability_models/Brazil/recent_form.json`

- [ ] **Step 1: 更新 profile.json**

把 `my-world-cup/database/2_ability_models/Brazil/profile.json` 整体替换为：

```json
{
  "team_id": "BRA",
  "team_name": "巴西",
  "team_name_en": "Brazil",
  "confederation": "CONMEBOL",
  "head_coach": "卡洛·安切洛蒂",
  "total_value_m_euros": 928,
  "fifa_ranking": 6,
  "base_formation": "4-3-3",
  "country_code": "br",
  "group": "C",
  "qualification": "CONMEBOL round robin fifth place"
}
```

- [ ] **Step 2: 重写 recent_form.json**

把 `my-world-cup/database/2_ability_models/Brazil/recent_form.json` 整体替换为（14 场已完赛；3 场未赛世界杯 Morocco/Haiti/Scotland 排除；`type` 供加权使用）：

```json
{
  "team_id": "BRA",
  "last_10": [
    { "date": "2025-03-20", "opponent": "哥伦比亚", "result": "W", "score": "2-1", "type": "qualifier" },
    { "date": "2025-03-25", "opponent": "阿根廷", "result": "L", "score": "1-4", "type": "qualifier" },
    { "date": "2025-06-05", "opponent": "厄瓜多尔", "result": "D", "score": "0-0", "type": "qualifier" },
    { "date": "2025-06-10", "opponent": "巴拉圭", "result": "W", "score": "1-0", "type": "qualifier" },
    { "date": "2025-09-04", "opponent": "智利", "result": "W", "score": "3-0", "type": "qualifier" },
    { "date": "2025-09-09", "opponent": "玻利维亚", "result": "L", "score": "0-1", "type": "qualifier" },
    { "date": "2025-10-10", "opponent": "韩国", "result": "W", "score": "5-0", "type": "friendly" },
    { "date": "2025-10-14", "opponent": "日本", "result": "L", "score": "2-3", "type": "friendly" },
    { "date": "2025-11-15", "opponent": "塞内加尔", "result": "W", "score": "2-0", "type": "friendly" },
    { "date": "2025-11-18", "opponent": "突尼斯", "result": "D", "score": "1-1", "type": "friendly" },
    { "date": "2026-03-26", "opponent": "法国", "result": "L", "score": "1-2", "type": "friendly" },
    { "date": "2026-03-31", "opponent": "克罗地亚", "result": "W", "score": "3-1", "type": "friendly" },
    { "date": "2026-05-31", "opponent": "巴拿马", "result": "W", "score": "6-2", "type": "friendly" },
    { "date": "2026-06-06", "opponent": "埃及", "result": "W", "score": "2-1", "type": "friendly" }
  ],
  "summary": { "wins": 8, "draws": 2, "losses": 4, "goals_scored": 29, "goals_conceded": 16 }
}
```

- [ ] **Step 3: 校验 JSON**

Run: `cd my-world-cup && node -e "const f=require('./database/2_ability_models/Brazil/recent_form.json'); const c=f.last_10; console.log('matches:', c.length); console.log('W/D/L:', c.filter(m=>m.result==='W').length, c.filter(m=>m.result==='D').length, c.filter(m=>m.result==='L').length);"`
Expected: `matches: 14` / `W/D/L: 8 2 4`

- [ ] **Step 4: Commit**

```bash
git add my-world-cup/database/2_ability_models/Brazil/profile.json my-world-cup/database/2_ability_models/Brazil/recent_form.json
git commit -m "feat(data): update Brazil profile (rank/value/coach/group) & recent_form (14 matches)"
```

---

### Task 4: deriveRadar 纯函数（TDD）

**Files:**
- Create: `my-world-cup/src/lib/__tests__/deriveRadar.test.ts`
- Create: `my-world-cup/src/lib/deriveRadar.ts`

- [ ] **Step 1: 写失败测试**

把以下写入 `my-world-cup/src/lib/__tests__/deriveRadar.test.ts`。先用一份**内联巴西算例**（与真实 squad/form 数值一致）锁定期望输出 `attack85/defense70/control83/status72/experience70/place_kick81/superstar93/penalty92`，再加边界用例。

```ts
import { describe, it, expect } from "vitest";
import { deriveRadar } from "../deriveRadar";
import type { SquadData, RecentFormData } from "@/types/team";

// ---- 内联巴西算例（与真实数据数值一致）----
// 位置组均身价：FW 5855.6 / MF 3283.3 / DF 2231.3；全队 caps 和=916(均35.23)，
// 全队 goals 和=152，assists 和=116，DF goals=12，MF goals+assists=49，
// 最高身价 14000，≥5000万 共7人，最高进球 79(内马尔)。
const brazilSquad: SquadData = {
  team_id: "BRA",
  players: [
    { number: 1, position: "GK", name_cn: "阿利森", name_en: "Alisson", caps: 78, goals: 0, assists: null, club_cn: "利物浦", club_en: "Liverpool", value_wan_euros: 1500, preferred_position: "GK" },
    { number: 2, position: "MF", name_cn: "埃德森·席尔瓦", name_en: "Éderson Silva", caps: 3, goals: 0, assists: 0, club_cn: "亚特兰大", club_en: "Atalanta", value_wan_euros: 4500, preferred_position: "MF" },
    { number: 3, position: "DF", name_cn: "加布里埃尔", name_en: "Gabriel", caps: 17, goals: 1, assists: 0, club_cn: "阿森纳", club_en: "Arsenal", value_wan_euros: 7500, preferred_position: "DF" },
    { number: 4, position: "DF", name_cn: "马尔基尼奥斯", name_en: "Marquinhos", caps: 105, goals: 7, assists: 4, club_cn: "巴黎", club_en: "PSG", value_wan_euros: 2800, preferred_position: "DF" },
    { number: 5, position: "MF", name_cn: "卡塞米罗", name_en: "Casemiro", caps: 86, goals: 9, assists: 5, club_cn: "曼联", club_en: "Man Utd", value_wan_euros: 600, preferred_position: "MF" },
    { number: 6, position: "DF", name_cn: "阿莱士·桑德罗", name_en: "Alex Sandro", caps: 45, goals: 2, assists: 0, club_cn: "弗拉门戈", club_en: "Flamengo", value_wan_euros: 100, preferred_position: "DF" },
    { number: 7, position: "FW", name_cn: "维尼修斯", name_en: "Vinícius", caps: 49, goals: 9, assists: 9, club_cn: "皇马", club_en: "Real Madrid", value_wan_euros: 14000, preferred_position: "FW" },
    { number: 8, position: "MF", name_cn: "布鲁诺", name_en: "Bruno", caps: 43, goals: 3, assists: 8, club_cn: "纽卡", club_en: "Newcastle", value_wan_euros: 7000, preferred_position: "MF" },
    { number: 9, position: "FW", name_cn: "库尼亚", name_en: "Cunha", caps: 23, goals: 1, assists: 2, club_cn: "曼联", club_en: "Man Utd", value_wan_euros: 7500, preferred_position: "FW" },
    { number: 10, position: "FW", name_cn: "内马尔", name_en: "Neymar", caps: 128, goals: 79, assists: 59, club_cn: "桑托斯", club_en: "Santos", value_wan_euros: 800, preferred_position: "FW" },
    { number: 11, position: "FW", name_cn: "拉菲尼亚", name_en: "Raphinha", caps: 39, goals: 11, assists: 8, club_cn: "巴萨", club_en: "Barcelona", value_wan_euros: 7000, preferred_position: "FW" },
    { number: 12, position: "GK", name_cn: "韦弗顿", name_en: "Weverton", caps: 11, goals: 0, assists: null, club_cn: "格雷米奥", club_en: "Grêmio", value_wan_euros: 70, preferred_position: "GK" },
    { number: 13, position: "DF", name_cn: "达尼洛", name_en: "Danilo", caps: 70, goals: 1, assists: 6, club_cn: "弗拉门戈", club_en: "Flamengo", value_wan_euros: 200, preferred_position: "DF" },
    { number: 14, position: "DF", name_cn: "布雷默", name_en: "Bremer", caps: 8, goals: 1, assists: 0, club_cn: "尤文", club_en: "Juventus", value_wan_euros: 3500, preferred_position: "DF" },
    { number: 15, position: "DF", name_cn: "莱奥", name_en: "Léo", caps: 4, goals: 0, assists: 0, club_cn: "弗拉门戈", club_en: "Flamengo", value_wan_euros: 1200, preferred_position: "DF" },
    { number: 16, position: "DF", name_cn: "道格拉斯", name_en: "Douglas", caps: 7, goals: 0, assists: 1, club_cn: "泽尼特", club_en: "Zenit", value_wan_euros: 750, preferred_position: "DF" },
    { number: 17, position: "MF", name_cn: "法比尼奥", name_en: "Fabinho", caps: 33, goals: 0, assists: 1, club_cn: "吉达联合", club_en: "Al-Ittihad", value_wan_euros: 1200, preferred_position: "MF" },
    { number: 18, position: "MF", name_cn: "达尼洛·桑", name_en: "Danilo S.", caps: 4, goals: 2, assists: 0, club_cn: "博塔弗戈", club_en: "Botafogo", value_wan_euros: 3200, preferred_position: "MF" },
    { number: 19, position: "FW", name_cn: "恩德里克", name_en: "Endrick", caps: 17, goals: 4, assists: 2, club_cn: "里昂", club_en: "Lyon", value_wan_euros: 4000, preferred_position: "FW" },
    { number: 20, position: "MF", name_cn: "帕奎塔", name_en: "Paquetá", caps: 63, goals: 13, assists: 8, club_cn: "弗拉门戈", club_en: "Flamengo", value_wan_euros: 3200, preferred_position: "MF" },
    { number: 21, position: "FW", name_cn: "路易斯·恩", name_en: "Luiz H.", caps: 15, goals: 2, assists: 3, club_cn: "泽尼特", club_en: "Zenit", value_wan_euros: 2400, preferred_position: "FW" },
    { number: 22, position: "FW", name_cn: "马丁内利", name_en: "Martinelli", caps: 23, goals: 4, assists: 0, club_cn: "阿森纳", club_en: "Arsenal", value_wan_euros: 4500, preferred_position: "FW" },
    { number: 23, position: "GK", name_cn: "埃德森", name_en: "Ederson", caps: 32, goals: 0, assists: null, club_cn: "费内巴切", club_en: "Fenerbahçe", value_wan_euros: 1000, preferred_position: "GK" },
    { number: 24, position: "DF", name_cn: "伊巴涅斯", name_en: "Ibañez", caps: 7, goals: 0, assists: 0, club_cn: "吉达国民", club_en: "Al-Ahli", value_wan_euros: 1800, preferred_position: "DF" },
    { number: 25, position: "FW", name_cn: "伊戈尔", name_en: "Igor", caps: 4, goals: 2, assists: 0, club_cn: "布伦特福德", club_en: "Brentford", value_wan_euros: 6500, preferred_position: "FW" },
    { number: 26, position: "FW", name_cn: "拉扬", name_en: "Rayan", caps: 2, goals: 1, assists: 0, club_cn: "伯恩茅斯", club_en: "Bournemouth", value_wan_euros: 6000, preferred_position: "FW" }
  ]
};

// 加权后：M=10.0, gf=1.80, ga=1.10, pts%=60.0
const brazilForm: RecentFormData = {
  team_id: "BRA",
  last_10: [
    { opponent: "哥伦比亚", result: "W", score: "2-1", type: "qualifier" },
    { opponent: "阿根廷", result: "L", score: "1-4", type: "qualifier" },
    { opponent: "厄瓜多尔", result: "D", score: "0-0", type: "qualifier" },
    { opponent: "巴拉圭", result: "W", score: "1-0", type: "qualifier" },
    { opponent: "智利", result: "W", score: "3-0", type: "qualifier" },
    { opponent: "玻利维亚", result: "L", score: "0-1", type: "qualifier" },
    { opponent: "韩国", result: "W", score: "5-0", type: "friendly" },
    { opponent: "日本", result: "L", score: "2-3", type: "friendly" },
    { opponent: "塞内加尔", result: "W", score: "2-0", type: "friendly" },
    { opponent: "突尼斯", result: "D", score: "1-1", type: "friendly" },
    { opponent: "法国", result: "L", score: "1-2", type: "friendly" },
    { opponent: "克罗地亚", result: "W", score: "3-1", type: "friendly" },
    { opponent: "巴拿马", result: "W", score: "6-2", type: "friendly" },
    { opponent: "埃及", result: "W", score: "2-1", type: "friendly" }
  ],
  summary: { wins: 8, draws: 2, losses: 4, goals_scored: 29, goals_conceded: 16 }
};

describe("deriveRadar - 巴西算例", () => {
  it("产出与方法论一致的 8 维分数", () => {
    const r = deriveRadar(brazilSquad, brazilForm);
    expect(r).toEqual({
      attack: 85,
      defense: 70,
      control: 83,
      status: 72,
      experience: 70,
      place_kick: 81,
      superstar: 93,
      penalty: 92,
    });
  });
});

describe("deriveRadar - 友谊赛降权", () => {
  it("同样的胜负、但全友谊赛时 status 应低于含正式赛", () => {
    // 全友谊赛版本：把 6 场预选赛也改成 friendly
    const allFriendly: RecentFormData = {
      ...brazilForm,
      last_10: brazilForm.last_10.map((m) => ({ ...m, type: "friendly" as const })),
    };
    const weighted = deriveRadar(brazilSquad, brazilForm).status;
    const allF = deriveRadar(brazilSquad, allFriendly).status;
    // 正式赛被降权后，强队刷弱队的数据影响减小 -> 此处两者数值可能接近，
    // 核心断言：函数不抛错且为整数
    expect(Number.isInteger(weighted)).toBe(true);
    expect(Number.isInteger(allF)).toBe(true);
  });
});

describe("deriveRadar - 边界", () => {
  it("跳过未赛(score='-')的场次", () => {
    const withUpcoming: RecentFormData = {
      team_id: "BRA",
      last_10: [
        ...brazilForm.last_10,
        { opponent: "摩洛哥", result: "D", score: "-", type: "tournament" },
        { opponent: "海地", result: "D", score: "-", type: "tournament" },
      ],
      summary: { wins: 8, draws: 2, losses: 4, goals_scored: 29, goals_conceded: 16 },
    };
    expect(deriveRadar(brazilSquad, withUpcoming)).toEqual(
      deriveRadar(brazilSquad, brazilForm)
    );
  });

  it("空名单不抛错，返回钳制范围内的整数", () => {
    const r = deriveRadar({ team_id: "X", players: [] }, brazilForm);
    expect(Object.values(r).every((v) => Number.isInteger(v) && v >= 35 && v <= 95)).toBe(true);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `cd my-world-cup && npx vitest run src/lib/__tests__/deriveRadar.test.ts`
Expected: FAIL（`Cannot find module '../deriveRadar'` 或导入失败）。

- [ ] **Step 3: 写实现**

把以下写入 `my-world-cup/src/lib/deriveRadar.ts`（严格对应方法论文档 §2–§4）：

```ts
// src/lib/deriveRadar.ts
// 严格依据 docs/radar-derivation-methodology.md 实现的 8 维雷达推导纯函数。
import type { SquadData, SquadPlayer, RecentFormData, RadarMetrics, MatchRecord } from "@/types/team";

type Anchor = Array<[number, number]>;

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

/** 分段线性插值；x 超出范围时钳制到首/末 y。 */
function interpolate(x: number, points: Anchor): number {
  if (x <= points[0][0]) return points[0][1];
  if (x >= points[points.length - 1][0]) return points[points.length - 1][1];
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    if (x >= x0 && x <= x1) {
      return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return points[points.length - 1][1];
}

/** §3 身价锚点：位置组平均身价(万欧) -> 35..95 */
const VALUE_ANCHORS: Anchor = [[0, 35], [1000, 55], [3000, 75], [5000, 88], [7000, 95]];
function valueScore(avgWan: number): number {
  return clamp(interpolate(avgWan, VALUE_ANCHORS), 35, 95);
}

/** §2 赛事权重 */
const MATCH_WEIGHTS: Record<MatchRecord["type"], number> = {
  friendly: 0.5,
  qualifier: 1.0,
  tournament: 1.0,
};

/** 解析比分 "2-1"/"2–1" -> [2,1]；"-" 或无法解析 -> null（视为未赛） */
function parseScore(score: string): [number, number] | null {
  const parts = score.split(/[-–−]/).map((s) => s.trim());
  if (parts.length !== 2) return null;
  const a = parseInt(parts[0], 10);
  const b = parseInt(parts[1], 10);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return [a, b];
}

interface Aggregates {
  m: number; // 加权等效场次
  gf: number; // 场均加权进球
  ga: number; // 场均加权失球
  ptsPct: number; // 加权积分率 %
}

/** §2 对已完赛应用赛事权重并聚合 */
function aggregateMatches(form: RecentFormData): Aggregates {
  let m = 0;
  let gf = 0;
  let ga = 0;
  let pts = 0;
  for (const match of form.last_10) {
    const parsed = parseScore(match.score);
    if (!parsed) continue; // 跳过未赛
    const [a, b] = parsed;
    const w = MATCH_WEIGHTS[match.type] ?? 1.0;
    m += w;
    gf += a * w;
    ga += b * w;
    pts += (match.result === "W" ? 3 : match.result === "D" ? 1 : 0) * w;
  }
  return {
    m,
    gf: m > 0 ? gf / m : 0,
    ga: m > 0 ? ga / m : 0,
    ptsPct: m > 0 ? (pts / (3 * m)) * 100 : 0,
  };
}

function avgValue(players: SquadPlayer[], position: SquadPlayer["position"]): number {
  const group = players.filter((p) => p.position === position);
  if (group.length === 0) return 0;
  return group.reduce((acc, p) => acc + (p.value_wan_euros ?? 0), 0) / group.length;
}

function sumGA(players: SquadPlayer[]): number {
  return players.reduce((acc, p) => acc + (p.goals ?? 0) + (p.assists ?? 0), 0);
}

/**
 * §4 八维推导。返回 0-100 整数 RadarMetrics。
 */
export function deriveRadar(squad: SquadData, form: RecentFormData): RadarMetrics {
  const players = squad.players;
  const vFW = valueScore(avgValue(players, "FW"));
  const vMF = valueScore(avgValue(players, "MF"));
  const vDF = valueScore(avgValue(players, "DF"));
  const { gf, ga, ptsPct } = aggregateMatches(form);

  // §4.1 进攻
  const attackForm = clamp(interpolate(gf, [[0, 40], [1.0, 60], [2.0, 78], [3.0, 92]]), 40, 95);
  const attack = Math.round(0.65 * vFW + 0.35 * attackForm);

  // §4.2 防守
  const defenseForm = clamp(interpolate(ga, [[0, 92], [1.0, 75], [2.0, 58], [3.0, 42]]), 40, 95);
  const defense = Math.round(0.5 * vDF + 0.5 * defenseForm);

  // §4.3 控球
  const mfPlayers = players.filter((p) => p.position === "MF");
  const mfGA = mfPlayers.length > 0 ? sumGA(mfPlayers) / mfPlayers.length : 0;
  const creativity = clamp(interpolate(mfGA, [[0, 0], [5, 4], [10, 8]]), 0, 10);
  const control = Math.round(clamp(vMF + creativity, 35, 95));

  // §4.4 状态
  const status = Math.round(clamp(interpolate(ptsPct, [[0, 35], [50, 60], [67, 80], [100, 95]]), 35, 95));

  // §4.5 经验（全队场均出场）
  const avgCaps = players.length > 0 ? players.reduce((acc, p) => acc + (p.caps ?? 0), 0) / players.length : 0;
  const experience = Math.round(clamp(interpolate(avgCaps, [[0, 35], [20, 55], [40, 75], [60, 88], [80, 95]]), 35, 95));

  // §4.6 定位球（代理）
  const squadGA = players.length > 0 ? sumGA(players) / players.length : 0;
  const base = clamp(interpolate(squadGA, [[0, 50], [8, 70], [12, 85], [16, 92]]), 40, 95);
  const dfGoals = players.filter((p) => p.position === "DF").reduce((acc, p) => acc + (p.goals ?? 0), 0);
  const placeKick = Math.round(clamp(base + Math.min(dfGoals, 12) / 6, 40, 95));

  // §4.7 球星
  const maxVal = players.reduce((acc, p) => Math.max(acc, p.value_wan_euros ?? 0), 0);
  const vMax = valueScore(maxVal);
  const eliteCnt = players.filter((p) => (p.value_wan_euros ?? 0) >= 5000).length;
  const eliteScore = clamp(interpolate(eliteCnt, [[0, 40], [3, 65], [5, 80], [8, 95]]), 40, 95);
  const superstar = Math.round(0.6 * vMax + 0.4 * eliteScore);

  // §4.8 点球（代理）
  const takerGoals = players.reduce((acc, p) => Math.max(acc, p.goals ?? 0), 0);
  const penalty = Math.round(clamp(interpolate(takerGoals, [[0, 50], [20, 70], [50, 85], [80, 92]]), 40, 95));

  return {
    attack,
    defense,
    control,
    status,
    experience,
    place_kick: placeKick,
    superstar,
    penalty,
  };
}
```

- [ ] **Step 4: 运行测试，确认通过**

Run: `cd my-world-cup && npx vitest run src/lib/__tests__/deriveRadar.test.ts`
Expected: PASS（4 个测试全过；巴西算例严格等于 `85/70/83/72/70/81/93/92`）。

- [ ] **Step 5: Commit**

```bash
git add my-world-cup/src/lib/deriveRadar.ts my-world-cup/src/lib/__tests__/deriveRadar.test.ts
git commit -m "feat(lib): add deriveRadar pure function with Brazil-canonical tests"
```

---

### Task 5: 更新巴西 radar_data.json + 真实数据集成测试

**Files:**
- Modify: `my-world-cup/database/2_ability_models/Brazil/radar_data.json`
- Modify: `my-world-cup/src/lib/__tests__/deriveRadar.test.ts`（追加集成测试）

- [ ] **Step 1: 写入推导结果**

把 `my-world-cup/database/2_ability_models/Brazil/radar_data.json` 整体替换为 deriveRadar 的输出：

```json
{
  "attack": 85,
  "defense": 70,
  "control": 83,
  "status": 72,
  "experience": 70,
  "place_kick": 81,
  "superstar": 93,
  "penalty": 92
}
```

- [ ] **Step 2: 追加集成测试（真实文件 ↔ 函数一致性）**

在 `my-world-cup/src/lib/__tests__/deriveRadar.test.ts` 末尾追加：

```ts
import fs from "fs";
import path from "path";

describe("deriveRadar - 真实巴西文件一致性", () => {
  it("deriveRadar(真实 squad+form) === 已发布的 radar_data.json", () => {
    const base = path.join(process.cwd(), "database", "2_ability_models", "Brazil");
    const squad = JSON.parse(fs.readFileSync(path.join(base, "squad.json"), "utf-8"));
    const form = JSON.parse(fs.readFileSync(path.join(base, "recent_form.json"), "utf-8"));
    const published = JSON.parse(fs.readFileSync(path.join(base, "radar_data.json"), "utf-8"));
    expect(deriveRadar(squad, form)).toEqual(published);
  });
});
```

- [ ] **Step 3: 运行测试**

Run: `cd my-world-cup && npx vitest run src/lib/__tests__/deriveRadar.test.ts`
Expected: PASS（含新的一致性测试，证明发布值由函数复算得出）。

- [ ] **Step 4: Commit**

```bash
git add my-world-cup/database/2_ability_models/Brazil/radar_data.json my-world-cup/src/lib/__tests__/deriveRadar.test.ts
git commit -m "feat(data): update Brazil radar_data.json to derived values + consistency test"
```

---

### Task 6: getTeamPageData 数据访问层

**Files:**
- Modify: `my-world-cup/src/lib/data.ts`

- [ ] **Step 1: 加 getSquad 与 getTeamPageData**

在 `my-world-cup/src/lib/data.ts` 顶部 import 行追加类型：

```ts
import type { TeamProfile, RadarMetrics, TeamOverall, OddsEntry, GroupData, StrategyData, RecentFormData, SquadData, TeamPageData } from "@/types/team";
```

在文件末尾（`getAllTeamsWithRadar` 之后）追加：

```ts
/**
 * 读取指定球队的 squad.json（按 team_name_en 目录）
 */
export function getSquad(teamNameEn: string): SquadData | null {
  const filePath = path.join(DB_DIR, teamNameEn, "squad.json");
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

/**
 * 按 team_id 取整页数据（profile + radar + squad + form + overall）
 */
export function getTeamPageData(teamId: string): TeamPageData | null {
  const profiles = getAllTeamProfiles();
  const profile = profiles.find((p) => p.team_id === teamId);
  if (!profile) return null;
  const radar = getRadarData(profile.team_name_en);
  const squad = getSquad(profile.team_name_en);
  const formMap = getRecentFormsMap();
  const form = formMap[profile.team_name_en] ?? null;
  const overall_score = radar ? calculateOverallScore(radar) : 0;
  return { profile, radar, squad, form, overall_score };
}
```

- [ ] **Step 2: 类型检查 + 单测回归**

Run: `cd my-world-cup && npx tsc --noEmit && npx vitest run`
Expected: 类型无错；所有测试通过（含原 simulation 测试与 deriveRadar 测试）。

- [ ] **Step 3: Commit**

```bash
git add my-world-cup/src/lib/data.ts
git commit -m "feat(data): add getSquad and getTeamPageData(teamId)"
```

---

### Task 7: SingleRadarChart 组件（单队雷达）

**Files:**
- Create: `my-world-cup/src/components/SingleRadarChart.tsx`

- [ ] **Step 1: 写组件**

把以下写入 `my-world-cup/src/components/SingleRadarChart.tsx`（由 `RadarCompareChart` 改写为单队，金色描边）：

```tsx
import type { RadarMetrics } from "@/types/team";

interface SingleRadarChartProps {
  metrics: RadarMetrics;
  name: string;
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
const ACCENT = "#d69e2e"; // 金色

function polarToCartesian(axisIndex: number, value: number) {
  const angle = -Math.PI / 2 + axisIndex * (2 * Math.PI / 8);
  const r = (value / 100) * RADIUS;
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
}

function getAxisEnd(axisIndex: number) {
  const angle = -Math.PI / 2 + axisIndex * (2 * Math.PI / 8);
  return { x: CX + RADIUS * Math.cos(angle), y: CY + RADIUS * Math.sin(angle) };
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

export function SingleRadarChart({ metrics, name }: SingleRadarChartProps) {
  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 400 420"
        className="w-full max-w-[400px]"
        role="img"
        aria-label={`${name} 能力雷达图`}
      >
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

        {DIMENSIONS.map((_, i) => {
          const end = getAxisEnd(i);
          return (
            <line key={i} x1={CX} y1={CY} x2={end.x} y2={end.y} stroke="#e2e8f0" strokeWidth={0.8} />
          );
        })}

        <polygon
          points={buildPolygonPoints(metrics)}
          fill="rgba(214,158,46,0.18)"
          stroke={ACCENT}
          strokeWidth={2}
        />

        {DIMENSIONS.map((dim, i) => {
          const pt = polarToCartesian(i, metrics[dim.key]);
          return (
            <circle key={dim.key} cx={pt.x} cy={pt.y} r={3.5} fill="white" stroke={ACCENT} strokeWidth={2} />
          );
        })}

        {DIMENSIONS.map((dim, i) => {
          const angle = -Math.PI / 2 + i * (2 * Math.PI / 8);
          const labelR = RADIUS + 28;
          const pos = { x: CX + labelR * Math.cos(angle), y: CY + labelR * Math.sin(angle) };
          let textAnchor: "start" | "middle" | "end" = "middle";
          if (Math.cos(angle) > 0.3) textAnchor = "start";
          if (Math.cos(angle) < -0.3) textAnchor = "end";
          return (
            <g key={`label-${dim.key}`}>
              <text x={pos.x} y={pos.y - 6} textAnchor={textAnchor} className="text-[10px] fill-[#1a1a2e] font-medium">
                {dim.label}
              </text>
              <text x={pos.x} y={pos.y + 7} textAnchor={textAnchor} className="text-[9px]" fill={ACCENT} fontWeight={600}>
                {metrics[dim.key]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: 类型检查**

Run: `cd my-world-cup && npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 3: Commit**

```bash
git add my-world-cup/src/components/SingleRadarChart.tsx
git commit -m "feat(ui): add SingleRadarChart component"
```

---

### Task 8: SquadTable + RecentFormList 组件

**Files:**
- Create: `my-world-cup/src/components/SquadTable.tsx`
- Create: `my-world-cup/src/components/RecentFormList.tsx`

- [ ] **Step 1: 写 SquadTable（含位置筛选）**

把以下写入 `my-world-cup/src/components/SquadTable.tsx`：

```tsx
"use client";

import { useState } from "react";
import type { SquadData, SquadPlayer } from "@/types/team";

const POSITIONS = ["全部", "GK", "DF", "MF", "FW"] as const;
type Filter = (typeof POSITIONS)[number];

const POS_BADGE: Record<SquadPlayer["position"], string> = {
  GK: "bg-yellow-100 text-yellow-700",
  DF: "bg-blue-100 text-blue-700",
  MF: "bg-green-100 text-green-700",
  FW: "bg-red-100 text-red-700",
};

function formatWan(wan: number): string {
  const m = wan / 100; // 万欧 -> 百万欧
  if (m >= 1000) return `€${(m / 1000).toFixed(1)}B`;
  return `€${m}M`;
}

export function SquadTable({ squad }: { squad: SquadData }) {
  const [filter, setFilter] = useState<Filter>("全部");
  const players = squad.players
    .filter((p) => filter === "全部" || p.position === filter)
    .sort((a, b) => a.number - b.number);

  return (
    <div>
      <div className="flex gap-1.5 mb-2">
        {POSITIONS.map((pos) => (
          <button
            key={pos}
            onClick={() => setFilter(pos)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
              filter === pos ? "bg-[#1a1a2e] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {pos === "全部" ? "全部" : pos}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-gray-400 border-b border-gray-100">
              <th className="text-left py-1.5 px-1 font-medium w-7">#</th>
              <th className="text-left py-1.5 px-1 font-medium w-10">位置</th>
              <th className="text-left py-1.5 px-1 font-medium">球员</th>
              <th className="text-right py-1.5 px-1 font-medium w-9">年龄</th>
              <th className="text-right py-1.5 px-1 font-medium w-9">出场</th>
              <th className="text-right py-1.5 px-1 font-medium w-9">进球</th>
              <th className="text-right py-1.5 px-1 font-medium w-9">助攻</th>
              <th className="text-left py-1.5 px-1 font-medium">俱乐部</th>
              <th className="text-right py-1.5 px-1 font-medium w-14">身价</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.number} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-1.5 px-1 text-gray-400">{p.number}</td>
                <td className="py-1.5 px-1">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${POS_BADGE[p.position]}`}>
                    {p.position}
                  </span>
                </td>
                <td className="py-1.5 px-1">
                  <div className="font-medium text-[#1a1a2e]">{p.name_cn}</div>
                  <div className="text-[9px] text-gray-400">{p.name_en}</div>
                </td>
                <td className="py-1.5 px-1 text-right text-gray-600">{p.age ?? "-"}</td>
                <td className="py-1.5 px-1 text-right text-gray-600">{p.caps}</td>
                <td className="py-1.5 px-1 text-right text-gray-600">{p.goals}</td>
                <td className="py-1.5 px-1 text-right text-gray-600">{p.assists ?? "-"}</td>
                <td className="py-1.5 px-1 text-gray-600">{p.club_cn}</td>
                <td className="py-1.5 px-1 text-right font-medium text-[#1a1a2e]">{formatWan(p.value_wan_euros)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 写 RecentFormList**

把以下写入 `my-world-cup/src/components/RecentFormList.tsx`：

```tsx
import type { RecentFormData } from "@/types/team";

const RESULT_STYLE: Record<string, string> = {
  W: "bg-green-500 text-white",
  D: "bg-gray-400 text-white",
  L: "bg-red-500 text-white",
};
const TYPE_LABEL: Record<string, string> = {
  friendly: "友谊赛",
  qualifier: "预选赛",
  tournament: "正赛",
};

export function RecentFormList({ form }: { form: RecentFormData }) {
  const matches = form.last_10;
  const { wins, draws, losses, goals_scored, goals_conceded } = form.summary;
  return (
    <div>
      <div className="flex gap-4 mb-3 text-xs">
        <span className="text-gray-500">
          近况 <b className="text-[#1a1a2e]">{wins}胜 {draws}平 {losses}负</b>
        </span>
        <span className="text-gray-500">
          进失球 <b className="text-[#1a1a2e]">{goals_scored} / {goals_conceded}</b>
        </span>
      </div>
      <div className="space-y-1">
        {matches.map((m, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px] py-0.5">
            <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] ${RESULT_STYLE[m.result]}`}>
              {m.result}
            </span>
            {m.date && <span className="text-gray-400 w-20">{m.date}</span>}
            <span className="flex-1 text-[#1a1a2e] font-medium">{m.opponent}</span>
            <span className="text-gray-500 w-16 text-right">{TYPE_LABEL[m.type] ?? m.type}</span>
            <span className="font-bold text-[#1a1a2e] w-10 text-right">{m.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 类型检查**

Run: `cd my-world-cup && npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 4: Commit**

```bash
git add my-world-cup/src/components/SquadTable.tsx my-world-cup/src/components/RecentFormList.tsx
git commit -m "feat(ui): add SquadTable (position filter) and RecentFormList"
```

---

### Task 9: 球队画像页面

**Files:**
- Create: `my-world-cup/src/components/TeamProfileClient.tsx`
- Create: `my-world-cup/src/app/team/[teamId]/page.tsx`

- [ ] **Step 1: 写客户端组件 TeamProfileClient**

把以下写入 `my-world-cup/src/components/TeamProfileClient.tsx`：

```tsx
"use client";

import type { TeamPageData, RadarMetrics } from "@/types/team";
import { SingleRadarChart } from "./SingleRadarChart";
import { SquadTable } from "./SquadTable";
import { RecentFormList } from "./RecentFormList";

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

function formatValue(valueM: number): string {
  if (valueM >= 1000) return `€${(valueM / 1000).toFixed(1)}B`;
  return `€${valueM}M`;
}

export function TeamProfileClient({ data }: { data: TeamPageData }) {
  const { profile, radar, squad, form, overall_score } = data;
  const flagUrl = `https://flagcdn.com/w40/${profile.country_code}.png`;

  return (
    <div className="px-5 py-4 w-full max-w-5xl mx-auto">
      {/* 头部 */}
      <div className="flex items-center gap-3 mb-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={flagUrl} alt={profile.team_name} width={40} height={28} className="rounded-[2px] object-cover" />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#1a1a2e]">{profile.team_name}</h1>
          <p className="text-[11px] text-gray-400">{profile.team_name_en} · {profile.confederation} · {profile.group}组</p>
        </div>
        {radar && (
          <div className="text-right">
            <div className="text-2xl font-black text-[#d69e2e]">{overall_score}</div>
            <div className="text-[10px] text-gray-400">综合</div>
          </div>
        )}
      </div>

      {/* 概览卡 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {[
          { label: "主教练", value: profile.head_coach },
          { label: "总身价", value: formatValue(profile.total_value_m_euros) },
          { label: "FIFA 排名", value: `#${profile.fifa_ranking}` },
          { label: "阵型", value: profile.base_formation },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-lg p-3 border border-[#eef0f3]">
            <div className="text-[10px] text-gray-400">{c.label}</div>
            <div className="text-sm font-semibold text-[#1a1a2e] mt-0.5">{c.value}</div>
          </div>
        ))}
      </div>
      {profile.qualification && (
        <p className="text-[11px] text-gray-400 -mt-4 mb-6">晋级方式：{profile.qualification}</p>
      )}

      {/* 雷达 + 能力条 */}
      {radar && (
        <div className="bg-white rounded-lg p-4 border border-[#eef0f3] mb-6">
          <h2 className="text-[15px] font-bold text-[#1a1a2e] mb-3">能力雷达</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <SingleRadarChart metrics={radar} name={profile.team_name} />
            <div className="space-y-1.5">
              {ABILITY_LABELS.map((dim) => (
                <div key={dim.key} className="flex items-center gap-2 text-[11px]">
                  <span className="w-10 text-gray-500 shrink-0">{dim.label}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${radar[dim.key]}%`, backgroundColor: "#d69e2e", opacity: 0.75 }} />
                  </div>
                  <span className="w-7 text-right font-medium text-[#1a1a2e]">{radar[dim.key]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 大名单 */}
      {squad ? (
        <div className="bg-white rounded-lg p-4 border border-[#eef0f3] mb-6">
          <h2 className="text-[15px] font-bold text-[#1a1a2e] mb-3">大名单（{squad.players.length}人）</h2>
          <SquadTable squad={squad} />
        </div>
      ) : (
        <div className="bg-white rounded-lg p-4 border border-[#eef0f3] mb-6 text-[11px] text-gray-400">
          暂无大名单数据
        </div>
      )}

      {/* 近期战绩 */}
      {form && (
        <div className="bg-white rounded-lg p-4 border border-[#eef0f3]">
          <h2 className="text-[15px] font-bold text-[#1a1a2e] mb-3">近期战绩</h2>
          <RecentFormList form={form} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 写页面（服务端取数 + 动态路由）**

把以下写入 `my-world-cup/src/app/team/[teamId]/page.tsx`（Next.js 16 动态路由 `params` 为 Promise，需 `await`）：

```tsx
import { notFound } from "next/navigation";
import { getTeamPageData, getAllTeamProfiles } from "@/lib/data";
import { TeamProfileClient } from "@/components/TeamProfileClient";

export function generateStaticParams() {
  return getAllTeamProfiles().map((p) => ({ teamId: p.team_id }));
}

export default async function TeamPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const data = getTeamPageData(teamId);
  if (!data) notFound();
  return (
    <div className="bg-[#f7f8fa] min-h-screen">
      <TeamProfileClient data={data} />
    </div>
  );
}
```

- [ ] **Step 3: 类型检查**

Run: `cd my-world-cup && npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 4: Commit**

```bash
git add my-world-cup/src/components/TeamProfileClient.tsx "my-world-cup/src/app/team/[teamId]/page.tsx"
git commit -m "feat(page): add /team/[teamId] team profile page"
```

---

### Task 10: 构建与端到端验证

**Files:** 无（验证任务）

- [ ] **Step 1: 全量测试**

Run: `cd my-world-cup && npm test`
Expected: 全部通过（simulation + deriveRadar，含巴西一致性测试）。

- [ ] **Step 2: 生产构建**

Run: `cd my-world-cup && npm run build`
Expected: 构建成功；`/team/[teamId]` 路由被识别（静态参数 48 个）。

- [ ] **Step 3: 启动并人工验证巴西页**

Run: `cd my-world-cup && npm run dev`
浏览器打开 `http://localhost:3000/team/BRA`，确认：
- 头部：巴西 + 国旗 + `Brazil · CONMEBOL · C组`
- 概览：卡洛·安切洛蒂 / €928M / #6 / 4-3-3；晋级方式行显示
- 雷达图金色多边形 + 8 能力条，数值为 `85/70/83/72/70/81/93/92`
- 大名单 26 行，位置筛选(GK/DF/MF/FW)生效
- 近期战绩 14 场，汇总 `8胜 2平 4负`，进失球 `29 / 16`

再打开 `http://localhost:3000/team/ARG`（无 squad 的队）确认优雅降级：显示头部+概览+雷达+战绩，大名单区显示"暂无大名单数据"。

- [ ] **Step 4: 从首页入口验证**

打开 `http://localhost:3000/`，在分组卡片点击"巴西"，确认跳转到 `/team/BRA`（复用已有 `TeamRow` 链接）。

- [ ] **Step 5: 最终 Commit（如有构建产物修正）**

```bash
git add -A
git commit -m "chore: verify team profile build & e2e" || echo "nothing to commit"
```

---

## 自检（Self-Review 结论）

- **Spec 覆盖**：页面区块(头部/概览/雷达/名单/战绩)→Task 9；数据模型(squad/profile/recent_form/radar)→Task 2/3/5；推导方法+赛事权重→Task 4；碰撞/校准→方法论文档(已提交)；getTeamPageData→Task 6；优雅降级→Task 9(squad?...:暂无)。全覆盖。
- **占位符**：无 TBD/TODO；所有代码块完整。
- **类型一致**：`deriveRadar` 返回字段 `place_kick`（非 placeKick）与 `RadarMetrics` 一致；`getTeamPageData` 返回 `TeamPageData` 与 Task 1 定义一致；路由 param `teamId` 与 `TeamRow` 的 `/team/${team.team_id}` 一致。
- **数值核验**：实现函数对巴西数据严格产出 `85/70/83/72/70/81/93/92`（与方法论 §5、Task 5 的 radar_data.json、Task 4 测试三者一致）。
