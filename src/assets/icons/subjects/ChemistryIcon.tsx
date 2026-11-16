import React from "react";
import { SubjectSvgProps } from "./MathematicsIcon.tsx";

/**
 * Chemistry (کیمیا) Subject Icon
 * Concept: Erlenmeyer flask with liquid fill (~40% height) and rising reaction bubbles.
 * ViewBox: 0 0 48 48, stroke-width: 1.5px, currentColor.
 */
export const ChemistryIcon: React.FC<SubjectSvgProps> = ({
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
      {/* Top rim collar */}
      <rect x="20" y="8" width="8" height="3" rx="1.5" />

      {/* Liquid Fill with wave meniscus at ~40% height */}
      <path
        d="M17.5 29C19 28 21.5 28.5 24 29.5C26.5 30.5 29 30 30.5 29L34.5 37.5C35.2 39 34.2 40 32.5 40H15.5C13.8 40 12.8 39 13.5 37.5L17.5 29Z"
        fill="currentColor"
        fillOpacity="0.16"
        stroke="none"
      />

      {/* Liquid meniscus line */}
      <path
        d="M17 29C19 28 21.5 28.5 24 29.5C26.5 30.5 29 30 31 29"
        strokeWidth="1.5"
      />

      {/* Flask Body Outline */}
      <path
        d="M21 11V18L13.2 36.8C12.3 38.8 13.7 40 15.8 40H32.2C34.3 40 35.7 38.8 34.8 36.8L27 18V11"
        strokeWidth="1.5"
      />

      {/* Graduation measurement ticks on right side */}
      <line x1="26" y1="23" x2="28" y2="23" strokeOpacity="0.7" />
      <line x1="28" y1="28" x2="31" y2="28" strokeOpacity="0.7" />
      <line x1="30" y1="33" x2="33" y2="33" strokeOpacity="0.7" />

      {/* Rising Bubbles */}
      <circle cx="21" cy="34" r="1.5" fill="currentColor" fillOpacity="0.4" />
      <circle cx="27" cy="35" r="2.2" fill="currentColor" fillOpacity="0.3" />
      <circle cx="23.5" cy="22" r="1.2" fill="currentColor" fillOpacity="0.6" />
      <circle cx="25" cy="15" r="0.9" fill="currentColor" fillOpacity="0.8" />
    </svg>
  );
};
