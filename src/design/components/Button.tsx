import React, { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style variant of the button
   * @default 'primary'
   */
  variant?: ButtonVariant;
  /**
   * Sizing scale of the button (auto-scales touch target to min 48px on mobile)
   * @default 'md'
   */
  size?: ButtonSize;
  /**
   * Displays an accessible loading spinner and disables interactions
   * @default false
   */
  loading?: boolean;
  /**
   * Disables the button and dims appearance
   * @default false
   */
  disabled?: boolean;
  /**
   * Stretches the button to occupy the entire width of its container
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Element or icon displayed before the label
   */
  leftIcon?: ReactNode;
  /**
   * Element or icon displayed after the label
   */
  rightIcon?: ReactNode;
  /**
   * Button label content or child nodes
   */
  children?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white border-transparent shadow-xs hover:shadow-sm focus-visible:ring-[#6366F1]",
  secondary:
    "bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 focus-visible:ring-slate-400",
  ghost:
    "bg-transparent hover:bg-indigo-50 active:bg-indigo-100 dark:hover:bg-indigo-950/40 text-[#6366F1] dark:text-indigo-400 border-transparent focus-visible:ring-[#6366F1]",
  danger:
    "bg-[#F43F5E] hover:bg-[#E11D48] active:bg-rose-700 text-white border-transparent shadow-xs hover:shadow-sm focus-visible:ring-[#F43F5E]",
  success:
    "bg-[#10B981] hover:bg-[#059669] active:bg-emerald-700 text-white border-transparent shadow-xs hover:shadow-sm focus-visible:ring-[#10B981]",
};

const sizeStyles: Record<ButtonSize, { container: string; icon: string }> = {
  sm: {
    container: "h-9 min-h-[48px] sm:min-h-[36px] px-3 text-sm rounded-lg gap-1.5",
    icon: "w-4 h-4",
  },
  md: {
    container: "h-11 min-h-[48px] sm:min-h-[44px] px-4 text-base rounded-xl gap-2",
    icon: "w-5 h-5",
  },
  lg: {
    container: "h-[52px] min-h-[48px] px-6 text-lg rounded-xl gap-2.5",
    icon: "w-5 h-5",
  },
  xl: {
    container: "h-[60px] min-h-[52px] px-8 text-xl rounded-2xl gap-3",
    icon: "w-6 h-6",
  },
};

/**
 * ZANA Design System Button
 * Accessible, mobile-first button optimized for Kurdish Sorani typography.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      className = "",
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const { container, icon: iconClass } = sizeStyles[size];

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center font-semibold font-sans tracking-wide border transition-all duration-150 select-none cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-97 ${
          container
        } ${variantStyles[variant]} ${
          fullWidth ? "w-full" : "w-auto"
        } ${
          isDisabled ? "opacity-40 cursor-not-allowed pointer-events-none shadow-none" : ""
        } ${className}`}
        {...props}
      >
        {loading ? (
          <span
            className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0"
            role="status"
            aria-label="چاوەڕوان بە..."
          />
        ) : (
          leftIcon && <span className={`inline-flex shrink-0 ${iconClass}`}>{leftIcon}</span>
        )}
        <span className="truncate leading-normal">{children}</span>
        {!loading && rightIcon && (
          <span className={`inline-flex shrink-0 ${iconClass}`}>{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
