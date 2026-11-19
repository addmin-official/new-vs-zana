/**
 * ZANA Platform - Admin & Student Route Guards
 *
 * Implements strict role verification for client-side routing:
 * - AdminRoute: checks `isAdmin(user)` on mount and every navigation.
 *   If not admin: silently redirects to `/home` (no error message, no admin presence leaked).
 * - StudentRoute: checks authentication.
 *   If not logged in: redirects to `/login`.
 */

import React, { useState, useEffect } from "react";
import { onIdTokenChanged, User } from "firebase/auth";
import { getFirebaseAuth } from "../services/firebase.ts";
import { isAdmin, getMyRole, ADMIN_EMAIL, ROLES } from "./roles.ts";
export { getMyRole, isAdmin, ADMIN_EMAIL, ROLES };

export interface RouteGuardProps {
  children: React.ReactNode;
  fallbackRedirect?: string;
}

/**
 * Admin Route Guard.
 * Silently redirects non-admin users to `/home` without showing error banners or mentioning admin.
 */
export function AdminRoute({
  children,
  fallbackRedirect = "/home",
}: RouteGuardProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const auth = getFirebaseAuth();

    if (!auth) {
      setIsAuthorized(false);
      return;
    }

    const initAuth = async () => {
      if (typeof auth.authStateReady === "function") {
        await auth.authStateReady();
      }
      if (!isMounted) return;
      if (auth.currentUser) {
        const adminStatus = await isAdmin(auth.currentUser);
        if (isMounted) setIsAuthorized(adminStatus);
      } else {
        if (isMounted) setIsAuthorized(false);
      }
    };
    void initAuth();

    const unsub = onIdTokenChanged(auth, async (user: User | null) => {
      if (!isMounted) return;
      if (!user) {
        setIsAuthorized(false);
        return;
      }

      // Check admin status with forced token refresh check
      const adminStatus = await isAdmin(user);
      if (isMounted) {
        setIsAuthorized(adminStatus);
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  // Handle silent redirection if not admin
  useEffect(() => {
    if (isAuthorized === false && typeof window !== "undefined") {
      const auth = getFirebaseAuth();
      const currentEmail = auth?.currentUser?.email?.toLowerCase();
      const isActualAdmin = currentEmail === ADMIN_EMAIL.toLowerCase();
      const attemptedPath = window.location.pathname;

      if (!isActualAdmin) {
        import("./roles.ts").then(({ logFailedAdminAccess }) => {
          void logFailedAdminAccess(auth?.currentUser?.email, attemptedPath);
        }).catch(() => {});
      }

      window.history.replaceState(null, "", fallbackRedirect);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, [isAuthorized, fallbackRedirect]);

  // Periodic claim refresh every 30 minutes
  useEffect(() => {
    if (!isAuthorized) return;
    const interval = setInterval(async () => {
      const auth = getFirebaseAuth();
      if (!auth?.currentUser) {
        setIsAuthorized(false);
        return;
      }
      const valid = await isAdmin(auth.currentUser, true);
      if (!valid) {
        setIsAuthorized(false);
      }
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthorized]);

  // Loading spinner while checking role
  if (isAuthorized === null) {
    return React.createElement(
      "div",
      {
        className:
          "min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-300",
        role: "status",
        "aria-label": "پشکنینی ناسنامە",
      },
      React.createElement("div", {
        className:
          "w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin",
      }),
      React.createElement(
        "span",
        { className: "text-xs font-sans text-slate-400" },
        "چاوەڕێبە..."
      )
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return React.createElement(React.Fragment, null, children);
}

/**
 * Student Route Guard.
 * Guarantees that only authenticated users can access core student learning destinations.
 */
export function StudentRoute({
  children,
  fallbackRedirect = "/login",
}: RouteGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const auth = getFirebaseAuth();

    if (!auth) {
      setIsAuthenticated(false);
      return;
    }

    const unsub = onIdTokenChanged(auth, async (user: User | null) => {
      if (!user) {
        if (isMounted) setIsAuthenticated(false);
        return;
      }

      // Also ensure role is updated in background
      await getMyRole(user);
      if (isMounted) setIsAuthenticated(true);
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated === false && typeof window !== "undefined") {
      window.history.replaceState(null, "", fallbackRedirect);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, [isAuthenticated, fallbackRedirect]);

  if (isAuthenticated === null) {
    return React.createElement(
      "div",
      {
        className:
          "min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-500",
        role: "status",
      },
      React.createElement("div", {
        className:
          "w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin",
      }),
      React.createElement(
        "span",
        { className: "text-xs font-sans" },
        "چاوەڕێبە..."
      )
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return React.createElement(React.Fragment, null, children);
}

export default AdminRoute;
