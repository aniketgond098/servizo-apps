import React from 'react';
import { Wrench, Hammer, Zap, Droplet, Ruler, Paintbrush, Cpu, Drill } from 'lucide-react';

export function AnimatedBackground() {
  const tools = [
    { Icon: Wrench, delay: 0, duration: 20 },
    { Icon: Hammer, delay: 2, duration: 25 },
    { Icon: Zap, delay: 4, duration: 22 },
    { Icon: Droplet, delay: 1, duration: 24 },
    { Icon: Ruler, delay: 3, duration: 23 },
    { Icon: Paintbrush, delay: 5, duration: 21 },
    { Icon: Cpu, delay: 2.5, duration: 26 },
    { Icon: Drill, delay: 4.5, duration: 19 }
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-5 dark:opacity-10">
      {tools.map(({ Icon, delay, duration }, i) => (
        <div
          key={i}
          className="absolute animate-float"
          style={{
            left: `${(i * 12) % 100}%`,
            top: `${(i * 15) % 100}%`,
            animationDelay: `${delay}s`,
            animationDuration: `${duration}s`
          }}
        >
          <Icon className="w-16 h-16 text-blue-500" strokeWidth={1} />
        </div>
      ))}
    </div>
  );
}
