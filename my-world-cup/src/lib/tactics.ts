export type TacticalStyle = "possession" | "counter_attack" | "pressing" | "balanced" | "defensive";

export interface TacticsMatchup {
  hasCounter: boolean;
  counterStyle: string;
  counteredStyle: string;
  counterTeam: "A" | "B" | "none";
  advantage: number;
  description: string;
}

export const STYLE_LABELS: Record<TacticalStyle, string> = {
  possession: "控球渗透",
  counter_attack: "防守反击",
  pressing: "高位逼抢",
  balanced: "均衡",
  defensive: "深度防守",
};

const COUNTER_MAP: Record<TacticalStyle, TacticalStyle | null> = {
  possession: "defensive",
  counter_attack: "possession",
  pressing: "counter_attack",
  defensive: "pressing",
  balanced: null,
};

export function determineTacticsMatchup(
  styleA: TacticalStyle,
  styleB: TacticalStyle
): TacticsMatchup {
  if (COUNTER_MAP[styleA] === styleB) {
    return {
      hasCounter: true,
      counterStyle: STYLE_LABELS[styleA],
      counteredStyle: STYLE_LABELS[styleB],
      counterTeam: "A",
      advantage: 0.05,
      description: `主队的${STYLE_LABELS[styleA]}战术克制客队的${STYLE_LABELS[styleB]}`,
    };
  }

  if (COUNTER_MAP[styleB] === styleA) {
    return {
      hasCounter: true,
      counterStyle: STYLE_LABELS[styleB],
      counteredStyle: STYLE_LABELS[styleA],
      counterTeam: "B",
      advantage: 0.05,
      description: `客队的${STYLE_LABELS[styleB]}战术克制主队的${STYLE_LABELS[styleA]}`,
    };
  }

  return {
    hasCounter: false,
    counterStyle: "",
    counteredStyle: "",
    counterTeam: "none",
    advantage: 0,
    description: "双方战术风格无明显克制关系",
  };
}