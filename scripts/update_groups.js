const fs = require('fs');
const path = require('path');

const DB_DIR = "my-world-cup/database/2_ability_models";

// ---- 新的小组分布 (team_name_en -> group) ----
const GROUP_MAP = {
  // A组
  "Mexico": "A", "South Korea": "A", "Czech Republic": "A", "South Africa": "A",
  // B组
  "Switzerland": "B", "Canada": "B", "Qatar": "B", "Bosnia and Herzegovina": "B",
  // C组
  "Brazil": "C", "Morocco": "C", "Scotland": "C", "Haiti": "C",
  // D组
  "United States": "D", "Turkey": "D", "Australia": "D", "Paraguay": "D",
  // E组
  "Germany": "E", "Ecuador": "E", "Ivory Coast": "E", "Curacao": "E",
  // F组
  "Netherlands": "F", "Japan": "F", "Sweden": "F", "Tunisia": "F",
  // G组
  "Belgium": "G", "Iran": "G", "Egypt": "G", "New Zealand": "G",
  // H组
  "Spain": "H", "Uruguay": "H", "Saudi Arabia": "H", "Cape Verde": "H",
  // I组
  "France": "I", "Senegal": "I", "Norway": "I", "Iraq": "I",
  // J组
  "Argentina": "J", "Austria": "J", "Algeria": "J", "Jordan": "J",
  // K组
  "Portugal": "K", "Colombia": "K", "DR Congo": "K", "Uzbekistan": "K",
  // L组
  "England": "L", "Croatia": "L", "Panama": "L", "Ghana": "L",
};

// ---- 13 支新增球队的基础数据 ----
const NEW_TEAMS = {
  "Bosnia and Herzegovina": { team_id: "BIH", team_name: "波黑", confederation: "UEFA", head_coach: "巴巴雷斯", total_value_m_euros: 120, fifa_ranking: 74, base_formation: "4-2-3-1", country_code: "ba", odds: 320 },
  "Haiti": { team_id: "HAI", team_name: "海地", confederation: "CONCACAF", head_coach: "加布里埃尔", total_value_m_euros: 25, fifa_ranking: 89, base_formation: "4-4-2", country_code: "ht", odds: 700 },
  "Ivory Coast": { team_id: "CIV", team_name: "科特迪瓦", confederation: "CAF", head_coach: "加塞特", total_value_m_euros: 320, fifa_ranking: 41, base_formation: "4-3-3", country_code: "ci", odds: 180 },
  "Curacao": { team_id: "CUW", team_name: "库拉索", confederation: "CONCACAF", head_coach: "比斯科普", total_value_m_euros: 20, fifa_ranking: 82, base_formation: "4-4-2", country_code: "cw", odds: 600 },
  "Egypt": { team_id: "EGY", team_name: "埃及", confederation: "CAF", head_coach: "维多利亚", total_value_m_euros: 180, fifa_ranking: 36, base_formation: "4-2-3-1", country_code: "eg", odds: 150 },
  "Cape Verde": { team_id: "CPV", team_name: "佛得角", confederation: "CAF", head_coach: "平托", total_value_m_euros: 35, fifa_ranking: 72, base_formation: "4-4-2", country_code: "cv", odds: 450 },
  "Norway": { team_id: "NOR", team_name: "挪威", confederation: "UEFA", head_coach: "索尔巴肯", total_value_m_euros: 380, fifa_ranking: 39, base_formation: "4-3-3", country_code: "no", odds: 80 },
  "Iraq": { team_id: "IRQ", team_name: "伊拉克", confederation: "AFC", head_coach: "卡萨斯", total_value_m_euros: 70, fifa_ranking: 59, base_formation: "4-2-3-1", country_code: "iq", odds: 350 },
  "Algeria": { team_id: "ALG", team_name: "阿尔及利亚", confederation: "CAF", head_coach: "佩特科维奇", total_value_m_euros: 160, fifa_ranking: 37, base_formation: "4-2-3-1", country_code: "dz", odds: 140 },
  "Jordan": { team_id: "JOR", team_name: "约旦", confederation: "AFC", head_coach: "阿穆塔", total_value_m_euros: 45, fifa_ranking: 64, base_formation: "4-4-2", country_code: "jo", odds: 400 },
  "DR Congo": { team_id: "COD", team_name: "民主刚果", confederation: "CAF", head_coach: "德萨布勒", total_value_m_euros: 110, fifa_ranking: 56, base_formation: "4-3-3", country_code: "cd", odds: 280 },
  "Uzbekistan": { team_id: "UZB", team_name: "乌兹别克斯坦", confederation: "AFC", head_coach: "卡塔内茨", total_value_m_euros: 55, fifa_ranking: 58, base_formation: "4-2-3-1", country_code: "uz", odds: 300 },
  "Panama": { team_id: "PAN", team_name: "巴拿马", confederation: "CONCACAF", head_coach: "克里斯蒂安森", total_value_m_euros: 85, fifa_ranking: 33, base_formation: "4-4-2", country_code: "pa", odds: 200 },
};

// ---- 确定性随机数（基于种子，保证可复现） ----
function seededRand(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// ---- 根据 FIFA 排名生成八维雷达数据 ----
function generateRadar(fifaRanking, teamId) {
  let seed = 0;
  for (let i = 0; i < teamId.length; i++) seed += teamId.charCodeAt(i);

  // 基础强度：排名越低越强
  const baseStrength = Math.max(38, Math.min(92, 98 - fifaRanking * 0.55));
  const metrics = ["attack", "defense", "control", "status", "experience", "place_kick", "superstar", "penalty"];
  const radar = {};
  metrics.forEach((m, i) => {
    const r = seededRand(seed * 13 + i * 7);
    const variance = (r - 0.5) * 18;
    const val = Math.round(Math.max(32, Math.min(98, baseStrength + variance)));
    radar[m] = val;
  });
  return radar;
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function main() {
  const existingDirs = fs.readdirSync(DB_DIR).filter(item => {
    return fs.statSync(path.join(DB_DIR, item)).isDirectory();
  });

  // 1. 移除旧队伍（不在新分布中的）
  let removed = 0;
  for (const dir of existingDirs) {
    if (!(dir in GROUP_MAP)) {
      fs.rmSync(path.join(DB_DIR, dir), { recursive: true, force: true });
      console.log(`Removed: ${dir}`);
      removed++;
    }
  }

  // 2. 更新现有队伍的 group 字段
  let updated = 0;
  for (const dir of existingDirs) {
    if (dir in GROUP_MAP && !(dir in NEW_TEAMS)) {
      const profilePath = path.join(DB_DIR, dir, "profile.json");
      if (fs.existsSync(profilePath)) {
        const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
        if (profile.group !== GROUP_MAP[dir]) {
          profile.group = GROUP_MAP[dir];
          writeJson(profilePath, profile);
          console.log(`Updated group: ${dir} -> ${GROUP_MAP[dir]}`);
          updated++;
        }
      }
    }
  }

  // 3. 创建新队伍
  let created = 0;
  for (const [dirName, team] of Object.entries(NEW_TEAMS)) {
    const teamDir = path.join(DB_DIR, dirName);
    if (fs.existsSync(teamDir)) {
      console.log(`Already exists, skipping: ${dirName}`);
      continue;
    }
    fs.mkdirSync(teamDir, { recursive: true });

    const profile = {
      team_id: team.team_id,
      team_name: team.team_name,
      team_name_en: dirName,
      confederation: team.confederation,
      head_coach: team.head_coach,
      total_value_m_euros: team.total_value_m_euros,
      fifa_ranking: team.fifa_ranking,
      base_formation: team.base_formation,
      country_code: team.country_code,
      group: GROUP_MAP[dirName],
    };
    writeJson(path.join(teamDir, "profile.json"), profile);

    const radar = generateRadar(team.fifa_ranking, team.team_id);
    writeJson(path.join(teamDir, "radar_data.json"), radar);

    console.log(`Created: ${dirName} (${team.team_name}) - group ${GROUP_MAP[dirName]}`);
    created++;
  }

  // 4. 更新 odds.json
  const oddsPath = path.join(DB_DIR, "odds.json");
  const oddsList = JSON.parse(fs.readFileSync(oddsPath, 'utf8'));

  // 保留在新分布中的队伍
  const keepSet = new Set(Object.keys(GROUP_MAP));
  let filteredOdds = oddsList.filter(e => keepSet.has(e.team_name_en));

  // 添加新队伍的赔率
  const existingOddsNames = new Set(filteredOdds.map(e => e.team_name_en));
  for (const [dirName, team] of Object.entries(NEW_TEAMS)) {
    if (!existingOddsNames.has(dirName)) {
      filteredOdds.push({
        team_id: team.team_id,
        team_name: team.team_name,
        team_name_en: dirName,
        country_code: team.country_code,
        odds: team.odds,
      });
    }
  }

  writeJson(oddsPath, filteredOdds);

  console.log(`\n=== Summary ===`);
  console.log(`Removed: ${removed} teams`);
  console.log(`Updated: ${updated} team groups`);
  console.log(`Created: ${created} new teams`);
  console.log(`Odds: ${filteredOdds.length} entries`);
}

main();
