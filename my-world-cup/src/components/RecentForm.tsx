"use client";

import type { RecentFormData } from "@/types/team";

interface RecentFormProps {
  formA: RecentFormData;
  formB: RecentFormData;
  nameA: string;
  nameB: string;
}

const RESULT_COLORS: Record<string, string> = {
  W: "#38a169",
  D: "#a0aec0",
  L: "#e53e3e",
};

function getStatusLabel(winRate: number): string {
  if (winRate >= 0.65) return "状态火热";
  if (winRate >= 0.4) return "状态平稳";
  return "状态低迷";
}

function getStatusColor(winRate: number): string {
  if (winRate >= 0.65) return "#38a169";
  if (winRate >= 0.4) return "#d69e2e";
  return "#e53e3e";
}

export function RecentForm({ formA, formB, nameA, nameB }: RecentFormProps) {
  const winRateA = formA.summary.wins / 10;
  const winRateB = formB.summary.wins / 10;
  const avgGfA = formA.summary.goals_scored / 10;
  const avgGfB = formB.summary.goals_scored / 10;
  const avgGaA = formA.summary.goals_conceded / 10;
  const avgGaB = formB.summary.goals_conceded / 10;

  return (
    <div className="bg-white rounded-lg border border-[#eef0f3] p-4">
      <h4 className="text-xs font-bold text-[#1a1a2e] mb-3 flex items-center gap-1.5">
        📈 近期战绩
      </h4>

      <div className="space-y-1.5 mb-3">
        <FormDots records={formA.last_10} name={nameA} />
        <FormDots records={formB.last_10} name={nameB} />
      </div>

      <div className="space-y-1.5 text-[11px]">
        <StatRow label="胜率" valA={`${(winRateA * 100).toFixed(0)}%`} valB={`${(winRateB * 100).toFixed(0)}%`} highlight={winRateA > winRateB ? "A" : winRateA < winRateB ? "B" : "none"} />
        <StatRow label="场均进球" valA={avgGfA.toFixed(1)} valB={avgGfB.toFixed(1)} highlight={avgGfA > avgGfB ? "A" : avgGfA < avgGfB ? "B" : "none"} />
        <StatRow label="场均失球" valA={avgGaA.toFixed(1)} valB={avgGaB.toFixed(1)} highlight={avgGaA < avgGaB ? "A" : avgGaA > avgGaB ? "B" : "none"} />
      </div>

      <div className="flex items-center justify-between mt-3 text-[10px]">
        <span style={{ color: getStatusColor(winRateA) }}>{nameA} {getStatusLabel(winRateA)}</span>
        <span style={{ color: getStatusColor(winRateB) }}>{nameB} {getStatusLabel(winRateB)}</span>
      </div>
    </div>
  );
}

function FormDots({ records, name }: { records: RecentFormData["last_10"]; name: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-gray-500 w-12 shrink-0 truncate">{name}</span>
      <div className="flex gap-[3px]">
        {records.map((r, i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full inline-block"
            style={{ backgroundColor: RESULT_COLORS[r.result] }}
            title={`${r.opponent} ${r.score}`}
          />
        ))}
      </div>
    </div>
  );
}

function StatRow({ label, valA, valB, highlight }: {
  label: string; valA: string; valB: string; highlight: "A" | "B" | "none";
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 text-right font-medium" style={{ color: highlight === "A" ? "#e53e3e" : "#1a1a2e" }}>{valA}</span>
      <span className="w-12 text-center text-gray-400 shrink-0">{label}</span>
      <span className="flex-1 text-left font-medium" style={{ color: highlight === "B" ? "#3182ce" : "#1a1a2e" }}>{valB}</span>
    </div>
  );
}
