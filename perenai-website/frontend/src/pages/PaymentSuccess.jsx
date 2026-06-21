import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function PaymentSuccess() {
  const { fetchUser } = useAuth();

  useEffect(() => {
    fetchUser?.();
  }, [fetchUser]);

  return (
    <section className="mx-auto grid min-h-[60vh] w-full max-w-xl place-items-center px-4">
      <article className="w-full rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-8 text-center">
        <h1 className="text-3xl font-bold text-white">Payment Successful</h1>
        <p className="mt-3 text-slate-200">Your Premium access has been activated. You can now open all advanced dashboard and score sections.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900">Go to Dashboard</Link>
          <Link to="/dashboard" className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white">Open Detailed Score</Link>
        </div>
      </article>
    </section>
  );
}
