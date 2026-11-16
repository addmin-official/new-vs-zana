import React from "react";
import { SubjectSvgProps } from "./MathematicsIcon.tsx";

/**
 * Sports & Health (وەرزش و تەندروستی) Subject Icon
 * Concept: Athletic stopwatch / pulse energy ring with dynamic motion.
 * ViewBox: 0 0 48 48, stroke-width: 1.5px, currentColor.
 */
export const SportsIcon: React.FC<SubjectSvgProps> = ({
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
      {/* Stopwatch Crown & Button */}
      <line x1="24" y1="6" x2="24" y2="10" strokeWidth="2" />
      <line x1="21" y1="6" x2="27" y2="6" strokeWidth="2" />
      <path d="M33 13L35 11" strokeWidth="2" />

      {/* Main Stopwatch Rim with soft fill */}
      <circle
        cx="24"
        cy="26"
        r="15"
        fill="currentColor"
        fillOpacity="0.1"
        strokeWidth="1.5"
      />

      {/* Dynamic Pulse / Heartbeat Line across dial */}
      <path
        d="M13 27H19L22 20L26 32L29 25L32 27H35"
        strokeWidth="2"
      />

      {/* Center dial needle point */}
      <circle cx="24" cy="26" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
};
