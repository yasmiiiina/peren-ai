import { useOpenPremiumSubscription, usePremiumAccess } from "../hooks/usePremium";

export function PremiumGate({
  isPremium,
  onUnlock,
  title = "Premium Feature",
  description = "Upgrade to Premium to access this section.",
  children,
}) {
  const openSubscription = useOpenPremiumSubscription();
  const hasPremium = usePremiumAccess();
  const unlocked = isPremium ?? hasPremium;

  if (unlocked) {
    return children;
  }

  const handleUnlock = onUnlock || openSubscription;

  return (
    <div className="relative">
      <div className="pointer-events-none blur-[2px] opacity-45">{children}</div>
      <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-blue-200/30 bg-slate-950/90 p-5 text-center backdrop-blur">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="mt-2 text-sm text-slate-300">{description}</p>
          <button
            type="button"
            onClick={handleUnlock}
            className="mt-4 rounded-full bg-gradient-to-r from-[#7da7ff] to-[#4f79d9] px-5 py-2.5 text-sm font-bold text-white"
          >
            Manage Subscription
          </button>
        </div>
      </div>
    </div>
  );
}
