import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Filter, 
  Clock, 
  ExternalLink, 
  Radio, 
  Zap, 
  Flame, 
  ShieldCheck, 
  Share2, 
  Check, 
  Plane,
  AlertTriangle
} from 'lucide-react';
import { AlertEvent, ThreatType } from '../types';
import { GeminiSparkle } from './common/GeminiSparkle';

interface AlertsFeedProps {
  alerts: AlertEvent[];
  onSelectRegionById: (regionId: string) => void;
}

export const AlertsFeed: React.FC<AlertsFeedProps> = ({ alerts, onSelectRegionById }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formatTimeAgo = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Щойно';
    if (diffMins < 60) return `${diffMins} хв тому`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} год тому`;
  };

  const getThreatIcon = (threat: ThreatType) => {
    switch (threat) {
      case 'ballistic':
        return <Zap className="w-3.5 h-3.5 text-purple-400" />;
      case 'drone':
        return <Radio className="w-3.5 h-3.5 text-orange-400" />;
      case 'aviation':
        return <Plane className="w-3.5 h-3.5 text-blue-400" />;
      case 'artillery':
        return <Flame className="w-3.5 h-3.5 text-rose-400" />;
      case 'air':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />;
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const handleCopyAlert = (alert: AlertEvent) => {
    navigator.clipboard?.writeText?.(
      `🚨 [SirenUA] ${alert.regionName}\n${alert.description}\nДжерело: ${alert.source}`
    );
    setCopiedId(alert.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch = 
      alert.regionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.source.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'active') return alert.type === 'start';
    if (filterType === 'end') return alert.type === 'end';
    if (filterType === 'drone') return alert.threatType === 'drone';
    if (filterType === 'ballistic') return alert.threatType === 'ballistic';

    return true;
  });

  return (
    <div className="bg-slate-950/60 border border-white/10 rounded-3xl p-4 sm:p-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex flex-col h-[580px]">
      
      {/* Header with Search & Filter */}
      <div className="border-b border-white/10 pb-3 mb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GeminiSparkle className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-white text-base tracking-tight">
              Стрічка сповіщень
            </h3>
          </div>
          <span className="text-[10px] text-purple-300 font-mono bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
            {filteredAlerts.length} подій
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative mb-2.5">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Пошук за областю чи загрозою..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/[0.04] border border-white/10 rounded-full text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: 'all', label: 'Всі' },
            { id: 'active', label: '🔴 Тривоги' },
            { id: 'end', label: '🟢 Відбої' },
            { id: 'drone', label: '🛸 БпЛА' },
            { id: 'ballistic', label: '⚡ Балістика' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer border ${
                filterType === tab.id
                  ? 'bg-blue-600/25 text-blue-300 border-blue-400/40 shadow-[0_0_10px_rgba(59,130,246,0.25)] font-bold'
                  : 'bg-white/5 text-slate-400 hover:text-white border-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Scrollable List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 text-xs">
            <ShieldCheck className="w-8 h-8 text-slate-600 mb-2" />
            <p>За цим запитом подій не знайдено</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                alert.type === 'start'
                  ? 'bg-rose-950/20 hover:bg-rose-950/30 border-rose-500/30'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <button
                  onClick={() => onSelectRegionById(alert.regionId)}
                  className="font-bold text-xs text-white hover:text-cyan-300 flex items-center gap-1.5 text-left transition-colors cursor-pointer"
                >
                  {getThreatIcon(alert.threatType)}
                  <span>{alert.regionName}</span>
                </button>

                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{formatTimeAgo(alert.timestamp)}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-2">
                {alert.description}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] font-mono">
                <span className="text-slate-400 truncate max-w-[200px]">
                  📡 {alert.source}
                </span>

                <button
                  onClick={() => handleCopyAlert(alert)}
                  title="Скопіювати текст сповіщення"
                  className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {copiedId === alert.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
