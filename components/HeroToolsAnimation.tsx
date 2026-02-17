import React, { useState, useEffect, useCallback, useMemo } from 'react';

interface ToolDef {
  color: string;
  glowColor: string;
  svg: (prefix: string) => React.ReactNode;
}

const tools: ToolDef[] = [
  // Wrench — bold orange
  {
    color: '#f97316',
    glowColor: 'rgba(249,115,22,0.3)',
    svg: (p) => (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`${p}wr1`} x1="10" y1="10" x2="70" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fb923c" />
            <stop offset="1" stopColor="#c2410c" />
          </linearGradient>
        </defs>
        <path d="M55 18a16 16 0 0 0-22.6 0l-1.2 1.2 8.6 8.6-2.8 2.8-8.6-8.6-1.2 1.2a16 16 0 0 0 0 22.6 16 16 0 0 0 18.2 3l17 17a5 5 0 0 0 7.1-7.1l-17-17A16 16 0 0 0 55 18z" fill={`url(#${p}wr1)`} />
        <path d="M55 18a16 16 0 0 0-22.6 0l-1.2 1.2 8.6 8.6-2.8 2.8-8.6-8.6-1.2 1.2a16 16 0 0 0 0 22.6 16 16 0 0 0 18.2 3l17 17a5 5 0 0 0 7.1-7.1l-17-17A16 16 0 0 0 55 18z" fill="#000" opacity="0.08" />
        <rect x="54" y="52" width="8" height="16" rx="2" transform="rotate(45 58 60)" fill="#9a3412" />
        <circle cx="56" cy="58" r="3" fill="#fdba74" opacity="0.6" />
        <path d="M24 24l6 6" stroke="#fdba74" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      </svg>
    ),
  },
  // Paint Roller — vivid pink
  {
    color: '#ec4899',
    glowColor: 'rgba(236,72,153,0.3)',
    svg: (p) => (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`${p}rl1`} x1="10" y1="10" x2="65" y2="35" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f472b6" />
            <stop offset="1" stopColor="#be185d" />
          </linearGradient>
        </defs>
        <rect x="12" y="12" width="50" height="20" rx="6" fill={`url(#${p}rl1)`} />
        <rect x="12" y="12" width="50" height="20" rx="6" fill="#000" opacity="0.06" />
        <rect x="14" y="14" width="22" height="16" rx="4" fill="#f9a8d4" opacity="0.35" />
        <rect x="62" y="18" width="8" height="8" rx="2" fill="#9d174d" />
        <rect x="36" y="32" width="6" height="22" rx="3" fill="#57534e" />
        <rect x="36" y="32" width="3" height="22" rx="1.5" fill="#78716c" />
        <rect x="32" y="52" width="14" height="6" rx="3" fill="#44403c" />
      </svg>
    ),
  },
  // Screwdriver — deep indigo + amber handle
  {
    color: '#6366f1',
    glowColor: 'rgba(99,102,241,0.3)',
    svg: (p) => (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`${p}sd1`} x1="20" y1="8" x2="55" y2="35" gradientUnits="userSpaceOnUse">
            <stop stopColor="#818cf8" />
            <stop offset="1" stopColor="#3730a3" />
          </linearGradient>
          <linearGradient id={`${p}sd2`} x1="30" y1="40" x2="50" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f59e0b" />
            <stop offset="1" stopColor="#b45309" />
          </linearGradient>
        </defs>
        <path d="M40 8l-6 3 2 22h8l2-22-6-3z" fill={`url(#${p}sd1)`} />
        <path d="M40 8l-6 3 2 22h8l2-22-6-3z" fill="#000" opacity="0.08" />
        <path d="M40 8l-3 1.5 1 11h4l1-11L40 8z" fill="#a5b4fc" opacity="0.35" />
        <rect x="33" y="33" width="14" height="6" rx="2" fill="#6366f1" />
        <path d="M34 39h12l4 6H30l4-6z" fill={`url(#${p}sd2)`} />
        <rect x="32" y="45" width="16" height="22" rx="3" fill={`url(#${p}sd2)`} />
        <rect x="32" y="45" width="16" height="22" rx="3" fill="#000" opacity="0.06" />
        <rect x="32" y="45" width="8" height="22" rx="3" fill="#fbbf24" opacity="0.25" />
        <line x1="36" y1="50" x2="36" y2="62" stroke="#78350f" strokeWidth="1.5" opacity="0.4" />
        <line x1="40" y1="48" x2="40" y2="64" stroke="#78350f" strokeWidth="1.5" opacity="0.3" />
        <line x1="44" y1="50" x2="44" y2="62" stroke="#78350f" strokeWidth="1.5" opacity="0.4" />
      </svg>
    ),
  },
  // Plunger — rich teal
  {
    color: '#14b8a6',
    glowColor: 'rgba(20,184,166,0.3)',
    svg: (p) => (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`${p}pl1`} x1="22" y1="42" x2="58" y2="68" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2dd4bf" />
            <stop offset="1" stopColor="#0f766e" />
          </linearGradient>
        </defs>
        <rect x="37" y="8" width="6" height="36" rx="3" fill="#57534e" />
        <rect x="37" y="8" width="3" height="36" rx="1.5" fill="#78716c" />
        <ellipse cx="40" cy="52" rx="18" ry="12" fill={`url(#${p}pl1)`} />
        <ellipse cx="40" cy="52" rx="18" ry="12" fill="#000" opacity="0.08" />
        <ellipse cx="40" cy="50" rx="18" ry="10" fill="#0d9488" opacity="0.5" />
        <ellipse cx="35" cy="48" rx="6" ry="3.5" fill="#5eead4" opacity="0.3" />
        <path d="M22 52c0 8 8 16 18 16s18-8 18-16" stroke="#134e4a" strokeWidth="2" opacity="0.4" fill="none" />
      </svg>
    ),
  },
  // Scissors — dark steel blades + bold red rings
  {
    color: '#ef4444',
    glowColor: 'rgba(239,68,68,0.3)',
    svg: (p) => (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`${p}sc1`} x1="25" y1="20" x2="55" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#71717a" />
            <stop offset="1" stopColor="#3f3f46" />
          </linearGradient>
        </defs>
        <path d="M28 26L54 56" stroke={`url(#${p}sc1)`} strokeWidth="7" strokeLinecap="round" />
        <path d="M28 54L54 24" stroke={`url(#${p}sc1)`} strokeWidth="7" strokeLinecap="round" />
        <path d="M30 27L52 55" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        <path d="M30 53L52 25" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        <circle cx="24" cy="22" r="9" fill="#fecaca" />
        <circle cx="24" cy="22" r="9" stroke="#dc2626" strokeWidth="3.5" fill="none" />
        <circle cx="24" cy="22" r="4.5" fill="#fef2f2" />
        <circle cx="24" cy="58" r="9" fill="#fecaca" />
        <circle cx="24" cy="58" r="9" stroke="#dc2626" strokeWidth="3.5" fill="none" />
        <circle cx="24" cy="58" r="4.5" fill="#fef2f2" />
        <circle cx="40" cy="40" r="4" fill="#52525b" />
        <circle cx="40" cy="40" r="2" fill="#a1a1aa" />
      </svg>
    ),
  },
  // Drill — saturated yellow body + dark steel bit
  {
    color: '#eab308',
    glowColor: 'rgba(234,179,8,0.3)',
    svg: (p) => (
      <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
        <defs>
          <linearGradient id={`${p}dr1`} x1="6" y1="28" x2="55" y2="55" gradientUnits="userSpaceOnUse">
            <stop stopColor="#facc15" />
            <stop offset="1" stopColor="#a16207" />
          </linearGradient>
          <linearGradient id={`${p}dr2`} x1="53" y1="34" x2="76" y2="46" gradientUnits="userSpaceOnUse">
            <stop stopColor="#71717a" />
            <stop offset="1" stopColor="#3f3f46" />
          </linearGradient>
        </defs>
        <path d="M10 30h35c4 0 8 3 8 8v4c0 5-4 8-8 8H10c-3 0-4-2-4-5V35c0-3 1-5 4-5z" fill={`url(#${p}dr1)`} />
        <path d="M10 30h35c4 0 8 3 8 8v4c0 5-4 8-8 8H10c-3 0-4-2-4-5V35c0-3 1-5 4-5z" fill="#000" opacity="0.06" />
        <path d="M10 30h18c2 0 4 3 4 8v4c0 5-2 8-4 8H10c-3 0-4-2-4-5V35c0-3 1-5 4-5z" fill="#fde68a" opacity="0.35" />
        <rect x="14" y="42" width="16" height="5" rx="2" fill="#854d0e" opacity="0.45" />
        <circle cx="20" cy="38" r="3" fill="#fef9c3" opacity="0.5" />
        <path d="M53 36l22-2v12l-22-2V36z" fill={`url(#${p}dr2)`} />
        <path d="M53 36l22-2v12l-22-2V36z" fill="#000" opacity="0.06" />
        <line x1="57" y1="38" x2="72" y2="37" stroke="#52525b" strokeWidth="1.5" opacity="0.6" />
        <line x1="57" y1="42" x2="72" y2="43" stroke="#52525b" strokeWidth="1.5" opacity="0.6" />
        <rect x="8" y="50" width="12" height="8" rx="2" fill="#854d0e" />
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

// Desktop: 28 primary droplets + 16 secondary = dense splash
const desktopDroplets = generateDroplets(28);
const desktopSubDroplets = generateDroplets(16);
// Mobile: compact splash
const mobileDroplets = generateDroplets(8);

interface Props {
  variant?: 'desktop' | 'mobile';
}

export default function HeroToolsAnimation({ variant = 'desktop' }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<'enter' | 'center' | 'exit'>('enter');
  const [splashKey, setSplashKey] = useState(0);

  const prefix = variant === 'mobile' ? 'mob_' : 'dsk_';

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
  const isMobile = variant === 'mobile';

  const pos = phase === 'enter'
    ? { x: 50, y: -30 }
    : phase === 'center'
    ? { x: 50, y: 50 }
    : { x: 50, y: 130 };

  const scale = phase === 'center' ? 1 : phase === 'enter' ? 0.4 : 0.3;
  const opacity = phase === 'center' ? 1 : 0;
  const rotate = phase === 'enter' ? -25 : phase === 'center' ? 0 : 20;

  // Splash ring sizes
  const ring1 = isMobile ? 64 : 240;
  const ring2 = isMobile ? 90 : 340;
  const ring3 = isMobile ? 0 : 430;
  const ring4 = isMobile ? 0 : 520;

  const droplets = isMobile ? mobileDroplets : desktopDroplets;

  return (
    <div className={`w-full h-full pointer-events-none select-none relative ${isMobile ? '' : 'overflow-hidden'}`} style={isMobile ? { overflow: 'visible' } : undefined} aria-hidden="true">
      {/* Water splash */}
      {phase === 'center' && (
        <div
          key={splashKey}
          className="absolute"
          style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
        >
          {/* Ring 1 */}
          <div
            className="absolute rounded-full"
            style={{
              width: 0, height: 0,
              left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              border: `3px solid ${tool.color}`,
              opacity: 0,
              animation: 'heroRing 0.9s ease-out forwards',
              '--ring-size': `${ring1}px`,
            } as React.CSSProperties}
          />
          {/* Ring 2 */}
          <div
            className="absolute rounded-full"
            style={{
              width: 0, height: 0,
              left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              border: `2.5px solid ${tool.color}`,
              opacity: 0,
              animation: 'heroRing 1.1s ease-out 0.06s forwards',
              '--ring-size': `${ring2}px`,
            } as React.CSSProperties}
          />
          {/* Ring 3 — desktop only */}
          {!isMobile && (
            <div
              className="absolute rounded-full"
              style={{
                width: 0, height: 0,
                left: '50%', top: '50%',
                transform: 'translate(-50%, -50%)',
                border: `2px solid ${tool.color}`,
                opacity: 0,
                animation: 'heroRing 1.3s ease-out 0.12s forwards',
                '--ring-size': `${ring3}px`,
              } as React.CSSProperties}
            />
          )}
          {/* Ring 4 — desktop only */}
          {!isMobile && (
            <div
              className="absolute rounded-full"
              style={{
                width: 0, height: 0,
                left: '50%', top: '50%',
                transform: 'translate(-50%, -50%)',
                border: `1.5px solid ${tool.color}`,
                opacity: 0,
                animation: 'heroRing 1.5s ease-out 0.18s forwards',
                '--ring-size': `${ring4}px`,
              } as React.CSSProperties}
            />
          )}

          {/* Primary droplets */}
          {droplets.map((d, i) => {
            const rad = (d.angle * Math.PI) / 180;
            const dist = isMobile ? d.distance * 0.55 : d.distance * 2;
            const sz = isMobile ? d.size * 0.8 : d.size * 1.4;
            const tx = Math.cos(rad) * dist;
            const ty = Math.sin(rad) * dist;
            return (
              <div
                key={`${splashKey}-p-${i}`}
                className="absolute rounded-full"
                style={{
                  width: sz, height: sz,
                  left: '50%', top: '50%',
                  marginLeft: -sz / 2, marginTop: -sz / 2,
                  background: tool.color,
                  opacity: 0,
                  animation: `heroDrop 0.7s ease-out ${d.delay}s forwards`,
                  '--tx': `${tx}px`,
                  '--ty': `${ty}px`,
                } as React.CSSProperties}
              />
            );
          })}

          {/* Secondary smaller droplets — desktop only for dense splash */}
          {!isMobile && desktopSubDroplets.map((d, i) => {
            const rad = ((d.angle + 18) * Math.PI) / 180;
            const dist = d.distance * 1.3;
            const sz = d.size * 0.6;
            const tx = Math.cos(rad) * dist;
            const ty = Math.sin(rad) * dist;
            return (
              <div
                key={`${splashKey}-s-${i}`}
                className="absolute rounded-full"
                style={{
                  width: sz, height: sz,
                  left: '50%', top: '50%',
                  marginLeft: -sz / 2, marginTop: -sz / 2,
                  background: tool.color,
                  opacity: 0,
                  animation: `heroDrop 0.55s ease-out ${d.delay + 0.04}s forwards`,
                  '--tx': `${tx}px`,
                  '--ty': `${ty}px`,
                } as React.CSSProperties}
              />
            );
          })}

          {/* Trailing mist droplets — desktop only */}
          {!isMobile && desktopDroplets.slice(0, 10).map((d, i) => {
            const rad = ((d.angle + 40) * Math.PI) / 180;
            const dist = d.distance * 2.8;
            const sz = 2 + Math.random() * 3;
            const tx = Math.cos(rad) * dist;
            const ty = Math.sin(rad) * dist;
            return (
              <div
                key={`${splashKey}-m-${i}`}
                className="absolute rounded-full"
                style={{
                  width: sz, height: sz,
                  left: '50%', top: '50%',
                  marginLeft: -sz / 2, marginTop: -sz / 2,
                  background: tool.color,
                  opacity: 0,
                  animation: `heroDrop 0.9s ease-out ${d.delay + 0.1}s forwards`,
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
        {/* Glow */}
        <div
          className="absolute rounded-full blur-2xl"
          style={{
            width: isMobile ? 64 : 220,
            height: isMobile ? 64 : 220,
            left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            background: tool.glowColor,
            opacity: phase === 'center' ? 0.7 : 0,
            transition: 'opacity 0.8s ease',
          }}
        />
        {/* Icon */}
        <div className={isMobile ? 'relative w-14 h-14' : 'relative w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48'}>
          {tool.svg(prefix)}
        </div>
      </div>

      <style>{`
        @keyframes heroRing {
          0% { width: 0; height: 0; opacity: 0.7; }
          100% { width: var(--ring-size); height: var(--ring-size); opacity: 0; }
        }
        @keyframes heroDrop {
          0% { opacity: 0.85; transform: translate(0, 0) scale(1); }
          50% { opacity: 0.55; }
          100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0.1); }
        }
      `}</style>
    </div>
  );
}
