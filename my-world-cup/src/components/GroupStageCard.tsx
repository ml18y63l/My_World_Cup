import Link from "next/link";
import type { GroupStageGroup, GroupMatch } from "@/types/tournament";
import { GROUP_COLORS } from "@/types/team";

function Flag({ code, alt }: { code?: string; alt: string }) {
  if (!code) return <span className="w-[16px] inline-block shrink-0" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w20/${code}.png`}
      alt={alt}
      width={16}
      height={11}
      className="rounded-[1px] object-cover shrink-0"
    />
  );
}

function MatchRow({
  match,
  codeByTeam,
}: {
  match: GroupMatch;
  codeByTeam: Record<string, string | undefined>;
}) {
  return (
    <div className="flex items-center justify-between gap-1 text-[11px] py-0.5">
      <span className="flex items-center gap-1 flex-1 justify-end truncate text-right">
        {match.home}
      </span>
      <Flag code={codeByTeam[match.home]} alt={match.home} />
      <span className="font-semibold tabular-nums bg-gray-100 rounded px-1.5 py-0.5 shrink-0">
        {match.home_goals}-{match.away_goals}
      </span>
      <Flag code={codeByTeam[match.away]} alt={match.away} />
      <span className="flex items-center gap-1 flex-1 truncate">{match.away}</span>
    </div>
  );
}

const MATCHDAYS = [1, 2] as const;

export function GroupStageCard({ group }: { group: GroupStageGroup }) {
  const color = GROUP_COLORS[group.group] ?? "#999";

  // team_name_en -> country_code，供赛果显示旗帜
  const codeByTeam: Record<string, string | undefined> = {};
  for (const row of group.standings) {
    codeByTeam[row.team_name_en] = row.country_code;
  }

  return (
    <div className="bg-white rounded-lg p-2.5 border border-[#eef0f3] flex flex-col gap-2">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] font-bold uppercase tracking-wider"
          style={{ color }}
        >
          {group.group}组
        </span>
        <span className="text-[9px] text-gray-400">
          更新至 {group.updated_through_date}
        </span>
      </div>

      {/* 积分榜 */}
      <table className="w-full text-[10px] tabular-nums">
        <thead>
          <tr className="text-gray-400 border-b border-gray-100">
            <th className="text-left font-normal py-1 pl-0.5 w-3">#</th>
            <th className="text-left font-normal py-1">球队</th>
            <th className="text-center font-normal py-1 w-4">赛</th>
            <th className="text-center font-normal py-1 w-4">胜</th>
            <th className="text-center font-normal py-1 w-4">平</th>
            <th className="text-center font-normal py-1 w-4">负</th>
            <th className="text-center font-normal py-1 w-4">进</th>
            <th className="text-center font-normal py-1 w-4">失</th>
            <th className="text-center font-normal py-1 w-4">净</th>
            <th className="text-center font-normal py-1 w-5 pr-0.5">分</th>
          </tr>
        </thead>
        <tbody>
          {group.standings.map((row) => {
            const qualified = row.pos <= 2;
            const maybeQualified = row.pos === 3;
            return (
              <tr
                key={row.team_name_en}
                className={`border-b border-gray-50 last:border-0 ${
                  qualified ? "bg-green-50/60" : maybeQualified ? "bg-amber-50/60" : ""
                }`}
              >
                <td className="py-1 pl-0.5 text-gray-400">{row.pos}</td>
                <td className="py-1">
                  <Link
                    href={row.team_id ? `/team/${row.team_id}` : "#"}
                    className="flex items-center gap-1 hover:text-[#3b82f6]"
                  >
                    <Flag code={row.country_code} alt={row.team_name ?? row.team_name_en} />
                    <span className="truncate font-medium">{row.team_name ?? row.team_name_en}</span>
                  </Link>
                </td>
                <td className="text-center text-gray-500">{row.played}</td>
                <td className="text-center">{row.won}</td>
                <td className="text-center text-gray-500">{row.drawn}</td>
                <td className="text-center text-gray-400">{row.lost}</td>
                <td className="text-center text-gray-500">{row.gf}</td>
                <td className="text-center text-gray-400">{row.ga}</td>
                <td className="text-center text-gray-500">
                  {row.gd > 0 ? `+${row.gd}` : row.gd}
                </td>
                <td className="text-center font-bold pr-0.5">{row.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 图例 */}
      <div className="flex gap-2 text-[9px] text-gray-400 -mt-1">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-green-200" />前二晋级
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-amber-200" />可能晋级
        </span>
      </div>

      {/* 赛果 */}
      <div className="border-t border-gray-100 pt-1.5 flex flex-col gap-1.5">
        {MATCHDAYS.map((md) => {
          const dayMatches = group.matches.filter((m) => m.matchday === md);
          if (dayMatches.length === 0) return null;
          return (
            <div key={md}>
              <div className="text-[9px] text-gray-400 mb-0.5">第 {md} 轮</div>
              {dayMatches.map((m, i) => (
                <MatchRow key={i} match={m} codeByTeam={codeByTeam} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
