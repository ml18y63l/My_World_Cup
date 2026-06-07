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