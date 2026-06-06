import { BAR_GRADIENTS } from "@/types/team";
import { formatValue } from "@/lib/data";

interface RankingItem {
  team_name: string;
  country_code: string;
  value: number;
  displayValue: string;
}

interface RankingChartProps {
  title: string;
  icon: string;
  items: RankingItem[];
  higherIsBetter?: boolean;
  uniformColor?: boolean;
}

export function RankingChart({
  title,
  icon,
  items,
  higherIsBetter = true,
  uniformColor = false,
}: RankingChartProps) {
  const maxVal = Math.max(...items.map((i) => i.value));
  const minVal = Math.min(...items.map((i) => i.value));
  const range = maxVal - minVal || 1;

  return (
    <div className="bg-white rounded-lg p-3 border border-[#eef0f3]">
      <div className="text-xs font-bold mb-2.5 flex items-center gap-1">
        {icon} {title}
      </div>
      <div className="flex flex-col gap-1.5">
        {items.map((item, idx) => {
          const normalized = higherIsBetter
            ? ((item.value - minVal) / range) * 60 + 35
            : (1 - (item.value - minVal) / range) * 60 + 35;
          const gradient = uniformColor
            ? "linear-gradient(90deg, #3b82f6, #60a5fa)"
            : BAR_GRADIENTS[idx % BAR_GRADIENTS.length];

          return (
            <div key={`${idx}-${item.team_name}`} className="flex items-center gap-1.5 text-[10px]">
              <span className="w-14 shrink-0 font-medium truncate">{item.team_name}</span>
              <div className="flex-1 bg-[#eef0f3] rounded-[3px] h-3.5 overflow-hidden">
                <div
                  className="h-full rounded-[3px]"
                  style={{
                    width: `${normalized}%`,
                    background: gradient,
                  }}
                />
              </div>
              <span className="w-8 shrink-0 text-right font-bold">{item.displayValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function buildOddsRanking(
  oddsData: { team_name: string; country_code: string; odds: number }[]
): RankingItem[] {
  return oddsData.slice(0, 10).map((o) => ({
    team_name: o.team_name,
    country_code: o.country_code,
    value: o.odds,
    displayValue: String(o.odds),
  }));
}

export function buildValueRanking(
  teams: { team_name: string; country_code: string; total_value_m_euros: number }[]
): RankingItem[] {
  return [...teams]
    .sort((a, b) => b.total_value_m_euros - a.total_value_m_euros)
    .slice(0, 10)
    .map((t) => ({
      team_name: t.team_name,
      country_code: t.country_code,
      value: t.total_value_m_euros,
      displayValue: formatValue(t.total_value_m_euros),
    }));
}

export function buildOverallRanking(
  teams: { team_name: string; country_code: string; overall_score: number }[]
): RankingItem[] {
  return [...teams]
    .sort((a, b) => b.overall_score - a.overall_score)
    .slice(0, 10)
    .map((t) => ({
      team_name: t.team_name,
      country_code: t.country_code,
      value: t.overall_score,
      displayValue: String(t.overall_score),
    }));
}
