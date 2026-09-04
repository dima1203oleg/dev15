import React from 'react';
import { AlertTriangle, Clock, Info, ShieldCheck, Radio } from 'lucide-react';
import { ThreatEvent } from '../types';

interface AlertTickerProps {
  threats: ThreatEvent[];
  isThreatServerOnline: boolean;
}

export const AlertTicker: React.FC<AlertTickerProps> = ({ threats, isThreatServerOnline }) => {
  const latestThreat = threats[0];

  return (
    <div className="w-full bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800/80 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Official Safety Protocol Notice */}
        <div className="flex items-center gap-2 text-slate-300">
          <div className="flex items-center justify-center w-5 h-5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium text-slate-200">
            Офіційне сповіщення:
          </span>
          <span className="text-slate-400 hidden sm:inline">
            Під час небезпеки дотримуйтеся офіційних повідомлень та рекомендацій органів влади.
          </span>
        </div>

        {/* Right: Freshness & Telemetry Metadata */}
        <div className="flex items-center gap-3 text-slate-400 ml-auto flex-wrap">
          {latestThreat && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-950/40 text-rose-300 border border-rose-800/40 font-mono text-[11px]">
              <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
              <span>{latestThreat.categoryLabel}: {latestThreat.estimatedArrivalMin}</span>
            </div>
          )}

          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Оновлено: щойно (13:10)</span>
          </div>

          <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Radar Telemetry v2.4</span>
          </div>
        </div>

      </div>
    </div>
  );
};
