import React from 'react';
import { 
  AlertOctagon, 
  MapPin, 
  ShieldCheck, 
  Flame, 
  Radio, 
  Zap, 
  Clock, 
  Volume2, 
  VolumeX, 
  ArrowUpRight,
  Plane
} from 'lucide-react';
import { RegionData } from '../types';
import { GeminiSparkle } from './common/GeminiSparkle';

interface SirenaDashboardStatsProps {
  regions: RegionData[];
  myRegionId: string;
  onSelectRegion: (region: RegionData) => void;
  isSirenPlaying: boolean;
  onToggleSiren: () => void;
  onOpenSimulator: () => void;
}

export const SirenaDashboardStats: React.FC<SirenaDashboardStatsProps> = ({
  regions,
  myRegionId,
  onSelectRegion,
  isSirenPlaying,
  onToggleSiren,
  onOpenSimulator,
}) => {
  const activeRegions = regions.filter((r) => r.isAlarm);
  const activeCount = activeRegions.length;
  const totalCount = regions.length;
  const percentAlarm = Math.round((activeCount / totalCount) * 100);

  const myRegion = regions.find((r) => r.id === myRegionId);
  const myRegionAlarm = myRegion?.isAlarm || false;

  // Calculate threats count
  const droneCount = regions.filter((r) => r.isAlarm && r.threatType === 'drone').length;
  const ballisticCount = regions.filter((r) => r.isAlarm && r.threatType === 'ballistic').length;
  const aviationCount = regions.filter((r) => r.isAlarm && r.threatType === 'aviation').length;
  const artilleryCount = regions.filter((r) => r.isAlarm && r.threatType === 'artillery').length;

  // Find longest alarm
  const longestAlarmRegion = [...activeRegions].sort((a, b) => b.durationMinutes - a.durationMinutes)[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      
      {/* Card 1: Overall Ukraine Alarm State */}
      <div className="bg-slate-950/60 border border-white/10 rounded-3xl p-4 sm:p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl relative overflow-hidden group hover:border-white/20 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
            <GeminiSparkle className="w-2.5 h-2.5 text-blue-400" />
            Загальна ситуація
          </span>
          <div className={`p-1.5 rounded-full border ${activeCount > 0 ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'}`}>
            <AlertOctagon className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
            {activeCount}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            / {totalCount} областей ({percentAlarm}%)
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              activeCount > 10 ? 'bg-rose-500' : activeCount > 0 ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
            style={{ width: `${percentAlarm}%` }}
          />
        </div>

        <div className="text-[11px] text-slate-400 mt-3 flex items-center justify-between font-mono">
          <span>{activeCount > 0 ? 'Тривають тривоги' : 'Небезпеки немає'}</span>
          <button 
            onClick={onOpenSimulator} 
            className="text-cyan-300 hover:text-white font-medium inline-flex items-center gap-0.5 cursor-pointer"
          >
            Змінити <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Card 2: My Region Status & Instant Safety Alert */}
      <div className={`border rounded-3xl p-4 sm:p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl relative overflow-hidden transition-all ${
        myRegionAlarm
          ? 'bg-rose-950/40 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
          : 'bg-slate-950/60 border-white/10'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
            <MapPin className="w-3 h-3 text-blue-400" />
            Моя область
          </span>
          {myRegionAlarm ? (
            <span className="px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse font-mono">
              Укриття!
            </span>
          ) : (
            <span className="px-2.5 py-0.5 text-[9px] font-semibold rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
              Спокійно
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-white truncate max-w-[150px]">
              {myRegion?.shortName || 'Не обрано'}
            </h4>
            <p className="text-xs text-slate-400 font-mono">
              {myRegionAlarm 
                ? `Триває ${myRegion?.durationMinutes} хв` 
                : 'Тривога відсутня'}
            </p>
          </div>

          <button
            onClick={onToggleSiren}
            title={isSirenPlaying ? 'Зупинити звук' : 'Тест сирени'}
            className={`p-2.5 rounded-full border transition-all cursor-pointer ${
              isSirenPlaying
                ? 'bg-rose-500 text-white border-rose-400 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
            }`}
          >
            {isSirenPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
        </div>

        {myRegionAlarm && myRegion?.threatDetails && (
          <p className="text-[11px] text-rose-200 mt-2 bg-rose-500/15 p-1.5 rounded-xl border border-rose-500/30 line-clamp-1 font-mono">
            {myRegion.threatDetails}
          </p>
        )}
      </div>

      {/* Card 3: Active Threats Composition */}
      <div className="bg-slate-950/60 border border-white/10 rounded-3xl p-4 sm:p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Типи загроз
          </span>
          <span className="text-xs font-mono text-purple-300 font-bold px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30">
            {activeCount} активних
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-full bg-white/[0.04] border border-white/10">
            <Radio className="w-3 h-3 text-orange-400" />
            <span className="text-[11px] text-slate-300 font-mono">БпЛА:</span>
            <span className="text-xs font-bold text-white font-mono ml-auto">{droneCount}</span>
          </div>

          <div className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-full bg-white/[0.04] border border-white/10">
            <Zap className="w-3 h-3 text-purple-400" />
            <span className="text-[11px] text-slate-300 font-mono">Балістика:</span>
            <span className="text-xs font-bold text-white font-mono ml-auto">{ballisticCount}</span>
          </div>

          <div className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-full bg-white/[0.04] border border-white/10">
            <Plane className="w-3 h-3 text-blue-400" />
            <span className="text-[11px] text-slate-300 font-mono">Авіація:</span>
            <span className="text-xs font-bold text-white font-mono ml-auto">{aviationCount}</span>
          </div>

          <div className="flex items-center gap-1.5 p-1.5 px-2.5 rounded-full bg-white/[0.04] border border-white/10">
            <Flame className="w-3 h-3 text-rose-400" />
            <span className="text-[11px] text-slate-300 font-mono">Арт:</span>
            <span className="text-xs font-bold text-white font-mono ml-auto">{artilleryCount}</span>
          </div>
        </div>
      </div>

      {/* Card 4: Longest Active Alarm */}
      <div className="bg-slate-950/60 border border-white/10 rounded-3xl p-4 sm:p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Найдовша тривога
          </span>
          <Clock className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {longestAlarmRegion ? (
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold text-white truncate">
                {longestAlarmRegion.name}
              </span>
            </div>
            <p className="text-xs font-mono font-semibold text-rose-400 mt-0.5">
              {longestAlarmRegion.durationMinutes > 1000
                ? `${Math.floor(longestAlarmRegion.durationMinutes / 1440)} дн+`
                : `${Math.floor(longestAlarmRegion.durationMinutes / 60)} год ${longestAlarmRegion.durationMinutes % 60} хв`}
            </p>
          </div>
        ) : (
          <div className="text-xs text-slate-400 font-mono">Активних тривог немає</div>
        )}

        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Сили Оборони</span>
          <span className="text-emerald-400 font-medium">ППО напоготові</span>
        </div>
      </div>

    </div>
  );
};
