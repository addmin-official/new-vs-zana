import React, { useState } from "react";

export interface BarSeries {
  key: string;
  labelKu: string;
  color: string;
}

export interface BarDataItem {
  label: string;
  values: Record<string, number>;
}

export interface BarChartProps {
  data: BarDataItem[];
  series: BarSeries[];
  height?: number;
  stacked?: boolean;
  title?: string;
  unit?: string;
  className?: string;
}

export const BarChart = React.memo(function BarChart({
  data,
  series,
  height = 260,
  stacked = true,
  title,
  unit = "%",
  className = "",
}: BarChartProps) {
  const [hoveredBar, setHoveredBar] = useState<{
    itemIndex: number;
    seriesKey?: string;
    x: number;
    y: number;
  } | null>(null);

  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;
  const chartWidth = 600;
  const chartHeight = height;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  // Compute maximum value for y-axis
  const maxVal = Math.max(
    1,
    ...data.map((d) => {
      if (stacked) {
        return series.reduce((sum, s) => sum + (d.values[s.key] || 0), 0);
      }
      return Math.max(...series.map((s) => d.values[s.key] || 0));
    })
  );

  const roundedMax = Math.ceil(maxVal / 10) * 10;
  const barGroupWidth = innerWidth / Math.max(data.length, 1);
  const barWidth = stacked
    ? Math.min(36, barGroupWidth * 0.6)
    : Math.min(20, (barGroupWidth * 0.7) / Math.max(series.length, 1));

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4 ${className}`}
      dir="rtl"
    >
      {/* Title & Legend Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {title && (
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 font-sans">
            {title}
          </h4>
        )}
        <div className="flex flex-wrap items-center gap-3">
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-sans">
              <span
                className="w-3 h-3 rounded-md shrink-0 shadow-2xs"
                style={{ backgroundColor: s.color }}
              />
              <span>{s.labelKu}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Responsive SVG Container */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          {/* Grid lines & Y-Axis values */}
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

          {/* Bars Rendering */}
          {data.map((item, dIdx) => {
            const groupX = paddingLeft + dIdx * barGroupWidth + (barGroupWidth - barWidth) / 2;
            let currentStackY = paddingTop + innerHeight;

            return (
              <g key={dIdx}>
                {/* Stacked or Grouped Bars */}
                {stacked ? (
                  series.map((s) => {
                    const val = item.values[s.key] || 0;
                    const segmentHeight = (val / roundedMax) * innerHeight;
                    const y = currentStackY - segmentHeight;
                    currentStackY = y;

                    return (
                      <rect
                        key={s.key}
                        x={groupX}
                        y={y}
                        width={barWidth}
                        height={Math.max(0, segmentHeight)}
                        fill={s.color}
                        rx={2}
                        className="transition-all duration-300 hover:opacity-85 cursor-pointer"
                        onMouseEnter={() => {
                          setHoveredBar({
                            itemIndex: dIdx,
                            seriesKey: s.key,
                            x: groupX + barWidth / 2,
                            y: y,
                          });
                        }}
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                    );
                  })
                ) : (
                  series.map((s, sIdx) => {
                    const val = item.values[s.key] || 0;
                    const bHeight = (val / roundedMax) * innerHeight;
                    const bX =
                      paddingLeft +
                      dIdx * barGroupWidth +
                      (barGroupWidth - series.length * barWidth) / 2 +
                      sIdx * barWidth;
                    const y = paddingTop + innerHeight - bHeight;

                    return (
                      <rect
                        key={s.key}
                        x={bX}
                        y={y}
                        width={barWidth - 2}
                        height={Math.max(0, bHeight)}
                        fill={s.color}
                        rx={3}
                        className="transition-all duration-300 hover:opacity-85 cursor-pointer"
                        onMouseEnter={() =>
                          setHoveredBar({
                            itemIndex: dIdx,
                            seriesKey: s.key,
                            x: bX + barWidth / 2,
                            y: y,
                          })
                        }
                        onMouseLeave={() => setHoveredBar(null)}
                      />
                    );
                  })
                )}

                {/* X-Axis Category Label */}
                <text
                  x={groupX + barWidth / 2}
                  y={chartHeight - 12}
                  textAnchor="middle"
                  className="text-[11px] font-bold fill-slate-600 dark:fill-slate-400 font-sans"
                >
                  {item.label}
                </text>
              </g>
            );
          })}

          {/* Interactive Tooltip Card */}
          {hoveredBar && (
            <g
              transform={`translate(${hoveredBar.x}, ${Math.max(
                20,
                hoveredBar.y - 45
              )})`}
              className="pointer-events-none transition-transform duration-150"
            >
              <rect
                x={-55}
                y={-10}
                width={110}
                height={35}
                rx={8}
                className="fill-slate-900/90 dark:fill-slate-800/95 stroke-slate-700/60 shadow-lg"
              />
              <text
                x={0}
                y={5}
                textAnchor="middle"
                className="text-[10px] font-bold fill-amber-300 font-sans"
              >
                {data[hoveredBar.itemIndex]?.label}
              </text>
              <text
                x={0}
                y={18}
                textAnchor="middle"
                className="text-[10px] font-mono fill-white"
              >
                {hoveredBar.seriesKey
                  ? `${
                      series.find((s) => s.key === hoveredBar.seriesKey)?.labelKu
                    }: ${
                      data[hoveredBar.itemIndex]?.values[
                        hoveredBar.seriesKey
                      ] || 0
                    }${unit}`
                  : ""}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
});
export default BarChart;
