"use client";

import type { SimulationResult, TeamMatchData } from "@/types/simulation";

interface MatchResultProps {
  result: SimulationResult;
  teamA: TeamMatchData;
  teamB: TeamMatchData;
  onResimulate: () => void;
}

export function MatchResult({ result, teamA, teamB, onResimulate }: MatchResultProps) {
  const { scoreA, scoreB, winRateA, drawRate, winRateB, analyses, keyStats, randomFactor } = result;

  return (
    <div className="bg-white rounded-lg border border-[#eef0f3] p-5 mt-4">
      <h3 className="text-sm font-bold text-[#1a1a2e] mb-4 flex items-center gap-1.5">
        ⚽ 比赛模拟结果
      </h3>

      {/* Score */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <span className="text-base font-bold text-[#e53e3e]">{teamA.profile.team_name}</span>
        <div className="flex items-center gap-2">
          <span className="text-4xl font-black text-[#1a1a2e]">{scoreA}</span>
          <span className="text-xl text-gray-300">:</span>
          <span className="text-4xl font-black text-[#1a1a2e]">{scoreB}</span>
        </div>
        <span className="text-base font-bold text-[#3182ce]">{teamB.profile.team_name}</span>
      </div>

      {/* Probability bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-[#e53e3e] font-medium">{teamA.profile.team_name} {(winRateA * 100).toFixed(0)}%</span>
          <span className="text-gray-500">平局 {(drawRate * 100).toFixed(0)}%</span>
          <span className="text-[#3182ce] font-medium">{teamB.profile.team_name} {(winRateB * 100).toFixed(0)}%</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden flex bg-gray-100">
          <div className="bg-[#e53e3e] transition-all duration-500" style={{ width: `${winRateA * 100}%` }} />
          <div className="bg-gray-300 transition-all duration-500" style={{ width: `${drawRate * 100}%` }} />
          <div className="bg-[#3182ce] transition-all duration-500" style={{ width: `${winRateB * 100}%` }} />
        </div>
      </div>

      {/* Analysis bullet points */}
      <div className="bg-[#f7f8fa] rounded-lg p-3.5 mb-4">
        <h4 className="text-xs font-bold text-[#1a1a2e] mb-2">📊 分析依据</h4>
        <ul className="space-y-1.5 text-[11px] text-gray-600">
          <li className="flex items-start gap-1.5">
            <span className="text-gray-400 mt-0.5">•</span>
            <span>
              综合评分：{teamA.profile.team_name} {teamA.overall_score} vs {teamB.profile.team_name} {teamB.overall_score}
              {teamA.overall_score !== teamB.overall_score && (
                <span className="text-gray-400">
                  {" "}→ 评分差距 {Math.abs(teamA.overall_score - teamB.overall_score).toFixed(1)}，贡献约{" "}
                  {Math.abs(teamA.overall_score - teamB.overall_score) > 5 ? "+5% 以上" : "+2~5%"} 胜率贡献
                </span>
              )}
            </span>
          </li>

          {analyses.map((a) => (
            <li key={a.dimensionKey} className="flex items-start gap-1.5">
              <span className={`mt-0.5 ${a.favorTeam === "A" ? "text-[#e53e3e]" : a.favorTeam === "B" ? "text-[#3182ce]" : "text-gray-400"}`}>•</span>
              <span>
                {a.dimension}：{teamA.profile.team_name} {a.valueA} vs {teamB.profile.team_name} {a.valueB}
                <span className="text-gray-400"> → {a.contribution}</span>
              </span>
            </li>
          ))}

          <li className="flex items-start gap-1.5">
            <span className="text-gray-400 mt-0.5">•</span>
            <span className="text-gray-400">
              随机因素扰动：本次 {randomFactor > 0 ? "+" : ""}{(randomFactor * 100).toFixed(0)}%
            </span>
          </li>
        </ul>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-3 gap-3 mb-4 text-center text-xs">
        <div className="bg-[#f7f8fa] rounded-lg p-2">
          <span className="text-gray-400 block mb-0.5">FIFA 排名</span>
          <span className="font-bold text-[#1a1a2e]">#{keyStats.fifaRankA} vs #{keyStats.fifaRankB}</span>
        </div>
        <div className="bg-[#f7f8fa] rounded-lg p-2">
          <span className="text-gray-400 block mb-0.5">总身价</span>
          <span className="font-bold text-[#1a1a2e]">{keyStats.valueA} vs {keyStats.valueB}</span>
        </div>
        <div className="bg-[#f7f8fa] rounded-lg p-2">
          <span className="text-gray-400 block mb-0.5">预期进球</span>
          <span className="font-bold text-[#1a1a2e]">{keyStats.expectedGoalsA} vs {keyStats.expectedGoalsB}</span>
        </div>
      </div>

      {/* Resimulate button */}
      <div className="flex justify-center">
        <button
          onClick={onResimulate}
          className="px-5 py-2 bg-[#1a1a2e] text-white text-sm font-medium rounded-lg hover:bg-[#2d2d4a] transition-colors active:scale-95"
        >
          🔄 重新模拟
        </button>
      </div>
    </div>
  );
}
