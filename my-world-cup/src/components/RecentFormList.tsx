import type { RecentFormData } from "@/types/team";

const RESULT_STYLE: Record<string, string> = {
  W: "bg-green-500 text-white",
  D: "bg-gray-400 text-white",
  L: "bg-red-500 text-white",
};
const TYPE_LABEL: Record<string, string> = {
  friendly: "友谊赛",
  qualifier: "预选赛",
  tournament: "正赛",
};

export function RecentFormList({ form }: { form: RecentFormData }) {
  const matches = form.last_10;
  const { wins, draws, losses, goals_scored, goals_conceded } = form.summary;
  return (
    <div>
      <div className="flex gap-4 mb-3 text-xs">
        <span className="text-gray-500">
          近况 <b className="text-[#1a1a2e]">{wins}胜 {draws}平 {losses}负</b>
        </span>
        <span className="text-gray-500">
          进失球 <b className="text-[#1a1a2e]">{goals_scored} / {goals_conceded}</b>
        </span>
      </div>
      <div className="space-y-1">
        {matches.map((m, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px] py-0.5">
            <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] ${RESULT_STYLE[m.result]}`}>
              {m.result}
            </span>
            {m.date && <span className="text-gray-400 w-20">{m.date}</span>}
            <span className="flex-1 text-[#1a1a2e] font-medium">{m.opponent}</span>
            <span className="text-gray-500 w-16 text-right">{TYPE_LABEL[m.type] ?? m.type}</span>
            <span className="font-bold text-[#1a1a2e] w-10 text-right">{m.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
