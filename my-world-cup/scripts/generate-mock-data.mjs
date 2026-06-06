/**
 * Mock data generator for My World Cup
 * Generates 48 teams across 12 groups (A-L) with profile.json, radar_data.json, and odds.json
 */

import fs from 'node:fs';
import path from 'node:path';

const DATABASE_DIR = path.join(process.cwd(), 'database', '2_ability_models');

// ---------------------------------------------------------------------------
// Team definitions – 48 teams across 12 groups
// ---------------------------------------------------------------------------

const groups = {
  A: [
    { team_id: 'ARG', team_name: '阿根廷', team_name_en: 'Argentina', country_code: 'ar', confederation: 'CONMEBOL', head_coach: '斯卡洛尼', total_value_m_euros: 850, fifa_ranking: 1, base_formation: '4-3-3' },
    { team_id: 'FRA', team_name: '法国', team_name_en: 'France', country_code: 'fr', confederation: 'UEFA', head_coach: '德尚', total_value_m_euros: 1300, fifa_ranking: 2, base_formation: '4-2-3-1' },
    { team_id: 'MEX', team_name: '墨西哥', team_name_en: 'Mexico', country_code: 'mx', confederation: 'CONCACAF', head_coach: '洛萨诺', total_value_m_euros: 250, fifa_ranking: 15, base_formation: '4-3-3' },
    { team_id: 'NZL', team_name: '新西兰', team_name_en: 'New Zealand', country_code: 'nz', confederation: 'OFC', head_coach: '巴兹利', total_value_m_euros: 40, fifa_ranking: 95, base_formation: '5-3-2' },
  ],
  B: [
    { team_id: 'BRA', team_name: '巴西', team_name_en: 'Brazil', country_code: 'br', confederation: 'CONMEBOL', head_coach: '安切洛蒂', total_value_m_euros: 1100, fifa_ranking: 5, base_formation: '4-3-3' },
    { team_id: 'GER', team_name: '德国', team_name_en: 'Germany', country_code: 'de', confederation: 'UEFA', head_coach: '纳格尔斯曼', total_value_m_euros: 820, fifa_ranking: 3, base_formation: '4-2-3-1' },
    { team_id: 'JPN', team_name: '日本', team_name_en: 'Japan', country_code: 'jp', confederation: 'AFC', head_coach: '森保一', total_value_m_euros: 280, fifa_ranking: 18, base_formation: '4-2-3-1' },
    { team_id: 'CMR', team_name: '喀麦隆', team_name_en: 'Cameroon', country_code: 'cm', confederation: 'CAF', head_coach: '里格贝特·宋', total_value_m_euros: 150, fifa_ranking: 45, base_formation: '4-3-3' },
  ],
  C: [
    { team_id: 'ENG', team_name: '英格兰', team_name_en: 'England', country_code: 'gb-eng', confederation: 'UEFA', head_coach: '图赫尔', total_value_m_euros: 1400, fifa_ranking: 4, base_formation: '4-3-3' },
    { team_id: 'ESP', team_name: '西班牙', team_name_en: 'Spain', country_code: 'es', confederation: 'UEFA', head_coach: '德拉富恩特', total_value_m_euros: 1050, fifa_ranking: 8, base_formation: '4-3-3' },
    { team_id: 'USA', team_name: '美国', team_name_en: 'United States', country_code: 'us', confederation: 'CONCACAF', head_coach: '波普', total_value_m_euros: 350, fifa_ranking: 13, base_formation: '4-3-3' },
    { team_id: 'QAT', team_name: '卡塔尔', team_name_en: 'Qatar', country_code: 'qa', confederation: 'AFC', head_coach: '洛佩兹', total_value_m_euros: 50, fifa_ranking: 55, base_formation: '5-3-2' },
  ],
  D: [
    { team_id: 'POR', team_name: '葡萄牙', team_name_en: 'Portugal', country_code: 'pt', confederation: 'UEFA', head_coach: '马丁内斯', total_value_m_euros: 950, fifa_ranking: 6, base_formation: '4-3-3' },
    { team_id: 'NED', team_name: '荷兰', team_name_en: 'Netherlands', country_code: 'nl', confederation: 'UEFA', head_coach: '科曼', total_value_m_euros: 680, fifa_ranking: 7, base_formation: '3-4-3' },
    { team_id: 'KOR', team_name: '韩国', team_name_en: 'South Korea', country_code: 'kr', confederation: 'AFC', head_coach: '洪明甫', total_value_m_euros: 200, fifa_ranking: 23, base_formation: '4-4-2' },
    { team_id: 'SEN', team_name: '塞内加尔', team_name_en: 'Senegal', country_code: 'sn', confederation: 'CAF', head_coach: '西塞', total_value_m_euros: 180, fifa_ranking: 20, base_formation: '4-2-3-1' },
  ],
  E: [
    { team_id: 'ITA', team_name: '意大利', team_name_en: 'Italy', country_code: 'it', confederation: 'UEFA', head_coach: '斯帕莱蒂', total_value_m_euros: 700, fifa_ranking: 9, base_formation: '3-5-2' },
    { team_id: 'CRO', team_name: '克罗地亚', team_name_en: 'Croatia', country_code: 'hr', confederation: 'UEFA', head_coach: '达利奇', total_value_m_euros: 380, fifa_ranking: 10, base_formation: '4-3-3' },
    { team_id: 'COL', team_name: '哥伦比亚', team_name_en: 'Colombia', country_code: 'co', confederation: 'CONMEBOL', head_coach: '洛伦佐', total_value_m_euros: 320, fifa_ranking: 12, base_formation: '4-3-3' },
    { team_id: 'AUS', team_name: '澳大利亚', team_name_en: 'Australia', country_code: 'au', confederation: 'AFC', head_coach: '波波维奇', total_value_m_euros: 60, fifa_ranking: 40, base_formation: '4-4-2' },
  ],
  F: [
    { team_id: 'BEL', team_name: '比利时', team_name_en: 'Belgium', country_code: 'be', confederation: 'UEFA', head_coach: '鲁迪·加西亚', total_value_m_euros: 550, fifa_ranking: 11, base_formation: '3-4-3' },
    { team_id: 'URU', team_name: '乌拉圭', team_name_en: 'Uruguay', country_code: 'uy', confederation: 'CONMEBOL', head_coach: '贝尔萨', total_value_m_euros: 450, fifa_ranking: 14, base_formation: '4-2-3-1' },
    { team_id: 'TUN', team_name: '突尼斯', team_name_en: 'Tunisia', country_code: 'tn', confederation: 'CAF', head_coach: '卡德里', total_value_m_euros: 70, fifa_ranking: 35, base_formation: '4-3-3' },
    { team_id: 'CAN', team_name: '加拿大', team_name_en: 'Canada', country_code: 'ca', confederation: 'CONCACAF', head_coach: '马什', total_value_m_euros: 180, fifa_ranking: 30, base_formation: '4-4-2' },
  ],
  G: [
    { team_id: 'SUI', team_name: '瑞士', team_name_en: 'Switzerland', country_code: 'ch', confederation: 'UEFA', head_coach: '雅金', total_value_m_euros: 350, fifa_ranking: 16, base_formation: '3-4-3' },
    { team_id: 'DEN', team_name: '丹麦', team_name_en: 'Denmark', country_code: 'dk', confederation: 'UEFA', head_coach: '里默尔', total_value_m_euros: 320, fifa_ranking: 21, base_formation: '3-4-3' },
    { team_id: 'IRN', team_name: '伊朗', team_name_en: 'Iran', country_code: 'ir', confederation: 'AFC', head_coach: '盖勒努伊', total_value_m_euros: 50, fifa_ranking: 25, base_formation: '4-2-3-1' },
    { team_id: 'PER', team_name: '秘鲁', team_name_en: 'Peru', country_code: 'pe', confederation: 'CONMEBOL', head_coach: '福萨蒂', total_value_m_euros: 40, fifa_ranking: 38, base_formation: '4-3-3' },
  ],
  H: [
    { team_id: 'SRB', team_name: '塞尔维亚', team_name_en: 'Serbia', country_code: 'rs', confederation: 'UEFA', head_coach: '斯托利洛维奇', total_value_m_euros: 280, fifa_ranking: 33, base_formation: '3-4-3' },
    { team_id: 'POL', team_name: '波兰', team_name_en: 'Poland', country_code: 'pl', confederation: 'UEFA', head_coach: '普罗别日', total_value_m_euros: 260, fifa_ranking: 28, base_formation: '4-2-3-1' },
    { team_id: 'CHI', team_name: '智利', team_name_en: 'Chile', country_code: 'cl', confederation: 'CONMEBOL', head_coach: '加雷卡', total_value_m_euros: 120, fifa_ranking: 50, base_formation: '4-3-3' },
    { team_id: 'GHA', team_name: '加纳', team_name_en: 'Ghana', country_code: 'gh', confederation: 'CAF', head_coach: '阿多', total_value_m_euros: 110, fifa_ranking: 42, base_formation: '4-2-3-1' },
  ],
  I: [
    { team_id: 'UKR', team_name: '乌克兰', team_name_en: 'Ukraine', country_code: 'ua', confederation: 'UEFA', head_coach: '雷布罗夫', total_value_m_euros: 220, fifa_ranking: 24, base_formation: '4-3-3' },
    { team_id: 'SWE', team_name: '瑞典', team_name_en: 'Sweden', country_code: 'se', confederation: 'UEFA', head_coach: '托姆安德森', total_value_m_euros: 180, fifa_ranking: 26, base_formation: '4-4-2' },
    { team_id: 'MAR', team_name: '摩洛哥', team_name_en: 'Morocco', country_code: 'ma', confederation: 'CAF', head_coach: '雷格拉吉', total_value_m_euros: 300, fifa_ranking: 13, base_formation: '4-3-3' },
    { team_id: 'PRY', team_name: '巴拉圭', team_name_en: 'Paraguay', country_code: 'py', confederation: 'CONMEBOL', head_coach: '阿尔法罗', total_value_m_euros: 90, fifa_ranking: 52, base_formation: '4-4-2' },
  ],
  J: [
    { team_id: 'AUT', team_name: '奥地利', team_name_en: 'Austria', country_code: 'at', confederation: 'UEFA', head_coach: '朗尼克', total_value_m_euros: 280, fifa_ranking: 22, base_formation: '4-2-3-1' },
    { team_id: 'TUR', team_name: '土耳其', team_name_en: 'Turkey', country_code: 'tr', confederation: 'UEFA', head_coach: '蒙特拉', total_value_m_euros: 320, fifa_ranking: 27, base_formation: '4-3-3' },
    { team_id: 'NGA', team_name: '尼日利亚', team_name_en: 'Nigeria', country_code: 'ng', confederation: 'CAF', head_coach: '埃瓜沃恩', total_value_m_euros: 200, fifa_ranking: 36, base_formation: '4-3-3' },
    { team_id: 'ECU', team_name: '厄瓜多尔', team_name_en: 'Ecuador', country_code: 'ec', confederation: 'CONMEBOL', head_coach: '贝卡切切', total_value_m_euros: 150, fifa_ranking: 32, base_formation: '4-2-3-1' },
  ],
  K: [
    { team_id: 'CZE', team_name: '捷克', team_name_en: 'Czech Republic', country_code: 'cz', confederation: 'UEFA', head_coach: '希尔哈维', total_value_m_euros: 200, fifa_ranking: 34, base_formation: '4-2-3-1' },
    { team_id: 'SCO', team_name: '苏格兰', team_name_en: 'Scotland', country_code: 'gb-sct', confederation: 'UEFA', head_coach: '克拉克', total_value_m_euros: 130, fifa_ranking: 39, base_formation: '4-3-3' },
    { team_id: 'RSA', team_name: '南非', team_name_en: 'South Africa', country_code: 'za', confederation: 'CAF', head_coach: '布罗姆奎斯特', total_value_m_euros: 35, fifa_ranking: 60, base_formation: '4-4-2' },
    { team_id: 'KSA', team_name: '沙特', team_name_en: 'Saudi Arabia', country_code: 'sa', confederation: 'AFC', head_coach: '雷纳尔', total_value_m_euros: 45, fifa_ranking: 48, base_formation: '4-2-3-1' },
  ],
  L: [
    { team_id: 'WAL', team_name: '威尔士', team_name_en: 'Wales', country_code: 'gb-wls', confederation: 'UEFA', head_coach: '佩奇', total_value_m_euros: 140, fifa_ranking: 29, base_formation: '3-4-3' },
    { team_id: 'HUN', team_name: '匈牙利', team_name_en: 'Hungary', country_code: 'hu', confederation: 'UEFA', head_coach: '罗西', total_value_m_euros: 120, fifa_ranking: 31, base_formation: '3-5-2' },
    { team_id: 'CRC', team_name: '哥斯达黎加', team_name_en: 'Costa Rica', country_code: 'cr', confederation: 'CONCACAF', head_coach: '古斯曼', total_value_m_euros: 25, fifa_ranking: 46, base_formation: '5-3-2' },
    { team_id: 'CHN', team_name: '中国', team_name_en: 'China', country_code: 'cn', confederation: 'AFC', head_coach: '伊万科维奇', total_value_m_euros: 15, fifa_ranking: 80, base_formation: '4-4-2' },
  ],
};

// ---------------------------------------------------------------------------
// Seeded pseudo-random number generator (Mulberry32) for reproducibility
// ---------------------------------------------------------------------------

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Derive a numeric seed from the team_id string
function teamSeed(teamId) {
  let hash = 0;
  for (let i = 0; i < teamId.length; i++) {
    hash = (hash * 31 + teamId.charCodeAt(i)) | 0;
  }
  return hash;
}

// ---------------------------------------------------------------------------
// Radar data generation
// ---------------------------------------------------------------------------

const RADAR_METRICS = [
  'attack',
  'defense',
  'control',
  'status',
  'experience',
  'place_kick',
  'superstar',
  'penalty',
];

/**
 * Determine the value range for a radar metric based on FIFA ranking tier.
 * Returns [min, max] for the 8 radar metrics.
 */
function getRankingTier(fifaRanking) {
  if (fifaRanking <= 5) return { min: 82, max: 96, label: 'elite' };
  if (fifaRanking <= 15) return { min: 75, max: 88, label: 'strong' };
  if (fifaRanking <= 30) return { min: 65, max: 80, label: 'competitive' };
  if (fifaRanking <= 50) return { min: 55, max: 72, label: 'mid' };
  return { min: 45, max: 65, label: 'developing' };
}

/**
 * Generate radar data for a team using a seeded RNG.
 */
function generateRadarData(team) {
  const rng = mulberry32(teamSeed(team.team_id));
  const tier = getRankingTier(team.fifa_ranking);
  const range = tier.max - tier.min;

  const radar = {};
  for (const metric of RADAR_METRICS) {
    // Generate a value within the tier range and round to integer
    const raw = tier.min + rng() * range;
    radar[metric] = Math.round(raw);
  }
  return radar;
}

// ---------------------------------------------------------------------------
// Odds generation
// ---------------------------------------------------------------------------

/**
 * Assign win odds based on FIFA ranking.
 * Better ranking => lower (better) odds.
 */
function generateOdds(fifaRanking) {
  // Base odds: higher ranking gets lower odds
  // Map ranking 1..100 to approximate odds range
  const minOdds = 4.00;
  const maxOdds = 800.00;
  const normalized = (fifaRanking - 1) / 99; // 0..1
  const rawOdds = minOdds + normalized * (maxOdds - minOdds);
  // Round to 2 decimal places
  return Math.round(rawOdds * 100) / 100;
}

// ---------------------------------------------------------------------------
// Main generation logic
// ---------------------------------------------------------------------------

function main() {
  // Ensure the database directory exists
  fs.mkdirSync(DATABASE_DIR, { recursive: true });

  const allTeams = [];
  const oddsList = [];

  for (const [groupLetter, teams] of Object.entries(groups)) {
    for (const team of teams) {
      const teamDir = path.join(DATABASE_DIR, team.team_name_en);

      // Attach group to team
      const teamWithGroup = { ...team, group: groupLetter };
      allTeams.push(teamWithGroup);

      // Create team directory
      fs.mkdirSync(teamDir, { recursive: true });

      // --- profile.json ---
      const profile = {
        team_id: teamWithGroup.team_id,
        team_name: teamWithGroup.team_name,
        team_name_en: teamWithGroup.team_name_en,
        confederation: teamWithGroup.confederation,
        head_coach: teamWithGroup.head_coach,
        total_value_m_euros: teamWithGroup.total_value_m_euros,
        fifa_ranking: teamWithGroup.fifa_ranking,
        base_formation: teamWithGroup.base_formation,
        country_code: teamWithGroup.country_code,
        group: teamWithGroup.group,
      };

      fs.writeFileSync(
        path.join(teamDir, 'profile.json'),
        JSON.stringify(profile, null, 2) + '\n',
        'utf-8',
      );

      // --- radar_data.json ---
      const radarData = generateRadarData(teamWithGroup);

      fs.writeFileSync(
        path.join(teamDir, 'radar_data.json'),
        JSON.stringify(radarData, null, 2) + '\n',
        'utf-8',
      );

      // Collect odds entry
      oddsList.push({
        team_id: teamWithGroup.team_id,
        team_name_en: teamWithGroup.team_name_en,
        odds: generateOdds(teamWithGroup.fifa_ranking),
      });
    }
  }

  // --- odds.json (sorted ascending by odds) ---
  oddsList.sort((a, b) => a.odds - b.odds);

  fs.writeFileSync(
    path.join(DATABASE_DIR, 'odds.json'),
    JSON.stringify(oddsList, null, 2) + '\n',
    'utf-8',
  );

  // --- Summary ---
  console.log(`Generated data for ${allTeams.length} teams across ${Object.keys(groups).length} groups.`);
  console.log(`Team directories created under: ${DATABASE_DIR}`);
  console.log(`Odds file written to: ${path.join(DATABASE_DIR, 'odds.json')}`);

  // Validate
  const dirCount = fs.readdirSync(DATABASE_DIR)
    .filter((e) => fs.statSync(path.join(DATABASE_DIR, e)).isDirectory())
    .length;
  console.log(`\nVerification: ${dirCount} team directories present.`);

  if (dirCount !== 48) {
    console.error(`ERROR: Expected 48 team directories, but found ${dirCount}.`);
    process.exit(1);
  }

  console.log('All checks passed.');
}

main();
