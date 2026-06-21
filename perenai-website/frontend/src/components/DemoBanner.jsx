export function DemoBanner({ children }) {
  return (
    <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
      <span className="font-semibold text-amber-300">Mode démo — </span>
      {children || "Les données affichées sont locales et ne sont pas encore synchronisées avec le serveur."}
    </div>
  );
}
