import React from "react";
import {
  Sparkles,
  BookOpen,
  FlaskConical,
  Compass,
  MessageCircle,
  FileText,
  User,
} from "lucide-react";
import { NavItemKey } from "./Sidebar.tsx";

export interface BottomNavProps {
  activeTab: NavItemKey;
  onNavigate: (tab: NavItemKey) => void;
}

export const BOTTOM_NAV_ITEMS: { key: NavItemKey; label: string; icon: React.ReactNode }[] = [
  { key: "home", label: "چروسکە", icon: <Sparkles className="w-5 h-5" /> },
  { key: "subjects", label: "وانەکان", icon: <BookOpen className="w-5 h-5" /> },
  { key: "practice", label: "ڕاهێنان", icon: <FlaskConical className="w-5 h-5" /> },
  { key: "plan", label: "پلان", icon: <Compass className="w-5 h-5" /> },
  { key: "chat", label: "گفتوگۆ", icon: <MessageCircle className="w-5 h-5" /> },
  { key: "report", label: "ڕاپۆرت", icon: <FileText className="w-5 h-5" /> },
  { key: "profile", label: "هەژمار", icon: <User className="w-5 h-5" /> },
];

export function BottomNav({ activeTab, onNavigate }: BottomNavProps) {
  return (
    <nav
      className="md:hidden shrink-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 px-1 pt-1.5 flex items-center justify-around shadow-[0_-4px_12px_rgba(0,0,0,0.04)] select-none"
      style={{
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))",
      }}
      dir="rtl"
      aria-label="مینیوی مۆبایل"
    >
      {BOTTOM_NAV_ITEMS.map((item) => {
        const isActive =
          activeTab === item.key ||
          (activeTab === "settings" && item.key === "profile");
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onNavigate(item.key)}
            className={`flex flex-col items-center justify-center flex-1 h-[48px] py-1 px-0.5 rounded-xl transition-all cursor-pointer ${
              isActive
                ? "bg-indigo-600 text-white font-bold shadow-xs scale-102"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-medium active:scale-95"
            }`}
          >
            <div className="shrink-0">{item.icon}</div>
            <span className="font-sans text-[10px] leading-tight mt-0.5 truncate max-w-[48px]">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNav;

