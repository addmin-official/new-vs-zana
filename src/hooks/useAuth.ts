import { useEffect, useCallback, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "../services/firebase.ts";
import {
  loginWithEmail as rawLoginWithEmail,
  loginWithGoogle as rawLoginWithGoogle,
  loginAnonymously as rawLoginAnonymously,
  logoutUser as rawLogoutUser,
  getErrorMessage,
  getCurrentUser,
} from "../services/authService.ts";
import { useAuthStore } from "../store/authStore.ts";
import { checkUserExists, createUserDocumentIfMissing } from "../auth/userProfileService.ts";
import { getSessionRecovery } from "../auth/sessionRecovery.ts";
import { StudentProfileDraft } from "../features/student/studentTypes.ts";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isNewUser = useAuthStore((s) => s.isNewUser);
  const authError = useAuthStore((s) => s.authError);
  const sessionRecoveryNotice = useAuthStore((s) => s.sessionRecoveryNotice);

  const [authTimedOut, setAuthTimedOut] = useState(false);

  // Initialize and listen to Firebase auth state persistence
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      if (useAuthStore.getState().isLoading) {
        setAuthTimedOut(true);
        useAuthStore.getState().setIsLoading(false);
      }
    }, 10000);

    const auth = getFirebaseAuth();
    if (!auth || !isFirebaseConfigured()) {
      const cur = getCurrentUser();
      useAuthStore.getState().setUser(cur);
      useAuthStore.getState().setIsLoading(false);
      if (timer) clearTimeout(timer);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      setAuthTimedOut(false);

      if (firebaseUser) {
        useAuthStore.getState().setUser(firebaseUser);

        // Check if returning student profile exists in Firestore / LocalStorage
        try {
          const check = await checkUserExists(firebaseUser.uid);
          if (check.exists && check.profile) {
            useAuthStore.getState().setProfile(check.profile);
            useAuthStore.getState().setIsNewUser(false);
            const recovery = getSessionRecovery();
            if (recovery) {
              useAuthStore.getState().setSessionRecoveryNotice(recovery);
            }
          } else {
            useAuthStore.getState().setIsNewUser(true);
          }
        } catch (e) {
          console.warn("Failed checking user existence on auth change:", e);
        }
      } else {
        useAuthStore.getState().setUser(null);
        useAuthStore.getState().setIsNewUser(false);
      }

      useAuthStore.getState().setIsLoading(false);
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsub();
    };
  }, []);

  const loginWithEmail = useCallback(async (email: string, pass: string) => {
    useAuthStore.getState().setIsLoading(true);
    useAuthStore.getState().setError(null);
    try {
      const loggedUser = await rawLoginWithEmail(email, pass);
      const check = await checkUserExists(loggedUser.uid);
      if (check.exists && check.profile) {
        useAuthStore.getState().setProfile(check.profile);
        useAuthStore.getState().setIsNewUser(false);
      } else {
        useAuthStore.getState().setIsNewUser(true);
      }
      const recovery = getSessionRecovery();
      if (recovery) {
        useAuthStore.getState().setSessionRecoveryNotice(recovery);
      }
      return loggedUser;
    } catch (err) {
      const msg = getErrorMessage(err);
      useAuthStore.getState().setError(msg);
      throw err;
    } finally {
      useAuthStore.getState().setIsLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    useAuthStore.getState().setIsLoading(true);
    useAuthStore.getState().setError(null);
    try {
      const loggedUser = await rawLoginWithGoogle();
      const check = await checkUserExists(loggedUser.uid);
      if (check.exists && check.profile) {
        useAuthStore.getState().setProfile(check.profile);
        useAuthStore.getState().setIsNewUser(false);
      } else {
        useAuthStore.getState().setIsNewUser(true);
      }
      const recovery = getSessionRecovery();
      if (recovery) {
        useAuthStore.getState().setSessionRecoveryNotice(recovery);
      }
      return loggedUser;
    } catch (err) {
      const msg = getErrorMessage(err);
      useAuthStore.getState().setError(msg);
      throw err;
    } finally {
      useAuthStore.getState().setIsLoading(false);
    }
  }, []);

  const loginAsGuest = useCallback(async () => {
    useAuthStore.getState().setIsLoading(true);
    useAuthStore.getState().setError(null);
    try {
      const guestUser = await rawLoginAnonymously();
      return guestUser;
    } catch (err) {
      const msg = getErrorMessage(err);
      useAuthStore.getState().setError(msg);
      throw err;
    } finally {
      useAuthStore.getState().setIsLoading(false);
    }
  }, []);

  const completeRegistration = useCallback(
    async (
      uid: string,
      email: string | null,
      draft: StudentProfileDraft & { school?: string }
    ) => {
      useAuthStore.getState().setIsLoading(true);
      try {
        const created = await createUserDocumentIfMissing(uid, email, draft);
        useAuthStore.getState().setProfile(created);
        useAuthStore.getState().setIsNewUser(false);
        return created;
      } catch (err) {
        const msg = getErrorMessage(err);
        useAuthStore.getState().setError(msg);
        throw err;
      } finally {
        useAuthStore.getState().setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await rawLogoutUser();
    useAuthStore.getState().setUser(null);
    useAuthStore.getState().setError(null);
    useAuthStore.getState().dismissRecoveryNotice();
  }, []);

  const dismissRecoveryNotice = useCallback(() => {
    useAuthStore.getState().dismissRecoveryNotice();
  }, []);

  const retryAuth = useCallback(() => {
    setAuthTimedOut(false);
    useAuthStore.getState().setIsLoading(true);
    const auth = getFirebaseAuth();
    if (auth) {
      const cur = auth.currentUser;
      useAuthStore.getState().setUser(cur);
      useAuthStore.getState().setIsLoading(false);
    } else {
      useAuthStore.getState().setIsLoading(false);
    }
  }, []);

  return {
    user,
    profile,
    isAuthenticated,
    isLoading,
    isNewUser,
    authError,
    authTimedOut,
    sessionRecoveryNotice,
    loginWithEmail,
    loginWithGoogle,
    loginAsGuest,
    completeRegistration,
    logout,
    dismissRecoveryNotice,
    retryAuth,
  };
}

export default useAuth;
