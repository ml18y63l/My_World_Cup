// src/lib/data.ts

import fs from "fs";
import path from "path";
import type { TeamProfile, RadarMetrics, TeamOverall, OddsEntry, GroupData, StrategyData, RecentFormData, SquadData, TeamPageData } from "@/types/team";
import type { H2HPageData } from "@/types/simulation";
import { GROUP_COLORS } from "@/types/team";
import { calculateOverallScore } from "./score";

const DB_DIR = path.join(process.cwd(), "database", "2_ability_models");

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
  return profiles.map((profile) => {
    const radar = getRadarData(profile.team_name_en);
    const overall_score = radar ? calculateOverallScore(radar) : 0;
    return { ...profile, overall_score };
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
  return { profile, radar, squad, form, overall_score };
}
