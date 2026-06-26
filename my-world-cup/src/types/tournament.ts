// src/types/tournament.ts

/** 小组赛积分榜单行 */
export interface GroupStandingRow {
  pos: number;
  team_name_en: string;
  /** 展示用：由 profile 关联填充（见 lib/data.ts） */
  team_name?: string;
  team_id?: string;
  country_code?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

/** 单场小组赛赛果（已完赛） */
export interface GroupMatch {
  matchday: 1 | 2 | 3;
  date: string; // YYYY-MM-DD
  home: string; // team_name_en
  away: string; // team_name_en
  home_goals: number;
  away_goals: number;
  /**
   * cited   = 直接引用权威来源的比分；
   * confirmed = 由独立头条来源交叉确认；
   * derived  = 由官方积分榜进/失球总数唯一还原。
   */
  source: "cited" | "confirmed" | "derived";
}

export interface GroupStageGroup {
  group: string;
  updated_through_date: string;
  standings: GroupStandingRow[];
  matches: GroupMatch[];
}

export interface GroupStageData {
  tournament: string;
  rounds_complete: number;
  total_rounds: number;
  updated_through_date: string;
  source: string;
  note: string;
  groups: GroupStageGroup[];
}

/** 淘汰赛单场对阵 */
export interface KnockoutTie {
  id: string;
  match: number; // FIFA 官方比赛编号
  home_slot: string; // 抽签位置描述，如 "A组第1"、"M74胜者"
  away_slot: string;
  home_team: string | null; // team_name_en，未确定时为 null
  away_team: string | null;
  home_goals: number | null;
  away_goals: number | null;
  played: boolean;
  /** 展示用：由 profile 关联填充 */
  home_team_name?: string;
  away_team_name?: string;
  home_country_code?: string;
  away_country_code?: string;
}

export interface KnockoutRound {
  round: string;
  label: string;
  ties: KnockoutTie[];
}

export interface KnockoutStageData {
  tournament: string;
  started: boolean;
  note: string;
  format: string;
  third_place_count: number;
  rounds: KnockoutRound[];
}
