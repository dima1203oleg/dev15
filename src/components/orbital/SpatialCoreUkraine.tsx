import React from 'react';
import { ThreatSceneModel } from '../../types';

interface SpatialCoreUkraineProps {
  threatModel: ThreatSceneModel;
  partnerMode?: boolean;
  isPaused?: boolean;
  onSelectCore?: () => void;
}

export const SpatialCoreUkraine: React.FC<SpatialCoreUkraineProps> = ({
  threatModel,
  partnerMode = false,
  isPaused = false,
  onSelectCore,
}) => {
  const isAlarmActive = threatModel.activeAlarmsCount > 0;

  return (
    <div 
      onClick={onSelectCore}
      className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 flex items-center justify-center cursor-pointer select-none group"
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      {/* 3D Deep Ambient Spherical Glow */}
      <div 
        className={`absolute inset-0 rounded-full blur-3xl opacity-40 transition-all duration-1000 ${
          partnerMode 
            ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400' 
            : isAlarmActive 
            ? 'bg-gradient-to-tr from-rose-600 via-amber-600 to-cyan-500' 
            : 'bg-gradient-to-tr from-cyan-600 via-blue-600 to-emerald-400'
        }`}
      />

      {/* Orbit Ring 1 (Inner Elevation Ring) */}
      <div 
        className={`absolute inset-4 rounded-full border border-dashed transition-all duration-700 ${
          partnerMode ? 'border-purple-400/40' : 'border-cyan-400/40'
        } ${isPaused ? '' : 'animate-[spin_40s_linear_infinite]'}`}
        style={{
          transform: 'rotateX(68deg) rotateZ(0deg)',
          transformStyle: 'preserve-3d',
        }}
      />

      {/* Orbit Ring 2 (Outer Radar Sweep Ring) */}
      <div 
        className={`absolute -inset-4 rounded-full border border-cyan-500/20 ${
          isPaused ? '' : 'animate-[spin_25s_linear_infinite_reverse]'
        }`}
        style={{
          transform: 'rotateX(72deg) rotateY(15deg)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Orbit Node Pulse */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#38bdf8] animate-ping" />
      </div>

      {/* Orbit Ring 3 (Equatorial Coordinate Axis) */}
      <div 
        className="absolute -inset-10 rounded-full border border-slate-700/30 pointer-events-none"
        style={{
          transform: 'rotateX(82deg)',
          transformStyle: 'preserve-3d',
        }}
      />

      {/* Central 3D Digital Twin Core Disc */}
      <div 
        className="relative w-44 h-44 sm:w-48 sm:h-48 md:w-52 md:h-52 rounded-full p-2.5 transition-all duration-500 flex flex-col items-center justify-center text-center shadow-2xl backdrop-blur-xl border"
        style={{
          background: partnerMode
            ? 'radial-gradient(circle at 40% 30%, rgba(88, 28, 135, 0.85) 0%, rgba(15, 23, 42, 0.95) 75%)'
            : isAlarmActive
            ? 'radial-gradient(circle at 40% 30%, rgba(159, 18, 57, 0.85) 0%, rgba(15, 23, 42, 0.95) 75%)'
            : 'radial-gradient(circle at 40% 30%, rgba(8, 145, 178, 0.85) 0%, rgba(15, 23, 42, 0.95) 75%)',
          borderColor: partnerMode 
            ? 'rgba(192, 132, 252, 0.5)' 
            : isAlarmActive 
            ? 'rgba(244, 63, 94, 0.5)' 
            : 'rgba(56, 189, 248, 0.5)',
          boxShadow: isAlarmActive
            ? '0 0 35px rgba(244, 63, 94, 0.4), inset 0 0 20px rgba(244, 63, 94, 0.2)'
            : '0 0 35px rgba(56, 189, 248, 0.35), inset 0 0 20px rgba(56, 189, 248, 0.2)',
          transform: 'translateZ(20px)',
        }}
      >
        {/* Holographic Top Ring */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-slate-700/60 text-[9px] font-mono font-bold tracking-wider text-cyan-300">
          <span className={`w-1.5 h-1.5 rounded-full ${isAlarmActive ? 'bg-rose-500 animate-ping' : 'bg-cyan-400'}`} />
          <span>{partnerMode ? 'PARTNER CORE' : 'SIREN SPATIAL CORE'}</span>
        </div>

        {/* 3D Stylized Vector Graphic / Ukraine Map Layer */}
        <div className="my-auto flex flex-col items-center justify-center">
          <div className="relative w-24 h-16 sm:w-28 sm:h-18 flex items-center justify-center">
            {/* SVG Contour */}
            <svg viewBox="0 0 200 120" className="w-full h-full filter drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]">
              <path
                d="M20,40 Q45,25 75,30 T130,25 T175,45 Q185,65 170,80 T125,95 Q105,98 85,90 T45,85 T20,65 Z"
                fill={partnerMode ? 'rgba(168, 85, 247, 0.25)' : isAlarmActive ? 'rgba(244, 63, 94, 0.25)' : 'rgba(56, 189, 248, 0.25)'}
                stroke={partnerMode ? '#c084fc' : isAlarmActive ? '#f43f5e' : '#38bdf8'}
                strokeWidth="2.5"
                strokeDasharray="4 2"
              />
              {/* Regional Radar Nodes */}
              <circle cx="95" cy="50" r="4" fill="#38bdf8" className="animate-ping" />
              <circle cx="95" cy="50" r="3" fill="#ffffff" />
              
              <circle cx="60" cy="55" r="2.5" fill="#38bdf8" />
              <circle cx="140" cy="55" r="2.5" fill={isAlarmActive ? '#f43f5e' : '#38bdf8'} />
              <circle cx="120" cy="80" r="2.5" fill={isAlarmActive ? '#f43f5e' : '#38bdf8'} />
            </svg>

            {/* Scanning Laser Sweep line */}
            {!isPaused && (
              <div 
                className="absolute inset-y-0 w-1 bg-gradient-to-b from-transparent via-cyan-300 to-transparent opacity-75 animate-[moveLaser_3s_ease-in-out_infinite]"
                style={{
                  boxShadow: '0 0 10px #38bdf8',
                }}
              />
            )}
          </div>

          <div className="text-[11px] font-black text-white font-mono tracking-tight">
            {partnerMode ? 'NETWORK GRAPH' : 'DIGITAL TWIN UKRAINE'}
          </div>
          <div className="text-[9px] text-slate-300 font-mono flex items-center justify-center gap-1.5 mt-0.5">
            <span className={isAlarmActive ? 'text-rose-400 font-bold' : 'text-cyan-300'}>
              {threatModel.activeAlarmsCount} ТРИВОГ
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">25 ОБЛАСТЕЙ</span>
          </div>
        </div>

        {/* Bottom Data Mode Badge */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[8px] font-mono text-slate-400 bg-slate-950/90 px-2 py-0.5 rounded-full border border-slate-800">
          <span>СИНХРОНІЗАЦІЯ:</span>
          <span className="text-emerald-400 font-bold">{threatModel.dataMode}</span>
        </div>
      </div>
    </div>
  );
};
