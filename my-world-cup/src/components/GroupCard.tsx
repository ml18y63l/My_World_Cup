import type { GroupData } from "@/types/team";
import { TeamRow } from "./TeamRow";

export function GroupCard({ group }: { group: GroupData }) {
  return (
    <div className="bg-white rounded-lg p-2.5 border border-[#eef0f3] hover:-translate-y-0.5 hover:shadow-md transition-all cursor-default">
      <div
        className="text-[10px] font-bold uppercase tracking-wider mb-1.5"
        style={{ color: group.color }}
      >
        {group.group_name}组
      </div>
      <div className="flex flex-col gap-0.5">
        {group.teams.map((team) => (
          <TeamRow key={team.team_id} team={team} />
        ))}
      </div>
    </div>
  );
}
