import Link from "next/link";
import type { TeamOverall } from "@/types/team";

export function TeamRow({ team }: { team: TeamOverall }) {
  const flagUrl = `https://flagcdn.com/w20/${team.country_code}.png`;

  return (
    <Link
      href={`/team/${team.team_id}`}
      className="flex items-center justify-between py-1 px-0.5 rounded hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={flagUrl}
          alt={team.team_name}
          width={18}
          height={13}
          className="rounded-[1px] object-cover"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = "none";
            const fallback = document.createElement("span");
            fallback.textContent = team.team_id;
            fallback.className = "text-[9px] text-gray-400 font-mono w-[18px] text-center";
            target.parentNode?.insertBefore(fallback, target);
          }}
        />
        <span className="font-medium text-[11px]">{team.team_name}</span>
      </div>
      <span className="text-[#3b82f6] font-bold text-[10px]">
        {team.overall_score}
      </span>
    </Link>
  );
}
