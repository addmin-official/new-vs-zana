import React, { useState, useEffect } from "react";
import {
  Users,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Target,
  ExternalLink,
} from "lucide-react";
import { useSoundEffects } from "../hooks/useSoundEffects.ts";
import {
  startAmbientSoundscape,
  stopAmbientSoundscape,
  setAmbientChannelVolume,
  type AmbientSoundType,
} from "../services/ambientSoundscape.ts";

export interface StudyRoomInfo {
  id: string;
  name: string;
  subject: string;
  activeCount: number;
  ambient: string;
}

const AVAILABLE_ROOMS: StudyRoomInfo[] = [
  { id: "room-chem", name: "گرووپی خوێندنی کیمیای پۆلی ١٢", subject: "کیمیا", activeCount: 7, ambient: "بارانی دارستان" },
  { id: "room-phys", name: "شیکارکەرانی فیزیای میکانیک", subject: "فیزیا", activeCount: 12, ambient: "کتێبخانەی بێدەنگ" },
  { id: "room-math", name: "ژووری جیاکاری و تەواوکاری بیرکاری", subject: "بیرکاری", activeCount: 5, ambient: "شەپۆلی دەریا" },
];

export function StudyRooms() {
  const { playSuccess } = useSoundEffects();
  const [selectedRoomId, setSelectedRoomId] = useState<string>("room-chem");
  const [activeRoom, setActiveRoom] = useState<StudyRoomInfo>(AVAILABLE_ROOMS[0]);

  // Pomodoro state: 25 minutes = 1500s
  const [secondsLeft, setSecondsLeft] = useState(1500);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");

  // Ambient sound sliders (0 to 100)
  const [ambientSounds, setAmbientSounds] = useState<Record<AmbientSoundType, number>>({
    rain: 75,
    library: 60,
    waves: 30,
    cafe: 50,
  });
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);

  const [cheerNotice, setCheerNotice] = useState<string | null>(null);

  // Feature: 4 Focus Status Chips
  type FocusStatus = "deep_focus" | "solving" | "review" | "break";
  const [focusStatus, setFocusStatus] = useState<FocusStatus>("deep_focus");

  // Feature: Custom Study Goal
  const [customGoal, setCustomGoal] = useState<string>("");
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [goalInput, setGoalInput] = useState<string>("");

  // Feature: Per-peer cheer feedback
  const [cheerFeedback, setCheerFeedback] = useState<string | null>(null);

  const FOCUS_STATUS_CHIPS: {
    key: FocusStatus;
    label: string;
    activeClass: string;
  }[] = [
    {
      key: "deep_focus",
      label: "قووڵبوونەوە لە خوێندن",
      activeClass:
        "bg-emerald-100 border-emerald-500 text-emerald-800",
    },
    {
      key: "solving",
      label: "شیکارکردنی پرسیار",
      activeClass:
        "bg-indigo-100 border-indigo-500 text-indigo-800",
    },
    {
      key: "review",
      label: "پیاچوونەوەی چەمک",
      activeClass:
        "bg-purple-100 border-purple-500 text-purple-800",
    },
    {
      key: "break",
      label: "پشووی کورت",
      activeClass:
        "bg-amber-100 border-amber-500 text-amber-800",
    },
  ];

  const CHEER_TEMPLATES = [
    { emoji: "👏", text: "دەستت خۆش بێت! بەردەوام بە" },
    { emoji: "🔥", text: "ئافەرم! وزەیەکی بەرزە" },
    { emoji: "✨", text: "خوێندنی پڕ پیت و سەرکەوتووانە" },
    { emoji: "💪", text: "هێزت لەگەڵ بێت لەم بابەتەدا" },
  ];

  // Pomodoro timer loop without setting state directly in effect body
  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          playSuccess();
          setMode((currentMode) => {
            const nextMode = currentMode === "work" ? "break" : "work";
            return nextMode;
          });
          return mode === "work" ? 300 : 1500;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, mode, playSuccess]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(mode === "work" ? 1500 : 300);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSendCheer = (emoji: string, text: string) => {
    playSuccess();
    setCheerNotice(`${emoji} هاندانت نارد بۆ هاوپۆلەکانت: "${text}"`);
    setTimeout(() => setCheerNotice(null), 3000);
  };

  // Stop ambient sound on component unmount
  useEffect(() => {
    return () => {
      stopAmbientSoundscape();
    };
  }, []);

  const toggleAmbientSoundscape = async () => {
    if (isAmbientPlaying) {
      stopAmbientSoundscape();
      setIsAmbientPlaying(false);
    } else {
      (Object.keys(ambientSounds) as AmbientSoundType[]).forEach((key) => {
        setAmbientChannelVolume(key, ambientSounds[key]);
      });
      const ok = await startAmbientSoundscape();
      setIsAmbientPlaying(ok);
    }
  };

  const handleVolumeChange = (key: AmbientSoundType, val: number) => {
    setAmbientSounds((prev) => ({
      ...prev,
      [key]: val,
    }));
    setAmbientChannelVolume(key, val);
  };

  const peers = [
    { name: "محمد علی", topic: "کیمیا • بەندی ترش و تفت", status: "خوێندنی چڕ 🔥" },
    { name: "فاتمة کاروان", topic: "فیزیا • یاسای نیوتن", status: "شیکارکردن ✍️" },
    { name: "حسن هەڵگورد", topic: "بیرکاری • ڕادە و سنوور", status: "پیاچوونەوە 📖" },
    { name: "سارا ڕەحیم", topic: "کیمیا • کاربۆن", status: "خوێندنی چڕ 🔥" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full" dir="rtl">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800/60">
          ژوورەکانی خوێندنی بەکۆمەڵ (Collaborative Study Rooms) 👥
        </span>
        <h1 className="font-sans font-black text-2xl text-slate-900 dark:text-white mt-1">
          ژووری تەرکیز و هاوبەشی هاوپۆلەکان
        </h1>
        <p className="font-sans text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          لەگەڵ هاوڕێکانت بە شێوازی پۆمۆدۆرۆ و دەنگی ئارامبەخش بخوێنە بەبێ چاتی لاوەکی
        </p>
      </div>

      {/* Main Grid: Selector (4 Cols) + Active Room Canvas (8 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Room Selector (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="font-sans font-bold text-sm text-slate-900 dark:text-white">
            ژوورە چالاکەکان
          </h2>

          <div className="space-y-3">
            {AVAILABLE_ROOMS.map((r) => {
              const isSelected = selectedRoomId === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => {
                    setSelectedRoomId(r.id);
                    setActiveRoom(r);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 shadow-2xs"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800/60">
                      {r.subject}
                    </span>
                    <h3 className="font-sans font-bold text-sm text-slate-900 dark:text-white mt-1.5">
                      {r.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-sans pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>{r.activeCount} قوتابی ئێستا چالاکن</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {r.ambient}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Room Canvas (8 Cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          {/* Room Name Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h2 className="font-sans font-bold text-base text-slate-900 dark:text-white">
                {activeRoom.name}
              </h2>
            </div>
            <span className="text-xs font-sans text-slate-500 dark:text-slate-400 font-medium">
              {peers.length + 3} قوتابی بەشدارن
            </span>
          </div>

          {/* Pomodoro Timer Center Card */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 text-center space-y-4 max-w-md mx-auto">
            {/* Work / Break mode toggle indicator */}
            <div className="inline-flex p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold font-sans">
              <span
                className={`px-3 py-1 rounded-lg transition-colors ${
                  mode === "work" ? "bg-indigo-600 text-white" : "text-slate-500 dark:text-slate-400"
                }`}
              >
                کاتی تەرکیز (٢٥ خولەک)
              </span>
              <span
                className={`px-3 py-1 rounded-lg transition-colors ${
                  mode === "break" ? "bg-emerald-600 text-white" : "text-slate-500 dark:text-slate-400"
                }`}
              >
                پشوو (٥ خولەک)
              </span>
            </div>

            {/* Countdown Display */}
            <div className="font-mono font-black text-5xl sm:text-6xl text-slate-900 dark:text-white tracking-wider">
              {formatTimer(secondsLeft)}
            </div>

            {/* Quick Duration Presets */}
            <div className="flex items-center justify-center gap-1.5 text-xs font-sans">
              <button
                type="button"
                onClick={() => {
                  setIsRunning(false);
                  setMode("work");
                  setSecondsLeft(1500);
                }}
                className={`px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer ${
                  secondsLeft === 1500 && mode === "work"
                    ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                ٢٥ خولەک (تەرکیز)
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRunning(false);
                  setMode("work");
                  setSecondsLeft(900);
                }}
                className={`px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer ${
                  secondsLeft === 900
                    ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                ١٥ خولەک (خێرا)
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRunning(false);
                  setMode("break");
                  setSecondsLeft(300);
                }}
                className={`px-2.5 py-1 rounded-lg border font-bold transition cursor-pointer ${
                  secondsLeft === 300 && mode === "break"
                    ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                ٥ خولەک (پشوو)
              </button>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={toggleTimer}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs px-6 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>وەستاندن</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>دەستپێکردن</span>
                  </>
                )}
              </button>

              <button
                onClick={resetTimer}
                className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-sans font-bold text-xs px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer"
                title="سفرکردنەوەی کاتژمێر"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Feature 1: Focus Status Chips ── */}
          <div className="flex flex-wrap gap-2 justify-center" dir="rtl">
            {FOCUS_STATUS_CHIPS.map((chip) => (
              <button
                key={chip.key}
                onClick={() => setFocusStatus(chip.key)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer min-h-[36px] transition-all ${
                  focusStatus === chip.key
                    ? chip.activeClass
                    : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* ── Feature 2: Custom Study Goal ── */}
          <div className="bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 rounded-2xl p-4 space-y-2" dir="rtl">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                ئامانجی خوێندنت بنووسە
              </span>
              {customGoal && !isEditingGoal && (
                <button
                  onClick={() => {
                    setGoalInput(customGoal);
                    setIsEditingGoal(true);
                  }}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  دەستکاری
                </button>
              )}
            </div>

            {isEditingGoal || !customGoal ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && goalInput.trim()) {
                      setCustomGoal(goalInput.trim());
                      setIsEditingGoal(false);
                      setGoalInput("");
                    }
                  }}
                  placeholder="وەک: پێوەری pH فێر دەبم..."
                  dir="rtl"
                  className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 min-h-[36px]"
                />
                <button
                  onClick={() => {
                    if (goalInput.trim()) {
                      setCustomGoal(goalInput.trim());
                      setIsEditingGoal(false);
                      setGoalInput("");
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer min-h-[36px] transition-colors"
                >
                  پاشەکەوت
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/60 rounded-xl px-3 py-2 text-xs font-semibold text-indigo-800 dark:text-indigo-300">
                🎯 {customGoal}
              </div>
            )}
          </div>

          {/* Ambient Soundscape Sliders */}
          <div className="space-y-3 bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Volume2
                  className={`w-4 h-4 ${
                    isAmbientPlaying ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"
                  }`}
                />
                <h3 className="font-sans font-bold text-xs text-slate-800 dark:text-slate-200">
                  دەنگی ژینگە و تەرکیز (Ambient Soundscape Mixer)
                </h3>
                {isAmbientPlaying && (
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    دەنگ چالاکە
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={toggleAmbientSoundscape}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                  isAmbientPlaying
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-200 dark:ring-emerald-900"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                {isAmbientPlaying ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>بێدەنگکردن / وەستاندن</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>دەستپێکردنی دەنگ 🔊</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              دەنگی ڕاستەوخۆی سوودبەخش بۆ تەرکیز بە تەکنەلۆژیای Web Audio بەبێ پێویستی بە دابەزاندنی فایل
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {(
                [
                  { key: "rain" as const, label: "بارانی دارستان 🌧️", val: ambientSounds.rain },
                  { key: "library" as const, label: "کتێبخانەی بێدەنگ 📚", val: ambientSounds.library },
                  { key: "waves" as const, label: "شەپۆلی ئارامی دەریا 🌊", val: ambientSounds.waves },
                  { key: "cafe" as const, label: "کافێتریای فێربوون ☕", val: ambientSounds.cafe },
                ]
              ).map((sound) => (
                <div key={sound.key} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-sans text-slate-600 dark:text-slate-300">
                    <span>{sound.label}</span>
                    <span className="font-mono">{sound.val}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sound.val}
                    onChange={(e) =>
                      handleVolumeChange(sound.key, parseInt(e.target.value, 10))
                    }
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Active Peers & Cheer Reactions */}
          <div className="space-y-3">
            <h3 className="font-sans font-bold text-xs text-slate-800 dark:text-slate-200">
              هاوپۆلە چالاکەکانی ناو ئەم ژوورە:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {peers.map((peer, pIdx) => (
                <div
                  key={pIdx}
                  className="p-3 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col gap-2 text-xs font-sans"
                >
                  {/* Peer header row */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 dark:text-white block">{peer.name}</span>
                      {/* ── Feature 4: subject + chat link ── */}
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 flex-wrap">
                        {peer.topic}
                        <button
                          onClick={() => {
                            const win = window as unknown as { onNavigateToChat?: (t: string) => void };
                            if (typeof win.onNavigateToChat === "function") {
                              win.onNavigateToChat(peer.topic);
                            } else {
                              console.log("Navigate to chat for:", peer.topic);
                            }
                          }}
                          className="inline-flex items-center gap-0.5 text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          خوێندن لەگەڵ زانا
                        </button>
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                      {peer.status}
                    </span>
                  </div>

                  {/* ── Feature 3: Per-peer cheer buttons ── */}
                  <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100 dark:border-slate-700 relative">
                    {CHEER_TEMPLATES.map((tmpl, tIdx) => (
                      <button
                        key={tIdx}
                        onClick={() => {
                          playSuccess();
                          setCheerFeedback(`${tIdx}-${pIdx}`);
                          setTimeout(() => setCheerFeedback(null), 2000);
                        }}
                        className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        title={tmpl.text}
                      >
                        {tmpl.emoji}
                      </button>
                    ))}
                    {/* Mini toast anchored to this peer card */}
                    {cheerFeedback !== null &&
                      cheerFeedback.endsWith(`-${pIdx}`) && (
                        <span className="absolute left-0 -bottom-6 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-lg animate-in fade-in z-10 whitespace-nowrap">
                          ✅ هاندانەکەت نێردرا!
                        </span>
                      )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Cheer Buttons (global) */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs text-slate-400 font-sans">ناردنی هاندان:</span>
              {[
                { emoji: "👏", text: "دەستت خۆش بێت!" },
                { emoji: "🔥", text: "ئافەرم، بەردەوام بە!" },
                { emoji: "✨", text: "خوێندنی پڕ پیت!" },
                { emoji: "💪", text: "بەهێز بە لەم بەندەدا!" },
              ].map((c, cIdx) => (
                <button
                  key={cIdx}
                  onClick={() => handleSendCheer(c.emoji, c.text)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-700 dark:hover:text-indigo-300 text-slate-700 dark:text-slate-300 text-xs font-sans font-medium transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <span>{c.emoji} {c.text}</span>
                </button>
              ))}
            </div>

            {cheerNotice && (
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800 text-center animate-in fade-in">
                {cheerNotice}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudyRooms;
