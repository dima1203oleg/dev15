import React from 'react';
import { TrendingUp, Award, Lock, Sparkles, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { FinancialCardViewModel } from '../../../types/finance';
import { RankBadge } from '../RankBadge';
import { EmvChip, ContactlessNfcIcon, HologramWatermark } from './EmvChip';
import { GeminiSparkle } from '../../common/GeminiSparkle';

interface EarningsCardProps {
  data: FinancialCardViewModel;
  isActive: boolean;
}

export const EarningsCard: React.FC<EarningsCardProps> = ({ data, isActive }) => {
  const { earnings, rank } = data;
  const isStarter = rank.id === 'STARTER';

  // Calculate sparkline SVG path
  const sparklinePoints = earnings.sparklineData;
  const minVal = Math.min(...sparklinePoints);
  const maxVal = Math.max(...sparklinePoints);
  const range = maxVal - minVal || 1;

  const width = 140;
  const height = 36;
  const points = sparklinePoints.map((val, idx) => {
    const x = (idx / (sparklinePoints.length - 1)) * width;
    const y = height - ((val - minVal) / range) * (height - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;

  // Rank progress calculation
  const qualifiedL1 = rank.qualifiedL1;
  const nextThreshold = rank.nextThreshold || 200;
  const prevThreshold = rank.id === 'GOLD' ? 75 : rank.id === 'SILVER' ? 30 : rank.id === 'BRONZE' ? 10 : 0;
  const progressRatio = Math.min(
    1,
    Math.max(0, (qualifiedL1 - prevThreshold) / (nextThreshold - prevThreshold || 1))
  );

  return (
    <div className="relative w-full h-full rounded-3xl p-5 sm:p-6 flex flex-col justify-between overflow-hidden select-none shadow-2xl">
      
      {/* 1. Deep Space Obsidian Glass Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0d0a1a] to-[#120826] rounded-3xl pointer-events-none" />

      {/* Google Gemini Radiant Purple & Sunset Magenta Nebula Glow */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-purple-500/25 via-pink-500/20 to-indigo-500/15 rounded-full blur-3xl pointer-events-none animate-gemini-aura" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-tr from-amber-500/15 via-rose-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      
      {/* Edge Illumination Rim with Iridescent Accent */}
      <div className="absolute inset-0 rounded-3xl border border-white/15 pointer-events-none shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_0_24px_rgba(168,85,247,0.25)]" />
      
      {/* Subtle diagonal glass reflection */}
      <div className="absolute -inset-full bg-gradient-to-tr from-transparent via-pink-400/[0.04] to-transparent pointer-events-none rotate-12" />

      {/* Hologram Watermark */}
      <HologramWatermark variant="amber" />

      {/* 2. Top Header: EMV Chip + Brand + Rank Badge */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <EmvChip variant="gold" />
          <ContactlessNfcIcon className="w-4 h-4 text-purple-400/80" />
          <div className="border-l border-white/10 pl-2">
            <div className="flex items-center gap-1.5">
              <GeminiSparkle className="w-3 h-3" animated />
              <span className="text-[9px] font-mono uppercase tracking-widest gemini-gradient-text font-bold block">
                GEMINI YIELD ENGINE · 02
              </span>
            </div>
            <h3 className="text-xs font-sans font-black text-white tracking-wider uppercase">
              ДИНАМІКА ДОХОДУ
            </h3>
          </div>
        </div>

        <RankBadge rank={rank} />
      </div>

      {/* 3. Main Figure + Clean Sparkline */}
      <div className="relative z-10 my-1 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-300 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]">₴</span>
            <span className="text-3xl sm:text-4xl md:text-[42px] font-black tracking-tight text-white font-mono drop-shadow-md">
              {earnings.thisMonth.toLocaleString('uk-UA')}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-300 flex items-center gap-2 mt-1">
            <span className="text-slate-400">цього місяця</span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-300 font-bold flex items-center bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-800/50 text-[10px]">
              +{earnings.percentageChange}% ↑ РІСТ
            </span>
          </div>
        </div>

        {/* Small Clean Sparkline with Multi-Color Gemini Gradient */}
        <div className="hidden sm:block">
          <svg width={width} height={height} className="overflow-visible">
            <defs>
              <linearGradient id="geminiSparkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c084fc" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#f472b6" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={areaD} fill="url(#geminiSparkGrad)" />
            <path d={pathD} fill="none" stroke="#e879f9" strokeWidth="2.5" strokeLinecap="round" />
            <circle 
              cx={width} 
              cy={height - ((earnings.thisMonth - minVal) / range) * (height - 8) - 4} 
              r="4" 
              className="fill-pink-300 stroke-slate-950 stroke-2" 
            />
            <circle 
              cx={width} 
              cy={height - ((earnings.thisMonth - minVal) / range) * (height - 8) - 4} 
              r="7" 
              className="fill-none stroke-purple-400 stroke-1 animate-ping opacity-75" 
            />
          </svg>
        </div>
      </div>

      {/* 4. Rank Progress Line with Gemini Iridescent Bar */}
      <div className="relative z-10 p-2.5 rounded-2xl bg-slate-950/70 border border-white/10 backdrop-blur-xl shadow-inner">
        <div className="flex items-center justify-between text-[10px] font-mono mb-1.5 text-slate-300">
          <span className="font-bold flex items-center gap-1.5">
            <GeminiSparkle className="w-3.5 h-3.5" />
            <span>{rank.qualifiedL1} / {nextThreshold} L1 активних</span>
          </span>
          <span className="text-purple-200 font-bold bg-purple-950/70 px-2 py-0.5 rounded-full border border-purple-800/50 text-[9px]">
            {rank.remainingToNext ? `${rank.remainingToNext} до ${rank.nextRankName}` : 'Максимальний ранг'}
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-slate-900/90 overflow-hidden p-0.5 border border-white/10">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_12px_rgba(168,85,247,0.6)] transition-all duration-500"
            style={{ width: `${Math.round(progressRatio * 100)}%` }}
          />
        </div>
      </div>

      {/* 5. L1 / L2 Breakdown + Lifetime Stats in Frosted Pill Row */}
      <div className="relative z-10 grid grid-cols-3 gap-2 pt-1 border-t border-white/10 text-[11px] font-mono">
        <div>
          <span className="text-[9px] text-slate-400 uppercase font-semibold block">Всього</span>
          <span className="font-black text-white">₴ {earnings.lifetime.toLocaleString('uk-UA')}</span>
        </div>

        <div>
          <span className="text-[9px] text-slate-400 uppercase font-semibold block">L1 дохід (20%)</span>
          <span className="font-black text-cyan-300">
            ₴ {(earnings.l1 ?? 1940).toLocaleString('uk-UA')}
          </span>
        </div>

        <div>
          <span className="text-[9px] text-slate-400 uppercase font-semibold block">L2 дохід</span>
          {isStarter ? (
            <span className="font-bold text-rose-400 flex items-center gap-1 text-[10px] bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-900/40" title="Потрібно 10 L1">
              <Lock className="w-2.5 h-2.5" /> БЛОК · 0%
            </span>
          ) : (
            <span className="font-black text-purple-300">
              ₴ {(earnings.l2 ?? 900).toLocaleString('uk-UA')}
            </span>
          )}
        </div>
      </div>

    </div>
  );
};
