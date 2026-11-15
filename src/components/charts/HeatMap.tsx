import React, { useState } from "react";

export interface HeatMapCell {
  dayIndex: number; // 0 = شەممە (Saturday) to 6 = هەینی (Friday)
  hour: number; // 0 to 23
  value: number;
}

export interface HeatMapProps {
  data: HeatMapCell[];
  daysKu?: string[];
  title?: string;
  className?: string;
}

const DEFAULT_DAYS_KU = [
  "شەممە",
  "یەکشەممە",
  "دووشەممە",
  "سێشەممە",
  "چوارشەممە",
  "پێنجشەممە",
  "هەینی",
];

export const HeatMap = React.memo(function HeatMap({
  data,
  daysKu = DEFAULT_DAYS_KU,
  title = "نەخشەی گەرمیی چالاکی (ڕۆژ و کاتژمێر)",
  className = "",
}: HeatMapProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    dayIndex: number;
    hour: number;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  const maxValue = Math.max(1, ...data.map((d) => d.value));

  // Build matrix lookup
  const matrix: Record<string, number> = {};
  data.forEach((c) => {
    matrix[`${c.dayIndex}-${c.hour}`] = c.value;
  });

  const getCellColor = (val: number) => {
    if (val === 0) return "rgba(241, 245, 249, 0.7)"; // slate-100
    const ratio = Math.min(1, val / maxValue);
    if (ratio < 0.25) return "rgba(199, 210, 254, 0.6)"; // indigo-200
    if (ratio < 0.5) return "rgba(129, 140, 248, 0.8)"; // indigo-400
    if (ratio < 0.75) return "rgba(79, 70, 229, 0.9)"; // indigo-600
    return "rgba(67, 56, 202, 1.0)"; // indigo-700
  };

  const chartWidth = 640;
  const chartHeight = 220;
  const labelWidth = 65;
  const headerHeight = 25;
  const innerWidth = chartWidth - labelWidth - 15;
  const innerHeight = chartHeight - headerHeight - 15;

  const cellWidth = innerWidth / 24;
  const cellHeight = innerHeight / 7;

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4 ${className}`}
      dir="rtl"
    >
      {/* Title & Color Scale Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 font-sans">
          {title}
        </h4>
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-sans">
          <span>کەمتر</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-xs bg-slate-100 dark:bg-slate-800" />
            <span className="w-3 h-3 rounded-xs bg-indigo-200" />
            <span className="w-3 h-3 rounded-xs bg-indigo-400" />
            <span className="w-3 h-3 rounded-xs bg-indigo-600" />
            <span className="w-3 h-3 rounded-xs bg-indigo-800" />
          </div>
          <span>زیاتر</span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          {/* Hour Labels on Top (00, 04, 08, 12, 16, 20) */}
          {[0, 4, 8, 12, 16, 20, 23].map((hr) => {
            const x = labelWidth + hr * cellWidth + cellWidth / 2;
            return (
              <text
                key={hr}
                x={x}
                y={15}
                textAnchor="middle"
                className="text-[9px] font-mono fill-slate-400 dark:fill-slate-500 font-medium"
              >
                {String(hr).padStart(2, "0")}:00
              </text>
            );
          })}

          {/* Rows for each day */}
          {daysKu.map((dayName, dIdx) => {
            const y = headerHeight + dIdx * cellHeight;
            return (
              <g key={dIdx}>
                {/* Day Label on Right */}
                <text
                  x={labelWidth - 8}
                  y={y + cellHeight / 2 + 3}
                  textAnchor="end"
                  className="text-[10px] font-bold fill-slate-600 dark:fill-slate-400 font-sans"
                >
                  {dayName}
                </text>

                {/* 24 Hour cells for this day */}
                {Array.from({ length: 24 }).map((_, hr) => {
                  const val = matrix[`${dIdx}-${hr}`] || 0;
                  const x = labelWidth + hr * cellWidth;

                  return (
                    <rect
                      key={hr}
                      x={x + 1}
                      y={y + 1}
                      width={cellWidth - 2}
                      height={cellHeight - 2}
                      rx={2}
                      fill={getCellColor(val)}
                      className="transition-colors duration-150 hover:stroke-slate-900 dark:hover:stroke-white hover:stroke-1 cursor-pointer"
                      onMouseEnter={() =>
                        setHoveredCell({
                          dayIndex: dIdx,
                          hour: hr,
                          value: val,
                          x: x + cellWidth / 2,
                          y: y + cellHeight / 2,
                        })
                      }
                      onMouseLeave={() => setHoveredCell(null)}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Hover Tooltip */}
          {hoveredCell && (
            <g
              transform={`translate(${hoveredCell.x}, ${Math.max(
                20,
                hoveredCell.y - 35
              )})`}
              className="pointer-events-none transition-transform duration-100"
            >
              <rect
                x={-55}
                y={-10}
                width={110}
                height={30}
                rx={6}
                className="fill-slate-900/90 dark:fill-slate-800/95 stroke-slate-700/60 shadow-lg"
              />
              <text
                x={0}
                y={3}
                textAnchor="middle"
                className="text-[10px] font-bold fill-amber-300 font-sans"
              >
                {daysKu[hoveredCell.dayIndex]} • {String(hoveredCell.hour).padStart(2, "0")}:00
              </text>
              <text
                x={0}
                y={15}
                textAnchor="middle"
                className="text-[9px] font-mono fill-white"
              >
                {hoveredCell.value} چالاکیی خوێندن
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
});

export default HeatMap;
