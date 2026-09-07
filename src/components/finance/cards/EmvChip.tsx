import React from 'react';

interface EmvChipProps {
  variant?: 'gold' | 'silver' | 'emerald';
  className?: string;
}

export const EmvChip: React.FC<EmvChipProps> = ({ variant = 'gold', className = '' }) => {
  const isGold = variant === 'gold';
  const isEmerald = variant === 'emerald';

  const baseGrad = isGold 
    ? 'from-amber-200 via-yellow-400 to-amber-600'
    : isEmerald
    ? 'from-emerald-200 via-teal-400 to-emerald-700'
    : 'from-slate-200 via-slate-300 to-slate-500';

  const strokeColor = isGold ? '#78350f' : isEmerald ? '#064e3b' : '#334155';

  return (
    <div className={`relative w-10 h-7 rounded-md bg-gradient-to-br ${baseGrad} p-[1px] shadow-md shadow-black/40 overflow-hidden ${className}`}>
      {/* Metallic Texture Grid Lines */}
      <svg viewBox="0 0 40 28" className="w-full h-full" fill="none">
        {/* Outer frame */}
        <rect x="1" y="1" width="38" height="26" rx="3" stroke={strokeColor} strokeWidth="0.8" opacity="0.6" />
        
        {/* Center contact pad */}
        <rect x="13" y="7" width="14" height="14" rx="2" stroke={strokeColor} strokeWidth="0.8" opacity="0.7" fill={isGold ? '#fbbf24' : isEmerald ? '#10b981' : '#cbd5e1'} fillOpacity="0.25" />
        
        {/* Horizontal dividing traces */}
        <line x1="1" y1="14" x2="13" y2="14" stroke={strokeColor} strokeWidth="0.8" opacity="0.6" />
        <line x1="27" y1="14" x2="39" y2="14" stroke={strokeColor} strokeWidth="0.8" opacity="0.6" />
        
        {/* Vertical dividing traces */}
        <line x1="20" y1="1" x2="20" y2="7" stroke={strokeColor} strokeWidth="0.8" opacity="0.6" />
        <line x1="20" y1="21" x2="20" y2="27" stroke={strokeColor} strokeWidth="0.8" opacity="0.6" />

        {/* Diagonal corner trace notches */}
        <path d="M 6 1 L 6 7 L 13 14" stroke={strokeColor} strokeWidth="0.6" opacity="0.5" />
        <path d="M 34 1 L 34 7 L 27 14" stroke={strokeColor} strokeWidth="0.6" opacity="0.5" />
        <path d="M 6 27 L 6 21 L 13 14" stroke={strokeColor} strokeWidth="0.6" opacity="0.5" />
        <path d="M 34 27 L 34 21 L 27 14" stroke={strokeColor} strokeWidth="0.6" opacity="0.5" />
      </svg>
      
      {/* Specular Glint */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
    </div>
  );
};

export const ContactlessNfcIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4 text-slate-400' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
    <path d="M8.5 16.5a5 5 0 0 1 0-9" opacity="0.6" />
    <path d="M12 19a8.5 8.5 0 0 1 0-14" opacity="0.8" />
    <path d="M15.5 21.5a12 12 0 0 1 0-19" />
  </svg>
);

export const HologramWatermark: React.FC<{ variant?: 'cyan' | 'amber' | 'emerald' }> = ({ variant = 'cyan' }) => {
  const glow = variant === 'cyan' ? 'text-cyan-400/15' : variant === 'amber' ? 'text-amber-400/15' : 'text-emerald-400/15';
  return (
    <div className={`absolute right-4 bottom-4 pointer-events-none select-none flex flex-col items-end opacity-25 ${glow}`}>
      <div className="text-[8px] font-mono tracking-widest uppercase font-black">DEV20 LEDGER</div>
      <div className="text-[7px] font-mono tracking-wider opacity-70">SOVEREIGN PROTOCOL</div>
    </div>
  );
};
