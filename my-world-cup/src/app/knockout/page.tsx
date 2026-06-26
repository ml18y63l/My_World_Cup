import { getKnockoutStageData } from "@/lib/data";
import type { KnockoutTie } from "@/types/tournament";

export const metadata = {
  title: "淘汰赛进程 · 2026 World Cup",
};

function Flag({ code, alt }: { code?: string; alt: string }) {
  if (!code) return <span className="w-[18px] inline-block shrink-0" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w20/${code}.png`}
      alt={alt}
      width={18}
      height={12}
      className="rounded-[1px] object-cover shrink-0"
    />
  );
}

function TieCard({ tie }: { tie: KnockoutTie }) {
  const played = tie.played && tie.home_goals !== null && tie.away_goals !== null;
  const settled = Boolean(tie.home_team && tie.away_team);

  return (
    <div
      className={`rounded-lg border p-2.5 flex flex-col gap-1.5 ${
        played
          ? "border-[#e2e8f0] bg-white"
          : settled
          ? "border-[#c7d2fe] bg-white"
          : "border-dashed border-gray-200 bg-gray-50/60"
      }`}
    >
      <div className="flex items-center justify-between text-[9px] text-gray-400">
        <span>M{tie.match}</span>
        {played ? (
          <span className="text-[#38a169]">已结束</span>
        ) : settled ? (
          <span className="text-[#3b82f6]">待赛</span>
        ) : (
          <span className="text-gray-400">待定</span>
        )}
      </div>

      <div className="flex flex-col gap-1 text-[12px]">
        {/* 主队 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 truncate">
            <Flag code={tie.home_country_code} alt={tie.home_team_name ?? tie.home_slot} />
            <span className="truncate font-medium">
              {tie.home_team_name ?? <span className="text-gray-400 font-normal">{tie.home_slot}</span>}
            </span>
          </div>
          {played && (
            <span className="font-bold tabular-nums">{tie.home_goals}</span>
          )}
        </div>
        {/* 客队 */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 truncate">
            <Flag code={tie.away_country_code} alt={tie.away_team_name ?? tie.away_slot} />
            <span className="truncate font-medium">
              {tie.away_team_name ?? <span className="text-gray-400 font-normal">{tie.away_slot}</span>}
            </span>
          </div>
          {played && (
            <span className="font-bold tabular-nums">{tie.away_goals}</span>
          )}
        </div>
      </div>
    </div>
  );
}

const COLS: Record<string, string> = {
  round_of_32: "lg:grid-cols-4",
  round_of_16: "lg:grid-cols-4",
  quarter_finals: "lg:grid-cols-4",
  semi_finals: "lg:grid-cols-2",
  third_place: "lg:grid-cols-1",
  final: "lg:grid-cols-1",
};

export default function KnockoutPage() {
  const data = getKnockoutStageData();

  return (
    <div className="bg-[#f7f8fa] min-h-screen flex flex-col">
      {/* 标题 */}
      <div className="px-5 pt-4 pb-0">
        <h1 className="text-lg font-bold text-[#1a1a2e]">淘汰赛进程</h1>
        <p className="text-[11px] text-gray-400 mt-0.5">
          2026 美加墨世界杯 · 32 队单败淘汰 · {data.format}
        </p>
      </div>

      {/* 未开始提示 */}
      {!data.started && (
        <div className="px-5 mt-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
            <span className="font-semibold">淘汰赛尚未开始。</span>
            {data.note}
          </div>
        </div>
      )}

      {/* 各轮对阵框架 */}
      <div className="px-5 py-3 flex flex-col gap-4">
        {data.rounds.map((round) => (
          <section key={round.round}>
            <h2 className="text-[13px] font-bold text-[#1a1a2e] mb-1.5 flex items-center gap-2">
              {round.label}
              <span className="text-[10px] font-normal text-gray-400">
                {round.ties.length} 场
              </span>
            </h2>
            <div className={`grid grid-cols-1 md:grid-cols-2 ${COLS[round.round] ?? "lg:grid-cols-3"} gap-2`}>
              {round.ties.map((tie) => (
                <TieCard key={tie.id} tie={tie} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* 说明 */}
      <div className="mt-auto px-5 py-2.5 border-t border-[#e2e8f0] text-[10px] text-[#aaa] leading-relaxed">
        <span>
          对阵“抽签位置”依据 FIFA 官方对阵表（如 A组第1、M74胜者等）；8 个成绩最好的小组第三的对位将在小组赛第3轮结束后，由 FIFA 公布的第三名排名表确定。
        </span>
      </div>
    </div>
  );
}
