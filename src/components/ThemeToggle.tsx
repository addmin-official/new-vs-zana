import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme, ThemeMode } from "../context/ThemeContext.tsx";
import { useState, useRef, useEffect } from "react";

interface ThemeToggleProps {
  showMenu?: boolean;
  className?: string;
}

export function ThemeToggle({ showMenu = false, className = "" }: ThemeToggleProps) {
  const { theme, isDark, setTheme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!showMenu) {
    return (
      <button
        onClick={toggleTheme}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-2xs ${className}`}
        aria-label={isDark ? "گۆڕین بۆ ڕووکاری ڕووناک" : "گۆڕین بۆ ڕووکاری تاریک"}
        title={isDark ? "گۆڕین بۆ ڕووکاری ڕووناک" : "گۆڕین بۆ ڕووکاری تاریک"}
      >
        {isDark ? (
          <Sun className="w-5 h-5 text-amber-400 transition-transform hover:rotate-45" />
        ) : (
          <Moon className="w-5 h-5 text-slate-600 transition-transform hover:-rotate-12" />
        )}
      </button>
    );
  }

  const options: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
    { mode: "light", label: "ڕووناک", icon: Sun },
    { mode: "dark", label: "تاریک", icon: Moon },
    { mode: "system", label: "سیستەم", icon: Laptop },
  ];

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-2xs"
        aria-label="هەڵبژاردنی ڕووکار"
      >
        {isDark ? (
          <Moon className="w-5 h-5 text-blue-400" />
        ) : (
          <Sun className="w-5 h-5 text-amber-500" />
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1.5 z-50 text-right animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.mode;
            return (
              <button
                key={opt.mode}
                onClick={() => {
                  setTheme(opt.mode);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span>{opt.label}</span>
                <Icon className="w-4 h-4 opacity-80" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
