import React from "react";
import { SubjectSvgProps } from "./MathematicsIcon.tsx";

/**
 * Physics (فیزیا) Subject Icon
 * Concept: Rutherford-Bohr atom with 3 orbiting electron ellipses and central nucleus.
 * ViewBox: 0 0 48 48, stroke-width: 1.5px, currentColor.
 */
export const PhysicsIcon: React.FC<SubjectSvgProps> = ({
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
      {/* Central Nucleus with soft glow fill */}
      <circle cx="24" cy="24" r="7" fill="currentColor" fillOpacity="0.12" stroke="none" />
      <circle cx="24" cy="24" r="3.5" fill="currentColor" stroke="none" />

      {/* Orbit 1: Horizontal Ellipse */}
      <ellipse cx="24" cy="24" rx="18" ry="6.5" />
      {/* Electron 1 on horizontal orbit */}
      <circle cx="42" cy="24" r="1.75" fill="currentColor" />

      {/* Orbit 2: Rotated 60 degrees */}
      <g transform="rotate(60 24 24)">
        <ellipse cx="24" cy="24" rx="18" ry="6.5" />
        <circle cx="6" cy="24" r="1.75" fill="currentColor" />
      </g>

      {/* Orbit 3: Rotated -60 degrees */}
      <g transform="rotate(-60 24 24)">
        <ellipse cx="24" cy="24" rx="18" ry="6.5" />
        <circle cx="39" cy="24" r="1.75" fill="currentColor" />
      </g>
    </svg>
  );
};
