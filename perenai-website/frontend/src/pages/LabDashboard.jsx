import { useState, useEffect } from "react";
import { DemoBanner } from "../components/DemoBanner";
import { 
  FlaskConical, 
  Send, 
  MapPin, 
  UserPlus, 
  Users, 
  Check, 
  Calendar,
  AlertCircle,
  FileSpreadsheet
} from "lucide-react";
import LabMap from "../components/LabMap";

const INITIAL_REQUESTS = [
  { id: 201, patientName: "Fatima Ezzahrae", patientEmail: "fatima@foreveryoung.com", doctorName: "Dr. Alami", biomarkersRequested: ["HbA1c", "ApoB", "hs-CRP", "Vitamin D"], status: "En attente", date: "18/06/2026" },
  { id: 202, patientName: "Bouchra El Fassi", patientEmail: "bouchra@foreveryoung.com", doctorName: "Dr. Benjelloun", biomarkersRequested: ["hs-CRP", "Vitamin D"], status: "En attente", date: "17/06/2026" }
];

const INITIAL_DOCTORS = [
  { id: 301, name: "Dr. Youssef Alami", specialty: "Cardiologue du Sport", email: "alami@peren.ai" },
  { id: 302, name: "Dr. Leila Benjelloun", specialty: "Spécialiste Longévité", email: "benjelloun@peren.ai" }
];

export default function LabDashboard() {
  const [requests, setRequests] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Forms
  const [docName, setDocName] = useState("");
  const [docSpecialty, setDocSpecialty] = useState("Généraliste");
  const [docEmail, setDocEmail] = useState("");
  
  // Biological results entry
  const [hba1c, setHba1c] = useState("5.2");
  const [apob, setApob] = useState("85");
  const [crp, setCrp] = useState("0.9");
  const [vitD, setVitD] = useState("45");

  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    // Load requests
    const storedRequests = localStorage.getItem("peren_blood_requests");
    if (storedRequests) {
      try {
        setRequests(JSON.parse(storedRequests));
      } catch (e) {
        setRequests(INITIAL_REQUESTS);
      }
    } else {
      localStorage.setItem("peren_blood_requests", JSON.stringify(INITIAL_REQUESTS));
      setRequests(INITIAL_REQUESTS);
    }

    // Load partner doctors
    const storedDocs = localStorage.getItem("peren_partner_doctors");
    if (storedDocs) {
      try {
        setDoctors(JSON.parse(storedDocs));
      } catch (e) {
        setDoctors(INITIAL_DOCTORS);
      }
    } else {
      localStorage.setItem("peren_partner_doctors", JSON.stringify(INITIAL_DOCTORS));
      setDoctors(INITIAL_DOCTORS);
    }
  }, []);

  const handleAddDoctor = (e) => {
    e.preventDefault();
    if (!docName || !docEmail) {
      alert("Veuillez saisir le nom et l'email du médecin.");
      return;
    }

    const newDoc = {
      id: Date.now(),
      name: docName,
      specialty: docSpecialty,
      email: docEmail
    };

    const updated = [...doctors, newDoc];
    setDoctors(updated);
    localStorage.setItem("peren_partner_doctors", JSON.stringify(updated));

    setDocName("");
    setDocEmail("");
    showToast(`Médecin "${newDoc.name}" ajouté aux partenaires.`);
  };

  const handleSendResults = (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    // Build the format expected by the BloodTestPage
    const getStatusColor = (status) => {
      if (status === "optimal") return "text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/10";
      if (status === "borderline" || status === "suboptimal" || status === "moderate") return "text-orange-400 border-orange-400/30 bg-orange-400/10";
      return "text-[#fca5a5] border-[#fca5a5]/30 bg-[#fca5a5]/10";
    };

    const hba1cStatus = parseFloat(hba1c) < 5.7 ? "optimal" : "borderline";
    const apobStatus = parseInt(apob) < 90 ? "optimal" : "elevated";
    const crpStatus = parseFloat(crp) < 1.0 ? "optimal" : parseFloat(crp) < 2.0 ? "moderate" : "elevated";
    const vitDStatus = parseFloat(vitD) >= 40 && parseFloat(vitD) <= 60 ? "optimal" : parseFloat(vitD) >= 30 ? "suboptimal" : "low";

    const updatedBiomarkers = [
      { marker: "HbA1c", value: `${hba1c}%`, ref: "< 5.7%", status: hba1cStatus, color: getStatusColor(hba1cStatus) },
      { marker: "ApoB", value: `${apob} mg/dL`, ref: "< 90 mg/dL", status: apobStatus, color: getStatusColor(apobStatus) },
      { marker: "hs-CRP", value: `${crp} mg/L`, ref: "< 1.0 mg/L", status: crpStatus, color: getStatusColor(crpStatus) },
      { marker: "Vitamin D", value: `${vitD} ng/mL`, ref: "40-60 ng/mL", status: vitDStatus, color: getStatusColor(vitDStatus) },
    ];

    // Store in patient's unique biomarkers key
    const patientEmail = selectedRequest.patientEmail || "guest";
    localStorage.setItem(`peren_biomarkers_${patientEmail}`, JSON.stringify(updatedBiomarkers));
    
    // Also store blood test completed flag
    const key = `peren_blood_test_completed:${patientEmail}`;
    localStorage.setItem(key, "true");

    // Update request status
    const updatedRequests = requests.map(req => {
      if (req.id === selectedRequest.id) {
        return { ...req, status: "Résultats envoyés" };
      }
      return req;
    });

    setRequests(updatedRequests);
    localStorage.setItem("peren_blood_requests", JSON.stringify(updatedRequests));

    setSelectedRequest(null);
    showToast(`Résultats d'analyses envoyés à ${selectedRequest.patientName}.`);
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 pb-12 text-[#c8d6e5]">
      <DemoBanner>Demandes d'analyses et médecins partenaires stockés localement (API laboratoire à venir).</DemoBanner>
      {/* Page Header */}
      <section className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-[11px] font-semibold text-purple-400">
            <FlaskConical size={12} />
            Espace Laboratoire Partenaire
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Saisie de Bilans Biologiques
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Gérez les demandes de tests sanguins reçues et transmettez les résultats d'analyses biologiques.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Blood Test Requests */}
        <div className="md:col-span-2 rounded-3xl border border-white/10 bg-[#0a1224] p-6 shadow-xl backdrop-blur-xl flex flex-col h-[550px]">
          <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-purple-400" />
            Demandes de tests sanguins reçues
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
            {requests.length > 0 ? (
              requests.map((req) => (
                <div key={req.id} className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 flex flex-wrap justify-between items-start gap-4 hover:border-white/10 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{req.patientName}</span>
                      <span className="text-[10px] text-gray-500 font-mono">({req.patientEmail})</span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      Prescrit par : <span className="text-white font-medium">{req.doctorName}</span> · Reçu le {req.date}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {req.biomarkersRequested.map((b) => (
                        <span key={b} className="rounded bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[8px] font-bold text-purple-300 uppercase">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      req.status === "En attente" 
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}>
                      {req.status}
                    </span>

                    {req.status === "En attente" && (
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-purple-700 active:scale-95 transition-all"
                      >
                        Saisir résultats
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 grid place-items-center text-center text-gray-500 border border-dashed border-white/5 rounded-2xl p-8">
                <p>Aucune demande de test biologique en cours.</p>
              </div>
            )}
          </div>
        </div>

        {/* Doctor Partners Column */}
        <div className="rounded-3xl border border-white/10 bg-[#0a1224] p-5 shadow-xl backdrop-blur-xl flex flex-col h-[550px]">
          <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
            <Users size={18} className="text-blue-400" />
            Médecins partenaires
          </h3>

          {/* Form */}
          <form onSubmit={handleAddDoctor} className="space-y-3 shrink-0 border-b border-white/5 pb-4 mb-4">
            <input
              type="text"
              required
              placeholder="Nom du médecin (ex: Dr. Alami)"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Spécialité (ex: Cardiologue)"
                value={docSpecialty}
                onChange={(e) => setDocSpecialty(e.target.value)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
              />
              <input
                type="email"
                required
                placeholder="Email"
                value={docEmail}
                onChange={(e) => setDocEmail(e.target.value)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-500 py-2 text-xs font-bold text-white hover:bg-blue-600 active:scale-95 transition-all"
            >
              <UserPlus size={14} /> Lier un médecin
            </button>
          </form>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
            {doctors.map(doc => (
              <div key={doc.id} className="rounded-xl border border-white/5 bg-white/[0.01] p-3 text-xs flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-white">{doc.name}</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">{doc.specialty}</p>
                </div>
                <span className="text-[10px] text-blue-400 font-mono">{doc.email}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Map Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <MapPin size={18} className="text-blue-400" />
          Carte des laboratoires affiliés
        </h3>
        <LabMap />
      </section>

      {/* Enter Results Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <form onSubmit={handleSendResults} className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0f1d] p-8 shadow-2xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">Saisie des Résultats</h3>
              <p className="text-xs text-gray-400">Patient: {selectedRequest.patientName} ({selectedRequest.patientEmail})</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">HbA1c (%)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={hba1c}
                  onChange={(e) => setHba1c(e.target.value)}
                  placeholder="ex: 5.3"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">ApoB (mg/dL)</label>
                <input
                  type="number"
                  required
                  value={apob}
                  onChange={(e) => setApob(e.target.value)}
                  placeholder="ex: 82"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">hs-CRP (mg/L)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={crp}
                  onChange={(e) => setCrp(e.target.value)}
                  placeholder="ex: 0.7"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Vitamin D (ng/mL)</label>
                <input
                  type="number"
                  required
                  value={vitD}
                  onChange={(e) => setVitD(e.target.value)}
                  placeholder="ex: 48"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="flex-1 rounded-xl border border-white/5 bg-white/5 py-3 text-xs font-bold text-gray-300 hover:bg-white/10 active:scale-95 transition-all"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-purple-600 py-3 text-xs font-bold text-white shadow-lg shadow-purple-500/20 hover:bg-purple-700 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Send size={14} /> Envoyer Résultats
              </button>
            </div>
          </form>
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
