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

  return DIMENSION_META.map((dim) => {
    const valA = metricsA[dim.key];
    const valB = metricsB[dim.key];
    const diffVal = (valA - valB) * dim.weight;
    const contributionPct = maxWeighted > 0
      ? Math.round((diffVal / maxWeighted) * 100)
      : 0;

    const absPct = Math.abs(contributionPct);
    const favorTeam: "A" | "B" | "neutral" =
      contributionPct > 0 ? "A" : contributionPct < 0 ? "B" : "neutral";

    const contribution =
      absPct === 0
        ? `${dim.label}相当，无明显优势`
        : `${dim.label}权重 ×${dim.weight}，${favorTeam === "A" ? "主队" : "客队"}${contributionPct > 0 ? "+" : "-"}${absPct}% 胜率贡献`;

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
  const rawWinRateA = 0.5 + scoreDiff * 2.0;
  // 实力越接近，平局概率越高（系数 0.08 保证 evenly matched 时双方胜率 > 0.3）
  const rawDrawRate = 0.15 + (1 - Math.abs(scoreDiff)) * 0.08;

  // 先 clamp 胜率 A，然后用剩余空间分配平局和 B 胜率
  const clampedWinA = Math.max(0.05, Math.min(0.85, rawWinRateA));
  const remainingAfterA = 1 - clampedWinA;
  const clampedDraw = Math.max(0.05, Math.min(remainingAfterA * 0.35, rawDrawRate));
  const clampedWinB = Math.max(0.05, remainingAfterA - clampedDraw);

  // 归一化确保总和严格等于 1.0
  const total = clampedWinA + clampedDraw + clampedWinB;
  const baseWinRateA = clampedWinA / total;
  const baseDrawRate = clampedDraw / total;
  const baseWinRateB = clampedWinB / total;

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
    baseWinRateA,
    baseDrawRate,
    baseWinRateB,
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
