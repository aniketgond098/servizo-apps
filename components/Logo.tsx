import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textClassName?: string;
}

export const ServizoLogo: React.FC<LogoProps> = ({ 
  className = "", 
  size = 32, 
  showText = false,
  textClassName = "text-lg font-bold tracking-tight text-[#1a2b49]"
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 64 64" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background rounded square */}
        <rect width="64" height="64" rx="16" fill="#1a2b49"/>
        
        {/* Wrench handle - diagonal line behind the S */}
        <line x1="16" y1="48" x2="48" y2="16" stroke="#2a3d63" strokeWidth="6" strokeLinecap="round"/>
        
        {/* Stylized S path */}
        <path 
          d="M38 18H28C24.134 18 21 21.134 21 25v0c0 3.866 3.134 7 7 7h8c3.866 0 7 3.134 7 7v0c0 3.866-3.134 7-7 7H26" 
          stroke="white" 
          strokeWidth="5" 
          strokeLinecap="round"
        />
        
        {/* Wrench jaw top-right */}
        <circle cx="48" cy="16" r="5" stroke="#4B9CFF" strokeWidth="2.5" fill="none"/>
        
        {/* Wrench jaw bottom-left */}
        <circle cx="16" cy="48" r="5" stroke="#4B9CFF" strokeWidth="2.5" fill="none"/>
        
        {/* Bolt/nut accent top-right */}
        <circle cx="48" cy="16" r="1.5" fill="#4B9CFF"/>
        
        {/* Bolt/nut accent bottom-left */}
        <circle cx="16" cy="48" r="1.5" fill="#4B9CFF"/>
      </svg>
      
      {showText && (
        <span className={textClassName} style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
          Servizo
        </span>
      )}
    </div>
  );
};

export const ServizoIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="64" height="64" rx="16" fill="#1a2b49"/>
      <line x1="16" y1="48" x2="48" y2="16" stroke="#2a3d63" strokeWidth="6" strokeLinecap="round"/>
      <path 
        d="M38 18H28C24.134 18 21 21.134 21 25v0c0 3.866 3.134 7 7 7h8c3.866 0 7 3.134 7 7v0c0 3.866-3.134 7-7 7H26" 
        stroke="white" 
        strokeWidth="5" 
        strokeLinecap="round"
      />
      <circle cx="48" cy="16" r="5" stroke="#4B9CFF" strokeWidth="2.5" fill="none"/>
      <circle cx="16" cy="48" r="5" stroke="#4B9CFF" strokeWidth="2.5" fill="none"/>
      <circle cx="48" cy="16" r="1.5" fill="#4B9CFF"/>
      <circle cx="16" cy="48" r="1.5" fill="#4B9CFF"/>
    </svg>
  );
};

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-[#1a2b49]/10 animate-ping" style={{ animationDuration: '1.5s' }}/>
          <ServizoIcon size={56} />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-sm font-semibold text-[#1a2b49] tracking-wide" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Servizo
          </span>
          <span className="text-xs text-gray-400 font-medium tracking-widest uppercase">Loading</span>
        </div>
      </div>
    </div>
  );
};

export const Logo = ServizoLogo;
