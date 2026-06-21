import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth";

const ERROR_MESSAGES = {
  google_auth_failed: "Google authentication failed. Please try again.",
  google_auth_denied: "Google sign-in was cancelled.",
  google_auth_missing_code: "Google did not return an authorization code.",
  google_auth_state_invalid: "Security validation failed. Please try Google sign-in again.",
  access_denied: "Google sign-in was denied.",
};

export default function AuthCallback() {
  const navigate = useNavigate();
  const { establishSession } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    establishSession()
      .then(() => navigate("/dashboard", { replace: true }))
      .catch((err) => {
        console.error("[AuthCallback] Session bootstrap failed:", err);
        const detail = err?.message || "Could not load your profile after Google sign-in.";
        setError(detail);
      });
  }, [establishSession, navigate]);

  return (
    <section className="w-full grid place-items-start">
      <div className="w-[min(620px,calc(100vw-2rem))] bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-[24px] px-[1.7rem] py-8 shadow-[var(--shadow-card)]">
        <p>{error || "Completing Google sign-in..."}</p>
      </div>
    </section>
  );
}

export { ERROR_MESSAGES };
