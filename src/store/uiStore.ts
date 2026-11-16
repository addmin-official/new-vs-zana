import { useSyncExternalStore } from "react";

export interface UiStoreState {
  isSidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  unreadCounts: Record<string, number>;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  setUnreadCount: (key: string, count: number) => void;
  clearUnreadCount: (key: string) => void;
}

let currentUiState: UiStoreState = {
  isSidebarCollapsed: false,
  mobileNavOpen: false,
  unreadCounts: {},

  toggleSidebar: () => {
    setUiState({ isSidebarCollapsed: !currentUiState.isSidebarCollapsed });
  },
  setSidebarCollapsed: (isSidebarCollapsed: boolean) => {
    setUiState({ isSidebarCollapsed });
  },
  setMobileNavOpen: (mobileNavOpen: boolean) => {
    setUiState({ mobileNavOpen });
  },
  setUnreadCount: (key: string, count: number) => {
    setUiState({
      unreadCounts: { ...currentUiState.unreadCounts, [key]: count },
    });
  },
  clearUnreadCount: (key: string) => {
    const updated = { ...currentUiState.unreadCounts };
    delete updated[key];
    setUiState({ unreadCounts: updated });
  },
};

const listeners = new Set<() => void>();

function setUiState(partial: Partial<UiStoreState>) {
  currentUiState = { ...currentUiState, ...partial };
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.warn("UiStore listener error:", e);
    }
  });
}

export function useUiStore<T>(selector?: (state: UiStoreState) => T): T {
  const state = useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => currentUiState,
    () => currentUiState
  );
  return selector ? selector(state) : (state as unknown as T);
}

useUiStore.getState = () => currentUiState;
useUiStore.setState = setUiState;

export default useUiStore;
