import { forwardRef, HTMLAttributes, ReactNode } from "react";

export type CardVariant = "default" | "elevated" | "interactive" | "highlighted";
export type CardPadding = "sm" | "md" | "lg";
export type CardAccent = "primary" | "success" | "warning" | "error";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Card presentation style
   * @default 'default'
   */
  variant?: CardVariant;
  /**
   * Internal padding spacing
   * @default 'md'
   */
  padding?: CardPadding;
  /**
   * Decorative accent line color (especially for highlighted cards)
   */
  accent?: CardAccent;
  /**
   * Card child elements
   */
  children?: ReactNode;
}

const paddingStyles: Record<CardPadding, string> = {
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

const accentStyles: Record<CardAccent, string> = {
  primary: "border-r-4 border-r-[#6366F1] rtl:border-r-4 rtl:border-l-0 ltr:border-l-4",
  success: "border-r-4 border-r-[#10B981] rtl:border-r-4 rtl:border-l-0 ltr:border-l-4",
  warning: "border-r-4 border-r-[#F59E0B] rtl:border-r-4 rtl:border-l-0 ltr:border-l-4",
  error: "border-r-4 border-r-[#F43F5E] rtl:border-r-4 rtl:border-l-0 ltr:border-l-4",
};

/**
 * ZANA Design System Card
 * Clean, modern surface container supporting interactive and elevated states.
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = "default",
      padding = "md",
      accent,
      onClick,
      className = "",
      children,
      tabIndex,
      ...props
    },
    ref
  ) => {
    const isInteractive = variant === "interactive" || Boolean(onClick);

    let variantClasses = "";
    switch (variant) {
      case "elevated":
        variantClasses =
          "bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-md";
        break;
      case "interactive":
        variantClasses =
          "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600/50 hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-200";
        break;
      case "highlighted":
        variantClasses =
          "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs";
        break;
      case "default":
      default:
        variantClasses =
          "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs";
        break;
    }

    const accentClass =
      variant === "highlighted" && !accent
        ? accentStyles.primary
        : accent
        ? accentStyles[accent]
        : "";

    return (
      <div
        ref={ref}
        onClick={onClick}
        tabIndex={isInteractive && tabIndex === undefined ? 0 : tabIndex}
        role={isInteractive && !props.role ? "button" : props.role}
        onKeyDown={
          isInteractive
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
                }
              }
            : undefined
        }
        className={`rounded-2xl transition-all duration-200 text-slate-900 dark:text-slate-100 ${
          paddingStyles[padding]
        } ${variantClasses} ${accentClass} ${
          isInteractive ? "touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]" : ""
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
