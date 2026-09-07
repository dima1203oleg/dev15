import React from 'react';
import { Wallet, ArrowUpRight, ShieldCheck, CheckCircle2, Cpu, Sparkles } from 'lucide-react';
import { FinancialCardViewModel } from '../../../types/finance';
import { RankBadge } from '../RankBadge';
import { EmvChip, ContactlessNfcIcon, HologramWatermark } from './EmvChip';
import { playWebAudioSound } from '../../../utils/sirenAudio';
import { GeminiSparkle } from '../../common/GeminiSparkle';

interface BalanceCardProps {
  data: FinancialCardViewModel;
  onOpenPayout?: () => void;
  isActive: boolean;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  data,
  onOpenPayout,
  isActive,
}) => {
  const { balance, rank, payout, updatedAt } = data;

  return (
    <div className="relative w-full h-full rounded-3xl p-5 sm:p-6 flex flex-col justify-between overflow-hidden select-none shadow-2xl">
      
      {/* 1. Deep Space Obsidian Glass Surface */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/95 to-[#080b18] rounded-3xl pointer-events-none" />
      
      {/* Google Gemini Cosmic Blue & Violet Aurora Glow */}
      <div className="absolute -top-24 -right-20 w-64 h-64 bg-gradient-to-br from-blue-500/25 via-indigo-500/20 to-purple-500/15 rounded-full blur-3xl pointer-events-none animate-gemini-aura" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-tr from-cyan-500/20 via-blue-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      
      {/* Gemini Signature Iridescent Edge Rim */}
      <div className="absolute inset-0 rounded-3xl border border-white/15 pointer-events-none shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_0_24px_rgba(99,102,241,0.2)]" />
      
      {/* Diagonal Iridescent Light Sweep */}
      <div className="absolute -inset-full bg-gradient-to-tr from-transparent via-purple-400/[0.05] via-blue-400/[0.04] to-transparent pointer-events-none rotate-12" />

      {/* Hologram Protocol Watermark with Gemini Sparkle */}
      <HologramWatermark variant="cyan" />

      {/* 2. Top Header Row: EMV Chip + Google Gemini Brand + Rank Badge */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <EmvChip variant="gold" />
          <ContactlessNfcIcon className="w-4 h-4 text-cyan-400/80" />
          <div className="border-l border-white/10 pl-2">
            <div className="flex items-center gap-1.5">
              <GeminiSparkle className="w-3 h-3" animated />
              <span className="text-[9px] font-mono uppercase tracking-widest gemini-gradient-text font-bold block">
                GEMINI SMART LEDGER · 01
              </span>
            </div>
            <h3 className="text-xs font-sans font-black text-white tracking-wider uppercase">
              ЗАГАЛЬНИЙ БАЛАНС
            </h3>
          </div>
        </div>

        <RankBadge rank={rank} />
      </div>

      {/* 3. Main Big Figure & Quick Action */}
      <div className="relative z-10 my-1">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="text-2xl sm:text-3xl font-extrabold text-cyan-300 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]">₴</span>
              <span className="text-3xl sm:text-4xl md:text-[42px] font-black tracking-tight text-white font-mono drop-shadow-md">
                {balance.total.toLocaleString('uk-UA')}
              </span>
            </div>
            {/* Tactile Virtual Card ID */}
            <div className="text-[10px] font-mono tracking-widest text-slate-400 mt-1 flex items-center gap-2">
              <span className="text-slate-500">DEV20</span>
              <span>••••</span>
              <span>8492</span>
              <span>4230</span>
              <span className="text-purple-300 text-[9px] px-2 py-0.5 rounded-full bg-purple-950/60 border border-purple-800/50 flex items-center gap-1">
                <GeminiSparkle className="w-2.5 h-2.5" />
                AI VERIFIED
              </span>
            </div>
          </div>

          {/* Quick Payout Button (active only if eligible) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              playWebAudioSound('click');
              if (payout.eligible && onOpenPayout) {
                onOpenPayout();
              }
            }}
            disabled={!payout.eligible}
            className={`px-4 py-2 rounded-full font-mono text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg ${
              payout.eligible
                ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white font-black shadow-purple-950/60 active:scale-95 cursor-pointer hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] border border-purple-300/40'
                : 'bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            }`}
          >
            <span>Вивести кошти</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Financial Breakdown Row (Доступно | Очікує | Утримано) with Frosted Pill Effect */}
      <div className="relative z-10 grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-950/70 border border-white/10 backdrop-blur-xl shadow-inner">
        
        {/* Доступно */}
        <div className="text-left font-mono">
          <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            Доступно
          </div>
          <div className="text-xs sm:text-sm font-black text-emerald-400 mt-0.5">
            ₴ {balance.available.toLocaleString('uk-UA')}
          </div>
        </div>

        {/* Очікує */}
        <div className="text-left font-mono border-l border-white/10 pl-2">
          <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            Очікує
          </div>
          <div className="text-xs sm:text-sm font-black text-amber-400 mt-0.5">
            ₴ {balance.pending.toLocaleString('uk-UA')}
          </div>
        </div>

        {/* Утримано */}
        <div className="text-left font-mono border-l border-white/10 pl-2">
          <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block" />
            Утримано
          </div>
          <div className="text-xs sm:text-sm font-black text-slate-300 mt-0.5">
            ₴ {balance.held.toLocaleString('uk-UA')}
          </div>
        </div>

      </div>

      {/* 5. Footer: Timestamp & Gemini Smart Ledger Protocol */}
      <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-400">Оновлено {updatedAt}</span>
        </div>
        <div className="flex items-center gap-1.5 text-purple-300/90">
          <GeminiSparkle className="w-3 h-3" />
          <span>Gemini Smart Ledger · L1/L2</span>
        </div>
      </div>

    </div>
  );
};
