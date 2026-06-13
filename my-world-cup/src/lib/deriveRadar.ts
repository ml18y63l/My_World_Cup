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
