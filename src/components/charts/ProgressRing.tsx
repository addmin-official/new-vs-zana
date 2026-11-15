import React from "react";

export interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number; // diameter in px (default 120)
  strokeWidth?: number; // border stroke (default 10)
  color?: string; // primary ring color (default #6366f1)
  trackColor?: string; // background track color
  label?: string; // e.g. "78%"
  subtitle?: string; // e.g. "لێهاتوویی گشتی"
  className?: string;
}

export const ProgressRing = React.memo(function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 10,
  color = "#6366f1",
  trackColor = "rgba(226, 232, 240, 0.6)",
  label,
  subtitle,
  className = "",
}: ProgressRingProps) {
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (normalizedProgress / 100) * circumference;

  return (
    <div
      className={`inline-flex flex-col items-center justify-center relative ${className}`}
      style={{ width: size, height: size }}
      dir="rtl"
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
          className="dark:opacity-20"
        />
        {/* Progress Stroke with CSS transition */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>

      {/* Centered Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 pointer-events-none">
        <span className="font-mono font-black text-slate-900 dark:text-white text-base sm:text-lg">
          {label !== undefined ? label : `${Math.round(normalizedProgress)}%`}
        </span>
        {subtitle && (
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans mt-0.5 leading-tight">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
});

export default ProgressRing;
