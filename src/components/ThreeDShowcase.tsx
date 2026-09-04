import React, { useState, useRef, useEffect } from 'react';
import { 
  Smartphone, Tablet, Monitor, Laptop, Shield, Radio, Navigation, 
  MapPin, Clock, AlertTriangle, Layers, RotateCw, Sparkles,
  ChevronRight, Database, Bell, Check, Flame, Crosshair,
  TrendingUp, Users, DollarSign, CreditCard, Activity, Play,
  Square, QrCode, ArrowUpRight, Copy, Share2, Volume2, VolumeX,
  Compass, Zap, WifiOff
} from 'lucide-react';
import { tacticalAudio } from '../utils/audioTactical';
import { SpatialDataMode } from '../data/spatialModel';

export type ShowcaseMode = 'ECOSYSTEM' | 'DESKTOP' | 'LAPTOP' | 'PHONE' | 'TABLET' | 'HOLOGRAM';

interface ThreeDShowcaseProps {
  onNavigateToDownload: () => void;
  onNavigateToMap: () => void;
  onNavigateToPartner?: () => void;
  dataMode: SpatialDataMode;
}

const SpatialUnavailableShowcase: React.FC<{ dataMode: SpatialDataMode }> = ({ dataMode }) => (
  <section className="device-constellation-preview" aria-label="3D-вітрина пристроїв SIREN UA">
    <div className="device-constellation-preview__grid" aria-hidden="true" />
    <div className="device-constellation-preview__intro">
      <div className="device-constellation-preview__eyebrow"><Database className="h-3.5 w-3.5 text-cyan-300" /> SIREN SPATIAL ECOSYSTEM</div>
      <h2>Одна просторова система.<br /><span>Кожен пристрій — свій погляд.</span></h2>
      <p>Тут живе 3D-візуальна мова SIREN UA: desktop бачить масштаб, планшет працює шарами, смартфон дає персональну відповідь.</p>
      <div className="device-constellation-preview__state"><span /> {dataMode === 'NOT_CONNECTED' ? 'DESIGN PREVIEW · LIVE DATA NOT CONNECTED' : 'DESIGN PREVIEW · LIVE SOURCE UNAVAILABLE'}</div>
    </div>
    <div className="device-constellation" aria-label="Візуальна демонстрація desktop, tablet та smartphone">
      <div className="constellation-device constellation-device--desktop"><div className="constellation-device__bezel"><div className="constellation-screen"><PreviewScreen label="DESKTOP · SPATIAL COMMAND" wide /><div className="preview-map preview-map--wide"><span className="preview-map__core" /><span className="preview-map__line preview-map__line--one" /><span className="preview-map__line preview-map__line--two" /><i className="preview-map__node preview-map__node--one" /><i className="preview-map__node preview-map__node--two" /><div className="preview-map__planes"><span /><span /><span /></div></div><div className="preview-screen__rail"><span /><span /><span /></div></div></div><div className="constellation-device__stand" /></div>
      <div className="constellation-device constellation-device--tablet"><div className="constellation-device__bezel"><div className="constellation-screen"><PreviewScreen label="TABLET · TOUCH SPATIAL" /><div className="preview-map"><span className="preview-map__core" /><span className="preview-map__line preview-map__line--one" /><i className="preview-map__node preview-map__node--one" /><div className="preview-map__planes"><span /><span /><span /></div></div><div className="preview-screen__chips"><span>ШАРИ</span><span>ФОКУС</span><span>ЧАС</span></div></div></div></div>
      <div className="constellation-device constellation-device--phone"><div className="constellation-device__bezel"><div className="constellation-screen"><PreviewScreen label="PHONE · PERSONAL SAFETY" /><div className="preview-map"><span className="preview-map__core" /><span className="preview-map__line preview-map__line--two" /><div className="preview-map__planes"><span /><span /><span /></div></div><div className="preview-screen__status"><span /> MY REGION · PERSONAL VIEW</div></div></div></div>
    </div>
    <div className="device-constellation-preview__footer"><span><Monitor className="h-4 w-4" /> Desktop</span><span><Tablet className="h-4 w-4" /> Tablet</span><span><Smartphone className="h-4 w-4" /> Smartphone</span><span className="device-constellation-preview__footer-state"><WifiOff className="h-3.5 w-3.5" /> Без фальшивих live-даних</span></div>
  </section>
);

const PreviewScreen: React.FC<{ label: string; wide?: boolean }> = ({ label, wide }) => <div className={`preview-screen__header ${wide ? 'preview-screen__header--wide' : ''}`}><span className="preview-screen__logo">✦ SIREN <b>UA</b></span><span>{label}</span><span className="preview-screen__signal" /></div>;

export const ThreeDShowcase: React.FC<ThreeDShowcaseProps> = ({
  onNavigateToDownload,
  onNavigateToMap,
  onNavigateToPartner,
  dataMode,
}) => {
  const [activeMode, setActiveMode] = useState<ShowcaseMode>('ECOSYSTEM');
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(false);
  const [isSirenPlaying, setIsSirenPlaying] = useState<boolean>(false);
  const [activeLayer, setActiveLayer] = useState<number | null>(null);

  // Desktop interactive filters
  const [selectedThreatFilter, setSelectedThreatFilter] = useState<'ALL' | 'MISSILE' | 'SHAHED' | 'AVIATION' | 'ARTILLERY'>('ALL');
  const [timelineIndex, setTimelineIndex] = useState<number>(4); // 0: 18:20, 1: 18:24, 2: 18:28, 3: 18:32, 4: Зараз
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [payoutModalOpen, setPayoutModalOpen] = useState<boolean>(false);
  const [payoutAmount, setPayoutAmount] = useState<string>('4230');
  const [payoutSuccess, setPayoutSuccess] = useState<boolean>(false);

  // Parallax 3D mouse tracking
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep hook order stable when the API changes from unavailable to demo/live.
  // The unavailable surface is a render state, not a different component lifecycle.
  if (dataMode !== 'DEMO_DATA') return <SpatialUnavailableShowcase dataMode={dataMode} />;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || isAutoRotate) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    if (!isAutoRotate) {
      setMousePos({ x: 0, y: 0 });
    }
  };

  const toggleSirenAudio = () => {
    const isPlaying = tacticalAudio.toggleSirenTest();
    setIsSirenPlaying(isPlaying);
  };

  const triggerRadarPing = () => {
    tacticalAudio.playRadarPing();
  };

  const handleCopyPartnerLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText('https://siren.ua/ref/SRN-125678');
    setCopiedLink(true);
    tacticalAudio.playAllClearChime();
    setTimeout(() => setCopiedLink(false), 2400);
  };

  const handleSimulatePayout = () => {
    setPayoutSuccess(true);
    tacticalAudio.playAllClearChime();
    setTimeout(() => {
      setPayoutSuccess(false);
      setPayoutModalOpen(false);
    }, 2000);
  };

  // Base angles for isometric perspective
  const rotX = activeMode === 'ECOSYSTEM' ? 14 - mousePos.y * 14 : (activeMode === 'HOLOGRAM' ? 58 - mousePos.y * 22 : 8 - mousePos.y * 12);
  const rotY = activeMode === 'ECOSYSTEM' ? mousePos.x * 16 : (activeMode === 'HOLOGRAM' ? 10 + mousePos.x * 24 : mousePos.x * 12);
  const rotZ = activeMode === 'HOLOGRAM' ? -32 - mousePos.x * 12 : 0;

  // Timeline events matching the reference image:
  const timelineEvents = [
    { time: '18:20', region: 'Харківська обл.', event: 'Ракетна загроза', color: 'text-rose-400', bg: 'bg-rose-500' },
    { time: '18:24', region: 'Сумська обл.', event: 'Шахеди в повітрі', color: 'text-amber-400', bg: 'bg-amber-500' },
    { time: '18:28', region: 'Дніпропетровська обл.', event: 'Відбій тривоги', color: 'text-emerald-400', bg: 'bg-emerald-500' },
    { time: '18:32', region: 'Київська обл.', event: 'Пуск ракет', color: 'text-rose-500', bg: 'bg-rose-600' },
    { time: 'Зараз', region: 'Вся Україна', event: 'Високий ризик (14 цілей)', color: 'text-cyan-400', bg: 'bg-cyan-500' }
  ];

  return (
    <div className="relative w-full max-w-7xl mx-auto my-8">
      
      {/* Top 3D Ecosystem & Mode Selector Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 px-2">
        
        {/* Mode Switcher Tabs matching the full suite */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/95 border border-slate-800 backdrop-blur-xl shadow-2xl overflow-x-auto max-w-full">
          
          <button
            onClick={() => { setActiveMode('ECOSYSTEM'); triggerRadarPing(); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeMode === 'ECOSYSTEM'
                ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 scale-102'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" />
            <span>🌟 Вся 3D Екосистема</span>
          </button>

          <button
            onClick={() => { setActiveMode('DESKTOP'); triggerRadarPing(); }}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeMode === 'DESKTOP'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30 scale-102'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Телевізор</span>
          </button>

          <button
            onClick={() => { setActiveMode('LAPTOP'); triggerRadarPing(); }}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeMode === 'LAPTOP'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30 scale-102'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Комп’ютер</span>
          </button>

          <button
            onClick={() => { setActiveMode('PHONE'); triggerRadarPing(); }}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeMode === 'PHONE'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30 scale-102'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Смартфон</span>
          </button>

          <button
            onClick={() => { setActiveMode('TABLET'); triggerRadarPing(); }}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeMode === 'TABLET'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30 scale-102'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Tablet className="w-4 h-4" />
            <span>Планшет</span>
          </button>

          <button
            onClick={() => { setActiveMode('HOLOGRAM'); triggerRadarPing(); }}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeMode === 'HOLOGRAM'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30 scale-102'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>5-Шарова Голограма</span>
          </button>

        </div>

        {/* Tactical Controls: Siren Test, 3D Rotate, Ping */}
        <div className="flex items-center gap-2.5">
          
          {/* Siren Audio Test Button */}
          <button
            onClick={toggleSirenAudio}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
              isSirenPlaying
                ? 'bg-rose-600/90 border-rose-400 text-white shadow-lg shadow-rose-600/40 animate-pulse'
                : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-rose-500/50 hover:text-rose-300'
            }`}
            title="Тестувати звук повітряної тривоги"
          >
            {isSirenPlaying ? (
              <>
                <VolumeX className="w-4 h-4 text-white animate-spin" />
                <span>Зупинити сирену</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-rose-400" />
                <span>🔊 Тест сирени</span>
              </>
            )}
          </button>

          {/* Sonar Ping Sound Button */}
          <button
            onClick={triggerRadarPing}
            className="p-2 rounded-xl border border-slate-700 bg-slate-900/90 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-950/40 transition-all"
            title="Звук сканування радара"
          >
            <Radio className="w-4 h-4" />
          </button>

          {/* 360 Rotation Toggle */}
          <button
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            className={`p-2 rounded-xl border text-xs transition-all ${
              isAutoRotate 
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20' 
                : 'bg-slate-900/90 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="360° Автообертання"
          >
            <RotateCw className={`w-4 h-4 ${isAutoRotate ? 'animate-spin' : ''}`} />
          </button>

          {activeMode === 'HOLOGRAM' && (
            <button
              onClick={() => setIsExploded(!isExploded)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isExploded 
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20' 
                  : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-slate-600'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isExploded ? 'Зібрати' : '💥 3D Вибух'}</span>
            </button>
          )}

        </div>

      </div>

      {/* Main 3D Interactive Canvas Box */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="showcase-canvas relative w-full min-h-[640px] sm:min-h-[720px] lg:min-h-[780px] rounded-3xl bg-gradient-to-b from-[#060911] via-[#080d1a] to-[#04060a] border border-cyan-500/20 shadow-[0_0_90px_rgba(0,180,255,0.12)] overflow-hidden flex items-center justify-center p-3 sm:p-6 select-none perspective-[1600px]"
      >
        
        {/* Ambient Grid Floor & Radial Lighting */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(0,180,255,0.14),transparent_65%)] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0e1a2f_1px,transparent_1px),linear-gradient(to_bottom,#0e1a2f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-35 pointer-events-none"></div>
        <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full border border-amber-400/25 bg-slate-950/75 px-3 py-1.5 text-[10px] font-mono tracking-[0.16em] text-amber-200/80 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          DEMO DATA · VISUAL TARGET
        </div>

        {/* Ambient Floating Laser Beams & Particles */}
        <div className="absolute top-10 left-12 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_15px_#00d4ff] animate-ping opacity-70"></div>
        <div className="absolute bottom-16 right-16 w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_20px_#f43f5e] animate-ping opacity-80"></div>
        <div className="absolute top-1/2 right-8 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_12px_#fbbf24] animate-pulse"></div>

        {/* A spatial signal constellation gives the showcase its own visual language. */}
        <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-70" viewBox="0 0 1200 720" fill="none" aria-hidden="true">
          <ellipse cx="600" cy="360" rx="420" ry="190" stroke="rgba(41,217,255,0.18)" strokeDasharray="4 14" />
          <ellipse cx="600" cy="360" rx="285" ry="135" stroke="rgba(129,140,248,0.16)" strokeDasharray="2 12" transform="rotate(-18 600 360)" />
          <path d="M120 470 C330 240 450 530 620 350 S920 180 1080 370" stroke="rgba(41,217,255,0.3)" strokeWidth="1" strokeDasharray="5 11" className="animate-dash-flow" />
          <g className="animate-signal-orbit">
            <circle cx="178" cy="384" r="5" fill="#29d9ff" />
            <circle cx="178" cy="384" r="16" stroke="#29d9ff" strokeOpacity=".28" />
            <circle cx="1000" cy="298" r="5" fill="#fbbf24" />
            <circle cx="1000" cy="298" r="16" stroke="#fbbf24" strokeOpacity=".28" />
            <circle cx="770" cy="570" r="5" fill="#34d399" />
            <circle cx="770" cy="570" r="16" stroke="#34d399" strokeOpacity=".28" />
          </g>
        </svg>

        {/* Central 3D Scene Root */}
        <div
          className={`relative w-full h-full flex items-center justify-center preserve-3d transition-transform duration-300 ease-out ${
            isAutoRotate ? 'animate-[spin_24s_linear_infinite]' : ''
          }`}
          style={{
            transform: isAutoRotate 
              ? 'rotateX(20deg) rotateZ(0deg)' 
              : `rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`
          }}
        >

          {/* ========================================================================= */}
          {/* MODE 1: THE COMPLETE 4-DEVICE 3D ECOSYSTEM (Exact Match to Image 1 & 2)     */}
          {/* ========================================================================= */}
          {(activeMode === 'ECOSYSTEM' || activeMode === 'DESKTOP') && (
            <div className="relative w-full max-w-5xl flex items-center justify-center preserve-3d">
              
              {/* 1. LARGE TELEVISION / SITUATIONAL DISPLAY (Center Back) */}
              <div
                className={`relative w-[340px] sm:w-[620px] lg:w-[820px] rounded-3xl p-3 sm:p-4 bg-gradient-to-b from-slate-700 via-slate-900 to-black border-2 sm:border-[3px] border-slate-600/90 shadow-[0_30px_90px_rgba(0,0,0,0.95),0_0_60px_rgba(0,212,255,0.25)] preserve-3d transition-all duration-500 ${
                  activeMode === 'DESKTOP' ? 'scale-105 sm:scale-110 z-40' : 'z-10'
                }`}
                style={{
                  transform: activeMode === 'ECOSYSTEM'
                    ? 'translateZ(0px) translateY(-40px)'
                    : 'translateZ(100px) translateY(0px)'
                }}
              >
                {/* Desktop Display Bezel & High-Tech Screen Content */}
                <div className="relative w-full rounded-2xl bg-[#060a12] border border-slate-800 overflow-hidden text-white font-['Plus_Jakarta_Sans'] shadow-inner p-3 sm:p-5 flex flex-col justify-between min-h-[380px] sm:min-h-[460px]">
                  
                  {/* Monitor Top Navigation Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_12px_rgba(0,212,255,0.4)]">
                        <Shield className="w-4 h-4 text-cyan-400" />
                      </div>
                      <span className="font-extrabold text-sm tracking-tight text-white">
                        SIREN <span className="text-cyan-400">UA</span>
                      </span>
                    </div>

                    {/* Nav Links */}
                    <div className="hidden md:flex items-center gap-5 text-xs font-semibold text-slate-300">
                      <span className="text-cyan-400 border-b-2 border-cyan-400 pb-0.5 cursor-pointer">Карта</span>
                      <span className="hover:text-white cursor-pointer" onClick={onNavigateToMap}>Загрози</span>
                      <span className="hover:text-white cursor-pointer" onClick={onNavigateToMap}>Аналітика</span>
                      <span className="hover:text-white cursor-pointer">Новини</span>
                      <span className="hover:text-white cursor-pointer" onClick={onNavigateToPartner}>Партнерам</span>
                      <span className="hover:text-white cursor-pointer">Блог</span>
                    </div>

                    {/* User Profile Pill */}
                    <div 
                      onClick={onNavigateToPartner}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs cursor-pointer hover:border-cyan-400 transition-colors"
                    >
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                        А
                      </div>
                      <span className="text-slate-200 font-medium hidden sm:inline">Мій кабінет</span>
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    </div>
                  </div>

                  {/* Main Desktop Screen Body: Map + Floating Telemetry Widgets */}
                  <div className="relative flex-1 my-3 flex flex-col justify-between">
                    
                    {/* Background SVG Radar Map of Ukraine with Live Threat Nodes */}
                    <div className="relative w-full h-[220px] sm:h-[260px] flex items-center justify-center overflow-hidden rounded-2xl bg-[#040810]/70 border border-slate-800/70">
                      
                      <svg viewBox="0 0 700 380" className="w-full h-full object-contain">
                        {/* Ukraine Territorial Contour */}
                        <path
                          d="M70,120 Q140,80 260,90 T430,85 T590,100 Q650,160 620,240 T500,280 T360,300 T220,280 Q110,270 70,200 Z"
                          fill="none"
                          stroke="#1e293b"
                          strokeWidth="3"
                          strokeDasharray="5 3"
                        />

                        {/* Dnipro River */}
                        <path
                          d="M300,90 Q360,170 350,220 T390,290"
                          fill="none"
                          stroke="#0ea5e9"
                          strokeWidth="2"
                          opacity="0.4"
                        />

                        {/* City Hotspots matching user image (Kyiv, Lviv, Kharkiv, etc.) */}
                        {/* Kyiv */}
                        <circle cx="330" cy="140" r="5" fill="#f43f5e" className="animate-ping" />
                        <circle cx="330" cy="140" r="3" fill="#ffffff" />
                        <text x="338" y="144" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="sans-serif">Київ</text>

                        {/* Lviv */}
                        <circle cx="140" cy="160" r="4" fill="#38bdf8" />
                        <text x="148" y="164" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">Львів</text>

                        {/* Kharkiv */}
                        <circle cx="490" cy="160" r="5" fill="#f43f5e" className="animate-pulse" />
                        <text x="498" y="164" fill="#fca5a5" fontSize="10" fontWeight="bold" fontFamily="sans-serif">Харків</text>

                        {/* Chernihiv */}
                        <circle cx="370" cy="100" r="4" fill="#fbbf24" />
                        <text x="378" y="104" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">Чернігів</text>

                        {/* Sumy */}
                        <circle cx="450" cy="120" r="4" fill="#f43f5e" />
                        <text x="458" y="124" fill="#fca5a5" fontSize="9" fontFamily="sans-serif">Суми</text>

                        {/* Poltava */}
                        <circle cx="440" cy="180" r="4" fill="#fbbf24" />
                        <text x="448" y="184" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">Полтава</text>

                        {/* Dnipro */}
                        <circle cx="440" cy="220" r="5" fill="#f43f5e" />
                        <text x="448" y="224" fill="#fca5a5" fontSize="10" fontFamily="sans-serif">Дніпро</text>

                        {/* Zaporizhzhia */}
                        <circle cx="450" cy="250" r="4" fill="#f43f5e" />
                        <text x="458" y="254" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">Запоріжжя</text>

                        {/* Odesa */}
                        <circle cx="340" cy="290" r="4" fill="#38bdf8" />
                        <text x="348" y="294" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">Одеса</text>

                        {/* Dynamic Threat Flight Paths */}
                        {(selectedThreatFilter === 'ALL' || selectedThreatFilter === 'MISSILE') && (
                          <path
                            d="M620,180 Q480,150 330,140"
                            fill="none"
                            stroke="#f43f5e"
                            strokeWidth="3.5"
                            strokeDasharray="6 4"
                            className="animate-dash-flow"
                          />
                        )}

                        {(selectedThreatFilter === 'ALL' || selectedThreatFilter === 'SHAHED') && (
                          <path
                            d="M480,120 Q420,130 330,140"
                            fill="none"
                            stroke="#fbbf24"
                            strokeWidth="2.5"
                            strokeDasharray="4 4"
                            className="animate-dash-flow"
                          />
                        )}

                        {/* Concentric Radar Pulse around Kyiv */}
                        <circle cx="330" cy="140" r="30" fill="none" stroke="#00d4ff" strokeWidth="1" strokeDasharray="3 2" className="animate-ping opacity-40" />
                        <circle cx="330" cy="140" r="60" fill="none" stroke="#00d4ff" strokeWidth="0.8" opacity="0.3" />
                      </svg>

                      {/* Right-Hand Tactical Float Telemetry Card on Monitor (as in user's image) */}
                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-44 sm:w-56 p-2.5 sm:p-3 rounded-2xl bg-slate-950/90 border border-slate-800 backdrop-blur-md text-[10px] space-y-2.5 shadow-2xl">
                        
                        {/* Current Status Header */}
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="text-slate-400 font-medium">Поточна ситуація</span>
                          <span className="text-[9px] font-mono text-cyan-400">18:34:21</span>
                        </div>

                        {/* Whole Ukraine Threat Level */}
                        <div className="flex items-center justify-between p-1.5 rounded-xl bg-rose-950/40 border border-rose-500/30">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                            <span className="text-rose-300 font-bold">Вся Україна</span>
                          </div>
                          <span className="text-rose-400 font-bold font-mono">Високий ризик</span>
                        </div>

                        {/* Active Targets Metric with Mini Sparkline */}
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-slate-400 block text-[9px]">Активні цілі</span>
                            <span className="text-sm font-extrabold text-white font-mono">14</span>
                            <span className="text-[8px] text-rose-400 ml-1 font-mono">+3 за 15 хв</span>
                          </div>
                          {/* Mini Sparkline SVG */}
                          <svg className="w-16 h-6" viewBox="0 0 60 20">
                            <path d="M0,15 L15,12 L30,14 L45,6 L60,4" fill="none" stroke="#f43f5e" strokeWidth="2" />
                          </svg>
                        </div>

                        {/* Threat Directions Count */}
                        <div className="flex items-center justify-between border-t border-slate-800 pt-1.5">
                          <span className="text-slate-400">Напрямки загроз:</span>
                          <span className="text-cyan-400 font-bold font-mono flex items-center gap-0.5">
                            7 ↗ ↖
                          </span>
                        </div>

                        {/* Estimated Time to User Region with Animated Progress */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[9px]">
                            <span className="text-slate-400">Очікуваний час:</span>
                            <span className="text-amber-400 font-bold font-mono">21 хв до Києва</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-cyan-400 to-rose-500 w-3/5 animate-pulse"></div>
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* Threat Filter Category Buttons Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-800/80">
                      
                      {/* Filter Pills */}
                      <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] font-bold">
                        <button
                          onClick={() => { setSelectedThreatFilter('ALL'); triggerRadarPing(); }}
                          className={`px-3 py-1.5 rounded-xl transition-all ${
                            selectedThreatFilter === 'ALL'
                              ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-md shadow-cyan-500/30'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Всі загрози
                        </button>
                        <button
                          onClick={() => { setSelectedThreatFilter('MISSILE'); triggerRadarPing(); }}
                          className={`px-3 py-1.5 rounded-xl transition-all ${
                            selectedThreatFilter === 'MISSILE'
                              ? 'bg-rose-500 text-white font-extrabold shadow-md shadow-rose-500/30'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Ракети
                        </button>
                        <button
                          onClick={() => { setSelectedThreatFilter('SHAHED'); triggerRadarPing(); }}
                          className={`px-3 py-1.5 rounded-xl transition-all ${
                            selectedThreatFilter === 'SHAHED'
                              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md shadow-amber-500/30'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Шахеди
                        </button>
                        <button
                          onClick={() => { setSelectedThreatFilter('AVIATION'); triggerRadarPing(); }}
                          className={`px-3 py-1.5 rounded-xl transition-all ${
                            selectedThreatFilter === 'AVIATION'
                              ? 'bg-indigo-500 text-white font-extrabold shadow-md shadow-indigo-500/30'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Авіація
                        </button>
                        <button
                          onClick={() => { setSelectedThreatFilter('ARTILLERY'); triggerRadarPing(); }}
                          className={`px-3 py-1.5 rounded-xl transition-all ${
                            selectedThreatFilter === 'ARTILLERY'
                              ? 'bg-purple-500 text-white font-extrabold shadow-md shadow-purple-500/30'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Артилерія
                        </button>
                      </div>

                    </div>

                    {/* Chronological Timeline Scrubber Bar (as in reference image: Останні події 18:20 -> 18:34) */}
                    <div className="mt-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[9px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-slate-400 font-mono font-bold">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Останні події:</span>
                      </div>

                      {/* Interactive Chronology Dots */}
                      <div className="flex-1 flex items-center justify-between gap-1 w-full overflow-x-auto">
                        {timelineEvents.map((evt, idx) => (
                          <div
                            key={idx}
                            onClick={() => { setTimelineIndex(idx); triggerRadarPing(); }}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer transition-all ${
                              timelineIndex === idx
                                ? 'bg-slate-800 border border-cyan-400/50 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${evt.bg} ${timelineIndex === idx ? 'animate-ping' : ''}`}></span>
                            <span className="font-mono font-bold">{evt.time}</span>
                            <span className={`hidden md:inline ${evt.color}`}>{evt.region} {evt.event}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>

                {/* Stand for television display */}
                <div className="w-32 h-14 mx-auto bg-gradient-to-b from-slate-700 to-slate-900 border-x border-b border-slate-600 rounded-b-2xl shadow-2xl"></div>
                <div className="w-52 h-3 mx-auto bg-slate-800 rounded-full border border-slate-600 shadow-xl"></div>
              </div>

              {/* 2. FLOATING 3D PARTNER CARD ON RIGHT OF MONITOR (Exact match to Image 1) */}
              <div
                onClick={onNavigateToPartner}
                className="absolute -top-10 -right-4 sm:-right-8 lg:-right-16 w-60 sm:w-72 p-4 rounded-3xl bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-blue-950/80 border border-blue-500/40 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(59,130,246,0.3)] preserve-3d cursor-pointer hover:border-cyan-400 transition-all z-30 hidden lg:block"
                style={{
                  transform: 'translateZ(140px) rotateY(-18deg) rotateX(10deg)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                    Партнерська програма
                  </span>
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                </div>
                <p className="text-[10px] text-slate-300 mb-3">
                  Рекомендуй SirenUA та отримуй винагороду з кожного реферала
                </p>

                {/* 3D Holographic Avatar Graphic Placeholder */}
                <div className="w-full h-20 rounded-2xl bg-gradient-to-t from-blue-950/60 to-slate-900 border border-blue-500/30 flex items-center justify-center relative overflow-hidden mb-3">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,212,255,0.25),transparent_70%)]"></div>
                  <Users className="w-8 h-8 text-cyan-400 animate-bounce" />
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); onNavigateToPartner && onNavigateToPartner(); }}
                  className="w-full py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/30 flex items-center justify-center gap-1.5 mb-3"
                >
                  <span>Стати партнером</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 block text-[8px]">Ваш дохід</span>
                    <span className="font-bold text-emerald-400 text-xs">12,450 ₴</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 block text-[8px]">Рефералів</span>
                    <span className="font-bold text-cyan-300 text-xs">247</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 block text-[8px]">Очікує виплати</span>
                    <span className="font-bold text-amber-300">4,230 ₴</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 block text-[8px]">Виплачено</span>
                    <span className="font-bold text-white">23,780 ₴</span>
                  </div>
                </div>
              </div>

              {/* 3. TABLET ON THE LEFT FOREGROUND */}
              <div
                onClick={() => setActiveMode('TABLET')}
                className="absolute -bottom-16 sm:-bottom-20 -left-6 sm:-left-12 lg:-left-24 w-[210px] sm:w-[270px] lg:w-[310px] rounded-3xl p-2.5 sm:p-3 bg-gradient-to-br from-slate-700 via-slate-900 to-black border-2 border-slate-600 shadow-[0_30px_70px_rgba(0,0,0,0.9),0_0_40px_rgba(0,212,255,0.25)] preserve-3d cursor-pointer hover:scale-102 transition-all z-30"
                style={{
                  transform: 'translateZ(180px) rotateY(18deg) rotateX(12deg)'
                }}
              >
                <div className="w-full h-full rounded-2xl bg-[#060a12] border border-slate-800 p-3 flex flex-col justify-between text-white font-['Plus_Jakarta_Sans'] text-[10px]">
                  
                  {/* Tablet Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-bold text-white text-[11px]">SIREN UA</span>
                    </div>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                      АКТИВНО
                    </span>
                  </div>

                  {/* Tablet Region Hazard List */}
                  <div className="my-2 space-y-1.5 flex-1">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      Ситуація в Україні на зараз
                    </div>

                    <div className="p-1.5 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                        <span className="font-bold text-white">Київ та область</span>
                      </div>
                      <span className="text-rose-400 font-mono font-bold text-[9px]">Високий ризик</span>
                    </div>

                    <div className="p-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span className="font-bold text-white">Харківська обл.</span>
                      </div>
                      <span className="text-amber-400 font-mono text-[9px]">Підвищений</span>
                    </div>

                    <div className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="text-slate-300">Львівська обл.</span>
                      </div>
                      <span className="text-emerald-400 font-mono text-[9px]">Низький</span>
                    </div>

                    <div className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="text-slate-300">Одеська обл.</span>
                      </div>
                      <span className="text-emerald-400 font-mono text-[9px]">Низький</span>
                    </div>
                  </div>

                  {/* Tablet Bottom Metrics */}
                  <div className="grid grid-cols-4 gap-1 pt-2 border-t border-slate-800 text-center font-mono">
                    <div className="p-1 rounded bg-slate-900">
                      <span className="text-[7px] text-slate-400 block">Загрози</span>
                      <span className="font-bold text-rose-400 text-[10px]">23</span>
                    </div>
                    <div className="p-1 rounded bg-slate-900">
                      <span className="text-[7px] text-slate-400 block">Сповіщ.</span>
                      <span className="font-bold text-cyan-400 text-[10px]">156</span>
                    </div>
                    <div className="p-1 rounded bg-slate-900">
                      <span className="text-[7px] text-slate-400 block">Областей</span>
                      <span className="font-bold text-white text-[10px]">18</span>
                    </div>
                    <div className="p-1 rounded bg-slate-900">
                      <span className="text-[7px] text-slate-400 block">Економія</span>
                      <span className="font-bold text-emerald-400 text-[10px]">48 хв</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* 4. SMARTPHONE IN FRONT CENTER */}
              <div
                onClick={() => setActiveMode('PHONE')}
                className="absolute -bottom-24 sm:-bottom-28 left-1/2 -translate-x-1/2 w-[160px] sm:w-[210px] h-[340px] sm:h-[420px] rounded-[40px] p-2 bg-gradient-to-br from-slate-700 via-slate-900 to-black border-[3px] border-slate-600 shadow-[0_35px_80px_rgba(0,0,0,0.95),0_0_50px_rgba(0,212,255,0.4)] preserve-3d cursor-pointer hover:scale-102 transition-all z-40"
                style={{
                  transform: 'translateZ(260px) rotateY(-4deg) rotateX(10deg)'
                }}
              >
                {/* Dynamic Island and Mobile Alert Screen */}
                <div className="w-full h-full rounded-[34px] bg-[#070b13] border border-slate-800 overflow-hidden flex flex-col justify-between text-white font-['Plus_Jakarta_Sans'] shadow-inner p-2.5">
                  
                  {/* Status Bar + Dynamic Island */}
                  <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 pt-1 px-2">
                    <span>18:34</span>
                    <div className="w-14 h-3.5 rounded-full bg-black border border-slate-800 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1 animate-pulse"></span>
                      <span className="text-[7px] text-slate-300 font-bold">SIREN</span>
                    </div>
                    <span>5G 100%</span>
                  </div>

                  {/* Primary Threat Alert Card inside Phone */}
                  <div className="p-2 rounded-2xl bg-gradient-to-r from-rose-950/80 to-slate-900 border border-rose-500/40 my-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                        <span className="text-[9px] font-bold text-white">Тривога у вашому регіоні</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[8px] text-rose-300 font-mono mt-1">
                      <span>Високий ризик</span>
                      <span className="font-bold">⏱ 21 хв</span>
                    </div>
                  </div>

                  {/* Mini Radar Map inside Phone */}
                  <div className="flex-1 rounded-2xl bg-[#040810] border border-slate-800 relative overflow-hidden flex flex-col justify-between p-2">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(244,63,94,0.3),transparent_65%)]"></div>
                    
                    {/* Concentric Pulse */}
                    <div className="relative flex-1 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full border border-rose-500/40 animate-ping"></div>
                      <div className="absolute w-12 h-12 rounded-full border border-cyan-400/50"></div>
                      <Navigation className="w-5 h-5 text-rose-400 rotate-45" />
                    </div>

                    {/* Nearest Threat List inside Phone */}
                    <div className="space-y-1 relative z-10 text-[8px] font-mono">
                      <div className="p-1 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                        <span className="text-white">Київська обл. (Ракета)</span>
                        <span className="text-rose-400 font-bold">10–15 хв</span>
                      </div>
                      <div className="p-1 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                        <span className="text-white">Черкаська обл. (Шахеди)</span>
                        <span className="text-amber-400 font-bold">20–30 хв</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom App Nav */}
                  <div className="pt-1.5 flex items-center justify-around border-t border-slate-800 text-[8px] text-slate-400">
                    <div className="flex flex-col items-center text-cyan-400">
                      <Radio className="w-3 h-3" />
                      <span>Карта</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Flame className="w-3 h-3" />
                      <span>Загрози</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Shield className="w-3 h-3" />
                      <span>Кабінет</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Crosshair className="w-3 h-3" />
                      <span>Налашт.</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* 5. COMPUTER ON THE RIGHT FOREGROUND */}
              <div
                onClick={() => setActiveMode('LAPTOP')}
                className="absolute -bottom-20 sm:-bottom-24 -right-8 sm:-right-16 lg:-right-24 w-[240px] sm:w-[320px] lg:w-[370px] rounded-2xl p-2 sm:p-3 bg-gradient-to-b from-slate-700 via-slate-800 to-black border border-slate-600 shadow-[0_30px_70px_rgba(0,0,0,0.9),0_0_40px_rgba(59,130,246,0.25)] preserve-3d cursor-pointer hover:scale-102 transition-all z-30"
                style={{
                  transform: 'translateZ(180px) rotateY(-18deg) rotateX(12deg)'
                }}
              >
                {/* Computer display: Partner Command Desk */}
                <div className="w-full rounded-xl bg-[#060a12] border border-slate-800 p-2.5 sm:p-3 flex flex-col justify-between text-white font-['Plus_Jakarta_Sans'] text-[9px]">
                  
                  {/* Laptop Topbar */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-cyan-400" />
                      <span className="font-bold text-white text-[10px]">Панель управління</span>
                    </div>
                    <div className="flex items-center gap-1 text-[8px] text-slate-400">
                      <span>Андрій І. (SRN-125678)</span>
                    </div>
                  </div>

                  {/* Financial Stats 4-Pack */}
                  <div className="grid grid-cols-4 gap-1 my-2 text-center font-mono">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[7px] text-slate-400 block">Зароблено</span>
                      <span className="font-bold text-emerald-400 text-[9px]">56,780 ₴</span>
                      <span className="text-[6px] text-emerald-300 block">+18%</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[7px] text-slate-400 block">Цей місяць</span>
                      <span className="font-bold text-cyan-300 text-[9px]">12,450 ₴</span>
                      <span className="text-[6px] text-cyan-400 block">+24%</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[7px] text-slate-400 block">Доступно</span>
                      <span className="font-bold text-amber-300 text-[9px]">4,230 ₴</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[7px] text-slate-400 block">Рефералів</span>
                      <span className="font-bold text-white text-[9px]">247</span>
                    </div>
                  </div>

                  {/* Income Chart Preview */}
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 my-1">
                    <div className="flex items-center justify-between text-[8px] text-slate-400 mb-1">
                      <span>Дохід за період (Квітень 2026)</span>
                      <span className="text-cyan-400 font-mono">↗ +24%</span>
                    </div>
                    <svg className="w-full h-10" viewBox="0 0 200 40">
                      <path
                        d="M0,35 Q40,25 70,30 T130,15 T200,8"
                        fill="none"
                        stroke="#00d4ff"
                        strokeWidth="2"
                      />
                      <circle cx="200" cy="8" r="3" fill="#00d4ff" className="animate-ping" />
                    </svg>
                  </div>

                  {/* Top Sources & Payout Button */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[8px]">
                    <div className="text-slate-400">
                      Топ: <span className="text-cyan-300 font-mono">TikTok 42% • TG 25%</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPayoutModalOpen(true); }}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-sm transition-all"
                    >
                      Вивести кошти ↗
                    </button>
                  </div>

                </div>

                {/* Laptop Keyboard & Trackpad base */}
                <div className="w-full h-3 bg-gradient-to-b from-slate-800 to-slate-950 rounded-b-xl border-x border-b border-slate-700 mt-0.5"></div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* MODE 2: STANDALONE COMPUTER (Partner Desk)                                */}
          {/* ========================================================================= */}
          {activeMode === 'LAPTOP' && (
            <div className="relative w-full max-w-2xl p-4 rounded-3xl bg-slate-950/90 border border-blue-500/40 shadow-2xl backdrop-blur-xl text-white font-['Plus_Jakarta_Sans']">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-cyan-400" />
                  <span className="font-bold text-base">Комп’ютер: Панель управління партнера</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">
                    Ранг: GOLD (15%)
                  </span>
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 font-mono">
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Зароблено всього</span>
                  <span className="text-lg font-extrabold text-emerald-400">56,780 ₴</span>
                  <span className="text-[9px] text-emerald-300 block">+18% за місяць</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Цей місяць</span>
                  <span className="text-lg font-extrabold text-cyan-300">12,450 ₴</span>
                  <span className="text-[9px] text-cyan-400 block">+24% приріст</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Доступно до виплати</span>
                  <span className="text-lg font-extrabold text-amber-300">4,230 ₴</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Активних рефералів</span>
                  <span className="text-lg font-extrabold text-white">247</span>
                </div>
              </div>

              {/* Source Distribution Bars */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 mb-4 space-y-2 text-xs">
                <span className="font-bold text-slate-300 block mb-2">Джерела трафіку:</span>
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span>TikTok</span>
                    <span className="font-mono text-cyan-300 font-bold">42% (104 підписки)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-cyan-400 w-[42%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span>Telegram</span>
                    <span className="font-mono text-blue-300 font-bold">25% (62 підписки)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-blue-500 w-[25%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span>Instagram</span>
                    <span className="font-mono text-pink-300 font-bold">15% (37 підписок)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-pink-500 w-[15%]"></div>
                  </div>
                </div>
              </div>

              {/* Actions row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <button
                  onClick={handleCopyPartnerLink}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all"
                >
                  <Copy className="w-4 h-4 text-cyan-400" />
                  <span>{copiedLink ? 'Скопійовано! ✓' : 'Копіювати реф-лінк'}</span>
                </button>

                <button
                  onClick={() => setPayoutModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-blue-500/30 transition-all"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Вивести кошти на картку / IBAN</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODE 3: STANDALONE SMARTPHONE                                          */}
          {/* ========================================================================= */}
          {activeMode === 'PHONE' && (
            <div className="relative w-[280px] sm:w-[320px] h-[580px] sm:h-[640px] rounded-[50px] p-3 bg-gradient-to-br from-slate-700 via-slate-900 to-black border-[4px] border-slate-600 shadow-[0_30px_90px_rgba(0,0,0,0.95),0_0_50px_rgba(0,212,255,0.4)] preserve-3d">
              <div className="relative w-full h-full rounded-[42px] bg-[#070b13] border border-slate-800 p-4 flex flex-col justify-between text-white font-['Plus_Jakarta_Sans'] shadow-inner">
                {/* Dynamic Island */}
                <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>18:34</span>
                  <div className="w-20 h-5 rounded-full bg-black border border-slate-800 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-rose-500 mr-1.5 animate-pulse"></span>
                    <span className="text-[9px] text-white font-bold">SIREN UA</span>
                  </div>
                  <span>5G 100%</span>
                </div>

                {/* Threat Banner */}
                <div className="my-3 p-3 rounded-2xl bg-gradient-to-r from-rose-950/80 to-slate-900 border border-rose-500/50">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                    <span className="text-xs font-bold text-white">Тривога у вашому регіоні</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-rose-300">
                    <span>Рівень: Високий</span>
                    <span className="font-bold">⏱ 21 хв</span>
                  </div>
                </div>

                {/* Radar view inside smartphone */}
                <div className="flex-1 rounded-2xl bg-[#040810] border border-slate-800 relative overflow-hidden flex flex-col justify-between p-3">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(244,63,94,0.35),transparent_65%)]"></div>
                  
                  <div className="relative flex-1 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full border border-rose-500/40 animate-ping"></div>
                    <div className="absolute w-20 h-20 rounded-full border border-cyan-400/60"></div>
                    <Navigation className="w-8 h-8 text-rose-400 rotate-45" />
                  </div>

                  <div className="relative z-10 space-y-1.5 font-mono text-[9px]">
                    <div className="p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between">
                      <span>Київська обл. (Ракета)</span>
                      <span className="text-rose-400 font-bold">10–15 хв</span>
                    </div>
                    <div className="p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 flex justify-between">
                      <span>Черкаська обл. (Шахеди)</span>
                      <span className="text-amber-400 font-bold">20–30 хв</span>
                    </div>
                  </div>
                </div>

                {/* Phone Audio Trigger Button */}
                <button
                  onClick={toggleSirenAudio}
                  className={`mt-3 w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    isSirenPlaying
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <Volume2 className="w-4 h-4 text-rose-400" />
                  <span>{isSirenPlaying ? 'Зупинити сигнал' : 'Увімкнути сигнал тривоги'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODE 4: STANDALONE TABLET                                               */}
          {/* ========================================================================= */}
          {activeMode === 'TABLET' && (
            <div className="relative w-full max-w-2xl p-4 rounded-3xl bg-slate-950/90 border border-cyan-500/40 shadow-2xl backdrop-blur-xl text-white font-['Plus_Jakarta_Sans']">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Tablet className="w-5 h-5 text-cyan-400" />
                  <span className="font-bold text-base">Планшет: Регіональна матриця загроз</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold">
                  АКТИВНО 24/7
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">Київ та область</span>
                    <span className="text-xs font-mono font-bold text-rose-400">Високий ризик</span>
                  </div>
                  <p className="text-xs text-slate-300">Балістична загроза зі сходу. ETA: 10–15 хв.</p>
                </div>

                <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">Харківська область</span>
                    <span className="text-xs font-mono font-bold text-amber-400">Підвищений</span>
                  </div>
                  <p className="text-xs text-slate-300">Активність тактичної авіації над Бєлгородом.</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">Львівська область</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">Низький</span>
                  </div>
                  <p className="text-xs text-slate-300">Прямих загроз у повітряному просторі немає.</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">Одеська область</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">Низький</span>
                  </div>
                  <p className="text-xs text-slate-300">Чорноморська акваторія під радіолокаційним контролем.</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <span>Охоплення моніторингу: 18 областей</span>
                <span className="text-cyan-400 font-bold">Оновлення: 0.8 сек</span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODE 5: 5-LAYER HOLOGRAPHIC STACK (Exact match to Image 2)               */}
          {/* ========================================================================= */}
          {activeMode === 'HOLOGRAM' && (
            <div className="relative w-full max-w-xl h-[480px] flex items-center justify-center preserve-3d">
              
              {/* Pedestal Base */}
              <div 
                className="absolute w-[360px] h-[360px] rounded-3xl bg-slate-950/95 border-2 border-cyan-500/50 shadow-[0_0_60px_rgba(0,212,255,0.3)] preserve-3d"
                style={{ transform: 'translateZ(-70px)' }}
              >
                <div className="absolute inset-2 rounded-2xl border border-cyan-500/30 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border border-cyan-400/40 animate-ping"></div>
                </div>
              </div>

              {/* Layer 5 (Bottom): Джерела / База */}
              <div
                onClick={() => setActiveLayer(5)}
                className="absolute w-[320px] h-[320px] rounded-2xl bg-[#060c18]/95 border border-slate-700 p-4 preserve-3d cursor-pointer hover:border-cyan-400 transition-all shadow-xl"
                style={{ transform: `translateZ(${0 * (isExploded ? 70 : 35)}px)` }}
              >
                <div className="text-xs font-bold font-mono text-cyan-300 uppercase">Шар 5: Джерела та РЛС</div>
                <div className="text-[10px] text-slate-400 mt-1">Офіційна радіолокація, супутникові датчики, ППО</div>
              </div>

              {/* Layer 4: Укриття */}
              <div
                onClick={() => setActiveLayer(4)}
                className="absolute w-[320px] h-[320px] rounded-2xl bg-emerald-950/40 border border-emerald-500/50 p-4 preserve-3d cursor-pointer hover:border-emerald-400 transition-all shadow-xl"
                style={{ transform: `translateZ(${1 * (isExploded ? 70 : 35)}px)` }}
              >
                <div className="text-xs font-bold font-mono text-emerald-300 uppercase">Шар 4: Укриття поблизу</div>
                <div className="text-[10px] text-slate-400 mt-1">Найближче бомбосховище: 340 м (4 хв пішки)</div>
              </div>

              {/* Layer 3: Персональний Район */}
              <div
                onClick={() => setActiveLayer(3)}
                className="absolute w-[320px] h-[320px] rounded-2xl bg-cyan-950/40 border border-cyan-500/50 p-4 preserve-3d cursor-pointer hover:border-cyan-400 transition-all shadow-xl"
                style={{ transform: `translateZ(${2 * (isExploded ? 70 : 35)}px)` }}
              >
                <div className="text-xs font-bold font-mono text-cyan-300 uppercase">Шар 3: Твій район</div>
                <div className="text-[10px] text-slate-400 mt-1">Персоналізована геопозиція з радіусом 10 км</div>
              </div>

              {/* Layer 2: Рівні ризику */}
              <div
                onClick={() => setActiveLayer(2)}
                className="absolute w-[320px] h-[320px] rounded-2xl bg-amber-950/40 border border-amber-500/50 p-4 preserve-3d cursor-pointer hover:border-amber-400 transition-all shadow-xl"
                style={{ transform: `translateZ(${3 * (isExploded ? 70 : 35)}px)` }}
              >
                <div className="text-xs font-bold font-mono text-amber-300 uppercase">Шар 2: Рівні ризику</div>
                <div className="text-[10px] text-slate-400 mt-1">Червоний / Жовтий сектори диференціації небезпеки</div>
              </div>

              {/* Layer 1 (Top): Траєкторії */}
              <div
                onClick={() => setActiveLayer(1)}
                className="absolute w-[320px] h-[320px] rounded-2xl bg-rose-950/40 border-2 border-rose-500/70 p-4 preserve-3d cursor-pointer hover:border-rose-400 transition-all shadow-2xl"
                style={{ transform: `translateZ(${4 * (isExploded ? 70 : 35)}px)` }}
              >
                <div className="text-xs font-bold font-mono text-rose-300 uppercase">Шар 1: Прогнозні траєкторії</div>
                <div className="text-[10px] text-slate-400 mt-1">Векторні коридори, швидкість 185–780 км/год, ETA</div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Interactive Payout Simulation Modal */}
      {payoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-blue-500/40 shadow-2xl text-white font-['Plus_Jakarta_Sans']">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan-400" />
                <span className="font-bold text-base">Миттєва виплата винагороди</span>
              </div>
              <button
                onClick={() => setPayoutModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {payoutSuccess ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <div className="font-bold text-lg text-white">Виплату відправлено!</div>
                <div className="text-xs text-slate-400 font-mono">Кошти зараховано на ваш баланс.</div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Сума до виведення (₴):</label>
                  <input
                    type="text"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-sm focus:border-cyan-400 outline-none"
                  />
                  <span className="text-[10px] text-slate-500 font-mono block mt-1">Доступний залишок: 4,230 ₴</span>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Номер банківської картки або IBAN:</label>
                  <input
                    type="text"
                    defaultValue="UA213223130000026007233566731"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-cyan-400 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setPayoutModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                  >
                    Скасувати
                  </button>
                  <button
                    onClick={handleSimulatePayout}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-blue-500/30"
                  >
                    Підтвердити виведення 4,230 ₴
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
