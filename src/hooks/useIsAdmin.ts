import { useEffect, useState } from "react";
import { onIdTokenChanged, type User } from "firebase/auth";
import { getFirebaseAuth } from "../services/firebase.ts";

export interface AdminInfo {
  isAdmin: boolean;
  role: string | null;
  permissions: string[];
  loading: boolean;
  email: string | null;
  uid: string | null;
}

export const AUTHORIZED_ADMIN_EMAILS = ["addmin.official.idg@gmail.com"];

export function useIsAdmin(): AdminInfo {
  const [state, setState] = useState<AdminInfo>(() => {
    const auth = getFirebaseAuth();
    if (!auth || !auth.currentUser) {
      return {
        isAdmin: false,
        role: null,
        permissions: [],
        loading: false,
        email: null,
        uid: null,
      };
    }
    const user = auth.currentUser;
    const isAuthorizedEmail = Boolean(user.email && AUTHORIZED_ADMIN_EMAILS.includes(user.email.toLowerCase()));
    return {
      isAdmin: isAuthorizedEmail,
      role: isAuthorizedEmail ? "SuperAdmin" : null,
      permissions: isAuthorizedEmail ? ["*"] : [],
      loading: true,
      email: user.email || null,
      uid: user.uid,
    };
  });

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      return;
    }

    const unsub = onIdTokenChanged(auth, async (user: User | null) => {
      if (!user) {
        setState({
          isAdmin: false,
          role: null,
          permissions: [],
          loading: false,
          email: null,
          uid: null,
        });
        return;
      }
      try {
        const tokenResult = await user.getIdTokenResult(false);
        const hasAdminClaim = tokenResult.claims.admin === true;
        const isAuthorizedEmail = Boolean(user.email && AUTHORIZED_ADMIN_EMAILS.includes(user.email.toLowerCase()));
        const isAdmin = hasAdminClaim || isAuthorizedEmail;

        setState({
          isAdmin,
          role: (tokenResult.claims.role as string) || (isAdmin ? "SuperAdmin" : null),
          permissions: (tokenResult.claims.permissions as string[]) || (isAdmin ? ["*"] : []),
          loading: false,
          email: user.email || null,
          uid: user.uid,
        });
      } catch (err) {
        console.error("Failed to read admin claims:", err);
        const isAuthorizedEmail = Boolean(user.email && AUTHORIZED_ADMIN_EMAILS.includes(user.email.toLowerCase()));
        setState({
          isAdmin: isAuthorizedEmail,
          role: isAuthorizedEmail ? "SuperAdmin" : null,
          permissions: isAuthorizedEmail ? ["*"] : [],
          loading: false,
          email: user.email || null,
          uid: user.uid,
        });
      }
    });

    return () => unsub();
  }, []);

  return state;
}
