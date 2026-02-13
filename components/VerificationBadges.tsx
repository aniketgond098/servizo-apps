import React from 'react';
import { Shield, Award, Zap, FileCheck } from 'lucide-react';
import { Specialist } from '../types';

interface Props {
  specialist: Specialist;
  size?: 'sm' | 'md';
}

export default function VerificationBadges({ specialist, size = 'md' }: Props) {
  const badges = [];
  
  if (specialist.verified) {
    badges.push({ icon: Shield, label: 'Verified', color: 'blue' });
  }
  if (specialist.backgroundChecked) {
    badges.push({ icon: FileCheck, label: 'Background Checked', color: 'green' });
  }
  if (specialist.topRated) {
    badges.push({ icon: Award, label: 'Top Rated', color: 'yellow' });
  }
  if (specialist.fastResponder) {
    badges.push({ icon: Zap, label: 'Fast Responder', color: 'purple' });
  }
  if (specialist.insuranceVerified) {
    badges.push({ icon: Shield, label: 'Insurance Verified', color: 'cyan' });
  }

  if (badges.length === 0) return null;

  const sizeClasses = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const textSize = size === 'sm' ? 'text-[8px]' : 'text-[10px]';

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge, i) => {
        const Icon = badge.icon;
        const colors = {
          blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          green: 'bg-green-500/10 border-green-500/30 text-green-400',
          yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
          purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
          cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
        };
        
        return (
          <div key={i} className={`flex items-center gap-1 px-2 py-1 rounded-full border ${colors[badge.color as keyof typeof colors]}`}>
            <Icon className={sizeClasses} />
            <span className={`${textSize} font-bold uppercase tracking-wider`}>{badge.label}</span>
          </div>
        );
      })}
    </div>
  );
}
