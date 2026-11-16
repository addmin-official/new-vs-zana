import { forwardRef, HTMLAttributes, ReactNode } from "react";

export interface ProgressRingProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Progress percentage from 0 to 100
   */
  value: number;
  /**
   * Diameter of the circular progress ring in pixels
   * @default 56
   */
  size?: number;
  /**
   * Thickness of the progress stroke line
   * @default 5
   */
  strokeWidth?: number;
  /**
   * Stroke fill color or Tailwind hex
   * @default '#6366F1'
   */
  color?: string;
  /**
   * Track background stroke color
   * @default undefined
   */
  trackColor?: string;
  /**
   * Optional custom node or text inside the center of the ring
   */
  centerContent?: ReactNode;
  /**
   * Accessible description of the progress metric
   */
  label?: string;
}

/**
 * ZANA Design System ProgressRing
 * SVG-based circular progress bar with smooth CSS stroke-dashoffset transitions.
 */
export const ProgressRing = forwardRef<HTMLDivElement, ProgressRingProps>(
  (
    {
      value,
      size = 56,
      strokeWidth = 5,
      color = "#6366F1",
      trackColor,
      centerContent,
      label = "ڕێژەی بەرەوپێشچوون",
      className = "",
      ...props
    },
    ref
  ) => {
    const clampedValue = Math.min(100, Math.max(0, value));
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={Math.round(clampedValue)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size }}
        {...props}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90 origin-center"
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor || "currentColor"}
            strokeWidth={strokeWidth}
            className={trackColor ? "" : "text-slate-100 dark:text-slate-800"}
          />
          {/* Animated Progress Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center Content */}
        {centerContent ? (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {centerContent}
          </div>
        ) : null}
      </div>
    );
  }
);

ProgressRing.displayName = "ProgressRing";
