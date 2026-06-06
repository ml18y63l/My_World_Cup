// src/lib/score.ts

import type { RadarMetrics } from "@/types/team";

/**
 * 计算八维雷达指标的算术平均值作为综合评分
 */
export function calculateOverallScore(metrics: RadarMetrics): number {
  const values = Object.values(metrics);
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / values.length) * 10) / 10;
}
