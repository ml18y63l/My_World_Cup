// src/types/team.ts

export interface TeamProfile {
  team_id: string;
  team_name: string;
  team_name_en: string;
  confederation: string;
  head_coach: string;
  total_value_m_euros: number;
  fifa_ranking: number;
  base_formation?: string;
  country_code: string;
  group: string;
  qualification?: string;
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
  /** true = 尚未录入真实数据（占位），概览页据此将其能力值置灰 */
  is_placeholder?: boolean;
}

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
  date?: string;
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
  /** true 表示该球队尚未录入真实数据（缺大名单/战绩，或雷达与 deriveRadar 不一致），页面为占位数据 */
  is_placeholder: boolean;
}

export const BAR_GRADIENTS = [
  "linear-gradient(90deg, #e53e3e, #fc8181)",
  "linear-gradient(90deg, #3182ce, #90cdf4)",
  "linear-gradient(90deg, #38a169, #9ae6b4)",
  "linear-gradient(90deg, #d69e2e, #fefcbf)",
  "linear-gradient(90deg, #805ad5, #d6bcfa)",
];