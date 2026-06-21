import { useState, useEffect, useRef } from "react";
import { ArrowUpRight, CheckCircle2, CircleDot, Dna, FlaskConical, Watch, Loader2, Camera, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth/useAuth";
import { PremiumGate } from "../components/PremiumGate";
import { useOpenPremiumSubscription, usePremiumAccess } from "../hooks/usePremium";
import { WearablesModal } from "../components/WearablesModal";
import { useHealthData } from "../hooks/useHealthData";
import { scanService } from "../services/services";
import { aiApi } from "../services/ai";
import { isOnboardingCompleted, getOnboardingDraft } from "../utils/onboarding";
import { isBloodTestCompleted, isFaceScanCompleted, isAnyWearableConnected } from "../utils/dashboardState";

const STATUS_META = {
  not_started: {
    label: "NON COMMENCÉ",
    actionLabel: "Commencer",
    accent: "text-[#6b7280]",
  },
  in_progress: {
    label: "35 % COMPLÉTÉ",
    actionLabel: "Continuer",
    accent: "text-[#8ab4ff]",
  },
  connecting: {
    label: "CONNEXION...",
    actionLabel: "Synchronisation",
    accent: "text-blue-400",
  },
  complete: {
    label: "TERMINÉ",
    actionLabel: "Consulter",
    accent: "text-[#4ade80]",
  },
};

function StatusCard({ icon: Icon, title, description, status = "not_started", actionLabel, onClick }) {
  const meta = STATUS_META[status];
  const isConnecting = status === "connecting";

  return (
    <article 
      onClick={onClick}
      className="group cursor-pointer rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_20px_40px_rgba(2,6,23,0.45)] backdrop-blur-xl transition hover:border-[#7da7ff]/30 hover:bg-white/[0.04] active:scale-[0.99] flex flex-col justify-between"
    >
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-[#020617] transition group-hover:bg-[#0a0f1d]">
            {isConnecting ? <Loader2 size={20} className="animate-spin text-blue-400" /> : <Icon size={20} className={status === "not_started" ? "text-[#6b7280]" : "text-[#8ab4ff]"} />}
          </div>
          <ArrowUpRight size={18} className="text-[#6b7280] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
        </div>

        <h3 className="text-xl font-bold leading-tight tracking-tight text-[#e5e7eb] transition group-hover:text-white">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[#9ca3af]">{description}</p>
      </div>

      <div className="mt-6 border-t border-white/10 pt-4">
        {(status === "in_progress" || status === "complete") && (
          <div className="mb-3 h-1 overflow-hidden rounded-full bg-[#1f2937]">
            <div 
              className="h-full rounded-full bg-[#7da7ff] transition-all duration-500" 
              style={{ width: status === "complete" ? "100%" : "35%" }}
            />
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <span className={`text-[10px] font-bold uppercase tracking-[0.16em] ${meta.accent}`}>{meta.label}</span>
          <button className="text-xs font-semibold text-[#dbeafe] transition group-hover:text-white group-hover:translate-x-1">
            {actionLabel || meta.actionLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { history, loading, refresh } = useHealthData();
  const [isWearablesModalOpen, setWearablesModalOpen] = useState(false);
  const [hasScans, setHasScans] = useState(false);
  const [hasBiomarkers, setHasBiomarkers] = useState(false);
  const hasPremiumAccess = usePremiumAccess();
  const openPremiumSubscription = useOpenPremiumSubscription();

  const isTwinCompleted = Boolean(user?.onboarding_completed) || isOnboardingCompleted(user);
  const twinHasDraft = getOnboardingDraft(user) !== null;
  const twinStatus = isTwinCompleted ? "complete" : (twinHasDraft ? "in_progress" : "not_started");
  const twinAction = isTwinCompleted ? "Voir le jumeau" : (twinHasDraft ? "Continuer le profil" : "Créer le profil");
  const twinPath = isTwinCompleted ? "/dashboard" : "/onboarding";

  const isBiomarkersCompleted = (history?.length || 0) > 0 || hasBiomarkers || isBloodTestCompleted(user);
  const biomarkersStatus = isBiomarkersCompleted ? "complete" : "not_started";
  const biomarkersAction = isBiomarkersCompleted ? "Voir les biomarqueurs" : "Trouver des analyses";

  const isWearablesCompleted = isAnyWearableConnected(user);
  const wearablesStatus = isWearablesCompleted ? "complete" : "not_started";
  const wearablesAction = isWearablesCompleted ? "Gérer les appareils" : "Connecter un appareil";

  const isFaceScanDone = hasScans || isFaceScanCompleted(user);
  const facescanStatus = isFaceScanDone ? "complete" : "not_started";
  const facescanAction = isFaceScanDone ? "Voir le scan" : "Lancer le scan facial";

  useEffect(() => {
    if (!user) {
      setHasScans(false);
      setHasBiomarkers(false);
      return;
    }

    scanService.getHistory()
      .then((res) => setHasScans(Boolean(res.data?.length)))
      .catch(() => setHasScans(false));

    aiApi.getBiomarkers()
      .then((saved) => setHasBiomarkers(Boolean(saved?.biomarkers?.length)))
      .catch(() => setHasBiomarkers(false));
  }, [user]);

  const moduleCards = [
    {
      id: "twin",
      icon: Dna,
      title: "Votre jumeau numérique",
      description: "État de santé en temps réel issu de vos biomarqueurs, wearables et données de vie.",
      status: twinStatus,
      actionLabel: twinAction,
      onClick: () => navigate(twinPath),
    },
    {
      id: "biomarkers",
      icon: FlaskConical,
      title: "Analyse sanguine",
      description: "Trouvez vos tests recommandés et consultez vos derniers biomarqueurs.",
      status: biomarkersStatus,
      actionLabel: biomarkersAction,
      onClick: () => navigate("/blood-test"),
    },
    {
      id: "wearables",
      icon: Watch,
      title: "Wearables",
      description: "Synchronisez vos appareils pour un suivi continu de vos signaux vitaux.",
      status: wearablesStatus,
      actionLabel: wearablesAction,
      onClick: () => navigate("/wearables"),
    },
    {
      id: "facescan",
      icon: Camera,
      title: "Scan facial biologique",
      description: "Scan rPPG sans contact pour calibrer la précision prédictive de votre jumeau.",
      status: facescanStatus,
      actionLabel: facescanAction,
      onClick: () => navigate("/facescan"),
    },
  ];

  const followUps = [
    {
      text: "Pending — blood work validation for the April cycle",
      tag: "IN PROGRESS",
      tone: "text-[#8ab4ff]",
    },
    {
      text: "Action required — adjust nocturnal recovery target by 4.2%",
      tag: "ACTION REQUIRED",
      tone: "text-[#fca5a5]",
    },
    {
      text: "Insight — sleep regularity improved by 12% over 14 days",
      tag: "READ",
      tone: "text-[#9ca3af]",
    },
  ];

  if (loading) {
    return (
      <div className="grid min-h-[400px] place-items-center rounded-3xl border border-white/10 bg-white/[0.02] p-5 text-[#9ca3af]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#8ab4ff]" />
          <p className="text-sm font-medium">Synchronizing your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-7 pb-8 selection:bg-blue-500/30">
      <header className="rounded-3xl border border-white/10 bg-gradient-to-r from-[#0b1224] via-[#050a16] to-[#030712] p-7 shadow-[0_24px_50px_rgba(2,6,23,0.55)]">
        <p className="inline-flex animate-pulse items-center gap-2 rounded-full border border-[#7da7ff]/35 bg-[#7da7ff]/10 px-4 py-1.5 text-xs font-semibold text-[#9fb7ff]">
          <CircleDot size={14} /> Synchronizing markers — phase 1 of 3
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#e5e7eb] md:text-5xl">System initialization</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#9ca3af]">
          Your digital twin is calibrating against your latest physiological signals. Complete the three modules below to unlock prevention insights.
        </p>
      </header>

      {/* Grid of 4 Cards */}
      <div className="grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        {moduleCards.map((card) => (
          <StatusCard key={card.title} {...card} />
        ))}
      </div>

      <PremiumGate
        title="Premium Dashboard Layer"
        description="Upgrade to Premium to access follow-up tasks, clinician actions and advanced monitoring timelines."
      >
        <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_16px_38px_rgba(2,6,23,0.42)] backdrop-blur-xl transition hover:border-white/20">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#e5e7eb]">Follow up</h2>
              <p className="mt-1 text-sm text-[#9ca3af]">Open items from your twin and clinicians.</p>
            </div>
            <button className="text-sm font-semibold text-[#9ca3af] transition hover:text-white">View all</button>
          </div>
          <div className="space-y-3">
            {followUps.map((item) => (
              <div key={item.text} className="group flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#020712] px-5 py-4 transition hover:bg-[#0a0f1d] hover:border-white/20">
                <p className="max-w-[32rem] text-sm leading-relaxed text-[#d1d5db] transition group-hover:text-white">{item.text}</p>
                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${item.tone}`}>{item.tag}</span>
              </div>
            ))}
          </div>
        </section>
      </PremiumGate>

      {!hasPremiumAccess && (
        <div className="rounded-2xl border border-[#7da7ff]/30 bg-[#7da7ff]/10 p-4 transition hover:bg-[#7da7ff]/15">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#dbeafe]">Upgrade to Premium to unlock persistent wearable integrations and clinician timelines.</p>
            <button
              onClick={openPremiumSubscription}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7da7ff] to-[#4f79d9] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 active:scale-95"
            >
              <CheckCircle2 size={14} /> Manage Subscription
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </section>
  );
}
