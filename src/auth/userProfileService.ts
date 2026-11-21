/**
 * User Profile & Existing User Detection Service
 * Prevents re-registration by detecting returning users from Firestore and local cache
 */

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirestoreDb } from "../services/firebase.ts";
import { StudentProfile, StudentProfileDraft, VerifiedIdentity } from "../features/student/studentTypes.ts";
import {
  saveStudentProfile,
  getStudentProfile,
  createVerifiedStudentProfile,
  parseServerProfileDocument,
} from "../features/student/studentStorage.ts";
import { getValidatedGrade, getValidatedStream, sanitizeStudentName } from "../features/student/studentDefaults.ts";
import { notificationEngine } from "../notifications/notificationEngine.ts";
import { initializeTrial } from "./trialService.ts";

export interface UserCheckResult {
  exists: boolean;
  isNewUser: boolean;
  profile: StudentProfile | null;
}

/**
 * Checks whether a student profile already exists in Firestore (users/{uid} or students/{uid})
 * or local storage, preventing duplicate registration loops.
 */
export async function checkUserExists(uid: string): Promise<UserCheckResult> {
  const db = getFirestoreDb();

  if (db && uid) {
    try {
      // 1. Check primary users/{uid} collection
      const userDocRef = doc(db, "users", uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const raw = userSnap.data();
        const profileData = raw.profile || raw;
        const draft = parseServerProfileDocument(profileData);
        const identity: VerifiedIdentity = {
          verifiedUid: uid,
          isAnonymous: false,
          email: raw.email || raw.profile?.email,
        };
        const loadedProfile = createVerifiedStudentProfile(identity, draft);
        loadedProfile.school = profileData.school;
        loadedProfile.onboardingCompleted = true;
        saveStudentProfile(loadedProfile);
        return { exists: true, isNewUser: false, profile: loadedProfile };
      }

      // 2. Fallback check legacy students/{uid} collection for backwards compatibility
      const studentDocRef = doc(db, "students", uid);
      const studentSnap = await getDoc(studentDocRef);

      if (studentSnap.exists()) {
        const raw = studentSnap.data();
        const draft = parseServerProfileDocument(raw);
        const identity: VerifiedIdentity = {
          verifiedUid: uid,
          isAnonymous: false,
          email: raw.email,
        };
        const loadedProfile = createVerifiedStudentProfile(identity, draft);
        loadedProfile.school = raw.school;
        loadedProfile.onboardingCompleted = true;
        saveStudentProfile(loadedProfile);

        // Synchronize legacy document into users/{uid}
        void setDoc(userDocRef, {
          profile: {
            name: loadedProfile.name,
            grade: loadedProfile.grade,
            stream: loadedProfile.stream,
            school: loadedProfile.school || "",
            language: "ckb",
            email: raw.email || "",
          },
          settings: {
            theme: "dark",
            notifications: true,
            language: "ckb",
          },
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        return { exists: true, isNewUser: false, profile: loadedProfile };
      }
    } catch (err) {
      console.warn("Firestore checkUserExists error, checking local store:", err);
    }
  }

  // 3. Check local storage if device is offline or in local environment
  const local = getStudentProfile();
  if (local && local.onboardingCompleted && (local.id === uid || (!local.id.includes("default-guest")))) {
    return { exists: true, isNewUser: false, profile: local };
  }

  return { exists: false, isNewUser: true, profile: null };
}

/**
 * Creates a student profile in Firestore upon one-time registration completion.
 * NEVER overwrites an already existing document.
 */
export async function createUserDocumentIfMissing(
  uid: string,
  email: string | null,
  draft: StudentProfileDraft & { school?: string }
): Promise<StudentProfile> {
  const check = await checkUserExists(uid);
  if (check.exists && check.profile) {
    return check.profile;
  }

  const validatedGrade = getValidatedGrade(draft.grade);
  const validatedStream = getValidatedStream(draft.stream);
  const sanitizedName = sanitizeStudentName(draft.name);

  const identity: VerifiedIdentity = {
    verifiedUid: uid,
    isAnonymous: false,
    email: email || undefined,
  };

  const newProfile = createVerifiedStudentProfile(identity, {
    name: sanitizedName,
    grade: validatedGrade,
    stream: validatedStream,
    activeSubject: draft.activeSubject || "chemistry",
    level: draft.level || "intermediate",
  });
  newProfile.school = draft.school?.trim() || "";
  newProfile.onboardingCompleted = true;

  saveStudentProfile(newProfile);

  const db = getFirestoreDb();
  if (db && uid) {
    try {
      const userRef = doc(db, "users", uid);
      const studentRef = doc(db, "students", uid);

      const isPhoneIdentifier = Boolean(email && !email.includes('@'));
      const phoneNumber = isPhoneIdentifier ? (email || "") : "";
      const userEmail = isPhoneIdentifier ? "" : (email || "");

      const payload = {
        id: uid,
        uid,
        role: "student",
        name: sanitizedName,
        displayName: sanitizedName,
        email: userEmail,
        phoneNumber: phoneNumber || undefined,
        grade: validatedGrade,
        stream: validatedStream,
        school: newProfile.school || "",
        lastActive: serverTimestamp(),
        createdAt: serverTimestamp(),
        registeredAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        profile: {
          name: sanitizedName,
          grade: validatedGrade,
          stream: validatedStream,
          school: newProfile.school || "",
          language: "ckb",
          email: userEmail,
          phoneNumber: phoneNumber || undefined,
        },
        settings: {
          theme: "dark",
          notifications: true,
          language: "ckb",
        },
      };

      // Write to both users/{uid} and students/{uid}
      await Promise.all([
        setDoc(userRef, payload, { merge: true }),
        setDoc(studentRef, {
          id: uid,
          name: sanitizedName,
          email: userEmail,
          phoneNumber: phoneNumber || undefined,
          grade: validatedGrade,
          stream: validatedStream,
          activeSubject: newProfile.activeSubject,
          school: newProfile.school || "",
          onboardingCompleted: true,
          createdAt: serverTimestamp(),
          registeredAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true }),
      ]);
    } catch (err) {
      console.warn("Could not save user profile to Firestore (offline):", err);
    }
  }

  // Send welcome notification & initialize trial
  if (uid) {
    const studentName = newProfile.name || 'قوتابی';

    // Welcome notification with onboarding tips
    await notificationEngine.addNotification(uid, {
      type: 'study_reminder',
      title: `بەخێربێیت بۆ زانا، ${studentName}! 🎉`,
      message: `٣ ڕۆژی تاقیکردنەوەی خۆڕایت هەیە. ئێستا دەتوانیت:`
        + `\n• پرسیاری دەربارەی وانەکانت بکەی`
        + `\n• تاقیکردنەوەی ئەدەپتیڤ بکەی`
        + `\n• پلانی خوێندنت دروست بکەی`,
      icon: '🎉',
      actionUrl: '/home',
      actionLabel: 'دەستپێبکە',
      force: true,
    }).catch(() => {});

    // Initialize trial period
    await initializeTrial(uid, email || '');
  }

  return newProfile;
}
