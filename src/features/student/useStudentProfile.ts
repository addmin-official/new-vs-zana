import { useState, useEffect } from "react";
import { StudentProfile, StudentProfileDraft, StudentGrade, AcademicStream, SubjectKey, StudentLevel, VerifiedIdentity } from "./studentTypes.ts";
import { getStudentProfile, deleteStudentProfile, createStudentProfile, createVerifiedStudentProfile, updateStudentProfile, saveStudentProfile, parseServerProfileDocument, syncStudentProgressToFirestore } from "./studentStorage.ts";
import { getValidatedGrade, getValidatedStream, getValidatedSubject, getValidatedLevel, sanitizeStudentName } from "./studentDefaults.ts";
import { ZanaStorage } from "../../services/storage.ts";
import { getFirestoreDb, getFirebaseAuth, isFirebaseConfigured } from "../../services/firebase.ts";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useAppStore } from "../../store/appStore.ts";
import { PracticeStorage } from "../practice/practiceStorage.ts";

export function useStudentProfile() {
  const [isOfflineFallback, setIsOfflineFallback] = useState<boolean>(
    () => !isFirebaseConfigured() || !getFirebaseAuth() || !getFirestoreDb()
  );
  const [authError, setAuthError] = useState<string | null>(null);

  const [profile, setProfileState] = useState<StudentProfile>(() => {
    const saved = getStudentProfile();
    if (saved) return saved;

    return {
      id: "default-guest",
      name: "",
      grade: "12",
      stream: "scientific",
      activeSubject: "chemistry",
      level: "intermediate",
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authoritative: false,
      source: "guest-local",
    };
  });

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      return;
    }

    const auth = getFirebaseAuth();
    const db = getFirestoreDb();

    if (!auth || !db) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsOfflineFallback(false);
        setAuthError(null);

        // Anonymous users are NEVER granted server authority
        if (user.isAnonymous) {
          setProfileState((prev) => ({
            ...prev,
            id: user.uid,
            authoritative: false,
            source: "guest-local",
          }));
          return;
        }

        const docRef = doc(db, "students", user.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const rawData = docSnap.data();
            const serverDraft = parseServerProfileDocument(rawData);
            const identity: VerifiedIdentity = {
              verifiedUid: user.uid,
              isAnonymous: false,
              email: user.email,
            };
            const cloudProfile = createVerifiedStudentProfile(identity, serverDraft);

            // Extract Firestore progress data
            const cloudScore = typeof rawData.totalScore === "number" ? rawData.totalScore : (typeof rawData.xp === "number" ? rawData.xp : 0);
            const cloudStreak = typeof rawData.streak === "number" ? rawData.streak : 1;
            const cloudLessons = typeof rawData.completedLessons === "number" ? rawData.completedLessons : 0;
            const cloudMinutes = typeof rawData.todayStudyMinutes === "number" ? rawData.todayStudyMinutes : 0;
            const cloudCompletion = typeof rawData.completionPercentage === "number" ? rawData.completionPercentage : 0;
            const cloudBadges: string[] = Array.isArray(rawData.unlockedBadgeIds) ? rawData.unlockedBadgeIds : [];
            const cloudModules: string[] = Array.isArray(rawData.completedModuleIds) ? rawData.completedModuleIds : [];

            // Merge with local progress (take highest scores so no study progress is lost)
            const currentLocalStore = useAppStore.getState().userProgress;
            const localPractice = PracticeStorage.getProgress();
            const mergedTotalScore = Math.max(cloudScore, currentLocalStore.totalScore || 0, localPractice.totalXp || 0);
            const mergedStreak = Math.max(cloudStreak, currentLocalStore.streak || 1, localPractice.currentStreak || 1);
            const mergedLessons = Math.max(cloudLessons, currentLocalStore.lessonsCompleted || 0, localPractice.completedModuleIds?.length || 0);
            const mergedBadges = Array.from(new Set([...cloudBadges, ...(localPractice.unlockedBadgeIds || [])]));
            const mergedModules = Array.from(new Set([...cloudModules, ...(localPractice.completedModuleIds || [])]));

            cloudProfile.totalScore = mergedTotalScore;
            cloudProfile.streak = mergedStreak;
            cloudProfile.completedLessons = mergedLessons;
            cloudProfile.todayStudyMinutes = cloudMinutes;
            cloudProfile.completionPercentage = cloudCompletion;
            cloudProfile.unlockedBadgeIds = mergedBadges;
            cloudProfile.completedModuleIds = mergedModules;

            saveStudentProfile(cloudProfile);
            setProfileState(cloudProfile);

            // Synchronize directly into global app store
            useAppStore.setState({
              userProgress: {
                streak: mergedStreak,
                lessonsCompleted: mergedLessons,
                totalScore: mergedTotalScore,
              },
              user: {
                ...useAppStore.getState().user,
                id: user.uid,
                name: cloudProfile.name,
                email: user.email || "",
                grade: cloudProfile.grade,
                stream: cloudProfile.stream,
                activeSubject: cloudProfile.activeSubject,
                streakDays: mergedStreak,
                completedLessons: mergedLessons,
                totalScore: mergedTotalScore,
              },
            });

            // Synchronize PracticeStorage
            PracticeStorage.saveProgress({
              totalXp: mergedTotalScore,
              completedModuleIds: mergedModules,
              unlockedBadgeIds: mergedBadges.length > 0 ? mergedBadges : ["badge_math_solver"],
              currentStreak: mergedStreak,
              lastPracticeDate: typeof rawData.lastStudyDate === "string" ? rawData.lastStudyDate : new Date().toISOString().split("T")[0],
              moduleScores: rawData.moduleScores || {},
            });

            // If local device had higher progress, push merged authoritative data back to Firestore
            if (mergedTotalScore > cloudScore || mergedLessons > cloudLessons || mergedStreak > cloudStreak) {
              void syncStudentProgressToFirestore({
                totalScore: mergedTotalScore,
                streak: mergedStreak,
                completedLessons: mergedLessons,
                unlockedBadgeIds: mergedBadges,
                completedModuleIds: mergedModules,
              }, user.uid);
            }
          } else {
            const saved = getStudentProfile();
            const currentStore = useAppStore.getState().userProgress;
            const practice = PracticeStorage.getProgress();
            const initScore = Math.max(currentStore.totalScore || 0, practice.totalXp || 0);
            const initStreak = Math.max(currentStore.streak || 1, practice.currentStreak || 1);
            const initLessons = Math.max(currentStore.lessonsCompleted || 0, practice.completedModuleIds?.length || 0);

            if (saved && saved.onboardingCompleted) {
              const identity: VerifiedIdentity = {
                verifiedUid: user.uid,
                isAnonymous: false,
                email: user.email,
              };
              const draftToUpload: StudentProfileDraft = {
                name: saved.name,
                grade: saved.grade,
                stream: saved.stream,
                activeSubject: saved.activeSubject,
                level: saved.level,
              };
              // Write full profile and initial progress to Firestore
              await setDoc(docRef, {
                id: user.uid,
                name: draftToUpload.name,
                grade: draftToUpload.grade,
                stream: draftToUpload.stream,
                activeSubject: draftToUpload.activeSubject,
                level: draftToUpload.level,
                totalScore: initScore,
                streak: initStreak,
                completedLessons: initLessons,
                todayStudyMinutes: 0,
                completionPercentage: 0,
                unlockedBadgeIds: practice.unlockedBadgeIds || ["badge_math_solver"],
                completedModuleIds: practice.completedModuleIds || [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
              // Grant authority
              const verifiedProfile = createVerifiedStudentProfile(identity, draftToUpload);
              verifiedProfile.totalScore = initScore;
              verifiedProfile.streak = initStreak;
              verifiedProfile.completedLessons = initLessons;
              saveStudentProfile(verifiedProfile);
              setProfileState(verifiedProfile);
            }
          }
        } catch (e) {
          console.warn("Firestore student profile sync unavailable, running in guest mode:", e);
          setIsOfflineFallback(true);
        }
      } else {
        // Unauthenticated / logged out state
        const saved = getStudentProfile();
        if (saved) {
          setProfileState(saved);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const isOnboarded = profile.onboardingCompleted;

  const createProfile = (draft: StudentProfileDraft): StudentProfile => {
    const validatedGrade = getValidatedGrade(draft.grade);
    let stream = draft.stream;

    if (validatedGrade === "9") {
      stream = "general";
    } else {
      if (stream !== "scientific" && stream !== "literary") {
        throw new TypeError(`Invalid academic stream "${stream}" for Grade ${validatedGrade}: stream must be either "scientific" or "literary"`);
      }
    }

    const validatedDraft: StudentProfileDraft = {
      name: sanitizeStudentName(draft.name),
      grade: validatedGrade,
      stream,
      activeSubject: getValidatedSubject(draft.activeSubject),
      level: getValidatedLevel(draft.level),
    };

    const newProfile = createStudentProfile(validatedDraft);
    setProfileState(newProfile);
    return newProfile;
  };

  interface LegacyUpdateFields {
    subject?: string;
    onboarded?: boolean;
  }

  const updateProfile = (updates: Partial<StudentProfileDraft | StudentProfile> & LegacyUpdateFields) => {
    setProfileState((prev) => {
      const mappedUpdates: Partial<StudentProfileDraft> = {};
      if (updates.name !== undefined) mappedUpdates.name = sanitizeStudentName(updates.name);

      let nextGrade = prev.grade;
      // Grade is locked once onboarding is completed
      if (updates.grade !== undefined && !prev.onboardingCompleted) {
        nextGrade = getValidatedGrade(updates.grade);
        mappedUpdates.grade = nextGrade;
      }

      // Stream is locked once onboarding is completed
      let stream = prev.stream;
      if (updates.stream !== undefined && !prev.onboardingCompleted) {
        stream = updates.stream;
        if (nextGrade === "9") {
          stream = "general";
        } else {
          if (stream !== "scientific" && stream !== "literary") {
            throw new TypeError(`Invalid academic stream "${stream}" for Grade ${nextGrade}: stream must be either "scientific" or "literary"`);
          }
        }
        mappedUpdates.stream = stream;
      }

      const rawSubject = updates.activeSubject !== undefined ? updates.activeSubject : updates.subject;
      if (rawSubject !== undefined) mappedUpdates.activeSubject = getValidatedSubject(rawSubject);

      const lvl = updates.level !== undefined ? updates.level : undefined;
      if (lvl !== undefined) mappedUpdates.level = getValidatedLevel(lvl);

      const updated = updateStudentProfile(prev, mappedUpdates);
      return updated;
    });
  };

  const deleteProfile = () => {
    deleteStudentProfile();
    const guest: StudentProfile = {
      id: "default-guest",
      name: "",
      grade: "12",
      stream: "scientific",
      activeSubject: "chemistry",
      level: "intermediate",
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authoritative: false,
      source: "guest-local",
    };
    setProfileState(guest);
  };

  const resetProfileOnly = () => {
    deleteStudentProfile();
    const guest: StudentProfile = {
      id: "default-guest",
      name: "",
      grade: "12",
      stream: "scientific",
      activeSubject: "chemistry",
      level: "intermediate",
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authoritative: false,
      source: "guest-local",
    };
    setProfileState(guest);
  };

  const setActiveSubject = (subject: SubjectKey) => {
    updateProfile({ activeSubject: subject });
  };

  const setLevel = (level: StudentLevel) => {
    updateProfile({ level });
  };

  const setGrade = (grade: StudentGrade) => {
    if (!profile.onboardingCompleted) {
      updateProfile({ grade });
    }
  };

  const setStream = (stream: AcademicStream) => {
    if (!profile.onboardingCompleted) {
      updateProfile({ stream });
    }
  };

  const completeOnboarding = (name: string, grade: string, subject: string, level: string, stream?: string) => {
    const validatedGrade = getValidatedGrade(grade);
    const validatedSubject = getValidatedSubject(subject);
    const validatedLevel = getValidatedLevel(level);
    const validatedStream = getValidatedStream(stream);

    const newProfile = createProfile({
      name,
      grade: validatedGrade,
      stream: validatedStream,
      activeSubject: validatedSubject,
      level: validatedLevel,
    });

    ZanaStorage.incrementSessions();
    return newProfile;
  };

  const resetProfile = () => {
    ZanaStorage.clearAllData();
    const guest: StudentProfile = {
      id: "default-guest",
      name: "",
      grade: "12",
      stream: "scientific",
      activeSubject: "chemistry",
      level: "intermediate",
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authoritative: false,
      source: "guest-local",
    };
    setProfileState(guest);
  };

  return {
    profile,
    isOnboarded,
    createProfile,
    updateProfile,
    deleteProfile,
    resetProfileOnly,
    setActiveSubject,
    setLevel,
    setGrade,
    setStream,
    completeOnboarding,
    resetProfile,
    isOfflineFallback,
    authError,
  };
}
