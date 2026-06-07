const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Set random seed for reproducibility
function seededRandom(seed) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

let random = seededRandom.bind(null, 42);

function getTeamNames() {
    const databasePath = "my-world-cup/database/2_ability_models";
    if (!fs.existsSync(databasePath)) {
        throw new Error(`Database directory not found at ${databasePath}`);
    }

    // Get all directories that look like team names
    const teamNames = [];
    const teamCodes = [];
    const items = fs.readdirSync(databasePath);

    for (const item of items) {
        const itemPath = path.join(databasePath, item);
        if (fs.statSync(itemPath).isDirectory()) {
            teamNames.push(item);

            // Get 3-letter team codes
            if (item.includes(' ')) {
                const parts = item.split(' ');
                const code = parts[parts.length - 1];
                teamCodes.push(code);
            } else {
                teamCodes.push(item.substring(0, 3).toUpperCase());
            }
        }
    }

    // Build Chinese name map from profiles
    const chineseNames = {};
    for (const dirName of teamNames) {
        const profileFile = path.join(databasePath, dirName, "profile.json");
        if (fs.existsSync(profileFile)) {
            const profile = JSON.parse(fs.readFileSync(profileFile, 'utf8'));
            chineseNames[dirName] = profile.team_name;
        } else {
            chineseNames[dirName] = dirName;
        }
    }

    return { teamNames, teamCodes, chineseNames };
}

function getTeamOverallScore(teamName) {
    const radarFile = `my-world-cup/database/2_ability_models/${teamName}/radar_data.json`;

    if (fs.existsSync(radarFile)) {
        const data = fs.readFileSync(radarFile, 'utf8');
        const radarData = JSON.parse(data);

        // Calculate overall as average of all attributes
        const attributes = ['attack', 'defense', 'control', 'status', 'experience', 'place_kick', 'superstar', 'penalty'];
        const values = attributes.map(attr => radarData[attr] || 75);
        return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    }

    return 75; // Default if not found
}

function readProfile(teamNameDir) {
    const profileFile = `my-world-cup/database/2_ability_models/${teamNameDir}/profile.json`;
    if (fs.existsSync(profileFile)) {
        const data = fs.readFileSync(profileFile, 'utf8');
        return JSON.parse(data);
    }
    return null;
}

function determineStyleFromFormation(formation, overallScore) {
    // Map formations to styles
    const formationStyleMap = {
        '4-3-3': 'possession',
        '4-2-3-1': 'balanced',
        '4-4-2': 'balanced',
        '4-5-1': 'defensive',
        '3-4-3': 'possession',
        '3-5-2': 'defensive',
        '5-3-2': 'defensive'
    };

    const style = formationStyleMap[formation] || 'balanced';

    // Adjust style based on overall score
    const styleOptions = [style];
    if (overallScore > 75) {
        if (style === 'balanced') {
            styleOptions.push('possession', 'pressing');
        } else if (style === 'defensive' && overallScore > 85) {
            styleOptions.push('balanced');
        }
    }

    return styleOptions[Math.floor(random() * styleOptions.length)];
}

function generateStrategy(teamId, overallScore, baseFormation) {
    // If base_formation is provided from profile, use it directly
    if (baseFormation) {
        const style = determineStyleFromFormation(baseFormation, overallScore);
        const styleAttributes = {
            'possession': {
                pressing_intensity: ['medium', 'high'][Math.floor(random() * 2)],
                defensive_line: ['mid', 'high'][Math.floor(random() * 2)],
                transition_speed: ['medium', 'slow'][Math.floor(random() * 2)]
            },
            'counter_attack': {
                pressing_intensity: ['low', 'medium'][Math.floor(random() * 2)],
                defensive_line: ['low', 'mid'][Math.floor(random() * 2)],
                transition_speed: ['fast', 'medium'][Math.floor(random() * 2)]
            },
            'pressing': {
                pressing_intensity: 'high',
                defensive_line: ['high', 'mid'][Math.floor(random() * 2)],
                transition_speed: ['fast', 'medium'][Math.floor(random() * 2)]
            },
            'defensive': {
                pressing_intensity: 'low',
                defensive_line: 'low',
                transition_speed: ['slow', 'medium'][Math.floor(random() * 2)]
            },
            'balanced': {
                pressing_intensity: 'medium',
                defensive_line: 'mid',
                transition_speed: 'medium'
            }
        };

        return {
            team_id: teamId,
            formation: baseFormation,
            style: style,
            pressing_intensity: styleAttributes[style].pressing_intensity,
            defensive_line: styleAttributes[style].defensive_line,
            transition_speed: styleAttributes[style].transition_speed
        };
    }

    // Fallback to original logic if no base_formation provided
    const formations = Object.keys(formationWeights[style]);
    const weights = Object.values(formationWeights[style]);
    let formation = formations[0];
    let weightSum = 0;
    const r = random();

    for (let i = 0; i < weights.length; i++) {
        weightSum += weights[i];
        if (r <= weightSum) {
            formation = formations[i];
            break;
        }
    }

    return {
        team_id: teamId,
        formation: formation,
        style: style,
        pressing_intensity: styleAttributes[style].pressing_intensity,
        defensive_line: styleAttributes[style].defensive_line,
        transition_speed: styleAttributes[style].transition_speed
    };
}

function generateRecentForm(teamId, overallScore, allTeamNames, teamNameDir, chineseNames) {
    // Determine W/D/L distribution based on overall score
    let wins, draws, losses;

    if (overallScore > 85) {
        wins = Math.floor(random() * 3) + 7; // 7-9
        draws = Math.floor(random() * 3); // 0-2
    } else if (overallScore >= 75) {
        wins = Math.floor(random() * 3) + 5; // 5-7
        draws = Math.floor(random() * 3) + 1; // 1-3
    } else if (overallScore >= 65) {
        wins = Math.floor(random() * 3) + 3; // 3-5
        draws = Math.floor(random() * 3) + 2; // 2-4
    } else {
        wins = Math.floor(random() * 3) + 1; // 1-3
        draws = Math.floor(random() * 3) + 2; // 2-4
    }

    losses = Math.max(0, 10 - wins - draws);

    // Create result list
    const results = [];
    // Create opponents list from all team Chinese names, excluding current team
    const opponents = allTeamNames
        .filter(name => name !== teamNameDir)
        .map(name => chineseNames[name] || name);

    const resultTypes = [];
    for (let i = 0; i < wins; i++) resultTypes.push('W');
    for (let i = 0; i < draws; i++) resultTypes.push('D');
    for (let i = 0; i < losses; i++) resultTypes.push('L');

    // Ensure exactly 10 results by capping wins+draws
    if (wins + draws > 10) {
        draws = 10 - wins;
        if (draws < 0) { draws = 0; wins = 10; }
    }
    losses = Math.max(0, 10 - wins - draws);

    // Rebuild resultTypes with corrected counts
    resultTypes.length = 0;
    for (let i = 0; i < wins; i++) resultTypes.push('W');
    for (let i = 0; i < draws; i++) resultTypes.push('D');
    for (let i = 0; i < losses; i++) resultTypes.push('L');

    // Shuffle results
    for (let i = resultTypes.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [resultTypes[i], resultTypes[j]] = [resultTypes[j], resultTypes[i]];
    }

    let goalsScored = 0;
    let goalsConceded = 0;

    // Use a copy of opponents to avoid picking the same opponent too often
    const availableOpponents = [...opponents];

    for (let i = 0; i < resultTypes.length; i++) {
        const result = resultTypes[i];
        // Pick opponent from remaining options, or from all if we've used them all
        const opponentIndex = Math.floor(random() * availableOpponents.length);
        let opponent = availableOpponents[opponentIndex];

        // Remove opponent if we have more games to play
        if (availableOpponents.length > 10) {
            availableOpponents.splice(opponentIndex, 1);
        } else {
            // If we've run out of unique opponents, shuffle and reset
            if (i > 0 && availableOpponents.length === 0) {
                availableOpponents.push(...opponents);
            }
        }

        // Score generation based on result
        let score, scored, conceded;
        if (result === 'W') {
            scored = Math.floor(random() * 3) + 2; // 2-4
            conceded = Math.floor(random() * 2); // 0-1
            score = `${scored}-${conceded}`;
        } else if (result === 'D') {
            scored = Math.floor(random() * 2) + 1; // 1-2
            conceded = scored;
            score = `${scored}-${conceded}`;
        } else { // Loss
            scored = Math.floor(random() * 3); // 0-2
            conceded = Math.floor(random() * 3) + 1; // 1-3
            score = `${scored}-${conceded}`;
        }

        goalsScored += scored;
        goalsConceded += conceded;

        results.push({
            opponent: opponent,
            result: result,
            score: score,
            type: random() > 0.5 ? "friendly" : "qualifier"
        });
    }

    return {
        team_id: teamId,
        last_10: results,
        summary: {
            wins: wins,
            draws: draws,
            losses: losses,
            goals_scored: goalsScored,
            goals_conceded: goalsConceded
        }
    };
}

function extendOddsFile() {
    const oddsFile = "my-world-cup/database/2_ability_models/odds.json";

    if (!fs.existsSync(oddsFile)) {
        console.log(`Warning: odds.json not found at ${oddsFile}`);
        return;
    }

    console.log(`Found odds.json at ${oddsFile}`);

    const data = fs.readFileSync(oddsFile, 'utf8');
    const oddsData = JSON.parse(data);

    // Extract odds values for normalization
    const oddsValues = oddsData.map(entry => entry.odds);
    const minOdds = Math.min(...oddsValues);
    const maxOdds = Math.max(...oddsValues);

    // Add new fields to each entry
    for (const entry of oddsData) {
        const strengthNorm = 1 - (entry.odds - minOdds) / (maxOdds - minOdds);

        const winOddsBase = Math.round((1.5 + (1 - strengthNorm) * 7.5) * 100) / 100;
        const drawOddsBase = Math.round((3.0 + Math.abs(strengthNorm - 0.5) * 0.8 + (random() - 0.5) * 0.2) * 100) / 100;
        const lossOddsBase = Math.round((1.2 + strengthNorm * 6.0) * 100) / 100;

        entry.win_odds_base = winOddsBase;
        entry.draw_odds_base = drawOddsBase;
        entry.loss_odds_base = lossOddsBase;
    }

    // Write back to file
    fs.writeFileSync(oddsFile, JSON.stringify(oddsData, null, 2), 'utf8');
    console.log(`Extended ${oddsData.length} entries in odds.json`);
}

function main() {
    console.log("Generating pre-match data...");

    try {
        // Get team names
        const { teamNames, teamCodes, chineseNames } = getTeamNames();
        console.log(`Found ${teamCodes.length} teams: ${teamCodes.join(', ')}`);

        // Generate strategy.json and recent_form.json for each team
        for (const teamId of teamCodes) {
            // Find team name directory
            let teamNameDir = null;
            const items = fs.readdirSync("my-world-cup/database/2_ability_models");

            for (const item of items) {
                const itemPath = path.join("my-world-cup/database/2_ability_models", item);
                if (fs.statSync(itemPath).isDirectory()) {
                    // Check if this directory corresponds to our team
                    let code;
                    if (item.includes(' ')) {
                        const parts = item.split(' ');
                        code = parts[parts.length - 1];
                    } else {
                        code = item.substring(0, 3).toUpperCase();
                    }

                    if (code === teamId) {
                        teamNameDir = item;
                        break;
                    }
                }
            }

            if (!teamNameDir) {
                console.log(`Warning: Could not find directory for team ${teamId}`);
                continue;
            }

            // Get overall score and profile
            const overallScore = getTeamOverallScore(teamNameDir);
            const profile = readProfile(teamNameDir);

            // Generate strategy
            const strategy = generateStrategy(teamId, overallScore, profile.base_formation);
            const strategyFile = `my-world-cup/database/2_ability_models/${teamNameDir}/strategy.json`;

            fs.writeFileSync(strategyFile, JSON.stringify(strategy, null, 2), 'utf8');

            // Generate recent form
            const recentForm = generateRecentForm(teamId, overallScore, teamNames, teamNameDir, chineseNames);
            const formFile = `my-world-cup/database/2_ability_models/${teamNameDir}/recent_form.json`;

            fs.writeFileSync(formFile, JSON.stringify(recentForm, null, 2), 'utf8');

            console.log(`Generated data for ${teamId} (${teamNameDir}): overall=${overallScore}`);
        }

        // Extend odds file
        extendOddsFile();

        console.log("Pre-match data generation complete!");
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}