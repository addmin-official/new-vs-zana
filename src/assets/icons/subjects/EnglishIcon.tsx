import React from "react";
import { SubjectSvgProps } from "./MathematicsIcon.tsx";

/**
 * English Language (ئینگلیزی) Subject Icon
 * Concept: Open literature book with stylized Latin glyphs and communicative speech bubble.
 * ViewBox: 0 0 48 48, stroke-width: 1.5px, currentColor.
 */
export const EnglishIcon: React.FC<SubjectSvgProps> = ({
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
      {/* Speech Bubble Overlay (Top-Right) */}
      <path
        d="M26 8H37C39.2 8 41 9.8 41 12V20C41 22.2 39.2 24 37 24H33L29 27V24H26C23.8 24 22 22.2 22 20V12C22 9.8 23.8 8 26 8Z"
        fill="currentColor"
        fillOpacity="0.14"
      />
      {/* Speech lines inside bubble */}
      <line x1="27" y1="14" x2="36" y2="14" strokeWidth="1.5" />
      <line x1="27" y1="18" x2="33" y2="18" strokeWidth="1.5" />

      {/* Open Book Spine & Pages (Bottom) */}
      <path
        d="M24 28V41C24 41 19 38 10 38V25C19 25 24 28 24 28Z"
        strokeWidth="1.5"
      />
      <path
        d="M24 28V41C24 41 29 38 38 38V27"
        strokeWidth="1.5"
      />

      {/* Latin 'A' on Left Page */}
      <path d="M14 34L16 29L18 34" strokeWidth="1.2" />
      <line x1="14.8" y1="32.5" x2="17.2" y2="32.5" strokeWidth="1.2" />

      {/* Latin 'Z' on Right Page */}
      <path d="M29 30H33L29 34H33" strokeWidth="1.2" />
    </svg>
  );
};
