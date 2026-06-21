import { Link } from "react-router-dom";

export default function PaymentFailure() {
  return (
    <section className="mx-auto grid min-h-[60vh] w-full max-w-xl place-items-center px-4">
      <article className="w-full rounded-2xl border border-rose-400/30 bg-rose-500/10 p-8 text-center">
        <h1 className="text-3xl font-bold text-white">Payment Failed</h1>
        <p className="mt-3 text-slate-200">We could not validate your Payzone transaction. Please retry or contact support if the problem persists.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/dashboard" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900">Back to Dashboard</Link>
          <Link to="/login" className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white">Contact support</Link>
        </div>
      </article>
    </section>
  );
}
