/* Anatomical System Scanners — pure SVG medical illustrations */

import { SkeletonPanelSvg, FatPanelSvg, MusclePanelSvg } from "./MedicalAnatomySvg";

export function ScannerViewport({ modality, active, children }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border"
      style={{
        aspectRatio: "200 / 500",
        borderColor: active ? "rgba(77,184,255,0.45)" : "rgba(51,65,85,0.45)",
        background: "#0a0f1a",
      }}
    >
      {children}
      {modality && (
        <span
          className="absolute bottom-1.5 right-2 pointer-events-none uppercase"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "#3a5a6f", letterSpacing: "0.1em" }}
        >
          {modality}
        </span>
      )}
    </div>
  );
}

export function SkeletonSvg({ isActive }) {
  return <SkeletonPanelSvg active={isActive} />;
}

export function FatSvg({ isActive, toxinLevel = 2 }) {
  return <FatPanelSvg active={isActive} toxinLevel={toxinLevel} />;
}

export function MuscleSvg({ isActive, workload = 50 }) {
  return <MusclePanelSvg active={isActive} workload={workload} />;
}
