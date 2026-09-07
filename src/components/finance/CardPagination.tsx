import React from 'react';
import { Wallet, TrendingUp, Coins } from 'lucide-react';
import { playWebAudioSound } from '../../utils/sirenAudio';
import { GeminiSparkle } from '../common/GeminiSparkle';

interface CardPaginationProps {
  total: number;
  activeIndex: number;
  onChange: (index: number) => void;
  balanceTotal?: number;
  monthlyEarnings?: number;
  availablePayout?: number;
}

export const CardPagination: React.FC<CardPaginationProps> = ({
  total,
  activeIndex,
  onChange,
  balanceTotal = 8460,
  monthlyEarnings = 2840,
  availablePayout = 4230,
}) => {
  const tabs = [
    {
      label: 'БАЛАНС',
      value: `₴ ${balanceTotal.toLocaleString('uk-UA')}`,
      icon: Wallet,
      color: 'blue',
      activeClass: 'bg-gradient-to-r from-blue-600/40 via-indigo-600/30 to-purple-600/40 border-indigo-400/60 text-white shadow-[0_0_20px_rgba(99,102,241,0.35)]',
      dotColor: 'bg-gradient-to-r from-blue-400 to-indigo-400',
    },
    {
      label: 'ДОХІД',
      value: `₴ ${monthlyEarnings.toLocaleString('uk-UA')}`,
      icon: TrendingUp,
      color: 'purple',
      activeClass: 'bg-gradient-to-r from-purple-600/40 via-pink-600/30 to-rose-600/40 border-pink-400/60 text-white shadow-[0_0_20px_rgba(236,72,153,0.35)]',
      dotColor: 'bg-gradient-to-r from-purple-400 to-pink-400',
    },
    {
      label: 'ВИПЛАТА',
      value: `₴ ${availablePayout.toLocaleString('uk-UA')}`,
      icon: Coins,
      color: 'teal',
      activeClass: 'bg-gradient-to-r from-teal-600/40 via-emerald-600/30 to-cyan-600/40 border-teal-400/60 text-white shadow-[0_0_20px_rgba(20,184,166,0.35)]',
      dotColor: 'bg-gradient-to-r from-teal-400 to-emerald-400',
    },
  ];

  return (
    <div className="flex flex-col items-center gap-3 pt-3 select-none">
      
      {/* Google Gemini Luminous Quick-Selector Pill Dock */}
      <div 
        className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-full bg-slate-950/80 border border-white/15 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_24px_rgba(99,102,241,0.15)] max-w-full overflow-x-auto"
        role="tablist"
      >
        {tabs.map((tab, idx) => {
          const isActive = activeIndex === idx;
          const Icon = tab.icon;

          return (
            <button
              key={`tab-${idx}`}
              onClick={() => {
                onChange(idx);
                playWebAudioSound('click');
              }}
              role="tab"
              aria-selected={isActive}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all duration-300 border flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                isActive
                  ? tab.activeClass
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {isActive ? (
                <GeminiSparkle className="w-3.5 h-3.5" />
              ) : (
                <Icon className="w-3.5 h-3.5 opacity-70" />
              )}
              <span className="text-[10px] sm:text-xs tracking-wider">{tab.label}</span>
              <span className={`text-[10px] sm:text-xs font-black ${isActive ? 'text-white' : 'text-slate-400'}`}>
                {tab.value}
              </span>
            </button>
          );
        })}
      </div>

      {/* Micro Navigation Dots with Gemini Glow */}
      <div className="flex items-center justify-center gap-2">
        {tabs.map((tab, idx) => {
          const isActive = activeIndex === idx;
          return (
            <button
              key={`dot-${idx}`}
              onClick={() => {
                onChange(idx);
                playWebAudioSound('click');
              }}
              aria-label={`Картка ${idx + 1}`}
              className={`transition-all duration-300 rounded-full ${
                isActive
                  ? `w-7 h-1.5 ${tab.dotColor} shadow-[0_0_8px_rgba(168,85,247,0.5)]`
                  : 'w-1.5 h-1.5 bg-slate-700 hover:bg-slate-500'
              }`}
            />
          );
        })}
      </div>

    </div>
  );
};
