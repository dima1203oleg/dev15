import React from 'react';
import { Award, Lock } from 'lucide-react';
import { FinancialCardViewModel } from '../../types/finance';

interface RankBadgeProps {
  rank: FinancialCardViewModel['rank'];
}

export const RankBadge: React.FC<RankBadgeProps> = ({ rank }) => {
  const isStarter = rank.id === 'STARTER';

  if (isStarter) {
    return (
      <div 
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-[10px] font-mono shadow-sm select-none"
        title="Стартовий ранг: L1 5%, L2 заблоковано до досягнення 10 активних L1"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        <span className="font-extrabold text-slate-300">STARTER</span>
        <span className="text-slate-500">·</span>
        <span className="text-slate-300 font-bold">L1 5%</span>
        <span className="text-slate-500">·</span>
        <span className="text-rose-400/90 font-bold flex items-center gap-0.5">
          <Lock className="w-2.5 h-2.5 inline" /> L2 0%
        </span>
      </div>
    );
  }

  // Bronze, Silver, Gold, Platinum
  const badgeColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    BRONZE: {
      bg: 'bg-amber-950/60',
      text: 'text-amber-300',
      border: 'border-amber-700/50',
      dot: 'bg-amber-500',
    },
    SILVER: {
      bg: 'bg-slate-800/60',
      text: 'text-slate-200',
      border: 'border-slate-500/50',
      dot: 'bg-slate-300',
    },
    GOLD: {
      bg: 'bg-yellow-950/60',
      text: 'text-yellow-300',
      border: 'border-yellow-600/50',
      dot: 'bg-yellow-400',
    },
    PLATINUM: {
      bg: 'bg-cyan-950/60',
      text: 'text-cyan-300',
      border: 'border-cyan-600/50',
      dot: 'bg-cyan-400',
    },
  };

  const style = badgeColors[rank.id] || badgeColors.GOLD;
  const percentText = `${Math.round(rank.l1Rate * 100)}%`;

  return (
    <div 
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${style.bg} border ${style.border} text-[10px] font-mono shadow-sm select-none`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-pulse`} />
      <span className={`font-black ${style.text}`}>{rank.name.toUpperCase()}</span>
      <span className="text-slate-500">·</span>
      <span className="font-bold text-white">{percentText}</span>
    </div>
  );
};
