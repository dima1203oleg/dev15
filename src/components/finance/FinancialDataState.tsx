import React from 'react';
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react';
import { FinancialDataStatus } from '../../types/finance';

interface FinancialDataStateProps {
  status: FinancialDataStatus;
  onRetry?: () => void;
}

export const FinancialDataSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-xl mx-auto h-[260px] rounded-3xl bg-slate-900/80 border-2 border-slate-800 p-6 flex flex-col justify-between animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 bg-slate-800 rounded-xl" />
        <div className="h-6 w-24 bg-slate-800 rounded-full" />
      </div>
      <div className="my-3">
        <div className="h-10 w-48 bg-slate-800 rounded-xl mb-2" />
        <div className="h-4 w-28 bg-slate-800/60 rounded" />
      </div>
      <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
        <div className="h-8 bg-slate-800/80 rounded-lg" />
        <div className="h-8 bg-slate-800/80 rounded-lg" />
        <div className="h-8 bg-slate-800/80 rounded-lg" />
      </div>
      <div className="h-3 w-36 bg-slate-800/40 rounded" />
    </div>
  );
};

export const FinancialDataBanner: React.FC<FinancialDataStateProps> = ({
  status,
  onRetry,
}) => {
  if (status === 'SUCCESS') return null;

  if (status === 'STALE') {
    return (
      <div className="mb-3 px-3 py-1.5 rounded-xl bg-amber-950/70 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center justify-between gap-2 max-w-xl mx-auto">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Дані можуть бути неактуальними. Оновлення з сервером затримується.</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="p-1 hover:text-white rounded transition-colors"
            title="Оновити зараз"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  if (status === 'ERROR') {
    return (
      <div className="w-full max-w-xl mx-auto h-[260px] rounded-3xl bg-slate-950 border-2 border-rose-900/60 p-6 flex flex-col items-center justify-center text-center font-mono">
        <WifiOff className="w-10 h-10 text-rose-500 mb-3" />
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
          Фінансовий сервіс недоступний
        </h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Не вдалося завантажити актуальний стан рахунку з захищеного шлюзу. Перевірте з'єднання з мережею.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Спробувати знову</span>
          </button>
        )}
      </div>
    );
  }

  return null;
};
