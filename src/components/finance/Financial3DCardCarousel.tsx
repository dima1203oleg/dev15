import React, { useState } from 'react';
import { 
  ArrowRight, 
  TrendingUp, 
  Award, 
  CreditCard,
  Receipt
} from 'lucide-react';
import { playWebAudioSound } from '../../utils/sirenAudio';

interface Financial3DCardCarouselProps {
  onOpenPayout?: () => void;
  onOpenHistory?: () => void;
  theme?: 'light' | 'dark';
}

export const Financial3DCardCarousel: React.FC<Financial3DCardCarouselProps> = ({
  onOpenPayout,
  onOpenHistory,
  theme = 'light',
}) => {
  const [activeCardIndex, setActiveCardIndex] = useState(1); // 0: Left, 1: Center, 2: Right
  const isDark = theme === 'dark';

  const handleCardClick = (idx: number) => {
    setActiveCardIndex(idx);
    playWebAudioSound('click');
  };

  return (
    <div className="w-full flex flex-col justify-between h-full">
      
      {/* Header: Title & Subtitle */}
      <div className="mb-3">
        <h3 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Фінансова інформація
        </h3>
        <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
          Ваш дохід. Ваш розвиток. Більше можливостей.
        </p>
      </div>

      {/* 3D Stack / Carousel Stage */}
      <div className="relative w-full h-[330px] flex items-center justify-center perspective-1000 overflow-hidden py-2 select-none">
        
        {/* Card 0: Left Peek (Зароблено) */}
        <div 
          onClick={() => handleCardClick(0)}
          className={`absolute transition-all duration-500 ease-out cursor-pointer ${
            activeCardIndex === 0
              ? 'z-30 scale-100 translate-x-0 opacity-100 shadow-2xl'
              : 'z-10 scale-90 -translate-x-[110px] opacity-75 blur-[0.3px] hover:opacity-90'
          }`}
          style={{ width: '270px' }}
        >
          <div className={`rounded-3xl p-5 border h-[305px] flex flex-col justify-between ${
            isDark 
              ? 'bg-slate-900/95 border-slate-800 text-white shadow-black/60' 
              : 'bg-gradient-to-br from-slate-50 to-white border-slate-200 text-slate-900 shadow-md'
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                  Зароблено
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                  isDark ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                  <TrendingUp className="w-2.5 h-2.5" /> +12%
                </span>
              </div>
              <div className={`text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                ₴ 12 460
              </div>
              
              {/* Micro Bar Chart Visual */}
              <div className="mt-4 flex items-end gap-2 h-18 pt-2">
                <div className={`w-4 rounded-t-sm h-6 ${isDark ? 'bg-blue-900' : 'bg-blue-100'}`} />
                <div className={`w-4 rounded-t-sm h-9 ${isDark ? 'bg-blue-800' : 'bg-blue-200'}`} />
                <div className={`w-4 rounded-t-sm h-12 ${isDark ? 'bg-blue-700' : 'bg-blue-300'}`} />
                <div className={`w-4 rounded-t-sm h-8 ${isDark ? 'bg-blue-600' : 'bg-blue-400'}`} />
                <div className={`w-4 rounded-t-sm h-14 ${isDark ? 'bg-blue-500' : 'bg-blue-500'}`} />
                <div className={`w-4 rounded-t-sm h-16 ${isDark ? 'bg-cyan-400' : 'bg-blue-600'}`} />
                <div className={`w-4 rounded-t-sm h-18 ${isDark ? 'bg-emerald-400 shadow-xs shadow-emerald-400/50' : 'bg-emerald-500'}`} />
              </div>
            </div>

            <div className={`pt-2 border-t flex items-center justify-between text-xs ${
              isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-400'
            }`}>
              <span>Цей місяць</span>
              <span className="text-blue-500 font-bold">Деталі →</span>
            </div>
          </div>
        </div>

        {/* Card 1: Center Hero Card (Баланс ₴8 460) */}
        <div 
          onClick={() => handleCardClick(1)}
          className={`absolute transition-all duration-500 ease-out cursor-pointer ${
            activeCardIndex === 1
              ? 'z-30 scale-100 translate-x-0 opacity-100 shadow-[0_12px_32px_rgba(0,0,0,0.12)]'
              : activeCardIndex === 0
                ? 'z-10 scale-90 translate-x-[110px] opacity-75 blur-[0.3px]'
                : 'z-10 scale-90 -translate-x-[110px] opacity-75 blur-[0.3px]'
          }`}
          style={{ width: '280px' }}
        >
          <div className={`rounded-3xl p-5 border h-[310px] flex flex-col justify-between relative overflow-hidden ${
            isDark 
              ? 'bg-[#111827] border-slate-700/80 text-white shadow-2xl shadow-black/80' 
              : 'bg-white border-slate-100 text-slate-900 shadow-lg'
          }`}>
            
            {/* Top Light Accent */}
            <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full blur-xl pointer-events-none ${
              isDark ? 'bg-blue-600/20' : 'bg-blue-100/50'
            }`} />

            <div>
              {/* Header: Label + 3D Gold Coins Graphic */}
              <div className="flex items-start justify-between">
                <div>
                  <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                    Баланс
                  </span>
                  <div className={`text-3xl font-black tracking-tight mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    ₴ 8 460
                  </div>
                </div>

                {/* 3D Stack of Gold Coins SVG Graphic */}
                <div className="w-12 h-10 flex-shrink-0">
                  <svg viewBox="0 0 48 40" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="24" cy="30" rx="18" ry="6" fill="#D97706" />
                    <ellipse cx="24" cy="27" rx="18" ry="6" fill="#F59E0B" />
                    <ellipse cx="24" cy="26" rx="16" ry="5" fill="#FDE68A" />
                    
                    <ellipse cx="26" cy="20" rx="17" ry="6" fill="#D97706" />
                    <ellipse cx="26" cy="17" rx="17" ry="6" fill="#F59E0B" />
                    <ellipse cx="26" cy="16" rx="15" ry="5" fill="#FDE68A" />
                    
                    <ellipse cx="22" cy="10" rx="16" ry="5.5" fill="#D97706" />
                    <ellipse cx="22" cy="7" rx="16" ry="5.5" fill="#FBBF24" />
                    <ellipse cx="22" cy="6" rx="14" ry="4.5" fill="#FEF08A" />
                    <circle cx="22" cy="6" r="2" fill="#D97706" opacity="0.6" />
                  </svg>
                </div>
              </div>

              {/* Balance Breakdown List */}
              <div className="space-y-1.5 mt-3 text-xs">
                <div className={`flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span>Доступно</span>
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>₴ 4 230</span>
                </div>
                <div className={`flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span>Очікує</span>
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>₴ 3 650</span>
                </div>
                <div className={`flex items-center justify-between ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span>Утримано</span>
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>₴ 580</span>
                </div>
              </div>

              {/* Gold 20% Pill Badge */}
              <div className="mt-3">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 border ${
                  isDark 
                    ? 'bg-amber-950/70 border-amber-800/80 text-amber-300' 
                    : 'bg-amber-50 border-amber-200/80 text-amber-800'
                }`}>
                  <Award className="w-3 h-3 text-amber-500" />
                  <span>Gold • 20%</span>
                </span>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenPayout) onOpenPayout();
                playWebAudioSound('click');
              }}
              className="w-full py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Вивести кошти</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

          </div>
        </div>

        {/* Card 2: Right Peek (Доступно до виводу) */}
        <div 
          onClick={() => handleCardClick(2)}
          className={`absolute transition-all duration-500 ease-out cursor-pointer ${
            activeCardIndex === 2
              ? 'z-30 scale-100 translate-x-0 opacity-100 shadow-2xl'
              : 'z-10 scale-90 translate-x-[110px] opacity-75 blur-[0.3px] hover:opacity-90'
          }`}
          style={{ width: '270px' }}
        >
          <div className={`rounded-3xl p-5 border h-[305px] flex flex-col justify-between ${
            isDark 
              ? 'bg-slate-900/95 border-slate-800 text-white shadow-black/60' 
              : 'bg-gradient-to-br from-slate-50 to-white border-slate-200 text-slate-900 shadow-md'
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                  Доступно до виводу
                </span>
                <span className="text-lg">💳</span>
              </div>
              <div className={`text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                ₴ 4 230
              </div>
              <p className={`text-[11px] mt-2 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                Мінімальна сума для виплати на IBAN або картку: <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>₴ 1 000</span>
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenHistory) onOpenHistory();
                playWebAudioSound('click');
              }}
              className={`w-full py-2 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Історія виплат</span>
            </button>
          </div>
        </div>

      </div>

      {/* Pagination Dots */}
      <div className="flex items-center justify-center gap-2 mt-2">
        {[0, 1, 2].map((idx) => (
          <button
            key={idx}
            onClick={() => handleCardClick(idx)}
            className={`transition-all rounded-full cursor-pointer ${
              activeCardIndex === idx
                ? 'w-6 h-1.5 bg-blue-600'
                : (isDark ? 'w-1.5 h-1.5 bg-slate-700 hover:bg-slate-600' : 'w-1.5 h-1.5 bg-slate-200 hover:bg-slate-300')
            }`}
          />
        ))}
      </div>

    </div>
  );
};
