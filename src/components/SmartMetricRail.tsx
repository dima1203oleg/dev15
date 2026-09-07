import React from 'react';
import { 
  MapPin, 
  ShieldCheck, 
  ChevronRight,
  AlertTriangle,
  Clock,
  ArrowRight,
  Radio
} from 'lucide-react';
import { ThreatSceneModel } from '../types';

interface SmartMetricRailProps {
  threatModel?: ThreatSceneModel;
  myRegionName?: string;
  isAlarm?: boolean;
  activeEventsCount?: number;
  lastUpdatedTime?: string;
  onSelectRegion?: () => void;
  onOpenStatus?: () => void;
  onOpenEvents?: () => void;
  theme?: 'light' | 'dark';
}

export const SmartMetricRail: React.FC<SmartMetricRailProps> = ({
  myRegionName = 'Одеська область',
  isAlarm = false,
  activeEventsCount = 3,
  lastUpdatedTime = 'Сьогодні, 22:14',
  onSelectRegion,
  onOpenStatus,
  onOpenEvents,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-2">
      
      {/* Card 1: Мій регіон */}
      <div 
        onClick={onSelectRegion}
        className={`rounded-[20px] p-4 sm:p-5 flex items-center justify-between cursor-pointer group transition-all duration-200 border ${
          isDark 
            ? 'bg-[#111827] hover:bg-slate-800/80 border-slate-800 text-white shadow-google-card' 
            : 'bg-[#FFFFFF] hover:bg-[#F7F9FC] border-slate-200/70 text-[#111827] shadow-google-card hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-[20px] flex items-center justify-center flex-shrink-0 transition-transform ${
            isDark ? 'bg-blue-950/80 text-blue-400' : 'bg-blue-50 text-[#2563EB]'
          }`}>
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <div className={`text-[13px] font-medium ${isDark ? 'text-slate-400' : 'text-[#8B95A7]'}`}>
              Мій регіон
            </div>
            <div className={`text-base font-bold leading-tight mt-0.5 ${isDark ? 'text-white' : 'text-[#111827]'}`}>
              {myRegionName}
            </div>
            <div className="flex items-center gap-1 text-[13px] font-semibold text-[#2563EB] group-hover:translate-x-0.5 transition-transform mt-1">
              <span>Змінити регіон</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
        {/* Mock mini silhouette map */}
        <div className="hidden sm:block opacity-40 group-hover:opacity-60 transition-opacity">
          <svg width="40" height="40" viewBox="0 0 100 100" className="fill-[#2563EB]">
             <path d="M50 0 L100 50 L50 100 L0 50 Z" />
          </svg>
        </div>
      </div>

      {/* Card 2: Стан (Спокійно / Тривога) */}
      <div 
        onClick={onOpenStatus}
        className={`rounded-[20px] p-4 sm:p-5 flex flex-col justify-center cursor-pointer group transition-all duration-200 border ${
          isDark 
            ? 'bg-[#111827] hover:bg-slate-800/80 border-slate-800 text-white shadow-google-card' 
            : 'bg-[#FFFFFF] hover:bg-[#F7F9FC] border-slate-200/70 text-[#111827] shadow-google-card hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-[20px] flex items-center justify-center flex-shrink-0 transition-transform ${
            isAlarm 
              ? (isDark ? 'bg-rose-950/80 text-rose-400' : 'bg-[#FFF1F2] text-[#E11D48]') 
              : (isDark ? 'bg-emerald-950/80 text-emerald-400' : 'bg-[#ECFDF5] text-[#10B981]')
          }`}>
            {isAlarm ? <AlertTriangle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <div>
            <div className={`text-[13px] font-medium ${isDark ? 'text-slate-400' : 'text-[#8B95A7]'}`}>
              Стан
            </div>
            <div className={`text-base font-bold leading-tight mt-0.5 flex items-center gap-2 ${
              isAlarm 
                ? (isDark ? 'text-rose-400' : 'text-[#E11D48]') 
                : (isDark ? 'text-emerald-400' : 'text-[#10B981]')
            }`}>
              <span className={`w-2 h-2 rounded-full ${isAlarm ? 'bg-[#E11D48]' : 'bg-[#10B981]'}`}></span>
              {isAlarm ? 'Тривога' : 'Спокійно'}
            </div>
            <div className={`text-[13px] mt-1 ${isDark ? 'text-slate-500' : 'text-[#8B95A7]'}`}>
              {isAlarm ? 'Небезпека у районі' : 'Наразі загроз не виявлено'}
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Активні події */}
      <div 
        onClick={onOpenEvents}
        className={`rounded-[20px] p-4 sm:p-5 flex items-center justify-between cursor-pointer group transition-all duration-200 border ${
          isDark 
            ? 'bg-[#111827] hover:bg-slate-800/80 border-slate-800 text-white shadow-google-card' 
            : 'bg-[#FFFFFF] hover:bg-[#F7F9FC] border-slate-200/70 text-[#111827] shadow-google-card hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-[20px] flex items-center justify-center flex-shrink-0 transition-transform ${
            isDark ? 'bg-blue-950/80 text-blue-400' : 'bg-[#EFF6FF] text-[#2563EB]'
          }`}>
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className={`text-[13px] font-medium ${isDark ? 'text-slate-400' : 'text-[#8B95A7]'}`}>
              Активні події
            </div>
            <div className={`text-xl font-extrabold leading-tight mt-0.5 ${isDark ? 'text-white' : 'text-[#0A1629]'}`}>
              {activeEventsCount}
            </div>
            <div className={`text-[13px] mt-1 flex items-center gap-1.5 ${isDark ? 'text-slate-500' : 'text-[#8B95A7]'}`}>
              По всій Україні
            </div>
          </div>
        </div>
        <div className="flex items-center">
            <span className="px-2 py-1 rounded-lg bg-[#FFF1F2] text-[#E11D48] text-xs font-bold flex items-center gap-1">
                <ArrowRight className="w-3 h-3 -rotate-45" /> +1
            </span>
        </div>
      </div>

      {/* Card 4: Оновлено (Live Indicator) */}
      <div 
        className={`rounded-[20px] p-4 sm:p-5 flex items-center justify-between transition-all border ${
          isDark 
            ? 'bg-[#111827] border-slate-800 text-white shadow-google-card' 
            : 'bg-[#FFFFFF] border-slate-200/70 text-[#111827] shadow-google-card'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-[20px] flex items-center justify-center flex-shrink-0 ${
            isDark ? 'bg-blue-950/80 text-blue-400' : 'bg-[#EFF6FF] text-[#2563EB]'
          }`}>
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className={`text-[13px] font-medium ${isDark ? 'text-slate-400' : 'text-[#8B95A7]'}`}>
              Оновлено
            </div>
            <div className={`text-base font-bold leading-tight mt-0.5 ${isDark ? 'text-white' : 'text-[#111827]'}`}>
              {lastUpdatedTime}
            </div>
            <div className={`text-[13px] mt-1 ${isDark ? 'text-slate-500' : 'text-[#8B95A7]'}`}>
              Дані в реальному часі
            </div>
          </div>
        </div>
        
        {/* LIVE pill badge */}
        <div className="flex flex-col items-end">
          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#ECFDF5] border border-[#A7F3D0] rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            <span className="text-[10px] font-bold tracking-widest text-[#10B981]">LIVE</span>

          </div>
        </div>
      </div>
    </div>
  );
};
