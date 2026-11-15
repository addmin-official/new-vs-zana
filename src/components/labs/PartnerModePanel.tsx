import React, { useState } from "react";
import {
  Users,
  Gamepad2,
  Eye,
  FileEdit,
  Send,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { PartnerRole, PartnerSessionState } from "./labTypes.ts";

export interface PartnerModePanelProps {
  session: PartnerSessionState;
  onUpdateSession: (updated: Partial<PartnerSessionState>) => void;
  onAddObserverNote: (note: string) => void;
}

export const PartnerModePanel: React.FC<PartnerModePanelProps> = ({
  session,
  onUpdateSession,
  onAddObserverNote,
}) => {
  const [noteInput, setNoteInput] = useState("");

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    onAddObserverNote(noteInput.trim());
    setNoteInput("");
  };

  const roles: { id: PartnerRole; labelKu: string; icon: React.ElementType; descKu: string }[] = [
    {
      id: "controller",
      labelKu: "کۆنتڕۆڵکەر (قوتابی A)",
      icon: Gamepad2,
      descKu: "دەستکاری خلیسکێنەرەکان، گۆڕاوەکان، دەستپێکردن و ڕاگرتن",
    },
    {
      id: "observer",
      labelKu: "چاودێر (قوتابی B)",
      icon: Eye,
      descKu: "چاودێریکردنی ئەنجامەکان و تۆمارکردنی سەرنج و دیاردەکان",
    },
    {
      id: "reporter",
      labelKu: "ڕاپۆرتنوس (هاوبەش)",
      icon: FileEdit,
      descKu: "داڕشتنی دەرەنجام و ئامادەکردنی ڕاپۆرتی کۆتایی بۆ مامۆستا",
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-4 sm:p-5 space-y-4 font-sans" dir="rtl">
      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>دۆخی فێرکاریی هاوبەش (Partner Mode)</span>
              <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-md font-bold">
                دوو قوتابی
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              دابەشکردنی ئەرکەکانی تاقیگە لە نێوان دوو قوتابی (تۆمارکەر و تاقیکەرەوە)
            </p>
          </div>
        </div>

        {/* Active Role Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {roles.map((r) => {
            const Icon = r.icon;
            const isActive = session.activeRole === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onUpdateSession({ activeRole: r.id })}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? "bg-white text-purple-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title={r.descKu}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{r.labelKu.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Role Banner */}
      <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl flex items-center justify-between text-xs text-purple-900">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
          <span>
            ڕۆڵی ئێستات:{" "}
            <strong>
              {roles.find((r) => r.id === session.activeRole)?.labelKu}
            </strong>{" "}
            — {roles.find((r) => r.id === session.activeRole)?.descKu}
          </span>
        </div>
      </div>

      {/* Split Observation Log (Student B Notes) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
            <span>تێبینی و سەرنجەکانی چاودێر (Observer Notes):</span>
          </span>
          <span className="text-[10px] text-slate-500 font-normal">
            {session.observerNotes.length} تێبینی تۆمارکراو
          </span>
        </div>

        {/* Input box */}
        <form onSubmit={handleAddNote} className="flex gap-2">
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="سەرنجێک بنووسە: وەک (لە کاتی گەیشتن بە pH=7 ڕەنگ گۆڕا)..."
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-600"
          />
          <button
            type="submit"
            disabled={!noteInput.trim()}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span>تۆمارکردن</span>
          </button>
        </form>

        {/* Notes List */}
        {session.observerNotes.length > 0 && (
          <div className="max-h-28 overflow-y-auto space-y-1.5 pt-1">
            {session.observerNotes.map((note, idx) => (
              <div
                key={idx}
                className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700 flex items-start gap-2"
              >
                <CheckCircle className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
