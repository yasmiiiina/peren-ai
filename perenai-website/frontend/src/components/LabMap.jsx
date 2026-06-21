import { useEffect, useRef, useState } from "react";
import { Plus, MapPin, Check, Layers } from "lucide-react";

const DEFAULT_LABS = [
  { id: 1, name: "Laboratoire Peren AI - Casablanca", city: "Casablanca", address: "145 Boulevard d'Anfa", lat: 33.5731, lng: -7.5898 },
  { id: 2, name: "Laboratoire Peren AI - Rabat", city: "Rabat", address: "12 Avenue Mohammed V", lat: 34.0209, lng: -6.8416 },
  { id: 3, name: "Laboratoire Peren AI - Marrakech", city: "Marrakech", address: "Avenue Mohammed VI, Guéliz", lat: 31.6295, lng: -7.9811 },
  { id: 4, name: "Laboratoire Peren AI - Fès", city: "Fès", address: "Route d'Imouzzer", lat: 34.0181, lng: -5.0078 },
  { id: 5, name: "Laboratoire Peren AI - Tanger", city: "Tanger", address: "Boulevard Pasteur", lat: 35.7595, lng: -5.8340 }
];

export default function LabMap({ onLabSelect }) {
  const mapRef = useRef(null);
  const leafletMapInstance = useRef(null);
  const markersGroup = useRef(null);
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  
  // Add lab form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [labName, setLabName] = useState("");
  const [city, setCity] = useState("Casablanca");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Load labs from localStorage
  const loadLabs = () => {
    const stored = localStorage.getItem("peren_laboratories");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return DEFAULT_LABS;
      }
    }
    localStorage.setItem("peren_laboratories", JSON.stringify(DEFAULT_LABS));
    return DEFAULT_LABS;
  };

  useEffect(() => {
    const loadedLabs = loadLabs();
    setLabs(loadedLabs);
  }, []);

  // Initialize and update map markers
  useEffect(() => {
    // If Leaflet is not loaded on window, wait
    if (!window.L || !mapRef.current) return;

    // Create map instance if it doesn't exist
    if (!leafletMapInstance.current) {
      const map = window.L.map(mapRef.current, {
        center: [33.0, -7.0], // Center of Morocco
        zoom: 6,
        zoomControl: false,
        attributionControl: false
      });

      // Add zoom control at bottom-right
      window.L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Dark Matter CartoDB tiles (very premium dark skin)
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(map);

      leafletMapInstance.current = map;
      markersGroup.current = window.L.layerGroup().addTo(map);
    }

    const map = leafletMapInstance.current;
    const markers = markersGroup.current;

    // Clear existing markers
    markers.clearLayers();

    // Custom pulsing HTML marker icon
    const createCustomIcon = (name) => {
      return window.L.divIcon({
        className: 'custom-map-marker-container',
        html: `<div class="relative flex items-center justify-center h-8 w-8">
                 <div class="absolute inset-0 rounded-full bg-blue-500/20 border border-blue-500/50 animate-pulse"></div>
                 <div class="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
    };

    // Add labs to map
    labs.forEach((lab) => {
      if (!lab.lat || !lab.lng) return;

      const marker = window.L.marker([lab.lat, lab.lng], {
        icon: createCustomIcon(lab.name)
      });

      marker.bindPopup(`
        <div style="font-family: sans-serif; color: #0f172a; padding: 4px;">
          <h4 style="margin: 0 0 4px 0; font-weight: bold; font-size: 13px;">${lab.name}</h4>
          <p style="margin: 0; font-size: 11px; color: #64748b;">${lab.address}, ${lab.city}</p>
          <button id="select-lab-${lab.id}" style="margin-top: 8px; border: none; background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; cursor: pointer; display: block; width: 100%;">
            Choisir ce laboratoire
          </button>
        </div>
      `, { closeButton: false });

      marker.on('popupopen', () => {
        // Register button callback inside popup
        setTimeout(() => {
          const btn = document.getElementById(`select-lab-${lab.id}`);
          if (btn) {
            btn.onclick = () => {
              setSelectedLab(lab);
              if (onLabSelect) onLabSelect(lab);
              map.closePopup();
            };
          }
        }, 10);
      });

      markers.addLayer(marker);
    });

    // Auto-fit bounds if we have labs
    if (labs.length > 0) {
      const group = new window.L.featureGroup(
        labs.map(l => window.L.marker([l.lat, l.lng]))
      );
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [labs]);

  const handleAddLabSubmit = (e) => {
    e.preventDefault();
    if (!labName || !address) {
      alert("Veuillez remplir le nom et l'adresse.");
      return;
    }

    // Generate random coordinates near center of selected city if not supplied
    let finalLat = parseFloat(lat);
    let finalLng = parseFloat(lng);

    if (isNaN(finalLat) || isNaN(finalLng)) {
      // Casablanca coords fallback with slight offset
      let baseLat = 33.5731;
      let baseLng = -7.5898;
      
      if (city === "Rabat") { baseLat = 34.0209; baseLng = -6.8416; }
      else if (city === "Marrakech") { baseLat = 31.6295; baseLng = -7.9811; }
      else if (city === "Fès") { baseLat = 34.0181; baseLng = -5.0078; }
      else if (city === "Tanger") { baseLat = 35.7595; baseLng = -5.8340; }

      finalLat = baseLat + (Math.random() - 0.5) * 0.05;
      finalLng = baseLng + (Math.random() - 0.5) * 0.05;
    }

    const newLab = {
      id: Date.now(),
      name: labName,
      city,
      address,
      lat: finalLat,
      lng: finalLng
    };

    const updatedLabs = [...labs, newLab];
    setLabs(updatedLabs);
    localStorage.setItem("peren_laboratories", JSON.stringify(updatedLabs));

    setSuccessMsg(`Laboratoire "${labName}" ajouté avec succès !`);
    setLabName("");
    setAddress("");
    setLat("");
    setLng("");
    setIsFormOpen(false);

    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const centerOnLab = (lab) => {
    if (leafletMapInstance.current) {
      leafletMapInstance.current.setView([lab.lat, lab.lng], 13);
      setSelectedLab(lab);
      if (onLabSelect) onLabSelect(lab);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* List Panel */}
      <div className="flex flex-col rounded-3xl border border-white/10 bg-[#0a1224] p-5 shadow-xl backdrop-blur-xl h-[450px]">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Layers size={18} className="text-blue-400" />
            Laboratoires Partenaires
          </h3>
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 active:scale-95 transition-all"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Labs List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1">
          {labs.map((lab) => {
            const isSelected = selectedLab?.id === lab.id;
            return (
              <button
                key={lab.id}
                onClick={() => centerOnLab(lab)}
                className={`w-full text-left rounded-xl border p-3.5 transition-all flex items-start gap-3 ${
                  isSelected
                    ? "border-blue-500 bg-blue-500/10 text-white"
                    : "border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02] text-gray-400 hover:text-white"
                }`}
              >
                <div className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${isSelected ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400'}`}>
                  <MapPin size={14} />
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight text-white">{lab.name}</h4>
                  <p className="text-[10px] text-gray-500 mt-1">{lab.address}</p>
                  <span className="inline-block mt-1.5 rounded-full bg-white/5 px-2 py-0.5 text-[8px] font-bold text-gray-400 tracking-wider uppercase">
                    {lab.city}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Container & Form */}
      <div className="lg:col-span-2 relative rounded-3xl border border-white/10 overflow-hidden h-[450px] bg-[#02050f]">
        {/* Leaflet container */}
        <div ref={mapRef} className="w-full h-full relative z-10" />

        {/* Add Lab Form Modal-like Overlay */}
        {isFormOpen && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <form onSubmit={handleAddLabSubmit} className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0f1d] p-6 shadow-2xl space-y-4">
              <h3 className="font-bold text-white text-base">Ajouter un Laboratoire</h3>
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Nom du laboratoire</label>
                <input
                  type="text"
                  required
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  placeholder="ex: Laboratoire Pasteur"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Ville</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0a0f1d] px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="Casablanca">Casablanca</option>
                    <option value="Rabat">Rabat</option>
                    <option value="Marrakech">Marrakech</option>
                    <option value="Fès">Fès</option>
                    <option value="Tanger">Tanger</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Adresse</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="ex: Rue 45, Mers Sultan"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Latitude (Optionnel)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="ex: 33.573"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Longitude (Optionnel)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    placeholder="ex: -7.589"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 rounded-xl border border-white/5 bg-white/5 py-2 text-xs font-bold text-gray-300 hover:bg-white/10 active:scale-95 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-blue-500 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600 active:scale-95 transition-all"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-emerald-500/90 px-4 py-3 text-xs font-bold text-white shadow-xl shadow-emerald-500/20 backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300">
          <Check size={16} />
          {successMsg}
        </div>
      )}
    </div>
  );
}
