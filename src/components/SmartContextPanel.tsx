import React from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Radio, 
  TrendingUp, 
  Award, 
  Zap, 
  CheckCircle2, 
  Clock, 
  ExternalLink 
} from 'lucide-react';
import { ThreatSceneModel } from '../types';
import { GeminiSparkle } from './common/GeminiSparkle';

interface SmartContextPanelProps {
  threatModel: ThreatSceneModel;
  onNavigateToShelters?: () => void;
  onNavigateToFinance?: () => void;
  onNavigateToNetwork?: () => void;
}

export const SmartContextPanel: React.FC<SmartContextPanelProps> = ({
  threatModel,
  onNavigateToShelters,
  onNavigateToFinance,
  onNavigateToNetwork,
}) => {
  const isAlarm = threatModel.myRegionStatus.isAlarm;
  const isDemo = threatModel.dataMode === 'DEMO_DATA';
  const isUnavailable = threatModel.dataMode !== 'LIVE' && !isDemo;
  const hasShelterData = Boolean(threatModel.nearestShelter);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        
        {/* Card 1: Оперативний статус */}
        <div className="p-4 rounded-3xl bg-slate-950/60 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex items-center gap-3.5">
          <div className={`p-2.5 rounded-full border ${
            isAlarm ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
          }`}>
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center gap-1.5">
              <GeminiSparkle className="w-2 h-2 text-blue-400" />
              ОПЕРАТИВНИЙ СТАН КАНАЛІВ
            </div>
            <div className="text-xs font-mono font-bold text-white truncate mt-0.5">
              {isUnavailable
                ? '🟡 Дані каналів недоступні'
                : isAlarm
                  ? '🔴 Активна тривога в секторі'
                  : '🟢 Усі сенсори в нормі'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Синхронізація: ДСНС + ПС ЗСУ + РЛС
            </div>
          </div>
        </div>

        {/* Card 2: Найближче укриття */}
        <div 
          onClick={onNavigateToShelters}
          className="p-4 rounded-3xl bg-slate-950/60 hover:bg-slate-900/80 border border-white/10 hover:border-cyan-500/40 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex items-center gap-3.5 cursor-pointer transition-all group"
        >
          <div className="p-2.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 group-hover:scale-105 transition-transform">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold">
              <span className="text-slate-400 uppercase">НАЙБЛИЖЧЕ УКРИТТЯ</span>
              <span className="text-cyan-300 font-bold">Маршрут →</span>
            </div>
            <div className="text-xs font-mono font-bold text-white truncate mt-0.5">
              {threatModel.nearestShelter?.name || 'Дані укриття недоступні'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {hasShelterData ? `${threatModel.nearestShelter?.distanceMeters} м · ~${threatModel.nearestShelter?.walkTimeMins} хв пішки` : isDemo ? 'Демонстраційний запис' : 'Потрібне підключення реєстру укриттів'}
            </div>
          </div>
        </div>

        {/* Card 3: Партнерський баланс & статус */}
        <div 
          onClick={onNavigateToFinance}
          className="p-4 rounded-3xl bg-slate-950/60 hover:bg-slate-900/80 border border-white/10 hover:border-purple-500/40 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex items-center gap-3.5 cursor-pointer transition-all group"
        >
          <div className="p-2.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 group-hover:scale-105 transition-transform">
            <Award className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold">
              <span className="text-slate-400 uppercase">ПАРТНЕРСЬКИЙ БАЛАНС</span>
              <span className="text-purple-300 font-bold">Вивід →</span>
            </div>
            <div className="text-xs font-mono font-bold text-white truncate mt-0.5">
              {isUnavailable ? 'Фінансові дані недоступні' : isDemo ? 'Демонстраційний партнерський стан' : 'Баланс доступний у фінансовому кабінеті'}
            </div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
              {threatModel.dataMode === 'LIVE' ? 'Відкрити фінансовий кабінет для деталей' : 'Дані не підтверджені live API'}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
