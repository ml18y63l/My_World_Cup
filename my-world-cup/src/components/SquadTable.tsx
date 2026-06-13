"use client";

import { useState } from "react";
import type { SquadData, SquadPlayer } from "@/types/team";

const POSITIONS = ["全部", "GK", "DF", "MF", "FW"] as const;
type Filter = (typeof POSITIONS)[number];

const POS_BADGE: Record<SquadPlayer["position"], string> = {
  GK: "bg-yellow-100 text-yellow-700",
  DF: "bg-blue-100 text-blue-700",
  MF: "bg-green-100 text-green-700",
  FW: "bg-red-100 text-red-700",
};

function formatWan(wan: number): string {
  const m = wan / 100; // 万欧 -> 百万欧
  if (m >= 1000) return `€${(m / 1000).toFixed(1)}B`;
  return `€${m}M`;
}

export function SquadTable({ squad }: { squad: SquadData }) {
  const [filter, setFilter] = useState<Filter>("全部");
  const players = squad.players
    .filter((p) => filter === "全部" || p.position === filter)
    .sort((a, b) => a.number - b.number);

  return (
    <div>
      <div className="flex gap-1.5 mb-2">
        {POSITIONS.map((pos) => (
          <button
            key={pos}
            onClick={() => setFilter(pos)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
              filter === pos ? "bg-[#1a1a2e] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {pos === "全部" ? "全部" : pos}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-gray-400 border-b border-gray-100">
              <th className="text-left py-1.5 px-1 font-medium w-7">#</th>
              <th className="text-left py-1.5 px-1 font-medium w-10">位置</th>
              <th className="text-left py-1.5 px-1 font-medium">球员</th>
              <th className="text-right py-1.5 px-1 font-medium w-9">年龄</th>
              <th className="text-right py-1.5 px-1 font-medium w-9">出场</th>
              <th className="text-right py-1.5 px-1 font-medium w-9">进球</th>
              <th className="text-right py-1.5 px-1 font-medium w-9">助攻</th>
              <th className="text-left py-1.5 px-1 font-medium">俱乐部</th>
              <th className="text-right py-1.5 px-1 font-medium w-14">身价</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.number} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-1.5 px-1 text-gray-400">{p.number}</td>
                <td className="py-1.5 px-1">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${POS_BADGE[p.position]}`}>
                    {p.position}
                  </span>
                </td>
                <td className="py-1.5 px-1">
                  <div className="font-medium text-[#1a1a2e]">{p.name_cn}</div>
                  <div className="text-[9px] text-gray-400">{p.name_en}</div>
                </td>
                <td className="py-1.5 px-1 text-right text-gray-600">{p.age ?? "-"}</td>
                <td className="py-1.5 px-1 text-right text-gray-600">{p.caps}</td>
                <td className="py-1.5 px-1 text-right text-gray-600">{p.goals}</td>
                <td className="py-1.5 px-1 text-right text-gray-600">{p.assists ?? "-"}</td>
                <td className="py-1.5 px-1 text-gray-600">{p.club_cn}</td>
                <td className="py-1.5 px-1 text-right font-medium text-[#1a1a2e]">{formatWan(p.value_wan_euros)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
