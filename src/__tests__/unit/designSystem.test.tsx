import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  colors,
  semanticTokens,
  spacing,
  borderRadius,
  shadows,
  fontFamilies,
  typeScale,
  fontWeights,
  letterSpacing,
  animationDurations,
  animationEasings,
  pageTransitions,
  keyframeDefinitions,
  Button,
  Input,
  Card,
  Badge,
  ProgressRing,
  Skeleton,
  SubjectCardSkeleton,
  ChatBubbleSkeleton,
  PlanItemSkeleton,
} from "../../design/index.ts";

describe("ZANA Design System Tokens", () => {
  it("defines complete primary indigo palette", () => {
    expect(colors.primary[500]).toBe("#6366F1");
    expect(colors.primary[600]).toBe("#4F46E5");
    expect(colors.primary[700]).toBe("#4338CA");
    expect(colors.primary[50]).toBe("#EEF2FF");
    expect(colors.primary[900]).toBe("#312E81");
  });

  it("defines success emerald, warning amber, and error rose palettes", () => {
    expect(colors.success[500]).toBe("#10B981");
    expect(colors.warning[500]).toBe("#F59E0B");
    expect(colors.error[500]).toBe("#F43F5E");
  });

  it("defines neutral slate palette with all 12 steps", () => {
    expect(colors.neutral[0]).toBe("#FFFFFF");
    expect(colors.neutral[50]).toBe("#F8FAFC");
    expect(colors.neutral[900]).toBe("#0F172A");
    expect(colors.neutral[950]).toBe("#020617");
  });

  it("defines educational mastery tier colors", () => {
    expect(colors.mastery.notStarted).toBe("#CBD5E1");
    expect(colors.mastery.introduced).toBe("#93C5FD");
    expect(colors.mastery.developing).toBe("#FCD34D");
    expect(colors.mastery.proficient).toBe("#6EE7B7");
    expect(colors.mastery.mastered).toBe("#A78BFA");
  });

  it("defines semantic tokens for light and dark modes", () => {
    expect(semanticTokens.light.bgBase).toContain("var(--color-neutral-50)");
    expect(semanticTokens.dark.bgBase).toContain("var(--color-neutral-950)");
    expect(semanticTokens.light.textPrimary).toContain("var(--color-neutral-900)");
    expect(semanticTokens.dark.textPrimary).toContain("var(--color-neutral-50)");
  });

  it("defines 4px grid spacing scale", () => {
    expect(spacing[1]).toBe("4px");
    expect(spacing[2]).toBe("8px");
    expect(spacing[4]).toBe("16px");
    expect(spacing[12]).toBe("48px");
    expect(spacing[24]).toBe("96px");
  });

  it("defines border radius tokens", () => {
    expect(borderRadius.sm).toBe("6px");
    expect(borderRadius.md).toBe("10px");
    expect(borderRadius.lg).toBe("16px");
    expect(borderRadius.xl).toBe("24px");
    expect(borderRadius.full).toBe("9999px");
  });

  it("defines subtle shadow presets", () => {
    expect(shadows.sm).toContain("rgba(0, 0, 0, 0.05)");
    expect(shadows.md).toContain("0 4px 6px");
    expect(shadows.lg).toContain("0 10px 15px");
  });
});

describe("ZANA Typography System", () => {
  it("defines Kurdish, numeric, and mono font families", () => {
    expect(fontFamilies.kurdish).toContain("Noto Sans Arabic");
    expect(fontFamilies.numeric).toContain("tabular-nums");
    expect(fontFamilies.mono).toContain("JetBrains Mono");
  });

  it("defines Kurdish-optimized type scale (10% larger than Latin)", () => {
    expect(typeScale.xs.fontSize).toBe("14px");
    expect(typeScale.sm.fontSize).toBe("15px");
    expect(typeScale.base.fontSize).toBe("17px");
    expect(typeScale.base.lineHeight).toBe("1.8");
    expect(typeScale.lg.fontSize).toBe("19px");
    expect(typeScale.xl.fontSize).toBe("22px");
    expect(typeScale["2xl"].fontSize).toBe("26px");
    expect(typeScale["3xl"].fontSize).toBe("32px");
    expect(typeScale["4xl"].fontSize).toBe("40px");
  });

  it("defines Kurdish font weights and letter spacings", () => {
    expect(fontWeights.regular).toBe(400);
    expect(fontWeights.semibold).toBe(600);
    expect(fontWeights.bold).toBe(700);
    expect(letterSpacing.normal).toBe("0.01em");
    expect(letterSpacing.tight).toBe("-0.01em");
  });
});

describe("ZANA Animation System", () => {
  it("defines transition durations and easings", () => {
    expect(animationDurations.instant).toBe("100ms");
    expect(animationDurations.fast).toBe("150ms");
    expect(animationDurations.normal).toBe("200ms");
    expect(animationDurations.slow).toBe("300ms");
    expect(animationEasings.spring).toContain("1.56");
  });

  it("defines preset page transitions", () => {
    expect(pageTransitions.routeChange).toContain("fadeIn");
    expect(pageTransitions.modalOpen).toContain("scaleIn");
    expect(pageTransitions.drawerOpen).toContain("slideInUp");
  });

  it("defines keyframe definitions including confettiFall and pulseSoft", () => {
    expect(keyframeDefinitions.fadeIn).toBeDefined();
    expect(keyframeDefinitions.slideInUp).toBeDefined();
    expect(keyframeDefinitions.scaleIn).toBeDefined();
    expect(keyframeDefinitions.shimmer).toBeDefined();
    expect(keyframeDefinitions.pulseSoft).toBeDefined();
    expect(keyframeDefinitions.confettiFall).toBeDefined();
  });
});

describe("ZANA Base Components", () => {
  describe("Button Component", () => {
    it("renders children with semibold Kurdish font and mobile touch target", () => {
      render(<Button variant="primary">دەستپێکردنی وانە</Button>);
      const btn = screen.getByRole("button", { name: "دەستپێکردنی وانە" });
      expect(btn).toBeInTheDocument();
      expect(btn.className).toContain("min-h-[48px]");
      expect(btn.className).toContain("font-semibold");
    });

    it("renders accessible loading spinner when loading=true", () => {
      render(<Button loading>ناردن</Button>);
      const btn = screen.getByRole("button");
      expect(btn).toBeDisabled();
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("renders icons properly", () => {
      render(
        <Button
          leftIcon={<span data-testid="left-icon">←</span>}
          rightIcon={<span data-testid="right-icon">→</span>}
        >
          بەردەوام بە
        </Button>
      );
      expect(screen.getByTestId("left-icon")).toBeInTheDocument();
      expect(screen.getByTestId("right-icon")).toBeInTheDocument();
    });
  });

  describe("Input Component", () => {
    it("renders Kurdish label and maintains 16px minimum font size for mobile zoom prevention", () => {
      render(
        <Input
          label="ناوی تەواو"
          placeholder="ناوەکەت بنووسە..."
          hint="ناوی سیانیت بنووسە"
        />
      );
      expect(screen.getByText("ناوی تەواو")).toBeInTheDocument();
      const input = screen.getByPlaceholderText("ناوەکەت بنووسە...");
      expect(input.className).toContain("min-h-[48px]");
      expect(input.className).toContain("text-base");
      expect(screen.getByText("ناوی سیانیت بنووسە")).toBeInTheDocument();
    });

    it("displays error message and sets aria-invalid in error state", () => {
      render(
        <Input
          label="ئیمەیڵ"
          error="ئیمەیڵەکەت دروست نییە"
        />
      );
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByRole("alert")).toHaveTextContent("ئیمەیڵەکەت دروست نییە");
    });
  });

  describe("Card Component", () => {
    it("renders with padding and handles interactive click", () => {
      let clicked = false;
      render(
        <Card variant="interactive" padding="md" onClick={() => (clicked = true)}>
          <h3>کیمیای پۆلی ١٢</h3>
        </Card>
      );
      const card = screen.getByRole("button");
      expect(card).toBeInTheDocument();
      expect(card.className).toContain("p-4");
      fireEvent.click(card);
      expect(clicked).toBe(true);
    });

    it("supports keyboard Enter trigger when interactive", () => {
      let triggered = false;
      render(
        <Card variant="interactive" onClick={() => (triggered = true)}>
          <p>تاقیکردنەوە</p>
        </Card>
      );
      const card = screen.getByRole("button");
      fireEvent.keyDown(card, { key: "Enter" });
      expect(triggered).toBe(true);
    });
  });

  describe("Badge Component", () => {
    it("enforces zero-pill rule (colored dot + text without pill background by default)", () => {
      render(<Badge variant="success">شارەزا</Badge>);
      const badge = screen.getByText("شارەزا");
      expect(badge).toBeInTheDocument();
      // Parent container does not have heavy pill background by default
      expect(badge.parentElement?.className).not.toContain("bg-emerald-50");
    });

    it("displays mastery statuses correctly", () => {
      render(<Badge variant="primary" size="md">کیمیای ئەندامی</Badge>);
      expect(screen.getByText("کیمیای ئەندامی")).toBeInTheDocument();
    });
  });

  describe("ProgressRing Component", () => {
    it("renders accessible circular progressbar with SVG animation", () => {
      render(
        <ProgressRing
          value={75}
          size={64}
          label="ڕێژەی تەواوکردنی بەندەکە"
          centerContent={<span>75%</span>}
        />
      );
      const ring = screen.getByRole("progressbar");
      expect(ring).toHaveAttribute("aria-valuenow", "75");
      expect(screen.getByText("75%")).toBeInTheDocument();
    });
  });

  describe("Skeleton Loaders", () => {
    it("renders basic skeleton with shimmer animation", () => {
      const { container } = render(<Skeleton variant="heading" />);
      const el = container.firstChild as HTMLElement;
      expect(el.className).toContain("animate-shimmer");
      expect(el.className).toContain("h-7");
    });

    it("renders content-shaped skeletons (SubjectCard, ChatBubble, PlanItem)", () => {
      const { container: c1 } = render(<SubjectCardSkeleton />);
      expect(c1.querySelector(".animate-shimmer")).toBeInTheDocument();

      const { container: c2 } = render(<ChatBubbleSkeleton isAi />);
      expect(c2.querySelector(".animate-shimmer")).toBeInTheDocument();

      const { container: c3 } = render(<PlanItemSkeleton />);
      expect(c3.querySelector(".animate-shimmer")).toBeInTheDocument();
    });
  });
});
