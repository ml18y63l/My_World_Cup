import { getAllTeamsWithRadar, getStrategiesMap, getRecentFormsMap, getOddsMap } from "@/lib/data";
import { H2HClient } from "@/components/H2HClient";

export default function H2HPage() {
  const { teams, radarMap } = getAllTeamsWithRadar();
  const strategyMap = getStrategiesMap();
  const formMap = getRecentFormsMap();
  const oddsMap = getOddsMap();

  return (
    <div className="bg-[#f7f8fa] min-h-screen flex flex-col">
      <H2HClient data={{ teams, radarMap, strategyMap, formMap, oddsMap }} />
    </div>
  );
}
