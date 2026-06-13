import type { RadarMetrics } from "@/types/team";

interface SingleRadarChartProps {
  metrics: RadarMetrics;
  name: string;
}

const DIMENSIONS: Array<{ key: keyof RadarMetrics; label: string }> = [
  { key: "attack", label: "进攻" },
  { key: "control", label: "控球" },
  { key: "defense", label: "防守" },
  { key: "experience", label: "经验" },
  { key: "status", label: "状态" },
  { key: "place_kick", label: "定位球" },
  { key: "superstar", label: "球星" },
  { key: "penalty", label: "点球" },
];

const CX = 200;
const CY = 200;
const RADIUS = 140;
const GRID_LEVELS = [25, 50, 75, 100];
const ACCENT = "#d69e2e"; // 金色

function polarToCartesian(axisIndex: number, value: number) {
  const angle = -Math.PI / 2 + axisIndex * (2 * Math.PI / 8);
  const r = (value / 100) * RADIUS;
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
}

function getAxisEnd(axisIndex: number) {
  const angle = -Math.PI / 2 + axisIndex * (2 * Math.PI / 8);
  return { x: CX + RADIUS * Math.cos(angle), y: CY + RADIUS * Math.sin(angle) };
}

function buildPolygonPoints(metrics: RadarMetrics): string {
  return DIMENSIONS.map((dim, i) => {
    const pt = polarToCartesian(i, metrics[dim.key]);
    return `${pt.x},${pt.y}`;
  }).join(" ");
}

function buildGridOctagon(level: number): string {
  return Array.from({ length: 8 }, (_, i) => {
    const pt = polarToCartesian(i, level);
    return `${pt.x},${pt.y}`;
  }).join(" ");
}

export function SingleRadarChart({ metrics, name }: SingleRadarChartProps) {
  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 400 420"
        className="w-full max-w-[400px]"
        role="img"
        aria-label={`${name} 能力雷达图`}
      >
        {GRID_LEVELS.map((level) => (
          <polygon
            key={level}
            points={buildGridOctagon(level)}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={level === 100 ? 1.5 : 0.8}
            strokeDasharray={level === 100 ? "none" : "3,3"}
          />
        ))}

        {DIMENSIONS.map((_, i) => {
          const end = getAxisEnd(i);
          return (
            <line key={i} x1={CX} y1={CY} x2={end.x} y2={end.y} stroke="#e2e8f0" strokeWidth={0.8} />
          );
        })}

        <polygon
          points={buildPolygonPoints(metrics)}
          fill="rgba(214,158,46,0.18)"
          stroke={ACCENT}
          strokeWidth={2}
        />

        {DIMENSIONS.map((dim, i) => {
          const pt = polarToCartesian(i, metrics[dim.key]);
          return (
            <circle key={dim.key} cx={pt.x} cy={pt.y} r={3.5} fill="white" stroke={ACCENT} strokeWidth={2} />
          );
        })}

        {DIMENSIONS.map((dim, i) => {
          const angle = -Math.PI / 2 + i * (2 * Math.PI / 8);
          const labelR = RADIUS + 28;
          const pos = { x: CX + labelR * Math.cos(angle), y: CY + labelR * Math.sin(angle) };
          let textAnchor: "start" | "middle" | "end" = "middle";
          if (Math.cos(angle) > 0.3) textAnchor = "start";
          if (Math.cos(angle) < -0.3) textAnchor = "end";
          return (
            <g key={`label-${dim.key}`}>
              <text x={pos.x} y={pos.y - 6} textAnchor={textAnchor} className="text-[10px] fill-[#1a1a2e] font-medium">
                {dim.label}
              </text>
              <text x={pos.x} y={pos.y + 7} textAnchor={textAnchor} className="text-[9px]" fill={ACCENT} fontWeight={600}>
                {metrics[dim.key]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
