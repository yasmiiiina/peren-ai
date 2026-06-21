/* Shared medical SVG anatomy — viewBox 0 0 200 500, anterior standing position */

const SCANNER_STYLES = `
  @keyframes bonePulse {
    0%, 100% { opacity: 0.85; }
    50%      { opacity: 1; }
  }
  @keyframes scanScroll {
    0%   { transform: translateY(16px); opacity: 0; }
    10%  { opacity: 0.15; }
    90%  { opacity: 0.15; }
    100% { transform: translateY(484px); opacity: 0; }
  }
  .scanner-panel:hover .anatomy-bones { animation: bonePulse 2s ease-in-out infinite; }
  .scanner-scan-line { animation: scanScroll 8s linear infinite; }
`;

function BoneDefs({ prefix = "" }) {
  return (
    <defs>
      <linearGradient id={`${prefix}boneGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
        <stop offset="45%" stopColor="#c8e6f5" stopOpacity="1" />
        <stop offset="100%" stopColor="#8ecae6" stopOpacity="0.9" />
      </linearGradient>
      <linearGradient id={`${prefix}boneGradDim`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1a2535" />
        <stop offset="100%" stopColor="#141c28" />
      </linearGradient>
      <filter id={`${prefix}boneGlow`} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2.2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id={`${prefix}boneGlowStrong`} x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="3.5" result="blur" />
        <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.3  0 0 0 0 0.72  0 0 0 0 1  0 0 0 0.9 0" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

function SvgDefs({ prefix = "" }) {
  return <BoneDefs prefix={prefix} />;
}

function ScanLine() {
  return (
    <rect className="scanner-scan-line" x="16" y="0" width="168" height="1" fill="#4db8ff" opacity="0.15" />
  );
}

/** Full skeleton — head 1/8, torso 3/8, legs 4/8 of height 500 */
export function SkeletonBones({ dimmed = false, className = "", prefix = "", strongGlow = false }) {
  const fill = dimmed ? `url(#${prefix}boneGradDim)` : `url(#${prefix}boneGrad)`;
  const stroke = dimmed ? "#2a3a4f" : "#4db8ff";
  const sw = dimmed ? 0.4 : 0.75;
  const glow = dimmed ? undefined : strongGlow ? `url(#${prefix}boneGlowStrong)` : `url(#${prefix}boneGlow)`;

  return (
    <g id="skeleton" className={`anatomy-bones ${className}`} filter={glow}>
      <ellipse id="cranium" cx="100" cy="52" rx="26" ry="30" fill={fill} stroke={stroke} strokeWidth={sw} />
      <path id="mandible" d="M 82 68 Q 100 82 118 68 Q 114 76 100 78 Q 86 76 82 68 Z" fill={fill} stroke={stroke} strokeWidth={sw} />

      {[82, 88, 94, 100, 106, 112, 118].map((y, i) => (
        <rect key={`c${i + 1}`} id={`cervical-c${i + 1}`} x="96" y={y} width="8" height="4" rx="1.5" fill={fill} stroke={stroke} strokeWidth={0.4} />
      ))}

      <path id="left-clavicle" d="M 68 122 Q 84 118 100 120" fill="none" stroke={stroke} strokeWidth={sw + 0.3} strokeLinecap="round" />
      <path id="right-clavicle" d="M 100 120 Q 116 118 132 122" fill="none" stroke={stroke} strokeWidth={sw + 0.3} strokeLinecap="round" />
      <path id="left-scapula" d="M 70 124 Q 58 138 62 158 Q 68 150 72 132 Z" fill={fill} stroke={stroke} strokeWidth={sw * 0.8} opacity={dimmed ? 0.6 : 0.85} />
      <path id="right-scapula" d="M 130 124 Q 142 138 138 158 Q 132 150 128 132 Z" fill={fill} stroke={stroke} strokeWidth={sw * 0.8} opacity={dimmed ? 0.6 : 0.85} />
      <path id="sternum" d="M 96 122 L 94 198 Q 100 200 106 198 L 104 122 Z" fill={fill} stroke={stroke} strokeWidth={sw} />

      {Array.from({ length: 12 }, (_, i) => {
        const y = 128 + i * 6;
        const spread = 38 - i * 1.2;
        const curve = 4 + i * 0.3;
        return (
          <g key={`rib-${i + 1}`} id={`rib-pair-${i + 1}`}>
            <path id={`left-rib-${i + 1}`} d={`M 100 ${y} Q ${100 - spread / 2} ${y + curve} ${100 - spread} ${y + 2}`} fill="none" stroke={stroke} strokeWidth={sw * 0.7} opacity={0.95 - i * 0.03} />
            <path id={`right-rib-${i + 1}`} d={`M 100 ${y} Q ${100 + spread / 2} ${y + curve} ${100 + spread} ${y + 2}`} fill="none" stroke={stroke} strokeWidth={sw * 0.7} opacity={0.95 - i * 0.03} />
          </g>
        );
      })}

      {Array.from({ length: 12 }, (_, i) => (
        <rect key={`t${i + 1}`} id={`thoracic-t${i + 1}`} x="97" y={124 + i * 5.5} width="6" height="4.5" rx="1" fill={fill} stroke={stroke} strokeWidth={0.35} />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <rect key={`l${i + 1}`} id={`lumbar-l${i + 1}`} x="96.5" y={192 + i * 6} width="7" height="5" rx="1.2" fill={fill} stroke={stroke} strokeWidth={0.35} />
      ))}
      <path id="sacrum" d="M 88 222 Q 100 216 112 222 Q 108 236 100 240 Q 92 236 88 222 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
      <path id="coccyx" d="M 98 240 L 100 252 L 102 240" fill="none" stroke={stroke} strokeWidth={sw * 0.6} />

      <path id="left-humerus" d="M 72 124 L 66 188" fill="none" stroke={stroke} strokeWidth={sw + 1.2} strokeLinecap="round" />
      <path id="right-humerus" d="M 128 124 L 134 188" fill="none" stroke={stroke} strokeWidth={sw + 1.2} strokeLinecap="round" />
      <path id="left-radius" d="M 66 188 L 62 238" fill="none" stroke={stroke} strokeWidth={sw * 0.9} strokeLinecap="round" />
      <path id="left-ulna" d="M 68 188 L 64 238" fill="none" stroke={stroke} strokeWidth={sw * 0.7} strokeLinecap="round" />
      <path id="right-radius" d="M 134 188 L 138 238" fill="none" stroke={stroke} strokeWidth={sw * 0.9} strokeLinecap="round" />
      <path id="right-ulna" d="M 132 188 L 136 238" fill="none" stroke={stroke} strokeWidth={sw * 0.7} strokeLinecap="round" />

      <rect id="left-carpals" x="58" y="238" width="10" height="6" rx="2" fill={fill} stroke={stroke} strokeWidth={sw * 0.6} />
      <rect id="right-carpals" x="132" y="238" width="10" height="6" rx="2" fill={fill} stroke={stroke} strokeWidth={sw * 0.6} />
      {[0, 1, 2, 3, 4].map((f) => (
        <g key={`lf-${f}`}>
          <line id={`left-metacarpal-${f}`} x1={60 + f * 2} y1="244" x2={59 + f * 2} y2="254" stroke={stroke} strokeWidth={sw * 0.5} />
          <line id={`left-phalanx-${f}`} x1={59 + f * 2} y1="254" x2={58 + f * 2} y2="262" stroke={stroke} strokeWidth={sw * 0.4} />
        </g>
      ))}
      {[0, 1, 2, 3, 4].map((f) => (
        <g key={`rf-${f}`}>
          <line id={`right-metacarpal-${f}`} x1={140 - f * 2} y1="244" x2={141 - f * 2} y2="254" stroke={stroke} strokeWidth={sw * 0.5} />
          <line id={`right-phalanx-${f}`} x1={141 - f * 2} y1="254" x2={142 - f * 2} y2="262" stroke={stroke} strokeWidth={sw * 0.4} />
        </g>
      ))}

      <path id="pelvis" d="M 76 248 Q 100 238 124 248 Q 120 262 100 268 Q 80 262 76 248 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
      <path id="left-ilium" d="M 76 248 Q 68 256 72 268 Q 82 262 84 252 Z" fill={fill} stroke={stroke} strokeWidth={sw * 0.6} opacity={0.9} />
      <path id="right-ilium" d="M 124 248 Q 132 256 128 268 Q 118 262 116 252 Z" fill={fill} stroke={stroke} strokeWidth={sw * 0.6} opacity={0.9} />

      <path id="left-femur" d="M 88 268 L 84 368" fill="none" stroke={stroke} strokeWidth={sw + 1.4} strokeLinecap="round" />
      <path id="right-femur" d="M 112 268 L 116 368" fill="none" stroke={stroke} strokeWidth={sw + 1.4} strokeLinecap="round" />
      <ellipse id="left-patella" cx="84" cy="372" rx="6" ry="5" fill={fill} stroke={stroke} strokeWidth={sw * 0.7} />
      <ellipse id="right-patella" cx="116" cy="372" rx="6" ry="5" fill={fill} stroke={stroke} strokeWidth={sw * 0.7} />
      <path id="left-tibia" d="M 84 378 L 82 458" fill="none" stroke={stroke} strokeWidth={sw + 0.8} strokeLinecap="round" />
      <path id="left-fibula" d="M 87 378 L 86 456" fill="none" stroke={stroke} strokeWidth={sw * 0.55} strokeLinecap="round" />
      <path id="right-tibia" d="M 116 378 L 118 458" fill="none" stroke={stroke} strokeWidth={sw + 0.8} strokeLinecap="round" />
      <path id="right-fibula" d="M 113 378 L 114 456" fill="none" stroke={stroke} strokeWidth={sw * 0.55} strokeLinecap="round" />
      <ellipse id="left-tarsals" cx="82" cy="464" rx="10" ry="5" fill={fill} stroke={stroke} strokeWidth={sw * 0.6} />
      <ellipse id="right-tarsals" cx="118" cy="464" rx="10" ry="5" fill={fill} stroke={stroke} strokeWidth={sw * 0.6} />
      <line id="left-metatarsals" x1="76" y1="468" x2="88" y2="468" stroke={stroke} strokeWidth={sw * 0.5} />
      <line id="right-metatarsals" x1="112" y1="468" x2="124" y2="468" stroke={stroke} strokeWidth={sw * 0.5} />
      {[76, 80, 84, 88].map((x, i) => (
        <line key={`lt-${i}`} id={`left-toe-${i}`} x1={x} y1="468" x2={x - 1} y2="476" stroke={stroke} strokeWidth={0.4} />
      ))}
      {[112, 116, 120, 124].map((x, i) => (
        <line key={`rt-${i}`} id={`right-toe-${i}`} x1={x} y1="468" x2={x + 1} y2="476" stroke={stroke} strokeWidth={0.4} />
      ))}
    </g>
  );
}

export function AdiposeOverlay({ intensity = 0.5 }) {
  const op = 0.15 + intensity * 0.15;
  return (
    <g id="adipose-layer" opacity={op}>
      <ellipse cx="100" cy="210" rx="28" ry="22" fill="#f5a623" opacity="0.55" />
      <ellipse cx="100" cy="195" rx="22" ry="14" fill="#f5a623" opacity="0.45" />
      <ellipse cx="86" cy="300" rx="14" ry="28" fill="#f5a623" opacity="0.4" />
      <ellipse cx="114" cy="300" rx="14" ry="28" fill="#f5a623" opacity="0.4" />
      <ellipse cx="100" cy="175" rx="18" ry="10" fill="#f5a623" opacity="0.35" />
    </g>
  );
}

export function MuscleOverlay({ load = 0.5 }) {
  const op = 0.22 + load * 0.12;
  return (
    <g id="muscle-layer" opacity={op}>
      <ellipse cx="72" cy="130" rx="10" ry="8" fill="#c0392b" />
      <ellipse cx="128" cy="130" rx="10" ry="8" fill="#c0392b" />
      <path d="M 82 138 Q 100 158 118 138 Q 112 152 100 156 Q 88 152 82 138 Z" fill="#c0392b" />
      {[152, 164, 176, 188, 200].map((y) => (
        <rect key={y} x="92" y={y} width="16" height="8" rx="2" fill="#c0392b" opacity="0.9" />
      ))}
      <path d="M 84 272 L 78 360 Q 84 368 88 360 L 92 272 Z" fill="#c0392b" />
      <path d="M 116 272 L 122 360 Q 116 368 112 360 L 108 272 Z" fill="#c0392b" />
      <ellipse cx="82" cy="410" rx="8" ry="18" fill="#c0392b" />
      <ellipse cx="118" cy="410" rx="8" ry="18" fill="#c0392b" />
    </g>
  );
}

export function AnatomySvgFrame({ children, label, active }) {
  return (
    <div className="scanner-panel relative w-full h-full" style={{ padding: 16, background: "#0a0f1a" }}>
      <style>{SCANNER_STYLES}</style>
      <svg viewBox="0 0 200 500" className="w-full h-full" preserveAspectRatio="xMidYMid meet" aria-label={`${label} anatomical scan`}>
        <SvgDefs />
        <rect width="200" height="500" fill="#0a0f1a" />
        {children}
        <ScanLine />
      </svg>
      <span
        className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none uppercase"
        style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.15em", color: active ? "#4db8ff" : "#3a5a6f" }}
      >
        {label}
      </span>
    </div>
  );
}

export function SkeletonPanelSvg({ active }) {
  return (
    <AnatomySvgFrame label="SKELETON" active={active}>
      <SkeletonBones dimmed={!active} />
    </AnatomySvgFrame>
  );
}

export function FatPanelSvg({ active, toxinLevel = 2 }) {
  return (
    <AnatomySvgFrame label="FAT" active={active}>
      <SkeletonBones dimmed />
      <AdiposeOverlay intensity={Math.min(toxinLevel / 5, 1)} />
    </AnatomySvgFrame>
  );
}

export function MusclePanelSvg({ active, workload = 50 }) {
  return (
    <AnatomySvgFrame label="MUSCLE" active={active}>
      <SkeletonBones dimmed />
      <MuscleOverlay load={Math.min(workload / 100, 1)} />
    </AnatomySvgFrame>
  );
}

export { BoneDefs };
