import { getGroupsData, getAllTeamsWithOverall, getOddsData } from "@/lib/data";
import { GroupCard } from "@/components/GroupCard";
import {
  RankingChart,
  buildOddsRanking,
  buildValueRanking,
  buildOverallRanking,
} from "@/components/RankingChart";
import { OverviewFooter } from "@/components/OverviewFooter";

export default function OverviewPage() {
  const groups = getGroupsData();
  const teams = getAllTeamsWithOverall();
  const oddsData = getOddsData();

  const oddsRanking = buildOddsRanking(oddsData);
  const valueRanking = buildValueRanking(teams);
  const overallRanking = buildOverallRanking(teams);

  return (
    <div className="bg-[#f7f8fa] min-h-screen flex flex-col">
      {/* Section: 分组概览 */}
      <div className="px-5 pt-4 pb-0">
        <h1 className="text-lg font-bold text-[#1a1a2e]">48强分组概览</h1>
        <p className="text-[11px] text-gray-400 mt-0.5">
          2026 美加墨世界杯 · 12组 · 48支球队
        </p>
      </div>

      {/* Group Cards Grid */}
      <div className="px-5 py-3">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {groups.map((group) => (
            <GroupCard key={group.group_name} group={group} />
          ))}
        </div>
      </div>

      {/* Section: 数据排行 */}
      <div className="px-5 mt-2">
        <h2 className="text-[15px] font-bold text-[#1a1a2e]">数据排行</h2>
      </div>

      <div className="px-5 py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          <RankingChart
            title="夺冠赔率排行"
            icon="🏆"
            items={oddsRanking}
            higherIsBetter={false}
          />
          <RankingChart
            title="总身价排行"
            icon="💰"
            items={valueRanking}
            higherIsBetter={true}
          />
          <RankingChart
            title="综合能力排行"
            icon="📊"
            items={overallRanking}
            higherIsBetter={true}
            uniformColor={true}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto">
        <OverviewFooter />
      </div>
    </div>
  );
}
