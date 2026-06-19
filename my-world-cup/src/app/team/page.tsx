import { getGroupsData } from "@/lib/data";
import { GroupCard } from "@/components/GroupCard";

export default function TeamsIndexPage() {
  const groups = getGroupsData();

  return (
    <div className="bg-[#f7f8fa] min-h-screen flex flex-col">
      <div className="px-5 pt-4 pb-0">
        <h1 className="text-lg font-bold text-[#1a1a2e]">球队画像</h1>
        <p className="text-[11px] text-gray-400 mt-0.5">
          48支球队 · 点击任一球队查看大名单、能力雷达与近期战绩
        </p>
      </div>

      <div className="px-5 py-3">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {groups.map((group) => (
            <GroupCard key={group.group_name} group={group} />
          ))}
        </div>
      </div>
    </div>
  );
}
