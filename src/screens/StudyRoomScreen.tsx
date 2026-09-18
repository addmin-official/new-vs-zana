import { useState, useEffect } from "react";
import {
  Users,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Radio,
  Volume2,
  VolumeX,
  Target,
  ExternalLink,
  Heart,
  MessageSquare,
} from "lucide-react";
import { StudentProfile } from "../services/storage.ts";
import { useStudyRoom } from "../hooks/useStudyRoom.ts";
import { fetchStudyRooms } from "../services/studyRoomApi.ts";
import { StudyRoomSummary, RoomParticipant, FocusStatus } from "../server/rooms/StudyRoomTypes.ts";

interface StudyRoomScreenProps {
  profile: StudentProfile;
  onNavigateToPractice?: (subjectKey?: string, conceptTitle?: string) => void;
  onNavigateToChat?: (conceptTitle?: string) => void;
}

const STATUS_LABELS: Record<FocusStatus, { label: string; color: string; bg: string }> = {
  deep_focus: {
    label: "قووڵبوونەوە لە خوێندن",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/80",
  },
  solving: {
    label: "شیکارکردنی پرسیار",
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/80",
  },
  review: {
    label: "پیاچوونەوەی چەمک",
    color: "text-purple-700 dark:text-purple-300",
    bg: "bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800/80",
  },
  break: {
    label: "پشووی کورت",
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/80",
  },
};

const CHEER_TEMPLATES = [
  { emoji: "👏", text: "دەستت خۆش بێت! بەردەوام بە" },
  { emoji: "🔥", text: "ئافەرم! وزەیەکی بەرزە" },
  { emoji: "✨", text: "خوێندنی پڕ پیت و سەرکەوتووانە" },
  { emoji: "💪", text: "هێزت لەگەڵ بێت لەم بابەتەدا" },
];

export function StudyRoomScreen({ profile, onNavigateToPractice, onNavigateToChat }: StudyRoomScreenProps) {
  const [availableRooms, setAvailableRooms] = useState<StudyRoomSummary[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("chem-grade12");
  const [isAmbiencePlaying, setIsAmbiencePlaying] = useState<boolean>(false);
  const [cheeringTarget, setCheeringTarget] = useState<RoomParticipant | null>(null);
  const [cheerFeedback, setCheerFeedback] = useState<string | null>(null);
  const [customGoalInput, setCustomGoalInput] = useState<string>("");
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);

  // Load available rooms list
  useEffect(() => {
    fetchStudyRooms(profile.grade || "12")
      .then((rooms) => {
        setAvailableRooms(rooms);
        if (rooms.length > 0 && !rooms.some((r) => r.id === selectedRoomId)) {
          setSelectedRoomId(rooms[0].id);
        }
      })
      .catch((err) => console.warn("Failed to load rooms:", err));
  }, [profile.grade, selectedRoomId]);

  const {
    room,
    isLoading,
    focusMinutes,
    focusSeconds,
    isTimerRunning,
    status,
    currentConcept,
    goal,
    incomingCheer,
    startTimer,
    pauseTimer,
    resetTimer,
    setStatus,
    setCurrentConcept,
    setGoal,
    cheerClassmate,
    dismissIncomingCheer,
  } = useStudyRoom(selectedRoomId, profile);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendCheer = async (classmate: RoomParticipant, template: { emoji: string; text: string }) => {
    const ok = await cheerClassmate(classmate, template.text, template.emoji);
    if (ok) {
      setCheerFeedback(`هاندانی تۆ بۆ ${classmate.name} نێردرا! ${template.emoji}`);
      setCheeringTarget(null);
      setTimeout(() => setCheerFeedback(null), 3000);
    }
  };

  const handleSaveGoal = () => {
    if (customGoalInput.trim()) {
      setGoal(customGoalInput.trim());
      setIsEditingGoal(false);
      setCustomGoalInput("");
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-8 animate-in fade-in duration-200">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-xs">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider bg-white/15 px-2.5 py-0.5 rounded-full">
                ژووری خوێندنی هاوبەش
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-emerald-500/25 border border-emerald-300/30 px-2.5 py-1 rounded-full text-xs font-medium">
              <Radio className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
              <span>{room?.activeCount || 1} خوێندکار لەسەر هێڵن</span>
            </div>
          </div>

          <h2 className="text-lg font-bold mt-1">
            {room?.title || "ژووری خوێندنی زانا"}
          </h2>
          <p className="text-blue-100 text-xs leading-relaxed max-w-sm">
            لەگەڵ هاوپۆلەکانت لەسەر هەمان چەمکەکانی مەنهەج بخوێنە، لە کەشێکی تەواو هێمن و ئارامدا.
          </p>
        </div>
      </div>

      {/* Room Selector Pills */}
      {availableRooms.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {availableRooms.map((r) => {
            const isSelected = r.id === selectedRoomId;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRoomId(r.id)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-blue-400"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{r.subjectNameKu}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {r.activeCount}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Incoming Cheer Toast Notification */}
      {incomingCheer && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-3.5 rounded-xl shadow-md flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{incomingCheer.emoji}</span>
            <div>
              <p className="text-xs font-bold">
                هاندانێک لەلایەن {incomingCheer.fromName}!
              </p>
              <p className="text-[11px] text-amber-100 mt-0.5">
                "{incomingCheer.message}"
              </p>
            </div>
          </div>
          <button
            onClick={dismissIncomingCheer}
            className="text-xs font-bold bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
          >
            سوپاس
          </button>
        </div>
      )}

      {/* Sent Cheer Feedback Toast */}
      {cheerFeedback && (
        <div className="bg-emerald-600 text-white p-3 rounded-xl shadow-sm text-xs font-medium text-center animate-in fade-in duration-200">
          {cheerFeedback}
        </div>
      )}

      {/* My Focus Station (Personal Cockpit) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                تایمەری قووڵبوونەوە
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                کاتی تۆمارکراوی خوێندنی تۆ
              </p>
            </div>
          </div>

          {/* Ambience Toggle */}
          <button
            onClick={() => setIsAmbiencePlaying(!isAmbiencePlaying)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              isAmbiencePlaying
                ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
                : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
            }`}
            title="دەنگی کەشی خوێندن (باران و هێمنی)"
          >
            {isAmbiencePlaying ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                <span>کەشی هێمن چالاکە</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>کەشی بێدەنگ</span>
              </>
            )}
          </button>
        </div>

        {/* Timer Display & Controls */}
        <div className="flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-wider">
              {formatTimer(focusSeconds)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              ({focusMinutes} خولەک)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isTimerRunning ? (
              <button
                onClick={pauseTimer}
                className="w-9 h-9 rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                title="ڕاگرتنی کاتی"
              >
                <Pause className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={startTimer}
                className="w-9 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                title="دەستپێکردنی خوێندن"
              >
                <Play className="w-4 h-4 mr-0.5" />
              </button>
            )}
            <button
              onClick={resetTimer}
              className="w-9 h-9 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              title="سفرکردنەوە"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            دۆخی ئێستات:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {(["deep_focus", "solving", "review", "break"] as FocusStatus[]).map((stKey) => {
              const meta = STATUS_LABELS[stKey];
              const isCurrent = status === stKey;
              return (
                <button
                  key={stKey}
                  onClick={() => setStatus(stKey)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                    isCurrent
                      ? `${meta.bg} ${meta.color} font-bold shadow-xs`
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                  }`}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Concept & Goal */}
        <div className="flex flex-col gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              چەمک یان ئامانجی خوێندنت لەم ژوورەدا:
            </span>
            {!isEditingGoal && (
              <button
                onClick={() => setIsEditingGoal(true)}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                دەستکاری
              </button>
            )}
          </div>

          {isEditingGoal ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customGoalInput}
                onChange={(e) => setCustomGoalInput(e.target.value)}
                placeholder="بۆ نموونە: شیکارکردنی ۵ پرسیاری لەیزەر..."
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                dir="rtl"
              />
              <button
                onClick={handleSaveGoal}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 cursor-pointer"
              >
                پاشەکەوت
              </button>
              <button
                onClick={() => setIsEditingGoal(false)}
                className="text-xs text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
              >
                پاشگەزبوونەوە
              </button>
            </div>
          ) : (
            <div className="bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200">
              <span className="font-semibold text-blue-700 dark:text-blue-400">
                {currentConcept || room?.featuredConcept || "خوێندنی گشتی"}
              </span>
              {goal && (
                <span className="text-slate-600 dark:text-slate-400 block mt-0.5 text-[11px]">
                  ئامانج: {goal}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Classmates Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              هاوپۆلەکانت لەم چەمکەدا ({room?.participants?.length || 0})
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            لەسەر هەمان مەنهەج دەخوێنن
          </span>
        </div>

        {isLoading ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500">
            پەیوەندی بە ژووری خوێندنەوە دەکرێت...
          </div>
        ) : room?.participants && room.participants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {room.participants.map((p) => {
              const isMe = p.id === (profile.id || `student_${profile.name || "anon"}`);
              const statusMeta = STATUS_LABELS[p.status] || STATUS_LABELS.deep_focus;

              return (
                <div
                  key={p.id}
                  className={`bg-white dark:bg-slate-900 border rounded-xl p-3.5 shadow-2xs transition-all flex flex-col justify-between gap-3 ${
                    isMe
                      ? "border-blue-300 dark:border-blue-700/80 bg-blue-50/20 dark:bg-blue-950/20"
                      : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0"
                        style={{ backgroundColor: p.avatarColor || "#3B82F6" }}
                      >
                        {p.name ? p.name.charAt(0) : "ق"}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {p.name}
                          </h4>
                          {isMe && (
                            <span className="text-[10px] font-medium bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded-full">
                              تۆ
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          پۆلی {p.grade} • {p.focusMinutes} خولەکە سەرقاڵە
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusMeta.bg} ${statusMeta.color}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>

                  {/* Concept badge */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-2 flex flex-col gap-0.5 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      چەمکی ئێستا:
                    </span>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {p.currentConcept || room.featuredConcept}
                    </p>
                    {p.goal && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic truncate">
                        "{p.goal}"
                      </p>
                    )}
                  </div>

                  {/* Classmate Action Row */}
                  {!isMe ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                      {/* Cheer button */}
                      <button
                        onClick={() => setCheeringTarget(p)}
                        className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors cursor-pointer"
                      >
                        <Heart className="w-3.5 h-3.5 fill-amber-100 dark:fill-amber-950" />
                        <span>هاندان</span>
                      </button>

                      <div className="flex items-center gap-2 mr-auto">
                        {/* Join this concept */}
                        <button
                          onClick={() => setCurrentConcept(p.currentConcept)}
                          className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                          title="خوێندنی هەمان چەمک"
                        >
                          خوێندنی ئەمە
                        </button>

                        {/* Ask Zana chat */}
                        {onNavigateToChat && (
                          <button
                            onClick={() => onNavigateToChat(p.currentConcept)}
                            className="flex items-center gap-0.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                            title="پرسیارکردن دەربارەی ئەم چەمکە لە زانا"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>زانا</span>
                          </button>
                        )}

                        {/* Study this concept practice button */}
                        {onNavigateToPractice && (
                          <button
                            onClick={() => onNavigateToPractice(room.subjectKey, p.currentConcept)}
                            className="flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            <span>ڕاهێنان</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center py-0.5">
                      ئامادەی بۆ سەرکەوتن ✨
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500">
            هیچ هاوپۆلێک لەم ژوورەدا نییە. دەتوانیت تۆ یەکەم کەس بیت کە دەست بە خوێندن بکەیت!
          </div>
        )}
      </div>

      {/* Cheer Modal / Dialog */}
      {cheeringTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                هاندانی هاوپۆل: {cheeringTarget.name}
              </h4>
              <button
                onClick={() => setCheeringTarget(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs"
              >
                داخستن
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              کاردانەوەیەکی بێدەنگ بنێرە بۆ ئەوەی هاوپۆلەکەت هەست بە پشتگیری بکات بێ ئەوەی لە خوێندن بکەوێت:
            </p>

            <div className="grid grid-cols-1 gap-2">
              {CHEER_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendCheer(cheeringTarget, tmpl)}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-right cursor-pointer"
                >
                  <span className="text-2xl">{tmpl.emoji}</span>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    {tmpl.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Community Milestones Stream */}
      {room?.milestones && room.milestones.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              دەستکەوتەکانی ئەمڕۆی ژوورەکە
            </h4>
          </div>

          <div className="flex flex-col gap-2">
            {room.milestones.slice(-4).map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="flex-1">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {m.studentName}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 mr-1">
                    : {m.text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
