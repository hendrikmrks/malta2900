/** Handgefertigte Hero-Illustration (kein Bildgenerator verfuegbar) - Insel bei
 * Daemmerung mit Ruinen, Lagerfeuer und einer einsamen Silhouette am Strand. */
export function HeroArt() {
  return (
    <svg viewBox="0 0 600 400" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d1a20" />
          <stop offset="55%" stopColor="#28453f" />
          <stop offset="100%" stopColor="#c1683c" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="hero-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4fb0a5" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#132b28" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="hero-sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a9865b" />
          <stop offset="100%" stopColor="#0a1315" />
        </linearGradient>
        <radialGradient id="hero-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f0e1c2" />
          <stop offset="100%" stopColor="#e59a71" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hero-fire" cx="50%" cy="60%" r="50%">
          <stop offset="0%" stopColor="#f0e1c2" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#c1683c" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="600" height="400" fill="url(#hero-sky)" />
      <circle cx="470" cy="90" r="150" fill="url(#hero-sun)" />
      <circle cx="470" cy="90" r="42" fill="#f0e1c2" opacity="0.9" />

      {/* Ruinen-Silhouetten */}
      <g opacity="0.55">
        <rect x="60" y="150" width="22" height="170" fill="#152621" />
        <rect x="54" y="142" width="34" height="12" fill="#152621" />
        <rect x="130" y="190" width="18" height="130" fill="#152621" />
        <rect x="480" y="170" width="20" height="150" fill="#152621" />
        <rect x="474" y="162" width="32" height="12" fill="#152621" />
      </g>

      {/* Meer */}
      <rect y="230" width="600" height="55" fill="url(#hero-sea)" />
      {/* Strand */}
      <rect y="280" width="600" height="120" fill="url(#hero-sand)" />

      {/* Lagerfeuer-Schein */}
      <circle cx="300" cy="300" r="120" fill="url(#hero-fire)" />
      <g transform="translate(300 305)">
        <path d="M-8 26 L0 -28 L8 26 Z" fill="#d97a4c" />
        <path d="M-4 26 L0 -12 L4 26 Z" fill="#f0e1c2" />
      </g>
      <rect x="270" y="322" width="60" height="8" rx="3" fill="#3c5a44" opacity="0.6" />

      {/* Figur am Strand */}
      <g transform="translate(220 290)">
        <ellipse cx="0" cy="34" rx="9" ry="24" fill="#0a1315" />
        <circle cx="0" cy="4" r="8" fill="#0a1315" />
      </g>

      {/* Palme */}
      <g transform="translate(500 260)" opacity="0.9">
        <path d="M0 90 Q4 40 0 0" stroke="#294247" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M0 0 Q-30 -10 -46 8" stroke="#3c5a44" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M0 0 Q30 -8 44 12" stroke="#3c5a44" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M0 0 Q-6 -26 -22 -34" stroke="#4fb0a5" strokeWidth="6" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
