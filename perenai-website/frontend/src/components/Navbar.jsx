import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth";

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthRoute = location.pathname === "/login" || location.pathname === "/auth/callback";

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const navClass = isAuthRoute
    ? "grid grid-cols-[120px_1fr_auto] items-center py-4 px-5 min-h-[76px]"
    : "grid grid-cols-[minmax(120px,1fr)_auto_minmax(120px,1fr)] items-center py-4 px-5 min-h-[76px]";

  const brandClass = isAuthRoute
    ? "justify-self-end text-right tracking-[0.5em]"
    : "justify-self-center tracking-[0.55em]";

  return (
    <nav className={navClass}>
      <div className="w-[120px] flex items-center justify-self-start">
        <img src="/Frame 2.svg" alt="Peren AI logo" className="w-[38px] h-[26px]" />
      </div>

      <div
        className={`text-[0.7rem] font-medium whitespace-nowrap ${brandClass} max-[640px]:tracking-[0.35em] max-[640px]:text-[0.62rem]`}
      >
        PEREN AI
      </div>

      {!isAuthRoute && (
        <div className="min-w-[120px] flex gap-4 items-center justify-end justify-self-end">
          {user ? (
            <button
              onClick={handleLogout}
              className="rounded-xl border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-4 py-2 text-[var(--color-input-text)]"
            >
              Déconnexion
            </button>
          ) : (
            <Link to="/login" className="underline text-[var(--color-text-brand-link)]">
              Se connecter
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
