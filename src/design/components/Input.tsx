import { forwardRef, InputHTMLAttributes, ReactNode, useId } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /**
   * Kurdish label displayed above the input field
   */
  label?: string;
  /**
   * Error message displayed below input in error state
   */
  error?: string;
  /**
   * Informational hint text displayed below input
   */
  hint?: string;
  /**
   * Marks input in valid/success state with emerald border
   * @default false
   */
  isSuccess?: boolean;
  /**
   * Element or icon positioned at the start (right side in RTL)
   */
  leftIcon?: ReactNode;
  /**
   * Element or icon positioned at the end (left side in RTL)
   */
  rightIcon?: ReactNode;
  /**
   * Container wrapper class names
   */
  wrapperClassName?: string;
}

/**
 * ZANA Design System Input
 * Form input adhering to mobile tap-target and iOS zoom prevention (font size >= 16px).
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      isSuccess = false,
      leftIcon,
      rightIcon,
      id: customId,
      disabled = false,
      required = false,
      className = "",
      wrapperClassName = "",
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = customId || generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    const hasError = Boolean(error);

    return (
      <div className={`w-full flex flex-col gap-1.5 ${wrapperClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold font-sans text-slate-800 dark:text-slate-200 select-none flex items-center justify-between"
          >
            <span>{label}</span>
            {required && (
              <span className="text-xs text-rose-500 font-normal" aria-hidden="true">
                * پێویستە
              </span>
            )}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 z-10">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={hasError ? "true" : "false"}
            aria-describedby={hasError ? errorId : hint ? hintId : undefined}
            className={`w-full min-h-[48px] rounded-xl px-4 py-3 text-base sm:text-base font-sans bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border transition-all duration-150 outline-none touch-manipulation disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-950 disabled:cursor-not-allowed ${
              leftIcon ? "pr-11" : "pr-4"
            } ${rightIcon ? "pl-11" : "pl-4"} ${
              hasError
                ? "border-[#F43F5E] ring-1 ring-[#F43F5E] focus:border-[#F43F5E] focus:ring-2 focus:ring-[#F43F5E]/30"
                : isSuccess
                ? "border-[#10B981] ring-1 ring-[#10B981] focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/30"
                : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/30"
            } ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute left-3.5 flex items-center text-slate-400 dark:text-slate-500 z-10">
              {rightIcon}
            </div>
          )}
        </div>

        {hasError ? (
          <p
            id={errorId}
            role="alert"
            className="text-xs font-medium font-sans text-[#F43F5E] flex items-center gap-1 mt-0.5"
          >
            {error}
          </p>
        ) : hint ? (
          <p
            id={hintId}
            className="text-xs font-normal font-sans text-slate-500 dark:text-slate-400 mt-0.5"
          >
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
