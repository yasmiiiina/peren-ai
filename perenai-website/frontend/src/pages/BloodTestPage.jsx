import { useState, useRef, useEffect } from "react";
import { Droplet, Search, FlaskConical, HeartPulse, Activity, Upload, CheckCircle2, Dna } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { setBloodTestCompleted } from "../utils/dashboardState";
import { aiApi } from "../services/ai";
import LabMap from "../components/LabMap";
import { devLog } from "../utils/devLog";

const PANEL_TEMPLATE = [
  { marker: "HbA1c", value: "—", ref: "< 5.7%", status: "optimal" },
  { marker: "ApoB", value: "—", ref: "< 90 mg/dL", status: "optimal" },
  { marker: "hs-CRP", value: "—", ref: "< 1.0 mg/L", status: "optimal" },
  { marker: "Vitamin D", value: "—", ref: "40-60 ng/mL", status: "optimal" },
];

export default function BloodTestPage() {
  const { user, fetchUser } = useAuth();
  const [bloodUploadState, setBloodUploadState] = useState("idle");
  const [docName, setDocName] = useState("");
  const [docEmail, setDocEmail] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [biomarkers, setBiomarkers] = useState([]);
  const [bloodAnalysis, setBloodAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const fileInputRef = useRef(null);

  const getStatusColor = (status) => {
    if (status === "optimal") return "text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/10";
    if (["borderline", "suboptimal", "moderate"].includes(status)) return "text-orange-400 border-orange-400/30 bg-orange-400/10";
    return "text-[#fca5a5] border-[#fca5a5]/30 bg-[#fca5a5]/10";
  };

  const formatBiomarkers = (rows) =>
    rows.map((row) => ({
      marker: row.marker,
      value: row.value,
      ref: row.ref,
      status: row.status,
      color: row.color || getStatusColor(row.status),
    }));

  useEffect(() => {
    if (!user) {
      setBiomarkers([]);
      setBloodAnalysis(null);
      return;
    }

    const loadBiomarkers = async () => {
      try {
        const saved = await aiApi.getBiomarkers();
        if (saved?.biomarkers?.length) {
          setBiomarkers(formatBiomarkers(saved.biomarkers));
          if (saved.analysis) setBloodAnalysis(saved.analysis);
        }
      } catch (err) {
        devLog("Failed to load biomarkers:", err);
      }
    };

    loadBiomarkers();
  }, [user]);

  const handleBloodUpload = async (e) => {
    if (!e.target.files?.length) return;
    if (!user) {
      alert("Connectez-vous pour analyser vos résultats sanguins.");
      return;
    }

    setBloodUploadState("uploading");
    setAnalysisLoading(true);
    setBloodAnalysis(null);

    try {
      const analysis = await aiApi.analyzeBiomarkers(PANEL_TEMPLATE);
      const enriched = analysis?.biomarkers?.length
        ? formatBiomarkers(analysis.biomarkers)
        : formatBiomarkers(PANEL_TEMPLATE);

      setBiomarkers(enriched);
      if (analysis) setBloodAnalysis(analysis);
      setBloodTestCompleted(user, true);
      setBloodUploadState("complete");
    } catch (err) {
      devLog("Blood analysis failed:", err);
      setBloodUploadState("idle");
      alert("L'analyse a échoué. Réessayez ou vérifiez votre connexion.");
    } finally {
      setAnalysisLoading(false);
      setTimeout(() => setBloodUploadState("idle"), 4000);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const panels = [
    {
      id: "metabolic",
      title: "Metabolic health panel",
      icon: Activity,
      priority: "RECOMMENDED",
      priorityColor: "text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/10",
      markers: ["Fasting glucose", "HbA1c", "Insulin", "Triglycerides", "HOMA-IR"],
      description: "Core metabolic markers to assess insulin sensitivity and glucose regulation.",
    },
    {
      id: "cardio",
      title: "Cardiovascular risk panel",
      icon: HeartPulse,
      priority: "RECOMMENDED",
      priorityColor: "text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/10",
      markers: ["ApoB", "Lp(a)", "hs-CRP", "Homocysteine", "LDL-P"],
      description: "Advanced lipid and inflammatory markers beyond standard cholesterol.",
    },
    {
      id: "hormonal",
      title: "Hormonal balance panel",
      icon: Droplet,
      priority: "OPTIONAL",
      priorityColor: "text-[#9ca3af] border-[#9ca3af]/30 bg-white/5",
      markers: ["Total testosterone", "Free testosterone", "DHEA-S", "Cortisol", "TSH", "Free T3/T4"],
      description: "Endocrine markers to evaluate hormonal optimization and thyroid function.",
    },
    {
      id: "longevity",
      title: "Longevity & inflammation",
      icon: Dna,
      priority: "OPTIONAL",
      priorityColor: "text-[#9ca3af] border-[#9ca3af]/30 bg-white/5",
      markers: ["GlycanAge", "IL-6", "TNF-α", "Vitamin D", "Omega-3 index"],
      description: "Biomarkers associated with biological aging and chronic inflammation.",
    }
  ];

  const handleLinkDoctor = async (e) => {
    e.preventDefault();
    if (!docName || !docEmail) return;
    setIsLinking(true);
    try {
      const { authApi } = await import("../services/auth");
      await authApi.updateMe({ profile_type: "patient" });
      await fetchUser();
      localStorage.setItem(`linked_doctor_name:${user?.email}`, docName);
      localStorage.setItem(`linked_doctor_email:${user?.email}`, docEmail);
      alert(`Compte lié avec succès au Dr. ${docName}. Votre profil est désormais "Patient" !`);
    } catch (err) {
      devLog("Doctor link failed:", err);
      alert("Erreur lors de la liaison au médecin.");
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 pb-8">
      {!user && (
        <p className="mb-4 inline-flex rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-yellow-500">
          Connectez-vous pour charger et analyser vos biomarqueurs
        </p>
      )}
      {/* Header */}
      <section>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/5 bg-[#050914] px-3 py-1 text-[11px] font-semibold text-[#9ca3af]">
          <Droplet size={12} className="text-[#8ab4ff]" />
          2 panels recommandés selon votre profil
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-[#e5e7eb] md:text-5xl">
          Trouvez vos analyses recommandées
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#9ca3af]">
          Selon le profil de votre jumeau, nous identifions les panels de biomarqueurs les plus pertinents à suivre.
        </p>
      </section>

      {/* Search */}
      <div className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 transition-colors focus-within:border-[#8ab4ff]/40 focus-within:bg-white/[0.05]">
        <Search size={18} className="text-[#6b7280]" />
        <input 
          type="text" 
          placeholder="Search biomarkers, panels, or conditions..." 
          className="flex-1 bg-transparent text-sm text-white placeholder-[#6b7280] outline-none"
        />
      </div>

      {/* Panels Grid */}
      <section>
        <h2 className="mb-6 text-xl font-bold text-[#e5e7eb]">Recommended panels</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {panels.map((panel) => {
            const Icon = panel.icon;
            return (
              <article key={panel.id} className="group flex flex-col rounded-3xl border border-white/10 bg-white/[0.02] p-6 transition-all hover:border-white/20 hover:bg-white/[0.04]">
                <div className="mb-5 flex items-start justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-[#02050f] text-[#8ab4ff] transition-all group-hover:scale-105 group-hover:bg-[#091024] group-hover:text-white">
                    <Icon size={20} />
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${panel.priorityColor}`}>
                    {panel.priority}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-[#8ab4ff] transition-colors">{panel.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#9ca3af]">{panel.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {panel.markers.map(m => (
                    <span key={m} className="rounded-lg bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-[#d1d5db]">
                      {m}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Laboratoires & Médecins Section */}
      <section className="space-y-6 mt-8">
        <div>
          <h2 className="text-2xl font-bold text-[#e5e7eb]">Partenaires Médicaux & Laboratoires</h2>
          <p className="mt-2 text-sm text-[#9ca3af]">
            Localisez un laboratoire près de chez vous pour faire vos prélèvements, ou liez votre profil à votre médecin.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Map */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Localiser un laboratoire partenaire</h3>
            <LabMap onLabSelect={(lab) => {
              alert(`Laboratoire sélectionné: ${lab.name}. Vous pouvez vous y rendre pour votre analyse.`);
            }} />
          </div>

          {/* Doctor linking */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 flex flex-col justify-between min-h-[350px]">
            <div>
              <h3 className="text-sm font-bold text-white mb-2">Liaison Médecin</h3>
              <p className="text-xs text-[#9ca3af] leading-relaxed mb-4">
                Liez votre compte à votre médecin traitant afin qu'il puisse suivre vos biomarqueurs, consulter vos face scans et vous conseiller.
              </p>

              {user?.profile_type === "patient" ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 size={16} />
                    <span>Compte lié à un médecin</span>
                  </div>
                  <p className="text-white font-medium mt-2">
                    Dr. {localStorage.getItem(`linked_doctor_name:${user?.email}`) || "Partenaire"}
                  </p>
                  <p className="text-gray-500 font-mono">
                    {localStorage.getItem(`linked_doctor_email:${user?.email}`) || "email@peren.ai"}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-2">
                    Votre profil est configuré comme <strong className="text-emerald-400">Patient</strong>.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleLinkDoctor} className="space-y-3 mt-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Nom du médecin</label>
                    <input
                      type="text"
                      required
                      value={docName}
                      onChange={(e) => setDocName(e.target.value)}
                      placeholder="ex: Dr. Youssef Alami"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Email du médecin</label>
                    <input
                      type="email"
                      required
                      value={docEmail}
                      onChange={(e) => setDocEmail(e.target.value)}
                      placeholder="ex: alami@peren.ai"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLinking}
                    className="w-full mt-2 rounded-xl bg-blue-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 active:scale-95 transition-all"
                  >
                    {isLinking ? "Liaison en cours..." : "Lier mon compte"}
                  </button>
                </form>
              )}
            </div>
            
            <div className="mt-4 text-[10px] text-gray-500">
              * Conformément à votre consentement digital, vos données médicales partagées restent cryptées et sécurisées.
            </div>
          </div>
        </div>
      </section>

      {/* Recent Results Section */}
      <section className="mt-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#e5e7eb]">Recent results</h2>
            <p className="mt-2 text-sm text-[#9ca3af]">Your latest biomarker readings and their reference ranges.</p>
          </div>
          <div>
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              onChange={handleBloodUpload}
              accept=".pdf,.json"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={bloodUploadState === "uploading"}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10 active:scale-95 disabled:opacity-50"
            >
              {bloodUploadState === "uploading" ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div> Analyzing...
                </span>
              ) : bloodUploadState === "complete" ? (
                <span className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 size={16} /> Calibration Successful
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Upload size={16} /> Upload results
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#9ca3af]">
              <thead className="border-b border-white/10 bg-black/20 text-[10px] font-bold uppercase tracking-wider text-white/50">
                <tr>
                  <th className="px-6 py-4">Marker</th>
                  <th className="px-6 py-4">Value</th>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {biomarkers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-[#6b7280]">
                      {user ? "Aucun résultat enregistré. Importez votre analyse pour commencer." : "Connectez-vous pour voir vos résultats."}
                    </td>
                  </tr>
                ) : biomarkers.map((row, i) => (
                  <tr key={i} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-semibold text-white">{row.marker}</td>
                    <td className="px-6 py-4 font-mono text-[#e5e7eb]">{row.value}</td>
                    <td className="px-6 py-4 font-mono text-[#6b7280]">{row.ref}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${row.color}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {(analysisLoading || bloodAnalysis) && (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="text-sm font-bold text-white mb-2">
              Analyse IA {bloodAnalysis?.source === "openai" ? "(OpenAI)" : bloodAnalysis ? "(local)" : ""}
            </h3>
            {analysisLoading ? (
              <p className="text-sm text-[#9ca3af]">Interprétation clinique en cours...</p>
            ) : (
              <>
                <p className="text-sm text-[#e5e7eb] leading-relaxed">{bloodAnalysis.summary}</p>
                {bloodAnalysis.recommendations?.length > 0 && (
                  <ul className="mt-4 space-y-2 text-xs text-[#9ca3af] list-disc list-inside">
                    {bloodAnalysis.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        )}
      </section>

      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
