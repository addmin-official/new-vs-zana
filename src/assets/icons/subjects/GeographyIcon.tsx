import React from "react";
import { SubjectSvgProps } from "./MathematicsIcon.tsx";

/**
 * Geography (جوگرافیا) Subject Icon
 * Concept: Spherical world globe with grid parallels/meridians and highlighted regional focal point.
 * ViewBox: 0 0 48 48, stroke-width: 1.5px, currentColor.
 */
export const GeographyIcon: React.FC<SubjectSvgProps> = ({
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
      {/* Globe Sphere with soft accent fill */}
      <circle
        cx="24"
        cy="22"
        r="14"
        fill="currentColor"
        fillOpacity="0.08"
      />

      {/* Central Equator Parallel */}
      <path d="M10 22C10 22 15 27 24 27C33 27 38 22 38 22" />

      {/* Northern Latitude Parallel */}
      <path d="M13 16C13 16 17 19 24 19C31 19 35 16 35 16" strokeDasharray="2 1.5" strokeOpacity="0.7" />

      {/* Central Prime Meridian */}
      <ellipse cx="24" cy="22" rx="7" ry="14" />

      {/* Stand Bracket Arc */}
      <path d="M7 22C7 31.4 14.6 39 24 39C27.5 39 30.7 37.9 33.4 36" strokeWidth="1.5" />
      <line x1="24" y1="39" x2="24" y2="43" strokeWidth="2" />
      <line x1="18" y1="43" x2="30" y2="43" strokeWidth="2" />

      {/* Highlighted Geographic Region: Kurdistan / Middle East pin marker */}
      <circle cx="28" cy="18" r="3.2" fill="currentColor" fillOpacity="0.25" stroke="none" />
      <circle cx="28" cy="18" r="1.5" fill="currentColor" />
    </svg>
  );
};
