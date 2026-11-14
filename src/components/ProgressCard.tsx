import React from "react";

export interface ProgressCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ProgressCard({
  title,
  value,
  unit,
  icon,
  className = "",
  onClick,
}: ProgressCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl p-6 flex items-center gap-4 border border-slate-100 text-right ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
      dir="rtl"
    >
      <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-sans text-sm font-medium text-slate-700 truncate">
          {title}
        </p>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="font-sans text-[28px] font-bold text-slate-900 leading-tight">
            {value}
          </span>
          <span className="font-sans text-sm text-slate-500 font-medium">
            {unit}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ProgressCard;
