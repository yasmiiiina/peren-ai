import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ShieldAlert, 
  RefreshCw, 
  Check, 
  User, 
  Settings, 
  Users, 
  Layers, 
  Sparkles,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { authApi } from "../services/auth";
import { 
  PROFILE_DETAILS, 
  FEATURES, 
  getFeatureFlags, 
  saveFeatureFlags, 
  resetFeatureFlags 
} from "../utils/featureFlags";

export default function Backoffice() {
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [flags, setFlags] = useState({});
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    setFlags(getFeatureFlags());
  }, []);

  const handleToggle = (profileKey, featureKey) => {
    const updated = {
      ...flags,
      [profileKey]: {
        ...flags[profileKey],
        [featureKey]: !flags[profileKey][featureKey]
      }
    };
    setFlags(updated);
    saveFeatureFlags(updated);
    setSaveStatus("Modification enregistrée !");
    setTimeout(() => setSaveStatus(""), 3000);
  };

  const handleReset = () => {
    if (window.confirm("Voulez-vous réinitialiser toutes les fonctionnalités selon la matrice Excel d'origine ?")) {
      const reset = resetFeatureFlags();
      setFlags(reset);
      setSaveStatus("Réinitialisé aux valeurs Excel !");
      setTimeout(() => setSaveStatus(""), 3000);
    }
  };

  const handleSwitchProfile = async (profileKey) => {
    if (!user) {
      alert("Veuillez vous connecter pour simuler un profil persistant.");
      navigate("/login");
      return;
    }
    setIsUpdatingProfile(true);
    try {
      await authApi.updateMe({ profile_type: profileKey });
      await fetchUser();
      setSaveStatus(`Profil changé en: ${PROFILE_DETAILS[profileKey].label}`);
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (err) {
      console.error("Erreur de changement de profil:", err);
      alert("Échec de la mise à jour du profil dans la base de données.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 pb-12 text-[#c8d6e5]">
      {/* Page Header */}
      <section className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold text-blue-400">
            <Settings size={12} />
            Backoffice Admin de Contrôle
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Configuration des fonctionnalités par profil
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Activez ou désactivez dynamiquement les fonctionnalités selon le rôle de l'utilisateur. Se réfère à la grille Excel.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10 active:scale-95 transition-all duration-200"
        >
          <RefreshCw size={14} /> Réinitialiser (Excel)
        </button>
      </section>

      {/* Save Status Alert */}
      {saveStatus && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-emerald-500/90 px-4 py-3 text-xs font-bold text-white shadow-xl shadow-emerald-500/20 backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300">
          <Check size={16} />
          {saveStatus}
        </div>
      )}

      {/* Profile Switcher Card */}
      <section className="rounded-3xl border border-blue-500/10 bg-[#0a1224] p-6 shadow-xl backdrop-blur-xl">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Simulateur de profil pour tests</h2>
            <p className="text-xs text-gray-400">Cliquez sur un profil pour l'attribuer immédiatement à votre compte connecté et tester sa vue.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          {Object.entries(PROFILE_DETAILS).map(([key, details]) => {
            const isCurrent = user?.profile_type === key;
            return (
              <button
                key={key}
                disabled={isUpdatingProfile}
                onClick={() => handleSwitchProfile(key)}
                className={`relative flex flex-col items-center justify-center rounded-2xl border p-4 text-center transition-all duration-300 ${
                  isCurrent
                    ? "border-blue-500 bg-blue-500/10 text-white shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                    : "border-white/5 bg-white/[0.01] hover:border-white/20 hover:bg-white/[0.03] text-gray-400 hover:text-white"
                }`}
              >
                <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl ${isCurrent ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400'}`}>
                  <User size={18} />
                </div>
                <span className="text-xs font-bold leading-tight">{details.label}</span>
                <span className="mt-1 text-[9px] text-gray-500 uppercase tracking-widest">{details.group.split(" ")[0]}</span>
                {isCurrent && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white shadow-lg">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Feature Matrix Table */}
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#060b16] shadow-2xl">
        <div className="border-b border-white/5 bg-black/20 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Matrice des droits d'accès</h2>
              <p className="text-xs text-gray-400">Cochez ou décochez les fonctionnalités autorisées pour chaque type de compte.</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="border-b border-white/5 bg-black/40 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <tr>
                <th className="px-6 py-4 min-w-[200px]">Profil / Type</th>
                {Object.entries(FEATURES).map(([key, feature]) => (
                  <th key={key} className="px-4 py-4 text-center min-w-[120px]" title={feature.description}>
                    <span className="block max-w-[100px] mx-auto truncate text-[9px]">{feature.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-white/[0.01]">
              {Object.entries(PROFILE_DETAILS).map(([profileKey, profile]) => (
                <tr key={profileKey} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-6 py-4 font-semibold text-white">
                    <div className="flex flex-col">
                      <span>{profile.label}</span>
                      <span className="text-[9px] text-gray-500 uppercase tracking-widest">{profile.group}</span>
                    </div>
                  </td>
                  {Object.keys(FEATURES).map((featureKey) => {
                    const isEnabled = flags[profileKey]?.[featureKey];
                    return (
                      <td key={featureKey} className="px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggle(profileKey, featureKey)}
                          className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
                            isEnabled
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                              : "border-red-500/20 bg-red-500/5 text-red-400/40 hover:bg-red-500/10"
                          }`}
                        >
                          {isEnabled ? <Check size={16} /> : <span className="text-xs font-bold">✕</span>}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Info Warning */}
      <section className="flex gap-4 rounded-3xl border border-amber-500/20 bg-amber-500/[0.02] p-6 shadow-xl backdrop-blur-xl">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
          <ShieldAlert size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">Mode Démonstration Actif</h4>
          <p className="mt-1 text-xs leading-relaxed text-gray-400">
            Ce backoffice simule en temps réel le comportement de la plateforme Peren AI. Lorsque vous changez de rôle dans le simulateur ci-dessus, le menu latéral (sidebar) s'adapte immédiatement en masquant/affichant les pages. C'est parfait pour démontrer le fonctionnement multicompte à votre professeur.
          </p>
        </div>
      </section>
    </div>
  );
}
