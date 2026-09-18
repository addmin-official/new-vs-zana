import { Sparkles, Compass, BookOpen, BookMarked, FileText, User, FlaskConical, Users } from "lucide-react";

export type NavTab = "daily" | "practice" | "subjects" | "rooms" | "chat" | "plan" | "report" | "profile";

interface BottomNavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    { id: "daily" as NavTab, label: "ڕۆژانە", icon: Sparkles },
    { id: "practice" as NavTab, label: "ڕاهێنان", icon: FlaskConical },
    { id: "rooms" as NavTab, label: "ژوور", icon: Users },
    { id: "subjects" as NavTab, label: "بابەتەکان", icon: BookOpen },
    { id: "chat" as NavTab, label: "خوێندن", icon: BookMarked },
    { id: "plan" as NavTab, label: "پلان", icon: Compass },
    { id: "report" as NavTab, label: "ڕاپۆرت", icon: FileText },
    { id: "profile" as NavTab, label: "پڕۆفایل", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-1 py-1 shadow-lg pb-safe transition-colors">
      <div className="max-w-md mx-auto flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] cursor-pointer transition-colors ${
                isActive
                  ? "text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              <Icon className={`w-4 h-4 mb-1 ${isActive ? "scale-110" : ""} transition-transform`} />
              <span className="font-sans text-[9px] font-medium leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

