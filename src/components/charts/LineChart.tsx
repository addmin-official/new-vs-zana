import React, { useState } from "react";

export interface LinePoint {
  xLabel: string;
  yValue: number;
}

export interface LineChartProps {
  data: LinePoint[];
  height?: number;
  lineColor?: string;
  fillColor?: string;
  title?: string;
  unit?: string;
  className?: string;
}

export const LineChart = React.memo(function LineChart({
  data,
  height = 240,
  lineColor = "#6366f1",
  fillColor = "rgba(99, 102, 241, 0.15)",
  title,
  unit = "",
  className = "",
}: LineChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    index: number;
    x: number;
    y: number;
  } | null>(null);

  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;
  const chartWidth = 600;
  const chartHeight = height;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  if (data.length === 0) {
    return (
      <div className={`p-6 text-center text-xs text-slate-400 font-sans ${className}`}>
        زانیاری بەردەست نییە
      </div>
    );
  }

  const maxY = Math.max(1, ...data.map((d) => d.yValue));
  const roundedMax = Math.ceil(maxY / 10) * 10;

  // Calculate coordinates for points
  const points = data.map((d, idx) => {
    const x = paddingLeft + (idx / Math.max(data.length - 1, 1)) * innerWidth;
    const y = paddingTop + innerHeight * (1 - d.yValue / roundedMax);
    return { x, y, ...d };
  });

  // Build SVG path string with smooth bezier curve
  const pathD = points.reduce((acc, curr, idx) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    const prev = points[idx - 1];
    const cp1x = prev.x + (curr.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (curr.x - prev.x) / 2;
    const cp2y = curr.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
  }, "");

  // Area path closing at baseline
  const areaD = `${pathD} L ${points[points.length - 1].x} ${
    paddingTop + innerHeight
  } L ${points[0].x} ${paddingTop + innerHeight} Z`;

  // Filter X-axis labels to avoid crowding (show ~5 to 6 labels)
  const step = Math.max(1, Math.floor(data.length / 6));

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4 ${className}`}
      dir="rtl"
    >
      {title && (
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 font-sans">
            {title}
          </h4>
          <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full">
            ئەوپەڕی: {maxY}
            {unit}
          </span>
        </div>
      )}

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id={`line-area-grad-${title || "main"}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillColor || lineColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = paddingTop + innerHeight * (1 - pct);
            const val = Math.round(roundedMax * pct);
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  strokeDasharray="4 4"
                  className="text-slate-100 dark:text-slate-800"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 dark:fill-slate-500 font-mono font-medium"
                >
                  {val}
                  {unit}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill={`url(#line-area-grad-${title || "main"})`} />

          {/* Curve Line */}
          <path
            d={pathD}
            fill="none"
            stroke={lineColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {/* Data Points */}
          {points.map((pt, idx) => {
            const isHovered = hoveredPoint?.index === idx;
            return (
              <circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 6 : 3.5}
                fill={lineColor}
                stroke="#ffffff"
                strokeWidth={isHovered ? 2.5 : 1.5}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredPoint({ index: idx, x: pt.x, y: pt.y })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}

          {/* X-Axis Labels */}
          {points.map((pt, idx) => {
            if (idx % step !== 0 && idx !== points.length - 1) return null;
            return (
              <text
                key={idx}
                x={pt.x}
                y={chartHeight - 10}
                textAnchor="middle"
                className="text-[10px] fill-slate-400 dark:fill-slate-500 font-sans font-medium"
              >
                {pt.xLabel}
              </text>
            );
          })}

          {/* Hover Tooltip Box */}
          {hoveredPoint && (
            <g
              transform={`translate(${hoveredPoint.x}, ${Math.max(
                15,
                hoveredPoint.y - 40
              )})`}
              className="pointer-events-none transition-transform duration-100"
            >
              <rect
                x={-45}
                y={-10}
                width={90}
                height={32}
                rx={8}
                className="fill-slate-900/90 dark:fill-slate-800/95 stroke-slate-700/60 shadow-lg"
              />
              <text
                x={0}
                y={4}
                textAnchor="middle"
                className="text-[10px] font-bold fill-amber-300 font-sans"
              >
                {data[hoveredPoint.index]?.xLabel}
              </text>
              <text
                x={0}
                y={16}
                textAnchor="middle"
                className="text-[10px] font-mono fill-white font-bold"
              >
                {data[hoveredPoint.index]?.yValue} {unit}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
});

export default LineChart;
