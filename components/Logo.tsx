import React from 'react';

interface LogoProps {
  className?: string;
  animate?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8", animate = false }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={`${className} ${animate ? 'animate-spin' : ''}`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer hexagon */}
      <path 
        d="M50 5 L85 27.5 L85 72.5 L50 95 L15 72.5 L15 27.5 Z" 
        stroke="currentColor" 
        strokeWidth="3" 
        fill="none"
        className="text-blue-500"
      />
      
      {/* Inner S shape */}
      <path 
        d="M 40 30 Q 55 30 55 40 Q 55 50 40 50 Q 25 50 25 60 Q 25 70 40 70 L 60 70" 
        stroke="currentColor" 
        strokeWidth="4" 
        strokeLinecap="round"
        fill="none"
        className="text-blue-500"
      />
      
      {/* Accent dots */}
      <circle cx="65" cy="35" r="3" fill="currentColor" className="text-blue-400" />
      <circle cx="35" cy="65" r="3" fill="currentColor" className="text-blue-400" />
    </svg>
  );
};

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Logo className="w-16 h-16 text-blue-500" animate={true} />
        <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em]">Loading...</p>
      </div>
    </div>
  );
};
