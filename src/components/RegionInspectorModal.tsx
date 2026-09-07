import React from 'react';
import { 
  X, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Users, 
  Maximize2, 
  Flame, 
  Radio, 
  Zap, 
  Volume2, 
  ShieldAlert, 
  Plane,
  HeartHandshake
} from 'lucide-react';
import { RegionData, ThreatSceneModel, ThreatType } from '../types';

interface RegionInspectorModalProps {
  region: RegionData | null;
  onClose: () => void;
  onSetMyRegion: (regionId: string) => void;
  isMyRegion: boolean;
  onTestSiren: () => void;
  isSirenPlaying: boolean;
  dataMode?: ThreatSceneModel['dataMode'];
}

export const RegionInspectorModal: React.FC<RegionInspectorModalProps> = ({
  region,
  onClose,
  onSetMyRegion,
  isMyRegion,
  onTestSiren,
  isSirenPlaying,
  dataMode = 'NOT_CONNECTED',
}) => {
  if (!region) return null;

  const isUnavailable = dataMode !== 'LIVE' && dataMode !== 'DEMO_DATA';
  const effectiveIsAlarm = !isUnavailable && region.isAlarm;

  const getThreatBadge = (threat: ThreatType) => {
    switch (threat) {
      case 'ballistic':
        return { label: 'Балістична загроза', bg: 'bg-purple-950/80', text: 'text-purple-300', border: 'border-purple-600', icon: Zap };
      case 'drone':
        return { label: 'Загроза ударних БпЛА', bg: 'bg-orange-950/80', text: 'text-orange-300', border: 'border-orange-600', icon: Radio };
      case 'aviation':
        return { label: 'Загроза КАБ / Авіація', bg: 'bg-amber-950/80', text: 'text-amber-300', border: 'border-amber-600', icon: Plane };
      case 'artillery':
        return { label: 'Загроза артобстрілу', bg: 'bg-rose-950/80', text: 'text-rose-300', border: 'border-rose-600', icon: Flame };
      case 'air':
        return { label: 'Повітряна тривога', bg: 'bg-red-950/80', text: 'text-red-300', border: 'border-red-600', icon: AlertTriangle };
      default:
        return { label: 'Спокійно (Безпечно)', bg: 'bg-emerald-950/80', text: 'text-emerald-300', border: 'border-emerald-600', icon: ShieldCheck };
    }
  };

  const badge = isUnavailable
    ? { label: 'Актуальні дані недоступні', bg: 'bg-amber-950/80', text: 'text-amber-300', border: 'border-amber-600', icon: ShieldAlert }
    : getThreatBadge(region.threatType);
  const Icon = badge.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-labelledby="region-inspector-title">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 id="region-inspector-title" className="text-xl sm:text-2xl font-black text-slate-100">
                {region.name}
              </h2>
              {isMyRegion && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/50">
                  Мій регіон
                </span>
              )}
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${dataMode === 'LIVE' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40' : dataMode === 'DEMO_DATA' ? 'bg-purple-500/10 text-purple-300 border-purple-500/40' : 'bg-amber-500/10 text-amber-300 border-amber-500/40'}`}>
                {dataMode === 'LIVE' ? 'LIVE' : dataMode === 'DEMO_DATA' ? 'DEMO' : dataMode === 'CACHED' ? 'CACHED' : dataMode === 'STALE' ? 'STALE' : 'OFFLINE'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {region.englishName} • {region.rayonsCount} районів
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Закрити інформацію про область"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Alarm Status Hero Card */}
        <div className={`p-4 rounded-xl border mb-5 transition-all ${
          effectiveIsAlarm
            ? 'bg-red-950/40 border-red-800/80 text-red-200 shadow-lg shadow-red-950/40'
            : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${badge.bg} ${badge.text} border ${badge.border}`}>
              <Icon className="w-4 h-4" />
              {badge.label}
            </span>

            {effectiveIsAlarm && (
              <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-red-400">
                <Clock className="w-3.5 h-3.5" />
                Триває: {region.durationMinutes} хв
              </span>
            )}
          </div>

          {isUnavailable ? (
            <p className="text-xs sm:text-sm text-amber-200 leading-relaxed bg-amber-950/30 p-2.5 rounded-lg border border-amber-700/40 mt-2">
              Актуальні дані стану області тимчасово недоступні. Локальна географія не є підтвердженням загрози.
            </p>
          ) : region.threatDetails ? (
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-black/30 p-2.5 rounded-lg border border-white/5 mt-2">
              🚨 <strong>Оперативне повідомлення:</strong> {region.threatDetails}
            </p>
          ) : (
            <p className="text-xs text-slate-300 mt-1">
              {effectiveIsAlarm
                ? 'Пройдіть в укриття до сигналу відбою!' 
                : 'Повітряна тривога в області відсутня. Ситуація під контролем.'}
            </p>
          )}

          {/* Active Rayons if partial */}
          {!isUnavailable && region.activeRayons && region.activeRayons.length > 0 && (
            <div className="mt-3 pt-2 border-t border-red-800/40">
              <span className="text-[11px] font-semibold text-red-300 block mb-1">
                Райони підвищеної небезпеки:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {region.activeRayons.map((rayon) => (
                  <span key={rayon} className="px-2 py-0.5 rounded bg-red-900/60 text-red-200 text-[11px] border border-red-700/60">
                    {rayon} район
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Region Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
            <span className="text-[11px] text-slate-400 block mb-0.5">Населення</span>
            <span className="text-sm font-bold text-slate-200 font-mono">
              {region.population.toLocaleString('uk-UA')} осіб
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl">
            <span className="text-[11px] text-slate-400 block mb-0.5">Площа</span>
            <span className="text-sm font-bold text-slate-200 font-mono">
              {region.areaKm2.toLocaleString('uk-UA')} км²
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl col-span-2 sm:col-span-1">
            <span className="text-[11px] text-slate-400 block mb-0.5">Екстрена допомога</span>
            <span className="text-sm font-bold text-amber-400 font-mono">
              112 / 101 / 102
            </span>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={() => onSetMyRegion(region.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              isMyRegion
                ? 'bg-slate-800 text-slate-400 cursor-default'
                : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-950/50'
            }`}
          >
            <MapPin className="w-4 h-4" />
            {isMyRegion ? 'Це ваша обрана область' : 'Встановити як мою область'}
          </button>

          <button
            onClick={onTestSiren}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              isSirenPlaying
                ? 'bg-red-600 text-white animate-bounce'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            {isSirenPlaying ? 'Зупинити сирену' : 'Тест сигналу'}
          </button>
        </div>

      </div>
    </div>
  );
};
