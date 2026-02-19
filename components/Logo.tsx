import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textClassName?: string;
}

const ServizoSvgLogo: React.FC<{ size: number; className?: string }> = ({ size, className = "" }) => {
  const h = Math.round(size * 1.3);
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 100 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/*
        Logo analysis from image:
        - Top circle: centered around (40, 35), radius ~26. Nearly full circle.
          Opens at bottom-right, where it "hands off" to the bottom circle.
        - Bottom circle: centered around (60, 93), radius ~26. Nearly full circle.
          Opens at top-left, where it connects from the top circle.
        - They cross in the middle area (~50, 64).
        - 3 dots: top-right of top circle, at the crossing, bottom-left of bottom circle.

        Top circle arc: starts at the crossing point (56, 58), goes counter-clockwise
        (large arc) almost all the way around, ending back near (56, 58) opening.
        We draw it from (57, 55) sweeping CCW large arc to (46, 72).

        Bottom circle arc: starts at (54, 57) sweeping CW large arc to (43, 73).
      */}

      {/* Top loop: center ~(40,36), r=26. 
          Arc from dot1 (65,42) going counter-clockwise (sweep=0, large-arc=1)
          around nearly full circle to dot2 (54,62) */}
      <path
        d="M 65 42 A 27 27 0 1 0 54 62"
        stroke="#4169E1"
        strokeWidth="8.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Bottom loop: center ~(60,92), r=26.
          Arc from dot2 (54,68) going clockwise (sweep=1, large-arc=1)
          around nearly full circle to dot3 (35,88) */}
      <path
        d="M 46 68 A 27 27 0 1 1 35 88"
        stroke="#4169E1"
        strokeWidth="8.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* 3 filled dots */}
      {/* Dot 1: top-right of top circle */}
      <circle cx="65" cy="42" r="5.5" fill="#4169E1" />
      {/* Dot 2: crossing / junction in the middle — between the two arc endpoints */}
      <circle cx="50" cy="65" r="5.5" fill="#4169E1" />
      {/* Dot 3: bottom-left of bottom circle */}
      <circle cx="35" cy="88" r="5.5" fill="#4169E1" />
    </svg>
  );
};

export const ServizoLogo: React.FC<LogoProps> = ({
  className = "",
  size = 32,
  showText = false,
  textClassName = "text-lg font-bold tracking-tight text-black"
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <ServizoSvgLogo size={size} />
      {showText && (
        <span className={textClassName} style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
          Servizo
        </span>
      )}
    </div>
  );
};

export const ServizoIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = "" }) => {
  return <ServizoSvgLogo size={size} className={className} />;
};

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="absolute inset-0 animate-ping opacity-30 rounded-full bg-[#4169E1]" style={{ animationDuration: '1.5s' }} />
          <ServizoSvgLogo size={56} />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-sm font-semibold text-black tracking-wide" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Servizo
          </span>
          <span className="text-xs text-gray-400 font-medium tracking-widest uppercase">Loading</span>
        </div>
      </div>
    </div>
  );
};

export const Logo = ServizoLogo;
