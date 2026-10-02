import { Volume2, VolumeX } from "lucide-react";
import { useSoundEffects } from "../hooks/useSoundEffects.ts";

interface SoundToggleProps {
  className?: string;
}

export function SoundToggle({ className = "" }: SoundToggleProps) {
  const { soundEnabled, toggleSound, playSuccess } = useSoundEffects();

  const handleToggle = () => {
    const nextState = toggleSound();
    if (nextState) {
      // Play a quick subtle confirmation tone when unmuted
      setTimeout(() => playSuccess(), 50);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-2xs ${className}`}
      aria-label={soundEnabled ? "بێدەنگکردنی دەنگی کارلێک" : "کاراکردنی دەنگی کارلێک"}
      title={
        soundEnabled
          ? "دەنگی فێرکاری کارایە (کلیک بکە بۆ بێدەنگکردن)"
          : "دەنگی فێرکاری بێدەنگە (کلیک بکە بۆ کاراکردن)"
      }
    >
      {soundEnabled ? (
        <Volume2 className="w-4 h-4 text-blue-600 dark:text-blue-400 transition-transform active:scale-95" />
      ) : (
        <VolumeX className="w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform active:scale-95" />
      )}
    </button>
  );
}
