import React from "react";

export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  ariaLabel?: string;
}

export function Spinner({
  size = "md",
  className = "",
  ariaLabel = "بارکردن...",
}: SpinnerProps) {
  const sizeClass = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  }[size];

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={`inline-block animate-spin rounded-full border-blue-600 border-t-transparent ${sizeClass} ${className}`}
    >
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
}

export default Spinner;
