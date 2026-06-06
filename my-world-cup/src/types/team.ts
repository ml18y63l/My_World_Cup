// src/types/team.ts

export interface TeamProfile {
  team_id: string;
  team_name: string;
  team_name_en: string;
  confederation: string;
  head_coach: string;
  total_value_m_euros: number;
  fifa_ranking: number;
  base_formation: string;
  country_code: string;
  group: string;
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
}

export interface OddsEntry {
  team_id: string;
  team_name: string;
  team_name_en: string;
  country_code: string;
  odds: number;
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

export const BAR_GRADIENTS = [
  "linear-gradient(90deg, #e53e3e, #fc8181)",
  "linear-gradient(90deg, #3182ce, #90cdf4)",
  "linear-gradient(90deg, #38a169, #9ae6b4)",
  "linear-gradient(90deg, #d69e2e, #fefcbf)",
  "linear-gradient(90deg, #805ad5, #d6bcfa)",
];