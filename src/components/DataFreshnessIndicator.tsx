import React from 'react';
import { DataState } from '../types/dataEnvelope';
import { Wifi, WifiOff, Clock, Database, PlayCircle } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

interface DataFreshnessIndicatorProps {
  state: DataState;
  timestamp?: number;
  theme?: 'light' | 'dark';
  className?: string;
}

export const DataFreshnessIndicator: React.FC<DataFreshnessIndicatorProps> = ({
  state,
  timestamp,
  theme = 'light',
  className = ''
}) => {
  const isDark = theme === 'dark';
  
  const getConfig = () => {
    switch (state) {
      case 'LIVE':
        return {
          icon: <Wifi className="w-3 h-3" />,
          text: 'LIVE',
          colorClass: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-900/50',
          tooltip: 'Дані оновлюються в реальному часі. Зв\'язок з сервером стабільний.'
        };
      case 'CACHED':
        return {
          icon: <Database className="w-3 h-3" />,
          text: 'CACHED',
          colorClass: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60 border-blue-100 dark:border-blue-900/50',
          tooltip: 'Показано останні збережені дані. Очікується оновлення.'
        };
      case 'STALE':
        return {
          icon: <Clock className="w-3 h-3" />,
          text: 'STALE',
          colorClass: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60 border-amber-100 dark:border-amber-900/50',
          tooltip: 'Дані можуть бути неактуальними. Сервер тимчасово недоступний.'
        };
      case 'NOT_CONNECTED':
      case 'ERROR':
        return {
          icon: <WifiOff className="w-3 h-3" />,
          text: 'NOT CONNECTED',
          colorClass: 'text-rose-500 bg-rose-50 dark:bg-rose-950/60 border-rose-100 dark:border-rose-900/50',
          tooltip: 'Актуальні дані тимчасово недоступні. Перевірте підключення.'
        };
      case 'DEMO':
        return {
          icon: <PlayCircle className="w-3 h-3" />,
          text: 'DEMO',
          colorClass: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60 border-purple-100 dark:border-purple-900/50',
          tooltip: 'Режим симуляції. Показані дані не є справжніми.'
        };
      default:
        return {
          icon: <Clock className="w-3 h-3" />,
          text: 'LOADING',
          colorClass: 'text-slate-500 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800',
          tooltip: 'Завантаження даних...'
        };
    }
  };

  const config = getConfig();

  const timeAgo = timestamp ? Math.floor((Date.now() - timestamp) / 60000) : null;
  const timeText = timeAgo !== null 
    ? timeAgo === 0 
      ? 'Оновлено щойно' 
      : `Оновлено ${timeAgo} хв тому`
    : '';

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-black tracking-wide ${config.colorClass}`}>
        {config.icon}
        {config.text}
      </div>
      
      {timeText && (
        <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {timeText}
        </span>
      )}
      
      <InfoTooltip content={config.tooltip} theme={theme} position="bottom" />
    </div>
  );
};
