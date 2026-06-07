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
