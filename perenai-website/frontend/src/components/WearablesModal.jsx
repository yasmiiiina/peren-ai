import { useState, useEffect } from "react";
import { CheckCircle2, Loader2, Watch, Smartphone, Activity } from "lucide-react";

export function WearablesModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState("provider"); // provider, connecting, success
  const [selectedProvider, setSelectedProvider] = useState(null);

  const providers = [
    { id: "apple_health", name: "Apple Health", icon: Smartphone, color: "bg-white text-black", description: "iOS only" },
    { id: "google_fit", name: "Google Fit", icon: Activity, color: "bg-blue-500 text-white", description: "Android / iOS" },
    { id: "oura", name: "Oura Ring", icon: Watch, color: "bg-zinc-800 text-white", description: "Ring gen 2+" },
    { id: "garmin", name: "Garmin Connect", icon: Watch, color: "bg-slate-700 text-white", description: "Watches & Edge" },
  ];

  useEffect(() => {
    if (isOpen) {
      setStep("provider");
      setSelectedProvider(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConnect = (providerId) => {
    setSelectedProvider(providerId);
    setStep("connecting");
    
    // Simulate OAuth and sync
    setTimeout(() => {
      setStep("success");
      setTimeout(() => {
        onSuccess(providerId);
      }, 1500);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-300">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#020617] p-8 text-white shadow-2xl ring-1 ring-white/10 animate-in zoom-in-95 duration-300">
        
        {step !== "connecting" && step !== "success" && (
          <button 
            onClick={onClose}
            className="absolute right-6 top-6 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        )}

        {step === "provider" && (
          <>
            <header className="mb-8">
              <h2 className="text-3xl font-extrabold tracking-tight">Connect Device</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#9ca3af]">
                Select your health data provider to stream continuous telemetry to your digital twin.
              </p>
            </header>

            <div className="space-y-3">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleConnect(provider.id)}
                  className="group flex w-full items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-left transition-all hover:border-blue-500/50 hover:bg-white/[0.05]"
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${provider.color} transition-transform group-hover:scale-105`}>
                    <provider.icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{provider.name}</h3>
                    <p className="text-xs text-[#9ca3af]">{provider.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === "connecting" && (
          <div className="flex flex-col items-center py-12 text-center">
            <Loader2 size={48} className="animate-spin text-blue-500 mb-6" />
            <h2 className="text-2xl font-bold text-white">Authenticating...</h2>
            <p className="mt-3 text-sm text-[#9ca3af]">
              Please follow the instructions on your provider's page to authorize PEREN AI.
            </p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center py-12 text-center animate-in zoom-in-90 duration-500">
            <div className="relative mb-6">
              <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/30">
                <CheckCircle2 size={40} />
              </div>
            </div>
            <h2 className="text-3xl font-black text-white">Device Connected</h2>
            <p className="mt-4 max-w-[280px] text-[#9ca3af]">
              Your telemetry is now streaming. Your dashboard is updating...
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
