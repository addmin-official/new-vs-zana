import React, { useEffect } from "react";

export interface ProtectedStudentRouteProps {
  authLoading: boolean;
  isAuthenticated: boolean;
  loadingFallback: React.ReactNode;
  onUnauthenticated: () => void;
  children: React.ReactNode;
}

/**
 * Centralized route guard for all authenticated student screens.
 * Never renders protected student UI while auth is initializing or unauthenticated.
 */
export function ProtectedStudentRoute({
  authLoading,
  isAuthenticated,
  loadingFallback,
  onUnauthenticated,
  children,
}: ProtectedStudentRouteProps) {
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      onUnauthenticated();
    }
  }, [authLoading, isAuthenticated, onUnauthenticated]);

  if (authLoading) {
    return <>{loadingFallback}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
