import React from "react";

export interface SubjectSvgProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

/**
 * Mathematics (ریاضی) Subject Icon
 * Concept: Geometric triangle + circle overlap with subtle background integral symbol (∫).
 * ViewBox: 0 0 48 48, stroke-width: 1.5px, currentColor.
 */
export const MathematicsIcon: React.FC<SubjectSvgProps> = ({
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
      {/* Subtle Integral (∫) curve in background */}
      <path
        d="M20 10C22.5 10 24 11.5 24 14V34C24 36.5 25.5 38 28 38"
        strokeOpacity="0.3"
        strokeDasharray="2 2"
      />

      {/* Geometric Overlapping Circle with accent fill */}
      <circle
        cx="28"
        cy="26"
        r="11"
        fill="currentColor"
        fillOpacity="0.12"
      />

      {/* Equilateral Triangle with corner radii */}
      <path
        d="M14.5 36.5L23.1 14.8C23.5 13.8 24.5 13.8 24.9 14.8L33.5 36.5C33.9 37.4 33.2 38 32.2 38H15.8C14.8 38 14.1 37.4 14.5 36.5Z"
        strokeWidth="1.5"
      />

      {/* Intersection Altitude & Angle arc */}
      <line x1="24" y1="15" x2="24" y2="38" strokeDasharray="3 2" strokeOpacity="0.5" />
      <path d="M19 38C19 35.2 20.8 33.5 23 33" strokeOpacity="0.6" />
    </svg>
  );
};
