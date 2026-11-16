import React from "react";
import { SubjectSvgProps } from "./MathematicsIcon.tsx";

/**
 * Arabic Language (عەرەبی) Subject Icon
 * Concept: Stylized calligraphic letter 'ع' (Ain) with an ink fountain/reed pen nib beneath.
 * ViewBox: 0 0 48 48, stroke-width: 1.5px, currentColor.
 */
export const ArabicIcon: React.FC<SubjectSvgProps> = ({
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
      {/* Upper Calligraphic 'ع' (Ain) form */}
      <path
        d="M27 9C29.5 9 32 10.5 33 13C33.8 15 32.5 17.5 30 18.5C26 20 23 20 21 22.5C18 26 18.5 30 22 32C24.5 33.5 28 33 31 31"
        strokeWidth="2"
      />
      {/* Eye of Ain with accent fill */}
      <path
        d="M26 10C28 10 30 11.5 30 13.5C30 15.5 28 17 26 17C23.5 17 22.5 15 23 13C23.5 11 24.5 10 26 10Z"
        fill="currentColor"
        fillOpacity="0.14"
      />

      {/* Classical Calligraphy Ink Pen Nib (Bottom) */}
      <path
        d="M19 32L17 41L24 45L31 41L29 32"
        fill="currentColor"
        fillOpacity="0.1"
      />
      {/* Slit and Breather hole */}
      <line x1="24" y1="36" x2="24" y2="45" strokeWidth="1.2" />
      <circle cx="24" cy="35" r="1.5" fill="currentColor" />

      {/* Decorative Tashkeel / Calligraphy diacritic dot */}
      <circle cx="34" cy="8" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
};
