import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Shield, 
  Flame, 
  Zap, 
  Layers, 
  Compass, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Sliders, 
  Eye, 
  EyeOff, 
  Box, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  MapPin, 
  ChevronRight,
  Maximize2,
  Terminal,
  Lock,
  Wifi,
  Sparkles,
  Plane,
  Crosshair
} from 'lucide-react';
import { RegionData, ThreatTrajectory, UserSettings } from '../types';

interface DigitalTwinCockpitProps {
  regions: RegionData[];
  trajectories: ThreatTrajectory[];
  settings: UserSettings;
  onSelectRegion: (region: RegionData) => void;
  onNavigateToSimulator: () => void;
  onNavigateToShelters: () => void;
  onNavigateToWebGL3D?: () => void;
}

export const DigitalTwinCockpit: React.FC<DigitalTwinCockpitProps> = ({
  regions,
  trajectories,
  settings,
  onSelectRegion,
  onNavigateToSimulator,
  onNavigateToShelters,
  onNavigateToWebGL3D,
}) => {
  const [activeViewMode, setActiveViewMode] = useState<'REALTIME' | 'FORECAST' | 'HISTORY' | 'HEATMAP' | 'EXPLODED'>('REALTIME');
  const [timelineIndex, setTimelineIndex] = useState<number>(85); // 0 to 100 timeline scrubber
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);
  const [activeThreatFilter, setActiveThreatFilter] = useState<'ALL' | 'MISSILE' | 'DRONE' | 'AVIATION'>('ALL');
  
  // Layer toggles
  const [layerTrajectories, setLayerTrajectories] = useState(true);
  const [layerHeatmap, setLayerHeatmap] = useState(true);
  const [layerShelters, setLayerShelters] = useState(true);
  const [layerMyRegion, setLayerMyRegion] = useState(true);
  const [layerInfrastructure, setLayerInfrastructure] = useState(true);
  const [layerRadarGrid, setLayerRadarGrid] = useState(true);
  const [layerWeather, setLayerWeather] = useState(false);

  // 3D Parallax Tilt state
  const [tilt, setTilt] = useState({ x: 26, y: -8 });
  const [selectedTrajectory, setSelectedTrajectory] = useState<ThreatTrajectory | null>(trajectories[0] || null);
  const [currentTime, setCurrentTime] = useState('');

  const alarmRegions = regions.filter((r) => r.isAlarm);
  const myRegionData = regions.find((r) => r.id === settings.myRegion) || regions[0];

  // Live time ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Timeline playback simulation
  useEffect(() => {
    let timer: any = null;
    if (isPlayingTimeline) {
      timer = setInterval(() => {
        setTimelineIndex((prev) => {
          if (prev >= 100) return 0;
          return prev + 1;
        });
      }, 500);
    }
    return () => clearInterval(timer);
  }, [isPlayingTimeline]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -16;
    setTilt({ x: 26 + y, y: -8 + x });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 26, y: -8 });
  };

  // Timeline time label calculation
  const getTimelineTimeString = () => {
    const baseHour = 14;
    const baseMin = 10;
    const totalMinutes = Math.floor((timelineIndex / 100) * 60);
    const hour = baseHour + Math.floor((baseMin + totalMinutes) / 60);
    const minute = (baseMin + totalMinutes) % 60;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-950 border border-cyan-500/30 rounded-3xl p-4 sm:p-7 shadow-2xl relative overflow-hidden mb-10">
      
      {/* Background Cyber HUD Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.3) 0%, transparent 60%),
            linear-gradient(to right, rgba(56, 189, 248, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 32px 32px, 32px 32px',
        }}
      />

      {/* Cockpit Top Bar (Cyber Header) */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-cyan-500/20 pb-4 mb-6 text-xs">
        
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-slate-100 text-sm tracking-wider">
                SIREN UA · COMMAND COCKPIT
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono text-[10px] font-bold">
                PRO-TACTICAL
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              DIGITAL TWIN OF UKRAINE AIRSPACE · 0.8s LATENCY
            </span>
          </div>
        </div>

        {/* Center: Realtime Mode Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
          {[
            { id: 'REALTIME', label: 'Реальний час', icon: Activity },
            { id: 'FORECAST', label: 'Прогноз (30хв)', icon: Clock },
            { id: 'HEATMAP', label: 'Теплова карта', icon: Flame },
            { id: 'EXPLODED', label: 'Шари', icon: Layers },
          ].map((mode) => {
            const Icon = mode.icon;
            const isActive = activeViewMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setActiveViewMode(mode.id as any)}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Security, WebGL Studio Link & Clock */}
        <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
          {onNavigateToWebGL3D && (
            <button
              onClick={onNavigateToWebGL3D}
              className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/30 flex items-center gap-1.5 transition-all transform active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950 animate-pulse" />
              <span>Three.js Студія</span>
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1 text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800">
            <Lock className="w-3 h-3" />
            <span className="text-[10px]">AES-256</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 text-slate-200">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-cyan-200">{currentTime || '14:36:00'}</span>
          </div>
        </div>

      </div>

      {/* Main 3-Column Cockpit HUD */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: Threat Cards & Tactical Feeds (3 Cols on LG) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Threat Cards Box */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <span className="font-mono text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-400" />
                <span>АКТИВНІ ЗАГРОЗИ ({trajectories.length})</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-mono font-bold border border-rose-800">
                LIVE
              </span>
            </div>

            {/* Threat List */}
            <div className="space-y-2.5">
              {trajectories.map((traj) => {
                const isSelected = selectedTrajectory?.id === traj.id;
                const isMissile = traj.threatType === 'ballistic' || traj.threatType === 'missile';
                
                return (
                  <div
                    key={traj.id}
                    onClick={() => setSelectedTrajectory(traj)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-rose-950/50 border-rose-500 shadow-md shadow-rose-950' 
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-black text-slate-100 flex items-center gap-1">
                        {isMissile ? <Zap className="w-3.5 h-3.5 text-rose-400" /> : <Plane className="w-3.5 h-3.5 text-amber-400" />}
                        {traj.name}
                      </span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                        {traj.azimuthDirection.split(' ')[0]}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Висота / швидкість:</span>
                        <span className="font-mono text-slate-200">{traj.altitudeMeters}м · {traj.speedKmh}км/г</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Цільовий сектор:</span>
                        <span className="text-amber-300 font-semibold truncate max-w-[120px]">{traj.targetRegion}</span>
                      </div>
                      <div className="flex justify-between font-bold pt-1 border-t border-slate-800/80">
                        <span className="text-rose-300">ETA підльоту:</span>
                        <span className="font-mono text-rose-400">{traj.etaMinutes} хв</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time Telemetry Data Stream Status */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
              <span className="font-mono text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>DATA STREAMS</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                98.7 TB/s
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                <span className="text-slate-400">SatCom SpaceLink</span>
                <span className="text-emerald-400 font-bold">LOCKED</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                <span className="text-slate-400">Radar Net SAR</span>
                <span className="text-cyan-400 font-bold">STREAMING</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                <span className="text-slate-400">ELINT Signals</span>
                <span className="text-purple-400 font-bold">ENCRYPTED</span>
              </div>
            </div>
          </div>

        </div>

        {/* Center Column: Curved Interactive Digital Twin (6 Cols on LG) */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Visualizer Card */}
          <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
            
            {/* Top Interactive Layer Chips */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-1 text-xs font-mono font-bold text-cyan-300">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>{activeViewMode === 'EXPLODED' ? 'EXPLODED LAYER STACK' : 'DIGITAL TWIN UKRAINE'}</span>
              </div>

              {/* Layer switch buttons */}
              <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono">
                <button
                  onClick={() => setLayerTrajectories(!layerTrajectories)}
                  className={`px-2 py-1 rounded-lg border transition-colors ${
                    layerTrajectories ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-slate-950 text-slate-500 border-slate-800'
                  }`}
                >
                  Вектори
                </button>
                <button
                  onClick={() => setLayerHeatmap(!layerHeatmap)}
                  className={`px-2 py-1 rounded-lg border transition-colors ${
                    layerHeatmap ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-950 text-slate-500 border-slate-800'
                  }`}
                >
                  Heatmap
                </button>
                <button
                  onClick={() => setLayerShelters(!layerShelters)}
                  className={`px-2 py-1 rounded-lg border transition-colors ${
                    layerShelters ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-950 text-slate-500 border-slate-800'
                  }`}
                >
                  Укриття
                </button>
                <button
                  onClick={() => setLayerRadarGrid(!layerRadarGrid)}
                  className={`px-2 py-1 rounded-lg border transition-colors ${
                    layerRadarGrid ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-950 text-slate-500 border-slate-800'
                  }`}
                >
                  РЛС
                </button>
              </div>
            </div>

            {/* 3D Map Visual Canvas */}
            <div 
              className="relative w-full h-[360px] sm:h-[400px] perspective-1500 flex items-center justify-center select-none overflow-hidden rounded-xl bg-slate-950 border border-slate-800"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              
              {/* Radar Grid Backdrop */}
              <div 
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at center, rgba(56, 189, 248, 0.2) 0%, transparent 70%), linear-gradient(to right, rgba(56, 189, 248, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.15) 1px, transparent 1px)`,
                  backgroundSize: '100% 100%, 28px 28px, 28px 28px',
                }}
              />

              {/* 3D Rotational Map Plane */}
              <div 
                className={`relative w-full h-full preserve-3d transition-transform duration-300 flex items-center justify-center ${
                  activeViewMode === 'EXPLODED' ? 'scale-90' : 'scale-95'
                }`}
                style={{
                  transform: `rotateX(${tilt.x}deg) rotateZ(${tilt.y}deg)`,
                }}
              >
                
                <svg
                  viewBox="0 0 1000 650"
                  className="w-full h-full max-w-[850px] max-h-[500px] overflow-visible preserve-3d"
                >
                  
                  {/* SVG Extrusion Shadow Layer under regions */}
                  <g className="opacity-50" transform="translate(0, 18)">
                    {regions.map((region) => (
                      <path
                        key={`shadow-${region.id}`}
                        d={region.path}
                        fill={region.isAlarm ? '#450a0a' : '#020617'}
                        stroke="#000000"
                        strokeWidth="1.5"
                      />
                    ))}
                  </g>

                  {/* Base Regions Layer */}
                  <g className="map-depth-base">
                    {regions.map((region) => {
                      const isAlarm = region.isAlarm;
                      const isSelected = selectedTrajectory?.targetRegion.includes(region.name) || region.id === settings.myRegion;
                      
                      let fillColor = '#0f172a';
                      let strokeColor = '#334155';
                      
                      if (isAlarm) {
                        fillColor = region.threatType === 'ballistic' ? '#881337' : region.threatType === 'drone' ? '#7c2d12' : '#991b1b';
                        strokeColor = region.threatType === 'ballistic' ? '#fb7185' : '#fb923c';
                      }

                      if (region.id === settings.myRegion) {
                        strokeColor = '#38bdf8';
                      }

                      return (
                        <g 
                          key={region.id}
                          onClick={() => onSelectRegion(region)}
                          className="cursor-pointer transition-all hover:opacity-80"
                        >
                          <path
                            d={region.path}
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={isSelected ? 2.5 : 1}
                            style={{
                              filter: isAlarm ? 'drop-shadow(0 0 8px rgba(244, 63, 94, 0.4))' : 'none',
                            }}
                          />

                          {/* Regional label */}
                          <text
                            x={region.center[0]}
                            y={region.center[1]}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#ffffff"
                            fontSize="10"
                            fontWeight="bold"
                            className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] select-none pointer-events-none"
                          >
                            {region.shortName}
                          </text>

                          {/* Pulsing Beacon for Alarmed Region */}
                          {isAlarm && (
                            <circle
                              cx={region.center[0]}
                              cy={region.center[1]}
                              r="8"
                              fill="none"
                              stroke="#f87171"
                              strokeWidth="1.5"
                              className="animate-ping"
                            />
                          )}
                        </g>
                      );
                    })}
                  </g>

                  {/* 3D Laser Trajectory Arcs */}
                  {layerTrajectories && (
                    <g className="map-depth-threats pointer-events-none">
                      {trajectories.map((traj) => {
                        const isMissile = traj.threatType === 'ballistic';
                        const strokeColor = isMissile ? '#f43f5e' : '#f97316';

                        return (
                          <g key={traj.id}>
                            <path
                              d={traj.pathD}
                              fill="none"
                              stroke={strokeColor}
                              strokeWidth="3.5"
                              strokeDasharray="6 4"
                              className="animate-laser-dash"
                            />
                            
                            {/* Moving Threat Marker */}
                            <circle
                              cx={traj.currentPoint.x}
                              cy={traj.currentPoint.y}
                              r="7"
                              fill="none"
                              stroke={strokeColor}
                              strokeWidth="2"
                              className="animate-ping"
                            />
                            <circle
                              cx={traj.currentPoint.x}
                              cy={traj.currentPoint.y}
                              r="5"
                              fill={strokeColor}
                            />

                            {/* Floating Altitude & ETA Label */}
                            <g transform={`translate(${traj.currentPoint.x + 10}, ${traj.currentPoint.y - 15})`}>
                              <rect
                                width="90"
                                height="22"
                                rx="5"
                                fill="rgba(8, 15, 30, 0.9)"
                                stroke={strokeColor}
                                strokeWidth="1"
                              />
                              <text
                                x="6"
                                y="15"
                                fill="#ffffff"
                                fontSize="9"
                                fontFamily="monospace"
                                fontWeight="bold"
                              >
                                {traj.altitudeMeters}m · ETA {traj.etaMinutes}m
                              </text>
                            </g>
                          </g>
                        );
                      })}
                    </g>
                  )}

                  {/* 3D Radar Sweep */}
                  {layerRadarGrid && (
                    <g className="map-depth-radar pointer-events-none" transform="translate(500, 260)">
                      <circle r="160" fill="none" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="1" />
                      <circle r="100" fill="none" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1" />
                      <line x1="-160" y1="0" x2="160" y2="0" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="1" />
                      <line x1="0" y1="-160" x2="0" y2="160" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="1" />
                      <path
                        d="M 0,0 L 160,0 A 160,160 0 0,0 113,-113 Z"
                        fill="rgba(56, 189, 248, 0.12)"
                        className="animate-radar-sweep origin-center"
                      />
                    </g>
                  )}

                </svg>

              </div>

              {/* Exploded Mode Visual Hint */}
              {activeViewMode === 'EXPLODED' && (
                <div className="absolute top-3 left-3 bg-cyan-950/80 border border-cyan-500/40 rounded-xl px-3 py-1.5 text-[11px] font-mono text-cyan-300 backdrop-blur-md">
                  ★ Розгорнуто 5 шарів: Траєкторії + Heatmap + Мій район + Укриття + Рельєф
                </div>
              )}

            </div>

            {/* Interactive Timeline Scrubber (Хронологія Подій) */}
            <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>ХРОНОЛОГІЯ ПОДІЙ</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">
                    {getTimelineTimeString()}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTimelineIndex((prev) => Math.max(0, prev - 10))}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono"
                  >
                    -5 хв
                  </button>
                  <button
                    onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
                    className="p-1.5 rounded bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold"
                  >
                    {isPlayingTimeline ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => setTimelineIndex((prev) => Math.min(100, prev + 10))}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono"
                  >
                    +5 хв
                  </button>
                  <button
                    onClick={() => setTimelineIndex(85)}
                    className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold font-mono"
                  >
                    LIVE
                  </button>
                </div>
              </div>

              {/* Slider track */}
              <input
                type="range"
                min="0"
                max="100"
                value={timelineIndex}
                onChange={(e) => setTimelineIndex(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>13:30 (Початок)</span>
                <span>14:00</span>
                <span className="text-cyan-400 font-bold">14:36 (Зараз)</span>
                <span>15:15 (Прогноз)</span>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Assessment Gauge, Region Stats, Shelters (3 Cols on LG) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* General Assessment / Risk Gauge */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <span className="font-mono text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>ЗАГАЛЬНА ОЦІНКА РИЗИКУ</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-mono font-bold border border-rose-800">
                КРИТИЧНО
              </span>
            </div>

            {/* Gauge Circle Visualization */}
            <div className="flex items-center justify-center my-3 relative">
              <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="8" fill="none" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  stroke="#ef4444" 
                  strokeWidth="8" 
                  fill="none"
                  strokeDasharray="251.2"
                  strokeDashoffset="70"
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono text-2xl font-black text-rose-400">7.2</span>
                <span className="text-[9px] text-slate-400 font-mono uppercase">З 10 БАЛІВ</span>
              </div>
            </div>

            {/* Regional breakdown */}
            <div className="space-y-1.5 text-[11px] font-mono pt-1 border-t border-slate-800/80">
              <div className="flex justify-between">
                <span className="text-slate-400">Східний сектор:</span>
                <span className="text-rose-400 font-bold">48% загроз</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Північний сектор:</span>
                <span className="text-amber-400 font-bold">32% загроз</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Південний сектор:</span>
                <span className="text-cyan-400 font-bold">15% загроз</span>
              </div>
            </div>
          </div>

          {/* Shelter Network Status */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
              <span className="font-mono text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>МЕРЕЖА УКРИТТІВ</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">1,842 ВІДКРИТО</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Найближче укриття:</span>
                <span className="text-emerald-300 font-bold font-mono">340м (4 хв)</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden flex">
                <div className="bg-emerald-500 h-full w-[87%]" title="Відкрито 87%" />
                <div className="bg-amber-500 h-full w-[12%]" title="Зайнято 12%" />
                <div className="bg-rose-500 h-full w-[1%]" title="Недоступно 1%" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span className="text-emerald-400">87% Доступно</span>
                <span className="text-amber-400">12% Зайнято</span>
                <span className="text-rose-400">1% Закрито</span>
              </div>
            </div>

            <button
              onClick={onNavigateToShelters}
              className="w-full mt-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Показати укриття поруч</span>
            </button>
          </div>

        </div>

      </div>

      {/* Cockpit Footer Action Bar */}
      <div className="relative z-10 mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Raymarching Elevation Shaders</span>
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:flex items-center gap-1.5 text-slate-300">
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            <span>Multi-Source Correlation Engine</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToSimulator}
            className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-bold transition-colors flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Запустити 7-Крокову Симуляцію</span>
          </button>
        </div>
      </div>

    </div>
  );
};
