"use client";

import type { OddsEntry } from "@/types/team";
import { calculateH2HOdds } from "@/lib/h2h-odds";

interface OddsCompareProps {
  oddsA: OddsEntry;
  oddsB: OddsEntry;
  nameA: string;
  nameB: string;
}

export function OddsCompare({ oddsA, oddsB, nameA, nameB }: OddsCompareProps) {
  const h2h = calculateH2HOdds(oddsA, oddsB);

  const verdict =
    Math.abs(h2h.probWinA - h2h.probWinB) < 0.08
      ? "赔率接近，势均力敌"
      : h2h.probWinA > h2h.probWinB
        ? `博彩机构更看好 ${nameA}`
        : `博彩机构更看好 ${nameB}`;

  return (
    <div className="bg-white rounded-lg border border-[#eef0f3] p-4">
      <h4 className="text-xs font-bold text-[#1a1a2e] mb-3 flex items-center gap-1.5">
        📊 赔率对比
      </h4>

      <div className="mb-3">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-[#e53e3e] font-medium">{nameA} {(h2h.probWinA * 100).toFixed(0)}%</span>
          <span className="text-gray-500">平局 {(h2h.probDraw * 100).toFixed(0)}%</span>
          <span className="text-[#3182ce] font-medium">{nameB} {(h2h.probWinB * 100).toFixed(0)}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden flex bg-gray-100">
          <div className="bg-[#e53e3e] transition-all duration-500" style={{ width: `${h2h.probWinA * 100}%` }} />
          <div className="bg-gray-300 transition-all duration-500" style={{ width: `${h2h.probDraw * 100}%` }} />
          <div className="bg-[#3182ce] transition-all duration-500" style={{ width: `${h2h.probWinB * 100}%` }} />
        </div>
      </div>

      <div className="space-y-1.5 text-[11px]">
        <OddsRow label="胜" oddsLeft={h2h.winA} oddsRight={h2h.winB} />
        <OddsRow label="平" oddsLeft={h2h.draw} oddsRight={h2h.draw} />
        <OddsRow label="负" oddsLeft={h2h.winB} oddsRight={h2h.winA} />
      </div>

      <p className="text-[10px] text-gray-500 mt-3 text-center italic">{verdict}</p>
    </div>
  );
}

function OddsRow({ label, oddsLeft, oddsRight }: { label: string; oddsLeft: number; oddsRight: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-5 text-gray-400 shrink-0">{label}</span>
      <span className={`flex-1 text-right font-medium ${oddsLeft < oddsRight ? "text-[#e53e3e]" : "text-[#1a1a2e]"}`}>
        {oddsLeft.toFixed(2)}
      </span>
      <span className="w-6 text-center text-gray-300 shrink-0">—</span>
      <span className={`flex-1 text-left font-medium ${oddsRight < oddsLeft ? "text-[#3182ce]" : "text-[#1a1a2e]"}`}>
        {oddsRight.toFixed(2)}
      </span>
    </div>
  );
}
