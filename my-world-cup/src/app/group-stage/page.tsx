import { getGroupStageData } from "@/lib/data";
import { GroupStageCard } from "@/components/GroupStageCard";

export const metadata = {
  title: "小组赛进程 · 2026 World Cup",
};

export default function GroupStagePage() {
  const data = getGroupStageData();

  return (
    <div className="bg-[#f7f8fa] min-h-screen flex flex-col">
      {/* 标题 */}
      <div className="px-5 pt-4 pb-0">
        <h1 className="text-lg font-bold text-[#1a1a2e]">小组赛进程</h1>
        <p className="text-[11px] text-gray-400 mt-0.5">
          2026 美加墨世界杯 · 12 组 · 每组前二直接晋级，另设 8 个成绩最好的小组第三
          {" · "}
          已完成 {data.rounds_complete}/{data.total_rounds} 轮
          {data.updated_through_date ? ` · 数据截至 ${data.updated_through_date}` : ""}
        </p>
      </div>

      {/* 小组卡片 */}
      <div className="px-5 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {data.groups.map((group) => (
            <GroupStageCard key={group.group} group={group} />
          ))}
        </div>
      </div>

      {/* 数据说明 */}
      <div className="mt-auto px-5 py-2.5 border-t border-[#e2e8f0] text-[10px] text-[#aaa] leading-relaxed">
        <span>数据源：{data.source || "FIFA / Wikipedia 官方积分榜"}</span>
        <span className="mx-1.5">·</span>
        <span>
          积分榜为官方数据；少数场次比分由官方进/失球总数唯一还原（无单独头条出处），已在原始数据中标注。
        </span>
      </div>
    </div>
  );
}
