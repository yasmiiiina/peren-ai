import { createContext, useEffect, useMemo, useState } from "react";

import { authApi } from "../services/auth";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const profile = await authApi.me();
    setUser(profile);
    return profile;
  };

  const establishSession = async () => {
    await fetchUser();
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Session cookie may already be cleared.
    }
    setUser(null);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await fetchUser();
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    const onAuthError = () => {
      setUser(null);
    };
    window.addEventListener("auth-error", onAuthError);
    return () => window.removeEventListener("auth-error", onAuthError);
  }, []);

  const value = useMemo(
    () => ({ user, loading, establishSession, logout, fetchUser }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
