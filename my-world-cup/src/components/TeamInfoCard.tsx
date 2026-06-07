"use client";

import type { RadarMetrics } from "@/types/team";
import type { TeamMatchData } from "@/types/simulation";

interface TeamInfoCardProps {
  team: TeamMatchData;
  accentColor: string; // "red" | "blue"
}

const ABILITY_LABELS: Array<{ key: keyof RadarMetrics; label: string }> = [
  { key: "attack", label: "进攻" },
  { key: "defense", label: "防守" },
  { key: "control", label: "控球" },
  { key: "status", label: "状态" },
  { key: "experience", label: "经验" },
  { key: "place_kick", label: "定位球" },
  { key: "superstar", label: "球星" },
  { key: "penalty", label: "点球" },
];

const ACCENT_COLORS = {
  red: { border: "border-l-[#e53e3e]", bg: "bg-[#e53e3e]", bar: "#e53e3e" },
  blue: { border: "border-l-[#3182ce]", bg: "bg-[#3182ce]", bar: "#3182ce" },
};

function formatValue(valueM: number): string {
  if (valueM >= 1000) return `€${(valueM / 1000).toFixed(1)}B`;
  return `€${valueM}M`;
}

export function TeamInfoCard({ team, accentColor }: TeamInfoCardProps) {
  const colors = ACCENT_COLORS[accentColor as "red" | "blue"];
  const { profile, metrics, overall_score } = team;

  return (
    <div className={`bg-white rounded-lg border border-[#eef0f3] p-4 border-l-4 ${colors.border}`}>
      {/* Header: team name + overall */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-[#1a1a2e]">{profile.team_name}</h3>
        <span className="text-xl font-bold" style={{ color: colors.bar }}>
          {overall_score}
        </span>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 mb-4 text-xs">
        <div>
          <span className="text-gray-400">教练</span>
          <p className="text-[#1a1a2e] font-medium">{profile.head_coach}</p>
        </div>
        <div>
          <span className="text-gray-400">阵型</span>
          <p className="text-[#1a1a2e] font-medium">{profile.base_formation}</p>
        </div>
        <div>
          <span className="text-gray-400">总身价</span>
          <p className="text-[#1a1a2e] font-medium">{formatValue(profile.total_value_m_euros)}</p>
        </div>
        <div>
          <span className="text-gray-400">FIFA 排名</span>
          <p className="text-[#1a1a2e] font-medium">#{profile.fifa_ranking}</p>
        </div>
        <div>
          <span className="text-gray-400">足联</span>
          <p className="text-[#1a1a2e] font-medium">{profile.confederation}</p>
        </div>
        <div>
          <span className="text-gray-400">小组</span>
          <p className="text-[#1a1a2e] font-medium">{profile.group} 组</p>
        </div>
      </div>

      {/* Ability bars */}
      <div className="space-y-1.5">
        {ABILITY_LABELS.map((dim) => {
          const val = metrics[dim.key];
          return (
            <div key={dim.key} className="flex items-center gap-2 text-[11px]">
              <span className="w-10 text-gray-500 shrink-0">{dim.label}</span>
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${val}%`,
                    backgroundColor: colors.bar,
                    opacity: 0.7,
                  }}
                />
              </div>
              <span className="w-7 text-right font-medium text-[#1a1a2e]">{val}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
