import json
import random
import os
import glob
from typing import Dict, List, Any

# Set random seed for reproducibility
random.seed(42)

def get_team_names():
    """Get list of all team names from database directory"""
    database_path = "my-world-cup/database/2_ability_models"
    if not os.path.exists(database_path):
        raise FileNotFoundError(f"Database directory not found at {database_path}")

    # Get all directories that look like team names
    team_names = []
    for item in os.listdir(database_path):
        item_path = os.path.join(database_path, item)
        if os.path.isdir(item_path):
            team_names.append(item)

    # Get 3-letter team codes from team_names (last part if space separated)
    team_codes = []
    for name in team_names:
        if ' ' in name:
            code = name.split()[-1]
        else:
            code = name[:3].upper()
        team_codes.append(code)

    return team_codes

def get_team_overall_score(team_name: str) -> int:
    """Get overall score for a team"""
    radar_file = f"my-world-cup/database/2_ability_models/{team_name}/radar_data.json"
    if os.path.exists(radar_file):
        with open(radar_file, 'r', encoding='utf-8') as f:
            radar_data = json.load(f)
            # Calculate overall as average of all attributes
            attributes = ['attack', 'defense', 'control', 'status', 'experience',
                         'place_kick', 'superstar', 'penalty']
            values = [radar_data.get(attr, 75) for attr in attributes]
            return int(round(sum(values) / len(values)))
    return 75  # Default if not found

def generate_strategy(team_id: str, overall_score: int) -> Dict[str, Any]:
    """Generate strategy data for a team based on overall score"""

    # Determine possible styles based on overall score
    if overall_score > 85:
        possible_styles = ['possession', 'pressing']
    elif overall_score >= 75:
        possible_styles = ['balanced', 'possession', 'pressing']
    elif overall_score >= 65:
        possible_styles = ['balanced', 'counter_attack', 'defensive']
    else:
        possible_styles = ['defensive', 'counter_attack']

    style = random.choice(possible_styles)

    # Map styles to attributes
    style_attributes = {
        'possession': {
            'pressing_intensity': random.choice(['medium', 'high']),
            'defensive_line': random.choice(['mid', 'high']),
            'transition_speed': random.choice(['medium', 'slow'])
        },
        'counter_attack': {
            'pressing_intensity': random.choice(['low', 'medium']),
            'defensive_line': random.choice(['low', 'mid']),
            'transition_speed': random.choice(['fast', 'medium'])
        },
        'pressing': {
            'pressing_intensity': 'high',
            'defensive_line': random.choice(['high', 'mid']),
            'transition_speed': random.choice(['fast', 'medium'])
        },
        'defensive': {
            'pressing_intensity': 'low',
            'defensive_line': 'low',
            'transition_speed': random.choice(['slow', 'medium'])
        },
        'balanced': {
            'pressing_intensity': 'medium',
            'defensive_line': 'mid',
            'transition_speed': 'medium'
        }
    }

    # Random formations weighted by style
    formation_weights = {
        'possession': {'4-3-3': 0.5, '4-2-3-1': 0.3, '3-4-3': 0.2},
        'pressing': {'4-3-3': 0.6, '4-4-2': 0.3, '3-5-2': 0.1},
        'defensive': {'5-3-2': 0.5, '4-4-2': 0.3, '4-5-1': 0.2},
        'counter_attack': {'4-2-3-1': 0.5, '4-3-3': 0.3, '3-4-3': 0.2},
        'balanced': {'4-3-3': 0.4, '4-2-3-1': 0.4, '4-4-2': 0.2}
    }

    formations = list(formation_weights[style].keys())
    weights = list(formation_weights[style].values())
    formation = random.choices(formations, weights=weights)[0]

    return {
        "team_id": team_id,
        "formation": formation,
        "style": style,
        "pressing_intensity": style_attributes[style]['pressing_intensity'],
        "defensive_line": style_attributes[style]['defensive_line'],
        "transition_speed": style_attributes[style]['transition_speed']
    }

def generate_recent_form(team_id: str, overall_score: int) -> Dict[str, Any]:
    """Generate recent form data for a team"""

    # Determine W/D/L distribution based on overall score
    if overall_score > 85:
        wins = random.randint(7, 9)
        draws = random.randint(0, 2)
        losses = 10 - wins - draws
    elif overall_score >= 75:
        wins = random.randint(5, 7)
        draws = random.randint(1, 3)
        losses = 10 - wins - draws
    elif overall_score >= 65:
        wins = random.randint(3, 5)
        draws = random.randint(2, 4)
        losses = 10 - wins - draws
    else:
        wins = random.randint(1, 3)
        draws = random.randint(2, 4)
        losses = 10 - wins - draws

    # Create result list
    results = []
    opponents = [
        "巴西", "法国", "英格兰", "德国", "西班牙", "意大利", "葡萄牙", "荷兰",
        "克罗地亚", "阿根廷", "乌拉圭", "哥伦比亚", "墨西哥", "美国", "日本",
        "韩国", "澳大利亚", "智利", "秘鲁", "厄瓜多尔", "喀麦隆", "尼日利亚",
        "塞内加尔", "加纳", "摩洛哥", "阿尔及利亚", "突尼斯", "埃及", "沙特",
        "伊朗", "伊拉克", "阿联酋", "约旦", "黎巴嫩", "巴勒斯坦", "叙利亚",
        "乌兹别克斯坦", "哈萨克斯坦", "泰国", "越南", "印尼", "马来西亚", "新加坡"
    ]

    result_types = ['W'] * wins + ['D'] * draws + ['L'] * losses
    random.shuffle(result_types)

    goals_scored = 0
    goals_conceded = 0

    for i, result in enumerate(result_types):
        opponent = random.choice(opponents)
        # Score generation based on result
        if result == 'W':
            score = f"{random.randint(2, 4)}-{random.randint(0, 1)}"
            scored, conceded = map(int, score.split('-'))
        elif result == 'D':
            score = f"{random.randint(1, 2)}-{random.randint(1, 2)}"
            scored, conceded = map(int, score.split('-'))
        else:  # Loss
            score = f"{random.randint(0, 2)}-{random.randint(1, 3)}"
            scored, conceded = map(int, score.split('-'))

        goals_scored += scored
        goals_conceded += conceded

        result_data = {
            "opponent": opponent,
            "result": result,
            "score": score,
            "type": random.choice(["friendly", "qualifier"])
        }
        results.append(result_data)

    return {
        "team_id": team_id,
        "last_10": results,
        "summary": {
            "wins": wins,
            "draws": draws,
            "losses": losses,
            "goals_scored": goals_scored,
            "goals_conceded": goals_conceded
        }
    }

def extend_odds_file():
    """Extend odds.json with new fields"""
    odds_file = "my-world-cup/database/2_ability_models/odds.json"

    if not os.path.exists(odds_file):
        print(f"Warning: odds.json not found at {odds_file}")
        return

    print(f"Found odds.json at {odds_file}")

    with open(odds_file, 'r', encoding='utf-8') as f:
        odds_data = json.load(f)

    # Extract odds values for normalization
    odds_values = [entry['odds'] for entry in odds_data]
    min_odds = min(odds_values)
    max_odds = max(odds_values)

    # Add new fields to each entry
    for entry in odds_data:
        strength_norm = 1 - (entry['odds'] - min_odds) / (max_odds - min_odds)

        win_odds_base = round(1.5 + (1 - strength_norm) * 7.5, 2)
        draw_odds_base = round(3.0 + abs(strength_norm - 0.5) * 0.8 + random.uniform(-0.1, 0.1), 2)
        loss_odds_base = round(1.2 + strength_norm * 6.0, 2)

        entry['win_odds_base'] = win_odds_base
        entry['draw_odds_base'] = draw_odds_base
        entry['loss_odds_base'] = loss_odds_base

    # Write back to file
    with open(odds_file, 'w', encoding='utf-8') as f:
        json.dump(odds_data, f, indent=2, ensure_ascii=False)

    print(f"Extended {len(odds_data)} entries in odds.json")

def main():
    """Main function to generate all pre-match data"""
    print("Generating pre-match data...")

    # Get team names
    team_codes = get_team_names()
    print(f"Found {len(team_codes)} teams: {team_codes}")

    # Generate strategy.json and recent_form.json for each team
    for team_id in team_codes:
        # Get team name directory
        team_name_dir = None
        for item in os.listdir("my-world-cup/database/2_ability_models"):
            if os.path.isdir(f"my-world-cup/database/2_ability_models/{item}"):
                # Check if this directory corresponds to our team
                if ' ' in item:
                    code = item.split()[-1]
                else:
                    code = item[:3].upper()

                if code == team_id:
                    team_name_dir = item
                    break

        if not team_name_dir:
            print(f"Warning: Could not find directory for team {team_id}")
            continue

        # Get overall score
        overall_score = get_team_overall_score(team_name_dir)

        # Generate strategy
        strategy = generate_strategy(team_id, overall_score)
        strategy_file = f"my-world-cup/database/2_ability_models/{team_name_dir}/strategy.json"

        with open(strategy_file, 'w', encoding='utf-8') as f:
            json.dump(strategy, f, indent=2, ensure_ascii=False)

        # Generate recent form
        recent_form = generate_recent_form(team_id, overall_score)
        form_file = f"my-world-cup/database/2_ability_models/{team_name_dir}/recent_form.json"

        with open(form_file, 'w', encoding='utf-8') as f:
            json.dump(recent_form, f, indent=2, ensure_ascii=False)

        print(f"Generated data for {team_id} ({team_name_dir}): overall={overall_score}")

    # Extend odds file
    extend_odds_file()

    print("Pre-match data generation complete!")

if __name__ == "__main__":
    main()