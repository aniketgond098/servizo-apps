import React, { useState, useEffect, useCallback } from 'react';

interface ToolDef {
  color: string;
  glowColor: string;
  svg: React.ReactNode;
}

const tools: ToolDef[] = [
  {
    color: '#f97316',
    glowColor: 'rgba(249,115,22,0.25)',
    svg: (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id="wrench-g" x1="10" y1="10" x2="70" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fdba74" />
            <stop offset="1" stopColor="#ea580c" />
          </linearGradient>
        </defs>
        <path d="M55 18a16 16 0 0 0-22.6 0l-1.2 1.2 8.6 8.6-2.8 2.8-8.6-8.6-1.2 1.2a16 16 0 0 0 0 22.6 16 16 0 0 0 18.2 3l17 17a5 5 0 0 0 7.1-7.1l-17-17A16 16 0 0 0 55 18z" fill="url(#wrench-g)" />
        <rect x="54" y="52" width="8" height="16" rx="2" transform="rotate(45 58 60)" fill="#c2410c" opacity="0.6" />
        <circle cx="56" cy="58" r="3" fill="#fff" opacity="0.4" />
        <path d="M24 24l6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
  },
  {
    color: '#ec4899',
    glowColor: 'rgba(236,72,153,0.25)',
    svg: (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id="roller-g" x1="10" y1="10" x2="70" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f9a8d4" />
            <stop offset="1" stopColor="#db2777" />
          </linearGradient>
        </defs>
        <rect x="12" y="12" width="50" height="20" rx="6" fill="url(#roller-g)" />
        <rect x="14" y="14" width="46" height="16" rx="4" fill="#db2777" opacity="0.5" />
        <rect x="14" y="14" width="20" height="16" rx="4" fill="#fff" opacity="0.15" />
        <rect x="62" y="18" width="8" height="8" rx="2" fill="#9d174d" />
        <rect x="36" y="32" width="6" height="22" rx="3" fill="#6b7280" />
        <rect x="36" y="32" width="3" height="22" rx="1.5" fill="#9ca3af" opacity="0.5" />
        <rect x="32" y="52" width="14" height="6" rx="3" fill="#4b5563" />
        <circle cx="25" cy="22" r="4" fill="#fff" opacity="0.2" />
      </svg>
    ),
  },
  {
    color: '#6366f1',
    glowColor: 'rgba(99,102,241,0.25)',
    svg: (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id="screw-g" x1="20" y1="10" x2="60" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a5b4fc" />
            <stop offset="1" stopColor="#4338ca" />
          </linearGradient>
          <linearGradient id="screw-h" x1="30" y1="40" x2="50" y2="75" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fbbf24" />
            <stop offset="1" stopColor="#d97706" />
          </linearGradient>
        </defs>
        <path d="M40 8l-6 3 2 22h8l2-22-6-3z" fill="url(#screw-g)" />
        <path d="M40 8l-3 1.5 1 11h4l1-11L40 8z" fill="#fff" opacity="0.2" />
        <rect x="33" y="33" width="14" height="6" rx="2" fill="#c7d2fe" />
        <path d="M34 39h12l4 6H30l4-6z" fill="url(#screw-h)" />
        <rect x="32" y="45" width="16" height="22" rx="3" fill="url(#screw-h)" />
        <rect x="32" y="45" width="8" height="22" rx="3" fill="#fff" opacity="0.15" />
        <line x1="36" y1="50" x2="36" y2="62" stroke="#92400e" strokeWidth="1" opacity="0.3" />
        <line x1="40" y1="48" x2="40" y2="64" stroke="#92400e" strokeWidth="1" opacity="0.2" />
        <line x1="44" y1="50" x2="44" y2="62" stroke="#92400e" strokeWidth="1" opacity="0.3" />
      </svg>
    ),
  },
  {
    color: '#0ea5e9',
    glowColor: 'rgba(14,165,233,0.25)',
    svg: (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id="pipe-g" x1="10" y1="10" x2="70" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7dd3fc" />
            <stop offset="1" stopColor="#0369a1" />
          </linearGradient>
        </defs>
        {/* Handle */}
        <rect x="36" y="52" width="8" height="22" rx="4" fill="#475569" />
        <rect x="36" y="52" width="4" height="22" rx="2" fill="#94a3b8" opacity="0.4" />
        {/* Body of pipe wrench */}
        <path d="M14 34 Q12 26 20 22 L52 38 Q58 42 56 50 L24 50 Q14 50 14 42 Z" fill="url(#pipe-g)" />
        <path d="M14 34 Q12 26 20 22 L36 30 Q30 32 28 40 L14 42 Q14 50 24 50 L14 42 Z" fill="#fff" opacity="0.12" />
        {/* Upper jaw */}
        <path d="M20 22 L56 22 Q64 22 64 30 L64 34 Q64 38 56 38 L20 38 Z" fill="url(#pipe-g)" />
        <path d="M20 22 L38 22 L38 38 L20 38 Z" fill="#fff" opacity="0.1" />
        {/* Jaw teeth */}
        <rect x="22" y="38" width="6" height="5" rx="1" fill="#0369a1" opacity="0.8" />
        <rect x="32" y="38" width="6" height="5" rx="1" fill="#0369a1" opacity="0.8" />
        <rect x="42" y="38" width="6" height="5" rx="1" fill="#0369a1" opacity="0.8" />
        <rect x="22" y="17" width="6" height="5" rx="1" fill="#0369a1" opacity="0.8" />
        <rect x="32" y="17" width="6" height="5" rx="1" fill="#0369a1" opacity="0.8" />
        <rect x="42" y="17" width="6" height="5" rx="1" fill="#0369a1" opacity="0.8" />
        {/* Adjustment nut */}
        <circle cx="58" cy="46" r="7" fill="#1e40af" />
        <circle cx="58" cy="46" r="4" fill="#3b82f6" opacity="0.6" />
        <line x1="55" y1="46" x2="61" y2="46" stroke="#fff" strokeWidth="1.5" opacity="0.7" />
        <line x1="58" y1="43" x2="58" y2="49" stroke="#fff" strokeWidth="1.5" opacity="0.7" />
        {/* Shine */}
        <path d="M24 26 L46 26" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      </svg>
    ),
  },
  {
    color: '#d946ef',
    glowColor: 'rgba(217,70,239,0.25)',
    svg: (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id="brush-handle-g" x1="38" y1="8" x2="42" y2="58" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f0abfc" />
            <stop offset="1" stopColor="#a21caf" />
          </linearGradient>
          <linearGradient id="brush-bristle-g" x1="30" y1="55" x2="50" y2="78" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fdf4ff" />
            <stop offset="1" stopColor="#e879f9" />
          </linearGradient>
        </defs>
        {/* Handle */}
        <rect x="36" y="8" width="8" height="44" rx="4" fill="url(#brush-handle-g)" />
        <rect x="36" y="8" width="4" height="44" rx="2" fill="#fff" opacity="0.2" />
        {/* Ferrule (metal band) */}
        <rect x="33" y="48" width="14" height="8" rx="2" fill="#c0c0c0" />
        <rect x="33" y="48" width="7" height="8" rx="2" fill="#fff" opacity="0.2" />
        <line x1="33" y1="51" x2="47" y2="51" stroke="#a0a0a0" strokeWidth="1" opacity="0.5" />
        <line x1="33" y1="54" x2="47" y2="54" stroke="#a0a0a0" strokeWidth="1" opacity="0.5" />
        {/* Bristles */}
        <path d="M33 56 Q30 62 32 70 Q36 75 40 75 Q44 75 48 70 Q50 62 47 56 Z" fill="url(#brush-bristle-g)" />
        <path d="M33 56 Q31 62 33 70 Q36 75 40 75 L40 56 Z" fill="#fff" opacity="0.15" />
        {/* Bristle lines */}
        <line x1="37" y1="57" x2="36" y2="73" stroke="#c026d3" strokeWidth="1" opacity="0.4" />
        <line x1="40" y1="56" x2="40" y2="74" stroke="#c026d3" strokeWidth="1" opacity="0.4" />
        <line x1="43" y1="57" x2="44" y2="73" stroke="#c026d3" strokeWidth="1" opacity="0.4" />
        {/* Glitter dots on bristles */}
        <circle cx="35" cy="65" r="1.5" fill="#fff" opacity="0.7" />
        <circle cx="43" cy="68" r="1.5" fill="#fff" opacity="0.6" />
        <circle cx="40" cy="62" r="1" fill="#fff" opacity="0.8" />
        {/* Top cap */}
        <rect x="34" y="6" width="12" height="5" rx="2.5" fill="#86198f" opacity="0.7" />
      </svg>
    ),
  },
  {
    color: '#eab308',
    glowColor: 'rgba(234,179,8,0.25)',
    svg: (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id="drill-g" x1="10" y1="25" x2="55" y2="55" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fde68a" />
            <stop offset="1" stopColor="#ca8a04" />
          </linearGradient>
          <linearGradient id="drill-bit" x1="55" y1="35" x2="75" y2="45" gradientUnits="userSpaceOnUse">
            <stop stopColor="#d4d4d8" />
            <stop offset="1" stopColor="#71717a" />
          </linearGradient>
        </defs>
        <path d="M10 30h35c4 0 8 3 8 8v4c0 5-4 8-8 8H10c-3 0-4-2-4-5V35c0-3 1-5 4-5z" fill="url(#drill-g)" />
        <path d="M10 30h18c2 0 4 3 4 8v4c0 5-2 8-4 8H10c-3 0-4-2-4-5V35c0-3 1-5 4-5z" fill="#fff" opacity="0.15" />
        <rect x="14" y="42" width="16" height="5" rx="2" fill="#92400e" opacity="0.3" />
        <circle cx="20" cy="40" r="3" fill="#fff" opacity="0.3" />
        <path d="M53 36l22-2v12l-22-2V36z" fill="url(#drill-bit)" />
        <line x1="57" y1="38" x2="72" y2="37" stroke="#a1a1aa" strokeWidth="1" opacity="0.5" />
        <line x1="57" y1="42" x2="72" y2="43" stroke="#a1a1aa" strokeWidth="1" opacity="0.5" />
        <rect x="8" y="50" width="12" height="8" rx="2" fill="#a16207" opacity="0.5" />
      </svg>
    ),
  },
];

const TOOL_DURATION = 4000;

interface Droplet {
  angle: number;
  distance: number;
  size: number;
  delay: number;
}

function generateDroplets(count: number): Droplet[] {
  const droplets: Droplet[] = [];
  for (let i = 0; i < count; i++) {
    droplets.push({
      angle: (360 / count) * i + (Math.random() - 0.5) * 30,
      distance: 35 + Math.random() * 50,
      size: 3 + Math.random() * 7,
      delay: Math.random() * 0.12,
    });
  }
  return droplets;
}

const splashDroplets = generateDroplets(12);

interface Props {
  variant?: 'desktop' | 'mobile';
}

const ICON_SIZE = 56; // px — inline icon size

export default function HeroToolsAnimation({ variant = 'desktop' }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<'enter' | 'center' | 'exit'>('enter');
  const [splashKey, setSplashKey] = useState(0);

  const advance = useCallback(() => {
    setActiveIndex(prev => (prev + 1) % tools.length);
  }, []);

  useEffect(() => {
    setPhase('enter');
    const t1 = setTimeout(() => {
      setPhase('center');
      setSplashKey(k => k + 1);
    }, 450);
    const t2 = setTimeout(() => setPhase('exit'), TOOL_DURATION - 800);
    const t3 = setTimeout(advance, TOOL_DURATION);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [activeIndex, advance]);

  const tool = tools[activeIndex];

  const translateY = phase === 'enter' ? -ICON_SIZE * 1.5 : phase === 'center' ? 0 : ICON_SIZE * 1.5;
  const scale = phase === 'center' ? 1 : phase === 'enter' ? 0.4 : 0.3;
  const opacity = phase === 'center' ? 1 : 0;
  const rotate = phase === 'enter' ? -25 : phase === 'center' ? 0 : 20;

  return (
    <span
      className="inline-block relative pointer-events-none select-none align-middle"
      style={{ width: ICON_SIZE, height: ICON_SIZE, overflow: 'visible' }}
      aria-hidden="true"
    >
      {/* Splash rings — centred on the icon */}
      {phase === 'center' && (
        <span
          key={splashKey}
          className="absolute"
          style={{ left: ICON_SIZE / 2, top: ICON_SIZE / 2, transform: 'translate(-50%, -50%)' }}
        >
          <span
            className="absolute rounded-full"
            style={{
              width: 0, height: 0,
              left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              border: `2px solid ${tool.color}`,
              opacity: 0,
              animation: 'heroSplashRing 0.8s ease-out forwards',
            }}
          />
          <span
            className="absolute rounded-full"
            style={{
              width: 0, height: 0,
              left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              border: `1.5px solid ${tool.color}`,
              opacity: 0,
              animation: 'heroSplashRing2 1s ease-out 0.08s forwards',
            }}
          />
          {splashDroplets.map((d, i) => {
            const rad = (d.angle * Math.PI) / 180;
            const tx = Math.cos(rad) * d.distance;
            const ty = Math.sin(rad) * d.distance;
            return (
              <span
                key={`${splashKey}-${i}`}
                className="absolute rounded-full"
                style={{
                  width: d.size,
                  height: d.size,
                  left: '50%', top: '50%',
                  marginLeft: -d.size / 2,
                  marginTop: -d.size / 2,
                  background: tool.color,
                  opacity: 0,
                  transform: 'translate(0, 0) scale(1)',
                  animation: `heroSplashDrop 0.65s ease-out ${d.delay}s forwards`,
                  '--tx': `${tx}px`,
                  '--ty': `${ty}px`,
                } as React.CSSProperties}
              />
            );
          })}
        </span>
      )}

      {/* Tool icon */}
      <span
        className="absolute will-change-transform"
        style={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          left: 0,
          top: 0,
          transform: `translateY(${translateY}px) scale(${scale}) rotate(${rotate}deg)`,
          opacity,
          transition: phase === 'center'
            ? 'all 0.9s cubic-bezier(0.16, 1, 0.3, 1)'
            : 'all 0.7s cubic-bezier(0.55, 0, 1, 0.45)',
        }}
      >
        {/* Glow */}
        <span
          className="absolute rounded-full blur-2xl"
          style={{
            width: 90, height: 90,
            left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            background: tool.glowColor,
            opacity: phase === 'center' ? 0.7 : 0,
            transition: 'opacity 0.8s ease',
          }}
        />
        <span className="relative block w-full h-full">
          {tool.svg}
        </span>
      </span>

      <style>{`
        @keyframes heroSplashRing {
          0% { width: 0; height: 0; opacity: 0.7; }
          100% { width: 120px; height: 120px; opacity: 0; }
        }
        @keyframes heroSplashRing2 {
          0% { width: 0; height: 0; opacity: 0.5; }
          100% { width: 170px; height: 170px; opacity: 0; }
        }
        @keyframes heroSplashDrop {
          0% { opacity: 0.8; transform: translate(0, 0) scale(1); }
          60% { opacity: 0.5; }
          100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.15); }
        }
      `}</style>
    </span>
  );
}
