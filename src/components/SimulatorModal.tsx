import React from 'react';
import { 
  X, 
  Sliders, 
  Play, 
  RotateCcw, 
  Radio, 
  Zap, 
  Flame, 
  ShieldCheck, 
  AlertTriangle,
  FlameKindling,
  Plane
} from 'lucide-react';
import { RegionData, ThreatType } from '../types';

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  regions: RegionData[];
  onApplyScenario: (scenarioType: 'massive_drone' | 'ballistic_all' | 'eastern_front' | 'all_clear' | 'central_ukraine') => void;
  onToggleRegionAlarm: (regionId: string, threatType?: ThreatType) => void;
  onExitDemo?: () => void;
}

export const SimulatorModal: React.FC<SimulatorModalProps> = ({
  isOpen,
  onClose,
  regions,
  onApplyScenario,
  onToggleRegionAlarm,
  onExitDemo,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                Симулятор тривог та загроз SIREN UA
              </h2>
              <p className="text-xs text-slate-400">
                Тестуйте роботу звукової сирени, карти та сповіщень у різних оперативних сценаріях
              </p>
              <div className="mt-2 inline-flex rounded-full border border-amber-400/40 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black tracking-wide text-amber-200">
                ДЕМО-РЕЖИМ · НЕ РЕАЛЬНІ ДАНІ
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Закрити симулятор"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Scenario Presets */}
        <div className="mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
            Готові сценарії:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                onApplyScenario('massive_drone');
                onClose();
              }}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/80 hover:bg-orange-950/40 border border-slate-800 hover:border-orange-600/50 text-left transition-all group"
            >
              <div className="p-2 rounded-lg bg-orange-950/60 text-orange-400 group-hover:scale-110 transition-transform">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 group-hover:text-orange-300">
                  Масований наліт БпЛА (Shahed)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Північ, центр та південь під загрозою дронів
                </p>
              </div>
            </button>

            <button
              onClick={() => {
                onApplyScenario('ballistic_all');
                onClose();
              }}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/80 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-600/50 text-left transition-all group"
            >
              <div className="p-2 rounded-lg bg-purple-950/60 text-purple-400 group-hover:scale-110 transition-transform">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 group-hover:text-purple-300">
                  Масована ракетна / балістична загроза
                </h4>
                <p className="text-[11px] text-slate-400">
                  Повітряна тривога по всій території України
                </p>
              </div>
            </button>

            <button
              onClick={() => {
                onApplyScenario('eastern_front');
                onClose();
              }}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/80 hover:bg-red-950/40 border border-slate-800 hover:border-red-600/50 text-left transition-all group"
            >
              <div className="p-2 rounded-lg bg-red-950/60 text-red-400 group-hover:scale-110 transition-transform">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 group-hover:text-red-300">
                  Східний та Південний напрямок
                </h4>
                <p className="text-[11px] text-slate-400">
                  Харків, Суми, Запоріжжя, Дніпро, Донбас
                </p>
              </div>
            </button>

            <button
              onClick={() => {
                onApplyScenario('all_clear');
                onClose();
              }}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/80 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-600/50 text-left transition-all group"
            >
              <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">
                  Повний відбій по всій Україні
                </h4>
                <p className="text-[11px] text-slate-400">
                  Всі області перемикаються у спокійний статус
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Individual Region Toggles */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
            Ручне перемикання областей (клікніть для зміни):
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-56 overflow-y-auto pr-1">
            {regions.map((region) => (
              <button
                key={region.id}
                onClick={() => onToggleRegionAlarm(region.id)}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium text-left flex items-center justify-between transition-all ${
                  region.isAlarm
                    ? 'bg-red-950/50 border-red-700/80 text-red-200'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="truncate">{region.shortName}</span>
                <span className={`w-2 h-2 rounded-full ml-1 ${region.isAlarm ? 'bg-red-500 animate-pulse' : 'bg-slate-700'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-5">
          {onExitDemo && (
            <button
              type="button"
              onClick={() => {
                onExitDemo();
                onClose();
              }}
              className="mr-auto rounded-xl border border-cyan-700/60 px-4 py-2 text-xs font-semibold text-cyan-300 transition-colors hover:bg-cyan-950/50"
            >
              Повернутися до джерела даних
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Закрити
          </button>
        </div>

      </div>
    </div>
  );
};
