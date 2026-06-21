import { useState } from "react";
import { DemoBanner } from "../components/DemoBanner";
import { 
  Database, 
  Search, 
  Download, 
  Filter, 
  BarChart4, 
  TrendingUp, 
  Users, 
  Compass,
  FileSpreadsheet
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
  LineChart,
  Line
} from "recharts";

const DATASETS = [
  { id: 1, name: "Moroccan Biomarkers Longitudinal Study (Anonymisé)", size: "15,240 dossiers", date: "12/05/2026", description: "Profils biologiques complets (ApoB, HbA1c, hs-CRP, Vit D) avec données démographiques sur 5 villes du Maroc." },
  { id: 2, name: "Circadian Rhythm & Cardiovascular Health Wearables", size: "4,850 dossiers", date: "28/04/2026", description: "Corrélations anonymisées entre les heures de sommeil profond, l'activité physique et la variabilité cardiaque (VFC)." },
  { id: 3, name: "Digital Twin Biological Aging Cohort", size: "8,920 dossiers", date: "15/04/2026", description: "Trajectoires d'âge biologique simulées par IA, prédiction de maladies chroniques et résultats de protocoles." }
];

export default function ResearchDashboard() {
  const [selectedDataset, setSelectedDataset] = useState(DATASETS[0]);
  
  // Cohort filter states
  const [minAge, setMinAge] = useState(20);
  const [maxAge, setMaxAge] = useState(65);
  const [gender, setGender] = useState("Tous");
  const [biomarkerFilter, setBiomarkerFilter] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const [cohortSize, setCohortSize] = useState(4820);

  // Chart data that shifts slightly according to filters to look real
  const getChartData = () => {
    let multiplier = 1.0;
    if (gender === "Female") multiplier = 0.95;
    if (gender === "Male") multiplier = 1.05;
    if (biomarkerFilter === "hba1c") multiplier *= 1.15;
    
    return [
      { name: "20-29 ans", Patients: Math.round(1200 * multiplier), AgeBiologiqueMoyen: 24.5 },
      { name: "30-39 ans", Patients: Math.round(1800 * multiplier), AgeBiologiqueMoyen: 35.2 },
      { name: "40-49 ans", Patients: Math.round(2200 * multiplier), AgeBiologiqueMoyen: 47.8 },
      { name: "50-59 ans", Patients: Math.round(1500 * multiplier), AgeBiologiqueMoyen: 59.4 },
      { name: "60+ ans", Patients: Math.round(900 * multiplier), AgeBiologiqueMoyen: 71.1 }
    ];
  };

  const handleGenerateCohort = () => {
    setIsGenerating(true);
    setTimeout(() => {
      // Simulate size calculation
      const baseCount = gender === "Tous" ? 6400 : 3200;
      const ageRangeFrac = (maxAge - minAge) / 60;
      const biomarkerFrac = biomarkerFilter === "all" ? 1.0 : 0.35;
      const size = Math.round(baseCount * ageRangeFrac * biomarkerFrac);
      setCohortSize(size);
      setIsGenerating(false);
    }, 1200);
  };

  const downloadDataset = (datasetName) => {
    // Mock CSV creation
    const csvContent = "data:text/csv;charset=utf-8,ID,Age,Gender,HbA1c,ApoB,hsCRP,VitD,City\n" +
      "1,34,F,5.2,85,0.8,45,Casablanca\n" +
      "2,42,M,6.1,110,2.1,28,Rabat\n" +
      "3,28,F,4.9,72,0.4,52,Marrakech";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${datasetName.replace(/\s+/g, "_")}_anonymized.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartData = getChartData();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-12 text-[#c8d6e5]">
      <DemoBanner>Jeux de données et exports CSV sont des démonstrations locales (API recherche à venir).</DemoBanner>
      {/* Page Header */}
      <section className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold text-blue-400">
            <Database size={12} />
            Espace Recherche Scientifique (B2B)
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Bases de données & Cohortes Synthétiques
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Accédez à des datasets de santé anonymisés, générez des cohortes de recherche et analysez les distributions.
          </p>
        </div>
      </section>

      {/* Grid: Datasets Explorer */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Dataset List Card */}
        <div className="rounded-3xl border border-white/10 bg-[#0a1224] p-6 shadow-xl backdrop-blur-xl lg:col-span-1 space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-blue-400" />
            Datasets disponibles
          </h3>
          
          <div className="space-y-3">
            {DATASETS.map((ds) => {
              const isSelected = selectedDataset.id === ds.id;
              return (
                <button
                  key={ds.id}
                  onClick={() => setSelectedDataset(ds)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-500/10 text-white"
                      : "border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02] text-gray-400"
                  }`}
                >
                  <h4 className="text-xs font-bold text-white leading-tight">{ds.name}</h4>
                  <p className="text-[10px] text-gray-500 mt-1">{ds.size} · Mis à jour le {ds.date}</p>
                </button>
              );
            })}
          </div>

          <div className="border-t border-white/5 pt-4 space-y-2">
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Description du dataset</h4>
            <p className="text-xs text-gray-400 leading-relaxed">{selectedDataset.description}</p>
            <button
              onClick={() => downloadDataset(selectedDataset.name)}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 active:scale-95 transition-all"
            >
              <Download size={14} /> Télécharger l'échantillon (CSV)
            </button>
          </div>
        </div>

        {/* Cohort Creator & Data Visualization */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Cohort Creator */}
          <div className="rounded-3xl border border-white/10 bg-[#0a1224] p-6 shadow-xl backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Filter size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-sans">Créateur de Cohorte de Recherche</h3>
                <p className="text-xs text-gray-400">Définissez des filtres précis pour extraire un sous-groupe anonyme de patients.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Tranche d'âge</label>
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="number"
                    value={minAge}
                    onChange={(e) => setMinAge(parseInt(e.target.value) || 18)}
                    className="w-14 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-center text-white"
                  />
                  <span className="text-gray-500">à</span>
                  <input
                    type="number"
                    value={maxAge}
                    onChange={(e) => setMaxAge(parseInt(e.target.value) || 80)}
                    className="w-14 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-center text-white"
                  />
                  <span className="text-gray-400">ans</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Genre</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0a1224] px-3 py-1.5 text-xs text-white"
                >
                  <option value="Tous">Tous</option>
                  <option value="Female">Féminin</option>
                  <option value="Male">Masculin</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Anomalie Biomarqueur</label>
                <select
                  value={biomarkerFilter}
                  onChange={(e) => setBiomarkerFilter(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0a1224] px-3 py-1.5 text-xs text-white"
                >
                  <option value="all">Aucun filtre strict</option>
                  <option value="hba1c">HbA1c élevé (&gt; 5.7%)</option>
                  <option value="apob">ApoB élevé (&gt; 90 mg/dL)</option>
                  <option value="crp">hs-CRP élevé (&gt; 1.0 mg/L)</option>
                  <option value="vitD">Vitamine D faible (&lt; 30 ng/mL)</option>
                </select>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between gap-4">
              <div className="text-xs">
                <span className="text-gray-500">Taille de la cohorte : </span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {isGenerating ? "Calcul..." : `${cohortSize} individus`}
                </span>
              </div>
              <button
                onClick={handleGenerateCohort}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:opacity-90 active:scale-95 transition-all"
              >
                {isGenerating ? "Génération en cours..." : "Générer la cohorte"}
              </button>
            </div>
          </div>

          {/* Data Charts */}
          <div className="rounded-3xl border border-white/10 bg-[#0a1224] p-6 shadow-xl backdrop-blur-xl">
            <h3 className="font-bold text-white text-base mb-5 flex items-center gap-2">
              <BarChart4 size={18} className="text-blue-400" />
              Répartition démographique & Âge Biologique Moyen
            </h3>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                  <YAxis yAxisId="left" stroke="#3b82f6" fontSize={11} label={{ value: 'Nombre de Patients', angle: -90, position: 'insideLeft', style: { fill: '#3b82f6', fontSize: '10px' } }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={11} label={{ value: 'Bio-Age Moyen (ans)', angle: 90, position: 'insideRight', style: { fill: '#10b981', fontSize: '10px' } }} />
                  <Tooltip contentStyle={{ backgroundColor: "#0a0f1d", borderColor: "rgba(255,255,255,0.1)", color: "#c8d6e5" }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar yAxisId="left" dataKey="Patients" fill="rgba(59, 130, 246, 0.75)" name="Effectif patient" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="AgeBiologiqueMoyen" stroke="#10b981" name="Âge bio moyen" strokeWidth={2.5} activeDot={{ r: 8 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
