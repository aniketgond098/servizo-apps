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
    color: '#14b8a6',
    glowColor: 'rgba(20,184,166,0.25)',
    svg: (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id="plunger-g" x1="25" y1="45" x2="55" y2="75" gradientUnits="userSpaceOnUse">
            <stop stopColor="#5eead4" />
            <stop offset="1" stopColor="#0d9488" />
          </linearGradient>
        </defs>
        <rect x="37" y="8" width="6" height="36" rx="3" fill="#78716c" />
        <rect x="37" y="8" width="3" height="36" rx="1.5" fill="#a8a29e" opacity="0.5" />
        <ellipse cx="40" cy="52" rx="18" ry="12" fill="url(#plunger-g)" />
        <ellipse cx="40" cy="50" rx="18" ry="10" fill="#0f766e" opacity="0.4" />
        <ellipse cx="36" cy="48" rx="6" ry="4" fill="#fff" opacity="0.15" />
        <path d="M22 52c0 8 8 16 18 16s18-8 18-16" stroke="#134e4a" strokeWidth="1.5" opacity="0.3" fill="none" />
      </svg>
    ),
  },
  {
    color: '#ef4444',
    glowColor: 'rgba(239,68,68,0.25)',
    svg: (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id="scissors-g" x1="10" y1="20" x2="70" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#d4d4d8" />
            <stop offset="1" stopColor="#71717a" />
          </linearGradient>
        </defs>
        <path d="M26 28L52 58" stroke="url(#scissors-g)" strokeWidth="6" strokeLinecap="round" />
        <path d="M26 52L52 22" stroke="url(#scissors-g)" strokeWidth="6" strokeLinecap="round" />
        <path d="M26 28L52 58" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.2" />
        <path d="M26 52L52 22" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.2" />
        <circle cx="22" cy="24" r="8" stroke="#ef4444" strokeWidth="3" fill="none" />
        <circle cx="22" cy="24" r="4" fill="#ef4444" opacity="0.3" />
        <circle cx="22" cy="56" r="8" stroke="#ef4444" strokeWidth="3" fill="none" />
        <circle cx="22" cy="56" r="4" fill="#ef4444" opacity="0.3" />
        <circle cx="39" cy="40" r="3" fill="#a1a1aa" />
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

export default function HeroToolsAnimation() {
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

  // All tools drop from above and exit downward — landing at center of this container
  const pos = phase === 'enter'
    ? { x: 50, y: -30 }
    : phase === 'center'
    ? { x: 50, y: 50 }
    : { x: 50, y: 130 };

  const scale = phase === 'center' ? 1 : phase === 'enter' ? 0.4 : 0.3;
  const opacity = phase === 'center' ? 1 : 0;
  const rotate = phase === 'enter' ? -25 : phase === 'center' ? 0 : 20;

  return (
    <div className="w-full h-full overflow-hidden pointer-events-none select-none relative" aria-hidden="true">
      {/* Water splash at center */}
      {phase === 'center' && (
        <div
          key={splashKey}
          className="absolute"
          style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
        >
          {/* Splash rings */}
          <div
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
          <div
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
          {/* Droplets */}
          {splashDroplets.map((d, i) => {
            const rad = (d.angle * Math.PI) / 180;
            const tx = Math.cos(rad) * d.distance;
            const ty = Math.sin(rad) * d.distance;
            return (
              <div
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
        </div>
      )}

      {/* Tool SVG */}
      <div
        className="absolute will-change-transform"
        style={{
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`,
          opacity,
          transition: phase === 'center'
            ? 'all 0.9s cubic-bezier(0.16, 1, 0.3, 1)'
            : 'all 0.7s cubic-bezier(0.55, 0, 1, 0.45)',
        }}
      >
        {/* Soft glow behind tool */}
        <div
          className="absolute rounded-full blur-2xl"
          style={{
            width: 120, height: 120,
            left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            background: tool.glowColor,
            opacity: phase === 'center' ? 0.7 : 0,
            transition: 'opacity 0.8s ease',
          }}
        />
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24">
          {tool.svg}
        </div>
      </div>

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
    </div>
  );
}
