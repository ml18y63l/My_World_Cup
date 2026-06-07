"use client";

import type { RadarMetrics, StrategyData } from "@/types/team";
import type { TacticalStyle } from "@/lib/tactics";
import { determineTacticsMatchup, STYLE_LABELS } from "@/lib/tactics";

interface TacticsAnalysisProps {
  strategyA: StrategyData;
  strategyB: StrategyData;
  metricsA: RadarMetrics;
  metricsB: RadarMetrics;
  nameA: string;
  nameB: string;
}

const STYLE_COLORS: Record<TacticalStyle, string> = {
  possession: "#3182ce",
  counter_attack: "#ed8936",
  pressing: "#e53e3e",
  balanced: "#718096",
  defensive: "#805ad5",
};

export function TacticsAnalysis({ strategyA, strategyB, metricsA, metricsB, nameA, nameB }: TacticsAnalysisProps) {
  const matchup = determineTacticsMatchup(
    strategyA.style as TacticalStyle,
    strategyB.style as TacticalStyle
  );

  const controlDiff = metricsA.control - metricsB.control;
  const attackDiff = metricsA.attack - metricsB.attack;
  let matchInsight = "";
  if (Math.abs(controlDiff) > 10) {
    const stronger = controlDiff > 0 ? nameA : nameB;
    matchInsight = `${stronger}控球优势明显，预计掌控比赛节奏`;
  } else if (Math.abs(attackDiff) > 10) {
    const stronger = attackDiff > 0 ? nameA : nameB;
    matchInsight = `${stronger}进攻火力占优，对手防线压力大`;
  } else {
    matchInsight = "双方实力接近，中场争夺将是关键";
  }

  return (
    <div className="bg-white rounded-lg border border-[#eef0f3] p-4">
      <h4 className="text-xs font-bold text-[#1a1a2e] mb-3 flex items-center gap-1.5">
        ⚔️ 战术分析
      </h4>

      <div className="flex items-center justify-between mb-3 text-[11px]">
        <div className="text-center flex-1">
          <p className="font-bold text-[#1a1a2e]">{strategyA.formation}</p>
          <span
            className="inline-block px-2 py-0.5 rounded-full text-[9px] font-medium text-white mt-1"
            style={{ backgroundColor: STYLE_COLORS[strategyA.style as TacticalStyle] }}
          >
            {STYLE_LABELS[strategyA.style as TacticalStyle]}
          </span>
        </div>
        <span className="text-gray-300 text-xs mx-2">vs</span>
        <div className="text-center flex-1">
          <p className="font-bold text-[#1a1a2e]">{strategyB.formation}</p>
          <span
            className="inline-block px-2 py-0.5 rounded-full text-[9px] font-medium text-white mt-1"
            style={{ backgroundColor: STYLE_COLORS[strategyB.style as TacticalStyle] }}
          >
            {STYLE_LABELS[strategyB.style as TacticalStyle]}
          </span>
        </div>
      </div>

      <div className="bg-[#f7f8fa] rounded-lg p-2.5 mb-2">
        {matchup.hasCounter ? (
          <>
            <p className="text-[11px] font-medium" style={{ color: "#38a169" }}>
              {matchup.description}
            </p>
            <p className="text-[10px] text-gray-500 mt-1">
              预计影响 ±{(matchup.advantage * 100).toFixed(0)}% 胜率
            </p>
          </>
        ) : (
          <p className="text-[11px] text-gray-500">{matchup.description}</p>
        )}
      </div>

      <p className="text-[10px] text-gray-600 leading-relaxed">{matchInsight}</p>
    </div>
  );
}
