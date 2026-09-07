import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CardNavigationProps {
  onPrev: () => void;
  onNext: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const CardNavigation: React.FC<CardNavigationProps> = ({
  onPrev,
  onNext,
}) => {
  return (
    <>
      {/* Left Arrow Button */}
      <button
        onClick={onPrev}
        aria-label="Попередня фінансова картка"
        className="hidden md:flex absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 z-40 w-9 h-9 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 items-center justify-center shadow-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Right Arrow Button */}
      <button
        onClick={onNext}
        aria-label="Наступна фінансова картка"
        className="hidden md:flex absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 z-40 w-9 h-9 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 items-center justify-center shadow-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-500"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </>
  );
};
