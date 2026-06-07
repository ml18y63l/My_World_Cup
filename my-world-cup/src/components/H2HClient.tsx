"use client";

import { useState, useMemo } from "react";
import type { H2HPageData, SimulationResult, TeamMatchData } from "@/types/simulation";
import { TeamSelect } from "./TeamSelect";
import { RadarCompareChart } from "./RadarCompareChart";
import { TeamInfoCard } from "./TeamInfoCard";
import { OddsCompare } from "./OddsCompare";
import { RecentForm } from "./RecentForm";
import { TacticsAnalysis } from "./TacticsAnalysis";
import { MatchResult } from "./MatchResult";
import { simulateMatch } from "@/lib/simulation";

interface H2HClientProps {
  data: H2HPageData;
}

export function H2HClient({ data }: H2HClientProps) {
  const { teams, radarMap, strategyMap, formMap, oddsMap } = data;
  const [teamAName, setTeamAName] = useState<string | null>(null);
  const [teamBName, setTeamBName] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const teamA: TeamMatchData | null = useMemo(() => {
    if (!teamAName) return null;
    const profile = teams.find((t) => t.team_name_en === teamAName);
    const metrics = radarMap[teamAName];
    if (!profile || !metrics) return null;
    return { profile, metrics, overall_score: profile.overall_score };
  }, [teamAName, teams, radarMap]);

  const teamB: TeamMatchData | null = useMemo(() => {
    if (!teamBName) return null;
    const profile = teams.find((t) => t.team_name_en === teamBName);
    const metrics = radarMap[teamBName];
    if (!profile || !metrics) return null;
    return { profile, metrics, overall_score: profile.overall_score };
  }, [teamBName, teams, radarMap]);

  const bothSelected = teamA !== null && teamB !== null;

  function handleSimulate() {
    if (!teamA || !teamB) return;
    setResult(simulateMatch(teamA, teamB));
  }

  function handleResimulate() {
    if (!teamA || !teamB) return;
    setResult(simulateMatch(teamA, teamB));
  }

  function handleTeamAChange(name: string | null) {
    setTeamAName(name);
    setResult(null);
  }

  function handleTeamBChange(name: string | null) {
    setTeamBName(name);
    setResult(null);
  }

  return (
    <div className="px-6 py-4 max-w-7xl mx-auto">
      {/* Step 1: Team selection */}
      <div className="mb-6">
        <h1 className="text-lg font-bold text-[#1a1a2e] mb-1">对阵模拟</h1>
        <p className="text-[11px] text-gray-400 mb-4">选择两支球队，模拟一场比赛</p>

        <div className="flex items-center justify-center gap-4">
          <TeamSelect
            teams={teams}
            value={teamAName}
            onChange={handleTeamAChange}
            placeholder="选择主队..."
            disabled={teamBName}
          />
          <span className="text-lg font-black text-gray-300 shrink-0">VS</span>
          <TeamSelect
            teams={teams}
            value={teamBName}
            onChange={handleTeamBChange}
            placeholder="选择客队..."
            disabled={teamAName}
          />
        </div>
      </div>

      {/* Step 2: Pre-match comparison */}
      {bothSelected && teamA && teamB && (
        <>
          {/* Radar chart */}
          <div className="mb-6">
            <h2 className="text-[15px] font-bold text-[#1a1a2e] mb-3">能力对比</h2>
            <RadarCompareChart
              metricsA={teamA.metrics}
              metricsB={teamB.metrics}
              nameA={teamA.profile.team_name}
              nameB={teamB.profile.team_name}
            />
          </div>

          {/* Team info cards */}
          <div className="mb-4">
            <h2 className="text-[15px] font-bold text-[#1a1a2e] mb-3">球队信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TeamInfoCard team={teamA} accentColor="red" />
              <TeamInfoCard team={teamB} accentColor="blue" />
            </div>
          </div>

          {/* Pre-match deep analysis */}
          <div className="mb-4">
            <h2 className="text-[15px] font-bold text-[#1a1a2e] mb-3">赛前深度分析</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <OddsCompare
                oddsA={oddsMap[teamA.profile.team_name_en]}
                oddsB={oddsMap[teamB.profile.team_name_en]}
                nameA={teamA.profile.team_name}
                nameB={teamB.profile.team_name}
              />
              <RecentForm
                formA={formMap[teamA.profile.team_name_en]}
                formB={formMap[teamB.profile.team_name_en]}
                nameA={teamA.profile.team_name}
                nameB={teamB.profile.team_name}
              />
              <TacticsAnalysis
                strategyA={strategyMap[teamA.profile.team_name_en]}
                strategyB={strategyMap[teamB.profile.team_name_en]}
                metricsA={teamA.metrics}
                metricsB={teamB.metrics}
                nameA={teamA.profile.team_name}
                nameB={teamB.profile.team_name}
              />
            </div>
          </div>

          {/* Simulate button */}
          <div className="flex justify-center mb-4">
            <button
              onClick={handleSimulate}
              className="px-6 py-2.5 bg-[#e53e3e] text-white text-sm font-semibold rounded-lg hover:bg-[#c53030] transition-colors active:scale-95"
            >
              ⚽ 开始模拟
            </button>
          </div>
        </>
      )}

      {/* Step 3: Match result */}
      {result && teamA && teamB && (
        <MatchResult
          result={result}
          teamA={teamA}
          teamB={teamB}
          onResimulate={handleResimulate}
        />
      )}
    </div>
  );
}
