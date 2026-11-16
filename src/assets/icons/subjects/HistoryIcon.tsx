import React from "react";
import { SubjectSvgProps } from "./MathematicsIcon.tsx";

/**
 * History (مێژوو) Subject Icon
 * Concept: Hourglass of antiquity with ancient citadel/temple portico silhouette.
 * ViewBox: 0 0 48 48, stroke-width: 1.5px, currentColor.
 */
export const HistoryIcon: React.FC<SubjectSvgProps> = ({
  size = 48,
  className = "",
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Top and Bottom Caps */}
      <rect x="13" y="8" width="22" height="3" rx="1.5" fill="currentColor" fillOpacity="0.2" />
      <rect x="13" y="37" width="22" height="3" rx="1.5" fill="currentColor" fillOpacity="0.2" />

      {/* Hourglass Glass Silhouette */}
      <path
        d="M16 11L22 22C22.8 23.3 22.8 24.7 22 26L16 37H32L26 26C25.2 24.7 25.2 23.3 26 22L32 11H16Z"
        strokeWidth="1.5"
      />

      {/* Ancient Temple / Citadel Pediment Silhouette in Lower Chamber */}
      <path
        d="M20 37V32L24 29L28 32V37"
        fill="currentColor"
        fillOpacity="0.18"
      />
      {/* Architectural Pillars */}
      <line x1="22" y1="33" x2="22" y2="37" strokeWidth="1.2" />
      <line x1="26" y1="33" x2="26" y2="37" strokeWidth="1.2" />

      {/* Falling Time Sand stream & grains */}
      <circle cx="24" cy="24" r="0.8" fill="currentColor" />
      <circle cx="24" cy="27" r="0.8" fill="currentColor" />

      {/* Upper sand reservoir level */}
      <path d="M19 16C21 17.5 27 17.5 29 16" strokeOpacity="0.6" strokeDasharray="1.5 1.5" />
    </svg>
  );
};
