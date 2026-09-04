"use client";

/** Handgefertigte SVG-Illustrationen fuer die Onboarding-Story (kein Bildgenerator
 * verfuegbar - stattdessen gezeichnete Szenen im bestehenden Spiel-Farbschema). */
export function StoryArt({ index }: { index: number }) {
  switch (index) {
    case 0:
      return <RiftArt />;
    case 1:
      return <JumpArt />;
    case 2:
      return <BeachArt />;
    case 3:
      return <RuinsArt />;
    default:
      return <CampfireArt />;
  }
}

function RiftArt() {
  return (
    <svg viewBox="0 0 400 260" className="h-full w-full">
      <defs>
        <radialGradient id="rift-bg" cx="50%" cy="50%" r="75%">
          <stop offset="0%" stopColor="#1c343a" />
          <stop offset="100%" stopColor="#0a1315" />
        </radialGradient>
        <radialGradient id="rift-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f0e1c2" />
          <stop offset="35%" stopColor="#6fc4b9" />
          <stop offset="100%" stopColor="#0a1315" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="260" fill="url(#rift-bg)" />
      {[100, 78, 58, 40, 24].map((r, i) => (
        <circle
          key={r}
          cx="200"
          cy="130"
          r={r}
          fill="none"
          stroke={i % 2 === 0 ? "#4fb0a5" : "#c1683c"}
          strokeOpacity={0.35 - i * 0.04}
          strokeWidth="1.5"
        />
      ))}
      <circle cx="200" cy="130" r="46" fill="url(#rift-core)" />
      {Array.from({ length: 14 }).map((_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        const x1 = 200 + Math.cos(angle) * 50;
        const y1 = 130 + Math.sin(angle) * 50;
        const x2 = 200 + Math.cos(angle) * 95;
        const y2 = 130 + Math.sin(angle) * 95;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#e2c89c"
            strokeOpacity="0.25"
            strokeWidth="1"
          />
        );
      })}
    </svg>
  );
}

function JumpArt() {
  return (
    <svg viewBox="0 0 400 260" className="h-full w-full">
      <defs>
        <radialGradient id="jump-bg" cx="50%" cy="45%" r="80%">
          <stop offset="0%" stopColor="#28453f" />
          <stop offset="100%" stopColor="#070f14" />
        </radialGradient>
        <radialGradient id="jump-flash" cx="50%" cy="45%" r="40%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#e2c89c" />
          <stop offset="100%" stopColor="#e2c89c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="260" fill="url(#jump-bg)" />
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const len = 60 + (i % 3) * 30;
        const x2 = 200 + Math.cos(angle) * len;
        const y2 = 118 + Math.sin(angle) * len;
        return (
          <line
            key={i}
            x1="200"
            y1="118"
            x2={x2}
            y2={y2}
            stroke="#f0e1c2"
            strokeOpacity="0.3"
            strokeWidth="2"
          />
        );
      })}
      <circle cx="200" cy="118" r="34" fill="url(#jump-flash)" />
      <ellipse cx="200" cy="205" rx="10" ry="14" fill="#0a1315" opacity="0.85" />
    </svg>
  );
}

function BeachArt() {
  return (
    <svg viewBox="0 0 400 260" className="h-full w-full">
      <defs>
        <linearGradient id="beach-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c343a" />
          <stop offset="100%" stopColor="#3c5a44" />
        </linearGradient>
        <linearGradient id="beach-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4fb0a5" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#132b28" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="beach-sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c7a273" />
          <stop offset="100%" stopColor="#a9865b" />
        </linearGradient>
      </defs>
      <rect width="400" height="150" fill="url(#beach-sky)" />
      <circle cx="320" cy="55" r="26" fill="#e2c89c" opacity="0.85" />
      <rect y="150" width="400" height="45" fill="url(#beach-sea)" />
      <rect y="190" width="400" height="70" fill="url(#beach-sand)" />
      <ellipse cx="150" cy="222" rx="34" ry="9" fill="#0a1315" opacity="0.25" />
      <g opacity="0.9">
        <ellipse cx="150" cy="214" rx="26" ry="7" fill="#152621" />
        <circle cx="122" cy="212" r="7" fill="#152621" />
      </g>
    </svg>
  );
}

function RuinsArt() {
  return (
    <svg viewBox="0 0 400 260" className="h-full w-full">
      <defs>
        <linearGradient id="ruins-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d1a20" />
          <stop offset="100%" stopColor="#152621" />
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill="url(#ruins-bg)" />
      <circle cx="330" cy="50" r="20" fill="#e2c89c" opacity="0.4" />
      {[60, 130, 260, 330].map((x, i) => (
        <g key={x} opacity={0.85 - i * 0.05}>
          <rect x={x - 9} y={i % 2 === 0 ? 110 : 140} width="18" height={i % 2 === 0 ? 130 : 100} fill="#3c5a44" />
          <rect x={x - 13} y={(i % 2 === 0 ? 110 : 140) - 8} width="26" height="10" fill="#294247" />
        </g>
      ))}
      <path
        d="M40 240 Q120 200 200 235 T360 220"
        fill="none"
        stroke="#4fb0a5"
        strokeOpacity="0.4"
        strokeWidth="3"
      />
      <circle cx="95" cy="205" r="16" fill="#3d8f86" opacity="0.5" />
    </svg>
  );
}

function CampfireArt() {
  return (
    <svg viewBox="0 0 400 260" className="h-full w-full">
      <defs>
        <linearGradient id="camp-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#28453f" />
          <stop offset="100%" stopColor="#c1683c" stopOpacity="0.35" />
        </linearGradient>
        <radialGradient id="camp-glow" cx="50%" cy="70%" r="45%">
          <stop offset="0%" stopColor="#e59a71" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#e59a71" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="260" fill="url(#camp-bg)" />
      <circle cx="200" cy="190" r="90" fill="url(#camp-glow)" />
      <g transform="translate(200 195)">
        <path d="M-6 20 L0 -22 L6 20 Z" fill="#d97a4c" />
        <path d="M-3 20 L0 -10 L3 20 Z" fill="#f0e1c2" />
      </g>
      <ellipse cx="150" cy="212" rx="10" ry="20" fill="#0a1315" opacity="0.85" />
      <circle cx="150" cy="184" r="8" fill="#0a1315" opacity="0.85" />
    </svg>
  );
}
