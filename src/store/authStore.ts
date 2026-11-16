import { useSyncExternalStore } from "react";
import { User } from "firebase/auth";
import { StudentProfile } from "../features/student/studentTypes.ts";
import { SessionRecoveryData, getSessionRecovery, clearSessionRecovery } from "../auth/sessionRecovery.ts";
import { getCurrentUser, logoutUser } from "../services/authService.ts";
import { getStudentProfile } from "../features/student/studentStorage.ts";

export interface AuthState {
  user: User | null;
  profile: StudentProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isNewUser: boolean;
  authError: string | null;
  sessionRecoveryNotice: SessionRecoveryData | null;

  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: StudentProfile | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setIsNewUser: (isNew: boolean) => void;
  setSessionRecoveryNotice: (notice: SessionRecoveryData | null) => void;
  dismissRecoveryNotice: () => void;
  logout: () => Promise<void>;
}

let currentAuthState: AuthState = {
  user: getCurrentUser(),
  profile: getStudentProfile(),
  isAuthenticated: Boolean(getCurrentUser()),
  isLoading: true,
  isNewUser: false,
  authError: null,
  sessionRecoveryNotice: getSessionRecovery(),

  setUser: (user) => {
    setAuthState({
      user,
      isAuthenticated: Boolean(user),
    });
  },

  setProfile: (profile) => {
    setAuthState({
      profile,
    });
  },

  setIsLoading: (isLoading) => {
    setAuthState({ isLoading });
  },

  setError: (authError) => {
    setAuthState({ authError });
  },

  setIsNewUser: (isNewUser) => {
    setAuthState({ isNewUser });
  },

  setSessionRecoveryNotice: (sessionRecoveryNotice) => {
    setAuthState({ sessionRecoveryNotice });
  },

  dismissRecoveryNotice: () => {
    clearSessionRecovery();
    setAuthState({ sessionRecoveryNotice: null });
  },

  logout: async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn("Logout error:", err);
    }
    setAuthState({
      user: null,
      isAuthenticated: false,
      authError: null,
      sessionRecoveryNotice: null,
    });
  },
};

const authListeners = new Set<() => void>();

function setAuthState(partial: Partial<AuthState>) {
  currentAuthState = { ...currentAuthState, ...partial };
  authListeners.forEach((fn) => fn());
}

export function useAuthStore<T>(selector?: (state: AuthState) => T): T {
  const state = useSyncExternalStore(
    (callback) => {
      authListeners.add(callback);
      return () => authListeners.delete(callback);
    },
    () => currentAuthState,
    () => currentAuthState
  );
  return selector ? selector(state) : (state as unknown as T);
}

useAuthStore.getState = () => currentAuthState;
useAuthStore.setState = setAuthState;

export default useAuthStore;
