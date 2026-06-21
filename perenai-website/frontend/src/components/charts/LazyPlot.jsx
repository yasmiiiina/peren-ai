import { lazy, Suspense } from "react";

const Plot = lazy(() => import("react-plotly.js"));

export function LazyPlot({ className = "h-48", ...props }) {
  return (
    <Suspense fallback={<div className={`${className} animate-pulse rounded-lg bg-slate-800/30`} />}>
      <Plot {...props} />
    </Suspense>
  );
}
