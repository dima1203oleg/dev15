import React from 'react';
import { ArrowUpRight, ShieldCheck, CheckCircle2, AlertCircle, Coins, Zap } from 'lucide-react';
import { FinancialCardViewModel } from '../../../types/finance';
import { RankBadge } from '../RankBadge';
import { EmvChip, ContactlessNfcIcon, HologramWatermark } from './EmvChip';
import { playWebAudioSound } from '../../../utils/sirenAudio';
import { GeminiSparkle } from '../../common/GeminiSparkle';

interface PayoutCardProps {
  data: FinancialCardViewModel;
  onOpenPayout?: () => void;
  isActive: boolean;
}

export const PayoutCard: React.FC<PayoutCardProps> = ({
  data,
  onOpenPayout,
  isActive,
}) => {
  const { payout, rank, balance } = data;
  const isEligible = payout.eligible;

  return (
    <div className="relative w-full h-full rounded-3xl p-5 sm:p-6 flex flex-col justify-between overflow-hidden select-none shadow-2xl">
      
      {/* 1. Deep Space Obsidian Glass Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#06141a] to-[#041a16] rounded-3xl pointer-events-none" />

      {/* Google Gemini Emerald-Cyan Cosmic Aurora Glow */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-teal-500/25 via-emerald-500/20 to-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-gemini-aura" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-tr from-emerald-600/20 via-teal-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      
      {/* Edge Illumination Rim with Iridescent Accent */}
      <div className="absolute inset-0 rounded-3xl border border-white/15 pointer-events-none shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_0_24px_rgba(16,185,129,0.25)]" />
      
      {/* Subtle diagonal glass reflection */}
      <div className="absolute -inset-full bg-gradient-to-tr from-transparent via-emerald-400/[0.04] to-transparent pointer-events-none rotate-12" />

      {/* Hologram Watermark */}
      <HologramWatermark variant="emerald" />

      {/* 2. Top Header: EMV Chip + Brand + Rank Badge */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <EmvChip variant="emerald" />
          <ContactlessNfcIcon className="w-4 h-4 text-emerald-400/80" />
          <div className="border-l border-white/10 pl-2">
            <div className="flex items-center gap-1.5">
              <GeminiSparkle className="w-3 h-3" animated />
              <span className="text-[9px] font-mono uppercase tracking-widest gemini-gradient-text font-bold block">
                GEMINI PAYOUT GATEWAY · 03
              </span>
            </div>
            <h3 className="text-xs font-sans font-black text-white tracking-wider uppercase">
              ШЛЮЗ МИТТЄВИХ ВИПЛАТ
            </h3>
          </div>
        </div>

        <RankBadge rank={rank} />
      </div>

      {/* 3. Main Figure & CTA Button */}
      <div className="relative z-10 my-1">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-300 drop-shadow-[0_0_15px_rgba(16,185,129,0.6)]">₴</span>
              <span className="text-3xl sm:text-4xl md:text-[42px] font-black tracking-tight text-white font-mono drop-shadow-md">
                {payout.available.toLocaleString('uk-UA')}
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-300 mt-1 flex items-center gap-2">
              <span className="text-slate-400">≈ ${(payout.available / 41.5).toFixed(2)} USD</span>
              <span className="text-slate-600">·</span>
              <span className="text-emerald-300 font-bold bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-800/50 flex items-center gap-1 text-[9px]">
                <Zap className="w-3 h-3 text-emerald-400" />
                МИТТЄВО 0% КОМІСІЯ
              </span>
            </div>
          </div>

          {/* Primary CTA Button */}
          {isEligible ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                playWebAudioSound('click');
                if (onOpenPayout) onOpenPayout();
              }}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-slate-950 font-black text-xs sm:text-sm font-sans flex items-center gap-2 shadow-lg shadow-emerald-950/80 hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-emerald-200/50"
            >
              <GeminiSparkle className="w-4 h-4 text-slate-950" />
              <span>ВИВЕСТИ КОШТИ</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex flex-col items-end">
              <button
                disabled
                className="px-4 py-2 rounded-full bg-slate-800/80 text-slate-500 font-bold text-xs font-mono border border-slate-700/50 cursor-not-allowed flex items-center gap-1.5"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>ВИВЕСТИ</span>
              </button>
              <span className="text-[10px] font-mono text-amber-300/90 mt-1">
                Бракує ₴ {payout.remainingUntilMinimum?.toLocaleString('uk-UA')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Details Grid: Minimum | Pending | Lifetime Paid */}
      <div className="relative z-10 grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-950/70 border border-white/10 backdrop-blur-xl shadow-inner">
        
        {/* Min Payout */}
        <div className="text-left font-mono">
          <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Мін. поріг</div>
          <div className="text-xs sm:text-sm font-black text-white mt-0.5">
            ₴ {payout.minimum.toLocaleString('uk-UA')}
          </div>
          <div className="text-[9px] text-slate-400">екв. $10</div>
        </div>

        {/* Pending */}
        <div className="text-left font-mono border-l border-white/10 pl-2">
          <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">В обробці</div>
          <div className="text-xs sm:text-sm font-black text-amber-400 mt-0.5">
            ₴ {balance.pending.toLocaleString('uk-UA')}
          </div>
          <div className="text-[9px] text-slate-400">холд 72 год</div>
        </div>

        {/* Lifetime Paid */}
        <div className="text-left font-mono border-l border-white/10 pl-2">
          <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Виплачено</div>
          <div className="text-xs sm:text-sm font-black text-emerald-300 mt-0.5">
            ₴ {payout.lifetimePaid.toLocaleString('uk-UA')}
          </div>
          <div className="text-[9px] text-emerald-400">100% зараховано</div>
        </div>

      </div>

      {/* 5. Footer: Payout methods badge */}
      <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
        <div className="flex items-center gap-2 text-slate-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 font-bold">Mono</span>
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 font-bold">Приват</span>
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 font-bold">IBAN</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-800/50 text-emerald-300 font-bold">USDT</span>
          </div>
        </div>
        <span className="text-emerald-400/90 font-mono font-bold flex items-center gap-1">
          <GeminiSparkle className="w-2.5 h-2.5" />
          24/7 INSTANT
        </span>
      </div>

    </div>
  );
};
