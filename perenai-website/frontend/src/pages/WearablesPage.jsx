import { useState } from "react";
import { Watch, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { getWearableConnection, setWearableConnection } from "../utils/dashboardState";

// ── Highly Stylized Clinical SVG Logos ───────────────────────────────────

function AppleHealthIcon() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 drop-shadow-[0_0_8px_rgba(255,23,68,0.3)]">
      <defs>
        <linearGradient id="appleHealthGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff5a79" />
          <stop offset="100%" stopColor="#ff1744" />
        </linearGradient>
      </defs>
      <path d="M50 82C50 82 15 58 15 35C15 21 26 12 37.5 12C44.5 12 48.5 15.5 50 17C51.5 15.5 55.5 12 62.5 12C74 12 85 21 85 35C85 58 50 82 50 82Z" fill="url(#appleHealthGrad)" />
    </svg>
  );
}

function OuraRingIcon() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]">
      <defs>
        <linearGradient id="ouraGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="32" stroke="url(#ouraGrad)" strokeWidth="8" fill="none" />
      <circle cx="50" cy="50" r="24" stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="none" />
      {/* Oura ring splits */}
      <path d="M46 12 H54 V20 H46 Z" fill="#070d1e" />
      <circle cx="50" cy="50" r="2" fill="#fff" opacity="0.8" />
    </svg>
  );
}

function GarminIcon() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]">
      <defs>
        <linearGradient id="garminGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <path d="M50 15 L85 75 H68 L50 44 L32 75 H15 Z" fill="url(#garminGrad)" />
      <circle cx="50" cy="38" r="5" fill="#fff" />
    </svg>
  );
}

function WhoopIcon() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
      {/* High-tech Whoop chevrons */}
      <path d="M15 25 H38 L55 60 L72 25 H95 L68 80 H42 Z" fill="#ffffff" />
      <path d="M38 25 L50 50 L62 25 Z" fill="#3b82f6" />
    </svg>
  );
}

function FitbitIcon() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 drop-shadow-[0_0_8px_rgba(0,176,185,0.3)]">
      {/* Fitbit Diamond Dot Cluster */}
      <circle cx="50" cy="18" r="4.5" fill="#00B0B9" />
      <circle cx="50" cy="82" r="4.5" fill="#00B0B9" />
      
      <circle cx="34" cy="34" r="4.5" fill="#00B0B9" />
      <circle cx="66" cy="34" r="4.5" fill="#00B0B9" />
      <circle cx="34" cy="66" r="4.5" fill="#00B0B9" />
      <circle cx="66" cy="66" r="4.5" fill="#00B0B9" />
      
      <circle cx="18" cy="50" r="4.5" fill="#00B0B9" />
      <circle cx="82" cy="50" r="4.5" fill="#00B0B9" />
      <circle cx="50" cy="50" r="8" fill="#00B0B9" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────

export default function WearablesPage() {
  const { user } = useAuth();
  
  const getDeviceList = () => [
    {
      id: "apple-health",
      name: "Apple Health",
      icon: <AppleHealthIcon />,
      status: getWearableConnection(user, "apple-health"),
      lastSync: "2 minutes ago",
      streams: ["Heart Rate", "HRV", "Sleep", "Steps"]
    },
    {
      id: "oura",
      name: "Oura Ring",
      icon: <OuraRingIcon />,
      status: getWearableConnection(user, "oura"),
      lastSync: null,
      streams: ["Readiness", "Sleep Stages", "Temperature"]
    },
    {
      id: "garmin",
      name: "Garmin Connect",
      icon: <GarminIcon />,
      status: getWearableConnection(user, "garmin"),
      lastSync: "14 hours ago",
      streams: ["Body Battery", "Stress", "Activities"]
    },
    {
      id: "whoop",
      name: "Whoop Strap",
      icon: <WhoopIcon />,
      status: getWearableConnection(user, "whoop"),
      lastSync: "1 minute ago",
      streams: ["Strain Score", "Recovery", "Sleep Depth"]
    },
    {
      id: "fitbit",
      name: "Fitbit Sense",
      icon: <FitbitIcon />,
      status: getWearableConnection(user, "fitbit"),
      lastSync: "5 hours ago",
      streams: ["Active Zone Min", "Daily Readiness", "EDA Response"]
    }
  ].map(device => {
    if (device.status === "connected") {
      device.statusLabel = "CONNECTED";
      device.statusColor = "text-[#00FF9D]";
      device.dotColor = "bg-[#00FF9D]";
    } else if (device.status === "error") {
      device.statusLabel = "SYNC ERROR";
      device.statusColor = "text-[#fca5a5]";
      device.dotColor = "bg-[#fca5a5]";
    } else {
      device.statusLabel = "DISCONNECTED";
      device.statusColor = "text-[#4f73a3]";
      device.dotColor = "bg-[#4f73a3]";
    }
    return device;
  });

  const [devices, setDevices] = useState(getDeviceList());

  const handleToggleConnection = (id, currentStatus) => {
    const newStatus = currentStatus === "connected" ? "disconnected" : "connected";
    setWearableConnection(user, id, newStatus);
    setDevices(getDeviceList());
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 pb-8">
      {!user && (
        <p className="mb-4 inline-flex rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-yellow-500">
          Preview mode · example data
        </p>
      )}
      {/* Header */}
      <section>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/5 bg-[#050914] px-3 py-1 text-[11px] font-semibold text-[#9ca3af]">
          <Watch size={12} className="text-[#60a5fa]" />
          Synchronisation active — Twin calibré en continu
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-[#e5e7eb] md:text-5xl">
          Wearable integrations
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#9ca3af]">
          Connectez vos appareils et transmettez en temps réel vos données HRV, sommeil et activité physique pour étalonner en continu votre Twin Numérique.
        </p>
      </section>

      {/* Devices Grid */}
      <section>
        <h2 className="mb-6 text-xl font-bold text-[#e5e7eb]">Vos Appareils Connectés</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => (
            <article key={device.id} className="group flex flex-col items-center rounded-3xl border border-white/10 bg-white/[0.02] p-8 transition-all hover:border-white/20 hover:bg-white/[0.04]">
              {/* Device SVG Icon with Glassmorphism wrapper */}
              <div className="mb-6 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-[#091224] border border-white/5 shadow-lg shadow-black/50 ring-1 ring-inset ring-white/5 transition-transform group-hover:scale-105">
                {device.icon}
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <h3 className="text-lg font-bold text-white">{device.name}</h3>
                <span className={`flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-widest ${device.statusColor}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${device.dotColor}`} />
                  {device.statusLabel}
                </span>
                {device.lastSync && (
                  <p className="mt-1 text-[11px] text-[#64748b]">Last synced {device.lastSync}</p>
                )}
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {device.streams.map(stream => (
                  <span key={stream} className="rounded-lg bg-[#02050f] border border-white/5 px-2.5 py-1 text-[10px] font-semibold text-[#9ca3af]">
                    {stream}
                  </span>
                ))}
              </div>
              <button 
                onClick={() => handleToggleConnection(device.id, device.status)}
                className={`mt-8 w-full rounded-2xl border py-3 text-xs font-bold transition-all active:scale-95 ${
                  device.status === 'connected' 
                    ? 'border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10' 
                    : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                {device.status === 'connected' ? 'Disconnect' : 'Connect'}
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
