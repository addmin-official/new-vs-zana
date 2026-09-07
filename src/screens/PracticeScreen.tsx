import React, { useState } from "react";
import { StudentProfile } from "../services/storage.ts";
import { PracticeDashboard } from "../features/practice/PracticeDashboard.tsx";
import { PracticeModulePlayer } from "../features/practice/PracticeModulePlayer.tsx";
import { PracticeModule } from "../features/practice/practiceTypes.ts";
import { PRACTICE_MODULES } from "../features/practice/practiceData.ts";

interface PracticeScreenProps {
  profile: StudentProfile;
  onNavigate?: (tab: string) => void;
  initialSubject?: string;
  initialModuleId?: string;
}

export const PracticeScreen: React.FC<PracticeScreenProps> = ({
  profile,
  initialModuleId
}) => {
  const initialModule = initialModuleId
    ? PRACTICE_MODULES.find((m) => m.id === initialModuleId) || null
    : null;

  const [activeModule, setActiveModule] = useState<PracticeModule | null>(initialModule);
  const [, setRefreshTrigger] = useState(0);

  const handleSelectModule = (mod: PracticeModule) => {
    setActiveModule(mod);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleExitModule = () => {
    setActiveModule(null);
    setRefreshTrigger((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProgressUpdated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-start">
      {activeModule ? (
        <PracticeModulePlayer
          module={activeModule}
          onExit={handleExitModule}
          onProgressUpdated={handleProgressUpdated}
        />
      ) : (
        <PracticeDashboard
          studentGrade={profile.grade || "12"}
          onSelectModule={handleSelectModule}
        />
      )}
    </div>
  );
};
