import React, { useState, useRef, useMemo } from 'react';
import { 
  Box, 
  Layers, 
  Compass, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Radio, 
  Eye, 
  EyeOff, 
  Flame, 
  Zap, 
  Navigation, 
  Maximize2, 
  Sliders, 
  Plane,
  Sparkles
} from 'lucide-react';
import { RegionData, ThreatType, ThreatTrajectory } from '../types';
import { INITIAL_TRAJECTORIES } from '../data/spatialThreatData';
import { GeminiSparkle } from './common/GeminiSparkle';

interface UkraineMapProps {
  regions: RegionData[];
  selectedRegionId: string | null;
  onSelectRegion: (region: RegionData) => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  myRegionId: string;
  is3DMode?: boolean;
  onToggle3DMode?: () => void;
  onNavigateToWebGL3D?: () => void;
}

export const UkraineMap: React.FC<UkraineMapProps> = ({
  regions,
  selectedRegionId,
  onSelectRegion,
  showLabels,
  onToggleLabels,
  myRegionId,
  is3DMode = true,
  onToggle3DMode,
  onNavigateToWebGL3D,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [is3DIsometric, setIs3DIsometric] = useState(true);
  const [tiltAngle, setTiltAngle] = useState({ x: 28, y: -10 });
  const [showTrajectories, setShowTrajectories] = useState(true);
  const [showRadarSweep, setShowRadarSweep] = useState(true);
  const [hoveredRegion, setHoveredRegion] = useState<RegionData | null>(null);
  const [selectedTrajectory, setSelectedTrajectory] = useState<ThreatTrajectory | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Filter trajectories based on active regions
  const activeTrajectories = useMemo(() => {
    return INITIAL_TRAJECTORIES;
  }, []);

  const handleZoomIn = () => setZoom((z) => Math.min(2.5, z + 0.25));
  const handleZoomOut = () => setZoom((z) => Math.max(0.75, z - 0.25));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setTiltAngle({ x: 28, y: -10 });
  };

  // Color generator for region based on threat
  const getRegionStyle = (region: RegionData) => {
    const isSelected = region.id === selectedRegionId;
    const isMyRegion = region.id === myRegionId;

    if (!region.isAlarm) {
      return {
        fill: isSelected ? '#1e293b' : '#0f172a',
        stroke: isMyRegion ? '#38bdf8' : isSelected ? '#94a3b8' : '#334155',
        strokeWidth: isMyRegion ? 2.5 : isSelected ? 2 : 1,
        filter: isMyRegion ? 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.4))' : 'none',
      };
    }

    switch (region.threatType) {
      case 'ballistic':
        return {
          fill: '#881337',
          stroke: '#fb7185',
          strokeWidth: isSelected ? 2.5 : 1.5,
          filter: 'drop-shadow(0 0 10px rgba(244, 63, 94, 0.6))',
        };
      case 'drone':
        return {
          fill: '#7c2d12',
          stroke: '#fb923c',
          strokeWidth: isSelected ? 2.5 : 1.5,
          filter: 'drop-shadow(0 0 10px rgba(251, 146, 60, 0.6))',
        };
      case 'aviation':
        return {
          fill: '#581c87',
          stroke: '#c084fc',
          strokeWidth: isSelected ? 2.5 : 1.5,
          filter: 'drop-shadow(0 0 10px rgba(192, 132, 252, 0.6))',
        };
      case 'artillery':
        return {
          fill: '#713f12',
          stroke: '#facc15',
          strokeWidth: isSelected ? 2.5 : 1.5,
          filter: 'drop-shadow(0 0 10px rgba(250, 204, 21, 0.6))',
        };
      default:
        return {
          fill: '#991b1b',
          stroke: '#f87171',
          strokeWidth: isSelected ? 2.5 : 1.5,
          filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.5))',
        };
    }
  };

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl relative flex flex-col overflow-hidden">
      
      {/* 3D Map Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
        
        {/* Left: Mode Title */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/20 text-blue-400">
            <GeminiSparkle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{is3DIsometric ? 'Ізометрична Карта Загроз' : 'Тактична Карта України'}</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/5 text-blue-300 border border-white/10 font-mono">
                GPU ACCELERATED
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Масштабування, траєкторії БпЛА, азимути та висоти польоту
            </p>
          </div>
        </div>

        {/* Right: Interactive 3D Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {onNavigateToWebGL3D && (
            <button
              onClick={onNavigateToWebGL3D}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)] hover:opacity-90 cursor-pointer"
            >
              <GeminiSparkle className="w-3.5 h-3.5 text-white" />
              <span>Three.js Студія</span>
            </button>
          )}

          {/* Isometric / Flat Toggle */}
          <button
            onClick={() => setIs3DIsometric(!is3DIsometric)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
              is3DIsometric
                ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.25)]'
                : 'bg-white/5 text-slate-400 hover:text-white border-white/10'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>{is3DIsometric ? 'Ізометрія' : 'Плоска'}</span>
          </button>

          {/* Trajectories Layer Toggle */}
          <button
            onClick={() => setShowTrajectories(!showTrajectories)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
              showTrajectories
                ? 'bg-purple-600/20 text-purple-300 border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.25)]'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
            }`}
            title="Вектори польоту загроз"
          >
            <Plane className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Траєкторії</span>
          </button>

          {/* Radar Sweep Toggle */}
          <button
            onClick={() => setShowRadarSweep(!showRadarSweep)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
              showRadarSweep
                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
            }`}
            title="РЛС Радар"
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">РЛС</span>
          </button>

          {/* Labels Toggle */}
          <button
            onClick={onToggleLabels}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
              showLabels
                ? 'bg-white/10 text-white border-white/20'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
            }`}
            title="Підписи областей"
          >
            {showLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-0.5">
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-white/10 text-slate-300 rounded-full text-xs cursor-pointer"
              title="Наблизити"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-white/10 text-slate-300 rounded-full text-xs cursor-pointer"
              title="Віддалити"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleReset}
              className="p-1.5 hover:bg-white/10 text-slate-300 rounded-full text-xs cursor-pointer"
              title="Скинути ракурс"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

      {/* 3D Stage & Interactive Map Surface */}
      <div 
        ref={containerRef}
        className="map-3d-stage w-full h-[480px] sm:h-[540px] relative bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden flex items-center justify-center select-none"
      >
        
        {/* Subtle Cyber Spatial Grid Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage: `
              radial-gradient(circle at center, rgba(56, 189, 248, 0.2) 0%, transparent 65%),
              linear-gradient(to right, rgba(51, 65, 85, 0.4) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(51, 65, 85, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 35px 35px, 35px 35px',
          }}
        />

        {/* 3D Map Plane Container */}
        <div 
          className={`map-3d-plane w-full h-full flex items-center justify-center ${
            is3DIsometric ? 'isometric-active' : 'flat-active'
          }`}
          style={{
            transform: is3DIsometric 
              ? `rotateX(${tiltAngle.x}deg) rotateZ(${tiltAngle.y}deg) scale(${zoom * 0.94}) translate(${pan.x}px, ${pan.y}px)`
              : `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          }}
        >
          
          <svg
            viewBox="0 0 1000 650"
            className="w-full h-full max-w-[960px] max-h-[580px] overflow-visible preserve-3d"
          >
            
            {/* SVG Filter Glows */}
            <defs>
              <filter id="radar-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <linearGradient id="laser-grad-shahed" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fb923c" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="laser-grad-ballistic" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#e11d48" stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Depth Extrusion Shadow Layer under regions (when 3D is active) */}
            {is3DIsometric && (
              <g className="opacity-40" transform="translate(0, 14)">
                {regions.map((region) => (
                  <path
                    key={`shadow-${region.id}`}
                    d={region.path}
                    fill={region.isAlarm ? '#450a0a' : '#020617'}
                    stroke="#000000"
                    strokeWidth="1"
                  />
                ))}
              </g>
            )}

            {/* Main Interactive Regions Vector Layer */}
            <g className="map-depth-base">
              {regions.map((region) => {
                const style = getRegionStyle(region);
                const isHovered = hoveredRegion?.id === region.id;
                const isSelected = selectedRegionId === region.id;
                const isMyRegion = myRegionId === region.id;

                return (
                  <g
                    key={region.id}
                    onClick={() => onSelectRegion(region)}
                    onMouseEnter={() => setHoveredRegion(region)}
                    onMouseLeave={() => setHoveredRegion(null)}
                    className="cursor-pointer transition-all duration-200"
                  >
                    <path
                      d={region.path}
                      fill={isHovered ? (region.isAlarm ? '#b91c1c' : '#334155') : style.fill}
                      stroke={style.stroke}
                      strokeWidth={isHovered ? 2.5 : style.strokeWidth}
                      style={{ filter: style.filter }}
                      className="transition-colors duration-200"
                    />

                    {/* My Region Glowing Pin Ring */}
                    {isMyRegion && (
                      <circle
                        cx={region.center[0]}
                        cy={region.center[1]}
                        r="14"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2"
                        strokeDasharray="4 3"
                        className="animate-spin"
                        style={{ transformOrigin: `${region.center[0]}px ${region.center[1]}px` }}
                      />
                    )}

                    {/* Regional Label */}
                    {showLabels && (
                      <g pointerEvents="none">
                        <text
                          x={region.center[0]}
                          y={region.center[1]}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#ffffff"
                          fontSize={region.id === 'kyiv_city' ? '10' : '11'}
                          fontWeight="700"
                          className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] select-none"
                        >
                          {region.shortName}
                        </text>
                        {region.isAlarm && (
                          <text
                            x={region.center[0]}
                            y={region.center[1] + 13}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#fca5a5"
                            fontSize="9"
                            fontWeight="800"
                            className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
                          >
                            {region.durationMinutes}хв
                          </text>
                        )}
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Trajectory Laser Paths & Altitude Vectors */}
            {showTrajectories && (
              <g className="map-depth-threats pointer-events-none">
                {activeTrajectories.map((traj) => {
                  const strokeColor = 
                    traj.threatType === 'ballistic' 
                      ? '#f43f5e' 
                      : traj.threatType === 'drone' 
                      ? '#f97316' 
                      : '#c084fc';

                  return (
                    <g key={traj.id} className="cursor-pointer pointer-events-auto" onClick={() => setSelectedTrajectory(traj)}>
                      {/* Trajectory Arc */}
                      <path
                        d={traj.pathD}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="3.5"
                        strokeDasharray="8 6"
                        className="animate-laser-dash"
                      />
                      
                      {/* Pulse Target Indicator */}
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

                      {/* Altitude Flight Tag */}
                      <g transform={`translate(${traj.currentPoint.x + 8}, ${traj.currentPoint.y - 12})`}>
                        <rect
                          width="90"
                          height="20"
                          rx="4"
                          fill="rgba(15, 23, 42, 0.85)"
                          stroke={strokeColor}
                          strokeWidth="1"
                        />
                        <text
                          x="5"
                          y="13"
                          fill="#ffffff"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {traj.altitudeMeters}m · {traj.speedKmh}km/h
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>
            )}

            {/* 3D Radar Sweep Arc */}
            {showRadarSweep && (
              <g className="map-depth-radar pointer-events-none" transform="translate(500, 260)">
                <circle r="180" fill="none" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="1" />
                <circle r="120" fill="none" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="1" />
                <circle r="60" fill="none" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1" />
                <line x1="-180" y1="0" x2="180" y2="0" stroke="rgba(56, 189, 248, 0.12)" strokeWidth="1" />
                <line x1="0" y1="-180" x2="0" y2="180" stroke="rgba(56, 189, 248, 0.12)" strokeWidth="1" />
                <path
                  d="M 0,0 L 180,0 A 180,180 0 0,0 127,-127 Z"
                  fill="url(#radar-glow)"
                  fillOpacity="0.08"
                  className="animate-radar-sweep origin-center"
                />
              </g>
            )}

          </svg>

        </div>

        {/* Hover / Selection Tactical Floating HUD */}
        {(hoveredRegion || selectedTrajectory) && (
          <div className="absolute top-4 left-4 z-30 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md max-w-xs animate-in fade-in duration-150">
            {hoveredRegion && (
              <>
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
                  <span className="font-extrabold text-sm text-slate-100">{hoveredRegion.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    hoveredRegion.isAlarm ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {hoveredRegion.isAlarm ? '🚨 ТРИВОГА' : '🟢 ВІДБІЙ'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Населення:</span>
                    <span className="text-slate-200 font-mono">{(hoveredRegion.population / 1000000).toFixed(2)} млн</span>
                  </div>
                  {hoveredRegion.isAlarm && (
                    <div className="flex justify-between text-red-300 font-bold">
                      <span>Тривалість:</span>
                      <span className="font-mono">{hoveredRegion.durationMinutes} хв</span>
                    </div>
                  )}
                  {hoveredRegion.threatDetails && (
                    <p className="text-[11px] text-amber-300 bg-amber-950/40 p-1.5 rounded border border-amber-900/50 mt-1">
                      {hoveredRegion.threatDetails}
                    </p>
                  )}
                </div>
              </>
            )}
            
            {selectedTrajectory && !hoveredRegion && (
              <>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                  <span className="font-bold text-xs text-amber-300">{selectedTrajectory.name}</span>
                  <button onClick={() => setSelectedTrajectory(null)} className="text-slate-500 hover:text-slate-300 text-xs">✕</button>
                </div>
                <div className="text-xs space-y-1 text-slate-300">
                  <div>Азимут: <span className="font-mono text-cyan-300">{selectedTrajectory.azimuthDirection}</span></div>
                  <div>Висота / швидкість: <span className="font-mono text-slate-100">{selectedTrajectory.altitudeMeters}м / {selectedTrajectory.speedKmh} км/год</span></div>
                  <div>ETA: <span className="font-mono text-rose-300 font-bold">{selectedTrajectory.etaMinutes} хв</span></div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 3D Angle Slider HUD for quick manual orbit */}
        {is3DIsometric && (
          <div className="absolute bottom-4 right-4 z-20 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs flex items-center gap-3 backdrop-blur-md">
            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Кут: {tiltAngle.x}°</span>
            </span>
            <input
              type="range"
              min="10"
              max="45"
              value={tiltAngle.x}
              onChange={(e) => setTiltAngle((prev) => ({ ...prev, x: Number(e.target.value) }))}
              className="w-20 accent-cyan-400 cursor-pointer"
            />
          </div>
        )}

      </div>

    </div>
  );
};
