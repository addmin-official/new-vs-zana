import React from "react";
import { SubjectSvgProps } from "./MathematicsIcon.tsx";

/**
 * Economy (ئابووری) Subject Icon
 * Concept: Financial economic growth chart with upward vector and exchange coin token.
 * ViewBox: 0 0 48 48, stroke-width: 1.5px, currentColor.
 */
export const EconomyIcon: React.FC<SubjectSvgProps> = ({
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
      {/* Chart Base Axes */}
      <path d="M10 38H38" strokeWidth="1.5" />
      <path d="M10 10V38" strokeWidth="1.5" />

      {/* Upward Growth Arrow Path */}
      <path
        d="M14 31L22 22L29 27L37 14"
        strokeWidth="2"
      />
      <path d="M31 14H37V20" strokeWidth="2" />

      {/* Growth Area Shade */}
      <path
        d="M14 31L22 22L29 27L37 14V38H14Z"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="none"
      />

      {/* Bar pillars */}
      <rect x="15" y="32" width="3" height="6" rx="1" fill="currentColor" fillOpacity="0.3" stroke="none" />
      <rect x="22" y="27" width="3" height="11" rx="1" fill="currentColor" fillOpacity="0.3" stroke="none" />
      <rect x="29" y="30" width="3" height="8" rx="1" fill="currentColor" fillOpacity="0.3" stroke="none" />
    </svg>
  );
};
