// src/lib/data.ts

import fs from "fs";
import path from "path";
import type { TeamProfile, RadarMetrics, TeamOverall, OddsEntry, GroupData, StrategyData, RecentFormData, SquadData, TeamPageData } from "@/types/team";
import type { H2HPageData } from "@/types/simulation";
import type { GroupStageData, KnockoutStageData } from "@/types/tournament";
import { GROUP_COLORS } from "@/types/team";
import { calculateOverallScore } from "./score";
import { deriveRadar } from "./deriveRadar";

const DB_DIR = path.join(process.cwd(), "database", "2_ability_models");
const TOURNAMENT_DIR = path.join(process.cwd(), "database");

/**
 * 读取所有球队的 profile.json
 */
export function getAllTeamProfiles(): TeamProfile[] {
  const entries = fs.readdirSync(DB_DIR, { withFileTypes: true });
  const teams: TeamProfile[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const profilePath = path.join(DB_DIR, entry.name, "profile.json");
    if (fs.existsSync(profilePath)) {
      const raw = fs.readFileSync(profilePath, "utf-8");
      teams.push(JSON.parse(raw));
    }
  }

  return teams;
}

/**
 * 读取指定球队的 radar_data.json
 */
export function getRadarData(teamNameEn: string): RadarMetrics | null {
  const filePath = path.join(DB_DIR, teamNameEn, "radar_data.json");
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

/**
 * 获取所有球队的综合数据 (profile + overall_score)
 */
export function getAllTeamsWithOverall(): TeamOverall[] {
  const profiles = getAllTeamProfiles();
  const formMap = getRecentFormsMap();
  return profiles.map((profile) => {
    const radar = getRadarData(profile.team_name_en);
    const squad = getSquad(profile.team_name_en);
    const form = formMap[profile.team_name_en] ?? null;
    const overall_score = radar ? calculateOverallScore(radar) : 0;
    const is_placeholder = !hasRealData(squad, form, radar);
    return { ...profile, overall_score, is_placeholder };
  });
}

/**
 * 按分组组织球队数据
 */
export function getGroupsData(): GroupData[] {
  const teams = getAllTeamsWithOverall();
  const groupOrder = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  const groups: GroupData[] = [];

  for (const g of groupOrder) {
    const groupTeams = teams
      .filter((t) => t.group === g)
      .sort((a, b) => b.overall_score - a.overall_score);
    groups.push({
      group_name: g,
      color: GROUP_COLORS[g],
      teams: groupTeams,
    });
  }

  return groups;
}

/**
 * 读取夺冠赔率数据
 */
export function getOddsData(): OddsEntry[] {
  const filePath = path.join(DB_DIR, "odds.json");
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

/**
 * 读取所有球队的 strategy.json，返回以 team_name_en 为键的 Map
 */
export function getStrategiesMap(): Record<string, StrategyData> {
  const entries = fs.readdirSync(DB_DIR, { withFileTypes: true });
  const map: Record<string, StrategyData> = {};

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const filePath = path.join(DB_DIR, entry.name, "strategy.json");
    if (fs.existsSync(filePath)) {
      const data: StrategyData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const profilePath = path.join(DB_DIR, entry.name, "profile.json");
      if (fs.existsSync(profilePath)) {
        const profile: TeamProfile = JSON.parse(fs.readFileSync(profilePath, "utf-8"));
        map[profile.team_name_en] = data;
      }
    }
  }

  return map;
}

/**
 * 读取所有球队的 recent_form.json，返回以 team_name_en 为键的 Map
 */
export function getRecentFormsMap(): Record<string, RecentFormData> {
  const entries = fs.readdirSync(DB_DIR, { withFileTypes: true });
  const map: Record<string, RecentFormData> = {};

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const filePath = path.join(DB_DIR, entry.name, "recent_form.json");
    if (fs.existsSync(filePath)) {
      const data: RecentFormData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const profilePath = path.join(DB_DIR, entry.name, "profile.json");
      if (fs.existsSync(profilePath)) {
        const profile: TeamProfile = JSON.parse(fs.readFileSync(profilePath, "utf-8"));
        map[profile.team_name_en] = data;
      }
    }
  }

  return map;
}

/**
 * 读取赔率数据，返回以 team_name_en 为键的 Map
 */
export function getOddsMap(): Record<string, OddsEntry> {
  const oddsList = getOddsData();
  const map: Record<string, OddsEntry> = {};
  for (const entry of oddsList) {
    map[entry.team_name_en] = entry;
  }
  return map;
}

/**
 * 格式化身价值
 */
export function formatValue(valueM: number): string {
  if (valueM >= 1000) {
    return `€${(valueM / 1000).toFixed(1)}B`;
  }
  return `€${valueM}M`;
}

/**
 * 获取所有球队的完整数据（profile + radar），用于对阵模拟页面
 */
export function getAllTeamsWithRadar(): H2HPageData {
  const profiles = getAllTeamProfiles();
  const teams = profiles.map((profile) => {
    const radar = getRadarData(profile.team_name_en);
    const overall_score = radar ? calculateOverallScore(radar) : 0;
    return { ...profile, overall_score };
  });

  const radarMap: Record<string, RadarMetrics> = {};
  for (const profile of profiles) {
    const radar = getRadarData(profile.team_name_en);
    if (radar) {
      radarMap[profile.team_name_en] = radar;
    }
  }

  const strategyMap = getStrategiesMap();
  const formMap = getRecentFormsMap();
  const oddsMap = getOddsMap();

  return { teams, radarMap, strategyMap, formMap, oddsMap };
}

/**
 * 读取指定球队的 squad.json（按 team_name_en 目录）
 */
export function getSquad(teamNameEn: string): SquadData | null {
  const filePath = path.join(DB_DIR, teamNameEn, "squad.json");
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

/**
 * 判断球队是否已录入真实数据：需同时具备大名单、战绩、雷达，
 * 且 deriveRadar(squad, form) 与已发布雷达一致。占位/模板数据
 * （缺文件，或未按方法论推导）会无法通过一致性校验，视为占位。
 */
function hasRealData(squad: SquadData | null, form: RecentFormData | null, radar: RadarMetrics | null): boolean {
  if (!squad || squad.players.length === 0 || !form || !radar) return false;
  const derived = deriveRadar(squad, form);
  return (
    derived.attack === radar.attack &&
    derived.defense === radar.defense &&
    derived.control === radar.control &&
    derived.status === radar.status &&
    derived.experience === radar.experience &&
    derived.place_kick === radar.place_kick &&
    derived.superstar === radar.superstar &&
    derived.penalty === radar.penalty
  );
}

/**
 * 按 team_id 取整页数据（profile + radar + squad + form + overall）
 */
export function getTeamPageData(teamId: string): TeamPageData | null {
  const profiles = getAllTeamProfiles();
  const profile = profiles.find((p) => p.team_id === teamId);
  if (!profile) return null;
  const radar = getRadarData(profile.team_name_en);
  const squad = getSquad(profile.team_name_en);
  const formMap = getRecentFormsMap();
  const form = formMap[profile.team_name_en] ?? null;
  const overall_score = radar ? calculateOverallScore(radar) : 0;
  const is_placeholder = !hasRealData(squad, form, radar);
  return { profile, radar, squad, form, overall_score, is_placeholder };
}

/**
 * team_name_en -> profile 的查找表（用于给赛事数据补上中文名 / 旗帜 / 跳转 id）
 */
function getProfileByEnMap(): Record<string, TeamProfile> {
  const profiles = getAllTeamProfiles();
  const map: Record<string, TeamProfile> = {};
  for (const p of profiles) map[p.team_name_en] = p;
  return map;
}

const EMPTY_GROUP_STAGE: GroupStageData = {
  tournament: "",
  rounds_complete: 0,
  total_rounds: 3,
  updated_through_date: "",
  source: "",
  note: "",
  groups: [],
};

const EMPTY_KNOCKOUT: KnockoutStageData = {
  tournament: "",
  started: false,
  note: "",
  format: "",
  third_place_count: 8,
  rounds: [],
};

/**
 * 读取小组赛数据（积分榜 + 赛果），并关联 profile 的中文名 / 旗帜 / team_id
 */
export function getGroupStageData(): GroupStageData {
  const filePath = path.join(TOURNAMENT_DIR, "group_stage.json");
  if (!fs.existsSync(filePath)) return EMPTY_GROUP_STAGE;
  const data: GroupStageData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const profileMap = getProfileByEnMap();
  for (const g of data.groups) {
    g.standings = g.standings.map((row) => {
      const p = profileMap[row.team_name_en];
      return {
        ...row,
        team_name: p?.team_name,
        team_id: p?.team_id,
        country_code: p?.country_code,
      };
    });
  }
  return data;
}

/**
 * 读取淘汰赛对阵框架，并关联 profile（小组赛未结束，球队均为空）
 */
export function getKnockoutStageData(): KnockoutStageData {
  const filePath = path.join(TOURNAMENT_DIR, "knockout_stage.json");
  if (!fs.existsSync(filePath)) return EMPTY_KNOCKOUT;
  const data: KnockoutStageData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const profileMap = getProfileByEnMap();
  for (const round of data.rounds) {
    round.ties = round.ties.map((tie) => {
      const h = tie.home_team ? profileMap[tie.home_team] : undefined;
      const a = tie.away_team ? profileMap[tie.away_team] : undefined;
      return {
        ...tie,
        home_team_name: h?.team_name,
        away_team_name: a?.team_name,
        home_country_code: h?.country_code,
        away_country_code: a?.country_code,
      };
    });
  }
  return data;
}
