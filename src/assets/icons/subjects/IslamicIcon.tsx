import React from "react";
import { SubjectSvgProps } from "./MathematicsIcon.tsx";

/**
 * Islamic Studies (ئیسلام) Subject Icon
 * Concept: Graceful crescent moon (Hilal) with clean radiant star.
 * ViewBox: 0 0 48 48, stroke-width: 1.5px, currentColor.
 */
export const IslamicIcon: React.FC<SubjectSvgProps> = ({
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
      {/* Crescent Moon (Hilal) with accent fill */}
      <path
        d="M26 10C17.7 10 11 16.7 11 25C11 33.3 17.7 40 26 40C29.6 40 32.9 38.7 35.5 36.6C30.5 35.7 26.7 31.4 26.7 26.1C26.7 20.9 30.3 16.6 35.2 15.4C32.7 12 29.6 10 26 10Z"
        fill="currentColor"
        fillOpacity="0.14"
        strokeWidth="1.5"
      />

      {/* Radiant Star (Pentagram or 8-point geometric star) */}
      <path
        d="M33 19L34.2 21.8L37.2 22.1L34.9 24.1L35.6 27L33 25.5L30.4 27L31.1 24.1L28.8 22.1L31.8 21.8L33 19Z"
        fill="currentColor"
        strokeWidth="1"
      />

      {/* Subtle Archway / Minaret finial accent base */}
      <path d="M19 40C21.5 42 24.5 43 28 43" strokeOpacity="0.4" strokeDasharray="1.5 1.5" />
    </svg>
  );
};
