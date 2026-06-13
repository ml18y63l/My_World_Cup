import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { deriveRadar } from "../deriveRadar";
import type { SquadData, RecentFormData } from "@/types/team";

// ---- 内联巴西算例（与真实数据数值一致）----
const brazilSquad: SquadData = {
  team_id: "BRA",
  players: [
    { number: 1, position: "GK", name_cn: "阿利森", name_en: "Alisson", caps: 78, goals: 0, assists: null, club_cn: "利物浦", club_en: "Liverpool", value_wan_euros: 1500, preferred_position: "GK" },
    { number: 2, position: "MF", name_cn: "埃德森·席尔瓦", name_en: "Éderson Silva", caps: 3, goals: 0, assists: 0, club_cn: "亚特兰大", club_en: "Atalanta", value_wan_euros: 4500, preferred_position: "MF" },
    { number: 3, position: "DF", name_cn: "加布里埃尔", name_en: "Gabriel", caps: 17, goals: 1, assists: 0, club_cn: "阿森纳", club_en: "Arsenal", value_wan_euros: 7500, preferred_position: "DF" },
    { number: 4, position: "DF", name_cn: "马尔基尼奥斯", name_en: "Marquinhos", caps: 105, goals: 7, assists: 4, club_cn: "巴黎", club_en: "PSG", value_wan_euros: 2800, preferred_position: "DF" },
    { number: 5, position: "MF", name_cn: "卡塞米罗", name_en: "Casemiro", caps: 86, goals: 9, assists: 5, club_cn: "曼联", club_en: "Man Utd", value_wan_euros: 600, preferred_position: "MF" },
    { number: 6, position: "DF", name_cn: "阿莱士·桑德罗", name_en: "Alex Sandro", caps: 45, goals: 2, assists: 0, club_cn: "弗拉门戈", club_en: "Flamengo", value_wan_euros: 100, preferred_position: "DF" },
    { number: 7, position: "FW", name_cn: "维尼修斯", name_en: "Vinícius", caps: 49, goals: 9, assists: 9, club_cn: "皇马", club_en: "Real Madrid", value_wan_euros: 14000, preferred_position: "FW" },
    { number: 8, position: "MF", name_cn: "布鲁诺", name_en: "Bruno", caps: 43, goals: 3, assists: 8, club_cn: "纽卡", club_en: "Newcastle", value_wan_euros: 7000, preferred_position: "MF" },
    { number: 9, position: "FW", name_cn: "库尼亚", name_en: "Cunha", caps: 23, goals: 1, assists: 2, club_cn: "曼联", club_en: "Man Utd", value_wan_euros: 7500, preferred_position: "FW" },
    { number: 10, position: "FW", name_cn: "内马尔", name_en: "Neymar", caps: 128, goals: 79, assists: 59, club_cn: "桑托斯", club_en: "Santos", value_wan_euros: 800, preferred_position: "FW" },
    { number: 11, position: "FW", name_cn: "拉菲尼亚", name_en: "Raphinha", caps: 39, goals: 11, assists: 8, club_cn: "巴萨", club_en: "Barcelona", value_wan_euros: 7000, preferred_position: "FW" },
    { number: 12, position: "GK", name_cn: "韦弗顿", name_en: "Weverton", caps: 11, goals: 0, assists: null, club_cn: "格雷米奥", club_en: "Grêmio", value_wan_euros: 70, preferred_position: "GK" },
    { number: 13, position: "DF", name_cn: "达尼洛", name_en: "Danilo", caps: 70, goals: 1, assists: 6, club_cn: "弗拉门戈", club_en: "Flamengo", value_wan_euros: 200, preferred_position: "DF" },
    { number: 14, position: "DF", name_cn: "布雷默", name_en: "Bremer", caps: 8, goals: 1, assists: 0, club_cn: "尤文", club_en: "Juventus", value_wan_euros: 3500, preferred_position: "DF" },
    { number: 15, position: "DF", name_cn: "莱奥", name_en: "Léo", caps: 4, goals: 0, assists: 0, club_cn: "弗拉门戈", club_en: "Flamengo", value_wan_euros: 1200, preferred_position: "DF" },
    { number: 16, position: "DF", name_cn: "道格拉斯", name_en: "Douglas", caps: 7, goals: 0, assists: 1, club_cn: "泽尼特", club_en: "Zenit", value_wan_euros: 750, preferred_position: "DF" },
    { number: 17, position: "MF", name_cn: "法比尼奥", name_en: "Fabinho", caps: 33, goals: 0, assists: 1, club_cn: "吉达联合", club_en: "Al-Ittihad", value_wan_euros: 1200, preferred_position: "MF" },
    { number: 18, position: "MF", name_cn: "达尼洛·桑", name_en: "Danilo S.", caps: 4, goals: 2, assists: 0, club_cn: "博塔弗戈", club_en: "Botafogo", value_wan_euros: 3200, preferred_position: "MF" },
    { number: 19, position: "FW", name_cn: "恩德里克", name_en: "Endrick", caps: 17, goals: 4, assists: 2, club_cn: "里昂", club_en: "Lyon", value_wan_euros: 4000, preferred_position: "FW" },
    { number: 20, position: "MF", name_cn: "帕奎塔", name_en: "Paquetá", caps: 63, goals: 13, assists: 8, club_cn: "弗拉门戈", club_en: "Flamengo", value_wan_euros: 3200, preferred_position: "MF" },
    { number: 21, position: "FW", name_cn: "路易斯·恩", name_en: "Luiz H.", caps: 15, goals: 2, assists: 3, club_cn: "泽尼特", club_en: "Zenit", value_wan_euros: 2400, preferred_position: "FW" },
    { number: 22, position: "FW", name_cn: "马丁内利", name_en: "Martinelli", caps: 23, goals: 4, assists: 0, club_cn: "阿森纳", club_en: "Arsenal", value_wan_euros: 4500, preferred_position: "FW" },
    { number: 23, position: "GK", name_cn: "埃德森", name_en: "Ederson", caps: 32, goals: 0, assists: null, club_cn: "费内巴切", club_en: "Fenerbahçe", value_wan_euros: 1000, preferred_position: "GK" },
    { number: 24, position: "DF", name_cn: "伊巴涅斯", name_en: "Ibañez", caps: 7, goals: 0, assists: 0, club_cn: "吉达国民", club_en: "Al-Ahli", value_wan_euros: 1800, preferred_position: "DF" },
    { number: 25, position: "FW", name_cn: "伊戈尔", name_en: "Igor", caps: 4, goals: 2, assists: 0, club_cn: "布伦特福德", club_en: "Brentford", value_wan_euros: 6500, preferred_position: "FW" },
    { number: 26, position: "FW", name_cn: "拉扬", name_en: "Rayan", caps: 2, goals: 1, assists: 0, club_cn: "伯恩茅斯", club_en: "Bournemouth", value_wan_euros: 6000, preferred_position: "FW" }
  ]
};

// 加权后：M=10.0, gf=1.80, ga=1.10, pts%=60.0
const brazilForm: RecentFormData = {
  team_id: "BRA",
  last_10: [
    { opponent: "哥伦比亚", result: "W", score: "2-1", type: "qualifier" },
    { opponent: "阿根廷", result: "L", score: "1-4", type: "qualifier" },
    { opponent: "厄瓜多尔", result: "D", score: "0-0", type: "qualifier" },
    { opponent: "巴拉圭", result: "W", score: "1-0", type: "qualifier" },
    { opponent: "智利", result: "W", score: "3-0", type: "qualifier" },
    { opponent: "玻利维亚", result: "L", score: "0-1", type: "qualifier" },
    { opponent: "韩国", result: "W", score: "5-0", type: "friendly" },
    { opponent: "日本", result: "L", score: "2-3", type: "friendly" },
    { opponent: "塞内加尔", result: "W", score: "2-0", type: "friendly" },
    { opponent: "突尼斯", result: "D", score: "1-1", type: "friendly" },
    { opponent: "法国", result: "L", score: "1-2", type: "friendly" },
    { opponent: "克罗地亚", result: "W", score: "3-1", type: "friendly" },
    { opponent: "巴拿马", result: "W", score: "6-2", type: "friendly" },
    { opponent: "埃及", result: "W", score: "2-1", type: "friendly" }
  ],
  summary: { wins: 8, draws: 2, losses: 4, goals_scored: 29, goals_conceded: 16 }
};

describe("deriveRadar - 巴西算例", () => {
  it("产出与方法论一致的 8 维分数", () => {
    const r = deriveRadar(brazilSquad, brazilForm);
    expect(r).toEqual({
      attack: 85,
      defense: 70,
      control: 83,
      status: 72,
      experience: 70,
      place_kick: 81,
      superstar: 93,
      penalty: 92,
    });
  });
});

describe("deriveRadar - 友谊赛降权", () => {
  it("全友谊赛与含正式赛均返回整数", () => {
    const allFriendly: RecentFormData = {
      ...brazilForm,
      last_10: brazilForm.last_10.map((m) => ({ ...m, type: "friendly" as const })),
    };
    const weighted = deriveRadar(brazilSquad, brazilForm).status;
    const allF = deriveRadar(brazilSquad, allFriendly).status;
    expect(Number.isInteger(weighted)).toBe(true);
    expect(Number.isInteger(allF)).toBe(true);
  });
});

describe("deriveRadar - 边界", () => {
  it("跳过未赛(score='-')的场次", () => {
    const withUpcoming: RecentFormData = {
      team_id: "BRA",
      last_10: [
        ...brazilForm.last_10,
        { opponent: "摩洛哥", result: "D", score: "-", type: "tournament" },
        { opponent: "海地", result: "D", score: "-", type: "tournament" },
      ],
      summary: { wins: 8, draws: 2, losses: 4, goals_scored: 29, goals_conceded: 16 },
    };
    expect(deriveRadar(brazilSquad, withUpcoming)).toEqual(
      deriveRadar(brazilSquad, brazilForm)
    );
  });

  it("空名单不抛错，返回钳制范围内的整数", () => {
    const r = deriveRadar({ team_id: "X", players: [] }, brazilForm);
    expect(Object.values(r).every((v) => Number.isInteger(v) && v >= 35 && v <= 95)).toBe(true);
  });
});

describe("deriveRadar - 真实文件一致性（所有有大名单的球队）", () => {
  // 扫描 database 下所有含 squad.json 的球队，断言 deriveRadar === 已发布 radar_data.json
  const teamsDir = path.join(process.cwd(), "database", "2_ability_models");
  const teams = fs
    .readdirSync(teamsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => fs.existsSync(path.join(teamsDir, name, "squad.json")));

  for (const team of teams) {
    it(`${team}: deriveRadar(真实 squad+form) === 已发布 radar_data.json`, () => {
      const base = path.join(teamsDir, team);
      const squad = JSON.parse(fs.readFileSync(path.join(base, "squad.json"), "utf-8"));
      const form = JSON.parse(fs.readFileSync(path.join(base, "recent_form.json"), "utf-8"));
      const published = JSON.parse(fs.readFileSync(path.join(base, "radar_data.json"), "utf-8"));
      expect(deriveRadar(squad, form)).toEqual(published);
    });
  }
});
