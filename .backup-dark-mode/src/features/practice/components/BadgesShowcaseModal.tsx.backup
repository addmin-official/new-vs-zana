import React from "react";
import { AVAILABLE_BADGES } from "../practiceStorage.ts";
import { PracticeBadge } from "../practiceTypes.ts";
import { Calculator, Zap, FlaskConical, Atom, Gauge, Trophy, CheckCircle2, Lock, X } from "lucide-react";

interface BadgesShowcaseModalProps {
  unlockedBadgeIds: string[];
  isOpen: boolean;
  onClose: () => void;
}

const renderBadgeIcon = (iconName: string, isUnlocked: boolean) => {
  const iconClass = `w-6 h-6 ${isUnlocked ? "text-amber-500" : "text-slate-400"}`;
  switch (iconName) {
    case "Calculator":
      return <Calculator className={iconClass} />;
    case "Zap":
      return <Zap className={iconClass} />;
    case "FlaskConical":
      return <FlaskConical className={iconClass} />;
    case "Atom":
      return <Atom className={iconClass} />;
    case "Gauge":
      return <Gauge className={iconClass} />;
    case "Trophy":
      return <Trophy className={iconClass} />;
    default:
      return <CheckCircle2 className={iconClass} />;
  }
};

export const BadgesShowcaseModal: React.FC<BadgesShowcaseModalProps> = ({
  unlockedBadgeIds,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-5 space-y-4 shadow-xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              مەدالیا و دەستکەوتەکانی زانا
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {unlockedBadgeIds.length} لە {AVAILABLE_BADGES.length} مەدالیا بەدەستهاتوون
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Badges Grid */}
        <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
          {AVAILABLE_BADGES.map((badge: PracticeBadge) => {
            const isUnlocked = unlockedBadgeIds.includes(badge.id);

            return (
              <div
                key={badge.id}
                className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                  isUnlocked
                    ? "bg-amber-50/50 border-amber-200/80 shadow-xs"
                    : "bg-slate-50 border-slate-100 opacity-70"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    isUnlocked ? "bg-amber-100/80" : "bg-slate-200"
                  }`}
                >
                  {isUnlocked ? (
                    renderBadgeIcon(badge.iconName, true)
                  ) : (
                    <Lock className="w-5 h-5 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 text-right">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs font-bold ${isUnlocked ? "text-slate-900" : "text-slate-500"}`}>
                      {badge.titleKu}
                    </h4>
                    {isUnlocked ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        بەدەستهاتووە
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">داخراوە</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    {badge.descriptionKu}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
