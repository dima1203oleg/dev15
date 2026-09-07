import React, { useState } from 'react';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Radio, 
  ShieldCheck, 
  Zap, 
  Compass, 
  Layers, 
  ArrowUpRight, 
  Clock, 
  MapPin, 
  Flame, 
  ExternalLink,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { RegionData, ThreatTrajectory, UserSettings } from '../types';

interface ThreeDShowcaseProps {
  regions: RegionData[];
  trajectories: ThreatTrajectory[];
  settings: UserSettings;
  onNavigateToMap: () => void;
  onNavigateToSimulator: () => void;
  onNavigateToShelters: () => void;
}

export const ThreeDShowcase: React.FC<ThreeDShowcaseProps> = ({
  regions,
  trajectories,
  settings,
  onNavigateToMap,
  onNavigateToSimulator,
  onNavigateToShelters,
}) => {
  const [activeDeviceTab, setActiveDeviceTab] = useState<'ALL' | 'DESKTOP' | 'TABLET' | 'PHONE'>('ALL');
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const activeRegionsCount = regions.filter((r) => r.isAlarm).length;
  const myRegionData = regions.find((r) => r.id === settings.myRegion) || regions[0];
  const leadTrajectory = trajectories[0];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -16;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div className="bg-slate-950/90 border border-slate-800/80 rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden mb-8">
      
      {/* Background Cyber Grid & Glow */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(56, 189, 248, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Showcase Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-3">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Просторова Екосистема SirenUA</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
            Жива просторова модель ситуації.<br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 bg-clip-text text-transparent">
              Один простір даних — оптимізований для будь-якого екрана.
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl">
            Поєднання візуалізації загроз, векторних траєкторій БпЛА, персонального захисту та швидкої навігації до укриттів з мінімальною затримкою.
          </p>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL', label: 'Всі пристрої' },
            { id: 'DESKTOP', label: '💻 Desktop Command' },
            { id: 'TABLET', label: '📱 Tablet Touch' },
            { id: 'PHONE', label: '📲 Phone Safety' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveDeviceTab(tab.id as 'ALL' | 'DESKTOP' | 'TABLET' | 'PHONE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeDeviceTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 shadow-sm shadow-cyan-950'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Constellation Device Showcase Canvas */}
      <div 
        className="relative z-10 device-showcase-container min-h-[460px] flex items-center justify-center py-6"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-center transition-transform duration-200"
          style={{
            transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
          }}
        >
          
          {/* Device 1: 3D Desktop Command Center (6 Cols on LG) */}
          {(activeDeviceTab === 'ALL' || activeDeviceTab === 'DESKTOP') && (
            <div className={`device-card-3d ${activeDeviceTab === 'DESKTOP' ? 'lg:col-span-12' : 'lg:col-span-6'} bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md relative overflow-hidden group`}>
              
              {/* Device Header Bar */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3 text-xs">
                <div className="flex items-center gap-2 text-cyan-300 font-mono font-bold">
                  <Monitor className="w-4 h-4" />
                  <span>DESKTOP · SPATIAL COMMAND</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIVE MATRIX</span>
                </div>
              </div>

              {/* Desktop Screen Mockup */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 min-h-[220px] relative flex flex-col justify-between">
                
                {/* 3D Map preview widget */}
                <div className="relative h-32 w-full bg-slate-900/60 rounded-lg border border-slate-800/80 overflow-hidden flex items-center justify-center">
                  
                  {/* Radar grid and sweep */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-44 h-44 rounded-full border border-cyan-500/20" />
                    <div className="w-28 h-28 rounded-full border border-cyan-500/30" />
                    <div className="w-12 h-12 rounded-full border border-cyan-500/40" />
                    <div className="absolute w-44 h-44 border-r border-cyan-400/40 animate-radar-sweep pointer-events-none" />
                  </div>

                  {/* Active Trajectory SVG Path */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 150">
                    <path
                      d="M 50,110 C 150,40 250,120 350,50"
                      fill="none"
                      stroke="#fb923c"
                      strokeWidth="2.5"
                      strokeDasharray="6 6"
                      className="animate-laser-dash"
                    />
                    <circle cx="350" cy="50" r="4" fill="#f87171" className="animate-ping" />
                    <circle cx="350" cy="50" r="4" fill="#ef4444" />
                  </svg>

                  {/* Overlay tactical label */}
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/70 border border-slate-800 text-[10px] font-mono text-cyan-200">
                    Азимут: {leadTrajectory?.azimuthDirection || '315° NW'} · ETA: {leadTrajectory?.etaMinutes || 18} хв
                  </div>
                </div>

                {/* Bottom status indicators */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">У тривозі:</span>
                    <span className="font-bold text-red-400 font-mono">
                      {activeRegionsCount} областей України
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Провідна загроза:</span>
                    <span className="font-bold text-amber-300 truncate block">
                      {leadTrajectory?.name || 'БпЛА Shahed-136'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Action */}
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Повний просторовий огляд</span>
                <button
                  onClick={onNavigateToMap}
                  className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                >
                  Відкрити Карту <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          )}

          {/* Device 2: 3D Tablet Touch Tactical (3 Cols on LG) */}
          {(activeDeviceTab === 'ALL' || activeDeviceTab === 'TABLET') && (
            <div className={`device-card-3d ${activeDeviceTab === 'TABLET' ? 'lg:col-span-12' : 'lg:col-span-3'} bg-slate-900/90 border border-purple-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-md relative overflow-hidden group`}>
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 text-xs">
                <div className="flex items-center gap-1.5 text-purple-300 font-mono font-bold">
                  <Tablet className="w-4 h-4" />
                  <span>TABLET · TOUCH</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                  ШАРИ
                </span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 min-h-[220px] flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    АКТИВНІ ШАРИ
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/80 text-[11px] border border-slate-800">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Layers className="w-3 h-3 text-cyan-400" /> РЛС-сітка
                      </span>
                      <span className="text-emerald-400 font-mono">АКТИВНО</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/80 text-[11px] border border-slate-800">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Zap className="w-3 h-3 text-purple-400" /> Балістика
                      </span>
                      <span className="text-purple-300 font-mono">СЕНСОРИ</span>
                    </div>
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/80 text-[11px] border border-slate-800">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Radio className="w-3 h-3 text-orange-400" /> Шахеди
                      </span>
                      <span className="text-orange-300 font-mono">ТРЕКІНГ</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onNavigateToSimulator}
                  className="w-full mt-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                >
                  Запустити симуляцію <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          )}

          {/* Device 3: 3D Phone Personal Safety (3 Cols on LG) */}
          {(activeDeviceTab === 'ALL' || activeDeviceTab === 'PHONE') && (
            <div className={`device-card-3d ${activeDeviceTab === 'PHONE' ? 'lg:col-span-12' : 'lg:col-span-3'} bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 shadow-2xl backdrop-blur-md relative overflow-hidden group`}>
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 text-xs">
                <div className="flex items-center gap-1.5 text-amber-300 font-mono font-bold">
                  <Smartphone className="w-4 h-4" />
                  <span>PHONE · SAFETY</span>
                </div>
                <span className={`w-2 h-2 rounded-full ${myRegionData.isAlarm ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 min-h-[220px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-mono">
                    <MapPin className="w-3 h-3 text-amber-400" /> МОЯ ОБЛАСТЬ
                  </div>
                  <h4 className="text-base font-black text-slate-100 truncate mt-0.5">
                    {myRegionData.name}
                  </h4>
                  
                  <div className={`mt-2 p-2 rounded-lg border text-xs ${
                    myRegionData.isAlarm
                      ? 'bg-red-950/60 border-red-700 text-red-200'
                      : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  }`}>
                    <div className="font-bold flex items-center justify-between">
                      <span>{myRegionData.isAlarm ? '🚨 ТРИВОГА!' : '🟢 СПОКІЙНО'}</span>
                      {myRegionData.isAlarm && <span>{myRegionData.durationMinutes} хв</span>}
                    </div>
                  </div>
                </div>

                <button
                  onClick={onNavigateToShelters}
                  className="w-full mt-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Знайти укриття
                </button>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Footer Features Strip */}
      <div className="relative z-10 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-slate-300">
            <Radio className="w-3.5 h-3.5 text-cyan-400" /> Web Audio Siren Dual-Oscillator
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Raycasting Trajectories
          </span>
        </div>

        <button
          onClick={onNavigateToSimulator}
          className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
        >
          Відкрити 7-кроковий симулятор загроз <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
