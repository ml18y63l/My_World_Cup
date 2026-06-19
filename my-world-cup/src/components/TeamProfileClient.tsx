"use client";

import type { TeamPageData, RadarMetrics } from "@/types/team";
import { SingleRadarChart } from "./SingleRadarChart";
import { SquadTable } from "./SquadTable";
import { RecentFormList } from "./RecentFormList";

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

function formatValue(valueM: number): string {
  if (valueM >= 1000) return `€${(valueM / 1000).toFixed(1)}B`;
  return `€${valueM}M`;
}

export function TeamProfileClient({ data }: { data: TeamPageData }) {
  const { profile, radar, squad, form, overall_score, is_placeholder } = data;
  const flagUrl = `https://flagcdn.com/w40/${profile.country_code}.png`;

  return (
    <div className="px-5 py-4 w-full max-w-5xl mx-auto">
      {/* 头部 */}
      <div className="flex items-center gap-3 mb-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={flagUrl} alt={profile.team_name} width={40} height={28} className="rounded-[2px] object-cover" />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[#1a1a2e]">{profile.team_name}</h1>
          <p className="text-[11px] text-gray-400">{profile.team_name_en} · {profile.confederation} · {profile.group}组</p>
        </div>
        {radar && (
          <div className="text-right">
            <div className="text-2xl font-black text-[#d69e2e]">{overall_score}</div>
            <div className="text-[10px] text-gray-400">综合</div>
          </div>
        )}
      </div>

      {/* 占位数据警示 */}
      {is_placeholder && (
        <div className="mb-5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 flex items-start gap-2.5">
          <span className="text-amber-500 text-base leading-5 shrink-0">⚠</span>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-amber-800">占位数据 · 无参考价值</p>
            <p className="text-[11px] leading-relaxed text-amber-700 mt-0.5">
              本页能力雷达、近期战绩与综合评分均为模板占位数据，尚未录入真实数据，请勿用于分析或球队对比。
            </p>
          </div>
        </div>
      )}

      {/* 概览卡 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {[
          { label: "主教练", value: profile.head_coach },
          { label: "总身价", value: formatValue(profile.total_value_m_euros) },
          { label: "FIFA 排名", value: `#${profile.fifa_ranking}` },
          ...(profile.base_formation ? [{ label: "阵型", value: profile.base_formation }] : []),
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-lg p-3 border border-[#eef0f3]">
            <div className="text-[10px] text-gray-400">{c.label}</div>
            <div className="text-sm font-semibold text-[#1a1a2e] mt-0.5">{c.value}</div>
          </div>
        ))}
      </div>
      {profile.qualification && (
        <p className="text-[11px] text-gray-400 -mt-4 mb-6">晋级方式：{profile.qualification}</p>
      )}

      {/* 雷达 + 能力条 */}
      {radar && (
        <div className="bg-white rounded-lg p-4 border border-[#eef0f3] mb-6">
          <h2 className="text-[15px] font-bold text-[#1a1a2e] mb-3">能力雷达</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <SingleRadarChart metrics={radar} name={profile.team_name} />
            <div className="space-y-1.5">
              {ABILITY_LABELS.map((dim) => (
                <div key={dim.key} className="flex items-center gap-2 text-[11px]">
                  <span className="w-10 text-gray-500 shrink-0">{dim.label}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${radar[dim.key]}%`, backgroundColor: "#d69e2e", opacity: 0.75 }} />
                  </div>
                  <span className="w-7 text-right font-medium text-[#1a1a2e]">{radar[dim.key]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 大名单 */}
      {squad ? (
        <div className="bg-white rounded-lg p-4 border border-[#eef0f3] mb-6">
          <h2 className="text-[15px] font-bold text-[#1a1a2e] mb-3">大名单（{squad.players.length}人）</h2>
          <SquadTable squad={squad} />
        </div>
      ) : (
        <div className="bg-white rounded-lg p-4 border border-[#eef0f3] mb-6 text-[11px] text-gray-400">
          暂无大名单数据
        </div>
      )}

      {/* 近期战绩 */}
      {form && (
        <div className="bg-white rounded-lg p-4 border border-[#eef0f3]">
          <h2 className="text-[15px] font-bold text-[#1a1a2e] mb-3">近期战绩</h2>
          <RecentFormList form={form} />
        </div>
      )}
    </div>
  );
}
