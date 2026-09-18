import { HTMLAttributes, ReactNode } from "react";

interface ZanaCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  hoverable?: boolean;
  className?: string;
}

export function ZanaCard({
  children,
  header,
  footer,
  hoverable = false,
  className = "",
  ...props
}: ZanaCardProps) {
  const baseStyle = "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-colors";
  const hoverStyle = hoverable ? "hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-md transition-all duration-200" : "";

  return (
    <div className={`${baseStyle} ${hoverStyle} ${className}`} {...props}>
      {header && (
        <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40">
          {header}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
      {footer && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/30 dark:bg-slate-800/20">
          {footer}
        </div>
      )}
    </div>
  );
}
