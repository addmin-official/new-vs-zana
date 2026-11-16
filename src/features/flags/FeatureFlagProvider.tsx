import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from "react";
import {
  FEATURE_FLAGS,
  FeatureFlagName,
} from "./flagConfig.ts";
import {
  resolveFeatureFlag,
  subscribeToFirestoreFeatureFlags,
} from "./featureFlags.ts";
import { ComingSoon } from "./ComingSoon.tsx";

export interface FeatureFlagContextValue {
  flags: Record<FeatureFlagName, boolean>;
  isEnabled: (flag: FeatureFlagName) => boolean;
  isLoading: boolean;
}

export const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null);

export interface FeatureFlagProviderProps {
  children: ReactNode;
  userId?: string | null;
  initialOverrides?: Record<string, boolean>;
}

export function FeatureFlagProvider({
  children,
  userId,
  initialOverrides = {},
}: FeatureFlagProviderProps) {
  const [firestoreOverrides, setFirestoreOverrides] = useState<Record<string, boolean>>(initialOverrides);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to real-time changes in system/featureFlags document
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = subscribeToFirestoreFeatureFlags((updatedFlags) => {
      if (!isMounted) return;
      setFirestoreOverrides(updatedFlags);
      setIsLoading(false);
    }, userId);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [userId]);

  // Compute evaluated state for all known flags
  const flags = useMemo(() => {
    const computed = {} as Record<FeatureFlagName, boolean>;
    const flagNames = Object.keys(FEATURE_FLAGS) as FeatureFlagName[];

    flagNames.forEach((name) => {
      computed[name] = resolveFeatureFlag(name, {
        userId,
        firestoreOverrides,
      });
    });

    return computed;
  }, [userId, firestoreOverrides]);

  // Dev tools logging (development only)
  useEffect(() => {
    if (import.meta.env.DEV) {
      const activeCount = Object.values(flags).filter(Boolean).length;
      console.log(
        `%c[ZANA Feature Flags] ${activeCount}/${Object.keys(flags).length} active`,
        "color: #4f46e5; font-weight: bold; padding: 2px 4px; border-radius: 4px;",
        flags
      );
    }
  }, [flags]);

  const contextValue: FeatureFlagContextValue = useMemo(
    () => ({
      flags,
      isEnabled: (flag: FeatureFlagName) => Boolean(flags[flag]),
      isLoading,
    }),
    [flags, isLoading]
  );

  return (
    <FeatureFlagContext.Provider value={contextValue}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlagsContext(): FeatureFlagContextValue {
  const ctx = useContext(FeatureFlagContext);
  if (!ctx) {
    const defaultFlags = Object.keys(FEATURE_FLAGS).reduce((acc, key) => {
      const name = key as FeatureFlagName;
      acc[name] = resolveFeatureFlag(name);
      return acc;
    }, {} as Record<FeatureFlagName, boolean>);

    return {
      flags: defaultFlags,
      isEnabled: (f: FeatureFlagName) => resolveFeatureFlag(f),
      isLoading: false,
    };
  }
  return ctx;
}

export interface FeatureFlagRouteProps {
  flag: FeatureFlagName;
  children: ReactNode;
  fallback?: ReactNode;
  onNavigateHome?: () => void;
}

/**
 * Route protection guard for Phase 2+ features
 * Shows branded ComingSoon component instead of 404 when disabled
 */
export function FeatureFlagRoute({
  flag,
  children,
  fallback,
  onNavigateHome,
}: FeatureFlagRouteProps) {
  const { isEnabled } = useFeatureFlagsContext();
  const allowed = isEnabled(flag);

  if (allowed) {
    return <>{children}</>;
  }

  return (
    <>
      {fallback || (
        <ComingSoon
          featureName={FEATURE_FLAGS[flag]?.description}
          onNavigateHome={onNavigateHome}
        />
      )}
    </>
  );
}

export default FeatureFlagProvider;
