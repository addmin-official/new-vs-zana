import React from "react";
import { SubjectSvgProps } from "./MathematicsIcon.tsx";

/**
 * Computer Science (کۆمپیوتەر) Subject Icon
 * Concept: Developer CLI terminal window with command prompt '> _' and subtle PCB circuit traces.
 * ViewBox: 0 0 48 48, stroke-width: 1.5px, currentColor.
 */
export const ComputerIcon: React.FC<SubjectSvgProps> = ({
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
      {/* Terminal Window Frame */}
      <rect
        x="8"
        y="10"
        width="32"
        height="26"
        rx="3"
        fill="currentColor"
        fillOpacity="0.08"
        strokeWidth="1.5"
      />

      {/* Title Bar Division Line */}
      <line x1="8" y1="17" x2="40" y2="17" strokeWidth="1.5" />

      {/* Traffic Light Window Control Dots */}
      <circle cx="12.5" cy="13.5" r="1.2" fill="currentColor" />
      <circle cx="16.5" cy="13.5" r="1.2" fill="currentColor" />
      <circle cx="20.5" cy="13.5" r="1.2" fill="currentColor" />

      {/* CLI Command Prompt '> _' */}
      <path d="M14 23L18 26L14 29" strokeWidth="1.8" />
      <line x1="21" y1="29" x2="27" y2="29" strokeWidth="2" />

      {/* Circuit Trace Branching Lines from Base */}
      <path d="M16 36V40H21" strokeWidth="1.2" strokeOpacity="0.8" />
      <circle cx="21" cy="40" r="1.2" fill="currentColor" />

      <path d="M32 36V39H27V42" strokeWidth="1.2" strokeOpacity="0.8" />
      <circle cx="27" cy="42" r="1.2" fill="currentColor" />

      {/* Binary / Bit Indicator in Screen Corner */}
      <circle cx="34" cy="23" r="1" fill="currentColor" fillOpacity="0.5" />
      <circle cx="34" cy="27" r="1" fill="currentColor" fillOpacity="0.5" />
    </svg>
  );
};
