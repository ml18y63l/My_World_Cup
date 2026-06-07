import type { OddsEntry } from "@/types/team";

export interface H2HOdds {
  winA: number;
  draw: number;
  winB: number;
  probWinA: number;
  probDraw: number;
  probWinB: number;
}

export function calculateH2HOdds(oddsA: OddsEntry, oddsB: OddsEntry): H2HOdds {
  const impWinA = 1 / oddsA.win_odds_base;
  const impWinB = 1 / oddsB.win_odds_base;

  const totalWin = impWinA + impWinB;
  const relProbA = impWinA / totalWin;
  const relProbB = impWinB / totalWin;

  const strengthRatio = Math.min(impWinA, impWinB) / Math.max(impWinA, impWinB);
  const drawBoost = strengthRatio * 0.25;
  const rawDraw = 0.08 + drawBoost;

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