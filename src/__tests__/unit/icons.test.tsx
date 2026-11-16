import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
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
} from "../../assets/icons/subjects/index.ts";
import {
  SubjectIcon,
  getSubjectVisualTheme,
  SUBJECT_VISUAL_THEMES,
} from "../../components/SubjectIcon.tsx";
import {
  HomeIcon,
  ChatIcon,
  SubjectsIcon,
  ProfileIcon,
  CheckIcon,
  XMarkIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  FireIcon,
  StarIcon,
  LockIcon,
  UnlockIcon,
  DownloadIcon,
  UploadIcon,
  ShareIcon,
  SettingsIcon,
  LogoutIcon,
  BellIcon,
  PlayIcon,
  PauseIcon,
  SkipIcon,
  SearchIcon,
  FilterIcon,
  CalendarIcon,
  ClockIcon,
  BookIcon,
  LabFlaskIcon,
  CalculatorIcon,
  StreakFireIcon,
  ConceptLockIcon,
  ConceptUnlockIcon,
  MasteryTierIcon,
  MasteryTier1Icon,
  MasteryTier5Icon,
} from "../../assets/icons/ui/index.ts";

describe("ZANA Subject SVG Icons (11 Grade 12 Curriculum Subjects)", () => {
  const subjectIcons = [
    { name: "Mathematics", Component: MathematicsIcon },
    { name: "Physics", Component: PhysicsIcon },
    { name: "Chemistry", Component: ChemistryIcon },
    { name: "Biology", Component: BiologyIcon },
    { name: "Arabic", Component: ArabicIcon },
    { name: "English", Component: EnglishIcon },
    { name: "Kurdish", Component: KurdishIcon },
    { name: "History", Component: HistoryIcon },
    { name: "Geography", Component: GeographyIcon },
    { name: "Islamic Studies", Component: IslamicIcon },
    { name: "Computer Science", Component: ComputerIcon },
    { name: "Economy", Component: EconomyIcon },
    { name: "Sports", Component: SportsIcon },
  ];

  subjectIcons.forEach(({ name, Component }) => {
    it(`renders ${name} icon with 48x48 viewBox and 1.5px stroke`, () => {
      const { container } = render(<Component data-testid={`icon-${name}`} />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("viewBox", "0 0 48 48");
      expect(svg).toHaveAttribute("stroke-width", "1.5");
      expect(svg).toHaveAttribute("fill", "none");
    });
  });
});

describe("SubjectIcon Component Integration", () => {
  it("renders with role='img' and accessible Kurdish label", () => {
    render(<SubjectIcon subject="chemistry" size={40} />);
    const icon = screen.getByRole("img", { name: "وانەی کیمیا" });
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("width", "40");
    expect(icon).toHaveAttribute("height", "40");
  });

  it("renders all 11 core curriculum subjects by key alias", () => {
    const coreKeys = [
      "math",
      "physics",
      "chemistry",
      "biology",
      "arabic",
      "english",
      "kurdish",
      "history",
      "geography",
      "islamic",
      "computer",
    ];

    coreKeys.forEach((key) => {
      const { unmount } = render(<SubjectIcon subject={key} data-testid={`subject-${key}`} />);
      expect(screen.getByTestId(`subject-${key}`)).toBeInTheDocument();
      unmount();
    });
  });

  it("scales dynamically using size prop", () => {
    const { container } = render(<SubjectIcon subject="physics" size={64} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "64");
    expect(svg).toHaveAttribute("height", "64");
  });

  it("returns visual theme with soft colored circles per subject specification", () => {
    const mathTheme = getSubjectVisualTheme("math");
    expect(mathTheme.bgLight).toContain("bg-indigo-100");
    expect(mathTheme.iconColor).toContain("text-indigo-600");

    const physicsTheme = getSubjectVisualTheme("physics");
    expect(physicsTheme.bgLight).toContain("bg-blue-100");
    expect(physicsTheme.iconColor).toContain("text-blue-600");

    const chemTheme = getSubjectVisualTheme("chemistry");
    expect(chemTheme.bgLight).toContain("bg-emerald-100");
    expect(chemTheme.iconColor).toContain("text-emerald-600");

    const kurdishTheme = getSubjectVisualTheme("kurdish");
    expect(kurdishTheme.bgLight).toContain("bg-rose-100");
    expect(kurdishTheme.iconColor).toContain("text-rose-600");

    const islamicTheme = getSubjectVisualTheme("islamic");
    expect(islamicTheme.bgLight).toContain("bg-purple-100");
  });
});

describe("ZANA UI Icon Set (24x24, 1.5px stroke)", () => {
  const uiIcons = [
    { name: "Home", Component: HomeIcon },
    { name: "Chat", Component: ChatIcon },
    { name: "Subjects", Component: SubjectsIcon },
    { name: "Profile", Component: ProfileIcon },
    { name: "Check", Component: CheckIcon },
    { name: "XMark", Component: XMarkIcon },
    { name: "ArrowRight", Component: ArrowRightIcon },
    { name: "ArrowLeft", Component: ArrowLeftIcon },
    { name: "Fire", Component: FireIcon },
    { name: "Star", Component: StarIcon },
    { name: "Lock", Component: LockIcon },
    { name: "Unlock", Component: UnlockIcon },
    { name: "Download", Component: DownloadIcon },
    { name: "Upload", Component: UploadIcon },
    { name: "Share", Component: ShareIcon },
    { name: "Settings", Component: SettingsIcon },
    { name: "Logout", Component: LogoutIcon },
    { name: "Bell", Component: BellIcon },
    { name: "Play", Component: PlayIcon },
    { name: "Pause", Component: PauseIcon },
    { name: "Skip", Component: SkipIcon },
    { name: "Search", Component: SearchIcon },
    { name: "Filter", Component: FilterIcon },
    { name: "Calendar", Component: CalendarIcon },
    { name: "Clock", Component: ClockIcon },
    { name: "Book", Component: BookIcon },
    { name: "LabFlask", Component: LabFlaskIcon },
    { name: "Calculator", Component: CalculatorIcon },
    { name: "StreakFire", Component: StreakFireIcon },
    { name: "ConceptLock", Component: ConceptLockIcon },
    { name: "ConceptUnlock", Component: ConceptUnlockIcon },
    { name: "MasteryTier1", Component: MasteryTier1Icon },
    { name: "MasteryTier5", Component: MasteryTier5Icon },
  ];

  uiIcons.forEach(({ name, Component }) => {
    it(`renders ${name} UI icon with 24x24 viewBox and 1.5px stroke`, () => {
      const { container } = render(<Component data-testid={`ui-${name}`} />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
      expect(svg).toHaveAttribute("stroke-width", "1.5");
      expect(svg).toHaveAttribute("fill", "none");
    });
  });

  it("renders MasteryTierIcon dynamically for all 5 tiers", () => {
    const tiers = [1, 2, 3, 4, 5] as const;
    tiers.forEach((tier) => {
      const { container } = render(<MasteryTierIcon tier={tier} data-testid={`tier-${tier}`} />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    });
  });
});
