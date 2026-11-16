import React from "react";
import { SubjectSvgProps } from "./MathematicsIcon.tsx";

/**
 * Kurdish Language (کوردی) Subject Icon
 * Concept: Stylized Kurdish letter "ک" with golden sun rays radiating outward (homage to Kurdistan flag sun).
 * ViewBox: 0 0 48 48, stroke-width: 1.5px, currentColor.
 */
export const KurdishIcon: React.FC<SubjectSvgProps> = ({
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
      {/* Central Kurdish Sun Disc in background */}
      <circle
        cx="26"
        cy="22"
        r="7.5"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="none"
      />

      {/* Radiant Sun Rays (Triangular/Spike Beams) */}
      <path d="M26 8V12" strokeWidth="1.5" />
      <path d="M35 13L32 16" strokeWidth="1.5" />
      <path d="M39 22H35" strokeWidth="1.5" />
      <path d="M35 31L32 28" strokeWidth="1.5" />
      <path d="M17 13L20 16" strokeWidth="1.5" />
      <path d="M13 22H17" strokeWidth="1.5" />

      {/* Stylized Kurdish Letter 'ک' Calligraphic Stroke */}
      <path
        d="M33 19V34C33 36.8 30.8 39 28 39H15C13.5 39 12.5 37.8 13.5 36.5L16 33"
        strokeWidth="2.2"
      />

      {/* Characteristic Upper Diagonal Arm (کاشیدە / سەرکاف) */}
      <path
        d="M17 21L33 13"
        strokeWidth="2.2"
      />

      {/* Small Central Flame Accent */}
      <circle cx="26" cy="22" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
};
