import { Navigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth";

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-[var(--color-text-muted)]">Vérification de la session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
