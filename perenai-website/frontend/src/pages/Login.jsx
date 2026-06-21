import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { authApi } from "../services/auth";
import { useAuth } from "../auth/useAuth";
import { ERROR_MESSAGES } from "./AuthCallback";

function toErrorMessage(value) {
  if (!value) return "Une erreur s'est produite. Veuillez réessayer.";
  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    const messages = value.map(item => item?.msg || item?.message || (typeof item === "string" ? item : null)).filter(Boolean);
    return messages.length ? messages.join(" · ") : "Erreur de validation.";
  }

  if (typeof value === "object") {
    if (value.detail) {
        if (Array.isArray(value.detail)) {
            return value.detail.map(err => err.msg).join(" · ");
        }
        return value.detail;
    }
    if (value.msg) return value.msg;
    if (value.message) return value.message;
  }

  return "Une erreur serveur s'est produite.";
}

export default function Login() {
  const navigate = useNavigate();
  const { establishSession } = useAuth();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [profileType, setProfileType] = useState("individu");

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptInfo, setAcceptInfo] = useState(false);
  const [acceptConsent, setAcceptConsent] = useState(false);

  const [isRegister, setIsRegister] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (!errorParam) return;

    const message = ERROR_MESSAGES[errorParam] || decodeURIComponent(errorParam);
    setError(message);
    setIsGoogleLoading(false);
  }, [searchParams]);

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    setError("");
    window.location.href = `${window.location.origin}/auth/google/login`;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (isRegister) {
      if (!firstName.trim() || !lastName.trim() || !phone.trim() || !email.trim() || !password.trim()) {
        setError("Veuillez remplir toutes les cases obligatoires.");
        return;
      }
      if (!acceptTerms || !acceptInfo || !acceptConsent) {
        setError("Veuillez accepter toutes les conditions et consentements obligatoires.");
        return;
      }
    }

    try {
      const response = isRegister
        ? await authApi.register({
            email,
            password,
            name: `${firstName} ${lastName}`.trim() || "Nouvel utilisateur",
            location,
            phone,
            profile_type: profileType,
          })
        : await authApi.login({ email, password });
      await establishSession();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(toErrorMessage(err?.response?.data || err?.message));
    }
  };

  const inputClass =
    "rounded-xl border border-[var(--color-input-border)] bg-[var(--color-input-bg)] text-[var(--color-input-text)] px-[0.85rem] py-[0.82rem] text-base";
  const labelClass = "grid gap-[0.42rem] text-[0.92rem] text-[var(--color-page-text)]";

  return (
    <section className="w-full grid place-items-center">
      <div className="w-[min(620px,calc(100vw-2rem))] bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-[24px] px-[1.7rem] pt-[1.2rem] pb-[1.9rem] shadow-[var(--shadow-card)] max-[900px]:w-[min(730px,calc(100vw-1.4rem))] max-[640px]:rounded-[18px] max-[640px]:p-4">
        <h1 className="mt-[0.45rem] mb-[0.25rem] text-center text-[3rem] leading-[1.08] max-[900px]:text-[2.2rem]">
          {isRegister ? "Devenir membre" : "Se connecter"}
        </h1>
        <p className="mx-auto max-w-[520px] text-center text-[0.95rem]">
          {isRegister
            ? "Créez votre jumeau numérique et définissez votre santé future, maintenant."
            : "Accédez à votre espace santé personnalisé."}
        </p>
        <p className="text-center text-[0.72rem] max-w-[450px] mt-[0.65rem] mb-[1.2rem] mx-auto text-[var(--color-text-muted)]">
          +300 laboratoires partenaires au Maroc, une équipe médicale au cœur de chaque décision
        </p>

        <form onSubmit={onSubmit} className="grid gap-[0.95rem]">
          <label className={labelClass}>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Adam@foreveryoung.com"
              className={inputClass}
            />
          </label>

          {isRegister && (
            <div className="grid grid-cols-2 gap-[0.9rem] max-[640px]:grid-cols-1">
              <label className={labelClass}>
                Nom
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required={isRegister}
                  placeholder="Adam"
                  className={inputClass}
                />
              </label>
              <label className={labelClass}>
                Prénom
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required={isRegister}
                  placeholder="Foulane"
                  className={inputClass}
                />
              </label>
            </div>
          )}

          {isRegister && (
            <label className={labelClass}>
              Numéro de téléphone
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required={isRegister}
                placeholder="+212 ..."
                className={inputClass}
              />
            </label>
          )}

          {isRegister && (
            <label className={labelClass}>
              Type de profil
              <select
                value={profileType}
                onChange={(e) => setProfileType(e.target.value)}
                className={`${inputClass} bg-[#060b16] border border-[#1e293b] text-white rounded-xl focus:border-blue-500/50`}
              >
                <optgroup label="Profils Individuels (B2C)">
                  <option value="individu">Individu</option>
                  <option value="athlete">Athlète</option>
                </optgroup>
                <optgroup label="Profils Professionnels (B2B / B2B2C)">
                  <option value="medecin">Médecin</option>
                  <option value="lab">Laboratoire</option>
                  <option value="recherche">Centre de recherche</option>
                  <option value="pharma">Pharma</option>
                </optgroup>
              </select>
            </label>
          )}

          <label className={labelClass}>
            Mot de passe
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`${inputClass} w-full pr-[2.9rem]`}
              />
              <button
                type="button"
                className="absolute right-[0.45rem] top-1/2 -translate-y-1/2 border-0 bg-transparent p-[0.2rem] text-[1.1rem] w-auto"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
          </label>

          {isRegister && (
            <div className="grid gap-[0.45rem] mt-[0.2rem]">
              <label className="flex items-start gap-[0.7rem] leading-[1.35]">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  required={isRegister}
                  className="w-5 h-5 mt-[0.12rem] rounded-[6px] accent-[var(--color-button-primary-bg)]"
                />
                <span>J&apos;accepte les <u>conditions d&apos;utilisation</u></span>
              </label>

              <label className="flex items-start gap-[0.7rem] leading-[1.35]">
                <input
                  type="checkbox"
                  checked={acceptInfo}
                  onChange={(e) => setAcceptInfo(e.target.checked)}
                  required={isRegister}
                  className="w-5 h-5 mt-[0.12rem] rounded-[6px] accent-[var(--color-button-primary-bg)]"
                />
                <span>Je confirme avoir lu et compris la <u>notice d&apos;information</u></span>
              </label>

              <label className="flex items-start gap-[0.7rem] leading-[1.35] mt-[0.2rem]">
                <input
                  type="checkbox"
                  checked={acceptConsent}
                  onChange={(e) => setAcceptConsent(e.target.checked)}
                  required={isRegister}
                  className="w-5 h-5 mt-[0.12rem] rounded-[6px] accent-[var(--color-button-primary-bg)]"
                />
                <span>
                  J&apos;accepte que les données personnelles que je communique à Peren AI soient traitées dans le but de revoir mes
                  données de santé, de créer des plans d&apos;action personnalisés et de m&apos;accompagner dans l&apos;amélioration de mon bien-être
                </span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={isGoogleLoading}
            className="w-full rounded-full text-[1.02rem] py-[0.88rem] px-4 border-none bg-[var(--color-button-primary-bg)] text-[var(--color-button-primary-text)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-[0_12px_24px_rgba(0,0,0,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-50"
          >
            {isRegister ? "Commencer maintenant" : "Se connecter"}
          </button>

          <div className="relative w-full mt-2 flex justify-center min-h-[44px]">
            {isGoogleLoading ? (
              <div className="flex items-center gap-3 text-[var(--color-text-muted)] animate-pulse">
                <div className="w-5 h-5 border-2 border-[var(--color-button-primary-bg)] border-t-transparent rounded-full animate-spin" />
                <span>Vérification en cours...</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 rounded-full text-[1.02rem] py-[0.88rem] px-4 border border-[var(--color-button-secondary-border)] bg-[var(--color-button-secondary-bg)] text-[var(--color-button-secondary-text)] font-semibold transition-all duration-200 ease-out hover:-translate-y-[1px] hover:bg-[rgba(30,41,59,0.5)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.15)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
                Continuer avec Google
              </button>
            )}
          </div>
        </form>

        <p className="mt-[0.85rem] mb-[0.4rem] text-center">
          {isRegister ? "Vous avez déjà un compte ?" : "Pas encore de compte ?"}{" "}
          <button type="button" className="border-none bg-transparent underline w-auto p-0" onClick={() => {
            setIsRegister((v) => !v);
            setEmail("");
            setPassword("");
            setFirstName("");
            setLastName("");
            setPhone("");
            setError("");
          }}>
            {isRegister ? "Se connecter" : "Devenir membre"}
          </button>
        </p>

        {isRegister && (
          <div className="mt-6">
            <p className="text-[0.93rem] mb-[0.6rem]">
              + 600 membres actifs utilisent Peren AI
            </p>
            <ul className="m-0 p-0 list-none rounded-xl overflow-hidden border border-[var(--color-list-border)]">
              <li className="relative py-[0.8rem] pr-[0.9rem] pl-[1.65rem] text-[0.95rem] leading-[1.45] before:content-['+'] before:absolute before:left-[0.8rem]">
                Évaluation initiale de 100+ marqueurs biologiques
              </li>
              <li className="relative border-t border-[var(--color-list-divider)] py-[0.8rem] pr-[0.9rem] pl-[1.65rem] text-[0.95rem] leading-[1.45] before:content-['+'] before:absolute before:left-[0.8rem]">
                Rapport personnalisé validé médicalement
              </li>
            </ul>
          </div>
        )}

        {error && <p className="mt-[0.55rem] text-center text-[var(--color-error)] text-sm">{error}</p>}
      </div>
    </section>
  );
}
