import { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  FileText, 
  Activity, 
  ShieldAlert, 
  Map, 
  BrainCircuit, 
  Heart, 
  Droplet,
  Dna,
  Check,
  TrendingDown,
  Sparkles
} from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { DemoBanner } from "../components/DemoBanner";

const INITIAL_PATIENTS = [
  { id: 101, name: "Fatima Ezzahrae", email: "fatima@foreveryoung.com", phone: "+212 612-345678", city: "Casablanca", country: "Maroc", age: 28, wellnessScore: 88, faceScanStatus: "Partagé (il y a 2h)", biomarkers: { hba1c: "5.1%", apob: "82 mg/dL", crp: "0.7 mg/L", vitD: "48 ng/mL" } },
  { id: 102, name: "Bouchra El Fassi", email: "bouchra@foreveryoung.com", phone: "+212 654-987654", city: "Rabat", country: "Maroc", age: 34, wellnessScore: 74, faceScanStatus: "Partagé (il y a 1j)", biomarkers: { hba1c: "5.6%", apob: "94 mg/dL", crp: "1.8 mg/L", vitD: "32 ng/mL" } },
  { id: 103, name: "Adam Bennani", email: "adam@foreveryoung.com", phone: "+212 677-889900", city: "Marrakech", country: "Maroc", age: 42, wellnessScore: 61, faceScanStatus: "Partagé (il y a 3j)", biomarkers: { hba1c: "6.2%", apob: "112 mg/dL", crp: "2.4 mg/L", vitD: "22 ng/mL" } }
];

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [labs, setLabs] = useState([]);
  
  // Add Patient Form
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCity, setNewCity] = useState("Casablanca");
  const [newAge, setNewAge] = useState("30");
  
  // Lifestyle simulation sliders
  const [sunExposure, setSunExposure] = useState(0); // minutes extra
  const [weeklyExercise, setWeeklyExercise] = useState(0); // hours extra
  const [extraSleep, setExtraSleep] = useState(0); // hours extra

  // Recommendation & Report states
  const [selectedLabId, setSelectedLabId] = useState("");
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    // Load patients
    const storedPat = localStorage.getItem("peren_doctor_patients");
    if (storedPat) {
      try {
        const parsed = JSON.parse(storedPat);
        setPatients(parsed);
        if (parsed.length > 0) setSelectedPatient(parsed[0]);
      } catch (e) {
        setPatients(INITIAL_PATIENTS);
        setSelectedPatient(INITIAL_PATIENTS[0]);
      }
    } else {
      localStorage.setItem("peren_doctor_patients", JSON.stringify(INITIAL_PATIENTS));
      setPatients(INITIAL_PATIENTS);
      setSelectedPatient(INITIAL_PATIENTS[0]);
    }

    // Load labs for recommending
    const storedLabs = localStorage.getItem("peren_laboratories");
    if (storedLabs) {
      try {
        const parsed = JSON.parse(storedLabs);
        setLabs(parsed);
        if (parsed.length > 0) setSelectedLabId(parsed[0].id);
      } catch (e) {}
    }
  }, []);

  const handleAddPatient = (e) => {
    e.preventDefault();
    if (!newName || !newEmail) {
      alert("Veuillez remplir le nom et l'email.");
      return;
    }

    const newPat = {
      id: Date.now(),
      name: newName,
      email: newEmail,
      phone: newPhone || "+212 600-000000",
      city: newCity,
      country: "Maroc",
      age: parseInt(newAge) || 30,
      wellnessScore: 75,
      faceScanStatus: "Partagé (récent)",
      biomarkers: { hba1c: "5.4%", apob: "88 mg/dL", crp: "1.1 mg/L", vitD: "35 ng/mL" }
    };

    const updated = [...patients, newPat];
    setPatients(updated);
    localStorage.setItem("peren_doctor_patients", JSON.stringify(updated));
    setSelectedPatient(newPat);

    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setNewAge("30");
    setIsAddOpen(false);
    showToast(`Patient "${newPat.name}" ajouté avec succès.`);
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // Simulation calculations based on sliders
  const getSimulatedResults = () => {
    if (!selectedPatient) return { age: 0, injuryRisk: 0, chronicRisk: 0 };
    
    // Base scores
    const baseAge = selectedPatient.age;
    let simulatedAge = baseAge + 1.2; // default biological age slightly older
    let injuryRisk = 45; // baseline
    let chronicRisk = 30; // baseline

    // High HbA1c/CRP increases risk
    if (selectedPatient.biomarkers.hba1c.includes("6.")) chronicRisk += 25;
    if (parseFloat(selectedPatient.biomarkers.crp) > 2.0) injuryRisk += 20;

    // Apply positive modifications
    // Sun exposure increases Vitamin D, lowers chronic risk
    const vitDImprovement = sunExposure * 0.4;
    simulatedAge -= (sunExposure / 30) * 0.5;
    chronicRisk -= (sunExposure / 15) * 1.5;

    // Exercise improves muscle strength and heart risk
    simulatedAge -= weeklyExercise * 0.3;
    injuryRisk -= weeklyExercise * 2.5;
    chronicRisk -= weeklyExercise * 2.0;

    // Sleep lowers stress (CRP) and biological age
    simulatedAge -= extraSleep * 0.4;
    injuryRisk -= extraSleep * 3.0;
    chronicRisk -= extraRiskFactorLowering(extraSleep);

    return {
      biologicalAge: Math.max(baseAge - 5, parseFloat(simulatedAge.toFixed(1))),
      injuryRisk: Math.max(5, Math.min(95, Math.round(injuryRisk))),
      chronicRisk: Math.max(3, Math.min(95, Math.round(chronicRisk))),
      vitD: Math.min(100, Math.round(parseFloat(selectedPatient.biomarkers.vitD) + vitDImprovement))
    };
  };

  const extraRiskFactorLowering = (sleep) => {
    return sleep * 2.5;
  };

  const handleRecommendLab = () => {
    if (!selectedPatient || !selectedLabId) return;
    const lab = labs.find(l => String(l.id) === String(selectedLabId));
    if (!lab) return;

    // Create a blood test request in localStorage so the lab receives it
    const storedRequests = localStorage.getItem("peren_blood_requests") || "[]";
    let requests = [];
    try {
      requests = JSON.parse(storedRequests);
    } catch(e) {}

    const newRequest = {
      id: Date.now(),
      patientName: selectedPatient.name,
      patientEmail: selectedPatient.email,
      labName: lab.name,
      labId: lab.id,
      doctorName: user?.name || "Dr. Partenaire",
      biomarkersRequested: ["HbA1c", "ApoB", "hs-CRP", "Vitamin D"],
      status: "En attente",
      date: new Date().toLocaleDateString()
    };

    requests.push(newRequest);
    localStorage.setItem("peren_blood_requests", JSON.stringify(requests));
    
    showToast(`Prescription envoyée au laboratoire : ${lab.name}`);
  };

  const sim = getSimulatedResults();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-12 text-[#c8d6e5]">
      <DemoBanner>Données patients et prescriptions stockées localement (API clinique à venir).</DemoBanner>
      {/* Header */}
      <section className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400">
            <Activity size={12} />
            Espace Clinique / Portail Médecin
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Suivi et Simulations Patients
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Gérez vos patients, analysez leurs scans et simulez des trajectoires de santé préventives.
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
        >
          <UserPlus size={14} /> Ajouter un patient
        </button>
      </section>

      {/* Main Layout Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Patients Side Column */}
        <div className="flex flex-col rounded-3xl border border-white/10 bg-[#0a1224] p-5 shadow-xl backdrop-blur-xl h-[650px]">
          <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2 shrink-0">
            <Users size={18} className="text-blue-400" />
            File active ({patients.length} patients)
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {patients.map((pat) => {
              const isSelected = selectedPatient?.id === pat.id;
              return (
                <button
                  key={pat.id}
                  onClick={() => {
                    setSelectedPatient(pat);
                    // Reset sliders
                    setSunExposure(0);
                    setWeeklyExercise(0);
                    setExtraSleep(0);
                  }}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-500/10 text-white"
                      : "border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02] text-gray-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">{pat.name}</h4>
                    <span className="text-[9px] text-gray-500 font-mono">ID: {pat.id.toString().slice(-4)}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">{pat.email} · {pat.city}</p>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Score: {pat.wellnessScore}%
                    </span>
                    <span className="text-[8px] text-gray-400">
                      Scan: {pat.faceScanStatus.split(" ")[0]}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Patient Detail and Action Columns */}
        {selectedPatient ? (
          <div className="lg:col-span-2 space-y-6">
            
            {/* Biological State Card */}
            <div className="rounded-3xl border border-white/10 bg-[#0a1224] p-6 shadow-xl backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedPatient.name}</h2>
                  <p className="text-xs text-gray-400">
                    Âge: {selectedPatient.age} ans · Téléphone: {selectedPatient.phone} · Ville: {selectedPatient.city}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsReportOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 active:scale-95 transition-all"
                  >
                    <FileText size={14} /> Rapport de Santé
                  </button>
                </div>
              </div>

              {/* Biomarkers Shared via FaceScan & Blood Test */}
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Derniers Biomarqueurs partagés</h3>
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-3 text-center">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">HbA1c</span>
                  <p className="text-lg font-mono font-bold text-white mt-1">{selectedPatient.biomarkers.hba1c}</p>
                  <span className="text-[8px] text-gray-500">&lt; 5.7% (Réf)</span>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-3 text-center">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">ApoB</span>
                  <p className="text-lg font-mono font-bold text-white mt-1">{selectedPatient.biomarkers.apob}</p>
                  <span className="text-[8px] text-gray-500">&lt; 90 mg/dL</span>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-3 text-center">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">hs-CRP</span>
                  <p className="text-lg font-mono font-bold text-white mt-1">{selectedPatient.biomarkers.crp}</p>
                  <span className="text-[8px] text-gray-500">&lt; 1.0 mg/L</span>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-3 text-center">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Vitamine D</span>
                  <p className="text-lg font-mono font-bold text-white mt-1">{selectedPatient.biomarkers.vitd || selectedPatient.biomarkers.vitD}</p>
                  <span className="text-[8px] text-gray-500">40-60 ng/mL</span>
                </div>
              </div>
            </div>

            {/* Simulations Panel */}
            <div className="rounded-3xl border border-blue-500/10 bg-[#0a1224] p-6 shadow-xl backdrop-blur-xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <BrainCircuit size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Simulateur d'impact & Scénarios de risques</h3>
                  <p className="text-xs text-gray-400">Ajustez les habitudes de vie pour projeter l'évolution de l'âge biologique et des risques.</p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                
                {/* Sliders */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-300">Exposition Solaire</span>
                      <span className="text-blue-400">+{sunExposure} min/jour</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      step="5"
                      value={sunExposure}
                      onChange={(e) => setSunExposure(parseInt(e.target.value))}
                      className="w-full accent-blue-500 bg-white/5 rounded-lg appearance-none h-1.5"
                    />
                    <p className="text-[9px] text-gray-500">Soutient la synthèse endogène de Vitamine D</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-300">Activité Physique (Zone 2)</span>
                      <span className="text-blue-400">+{weeklyExercise}h / semaine</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={weeklyExercise}
                      onChange={(e) => setWeeklyExercise(parseFloat(e.target.value))}
                      className="w-full accent-blue-500 bg-white/5 rounded-lg appearance-none h-1.5"
                    />
                    <p className="text-[9px] text-gray-500">Améliore la clairance des toxines et densifie les mitochondries</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-300">Sommeil réparateur</span>
                      <span className="text-blue-400">+{extraSleep}h / nuit</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      step="0.5"
                      value={extraSleep}
                      onChange={(e) => setExtraSleep(parseFloat(e.target.value))}
                      className="w-full accent-blue-500 bg-white/5 rounded-lg appearance-none h-1.5"
                    />
                    <p className="text-[9px] text-gray-500">Diminue la hs-CRP (inflammation systémique)</p>
                  </div>
                </div>

                {/* Projection Results */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Projections à 3 mois</h4>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Âge Biologique :</span>
                    <div className="text-right">
                      <span className="text-lg font-bold text-emerald-400 font-mono">{sim.biologicalAge} ans</span>
                      <p className="text-[9px] text-gray-500">Réel: {selectedPatient.age} ans</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Risque de Blessure (cardio/muscle) :</span>
                      <span className="font-bold font-mono" style={{ color: sim.injuryRisk < 30 ? "#10b981" : sim.injuryRisk < 60 ? "#f59e0b" : "#ef4444" }}>
                        {sim.injuryRisk}%
                      </span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${sim.injuryRisk}%`,
                          backgroundColor: sim.injuryRisk < 30 ? "#10b981" : sim.injuryRisk < 60 ? "#f59e0b" : "#ef4444" 
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Risque de Maladie Chronique :</span>
                      <span className="font-bold font-mono" style={{ color: sim.chronicRisk < 35 ? "#10b981" : sim.chronicRisk < 60 ? "#f59e0b" : "#ef4444" }}>
                        {sim.chronicRisk}%
                      </span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ 
                          width: `${sim.chronicRisk}%`, 
                          backgroundColor: sim.chronicRisk < 35 ? "#10b981" : sim.chronicRisk < 60 ? "#f59e0b" : "#ef4444"
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-400">Projeté Vitamine D :</span>
                    <span className="font-bold text-emerald-400 font-mono">{sim.vitD} ng/mL</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Recommend Lab Panel */}
            <div className="rounded-3xl border border-white/10 bg-[#0a1224] p-6 shadow-xl backdrop-blur-xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                  <Map size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Recommander un Laboratoire</h3>
                  <p className="text-xs text-gray-400">Envoyez une demande de bilan biologique directement aux laboratoires partenaires.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedLabId}
                  onChange={(e) => setSelectedLabId(e.target.value)}
                  className="flex-1 rounded-xl border border-white/10 bg-[#0a1224] px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                >
                  {labs.map(lab => (
                    <option key={lab.id} value={lab.id}>{lab.name} ({lab.city})</option>
                  ))}
                </select>
                <button
                  onClick={handleRecommendLab}
                  className="rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/20 hover:bg-purple-700 active:scale-95 transition-all"
                >
                  Envoyer la Recommandation
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div className="lg:col-span-2 rounded-3xl border border-dashed border-white/10 bg-white/[0.01] grid place-items-center p-12 text-center text-gray-500 h-[400px]">
            <p>Veuillez sélectionner ou ajouter un patient pour afficher son dossier.</p>
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <form onSubmit={handleAddPatient} className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0f1d] p-8 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-white">Nouveau Patient</h3>
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Nom & Prénom</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ex: Adam Foulane"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Email</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="ex: patient@peren.ai"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Téléphone</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="ex: +212 600..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Âge</label>
                <input
                  type="number"
                  value={newAge}
                  onChange={(e) => setNewAge(e.target.value)}
                  placeholder="ex: 34"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Ville</label>
              <input
                type="text"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                placeholder="ex: Casablanca"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="flex-1 rounded-xl border border-white/5 bg-white/5 py-3 text-xs font-bold text-gray-300 hover:bg-white/10 active:scale-95 transition-all"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-blue-500 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 active:scale-95 transition-all"
              >
                Ajouter
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Health Report Modal (Pop-up Printable) */}
      {isReportOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#080d19] p-8 shadow-2xl text-left space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            {/* Report Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <img src="/Frame 2.svg" alt="Peren AI Logo" className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-widest uppercase">PEREN AI · CLINICAL REPORT</h3>
                  <p className="text-[9px] text-gray-500 font-mono">Date de génération: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <button
                onClick={() => setIsReportOpen(false)}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-white"
              >
                Fermer
              </button>
            </div>

            {/* Patient Credentials */}
            <div className="grid grid-cols-2 gap-4 rounded-2xl bg-white/[0.02] border border-white/5 p-4 text-xs">
              <div>
                <p className="text-gray-500 uppercase font-bold tracking-wider text-[8px]">Dossier Patient</p>
                <p className="font-bold text-white text-sm mt-1">{selectedPatient.name}</p>
                <p className="text-gray-400 mt-1">Âge: {selectedPatient.age} ans | Ville: {selectedPatient.city}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 uppercase font-bold tracking-wider text-[8px]">Médecin Référent</p>
                <p className="font-bold text-white text-sm mt-1">{user?.name || "Médecin Partenaire"}</p>
                <p className="text-gray-400 mt-1">{user?.email}</p>
              </div>
            </div>

            {/* Biomarker Summary Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Bilan des Biomarqueurs & Références</h4>
              <div className="rounded-2xl border border-white/5 bg-white/[0.01] overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-black/25 text-gray-500 uppercase tracking-widest text-[8px]">
                    <tr>
                      <th className="px-4 py-2">Marqueur</th>
                      <th className="px-4 py-2">Valeur Relevée</th>
                      <th className="px-4 py-2">Intervalle de Référence</th>
                      <th className="px-4 py-2">Statut clinique</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    <tr>
                      <td className="px-4 py-3 font-semibold text-white">HbA1c</td>
                      <td className="px-4 py-3 font-mono">{selectedPatient.biomarkers.hba1c}</td>
                      <td className="px-4 py-3 font-mono">&lt; 5.7%</td>
                      <td className="px-4 py-3 text-emerald-400 font-bold">Optimal</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-white">ApoB</td>
                      <td className="px-4 py-3 font-mono">{selectedPatient.biomarkers.apob}</td>
                      <td className="px-4 py-3 font-mono">&lt; 90 mg/dL</td>
                      <td className="px-4 py-3 text-orange-400 font-bold">Limite supérieure</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-white">hs-CRP</td>
                      <td className="px-4 py-3 font-mono">{selectedPatient.biomarkers.crp}</td>
                      <td className="px-4 py-3 font-mono">&lt; 1.0 mg/L</td>
                      <td className="px-4 py-3 text-orange-400 font-bold">Inflammation modérée</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-white">Vitamine D</td>
                      <td className="px-4 py-3 font-mono">{selectedPatient.biomarkers.vitd || selectedPatient.biomarkers.vitD}</td>
                      <td className="px-4 py-3 font-mono">40 - 60 ng/mL</td>
                      <td className="px-4 py-3 text-red-400 font-bold">Carence</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Risk Scenarios & Projections */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Scénarios de Risques & Projections à 3 mois</h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 text-center">
                  <span className="text-[9px] text-gray-500 font-bold uppercase">Âge Biologique Projeté</span>
                  <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{sim.biologicalAge} ans</p>
                  <p className="text-[8px] text-gray-500 mt-1">Chronologique: {selectedPatient.age} ans</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 text-center">
                  <span className="text-[9px] text-gray-500 font-bold uppercase">Risque Cardio & Chronique</span>
                  <p className="text-xl font-bold font-mono mt-1 text-orange-400">{sim.chronicRisk}%</p>
                  <p className="text-[8px] text-gray-500 mt-1">Modéré à faible en ajustant</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 text-center">
                  <span className="text-[9px] text-gray-500 font-bold uppercase">Risque Musculo-Squelettique</span>
                  <p className="text-xl font-bold font-mono mt-1 text-red-400">{sim.injuryRisk}%</p>
                  <p className="text-[8px] text-gray-500 mt-1">Soutenu par surcharge</p>
                </div>
              </div>
            </div>

            {/* Clinician Signature Section */}
            <div className="border-t border-white/10 pt-4 flex justify-between items-end text-xs text-gray-400">
              <div>
                <p>Signature numérique Peren AI</p>
                <p className="font-mono text-[8px] text-gray-500 mt-1">VERIFYKEY-77291-ALPHA-PERENAI</p>
              </div>
              <div className="text-right">
                <div className="h-10 w-28 border border-dashed border-white/10 rounded-lg flex items-center justify-center text-[10px] text-gray-500">
                  Cachet Médecin
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => window.print()}
                className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-2.5 text-xs font-bold text-white hover:opacity-90 transition-all active:scale-95 text-center"
              >
                Imprimer le rapport clinique
              </button>
            </div>

          </div>
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-emerald-500/90 px-4 py-3 text-xs font-bold text-white shadow-xl shadow-emerald-500/20 backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300">
          <Check size={16} />
          {toastMsg}
        </div>
      )}

    </div>
  );
}
