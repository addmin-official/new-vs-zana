import React from "react";
import { SubjectSvgProps } from "./MathematicsIcon.tsx";

/**
 * Biology (بایۆلۆژی) Subject Icon
 * Concept: Organic botanical leaf with internal cellular structure and nucleus.
 * ViewBox: 0 0 48 48, stroke-width: 1.5px, currentColor.
 */
export const BiologyIcon: React.FC<SubjectSvgProps> = ({
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
      {/* Outer Leaf Silhouette with soft natural fill */}
      <path
        d="M12 37C12 37 11 25 21 15C31 5 38 10 38 10C38 10 39 22 29 32C19 42 12 37 12 37Z"
        fill="currentColor"
        fillOpacity="0.12"
      />

      {/* Central Leaf Vein */}
      <path d="M12 37C18 33 25 26 38 10" />

      {/* Primary Plant Cell Unit (Upper Wing) */}
      <path
        d="M23 18C26 15 30 15 33 18C34 21 32 25 29 26C26 26 23 23 23 18Z"
        strokeOpacity="0.8"
      />
      {/* Cell Nucleus */}
      <circle cx="28" cy="20" r="2.2" fill="currentColor" />

      {/* Secondary Cellular Honeycomb (Lower Wing) */}
      <path
        d="M18 27C21 24 25 25 26 28C27 31 25 34 22 35C19 35 17 31 18 27Z"
        strokeOpacity="0.7"
        strokeDasharray="2 1.5"
      />
      <circle cx="22" cy="30" r="1.5" fill="currentColor" fillOpacity="0.8" />

      {/* Stem Tail */}
      <path d="M12 37L8 41" strokeWidth="2" />
    </svg>
  );
};
