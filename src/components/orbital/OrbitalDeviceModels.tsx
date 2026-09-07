import React from 'react';
import { 
  Monitor, 
  Laptop, 
  Tablet, 
  Smartphone, 
  Tv, 
  Watch, 
  Car, 
  Glasses, 
  Radio, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Zap, 
  Activity,
  Navigation,
  Flame,
  Volume2,
  Wifi,
  Battery,
  BatteryCharging,
  Shield,
  Compass,
  AlertTriangle,
  RadioTower,
  Sliders,
  Camera,
  Flashlight,
  Sparkles,
  Layers,
  Fuel,
  LocateFixed
} from 'lucide-react';
import { OrbitalDeviceType, ThreatSceneModel } from '../../types';

interface OrbitalDeviceProps {
  type: OrbitalDeviceType;
  threatModel: ThreatSceneModel;
  isSelected?: boolean;
  isDimmed?: boolean;
  partnerMode?: boolean;
  onClick?: () => void;
}

export const OrbitalDeviceModel: React.FC<OrbitalDeviceProps> = ({
  type,
  threatModel,
  isSelected = false,
  isDimmed = false,
  partnerMode = false,
  onClick,
}) => {
  const isAlarm = threatModel.activeAlarmsCount > 0 || threatModel.myRegionStatus.isAlarm;
  const etaMins = threatModel.myRegionStatus.etaMinutes || 18;
  const regionName = threatModel.myRegionStatus.name || 'Київська обл.';
  const primaryThreatName = threatModel.primaryThreat?.name || 'БпЛА Shahed-136';
  const shelterDistance = threatModel.nearestShelter.distanceMeters || 340;
  const shelterWalkTime = threatModel.nearestShelter.walkTimeMins || 4;

  switch (type) {
    // =========================================================================
    // 1. SMARTPHONE - Flagship Titanium Smartphone (Volumetric 3D Chassis, Dynamic Island, Lockscreen)
    // =========================================================================
    case 'smartphone':
      return (
        <div 
          onClick={onClick}
          className={`cursor-pointer select-none transition-all duration-300 transform-gpu group ${
            isDimmed ? 'opacity-25 scale-90' : isSelected ? 'scale-110 ring-2 ring-amber-400/90' : 'opacity-100 hover:scale-105'
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Main 3D Phone Envelope */}
          <div className="relative w-44 sm:w-48" style={{ transformStyle: 'preserve-3d' }}>
            
            {/* 3D Backplate & Camera Module (Extruded back in Z-space) */}
            <div 
              className="absolute inset-0 bg-slate-900 rounded-[2.3rem] shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(245,158,11,0.18)] border border-slate-700/60"
              style={{ transform: 'translateZ(-8px)', transformStyle: 'preserve-3d' }}
            >
              {/* Camera Bump on Back Corner with Triple Lenses */}
              <div className="absolute top-3 left-3 w-16 h-16 bg-slate-800/90 rounded-2xl border border-slate-600/80 shadow-md p-1 grid grid-cols-2 gap-1 pointer-events-none">
                <div className="w-5 h-5 rounded-full bg-slate-950 border-2 border-slate-600 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-950/80 border border-cyan-500/40" />
                </div>
                <div className="w-5 h-5 rounded-full bg-slate-950 border-2 border-slate-600 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-950/80 border border-cyan-500/40" />
                </div>
                <div className="w-5 h-5 rounded-full bg-slate-950 border-2 border-slate-600 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-950/80 border border-cyan-500/40" />
                </div>
                <div className="w-3.5 h-3.5 rounded-full bg-amber-300/80 self-center justify-self-center shadow-[0_0_6px_#fef08a]" />
              </div>
            </div>

            {/* Middle Titanium Band with Antenna Seams */}
            <div 
              className="absolute -inset-[2px] bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 rounded-[2.35rem] border border-slate-500/80 pointer-events-none"
              style={{ transform: 'translateZ(-2px)' }}
            >
              {/* Left Hardware Buttons: Orange Action Button + Volume Up & Down */}
              <div className="absolute -left-[5px] top-12 w-[4px] h-4 bg-orange-500 rounded-l-sm shadow-md border-l border-orange-400" />
              <div className="absolute -left-[5px] top-18 w-[4px] h-6 bg-slate-500 rounded-l-sm shadow-sm" />
              <div className="absolute -left-[5px] top-26 w-[4px] h-6 bg-slate-500 rounded-l-sm shadow-sm" />

              {/* Right Hardware Button: Siri / Power Button */}
              <div className="absolute -right-[5px] top-16 w-[4px] h-9 bg-slate-500 rounded-r-sm shadow-sm" />
            </div>

            {/* Front Screen Assembly with 2.5D Curved Glass & Bezel */}
            <div 
              className="relative bg-slate-950 rounded-[2.2rem] p-[3px] border border-slate-500/80"
              style={{ transform: 'translateZ(6px)', transformStyle: 'preserve-3d' }}
            >
              <div className="relative bg-slate-950 rounded-[2.0rem] p-2.5 min-h-[265px] flex flex-col justify-between overflow-hidden border border-black shadow-inner">
                
                {/* Dynamic Specular Glass Sheen Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.07] to-transparent pointer-events-none rounded-[2.0rem]" />

                {/* Dynamic Island Floating Pill */}
                <div className="relative z-20 mx-auto transition-all duration-300">
                  <div className={`h-6 px-3 rounded-full bg-black flex items-center justify-between gap-2 border border-slate-800 shadow-md ${
                    isAlarm ? 'ring-1 ring-rose-500/80' : ''
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-blue-500/80" />
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                    </div>
                    
                    {/* Live Activity Dynamic Island Alert Text */}
                    <div className="flex items-center gap-1 text-[8px] font-mono font-bold text-rose-400">
                      <span className={`w-1.5 h-1.5 rounded-full ${isAlarm ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
                      <span>{isAlarm ? `ETA ${etaMins}m` : 'SIREN LIVE'}</span>
                    </div>
                  </div>
                </div>

                {/* iOS Status Bar Row */}
                <div className="relative z-10 flex items-center justify-between text-[8px] font-mono text-slate-400 px-2 pt-0.5">
                  <span className="font-bold text-slate-200">Kyivstar 5G</span>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Wifi className="w-2.5 h-2.5" />
                    <span className="flex items-center gap-0.5 text-emerald-400 font-bold">
                      <Battery className="w-3 h-3" /> 94%
                    </span>
                  </div>
                </div>

                {/* iOS Lockscreen Clock & Content */}
                <div className="relative z-10 text-center my-auto py-1">
                  <div className="text-[10px] font-medium text-slate-400 font-sans tracking-tight">
                    Неділя, 6 вересня
                  </div>
                  <div className="text-3xl font-black text-slate-100 tracking-tight font-sans leading-none my-0.5">
                    07:08
                  </div>

                  {/* iOS Live Activity Card (Siren UA) */}
                  <div className="mt-2 bg-slate-900/90 backdrop-blur-md rounded-2xl p-2 border border-rose-500/40 shadow-lg text-left">
                    <div className="flex items-center justify-between text-[8px] font-mono mb-1">
                      <span className="flex items-center gap-1 font-bold text-rose-400">
                        <Shield className="w-3 h-3 text-rose-500" />
                        <span>ПОВІТРЯНА ТРИВОГА</span>
                      </span>
                      <span className="text-[7px] bg-rose-500/20 text-rose-300 px-1 py-0.2 rounded font-bold border border-rose-500/30">
                        DND BYPASS
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-300">
                      <span className="truncate max-w-[95px] text-white font-bold">{regionName}</span>
                      <span className="font-black text-rose-400">ETA ~{etaMins} ХВ</span>
                    </div>

                    {/* Nearest Shelter Quick Access Route */}
                    <div className="mt-1 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[8px] font-mono text-emerald-400">
                      <span className="flex items-center gap-1 truncate max-w-[105px]">
                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">Укриття: {shelterDistance}м</span>
                      </span>
                      <span className="font-bold">{shelterWalkTime} хв</span>
                    </div>
                  </div>
                </div>

                {/* iOS Lockscreen Bottom Controls & Home Bar */}
                <div className="relative z-10 pt-1">
                  <div className="flex items-center justify-between px-3 mb-1.5">
                    <div className="w-7 h-7 rounded-full bg-slate-900/90 border border-slate-700/80 flex items-center justify-center text-slate-300 shadow-md">
                      <Flashlight className="w-3.5 h-3.5" />
                    </div>
                    <div className="w-7 h-7 rounded-full bg-slate-900/90 border border-slate-700/80 flex items-center justify-center text-slate-300 shadow-md">
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  
                  {/* White Pill Home Indicator */}
                  <div className="w-16 h-1 bg-slate-300/80 mx-auto rounded-full shadow-sm" />
                </div>

              </div>
            </div>

          </div>
        </div>
      );

    // =========================================================================
    // 2. WATCH - Rugged Titanium Smart Watch (Cushion Case, Knurled Crown, Alpine Loop, Wayfinder)
    // =========================================================================
    case 'watch':
      return (
        <div 
          onClick={onClick}
          className={`cursor-pointer select-none transition-all duration-300 transform-gpu group ${
            isDimmed ? 'opacity-25 scale-90' : isSelected ? 'scale-110 ring-2 ring-rose-400/90' : 'opacity-100 hover:scale-105'
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Top Woven Ribbed Orange Alpine Loop Strap curving backward in 3D */}
          <div 
            className="w-22 h-5 bg-gradient-to-r from-orange-700 via-orange-500 to-orange-700 rounded-t-xl mx-auto border-t border-orange-400 shadow-lg flex items-center justify-center relative overflow-hidden"
            style={{ transform: 'rotateX(22deg) translateZ(-6px)', transformOrigin: 'bottom center' }}
          >
            <div className="absolute inset-0 opacity-25 bg-[repeating-linear-gradient(90deg,transparent,transparent_4px,#fff_4px,#fff_6px)]" />
            <div className="w-10 h-0.5 bg-orange-200/90 rounded-full z-10 shadow-sm" />
          </div>

          {/* Rugged Grade 5 Titanium Cushion Case (Layered 3D Depth) */}
          <div 
            className="relative w-44 sm:w-48 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 rounded-[2.5rem] p-3 border-2 border-slate-400/80 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(244,63,94,0.2)]"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Left International Orange Action Button + Precision Speaker Holes */}
            <div 
              className="absolute -left-2.5 top-9 w-2.5 h-8 bg-orange-500 rounded-l-md shadow-md border-l border-orange-400 flex flex-col justify-around py-1 items-center"
              style={{ transform: 'translateZ(2px)' }}
            >
              <div className="w-0.5 h-1.5 bg-orange-800 rounded-full" />
              <div className="w-0.5 h-1.5 bg-orange-800 rounded-full" />
            </div>

            {/* Right Titanium Guard with 3D Knurled Digital Crown & Flush Side Button */}
            <div 
              className="absolute -right-3 top-7 w-3.5 h-9 bg-gradient-to-b from-slate-400 via-orange-500 to-slate-400 rounded-r-md border border-slate-300 shadow-md flex items-center justify-center"
              style={{ transform: 'translateZ(4px)' }}
            >
              <div className="w-1.5 h-5 bg-slate-900 rounded-full flex flex-col justify-around py-0.5">
                <div className="w-full h-0.5 bg-orange-400" />
                <div className="w-full h-0.5 bg-orange-400" />
              </div>
            </div>
            <div className="absolute -right-2 top-18 w-2 h-5 bg-slate-600 rounded-r-sm shadow-sm" />

            {/* Flat Sapphire Crystal Face with Wayfinder Circular Radar Watchface */}
            <div 
              className="w-34 h-38 mx-auto rounded-[1.9rem] bg-black border-2 border-slate-800 p-2 flex flex-col items-center justify-between text-center font-mono shadow-inner relative overflow-hidden"
              style={{ transform: 'translateZ(8px)' }}
            >
              {/* Compass 360° Ring Tick Lines */}
              <div className="absolute inset-1.5 rounded-[1.7rem] border border-dashed border-slate-800 pointer-events-none opacity-60" />

              {/* Wayfinder Header: Location & Compass Degree */}
              <div className="relative z-10 w-full flex items-center justify-between text-[7px] text-slate-400 px-1 pt-0.5">
                <span className="text-amber-400 font-bold">315° NW</span>
                <span className="text-slate-300 truncate max-w-[55px]">{regionName}</span>
              </div>

              {/* Central Complication: Countdown Alarm Dial */}
              <div className="relative z-10 my-auto flex flex-col items-center justify-center">
                <div className={`w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center p-1 transition-all ${
                  isAlarm 
                    ? 'border-rose-500 bg-rose-950/70 shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse'
                    : 'border-cyan-500/80 bg-slate-900 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                }`}>
                  <span className="text-[7px] font-black tracking-widest text-rose-300 uppercase">
                    {isAlarm ? 'ТРИВОГА' : 'РАДАР'}
                  </span>
                  <span className="text-2xl font-black text-white leading-none my-0.5 tracking-tight font-mono">
                    {etaMins}m
                  </span>
                  <span className="text-[6px] text-slate-300 font-bold">
                    ETA ПІДЛЬОТУ
                  </span>
                </div>
              </div>

              {/* Bottom Complications: Haptic Pulse & Shelter Compass */}
              <div className="relative z-10 w-full flex items-center justify-between text-[7px] px-0.5 pb-0.5">
                <span className="flex items-center gap-0.5 text-emerald-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-800">
                  <Activity className="w-2 h-2 animate-pulse" />
                  <span>8ms</span>
                </span>
                <span className="flex items-center gap-0.5 text-cyan-300 font-bold bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-800">
                  <Navigation className="w-2 h-2 text-cyan-400" />
                  <span>{shelterDistance}м</span>
                </span>
              </div>

            </div>
          </div>

          {/* Bottom Woven Ribbed Orange Alpine Loop Strap with Titanium G-Hook */}
          <div 
            className="w-22 h-5 bg-gradient-to-r from-orange-700 via-orange-500 to-orange-700 rounded-b-xl mx-auto border-b border-orange-400 shadow-lg flex items-center justify-center relative overflow-hidden"
            style={{ transform: 'rotateX(-22deg) translateZ(-6px)', transformOrigin: 'top center' }}
          >
            <div className="absolute inset-0 opacity-25 bg-[repeating-linear-gradient(90deg,transparent,transparent_4px,#fff_4px,#fff_6px)]" />
            <div className="w-8 h-1 bg-slate-300 rounded-sm border border-slate-500 z-10 shadow-sm" />
          </div>
        </div>
      );

    // =========================================================================
    // 3. LAPTOP - 16" Pro Tactical Clamshell (105° Open Angle, Base Deck, Notch, Magic Keyboard)
    // =========================================================================
    case 'laptop':
      return (
        <div 
          onClick={onClick}
          className={`cursor-pointer select-none transition-all duration-300 transform-gpu group ${
            isDimmed ? 'opacity-25 scale-90' : isSelected ? 'scale-110 ring-2 ring-blue-400/90' : 'opacity-100 hover:scale-105'
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Upper Display Lid (Liquid Retina XDR standing up at 105° relative angle) */}
          <div 
            className="relative w-64 sm:w-72 bg-slate-950 rounded-t-2xl p-2 border-2 border-slate-700 shadow-2xl"
            style={{ transform: 'rotateX(-12deg) translateZ(8px)', transformOrigin: 'bottom center' }}
          >
            {/* macOS Menu Bar & Camera Notch */}
            <div className="flex items-center justify-between px-2 pb-1 border-b border-slate-800 text-[8px] font-mono bg-slate-900/90 rounded-t-lg">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <span className="text-slate-100 font-bold"></span>
                <span className="text-white font-bold">SirenUA Pro</span>
                <span className="text-slate-500 text-[7px]">Розвідка</span>
              </div>

              {/* Physical Camera Notch with Green Activity Indicator */}
              <div className="w-10 h-2 bg-black rounded-b-md mx-auto flex items-center justify-center gap-1 border-b border-slate-800 shadow-sm -mt-1">
                <div className="w-1 h-1 rounded-full bg-slate-700" />
                <div className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
              </div>

              <div className="flex items-center gap-1.5 text-[7px] text-slate-400">
                <span className="text-emerald-400 font-bold">100% КЕШ</span>
                <span className="text-slate-200">07:08</span>
              </div>
            </div>

            {/* Tactical Recon Screen with macOS Window UI */}
            <div className="bg-slate-900/95 rounded-lg p-2 mt-1 border border-slate-800 min-h-[110px] flex flex-col justify-between text-[8px] font-mono shadow-inner">
              
              {/* Window Controls: Red, Yellow, Green Dots */}
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-rose-500 shadow-sm" />
                  <div className="w-2 h-2 rounded-full bg-amber-500 shadow-sm" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
                </div>
                <span className="text-[7px] text-cyan-300 font-bold">SECTOR INTEL · MULTI-TARGET</span>
              </div>

              {/* Split Content: Threat Telemetry & Air Defense Readiness */}
              <div className="grid grid-cols-2 gap-1.5 my-1 text-[7px]">
                <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 block">ЦІЛЬ:</span>
                  <span className="text-amber-400 font-bold block truncate">{primaryThreatName}</span>
                  <span className="text-slate-300 block">Вектор: 315° NW</span>
                  <span className="text-rose-400 font-bold block">ETA: {etaMins} хв</span>
                </div>
                <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                  <span className="text-slate-400 block">РЕГІОН:</span>
                  <span className="text-white font-bold block truncate">{regionName}</span>
                  <span className="text-emerald-400 block font-bold">Купол ППО: 100%</span>
                  <span className="text-cyan-300 block">Сховище: {shelterDistance}м</span>
                </div>
              </div>

              {/* macOS Bottom Dock Strip */}
              <div className="flex items-center justify-center gap-2 pt-1 border-t border-slate-800/80">
                <div className="w-4 h-4 rounded bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-[7px] text-cyan-300">🗺️</div>
                <div className="w-4 h-4 rounded bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-[7px] text-rose-300">🚨</div>
                <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[7px] text-emerald-300">🛡️</div>
                <div className="w-4 h-4 rounded bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-[7px] text-purple-300">📡</div>
              </div>

            </div>
          </div>

          {/* Central Cylindrical Display Hinge */}
          <div className="w-44 h-1.5 bg-gradient-to-r from-slate-700 via-slate-500 to-slate-700 mx-auto rounded-full shadow-inner" />

          {/* Lower Unibody Keyboard Base laying horizontally in 3D Perspective */}
          <div 
            className="w-68 sm:w-76 bg-gradient-to-b from-slate-800 via-slate-850 to-slate-900 rounded-b-xl border-t-2 border-slate-600 px-3 py-2 shadow-2xl flex items-center justify-between"
            style={{ transform: 'rotateX(60deg) translateZ(-10px)', transformOrigin: 'top center' }}
          >
            {/* Left Perforated Speaker Grille & USB-C Ports */}
            <div className="w-4 h-9 bg-slate-950/90 rounded-sm border border-slate-700/60 flex flex-col justify-around p-0.5">
              <div className="w-full h-0.5 bg-slate-700 rounded-full" />
              <div className="w-full h-0.5 bg-slate-700 rounded-full" />
              <div className="w-full h-0.5 bg-slate-700 rounded-full" />
            </div>

            {/* Backlit Magic Keyboard Deck with Recessed Well */}
            <div className="w-44 h-9 bg-slate-950 rounded-md border border-slate-700 p-1 flex flex-col justify-between shadow-inner">
              <div className="flex justify-between px-1">
                <span className="w-4 h-1.5 bg-slate-800 rounded-sm shadow-sm" />
                <span className="w-4 h-1.5 bg-slate-800 rounded-sm shadow-sm" />
                <span className="w-4 h-1.5 bg-slate-800 rounded-sm shadow-sm" />
                <span className="w-4 h-1.5 bg-slate-800 rounded-sm shadow-sm" />
                <span className="w-4 h-1.5 bg-slate-800 rounded-sm shadow-sm" />
              </div>
              <div className="flex justify-center">
                <span className="w-22 h-1.5 bg-slate-700 rounded-sm text-[5px] text-slate-400 text-center font-mono font-bold">SPACE</span>
              </div>
            </div>

            {/* Glass Force Touch Trackpad */}
            <div className="w-14 h-9 bg-slate-900/95 rounded-md border border-slate-600 shadow-inner" />

            {/* Right Perforated Speaker Grille */}
            <div className="w-4 h-9 bg-slate-950/90 rounded-sm border border-slate-700/60 flex flex-col justify-around p-0.5">
              <div className="w-full h-0.5 bg-slate-700 rounded-full" />
              <div className="w-full h-0.5 bg-slate-700 rounded-full" />
              <div className="w-full h-0.5 bg-slate-700 rounded-full" />
            </div>
          </div>
        </div>
      );

    // =========================================================================
    // 4. TABLET - 13" Ultra-Thin Tactical Slate (Apple Pencil Pro, Chamfered Edge, GIS Touch)
    // =========================================================================
    case 'tablet':
      return (
        <div 
          onClick={onClick}
          className={`cursor-pointer select-none transition-all duration-300 transform-gpu group ${
            isDimmed ? 'opacity-25 scale-90' : isSelected ? 'scale-110 ring-2 ring-purple-400/90' : 'opacity-100 hover:scale-105'
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Snapped Magnetic Apple Pencil with Induction Charging Indicator */}
          <div 
            className="w-38 h-2 bg-gradient-to-r from-slate-300 via-white to-slate-300 rounded-full mx-auto mb-1 border border-slate-400 shadow-md flex items-center justify-between px-2"
            style={{ transform: 'translateZ(10px)' }}
          >
            <span className="text-[5px] text-slate-800 font-bold font-mono"> Pencil Pro</span>
            <span className="text-[5px] text-emerald-600 font-bold font-mono">100% ⚡</span>
          </div>

          {/* iPad Pro Unibody Aluminum Slate (4.8mm Uniform Slim Profile) */}
          <div className="relative w-56 sm:w-64 bg-slate-950 rounded-2xl p-2 border-2 border-purple-500/70 shadow-[0_20px_50px_rgba(168,85,247,0.2)] backdrop-blur-xl">
            
            {/* iPadOS Status Bar with Ambient Light Sensor */}
            <div className="flex items-center justify-between px-2 pb-1 border-b border-slate-800 text-[8px] font-mono text-slate-400">
              <span className="font-bold text-purple-300">13" TACTICAL PAD</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[7px] bg-purple-950 text-purple-300 px-1 py-0.2 rounded font-bold border border-purple-800/60">
                  STAGE MANAGER
                </span>
                <span className="text-slate-200">07:08</span>
              </div>
            </div>

            {/* GIS Multi-Layer Touch Screen with 3D Elevation */}
            <div className="bg-slate-900/95 rounded-xl p-2 mt-1.5 border border-slate-800 min-h-[120px] flex flex-col justify-between text-[8px] font-mono shadow-inner">
              
              <div className="flex items-center justify-between text-white font-bold">
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-purple-400" />
                  <span>3D ШАРИ РОЗВІДКИ</span>
                </span>
                <span className="text-purple-300 text-[7px] bg-slate-950 px-1.5 py-0.5 rounded border border-purple-900">
                  PINCH & ZOOM 120Hz
                </span>
              </div>

              {/* Interactive Layer Switches */}
              <div className="grid grid-cols-2 gap-1.5 my-1 text-[7px]">
                <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800 space-y-0.5">
                  <div className="flex justify-between text-slate-300">
                    <span>1. Рельєф:</span>
                    <span className="text-emerald-400 font-bold">АКТИВНИЙ</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>2. Вектори:</span>
                    <span className="text-amber-400 font-bold">3D АЗИМУТ</span>
                  </div>
                </div>
                <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800 space-y-0.5">
                  <div className="flex justify-between text-slate-300">
                    <span>3. Радіус:</span>
                    <span className="text-cyan-400 font-bold">1.5 км ЗОНА</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>4. Сховища:</span>
                    <span className="text-emerald-400 font-bold">{shelterDistance}м</span>
                  </div>
                </div>
              </div>

              {/* Bottom Touch Latency Bar */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[7px] text-slate-400">
                <span>Тактильний відгук: 20ms</span>
                <span className="text-purple-300 font-bold">Multi-Touch Ready</span>
              </div>

            </div>
          </div>
        </div>
      );

    // =========================================================================
    // 5. DESKTOP - 34" Curved 21:9 Command Desktop (Optical Curvature, Articulated Arm)
    // =========================================================================
    case 'desktop':
      return (
        <div 
          onClick={onClick}
          className={`cursor-pointer select-none transition-all duration-300 transform-gpu group ${
            isDimmed ? 'opacity-25 scale-90' : isSelected ? 'scale-110 ring-2 ring-cyan-400/90' : 'opacity-100 hover:scale-105'
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* 34" Curved 21:9 Ultrawide Display Chassis with 3D Curvature Wings */}
          <div className="relative w-72 sm:w-84 md:w-92 bg-slate-950 rounded-2xl p-2 border-2 border-cyan-500/60 shadow-[0_25px_60px_rgba(6,182,212,0.2)] backdrop-blur-xl">
            
            {/* Top Curved Bezel */}
            <div className="flex items-center justify-between px-2 pb-1 border-b border-slate-800 text-[8px] font-mono">
              <span className="flex items-center gap-1 text-cyan-300 font-bold">
                <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                <span>34" CURVED 21:9 COMMAND DESKTOP</span>
              </span>
              <span className="text-cyan-400 font-bold bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/60 text-[7px]">
                144Hz · UWQHD 1500R
              </span>
            </div>

            {/* 3-Column Cockpit Screen Layout with Optical Curved Wings in 3D */}
            <div 
              className="bg-slate-900/95 rounded-xl p-2 mt-1.5 border border-slate-800 grid grid-cols-12 gap-1.5 text-[8px] font-mono min-h-[125px] shadow-inner"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Left Wing (Curved inward by 7deg) */}
              <div 
                className="col-span-7 bg-slate-950 p-2 rounded-lg border border-slate-800 flex flex-col justify-between"
                style={{ transform: 'rotateY(5deg)', transformOrigin: 'right center' }}
              >
                <div className="flex items-center justify-between text-[7px]">
                  <span className="text-slate-400">ЦІЛЬ:</span>
                  <span className="text-amber-400 font-bold">{primaryThreatName}</span>
                </div>
                <div className="text-[10px] text-slate-100 font-black leading-tight my-0.5">
                  Азимут 315° NW · 185 км/год
                </div>
                <div className="text-[7px] text-slate-400 flex justify-between">
                  <span>Висота: 450м</span>
                  <span className="text-rose-400 font-bold">ETA ~{etaMins} хв</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-gradient-to-r from-cyan-400 to-rose-500 h-full w-4/5 animate-pulse" />
                </div>
              </div>

              {/* Right Wing (Curved inward by -7deg) */}
              <div 
                className="col-span-5 bg-slate-950 p-2 rounded-lg border border-slate-800 flex flex-col justify-between"
                style={{ transform: 'rotateY(-5deg)', transformOrigin: 'left center' }}
              >
                <div>
                  <div className="text-[7px] text-slate-400">ТЕЛЕМЕТРІЯ:</div>
                  <div className="text-[12px] font-black text-cyan-300 leading-none my-0.5">24 ms</div>
                  <div className="text-[7px] text-emerald-400 font-bold">L3 Оверлей ON</div>
                </div>
                <div className="pt-1 border-t border-slate-800/80 text-[7px] text-slate-400 flex justify-between">
                  <span className="text-cyan-400 font-bold">[F1: МАКРО]</span>
                  <span>L4 Live</span>
                </div>
              </div>

            </div>

            {/* Underside Desk Ambient Light Strip */}
            <div className="w-3/4 h-0.5 bg-cyan-400/80 mx-auto mt-1 rounded-full shadow-[0_0_8px_#38bdf8]" />

            {/* Articulated Heavy Duty Counterbalanced Robotic Desk Arm Stand */}
            <div className="w-10 h-3.5 bg-gradient-to-b from-slate-600 to-slate-900 mx-auto rounded-t-sm border-t border-slate-500" />
            <div className="w-28 h-1.5 bg-gradient-to-r from-slate-700 via-slate-500 to-slate-700 mx-auto rounded-full border border-slate-400 shadow-lg" />
          </div>
        </div>
      );

    // =========================================================================
    // 6. SMART TV - 65" 4K OLED Ambient Wall Display (Ambilight, 16:9 Cinema, Soundbar)
    // =========================================================================
    case 'tv':
      return (
        <div 
          onClick={onClick}
          className={`cursor-pointer select-none transition-all duration-300 transform-gpu group ${
            isDimmed ? 'opacity-25 scale-90' : isSelected ? 'scale-110 ring-2 ring-emerald-400/90' : 'opacity-95 hover:scale-105'
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Wall-Casting Dynamic Ambilight Glow */}
          <div className={`absolute -inset-6 rounded-3xl blur-2xl transition-all duration-700 pointer-events-none ${
            isAlarm ? 'bg-rose-600/40 group-hover:bg-rose-600/60' : 'bg-cyan-500/30 group-hover:bg-cyan-500/45'
          }`} />

          {/* 65" TV Chassis with Ultra-Thin Titanium Bezel & Rear Electronics Block */}
          <div className="relative w-68 sm:w-76 md:w-84 bg-slate-950 rounded-xl p-1.5 border border-slate-700/80 shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-xl">
            
            {/* Top Thin Frame & Sensor */}
            <div className="flex items-center justify-between px-2 py-0.5 border-b border-slate-800 text-[8px] font-mono bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-t-lg">
              <span className="flex items-center gap-1.5 font-bold text-cyan-300">
                <Tv className="w-3 h-3 text-cyan-400" />
                <span>65" 4K OLED TV</span>
              </span>
              <span className="text-emerald-400 font-bold text-[7px]">4K HDR · 120Hz</span>
            </div>

            {/* 16:9 OLED Situation Screen */}
            <div className="bg-slate-950 rounded-lg p-2.5 mt-1 border border-slate-800/90 min-h-[130px] flex flex-col justify-between relative overflow-hidden shadow-inner">
              
              {/* Top Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isAlarm ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
                  <span className="text-[10px] font-black font-mono text-white tracking-wide">
                    {partnerMode ? 'PARTNER WALL DISPLAY' : 'ЗАГАЛЬНОНАЦІОНАЛЬНИЙ МОНІТОРИНГ'}
                  </span>
                </div>
                <span className="text-[8px] font-mono text-cyan-300 font-bold bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/40">
                  25 ОБЛАСТЕЙ
                </span>
              </div>

              {/* National Stats Block */}
              <div className="my-1 bg-slate-900/90 rounded-md p-2 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[8px] text-slate-400 block font-mono">АКТИВНІ ТРИВОГИ:</span>
                  <span className={`text-base font-black font-mono leading-none ${isAlarm ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {threatModel.activeAlarmsCount} ОБЛАСТЕЙ
                  </span>
                  <span className="text-[7px] text-slate-400 block mt-0.5 font-mono">
                    Сектор: {regionName} ({isAlarm ? 'НЕБЕЗПЕКА' : 'НОРМА'})
                  </span>
                </div>

                {/* Voice Announcer Animated Spectrum Bar */}
                <div className="flex items-end gap-0.5 h-6 bg-slate-950 p-1 rounded border border-slate-800">
                  <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_1s_infinite] h-3" />
                  <span className="w-1 bg-cyan-300 rounded-full animate-[pulse_0.7s_infinite] h-5" />
                  <span className="w-1 bg-cyan-400 rounded-full animate-[pulse_1.2s_infinite] h-2" />
                  <span className="w-1 bg-emerald-400 rounded-full animate-[pulse_0.9s_infinite] h-4" />
                </div>
              </div>

              {/* Bottom Emergency News Ticker & Soundbar */}
              <div className="flex items-center justify-between text-[8px] font-mono text-slate-300 pt-1 border-t border-slate-800/80">
                <span className="flex items-center gap-1 text-slate-200">
                  <Volume2 className="w-2.5 h-2.5 text-cyan-400" />
                  <span>Голосовий диктор: ON</span>
                </span>
                <span className="text-emerald-400 font-bold">РЛС Купол: 100%</span>
              </div>

            </div>

            {/* Bottom Integrated Front-Firing Soundbar Mesh */}
            <div className="mt-1 h-1.5 bg-slate-850 rounded-sm border-t border-slate-700/60 flex items-center justify-center">
              <div className="w-24 h-0.5 bg-slate-700 rounded-full" />
            </div>

            {/* Dual Chrome Twin-Prong Feet Stand */}
            <div className="flex justify-between px-8 -mb-1 mt-0.5">
              <div className="w-6 h-1 bg-gradient-to-b from-slate-400 to-slate-700 rounded-sm shadow-md" />
              <div className="w-6 h-1 bg-gradient-to-b from-slate-400 to-slate-700 rounded-sm shadow-md" />
            </div>

          </div>
        </div>
      );

    // =========================================================================
    // 7. CAR - Automotive Infotainment Cockpit (Leather Shroud, Floating Screen, Detour)
    // =========================================================================
    case 'car':
      return (
        <div 
          onClick={onClick}
          className={`cursor-pointer select-none transition-all duration-300 transform-gpu group ${
            isDimmed ? 'opacity-25 scale-90' : isSelected ? 'scale-110 ring-2 ring-orange-400/90' : 'opacity-100 hover:scale-105'
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Cockpit Leather Dashboard Top Hood with Double Stitching Line */}
          <div 
            className="w-52 h-2.5 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-t-lg mx-auto border-t border-slate-600 shadow-md flex items-center justify-center relative"
            style={{ transform: 'translateZ(-4px)' }}
          >
            <div className="w-36 h-0.5 bg-slate-600 rounded-full" />
          </div>

          {/* 15" Automotive Floating Center Console Screen */}
          <div 
            className="relative w-60 sm:w-68 bg-slate-950 rounded-2xl p-2 border-2 border-orange-500/70 shadow-[0_20px_50px_rgba(249,115,22,0.25)] backdrop-blur-xl"
            style={{ transform: 'translateZ(6px)', transformStyle: 'preserve-3d' }}
          >
            {/* Top In-Car Cockpit Bar: Drive Gear, Speed, Speed Limit */}
            <div className="flex items-center justify-between px-1.5 pb-1 border-b border-slate-800 text-[8px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-orange-400 flex items-center gap-1">
                  <Car className="w-3 h-3" />
                  <span>CARPLAY</span>
                </span>
                <span className="text-slate-400">P R N <strong className="text-emerald-400 font-bold">D</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1 py-0.2 rounded-full border border-slate-600 text-slate-300 font-bold text-[7px]">90</span>
                <span className="text-white font-black">78 км/год</span>
              </div>
            </div>

            {/* Automotive Navigation & Detour Interface */}
            <div className="bg-slate-900/95 rounded-xl p-2 mt-1.5 border border-slate-800 min-h-[115px] flex flex-col justify-between text-[8px] font-mono shadow-inner">
              
              {/* Dynamic Detour Alert Banner */}
              <div className="flex items-center justify-between text-amber-300 font-bold">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>ДИНАМІЧНИЙ ОБ'ЇЗД</span>
                </span>
                <span className="text-rose-400 font-bold">ETA {etaMins} хв</span>
              </div>

              {/* Waypoint Instruction Text */}
              <div className="my-1 bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-[7px] text-slate-300 leading-tight">
                Шлях перераховано в обхід небезпечного сектору (азимут 315° NW).
              </div>

              {/* Roadside Shelter / Fuel Station Waypoint */}
              <div className="flex items-center justify-between bg-slate-950 p-1.5 rounded-lg text-[7px] text-emerald-400 font-bold border border-slate-800">
                <span className="flex items-center gap-1">
                  <Fuel className="w-3 h-3 text-emerald-400" />
                  <span>АЗС-Укриття (WOG):</span>
                </span>
                <span>1.8 км · 2 хв</span>
              </div>

              {/* Bottom Climate & Seat Bar */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[7px] text-slate-400">
                <span>AC: 21.5°C ♨</span>
                <span className="text-orange-400 font-bold">Emergency Audio Muted</span>
              </div>

            </div>

            {/* Bottom Dashboard AC Vent Strip & Steering Wheel Arc Hint */}
            <div className="w-3/4 h-1 bg-gradient-to-r from-slate-700 via-slate-500 to-slate-700 mx-auto mt-1 rounded-full" />
            <div className="w-20 h-1 border-b border-slate-600 rounded-full mx-auto mt-0.5 opacity-60" />
          </div>
        </div>
      );

    // =========================================================================
    // 8. AR/VR - Spatial Headset & HUD (Curved Laminated Visor, Solo Knit, Holographic 3D)
    // =========================================================================
    case 'ar_vr':
      return (
        <div 
          onClick={onClick}
          className={`cursor-pointer select-none transition-all duration-300 transform-gpu group ${
            isDimmed ? 'opacity-25 scale-90' : isSelected ? 'scale-110 ring-2 ring-sky-400/90' : 'opacity-100 hover:scale-105'
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Top Ribbed Solo Knit Headband Segment with Fit Adjustment Dial */}
          <div 
            className="w-38 h-3 bg-gradient-to-r from-slate-700 via-orange-600 to-slate-700 rounded-t-lg mx-auto border-t border-orange-500/80 shadow-md flex items-center justify-between px-2"
            style={{ transform: 'rotateX(20deg) translateZ(-6px)', transformOrigin: 'bottom center' }}
          >
            <div className="w-4 h-1 bg-slate-300 rounded-full" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-400 border border-slate-600" />
          </div>

          {/* 3D Curved Laminated Front Glass with Iridescent EyeSight Dark Shimmer */}
          <div 
            className="relative w-56 sm:w-64 bg-slate-950/90 rounded-[2.2rem] p-2 border-2 border-sky-500/70 shadow-[0_25px_60px_rgba(14,165,233,0.3)] backdrop-blur-2xl"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Top Digital Crown & Capture Button */}
            <div className="absolute -top-1.5 right-8 w-4 h-1.5 bg-slate-400 rounded-t-sm border border-slate-600 shadow-sm" />
            <div className="absolute -top-1.5 left-8 w-3 h-1.5 bg-slate-500 rounded-t-sm border border-slate-600 shadow-sm" />

            {/* Top Visor Header */}
            <div className="flex items-center justify-between px-2 pb-1 border-b border-slate-800 text-[8px] font-mono">
              <span className="flex items-center gap-1 text-sky-300 font-bold">
                <Glasses className="w-3.5 h-3.5 text-sky-400" />
                <span>SPATIAL VISOR</span>
              </span>
              <span className="text-sky-400 font-bold bg-sky-950 px-1.5 py-0.5 rounded border border-sky-800/60 text-[7px]">
                DUAL 4K MICRO-OLED
              </span>
            </div>

            {/* Translucent visionOS Spatial Window Projection Floating in 3D Space */}
            <div 
              className="bg-sky-950/40 rounded-2xl p-2 mt-1.5 border border-sky-500/40 min-h-[115px] flex flex-col justify-between text-[8px] font-mono text-sky-200 relative overflow-hidden shadow-inner"
              style={{ transform: 'translateZ(12px)' }}
            >
              {/* 3D Holographic Spinning Wireframe Ring */}
              <div className="absolute inset-0 flex items-center justify-center opacity-35 pointer-events-none">
                <div className="w-20 h-20 rounded-full border border-sky-400 animate-spin" />
              </div>

              {/* HUD Header */}
              <div className="relative z-10 flex justify-between items-center text-white font-bold">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-sky-400" />
                  <span>ГОЛОГРАМА 3D КУПОЛА</span>
                </span>
                <span className="text-emerald-300 text-[7px] bg-slate-950 px-1 rounded">12ms TRACK</span>
              </div>

              {/* Real Threat Altitude & Velocity Overlay */}
              <div className="relative z-10 my-1 bg-slate-950/90 p-1.5 rounded-lg text-[7px] space-y-0.5 border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Висота цілі:</span>
                  <span className="text-amber-300 font-bold font-mono">450m AGL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Швидкість:</span>
                  <span className="text-white font-bold font-mono">185 km/h</span>
                </div>
              </div>

              {/* Gaze & Micro-Gesture Indicator */}
              <div className="relative z-10 text-[7px] text-sky-300 flex justify-between pt-0.5 border-t border-sky-800/60">
                <span>Погляд + Pinch Gesture</span>
                <span className="text-emerald-400 font-bold">L4 Live</span>
              </div>

            </div>

            {/* Bottom Textile Light Seal Contour */}
            <div className="w-28 h-1 bg-slate-800 rounded-full mx-auto mt-1" />

          </div>
        </div>
      );

    // =========================================================================
    // 9. KIOSK - Public Safety Street Totem (IP65 Rugged Steel, 120dB Siren Beacon)
    // =========================================================================
    case 'kiosk':
      return (
        <div 
          onClick={onClick}
          className={`cursor-pointer select-none transition-all duration-300 transform-gpu group ${
            isDimmed ? 'opacity-25 scale-90' : isSelected ? 'scale-110 ring-2 ring-indigo-400/90' : 'opacity-100 hover:scale-105'
          }`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Top Physical Siren Beacon with Strobe Light */}
          <div className="w-14 h-5 bg-gradient-to-t from-slate-800 to-rose-600 rounded-t-xl mx-auto border-t-2 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.6)] flex items-center justify-center relative overflow-hidden animate-pulse">
            <div className="w-6 h-2 bg-yellow-300 rounded-full blur-[1px]" />
          </div>

          {/* Rugged IP65 Steel Column Frame */}
          <div className="relative w-52 sm:w-60 bg-slate-950 rounded-2xl p-2.5 border-4 border-slate-700 shadow-[0_25px_60px_rgba(0,0,0,0.95)] backdrop-blur-xl">
            
            {/* Caution Stripes Header */}
            <div className="h-2 rounded-t-md mb-1.5 overflow-hidden bg-[repeating-linear-gradient(45deg,#eab308,#eab308_10px,#1e293b_10px,#1e293b_20px)] border-b border-slate-700" />

            {/* Terminal Title */}
            <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-800 text-[8px] font-mono text-slate-300">
              <span className="font-bold text-indigo-300">МУНІЦИПАЛЬНИЙ ТЕРМІНАЛ</span>
              <span className="text-emerald-400 font-bold bg-slate-900 px-1 rounded">UPS: 48 ГОД</span>
            </div>

            {/* High Brightness Outdoor Screen */}
            <div className="bg-slate-900/95 rounded-xl p-2 mt-1.5 border border-slate-800 min-h-[120px] flex flex-col justify-between text-[8px] font-mono shadow-inner">
              
              <div className="flex items-center justify-between">
                <span className="font-black text-white text-[9px]">СХЕМА ЕВАКУАЦІЇ</span>
                <span className="text-[7px] text-rose-400 font-bold bg-rose-950 px-1.5 py-0.5 rounded border border-rose-800 animate-pulse">
                  СИРЕНА 120 dB
                </span>
              </div>

              {/* Nearest Public Shelter Direct Marker */}
              <div className="my-1 bg-slate-950 p-2 rounded-lg border border-slate-800 space-y-1">
                <div className="flex justify-between items-center text-[7px] text-slate-400">
                  <span>НАЙБЛИЖЧЕ СХОВИЩЕ:</span>
                  <span className="text-emerald-400 font-bold">120м (2 хв)</span>
                </div>
                <div className="text-white font-bold text-[8px]">
                  Станція метро / Підземний перехід (Вхід B)
                </div>
                <div className="text-[7px] text-slate-400">
                  Всі гермодвері відчинено автоматично.
                </div>
              </div>

              {/* Emergency Physical Call Button Widget */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[7px]">
                <span className="text-slate-400">Зв'язок з ДСНС: 101/112</span>
                <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-black text-[7px] shadow-sm">
                  [SOS КНОПКА]
                </span>
              </div>

            </div>

            {/* Bottom Speaker Grille Slots for 120dB Outdoor Horn */}
            <div className="mt-2 flex justify-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            </div>

            {/* Heavy Base Anchor Foot */}
            <div className="w-36 h-2 bg-gradient-to-b from-slate-700 to-slate-900 mx-auto mt-1 rounded-sm border-t border-slate-600 shadow-md" />
          </div>
        </div>
      );

    default:
      return null;
  }
};
