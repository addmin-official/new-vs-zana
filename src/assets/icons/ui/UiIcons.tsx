import React from "react";

export interface UiIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

const baseProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.5",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// ─── 1. Navigation Icons ───────────────────────────────────────────────────────
export const HomeIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <path d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V10.5Z" />
  </svg>
);

export const ChatIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <path d="M21 11.5C21 16.1944 16.9706 20 12 20C10.459 20 9.0084 19.634 7.74797 18.9958L3 20L4.25414 16.4884C3.46824 15.0425 3 13.3323 3 11.5C3 6.80558 7.02944 3 12 3C16.9706 3 21 6.80558 21 11.5Z" />
  </svg>
);

export const SubjectsIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <path d="M4 19.5V6.5C4 5.39543 4.89543 4.5 6 4.5H20V18.5H6C4.89543 18.5 4 18.9477 4 19.5Z" />
    <path d="M4 19.5C4 20.0523 4.89543 20.5 6 20.5H20" />
    <path d="M9 8.5H15" />
    <path d="M9 12.5H13" />
  </svg>
);

export const ProfileIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M20 21C20 17.134 16.4183 14 12 14C7.58172 14 4 17.134 4 21" />
  </svg>
);

// ─── 2. Action & Directional Icons ─────────────────────────────────────────────
export const CheckIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <path d="M20 6L9 17L4 12" strokeWidth="2" />
  </svg>
);

export const XMarkIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <path d="M18 6L6 18M6 6L18 18" strokeWidth="2" />
  </svg>
);

export const ArrowRightIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <path d="M5 12H19M19 12L12 5M19 12L12 19" />
  </svg>
);

export const ArrowLeftIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <path d="M19 12H5M5 12L12 19M5 12L12 5" />
  </svg>
);

// ─── 3. Gamification & Motivation Icons ────────────────────────────────────────
export const FireIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <path d="M12 2C12 2 16 6 16 11C16 14 14.5 15.5 14.5 15.5C14.5 15.5 15 14 14 12C12 14 10 16 10 19C10 20.5 10.8 21.5 12 22C7 22 5 17 5 13C5 8 9 5 12 2Z" fill="currentColor" fillOpacity="0.15" />
  </svg>
);

export const StarIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" fillOpacity="0.15" />
  </svg>
);

// ─── 4. Security & Access Icons ────────────────────────────────────────────────
export const LockIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" />
  </svg>
);

export const UnlockIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7" />
  </svg>
);

// ─── 5. Transfer & Share Icons ─────────────────────────────────────────────────
export const DownloadIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <path d="M12 3V16M12 16L7 11M12 16L17 11" />
    <path d="M3 20H21" />
  </svg>
);

export const UploadIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <path d="M12 17V4M12 4L7 9M12 4L17 9" />
    <path d="M3 20H21" />
  </svg>
);

export const ShareIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

// ─── 6. Settings & Notification Icons ──────────────────────────────────────────
export const SettingsIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15A1.65 1.65 0 0 0 19.73 16.82L20.07 17.21A2 2 0 1 1 17.21 20.07L16.82 19.73A1.65 1.65 0 0 0 15 19.4A1.65 1.65 0 0 0 13.91 20.93V21.46A2 2 0 1 1 9.91 21.46V20.93A1.65 1.65 0 0 0 8.82 19.4A1.65 1.65 0 0 0 7 19.73L6.61 20.07A2 2 0 1 1 3.75 17.21L4.09 16.82A1.65 1.65 0 0 0 3.75 15A1.65 1.65 0 0 0 2.22 13.91H1.69A2 2 0 1 1 1.69 9.91H2.22A1.65 1.65 0 0 0 3.75 8.82A1.65 1.65 0 0 0 3.41 7L3.07 6.61A2 2 0 1 1 5.93 3.75L6.32 4.09A1.65 1.65 0 0 0 8.14 3.75A1.65 1.65 0 0 0 9.23 2.22V1.69A2 2 0 1 1 13.23 1.69V2.22A1.65 1.65 0 0 0 14.32 3.75A1.65 1.65 0 0 0 16.14 3.41L16.53 3.07A2 2 0 1 1 19.39 5.93L19.05 6.32A1.65 1.65 0 0 0 19.39 8.14A1.65 1.65 0 0 0 20.92 9.23H21.45A2 2 0 1 1 21.45 13.23H20.92A1.65 1.65 0 0 0 19.4 15Z" />
  </svg>
);

export const LogoutIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <path d="M9 21H5C4.44772 21 4 20.5523 4 20V4C4 3.44772 4.44772 3 5 3H9" />
    <path d="M16 17L21 12L16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const BellIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <path d="M18 8C18 4.68629 15.3137 2 12 2C8.68629 2 6 4.68629 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" />
    <path d="M10.3 21C10.7 21.6 11.3 22 12 22C12.7 22 13.3 21.6 13.7 21" />
  </svg>
);

// ─── 7. Media & Playback Icons ─────────────────────────────────────────────────
export const PlayIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" fillOpacity="0.15" />
  </svg>
);

export const PauseIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" fillOpacity="0.2" />
    <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" fillOpacity="0.2" />
  </svg>
);

export const SkipIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <polygon points="5 4 15 12 5 20 5 4" fill="currentColor" fillOpacity="0.15" />
    <line x1="19" y1="5" x2="19" y2="19" strokeWidth="2" />
  </svg>
);

// ─── 8. Discovery & Search Icons ───────────────────────────────────────────────
export const SearchIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const FilterIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

// ─── 9. Date & Time Icons ──────────────────────────────────────────────────────
export const CalendarIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export const ClockIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// ─── 10. Educational Base UI Icons ─────────────────────────────────────────────
export const BookIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <path d="M4 19.5V6.5C4 5.39543 4.89543 4.5 6 4.5H20V18.5H6C4.89543 18.5 4 18.9477 4 19.5Z" />
    <path d="M4 19.5C4 20.0523 4.89543 20.5 6 20.5H20" />
  </svg>
);

export const LabFlaskIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <path d="M10 2L14 2" />
    <path d="M10 5L14 5" />
    <path d="M11 5V11L5.5 20C4.8 21.2 5.7 22 7 22H17C18.3 22 19.2 21.2 18.5 20L13 11V5" />
    <path d="M7.5 17C9 16 11 16 12.5 17C14 18 15.5 17 16.5 16" />
  </svg>
);

export const CalculatorIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <rect x="7" y="5" width="10" height="4" rx="1" />
    <circle cx="8" cy="13" r="1" fill="currentColor" />
    <circle cx="12" cy="13" r="1" fill="currentColor" />
    <circle cx="16" cy="13" r="1" fill="currentColor" />
    <circle cx="8" cy="17" r="1" fill="currentColor" />
    <circle cx="12" cy="17" r="1" fill="currentColor" />
    <circle cx="16" cy="17" r="1" fill="currentColor" />
  </svg>
);

// ─── 11. Custom Motivation & Educational UI Icons ─────────────────────────────

/**
 * Streak fire icon with double flame accent
 */
export const StreakFireIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <path
      d="M12 2C12 2 16.5 6.5 16.5 12C16.5 15.5 14.5 17 14.5 17C14.5 17 15.2 15 14 13C11.8 15.5 10 17.5 10 20C10 21.2 10.8 22 12 22C6.5 22 4.5 16.5 4.5 12.5C4.5 7.5 9 4.5 12 2Z"
      fill="currentColor"
      fillOpacity="0.2"
    />
    <path
      d="M12 14C12 14 13.5 16 13.5 17.5C13.5 18.8 12.8 19.5 12 20C11.2 19.5 10.5 18.8 10.5 17.5C10.5 16 12 14 12 14Z"
      fill="currentColor"
      fillOpacity="0.6"
    />
  </svg>
);

/**
 * Concept locked icon
 */
export const ConceptLockIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" fillOpacity="0.1" />
    <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" />
    <circle cx="12" cy="16" r="1.25" fill="currentColor" />
  </svg>
);

/**
 * Concept unlocked icon
 */
export const ConceptUnlockIcon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" fillOpacity="0.1" />
    <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7" />
    <circle cx="12" cy="16" r="1.25" fill="currentColor" />
  </svg>
);

/**
 * Mastery Tier 1 (Not Started)
 */
export const MasteryTier1Icon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <circle cx="12" cy="12" r="9" strokeDasharray="3 3" opacity="0.6" />
    <circle cx="12" cy="12" r="2.5" fill="currentColor" fillOpacity="0.25" />
  </svg>
);

/**
 * Mastery Tier 2 (Introduced)
 */
export const MasteryTier2Icon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <circle cx="12" cy="12" r="9" opacity="0.3" />
    <path d="M12 3A9 9 0 0 1 21 12" strokeWidth="2.5" />
    <path d="M12 8L13 11L16 12L13 13L12 16L11 13L8 12L11 11Z" fill="currentColor" fillOpacity="0.5" />
  </svg>
);

/**
 * Mastery Tier 3 (Developing)
 */
export const MasteryTier3Icon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <circle cx="12" cy="12" r="9" opacity="0.3" />
    <path d="M12 3A9 9 0 0 1 21 12A9 9 0 0 1 12 21" strokeWidth="2.5" />
    <path d="M12 7L13.5 10.5L17 12L13.5 13.5L12 17L10.5 13.5L7 12L10.5 10.5Z" fill="currentColor" fillOpacity="0.6" />
  </svg>
);

/**
 * Mastery Tier 4 (Proficient)
 */
export const MasteryTier4Icon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <circle cx="12" cy="12" r="9" opacity="0.3" />
    <path d="M12 3A9 9 0 0 1 21 12A9 9 0 0 1 12 21A9 9 0 0 1 3 12" strokeWidth="2.5" />
    <path d="M12 6L14 10.5L19 11.5L15.5 15L16.5 20L12 17.5L7.5 20L8.5 15L5 11.5L10 10.5Z" fill="currentColor" fillOpacity="0.3" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </svg>
);

/**
 * Mastery Tier 5 (Mastered)
 */
export const MasteryTier5Icon: React.FC<UiIconProps> = ({ size = 24, className = "", ...props }) => (
  <svg width={size} height={size} {...baseProps} className={className} {...props}>
    <circle cx="12" cy="12" r="9" strokeWidth="2" fill="currentColor" fillOpacity="0.12" />
    <path d="M5 8L8 14L12 9L16 14L19 8L18 18H6L5 8Z" fill="currentColor" fillOpacity="0.3" />
    <circle cx="12" cy="7" r="1.5" fill="currentColor" />
    <circle cx="5" cy="6" r="1.2" fill="currentColor" />
    <circle cx="19" cy="6" r="1.2" fill="currentColor" />
    <path d="M7 16H17" strokeWidth="1.5" />
  </svg>
);

export interface MasteryTierIconProps extends UiIconProps {
  tier?: 1 | 2 | 3 | 4 | 5 | "notStarted" | "introduced" | "developing" | "proficient" | "mastered";
}

/**
 * Dynamic Mastery Tier Icon supporting all 5 curriculum tiers
 */
export const MasteryTierIcon: React.FC<MasteryTierIconProps> = ({
  tier = 1,
  size = 24,
  className = "",
  ...props
}) => {
  const norm =
    tier === "notStarted" || tier === 1
      ? 1
      : tier === "introduced" || tier === 2
      ? 2
      : tier === "developing" || tier === 3
      ? 3
      : tier === "proficient" || tier === 4
      ? 4
      : 5;

  switch (norm) {
    case 1:
      return <MasteryTier1Icon size={size} className={className} {...props} />;
    case 2:
      return <MasteryTier2Icon size={size} className={className} {...props} />;
    case 3:
      return <MasteryTier3Icon size={size} className={className} {...props} />;
    case 4:
      return <MasteryTier4Icon size={size} className={className} {...props} />;
    case 5:
    default:
      return <MasteryTier5Icon size={size} className={className} {...props} />;
  }
};
