import { useCallback, useSyncExternalStore } from "react";
import { ToolbarPosition } from "./types.ts";

export const SMART_BOARD_ENABLED_KEY = "zana_smart_board_enabled";

const listeners = new Set<() => void>();
let cachedEnabled: boolean | null = null;
let storageListenerAttached = false;

function readEnabledFromStorage(): boolean {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem(SMART_BOARD_ENABLED_KEY) === "true";
  } catch {
    return false;
  }
}

function attachStorageListener(): void {
  if (storageListenerAttached || typeof window === "undefined") return;
  storageListenerAttached = true;
  window.addEventListener("storage", (event) => {
    if (event.key === null || event.key === SMART_BOARD_ENABLED_KEY) {
      cachedEnabled = readEnabledFromStorage();
      listeners.forEach((listener) => listener());
    }
  });
}

function subscribe(listener: () => void): () => void {
  attachStorageListener();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSmartBoardEnabled(): boolean {
  if (cachedEnabled === null) {
    cachedEnabled = readEnabledFromStorage();
  }
  return cachedEnabled;
}

export function setSmartBoardEnabled(enabled: boolean): void {
  const next = Boolean(enabled);
  cachedEnabled = next;
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    try {
      window.localStorage.setItem(SMART_BOARD_ENABLED_KEY, next ? "true" : "false");
    } catch {
      // Ignore storage quota or private-mode failures gracefully.
    }
  }
  listeners.forEach((listener) => listener());
}

/**
 * Resets in-memory snapshot cache (used primarily in unit tests after localStorage.clear()).
 */
export function syncSmartBoardPreferenceFromStorage(): void {
  cachedEnabled = readEnabledFromStorage();
  listeners.forEach((listener) => listener());
}

export function useSmartBoardPreference(): readonly [boolean, (enabled: boolean) => void] {
  const enabled = useSyncExternalStore(
    subscribe,
    getSmartBoardEnabled,
    () => false
  );

  const setEnabled = useCallback((next: boolean) => {
    setSmartBoardEnabled(next);
  }, []);

  return [enabled, setEnabled] as const;
}

/**
 * Clamps a floating element's top-left viewport coordinates so it never leaves
 * the visible ZANA window regardless of RTL/LTR or viewport resize.
 */
export function clampPositionToViewport(
  position: ToolbarPosition,
  elementSize: { width: number; height: number },
  viewport: { width: number; height: number },
  margin = 12
): ToolbarPosition {
  const safeWidth = Math.max(0, viewport.width);
  const safeHeight = Math.max(0, viewport.height);
  const maxX = Math.max(margin, safeWidth - elementSize.width - margin);
  const maxY = Math.max(margin, safeHeight - elementSize.height - margin);

  return {
    x: Math.min(Math.max(margin, position.x), maxX),
    y: Math.min(Math.max(margin, position.y), maxY),
  };
}
