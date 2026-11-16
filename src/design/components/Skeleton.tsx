import { forwardRef, HTMLAttributes } from "react";

export type SkeletonVariant = "text" | "heading" | "card" | "avatar" | "button";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Shape variant of the skeleton placeholder
   * @default 'text'
   */
  variant?: SkeletonVariant;
  /**
   * Custom width string or pixel size (e.g., '100%', '180px', '3rem')
   */
  width?: string | number;
  /**
   * Custom height string or pixel size
   */
  height?: string | number;
  /**
   * Optional custom rounded class name
   */
  rounded?: string;
}

const variantStyles: Record<SkeletonVariant, string> = {
  text: "h-4 w-full rounded-md",
  heading: "h-7 w-3/4 rounded-lg",
  card: "h-36 w-full rounded-2xl",
  avatar: "w-11 h-11 rounded-full shrink-0",
  button: "h-11 w-32 rounded-xl",
};

/**
 * ZANA Base Skeleton Loader
 * Accessible content placeholder featuring a gentle shimmering gradient.
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = "text",
      width,
      height,
      rounded,
      className = "",
      style,
      ...props
    },
    ref
  ) => {
    const inlineStyles: React.CSSProperties = {
      ...(width !== undefined ? { width } : {}),
      ...(height !== undefined ? { height } : {}),
      ...style,
    };

    return (
      <div
        ref={ref}
        aria-hidden="true"
        style={inlineStyles}
        className={`bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700/60 dark:to-slate-800 bg-[length:200%_100%] animate-shimmer select-none ${
          variantStyles[variant]
        } ${rounded || ""} ${className}`}
        {...props}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";

/**
 * Specific Content-Shaped Skeleton: SubjectCardSkeleton
 */
export function SubjectCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs"
    >
      <div className="flex items-center justify-between">
        <Skeleton variant="avatar" className="w-12 h-12 rounded-xl" />
        <Skeleton variant="text" width={60} height={20} className="rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton variant="heading" width="80%" />
        <Skeleton variant="text" width="60%" />
      </div>
      <div className="pt-2">
        <Skeleton variant="text" height={6} className="rounded-full" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton variant="text" width={80} />
        <Skeleton variant="button" width={110} height={36} className="rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Specific Content-Shaped Skeleton: ChatBubbleSkeleton
 */
export function ChatBubbleSkeleton({ isAi = true }: { isAi?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-start gap-3 my-3 w-full ${isAi ? "flex-row" : "flex-row-reverse"}`}
    >
      <Skeleton variant="avatar" className="w-9 h-9" />
      <div
        className={`p-4 rounded-2xl max-w-[80%] space-y-2 ${
          isAi
            ? "bg-slate-100 dark:bg-slate-800/80 rounded-tr-xs"
            : "bg-indigo-50 dark:bg-indigo-950/60 rounded-tl-xs"
        }`}
      >
        <Skeleton variant="text" width={180} />
        <Skeleton variant="text" width={240} />
        <Skeleton variant="text" width={140} />
      </div>
    </div>
  );
}

/**
 * Specific Content-Shaped Skeleton: PlanItemSkeleton
 */
export function PlanItemSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs"
    >
      <div className="flex items-center gap-3 w-full">
        <Skeleton variant="avatar" className="w-6 h-6 rounded-md shrink-0" />
        <div className="space-y-1.5 w-full max-w-xs">
          <Skeleton variant="text" width="70%" />
          <Skeleton variant="text" width="40%" height={12} />
        </div>
      </div>
      <Skeleton variant="button" width={75} height={32} className="rounded-lg shrink-0" />
    </div>
  );
}
