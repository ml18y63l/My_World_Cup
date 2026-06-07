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
