import React from "react";
import {
  MathematicsIcon,
  PhysicsIcon,
  ChemistryIcon,
  BiologyIcon,
  ArabicIcon,
  EnglishIcon,
  KurdishIcon,
  HistoryIcon,
  GeographyIcon,
  IslamicIcon,
  ComputerIcon,
  EconomyIcon,
  SportsIcon,
} from "../assets/icons/subjects/index.ts";

export type SubjectId =
  | "math"
  | "mathematics"
  | "physics"
  | "chemistry"
  | "biology"
  | "arabic"
  | "english"
  | "kurdish"
  | "history"
  | "geography"
  | "islamic"
  | "islam"
  | "islamic_studies"
  | "computer"
  | "computer_science"
  | "economy"
  | "sports";

export interface SubjectTheme {
  nameKu: string;
  nameEn: string;
  bgLight: string;
  iconColor: string;
  borderLight: string;
}

export const SUBJECT_VISUAL_THEMES: Record<string, SubjectTheme> = {
  mathematics: {
    nameKu: "بیرکاری",
    nameEn: "Mathematics",
    bgLight: "bg-indigo-100 dark:bg-indigo-950/60",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    borderLight: "border-indigo-200 dark:border-indigo-800",
  },
  math: {
    nameKu: "بیرکاری",
    nameEn: "Mathematics",
    bgLight: "bg-indigo-100 dark:bg-indigo-950/60",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    borderLight: "border-indigo-200 dark:border-indigo-800",
  },
  physics: {
    nameKu: "فیزیا",
    nameEn: "Physics",
    bgLight: "bg-blue-100 dark:bg-blue-950/60",
    iconColor: "text-blue-600 dark:text-blue-400",
    borderLight: "border-blue-200 dark:border-blue-800",
  },
  chemistry: {
    nameKu: "کیمیا",
    nameEn: "Chemistry",
    bgLight: "bg-emerald-100 dark:bg-emerald-950/60",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    borderLight: "border-emerald-200 dark:border-emerald-800",
  },
  biology: {
    nameKu: "بایۆلۆژی",
    nameEn: "Biology",
    bgLight: "bg-green-100 dark:bg-green-950/60",
    iconColor: "text-green-600 dark:text-green-400",
    borderLight: "border-green-200 dark:border-green-800",
  },
  arabic: {
    nameKu: "عەرەبی",
    nameEn: "Arabic Language",
    bgLight: "bg-amber-100 dark:bg-amber-950/60",
    iconColor: "text-amber-700 dark:text-amber-400",
    borderLight: "border-amber-200 dark:border-amber-800",
  },
  english: {
    nameKu: "ئینگلیزی",
    nameEn: "English Language",
    bgLight: "bg-sky-100 dark:bg-sky-950/60",
    iconColor: "text-sky-600 dark:text-sky-400",
    borderLight: "border-sky-200 dark:border-sky-800",
  },
  kurdish: {
    nameKu: "کوردی",
    nameEn: "Kurdish Language",
    bgLight: "bg-rose-100 dark:bg-rose-950/60",
    iconColor: "text-rose-600 dark:text-rose-400",
    borderLight: "border-rose-200 dark:border-rose-800",
  },
  history: {
    nameKu: "مێژوو",
    nameEn: "History",
    bgLight: "bg-orange-100 dark:bg-orange-950/60",
    iconColor: "text-orange-700 dark:text-orange-400",
    borderLight: "border-orange-200 dark:border-orange-800",
  },
  geography: {
    nameKu: "جوگرافیا",
    nameEn: "Geography",
    bgLight: "bg-teal-100 dark:bg-teal-950/60",
    iconColor: "text-teal-600 dark:text-teal-400",
    borderLight: "border-teal-200 dark:border-teal-800",
  },
  islamic: {
    nameKu: "ئیسلام",
    nameEn: "Islamic Studies",
    bgLight: "bg-purple-100 dark:bg-purple-950/60",
    iconColor: "text-purple-700 dark:text-purple-400",
    borderLight: "border-purple-200 dark:border-purple-800",
  },
  islam: {
    nameKu: "ئیسلام",
    nameEn: "Islamic Studies",
    bgLight: "bg-purple-100 dark:bg-purple-950/60",
    iconColor: "text-purple-700 dark:text-purple-400",
    borderLight: "border-purple-200 dark:border-purple-800",
  },
  islamic_studies: {
    nameKu: "ئیسلام",
    nameEn: "Islamic Studies",
    bgLight: "bg-purple-100 dark:bg-purple-950/60",
    iconColor: "text-purple-700 dark:text-purple-400",
    borderLight: "border-purple-200 dark:border-purple-800",
  },
  computer: {
    nameKu: "کۆمپیوتەر",
    nameEn: "Computer Science",
    bgLight: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-700 dark:text-slate-300",
    borderLight: "border-slate-200 dark:border-slate-700",
  },
  computer_science: {
    nameKu: "کۆمپیوتەر",
    nameEn: "Computer Science",
    bgLight: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-700 dark:text-slate-300",
    borderLight: "border-slate-200 dark:border-slate-700",
  },
  economy: {
    nameKu: "ئابووری",
    nameEn: "Economy",
    bgLight: "bg-violet-100 dark:bg-violet-950/60",
    iconColor: "text-violet-600 dark:text-violet-400",
    borderLight: "border-violet-200 dark:border-violet-800",
  },
  sports: {
    nameKu: "وەرزش",
    nameEn: "Sports & Health",
    bgLight: "bg-cyan-100 dark:bg-cyan-950/60",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    borderLight: "border-cyan-200 dark:border-cyan-800",
  },
};

/**
 * Returns the theme metadata for any subject key
 */
export function getSubjectVisualTheme(subjectKey: string): SubjectTheme {
  const norm = (subjectKey || "").toLowerCase().trim();
  return (
    SUBJECT_VISUAL_THEMES[norm] || {
      nameKu: "وانە",
      nameEn: "Subject",
      bgLight: "bg-indigo-100 dark:bg-indigo-950/60",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      borderLight: "border-indigo-200 dark:border-indigo-800",
    }
  );
}

export interface SubjectIconProps extends React.SVGProps<SVGSVGElement> {
  /**
   * Subject identifier key (e.g. 'math', 'physics', 'chemistry', etc.)
   */
  subject: SubjectId | string;
  /**
   * Icon size in pixels
   * @default 40
   */
  size?: 24 | 32 | 40 | 48 | 64 | number;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Direct color override (defaults to currentColor)
   */
  color?: string;
  /**
   * Accessible image description
   */
  ariaLabel?: string;
}

/**
 * ZANA SubjectIcon Component
 * Renders the custom SVG icon for each Kurdish Grade 9–12 curriculum subject.
 */
export const SubjectIcon: React.FC<SubjectIconProps> = ({
  subject,
  size = 40,
  className = "",
  color,
  ariaLabel,
  ...props
}) => {
  const norm = (subject || "").toLowerCase().trim();
  const theme = getSubjectVisualTheme(norm);
  const label = ariaLabel || `وانەی ${theme.nameKu}`;

  const iconProps = {
    size,
    className: `${theme.iconColor} ${className}`,
    style: color ? { color } : undefined,
    role: "img",
    "aria-label": label,
    ...props,
  };

  switch (norm) {
    case "math":
    case "mathematics":
      return <MathematicsIcon {...iconProps} />;
    case "physics":
      return <PhysicsIcon {...iconProps} />;
    case "chemistry":
      return <ChemistryIcon {...iconProps} />;
    case "biology":
      return <BiologyIcon {...iconProps} />;
    case "arabic":
      return <ArabicIcon {...iconProps} />;
    case "english":
      return <EnglishIcon {...iconProps} />;
    case "kurdish":
      return <KurdishIcon {...iconProps} />;
    case "history":
      return <HistoryIcon {...iconProps} />;
    case "geography":
      return <GeographyIcon {...iconProps} />;
    case "islamic":
    case "islam":
    case "islamic_studies":
      return <IslamicIcon {...iconProps} />;
    case "computer":
    case "computer_science":
      return <ComputerIcon {...iconProps} />;
    case "economy":
      return <EconomyIcon {...iconProps} />;
    case "sports":
      return <SportsIcon {...iconProps} />;
    default:
      return <MathematicsIcon {...iconProps} />;
  }
};

export default SubjectIcon;
