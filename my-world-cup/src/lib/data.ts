// src/lib/data.ts

import fs from "fs";
import path from "path";
import type { TeamProfile, RadarMetrics, TeamOverall, OddsEntry, GroupData } from "@/types/team";
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
 * 格式化身价值
 */
export function formatValue(valueM: number): string {
  if (valueM >= 1000) {
    return `€${(valueM / 1000).toFixed(1)}B`;
  }
  return `€${valueM}M`;
}
