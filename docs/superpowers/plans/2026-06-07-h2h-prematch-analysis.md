# H2H 赛前深度分析 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three pre-match analysis cards (Odds, Recent Form, Tactics) to the H2H match simulation page.

**Architecture:** Generate mock data (strategy.json, recent_form.json, extended odds.json) via Python script. Add TypeScript types, data loading functions, pure calculation utilities with tests, and three new React components. Integrate into existing H2HClient component.

**Tech Stack:** Python 3 (data generation), TypeScript, React, Tailwind CSS, Vitest (tests)

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `scripts/generate_pre_match_data.py` | Generate strategy.json, recent_form.json, extend odds.json for 48 teams |
| Create | `my-world-cup/src/lib/h2h-odds.ts` | Pure function: calculate H2H odds from two teams' base odds |
| Create | `my-world-cup/src/lib/__tests__/h2h-odds.test.ts` | Tests for H2H odds calculation |
| Create | `my-world-cup/src/lib/tactics.ts` | Pure function: determine tactical克制 matchup |
| Create | `my-world-cup/src/lib/__tests__/tactics.test.ts` | Tests for tactical克制 logic |
| Create | `my-world-cup/src/components/OddsCompare.tsx` | Odds comparison card component |
| Create | `my-world-cup/src/components/RecentForm.tsx` | Recent form card component |
| Create | `my-world-cup/src/components/TacticsAnalysis.tsx` | Tactics analysis card component |
| Modify | `my-world-cup/src/types/team.ts` | Add StrategyData, MatchRecord, RecentFormData; extend OddsEntry |
| Modify | `my-world-cup/src/types/simulation.ts` | Extend H2HPageData with strategyMap, formMap, oddsMap |
| Modify | `my-world-cup/src/lib/data.ts` | Add getStrategiesMap, getRecentFormsMap, getOddsMap |
| Modify | `my-world-cup/src/components/H2HClient.tsx` | Integrate three new components, move simulate button |
| Modify | `my-world-cup/src/app/h2h/page.tsx` | Load and pass new data |

---

### Task 1: Generate Mock Data (Python Script)

**Files:**
- Create: `scripts/generate_pre_match_data.py`
- Creates: 48 × `my-world-cup/database/2_ability_models/{Team}/strategy.json`
- Creates: 48 × `my-world-cup/database/2_ability_models/{Team}/recent_form.json`
- Modifies: `my-world-cup/database/2_ability_models/odds.json`

- [ ] **Step 1: Create the Python script**

```python
# scripts/generate_pre_match_data.py
"""
Generate strategy.json, recent_form.json for all 48 teams,
and extend odds.json with H2H base odds fields.
"""
import json
import os
import random
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
DB_DIR = PROJECT_ROOT / "my-world-cup" / "database" / "2_ability_models"
ODDS_PATH = DB_DIR / "odds.json"


def load_all_teams():
    """Read all profile.json and radar_data.json, compute overall score."""
    teams = []
    for entry in sorted(os.listdir(DB_DIR)):
        team_dir = DB_DIR / entry
        if not team_dir.is_dir():
            continue
        profile_path = team_dir / "profile.json"
        radar_path = team_dir / "radar_data.json"
        if not profile_path.exists() or not radar_path.exists():
            continue
        with open(profile_path, encoding="utf-8") as f:
            profile = json.load(f)
        with open(radar_path, encoding="utf-8") as f:
            radar = json.load(f)
        values = list(radar.values())
        overall = round(sum(values) / len(values), 1)
        teams.append({**profile, "overall": overall})
    return teams


def generate_strategy(team):
    """Generate strategy.json based on formation and overall score."""
    formation = team["base_formation"]
    overall = team["overall"]

    if overall > 85:
        style = random.choice(["possession", "pressing", "possession"])
    elif overall > 75:
        style = random.choice(["balanced", "possession", "pressing"])
    elif overall > 65:
        style = random.choice(["balanced", "counter_attack", "defensive"])
    else:
        style = random.choice(["defensive", "counter_attack", "defensive"])

    attrs = {
        "possession": {
            "pressing_intensity": random.choice(["medium", "high"]),
            "defensive_line": random.choice(["mid", "high"]),
            "transition_speed": random.choice(["medium", "slow"]),
        },
        "counter_attack": {
            "pressing_intensity": random.choice(["low", "medium"]),
            "defensive_line": random.choice(["low", "mid"]),
            "transition_speed": random.choice(["fast", "medium"]),
        },
        "pressing": {
            "pressing_intensity": "high",
            "defensive_line": random.choice(["high", "mid"]),
            "transition_speed": random.choice(["fast", "medium"]),
        },
        "defensive": {
            "pressing_intensity": "low",
            "defensive_line": "low",
            "transition_speed": random.choice(["slow", "medium"]),
        },
        "balanced": {
            "pressing_intensity": "medium",
            "defensive_line": "mid",
            "transition_speed": "medium",
        },
    }

    return {
        "team_id": team["team_id"],
        "formation": formation,
        "style": style,
        **attrs[style],
    }


def generate_recent_form(team, all_teams):
    """Generate recent_form.json based on overall score."""
    overall = team["overall"]

    if overall > 85:
        wins, draws = random.randint(7, 9), random.randint(0, 2)
    elif overall > 75:
        wins, draws = random.randint(5, 7), random.randint(1, 3)
    elif overall > 65:
        wins, draws = random.randint(3, 5), random.randint(2, 4)
    else:
        wins, draws = random.randint(1, 3), random.randint(2, 4)
    losses = max(0, 10 - wins - draws)

    opponents = [t for t in all_teams if t["team_id"] != team["team_id"]]
    results = ["W"] * wins + ["D"] * draws + ["L"] * losses
    random.shuffle(results)

    last_10 = []
    for result in results:
        opponent = random.choice(opponents)
        if result == "W":
            gf = random.randint(1, 4)
            ga = random.randint(0, max(0, gf - 1))
        elif result == "D":
            g = random.randint(0, 3)
            gf, ga = g, g
        else:
            ga = random.randint(1, 4)
            gf = random.randint(0, max(0, ga - 1))

        last_10.append({
            "opponent": opponent["team_name"],
            "result": result,
            "score": f"{gf}-{ga}",
            "type": random.choice(["friendly", "qualifier", "tournament"]),
        })

    total_gf = sum(int(m["score"].split("-")[0]) for m in last_10)
    total_ga = sum(int(m["score"].split("-")[1]) for m in last_10)

    return {
        "team_id": team["team_id"],
        "last_10": last_10,
        "summary": {
            "wins": wins,
            "draws": draws,
            "losses": losses,
            "goals_scored": total_gf,
            "goals_conceded": total_ga,
        },
    }


def extend_odds():
    """Extend odds.json with win_odds_base, draw_odds_base, loss_odds_base."""
    with open(ODDS_PATH, encoding="utf-8") as f:
        odds_list = json.load(f)

    odds_values = [t["odds"] for t in odds_list]
    min_odds, max_odds = min(odds_values), max(odds_values)

    for entry in odds_list:
        # 0 = weakest, 1 = strongest
        strength = 1 - (entry["odds"] - min_odds) / (max_odds - min_odds)
        entry["win_odds_base"] = round(1.5 + (1 - strength) * 7.5, 2)
        entry["draw_odds_base"] = round(3.0 + abs(strength - 0.5) * 0.8
                                         + random.uniform(-0.1, 0.1), 2)
        entry["loss_odds_base"] = round(1.2 + strength * 6.0, 2)

    with open(ODDS_PATH, "w", encoding="utf-8") as f:
        json.dump(odds_list, f, ensure_ascii=False, indent=2)
        f.write("\n")


def main():
    random.seed(42)
    teams = load_all_teams()

    for team in teams:
        team_dir = DB_DIR / team["team_name_en"]

        strategy = generate_strategy(team)
        with open(team_dir / "strategy.json", "w", encoding="utf-8") as f:
            json.dump(strategy, f, ensure_ascii=False, indent=2)
            f.write("\n")

        form = generate_recent_form(team, teams)
        with open(team_dir / "recent_form.json", "w", encoding="utf-8") as f:
            json.dump(form, f, ensure_ascii=False, indent=2)
            f.write("\n")

    extend_odds()
    print(f"Generated data for {len(teams)} teams")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run the script**

Run: `cd K:\AI_Coding\My_World_Cup && python scripts/generate_pre_match_data.py`
Expected: "Generated data for 48 teams"

- [ ] **Step 3: Verify generated files**

Run: `ls my-world-cup/database/2_ability_models/Argentina/strategy.json my-world-cup/database/2_ability_models/Argentina/recent_form.json`
Expected: both files exist

Run: `head -5 my-world-cup/database/2_ability_models/odds.json`
Expected: JSON array with `win_odds_base`, `draw_odds_base`, `loss_odds_base` fields present

- [ ] **Step 4: Commit**

```bash
cd K:\AI_Coding\My_World_Cup
git add scripts/ my-world-cup/database/
git commit -m "feat: add pre-match analysis mock data (strategy, recent form, extended odds)"
```

---

### Task 2: Add TypeScript Types

**Files:**
- Modify: `my-world-cup/src/types/team.ts`
- Modify: `my-world-cup/src/types/simulation.ts`

- [ ] **Step 1: Add new types and extend OddsEntry in `team.ts`**

Append these interfaces after the existing `OddsEntry` interface (around line 43):

```typescript
// --- Pre-match analysis types ---

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
```

Also update the existing `OddsEntry` interface (line 37-43) to add the three new fields:

```typescript
export interface OddsEntry {
  team_id: string;
  team_name: string;
  team_name_en: string;
  country_code: string;
  odds: number;
  win_odds_base: number;
  draw_odds_base: number;
  loss_odds_base: number;
}
```

- [ ] **Step 2: Extend H2HPageData in `simulation.ts`**

Replace the current `H2HPageData` interface (lines 11-14) with:

```typescript
import type { TeamProfile, RadarMetrics, StrategyData, RecentFormData, OddsEntry } from "./team";

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
  strategyMap: Record<string, StrategyData>;
  formMap: Record<string, RecentFormData>;
  oddsMap: Record<string, OddsEntry>;
}
```

Note: The import line at the top of `simulation.ts` must also be updated to include the new types. Replace line 1:
```typescript
import type { TeamProfile, RadarMetrics } from "./team";
```
with:
```typescript
import type { TeamProfile, RadarMetrics, StrategyData, RecentFormData, OddsEntry } from "./team";
```

- [ ] **Step 3: Commit**

```bash
git add my-world-cup/src/types/
git commit -m "feat: add pre-match analysis TypeScript types"
```

---

### Task 3: H2H Odds Calculation Utility (TDD)

**Files:**
- Create: `my-world-cup/src/lib/h2h-odds.ts`
- Create: `my-world-cup/src/lib/__tests__/h2h-odds.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// my-world-cup/src/lib/__tests__/h2h-odds.test.ts
import { describe, it, expect } from "vitest";
import { calculateH2HOdds } from "../h2h-odds";
import type { OddsEntry } from "@/types/team";

const makeOdds = (overrides: Partial<OddsEntry> & { team_name_en: string }): OddsEntry => ({
  team_id: "TST",
  team_name: "测试",
  country_code: "xx",
  odds: 10,
  win_odds_base: 3.0,
  draw_odds_base: 3.3,
  loss_odds_base: 2.5,
  ...overrides,
});

describe("calculateH2HOdds", () => {
  it("should return probabilities that sum to ~1.0", () => {
    const oddsA = makeOdds({ team_name_en: "A", win_odds_base: 1.5, draw_odds_base: 3.5, loss_odds_base: 7.0 });
    const oddsB = makeOdds({ team_name_en: "B", win_odds_base: 8.0, draw_odds_base: 3.2, loss_odds_base: 1.3 });
    const result = calculateH2HOdds(oddsA, oddsB);

    const sum = result.probWinA + result.probDraw + result.probWinB;
    expect(sum).toBeCloseTo(1.0, 2);
  });

  it("should heavily favor the stronger team", () => {
    const strongTeam = makeOdds({ team_name_en: "Strong", win_odds_base: 1.5, draw_odds_base: 3.5, loss_odds_base: 7.0 });
    const weakTeam = makeOdds({ team_name_en: "Weak", win_odds_base: 8.0, draw_odds_base: 3.2, loss_odds_base: 1.3 });
    const result = calculateH2HOdds(strongTeam, weakTeam);

    expect(result.probWinA).toBeGreaterThan(0.6);
    expect(result.probWinB).toBeLessThan(0.25);
  });

  it("should give close probabilities for evenly matched teams", () => {
    const teamA = makeOdds({ team_name_en: "A", win_odds_base: 2.5, draw_odds_base: 3.3, loss_odds_base: 3.0 });
    const teamB = makeOdds({ team_name_en: "B", win_odds_base: 2.6, draw_odds_base: 3.3, loss_odds_base: 2.9 });
    const result = calculateH2HOdds(teamA, teamB);

    expect(result.probWinA).toBeGreaterThan(0.3);
    expect(result.probWinA).toBeLessThan(0.5);
    expect(result.probWinB).toBeGreaterThan(0.25);
    expect(result.probWinB).toBeLessThan(0.45);
  });

  it("should return odds that are reciprocals of probabilities", () => {
    const oddsA = makeOdds({ team_name_en: "A", win_odds_base: 1.8, draw_odds_base: 3.4, loss_odds_base: 5.0 });
    const oddsB = makeOdds({ team_name_en: "B", win_odds_base: 5.0, draw_odds_base: 3.4, loss_odds_base: 1.8 });
    const result = calculateH2HOdds(oddsA, oddsB);

    expect(result.winA).toBeCloseTo(1 / result.probWinA, 1);
    expect(result.draw).toBeCloseTo(1 / result.probDraw, 1);
    expect(result.winB).toBeCloseTo(1 / result.probWinB, 1);
  });

  it("should have higher draw probability for closely matched teams", () => {
    const closeA = makeOdds({ team_name_en: "A", win_odds_base: 2.5, draw_odds_base: 3.3, loss_odds_base: 3.0 });
    const closeB = makeOdds({ team_name_en: "B", win_odds_base: 2.6, draw_odds_base: 3.3, loss_odds_base: 2.9 });
    const closeResult = calculateH2HOdds(closeA, closeB);

    const farA = makeOdds({ team_name_en: "A", win_odds_base: 1.5, draw_odds_base: 3.5, loss_odds_base: 7.0 });
    const farB = makeOdds({ team_name_en: "B", win_odds_base: 8.0, draw_odds_base: 3.2, loss_odds_base: 1.3 });
    const farResult = calculateH2HOdds(farA, farB);

    expect(closeResult.probDraw).toBeGreaterThan(farResult.probDraw);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd my-world-cup && npx vitest run src/lib/__tests__/h2h-odds.test.ts`
Expected: FAIL — `calculateH2HOdds` is not defined

- [ ] **Step 3: Implement the utility**

```typescript
// my-world-cup/src/lib/h2h-odds.ts
import type { OddsEntry } from "@/types/team";

export interface H2HOdds {
  winA: number;      // 主队胜赔
  draw: number;      // 平局赔率
  winB: number;      // 客队胜赔
  probWinA: number;  // 主队胜率 (0-1)
  probDraw: number;  // 平局概率 (0-1)
  probWinB: number;  // 客队胜率 (0-1)
}

/**
 * 根据两队的赔率数据计算 H2H 对阵赔率
 * 算法：将基础胜率赔率转为隐含概率，按相对强度分配胜率，
 * 平局概率与两队实力接近程度正相关
 */
export function calculateH2HOdds(oddsA: OddsEntry, oddsB: OddsEntry): H2HOdds {
  // 基础隐含胜率（越低赔率 = 越强 = 越高隐含概率）
  const impWinA = 1 / oddsA.win_odds_base;
  const impWinB = 1 / oddsB.win_odds_base;

  // 相对胜率分配
  const totalWin = impWinA + impWinB;
  const relProbA = impWinA / totalWin;
  const relProbB = impWinB / totalWin;

  // 平局概率：两队越接近，平局概率越高
  const strengthRatio = Math.min(impWinA, impWinB) / Math.max(impWinA, impWinB);
  const drawBoost = strengthRatio * 0.25;
  const rawDraw = 0.08 + drawBoost;

  // 归一化
  const total = relProbA + relProbB + rawDraw;
  const probWinA = relProbA / total;
  const probWinB = relProbB / total;
  const probDraw = rawDraw / total;

  return {
    winA: Math.round((1 / probWinA) * 100) / 100,
    draw: Math.round((1 / probDraw) * 100) / 100,
    winB: Math.round((1 / probWinB) * 100) / 100,
    probWinA: Math.round(probWinA * 1000) / 1000,
    probDraw: Math.round(probDraw * 1000) / 1000,
    probWinB: Math.round(probWinB * 1000) / 1000,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd my-world-cup && npx vitest run src/lib/__tests__/h2h-odds.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add my-world-cup/src/lib/h2h-odds.ts my-world-cup/src/lib/__tests__/h2h-odds.test.ts
git commit -m "feat: add H2H odds calculation utility with tests"
```

---

### Task 4: Tactical克制 Determination Utility (TDD)

**Files:**
- Create: `my-world-cup/src/lib/tactics.ts`
- Create: `my-world-cup/src/lib/__tests__/tactics.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// my-world-cup/src/lib/__tests__/tactics.test.ts
import { describe, it, expect } from "vitest";
import { determineTacticsMatchup, STYLE_LABELS } from "../tactics";

describe("STYLE_LABELS", () => {
  it("should have labels for all 5 styles", () => {
    const styles = ["possession", "counter_attack", "pressing", "balanced", "defensive"];
    styles.forEach((s) => {
      expect(STYLE_LABELS[s as keyof typeof STYLE_LABELS]).toBeTruthy();
    });
  });
});

describe("determineTacticsMatchup", () => {
  it("should detect possession countering defensive", () => {
    const result = determineTacticsMatchup("possession", "defensive");
    expect(result.hasCounter).toBe(true);
    expect(result.counterTeam).toBe("A");
    expect(result.advantage).toBe(0.05);
    expect(result.description).toContain("主队");
    expect(result.description).toContain("控球渗透");
    expect(result.description).toContain("深度防守");
  });

  it("should detect counter_attack countering possession", () => {
    const result = determineTacticsMatchup("possession", "counter_attack");
    expect(result.hasCounter).toBe(true);
    expect(result.counterTeam).toBe("B");
    expect(result.description).toContain("客队");
    expect(result.description).toContain("防守反击");
  });

  it("should detect pressing countering counter_attack", () => {
    const result = determineTacticsMatchup("pressing", "counter_attack");
    expect(result.hasCounter).toBe(true);
    expect(result.counterTeam).toBe("A");
  });

  it("should detect defensive countering pressing", () => {
    const result = determineTacticsMatchup("defensive", "pressing");
    expect(result.hasCounter).toBe(true);
    expect(result.counterTeam).toBe("A");
  });

  it("should return no counter when balanced is involved", () => {
    const result = determineTacticsMatchup("balanced", "possession");
    expect(result.hasCounter).toBe(false);
    expect(result.counterTeam).toBe("none");
    expect(result.advantage).toBe(0);
  });

  it("should return no counter for same styles", () => {
    const result = determineTacticsMatchup("possession", "possession");
    expect(result.hasCounter).toBe(false);
    expect(result.advantage).toBe(0);
  });

  it("should return no counter for non-counter pairs", () => {
    const result = determineTacticsMatchup("possession", "pressing");
    expect(result.hasCounter).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd my-world-cup && npx vitest run src/lib/__tests__/tactics.test.ts`
Expected: FAIL — `determineTacticsMatchup` / `STYLE_LABELS` not defined

- [ ] **Step 3: Implement the utility**

```typescript
// my-world-cup/src/lib/tactics.ts

export type TacticalStyle = "possession" | "counter_attack" | "pressing" | "balanced" | "defensive";

export interface TacticsMatchup {
  hasCounter: boolean;
  counterStyle: string;
  counteredStyle: string;
  counterTeam: "A" | "B" | "none";
  advantage: number;
  description: string;
}

export const STYLE_LABELS: Record<TacticalStyle, string> = {
  possession: "控球渗透",
  counter_attack: "防守反击",
  pressing: "高位逼抢",
  balanced: "均衡",
  defensive: "深度防守",
};

/** 克制关系映射：style → 它所克制的风格 */
const COUNTER_MAP: Record<TacticalStyle, TacticalStyle | null> = {
  possession: "defensive",
  counter_attack: "possession",
  pressing: "counter_attack",
  defensive: "pressing",
  balanced: null,
};

/**
 * 判断两队的战术克制关系
 * 循环克制：possession→defensive→pressing→counter_attack→possession
 */
export function determineTacticsMatchup(
  styleA: TacticalStyle,
  styleB: TacticalStyle
): TacticsMatchup {
  // A 克制 B
  if (COUNTER_MAP[styleA] === styleB) {
    return {
      hasCounter: true,
      counterStyle: STYLE_LABELS[styleA],
      counteredStyle: STYLE_LABELS[styleB],
      counterTeam: "A",
      advantage: 0.05,
      description: `主队的${STYLE_LABELS[styleA]}战术克制客队的${STYLE_LABELS[styleB]}`,
    };
  }

  // B 克制 A
  if (COUNTER_MAP[styleB] === styleA) {
    return {
      hasCounter: true,
      counterStyle: STYLE_LABELS[styleB],
      counteredStyle: STYLE_LABELS[styleA],
      counterTeam: "B",
      advantage: 0.05,
      description: `客队的${STYLE_LABELS[styleB]}战术克制主队的${STYLE_LABELS[styleA]}`,
    };
  }

  return {
    hasCounter: false,
    counterStyle: "",
    counteredStyle: "",
    counterTeam: "none",
    advantage: 0,
    description: "双方战术风格无明显克制关系",
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd my-world-cup && npx vitest run src/lib/__tests__/tactics.test.ts`
Expected: All 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add my-world-cup/src/lib/tactics.ts my-world-cup/src/lib/__tests__/tactics.test.ts
git commit -m "feat: add tactical克制 determination utility with tests"
```

---

### Task 5: Data Loading Functions

**Files:**
- Modify: `my-world-cup/src/lib/data.ts`

- [ ] **Step 1: Add three new data loading functions**

Add these imports at the top (after the existing import line 5):
```typescript
import type { TeamProfile, RadarMetrics, TeamOverall, OddsEntry, GroupData, StrategyData, RecentFormData } from "@/types/team";
```

Then append three new functions before the `formatValue` function (before line 87):

```typescript
/**
 * 读取所有球队的 strategy.json，返回以 team_name_en 为键的 Map
 */
export function getStrategiesMap(): Record<string, StrategyData> {
  const entries = fs.readdirSync(DB_DIR, { withFileTypes: true });
  const map: Record<string, StrategyData> = {};

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const filePath = path.join(DB_DIR, entry.name, "strategy.json");
    if (fs.existsSync(filePath)) {
      const data: StrategyData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      map[data.team_id] = data;
      // Also key by team folder name (team_name_en)
      const profilePath = path.join(DB_DIR, entry.name, "profile.json");
      if (fs.existsSync(profilePath)) {
        const profile: TeamProfile = JSON.parse(fs.readFileSync(profilePath, "utf-8"));
        map[profile.team_name_en] = data;
      }
    }
  }

  return map;
}

/**
 * 读取所有球队的 recent_form.json，返回以 team_name_en 为键的 Map
 */
export function getRecentFormsMap(): Record<string, RecentFormData> {
  const entries = fs.readdirSync(DB_DIR, { withFileTypes: true });
  const map: Record<string, RecentFormData> = {};

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const filePath = path.join(DB_DIR, entry.name, "recent_form.json");
    if (fs.existsSync(filePath)) {
      const data: RecentFormData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const profilePath = path.join(DB_DIR, entry.name, "profile.json");
      if (fs.existsSync(profilePath)) {
        const profile: TeamProfile = JSON.parse(fs.readFileSync(profilePath, "utf-8"));
        map[profile.team_name_en] = data;
      }
    }
  }

  return map;
}

/**
 * 读取赔率数据，返回以 team_name_en 为键的 Map
 */
export function getOddsMap(): Record<string, OddsEntry> {
  const oddsList = getOddsData();
  const map: Record<string, OddsEntry> = {};
  for (const entry of oddsList) {
    map[entry.team_name_en] = entry;
  }
  return map;
}
```

Also update the existing import line (line 5) to include the new types:
```typescript
import type { TeamProfile, RadarMetrics, TeamOverall, OddsEntry, GroupData, StrategyData, RecentFormData } from "@/types/team";
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd my-world-cup && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add my-world-cup/src/lib/data.ts
git commit -m "feat: add data loading functions for strategy, recent form, and odds"
```

---

### Task 6: OddsCompare Component

**Files:**
- Create: `my-world-cup/src/components/OddsCompare.tsx`

- [ ] **Step 1: Create the component**

```tsx
// my-world-cup/src/components/OddsCompare.tsx
"use client";

import type { OddsEntry } from "@/types/team";
import type { H2HOdds } from "@/lib/h2h-odds";
import { calculateH2HOdds } from "@/lib/h2h-odds";

interface OddsCompareProps {
  oddsA: OddsEntry;
  oddsB: OddsEntry;
  nameA: string;
  nameB: string;
}

export function OddsCompare({ oddsA, oddsB, nameA, nameB }: OddsCompareProps) {
  const h2h = calculateH2HOdds(oddsA, oddsB);

  const verdict =
    Math.abs(h2h.probWinA - h2h.probWinB) < 0.08
      ? "赔率接近，势均力敌"
      : h2h.probWinA > h2h.probWinB
        ? `博彩机构更看好 ${nameA}`
        : `博彩机构更看好 ${nameB}`;

  return (
    <div className="bg-white rounded-lg border border-[#eef0f3] p-4">
      <h4 className="text-xs font-bold text-[#1a1a2e] mb-3 flex items-center gap-1.5">
        📊 赔率对比
      </h4>

      {/* Probability bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-[#e53e3e] font-medium">{nameA} {(h2h.probWinA * 100).toFixed(0)}%</span>
          <span className="text-gray-500">平局 {(h2h.probDraw * 100).toFixed(0)}%</span>
          <span className="text-[#3182ce] font-medium">{nameB} {(h2h.probWinB * 100).toFixed(0)}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden flex bg-gray-100">
          <div className="bg-[#e53e3e] transition-all duration-500" style={{ width: `${h2h.probWinA * 100}%` }} />
          <div className="bg-gray-300 transition-all duration-500" style={{ width: `${h2h.probDraw * 100}%` }} />
          <div className="bg-[#3182ce] transition-all duration-500" style={{ width: `${h2h.probWinB * 100}%` }} />
        </div>
      </div>

      {/* Odds table */}
      <div className="space-y-1.5 text-[11px]">
        <OddsRow label="胜" oddsLeft={h2h.winA} oddsRight={h2h.winB} />
        <OddsRow label="平" oddsLeft={h2h.draw} oddsRight={h2h.draw} />
        <OddsRow label="负" oddsLeft={h2h.winB} oddsRight={h2h.winA} />
      </div>

      {/* Verdict */}
      <p className="text-[10px] text-gray-500 mt-3 text-center italic">{verdict}</p>
    </div>
  );
}

function OddsRow({ label, oddsLeft, oddsRight }: { label: string; oddsLeft: number; oddsRight: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-5 text-gray-400 shrink-0">{label}</span>
      <span className={`flex-1 text-right font-medium ${oddsLeft < oddsRight ? "text-[#e53e3e]" : "text-[#1a1a2e]"}`}>
        {oddsLeft.toFixed(2)}
      </span>
      <span className="w-6 text-center text-gray-300 shrink-0">—</span>
      <span className={`flex-1 text-left font-medium ${oddsRight < oddsLeft ? "text-[#3182ce]" : "text-[#1a1a2e]"}`}>
        {oddsRight.toFixed(2)}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add my-world-cup/src/components/OddsCompare.tsx
git commit -m "feat: add OddsCompare card component"
```

---

### Task 7: RecentForm Component

**Files:**
- Create: `my-world-cup/src/components/RecentForm.tsx`

- [ ] **Step 1: Create the component**

```tsx
// my-world-cup/src/components/RecentForm.tsx
"use client";

import type { RecentFormData } from "@/types/team";

interface RecentFormProps {
  formA: RecentFormData;
  formB: RecentFormData;
  nameA: string;
  nameB: string;
}

const RESULT_COLORS: Record<string, string> = {
  W: "#38a169",
  D: "#a0aec0",
  L: "#e53e3e",
};

function getStatusLabel(winRate: number): string {
  if (winRate >= 0.65) return "状态火热";
  if (winRate >= 0.4) return "状态平稳";
  return "状态低迷";
}

function getStatusColor(winRate: number): string {
  if (winRate >= 0.65) return "#38a169";
  if (winRate >= 0.4) return "#d69e2e";
  return "#e53e3e";
}

export function RecentForm({ formA, formB, nameA, nameB }: RecentFormProps) {
  const winRateA = formA.summary.wins / 10;
  const winRateB = formB.summary.wins / 10;
  const avgGfA = formA.summary.goals_scored / 10;
  const avgGfB = formB.summary.goals_scored / 10;
  const avgGaA = formA.summary.goals_conceded / 10;
  const avgGaB = formB.summary.goals_conceded / 10;

  return (
    <div className="bg-white rounded-lg border border-[#eef0f3] p-4">
      <h4 className="text-xs font-bold text-[#1a1a2e] mb-3 flex items-center gap-1.5">
        📈 近期战绩
      </h4>

      {/* Form dots */}
      <div className="space-y-1.5 mb-3">
        <FormDots records={formA.last_10} name={nameA} />
        <FormDots records={formB.last_10} name={nameB} />
      </div>

      {/* Stats comparison */}
      <div className="space-y-1.5 text-[11px]">
        <StatRow
          label="胜率"
          valA={`${(winRateA * 100).toFixed(0)}%`}
          valB={`${(winRateB * 100).toFixed(0)}%`}
          highlight={winRateA > winRateB ? "A" : winRateA < winRateB ? "B" : "none"}
        />
        <StatRow
          label="场均进球"
          valA={avgGfA.toFixed(1)}
          valB={avgGfB.toFixed(1)}
          highlight={avgGfA > avgGfB ? "A" : avgGfA < avgGfB ? "B" : "none"}
        />
        <StatRow
          label="场均失球"
          valA={avgGaA.toFixed(1)}
          valB={avgGaB.toFixed(1)}
          highlight={avgGaA < avgGaB ? "A" : avgGaA > avgGaB ? "B" : "none"}
        />
      </div>

      {/* Status label */}
      <div className="flex items-center justify-between mt-3 text-[10px]">
        <span style={{ color: getStatusColor(winRateA) }}>{nameA} {getStatusLabel(winRateA)}</span>
        <span style={{ color: getStatusColor(winRateB) }}>{nameB} {getStatusLabel(winRateB)}</span>
      </div>
    </div>
  );
}

function FormDots({ records, name }: { records: RecentFormData["last_10"]; name: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-gray-500 w-12 shrink-0 truncate">{name}</span>
      <div className="flex gap-[3px]">
        {records.map((r, i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full inline-block"
            style={{ backgroundColor: RESULT_COLORS[r.result] }}
            title={`${r.opponent} ${r.score}`}
          />
        ))}
      </div>
    </div>
  );
}

function StatRow({ label, valA, valB, highlight }: {
  label: string; valA: string; valB: string; highlight: "A" | "B" | "none";
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 text-right font-medium" style={{ color: highlight === "A" ? "#e53e3e" : "#1a1a2e" }}>{valA}</span>
      <span className="w-12 text-center text-gray-400 shrink-0">{label}</span>
      <span className="flex-1 text-left font-medium" style={{ color: highlight === "B" ? "#3182ce" : "#1a1a2e" }}>{valB}</span>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add my-world-cup/src/components/RecentForm.tsx
git commit -m "feat: add RecentForm card component"
```

---

### Task 8: TacticsAnalysis Component

**Files:**
- Create: `my-world-cup/src/components/TacticsAnalysis.tsx`

- [ ] **Step 1: Create the component**

```tsx
// my-world-cup/src/components/TacticsAnalysis.tsx
"use client";

import type { RadarMetrics } from "@/types/team";
import type { StrategyData } from "@/types/team";
import type { TacticalStyle } from "@/lib/tactics";
import { determineTacticsMatchup, STYLE_LABELS } from "@/lib/tactics";

interface TacticsAnalysisProps {
  strategyA: StrategyData;
  strategyB: StrategyData;
  metricsA: RadarMetrics;
  metricsB: RadarMetrics;
  nameA: string;
  nameB: string;
}

const STYLE_COLORS: Record<TacticalStyle, string> = {
  possession: "#3182ce",
  counter_attack: "#ed8936",
  pressing: "#e53e3e",
  balanced: "#718096",
  defensive: "#805ad5",
};

export function TacticsAnalysis({ strategyA, strategyB, metricsA, metricsB, nameA, nameB }: TacticsAnalysisProps) {
  const matchup = determineTacticsMatchup(
    strategyA.style as TacticalStyle,
    strategyB.style as TacticalStyle
  );

  // 战术匹配度文字：基于控球与逼抢强度推断
  const controlDiff = metricsA.control - metricsB.control;
  const attackDiff = metricsA.attack - metricsB.attack;
  let matchInsight = "";
  if (Math.abs(controlDiff) > 10) {
    const stronger = controlDiff > 0 ? nameA : nameB;
    matchInsight = `${stronger}控球优势明显，预计掌控比赛节奏`;
  } else if (Math.abs(attackDiff) > 10) {
    const stronger = attackDiff > 0 ? nameA : nameB;
    matchInsight = `${stronger}进攻火力占优，对手防线压力大`;
  } else {
    matchInsight = "双方实力接近，中场争夺将是关键";
  }

  return (
    <div className="bg-white rounded-lg border border-[#eef0f3] p-4">
      <h4 className="text-xs font-bold text-[#1a1a2e] mb-3 flex items-center gap-1.5">
        ⚔️ 战术分析
      </h4>

      {/* Formation display */}
      <div className="flex items-center justify-between mb-3 text-[11px]">
        <div className="text-center flex-1">
          <p className="font-bold text-[#1a1a2e]">{strategyA.formation}</p>
          <span
            className="inline-block px-2 py-0.5 rounded-full text-[9px] font-medium text-white mt-1"
            style={{ backgroundColor: STYLE_COLORS[strategyA.style as TacticalStyle] }}
          >
            {STYLE_LABELS[strategyA.style as TacticalStyle]}
          </span>
        </div>
        <span className="text-gray-300 text-xs mx-2">vs</span>
        <div className="text-center flex-1">
          <p className="font-bold text-[#1a1a2e]">{strategyB.formation}</p>
          <span
            className="inline-block px-2 py-0.5 rounded-full text-[9px] font-medium text-white mt-1"
            style={{ backgroundColor: STYLE_COLORS[strategyB.style as TacticalStyle] }}
          >
            {STYLE_LABELS[strategyB.style as TacticalStyle]}
          </span>
        </div>
      </div>

      {/* Counter relationship */}
      <div className="bg-[#f7f8fa] rounded-lg p-2.5 mb-2">
        {matchup.hasCounter ? (
          <>
            <p className="text-[11px] font-medium" style={{ color: "#38a169" }}>
              {matchup.description}
            </p>
            <p className="text-[10px] text-gray-500 mt-1">
              预计影响 ±{(matchup.advantage * 100).toFixed(0)}% 胜率
            </p>
          </>
        ) : (
          <p className="text-[11px] text-gray-500">{matchup.description}</p>
        )}
      </div>

      {/* Tactical insight */}
      <p className="text-[10px] text-gray-600 leading-relaxed">{matchInsight}</p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add my-world-cup/src/components/TacticsAnalysis.tsx
git commit -m "feat: add TacticsAnalysis card component"
```

---

### Task 9: Integration

**Files:**
- Modify: `my-world-cup/src/components/H2HClient.tsx`
- Modify: `my-world-cup/src/app/h2h/page.tsx`

- [ ] **Step 1: Update `page.tsx` to load and pass new data**

Replace the entire file content of `my-world-cup/src/app/h2h/page.tsx` with:

```tsx
import { getAllTeamsWithRadar, getStrategiesMap, getRecentFormsMap, getOddsMap } from "@/lib/data";
import { H2HClient } from "@/components/H2HClient";

export default function H2HPage() {
  const { teams, radarMap } = getAllTeamsWithRadar();
  const strategyMap = getStrategiesMap();
  const formMap = getRecentFormsMap();
  const oddsMap = getOddsMap();

  return (
    <div className="bg-[#f7f8fa] min-h-screen flex flex-col">
      <H2HClient data={{ teams, radarMap, strategyMap, formMap, oddsMap }} />
    </div>
  );
}
```

- [ ] **Step 2: Update `H2HClient.tsx` to integrate three new components**

Replace the entire file content of `my-world-cup/src/components/H2HClient.tsx` with:

```tsx
"use client";

import { useState, useMemo } from "react";
import type { H2HPageData, SimulationResult, TeamMatchData } from "@/types/simulation";
import { TeamSelect } from "./TeamSelect";
import { RadarCompareChart } from "./RadarCompareChart";
import { TeamInfoCard } from "./TeamInfoCard";
import { OddsCompare } from "./OddsCompare";
import { RecentForm } from "./RecentForm";
import { TacticsAnalysis } from "./TacticsAnalysis";
import { MatchResult } from "./MatchResult";
import { simulateMatch } from "@/lib/simulation";

interface H2HClientProps {
  data: H2HPageData;
}

export function H2HClient({ data }: H2HClientProps) {
  const { teams, radarMap, strategyMap, formMap, oddsMap } = data;
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
    setResult(simulateMatch(teamA, teamB));
  }

  function handleResimulate() {
    if (!teamA || !teamB) return;
    setResult(simulateMatch(teamA, teamB));
  }

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
      </div>

      {/* Step 2: Pre-match comparison */}
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

          {/* Pre-match deep analysis */}
          <div className="mb-4">
            <h2 className="text-[15px] font-bold text-[#1a1a2e] mb-3">赛前深度分析</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <OddsCompare
                oddsA={oddsMap[teamA.profile.team_name_en]}
                oddsB={oddsMap[teamB.profile.team_name_en]}
                nameA={teamA.profile.team_name}
                nameB={teamB.profile.team_name}
              />
              <RecentForm
                formA={formMap[teamA.profile.team_name_en]}
                formB={formMap[teamB.profile.team_name_en]}
                nameA={teamA.profile.team_name}
                nameB={teamB.profile.team_name}
              />
              <TacticsAnalysis
                strategyA={strategyMap[teamA.profile.team_name_en]}
                strategyB={strategyMap[teamB.profile.team_name_en]}
                metricsA={teamA.metrics}
                metricsB={teamB.metrics}
                nameA={teamA.profile.team_name}
                nameB={teamB.profile.team_name}
              />
            </div>
          </div>

          {/* Simulate button */}
          <div className="flex justify-center mb-4">
            <button
              onClick={handleSimulate}
              className="px-6 py-2.5 bg-[#e53e3e] text-white text-sm font-semibold rounded-lg hover:bg-[#c53030] transition-colors active:scale-95"
            >
              ⚽ 开始模拟
            </button>
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

- [ ] **Step 3: Run all tests**

Run: `cd my-world-cup && npx vitest run`
Expected: All tests PASS (existing + new h2h-odds + tactics tests)

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd my-world-cup && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add my-world-cup/src/
git commit -m "feat: integrate pre-match analysis cards into H2H page"
```

---

### Task 10: End-to-End Verification

- [ ] **Step 1: Start dev server**

Run: `cd my-world-cup && npm run dev`
Expected: Server starts on http://localhost:3000

- [ ] **Step 2: Verify H2H page**

1. Open http://localhost:3000/h2h
2. Select two teams (e.g., Argentina vs France)
3. Verify: Radar chart + Team info cards appear (existing)
4. Verify: Three new cards appear below team info — "赔率对比", "近期战绩", "战术分析"
5. Click "开始模拟"
6. Verify: Match result appears below

- [ ] **Step 3: Verify responsive layout**

1. Resize browser to mobile width (< 768px)
2. Verify: Three analysis cards stack vertically
3. Resize back to desktop
4. Verify: Three cards sit side-by-side in 3-column grid

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete H2H pre-match deep analysis feature"
```
