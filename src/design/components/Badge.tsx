import { forwardRef, HTMLAttributes, ReactNode } from "react";

export type BadgeVariant = "primary" | "success" | "warning" | "error" | "neutral";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Status color palette for the indicator dot and label
   * @default 'neutral'
   */
  variant?: BadgeVariant;
  /**
   * Sizing scale of the badge
   * @default 'sm'
   */
  size?: BadgeSize;
  /**
   * Whether to display the status indicator dot
   * @default true
   */
  showDot?: boolean;
  /**
   * Optional subtle container background (off by default to enforce zero-pill rule)
   * @default false
   */
  withBackground?: boolean;
  /**
   * Badge label text
   */
  children: ReactNode;
}

const variantStyles: Record<
  BadgeVariant,
  { text: string; dot: string; bg: string }
> = {
  primary: {
    text: "text-[#6366F1] dark:text-indigo-400 font-semibold",
    dot: "bg-[#6366F1] shadow-xs shadow-indigo-300",
    bg: "bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800",
  },
  success: {
    text: "text-[#059669] dark:text-emerald-400 font-semibold",
    dot: "bg-[#10B981] shadow-xs shadow-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800",
  },
  warning: {
    text: "text-[#D97706] dark:text-amber-400 font-semibold",
    dot: "bg-[#F59E0B] shadow-xs shadow-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800",
  },
  error: {
    text: "text-[#E11D48] dark:text-rose-400 font-semibold",
    dot: "bg-[#F43F5E] shadow-xs shadow-rose-300",
    bg: "bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800",
  },
  neutral: {
    text: "text-slate-600 dark:text-slate-400 font-medium",
    dot: "bg-slate-400 dark:bg-slate-500",
    bg: "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
  },
};

const sizeStyles: Record<BadgeSize, { container: string; dot: string; text: string }> = {
  sm: {
    container: "gap-1.5 py-0.5 px-1.5 text-xs",
    dot: "w-1.5 h-1.5",
    text: "text-xs",
  },
  md: {
    container: "gap-2 py-1 px-2.5 text-sm",
    dot: "w-2 h-2",
    text: "text-sm",
  },
};

/**
 * ZANA Design System Badge
 * Adheres strictly to the "Zero-Pill Rule" — subtle dot indicator + crisp text.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = "neutral",
      size = "sm",
      showDot = true,
      withBackground = false,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const { text, dot, bg } = variantStyles[variant];
    const { container, dot: dotClass, text: textSize } = sizeStyles[size];

    return (
      <span
        ref={ref}
        className={`inline-flex items-center select-none font-sans rounded-full transition-colors ${
          container
        } ${textSize} ${text} ${withBackground ? bg : ""} ${className}`}
        {...props}
      >
        {showDot && (
          <span
            className={`rounded-full shrink-0 ${dotClass} ${dot}`}
            aria-hidden="true"
          />
        )}
        <span className="leading-tight">{children}</span>
      </span>
    );
  }
);

Badge.displayName = "Badge";
