import { useState } from "react";
import { DemoBanner } from "../components/DemoBanner";
import { 
  Sparkles, 
  TrendingUp, 
  Layers, 
  Map, 
  Activity, 
  ShieldAlert,
  ChevronRight,
  FlaskConical
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

const MOLECULES = [
  { id: "metformin", name: "Metformine-SR (Anti-sénescence métabolique)", target: "HbA1c & Sensibilité Insuline", status: "Phase 3 Clinique" },
  { id: "repatha", name: "PCSK9-Inhibiteur (Clairance LDL/ApoB)", target: "ApoB & Profil Lipidique", status: "Approuvé R&D" },
  { id: "quercetin", name: "Quercétine-Dasatinib (Sénolytique cellulaire)", target: "hs-CRP & Inflammation Mitochondriale", status: "Phase 2 Clinique" }
];

export default function PharmaDashboard() {
  const [selectedMolecule, setSelectedMolecule] = useState(MOLECULES[0]);
  const [dosage, setDosage] = useState(500); // mg
  const [duration, setDuration] = useState(30); // days
  const [isSimulating, setIsSimulating] = useState(false);
  const [simRunCount, setSimRunCount] = useState(0);

  // Efficacy metric radar data
  const getRadarData = () => {
    // Modify based on dosage & duration & molecule
    let rawMolt = (dosage / 1000) * (duration / 90);
    rawMolt = Math.min(1.0, Math.max(0.1, rawMolt));

    const metEffect = selectedMolecule.id === "metformin" ? 35 * rawMolt : 10;
    const repEffect = selectedMolecule.id === "repatha" ? 45 * rawMolt : 5;
    const querEffect = selectedMolecule.id === "quercetin" ? 40 * rawMolt : 8;

    return [
      { subject: "Baisse de l'âge biologique", A: Math.round(15 + metEffect * 0.8), B: 12, fullMark: 100 },
      { subject: "Clairance des Lipides (ApoB)", A: Math.round(10 + repEffect * 1.1), B: 8, fullMark: 100 },
      { subject: "Réduction hs-CRP", A: Math.round(8 + querEffect * 1.2), B: 15, fullMark: 100 },
      { subject: "Contrôle Glycémique", A: Math.round(metEffect * 1.3 + 5), B: 10, fullMark: 100 },
      { subject: "Clairance des Toxines", A: Math.round(12 + querEffect * 0.9), B: 9, fullMark: 100 }
    ];
  };

  // Moroccan geographical distribution of biomarker levels
  const getGeoData = () => {
    return [
      { name: "Casablanca", ApoB_Moyen: 92, hsCRP_Moyen: 1.4, HbA1c_Moyen: 5.4 },
      { name: "Rabat", ApoB_Moyen: 88, hsCRP_Moyen: 1.1, HbA1c_Moyen: 5.2 },
      { name: "Marrakech", ApoB_Moyen: 95, hsCRP_Moyen: 1.6, HbA1c_Moyen: 5.6 },
      { name: "Fès", ApoB_Moyen: 91, hsCRP_Moyen: 1.3, HbA1c_Moyen: 5.5 },
      { name: "Tanger", ApoB_Moyen: 89, hsCRP_Moyen: 1.2, HbA1c_Moyen: 5.3 }
    ];
  };

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setSimRunCount(c => c + 1);
    }, 1500);
  };

  const radarData = getRadarData();
  const geoData = getGeoData();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-12 text-[#c8d6e5]">
      <DemoBanner>Simulations moléculaires et données géographiques générées côté client (API pharma à venir).</DemoBanner>
      {/* Header */}
      <section className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold text-indigo-400">
            <FlaskConical size={12} />
            Espace Recherche & Développement Pharma (B2B)
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Simulations Populationnelles Pharma
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Évaluez l'efficacité théorique des molécules thérapeutiques et visualisez la distribution géographique des biomarqueurs au Maroc.
          </p>
        </div>
      </section>

      {/* R&D Simulation Tool */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Molecule list & parameters */}
        <div className="rounded-3xl border border-white/10 bg-[#0a1224] p-6 shadow-xl backdrop-blur-xl space-y-5">
          <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-white/5 pb-3">
            <Layers size={18} className="text-indigo-400" />
            Molécules en Screening
          </h3>

          <div className="space-y-2.5">
            {MOLECULES.map(mol => {
              const isSelected = selectedMolecule.id === mol.id;
              return (
                <button
                  key={mol.id}
                  onClick={() => {
                    setSelectedMolecule(mol);
                    setDosage(mol.id === "metformin" ? 500 : mol.id === "repatha" ? 140 : 100);
                  }}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-500/10 text-white"
                      : "border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02] text-gray-400"
                  }`}
                >
                  <h4 className="text-xs font-bold text-white leading-tight">{mol.name}</h4>
                  <p className="text-[10px] text-gray-500 mt-1">Cible : {mol.target}</p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-[8px] bg-white/5 px-2 py-0.5 rounded text-gray-400 tracking-wider uppercase">
                      {mol.status}
                    </span>
                    <ChevronRight size={14} className="text-gray-500" />
                  </div>
                </button>
              );
            })}
          </div>

          <hr className="border-white/5" />

          {/* Parameters */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Paramètres de simulation</h4>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Dosage Quotidien</span>
                <span className="text-indigo-400 font-bold">{dosage} mg</span>
              </div>
              <input
                type="range"
                min={selectedMolecule.id === "metformin" ? "250" : "10"}
                max={selectedMolecule.id === "metformin" ? "2000" : "500"}
                step="10"
                value={dosage}
                onChange={(e) => setDosage(parseInt(e.target.value))}
                className="w-full accent-indigo-500 bg-white/5 rounded-lg appearance-none h-1.5"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Durée du traitement</span>
                <span className="text-indigo-400 font-bold">{duration} jours</span>
              </div>
              <input
                type="range"
                min="10"
                max="365"
                step="5"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full accent-indigo-500 bg-white/5 rounded-lg appearance-none h-1.5"
              />
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
            >
              {isSimulating ? "Simulation en cours..." : "Lancer la Simulation R&D"}
            </button>
          </div>
        </div>

        {/* Efficacy & Distribution Reports */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Radar Chart */}
          <div className="rounded-3xl border border-white/10 bg-[#0a1224] p-6 shadow-xl backdrop-blur-xl">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
              <div>
                <h3 className="font-bold text-white text-base">Efficacité Thérapeutique Simulée</h3>
                <p className="text-xs text-gray-400">Modélisation de l'impact sur le vieillissement cellulaire et la clairance de biomarqueurs.</p>
              </div>
              {simRunCount > 0 && (
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full animate-pulse border border-emerald-500/20">
                  ✓ Run #{simRunCount} exécuté avec succès
                </span>
              )}
            </div>

            <div className="h-[300px] w-full flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis dataKey="subject" stroke="#9ca3af" fontSize={10} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.1)" fontSize={9} />
                  <Radar name="Simulation Active" dataKey="A" stroke="#818cf8" fill="#818cf8" fillOpacity={0.4} />
                  <Radar name="Groupe Contrôle (Placebo)" dataKey="B" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} />
                  <Tooltip contentStyle={{ backgroundColor: "#0a0f1d", borderColor: "rgba(255,255,255,0.1)", color: "#c8d6e5" }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Geo Biomarkers distribution bar charts */}
          <div className="rounded-3xl border border-white/10 bg-[#0a1224] p-6 shadow-xl backdrop-blur-xl">
            <h3 className="font-bold text-white text-base mb-5 flex items-center gap-2">
              <Map size={18} className="text-indigo-400" />
              Répartition des Biomarqueurs par Région (Maroc)
            </h3>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={geoData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#0a0f1d", borderColor: "rgba(255,255,255,0.1)", color: "#c8d6e5" }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="ApoB_Moyen" fill="#3b82f6" name="ApoB Moyen (mg/dL)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="hsCRP_Moyen" fill="#f59e0b" name="hs-CRP Moyen (mg/L)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="HbA1c_Moyen" fill="#10b981" name="HbA1c Moyen (%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
