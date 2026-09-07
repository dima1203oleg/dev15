import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  Radio, 
  MapPin, 
  Flame, 
  Zap, 
  Clock, 
  Layers, 
  ArrowRight, 
  QrCode, 
  Smartphone, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  Share2,
  Download,
  Activity,
  Compass,
  Eye,
  Sliders,
  Sparkles,
  DollarSign,
  TrendingUp,
  Award,
  Users,
  Percent,
  Coins,
  Wallet,
  Lock,
  Unlock,
  ArrowUpRight,
  CreditCard,
  Building2,
  Check,
  Copy,
  Monitor,
  Laptop,
  Tablet,
  Tv,
  Watch,
  Car,
  Glasses,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { RegionData, ThreatTrajectory, UserSettings } from '../types';
import { AFFILIATE_RANKS, calculateAffiliateEarnings, getRankByL1Count } from '../data/affiliateData';

interface DigitalTwinHeroProps {
  regions: RegionData[];
  trajectories: ThreatTrajectory[];
  settings: UserSettings;
  onOpenCockpit: () => void;
  onOpenMap: () => void;
  onOpenSimulator: () => void;
  onOpenShelters: () => void;
  onOpenSpecModal: () => void;
  onOpenAffiliate?: () => void;
  onOpenWebGL3D?: () => void;
}

type Hero3DMode = 'PRODUCT' | 'EARNINGS' | 'ECOSYSTEM';

export const DigitalTwinHero: React.FC<DigitalTwinHeroProps> = ({
  regions,
  trajectories,
  settings,
  onOpenCockpit,
  onOpenMap,
  onOpenSimulator,
  onOpenShelters,
  onOpenSpecModal,
  onOpenAffiliate,
  onOpenWebGL3D,
}) => {
  const [heroMode, setHeroMode] = useState<Hero3DMode>('PRODUCT');
  const [selectedGadgetId, setSelectedGadgetId] = useState<string>('PHONE');
  const [tilt, setTilt] = useState({ x: 12, y: -8 });
  const [isExploded, setIsExploded] = useState(false);
  const [hoveredLayer, setHoveredLayer] = useState<number | null>(null);

  // Quick 3D Earnings Simulator state inside the Hero
  const [heroL1Count, setHeroL1Count] = useState<number>(18);
  const [heroAvgL2, setHeroAvgL2] = useState<number>(3);
  const [heroSubPrice, setHeroSubPrice] = useState<number>(200);
  const [copiedHeroLink, setCopiedHeroLink] = useState(false);

  const earningsCalc = useMemo(() => {
    return calculateAffiliateEarnings(heroL1Count, heroAvgL2, heroSubPrice);
  }, [heroL1Count, heroAvgL2, heroSubPrice]);

  const alarmRegions = regions.filter((r) => r.isAlarm);
  const myRegionData = regions.find((r) => r.id === settings.myRegion) || regions[0];
  const primaryThreat = trajectories[0];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 22;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -22;
    setTilt({ x: 10 + y, y: -6 + x });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 12, y: -8 });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://sirenua.com/ref/partner_hero');
    setCopiedHeroLink(true);
    setTimeout(() => setCopiedHeroLink(false), 2500);
  };

  const GADGETS = [
    { id: 'DESKTOP', name: 'Desktop Command', icon: Monitor, tag: 'Raytracing Pro', accent: 'cyan' },
    { id: 'TABLET', name: 'iPad / Tablet', icon: Tablet, tag: 'Touch Gestures', accent: 'purple' },
    { id: 'PHONE', name: 'Smartphone', icon: Smartphone, tag: 'ETA Lockscreen', accent: 'amber' },
    { id: 'WATCH', name: 'Apple Watch', icon: Watch, tag: 'Haptic Radar', accent: 'rose' },
    { id: 'CARPLAY', name: 'Apple CarPlay', icon: Car, tag: 'Auto Rerouting', accent: 'emerald' },
    { id: 'GLASSES', name: 'Vision Pro AR', icon: Glasses, tag: 'Spatial Airspace', accent: 'sky' },
  ];

  return (
    <div className="relative mb-10 overflow-hidden rounded-3xl border border-cyan-500/25 bg-gradient-to-b from-slate-950 via-[#070e22] to-slate-950 p-5 sm:p-8 lg:p-10 shadow-2xl">
      
      {/* Background Cyber Grid & Radiant Glows */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            radial-gradient(circle at 80% 20%, rgba(56, 189, 248, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 20% 80%, rgba(245, 158, 11, 0.25) 0%, transparent 45%),
            linear-gradient(to right, rgba(56, 189, 248, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 36px 36px, 36px 36px',
        }}
      />

      {/* Top Banner: Triple Accent (Product + Real Earnings + Gadget Ecosystem) */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 via-sky-500/20 to-amber-500/20 border border-cyan-400/40 text-cyan-300 shadow-lg shadow-cyan-950">
            <Radio className="h-5 w-5 animate-pulse text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-black tracking-widest text-cyan-400">SIRENUA PRO</span>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                ПРОДУКТ + ПАРТНЕРСЬКИЙ ДОХІД L1/L2 + 9 ГАДЖЕТІВ
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Єдина національна платформа захисту, картка реального фінансового доходу та мультигаджетна екосистема
            </p>
          </div>
        </div>

        {/* Mode Selector Buttons (All 3 Clearly Visible) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800 font-mono text-xs flex-wrap">
          <button
            id="hero-tab-product"
            onClick={() => setHeroMode('PRODUCT')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              heroMode === 'PRODUCT'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Продукт (Радар + Фінанси)</span>
          </button>

          <button
            id="hero-tab-earnings"
            onClick={() => setHeroMode('EARNINGS')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              heroMode === 'EARNINGS'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-md shadow-amber-950 font-black'
                : 'text-amber-400 hover:text-amber-300 bg-amber-500/10'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Заробіток (L1/L2)</span>
          </button>

          <button
            id="hero-tab-ecosystem"
            onClick={() => setHeroMode('ECOSYSTEM')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              heroMode === 'ECOSYSTEM'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md shadow-purple-950 font-black'
                : 'text-purple-300 hover:text-purple-200 bg-purple-500/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Гаджети (Екосистема)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Pitch & Right Visualizer */}
      <div className="relative z-10 mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
        
        {/* Left Column: Product Value + Real Income Value + Gadgets Pitch (6 Cols) */}
        <div className="space-y-6 lg:col-span-6">
          
          {/* Dual/Triple Pill Tag */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <span>ДО 50% РОЯЛТІ (L1+L2)</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">
              <Radio className="h-3.5 w-3.5 text-cyan-400" />
              <span>ЦИФРОВИЙ ДВІЙНИК УКРАЇНИ</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-300">
              <Smartphone className="h-3.5 w-3.5 text-purple-400" />
              <span>9 ПРИСТРОЇВ</span>
            </div>
          </div>

          {/* Dynamic Main Title depending on selected mode */}
          <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight text-white leading-tight">
            {heroMode === 'EARNINGS' ? (
              <>
                Заробляйте на корисному:<br />
                <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 bg-clip-text text-transparent">
                  до 50% щомісяця
                </span><br />
                з партнерської мережі L1 & L2.
              </>
            ) : heroMode === 'ECOSYSTEM' ? (
              <>
                Один простір даних,<br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
                  9 адаптивних гаджетів
                </span><br />
                для кожної життєвої ситуації.
              </>
            ) : (
              <>
                Жива карта захисту,<br />
                <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-cyan-300 bg-clip-text text-transparent">
                  реальний фінансовий дохід
                </span><br />
                та безпека на будь-якому гаджеті.
              </>
            )}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
            {heroMode === 'EARNINGS' ? (
              <>
                Рекомендуйте життєво необхідний застосунок моніторингу повітряного простору. 
                Отримуйте до <strong>25% з першої лінії (L1)</strong> та до <strong>25% з другої лінії (L2)</strong> щомісячних платежів 
                з миттєвим виведенням на картку Monobank, Приват або USDT.
              </>
            ) : heroMode === 'ECOSYSTEM' ? (
              <>
                SirenUA миттєво підлаштовується під ваш пристрій: від настільного аналітичного штабу на 
                <strong> Desktop</strong> та жестового керування на <strong>iPad</strong> до персонального радара на 
                <strong> iPhone</strong>, вібрації на <strong>Apple Watch</strong> та безпечних маршрутів у <strong>CarPlay</strong>.
              </>
            ) : (
              <>
                SirenUA об’єднує передову карту загроз неба з точним часом підльоту (ETA), навігацією до укриттів 
                та <strong>прозорою партнерською карткою винагород</strong> з виплатами до 50% від підписок ваших користувачів.
              </>
            )}
          </p>

          {/* Key Metrics Quad Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/10 rounded-full blur-xl" />
              <span className="block font-mono text-lg sm:text-xl font-black text-amber-300">50% L1+L2</span>
              <span className="text-[11px] text-slate-400">Щомісячний дохід</span>
            </div>

            <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/90 p-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-12 h-12 bg-cyan-500/10 rounded-full blur-xl" />
              <span className="block font-mono text-lg sm:text-xl font-black text-cyan-300">DIGITAL TWIN</span>
              <span className="text-[11px] text-slate-400">Просторове небо</span>
            </div>

            <div className="rounded-2xl border border-rose-500/30 bg-slate-900/90 p-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-12 h-12 bg-rose-500/10 rounded-full blur-xl" />
              <span className="block font-mono text-lg sm:text-xl font-black text-rose-300">95% ETA</span>
              <span className="text-[11px] text-slate-400">Точність векторів</span>
            </div>

            <div className="rounded-2xl border border-purple-500/30 bg-slate-900/90 p-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-12 h-12 bg-purple-500/10 rounded-full blur-xl" />
              <span className="block font-mono text-lg sm:text-xl font-black text-purple-300">9 ПРИСТРОЇВ</span>
              <span className="text-[11px] text-slate-400">Кросплатформенно</span>
            </div>
          </div>

          {/* Interactive Gadget Selection Row in ECOSYSTEM mode */}
          {heroMode === 'ECOSYSTEM' && (
            <div className="space-y-2.5 pt-2">
              <span className="text-xs font-mono text-slate-400 block font-bold">
                ОБЕРІТЬ ПРИСТРІЙ ДЛЯ ПЕРЕГЛЯДУ:
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {GADGETS.map((g) => {
                  const IconComp = g.icon;
                  const isActive = selectedGadgetId === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGadgetId(g.id)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                        isActive
                          ? 'bg-purple-500/20 border-purple-400 text-purple-200 shadow-md shadow-purple-950 scale-105'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <IconComp className={`w-5 h-5 ${isActive ? 'text-purple-300' : 'text-slate-400'}`} />
                      <span className="text-[10px] font-bold text-center leading-tight truncate w-full">{g.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="hero-open-affiliate-calc-btn"
              onClick={onOpenAffiliate}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 hover:opacity-95 transition-all flex items-center gap-2 transform active:scale-95"
            >
              <Coins className="w-4 h-4 text-slate-950" />
              <span>ПАРТНЕРСЬКИЙ КАБІНЕТ (ДО 50%)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="hero-launch-cockpit-btn"
              onClick={onOpenCockpit}
              className="px-5 py-3.5 rounded-2xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold text-sm transition-all flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Радар Кокпіт</span>
            </button>

            {heroMode === 'ECOSYSTEM' && (
              <button
                onClick={() => {
                  const elem = document.getElementById('gadgets-ecosystem');
                  elem?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-3.5 rounded-2xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Всі 9 гаджетів ↓</span>
              </button>
            )}
          </div>

          {/* Trust & Payout channels badge */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
            <span className="font-mono text-slate-400">РЕАЛЬНІ ВИПЛАТИ:</span>
            <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-semibold flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-cyan-400" /> Monobank
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-semibold flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-emerald-400" /> Приват24
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-semibold flex items-center gap-1">
              <Building2 className="w-3 h-3 text-amber-400" /> IBAN (ФОП)
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-semibold flex items-center gap-1">
              <Wallet className="w-3 h-3 text-purple-400" /> USDT TRC-20
            </span>
          </div>

        </div>

        {/* Right Column: 3D Perspective Holographic Stage (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          
          {/* Controls Bar above Model */}
          <div className="w-full flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                {heroMode === 'EARNINGS' ? (
                  <>
                    <Coins className="h-4 w-4 text-amber-400 animate-pulse" />
                    <span className="text-amber-300">ПОТОКИ ПАРТНЕРСЬКОГО ПРИБУТКУ</span>
                  </>
                ) : heroMode === 'ECOSYSTEM' ? (
                  <>
                    <Smartphone className="h-4 w-4 text-purple-400 animate-pulse" />
                    <span className="text-purple-300">ПРИСТРІЙ: {GADGETS.find(g => g.id === selectedGadgetId)?.name.toUpperCase()}</span>
                  </>
                ) : (
                  <>
                    <Coins className="h-4 w-4 text-amber-400 animate-pulse" />
                    <span className="text-amber-300">НА ПЕРЕДНЬОМУ ПЛАНІ: ФІНАНСОВА КАРТКА L1/L2</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExploded(!isExploded)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isExploded
                    ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/30'
                    : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>{isExploded ? 'Згорнути шари' : 'Розгорнути шари'}</span>
              </button>
            </div>
          </div>

          {/* Interactive 3D Perspective Stage Container */}
          <div 
            className="relative w-full max-w-[480px] h-[500px] sm:h-[540px] perspective-1500 flex items-center justify-center select-none"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            
            {/* 3D Rotational Box */}
            <div 
              className="relative w-full h-full preserve-3d transition-transform duration-300 flex items-center justify-center"
              style={{
                transform: `rotateX(${tilt.x}deg) rotateZ(${tilt.y}deg)`,
              }}
            >
              
              {/* ============================================================ */}
              {/* DEFAULT / PRODUCT MODE: FINANCIAL CARD ON THE FRONT EDGE     */}
              {/* ============================================================ */}
              {heroMode === 'PRODUCT' && (
                <>
                  {/* FOREFRONT LAYER: THE SIGNATURE FINANCIAL PARTNER CARD */}
                  <div 
                    className={`absolute z-30 w-[360px] sm:w-[410px] h-[240px] rounded-2xl bg-gradient-to-br from-[#1a1204] via-slate-900 to-[#1e1505] border-2 border-amber-400/90 shadow-2xl shadow-amber-950/90 p-4 sm:p-5 flex flex-col justify-between transition-all duration-500 cursor-pointer ${
                      isExploded ? 'translate-y-[-160px] translate-z-[160px]' : 'translate-y-[-35px] translate-z-[90px]'
                    } ${hoveredLayer === 0 ? 'scale-105 border-amber-300 ring-4 ring-amber-400/40 shadow-amber-500/40' : ''}`}
                    onMouseEnter={() => setHoveredLayer(0)}
                    onMouseLeave={() => setHoveredLayer(null)}
                    onClick={onOpenAffiliate}
                  >
                    {/* Card Header with EMV Chip, Hologram & Status */}
                    <div className="flex items-center justify-between border-b border-amber-500/30 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        {/* Golden Smart Card Chip Representation */}
                        <div className="w-8 h-6 rounded bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 p-0.5 border border-amber-300 flex flex-col justify-around shadow-inner">
                          <div className="w-full h-0.5 bg-amber-800/40" />
                          <div className="w-full h-0.5 bg-amber-800/40" />
                        </div>
                        <div className="leading-tight">
                          <div className="flex items-center gap-1 text-[11px] font-mono font-black text-amber-300 tracking-wider">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>SIRENUA ROYALTY CARD</span>
                          </div>
                          <span className="text-[9px] text-amber-200/70 font-mono">L1 (25%) + L2 (25%) СИСТЕМА</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-200 font-mono text-[10px] font-black border border-amber-400/60 flex items-center gap-1 shadow-sm">
                          <Award className="w-3 h-3 text-amber-300" />
                          {earningsCalc.currentRank.name.toUpperCase()} (50%)
                        </span>
                      </div>
                    </div>

                    {/* Main Balance / Monthly Earnings Counter */}
                    <div className="my-auto py-1">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                            ЩОМІСЯЧНИЙ ПАСИВНИЙ ДОХІД
                          </span>
                          <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-400 font-mono tracking-tight">
                            {Math.round(earningsCalc.totalMonthlyIncome).toLocaleString()} ₴
                            <span className="text-sm font-normal text-slate-300"> / міс</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-emerald-400 font-bold block bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                            ≈ {(Math.round(earningsCalc.totalMonthlyIncome) / 41.5).toFixed(0)} USDT
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">Миттєве зарахування</span>
                        </div>
                      </div>

                      {/* Tier Distribution Dual Chip Strip */}
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-amber-500/20">
                        <div className="p-1.5 rounded-lg bg-amber-950/50 border border-amber-700/40 text-left">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-amber-300 font-bold">L1 ПРЯМІ ({earningsCalc.currentRank.l1Percent}%):</span>
                            <span className="text-slate-200 font-black">+{Math.round(earningsCalc.l1MonthlyIncome).toLocaleString()} ₴</span>
                          </div>
                          <span className="text-[9px] text-slate-400">{heroL1Count} активних підписників</span>
                        </div>

                        <div className="p-1.5 rounded-lg bg-emerald-950/50 border border-emerald-700/40 text-left">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-emerald-300 font-bold">L2 МЕРЕЖА ({earningsCalc.currentRank.l2Percent}%):</span>
                            <span className="text-slate-200 font-black">+{Math.round(earningsCalc.l2MonthlyIncome).toLocaleString()} ₴</span>
                          </div>
                          <span className="text-[9px] text-slate-400">{earningsCalc.totalL2Count} партнерів 2-ї лінії</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Payout Channels & Action CTA */}
                    <div className="flex items-center justify-between pt-2 border-t border-amber-500/20 text-[10px] font-mono text-slate-300">
                      <div className="flex items-center gap-1 text-amber-300">
                        <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                        <span>Monobank · Приват24 · USDT TRC-20</span>
                      </div>
                      <span className="text-amber-400 font-bold underline flex items-center gap-0.5">
                        Калькулятор <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>

                  {/* Layer 1: Trajectories & Threat Vectors (Just Behind Financial Card) */}
                  <div 
                    className={`absolute z-20 w-[360px] sm:w-[400px] h-[210px] rounded-2xl glass-panel-rose neon-edge-red p-4 flex flex-col justify-between transition-all duration-500 ${
                      isExploded ? 'translate-y-[-70px] translate-z-[80px]' : 'translate-y-[-10px] translate-z-[30px]'
                    } ${hoveredLayer === 1 ? 'scale-105 border-rose-400' : ''}`}
                    onMouseEnter={() => setHoveredLayer(1)}
                    onMouseLeave={() => setHoveredLayer(null)}
                  >
                    <div className="flex items-center justify-between border-b border-rose-500/30 pb-2">
                      <div className="flex items-center gap-2 text-rose-300 font-mono font-bold text-xs">
                        <Flame className="h-4 w-4 text-rose-400" />
                        <span>ШАР 1: ТРАЄКТОРІЇ ТА РАДАР</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-mono font-bold border border-rose-800">
                        LIVE ВЕКТОРИ
                      </span>
                    </div>

                    {/* Simulated Laser Arc */}
                    <div className="relative h-16 w-full overflow-hidden flex items-center justify-center">
                      <svg className="w-full h-full" viewBox="0 0 360 70">
                        <path
                          d="M 20,55 Q 180,10 340,25"
                          fill="none"
                          stroke="#f43f5e"
                          strokeWidth="3.5"
                          strokeDasharray="6 4"
                          className="animate-laser-dash"
                        />
                        <circle cx="340" cy="25" r="6" fill="#f43f5e" className="animate-ping" />
                        <circle cx="340" cy="25" r="4" fill="#ffffff" />
                      </svg>
                      <div className="absolute top-1 left-2 font-mono text-[10px] text-rose-200 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/80">
                        {primaryThreat?.name || 'БпЛА Shahed-136'} · {primaryThreat?.altitudeMeters || 450}м
                      </div>
                      <div className="absolute bottom-1 right-2 font-mono text-[10px] text-amber-300 bg-slate-900/90 px-2 py-0.5 rounded border border-amber-500/40">
                        ETA: {primaryThreat?.etaMinutes || 18} хв
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-rose-200/80 pt-1">
                      <span>Азимут: {primaryThreat?.azimuthDirection || '315° NW'}</span>
                      <span className="text-emerald-400 font-mono font-bold">● ППО на перехопленні</span>
                    </div>
                  </div>

                  {/* Layer 2: Risk Heatmap & Area Protection */}
                  <div 
                    className={`absolute z-10 w-[360px] sm:w-[400px] h-[200px] rounded-2xl glass-panel-cyan neon-edge-amber p-4 flex flex-col justify-between transition-all duration-500 ${
                      isExploded ? 'translate-y-[20px] translate-z-[0px]' : 'translate-y-[15px] translate-z-[-20px]'
                    } ${hoveredLayer === 2 ? 'scale-105 border-amber-400' : ''}`}
                    onMouseEnter={() => setHoveredLayer(2)}
                    onMouseLeave={() => setHoveredLayer(null)}
                  >
                    <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                      <div className="flex items-center gap-2 text-amber-300 font-mono font-bold text-xs">
                        <Activity className="h-4 w-4 text-amber-400" />
                        <span>ШАР 2: ТЕПЛОВА КАРТА РИЗИКУ (HEATMAP)</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono font-bold border border-amber-800">
                        4 РІВНІ
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 my-auto">
                      <div className="p-1.5 rounded-xl bg-emerald-950/60 border border-emerald-700/50 text-center">
                        <span className="block text-[10px] text-emerald-400 font-bold">СПОКІЙНО</span>
                        <span className="text-[9px] text-slate-400">0–5%</span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-yellow-950/60 border border-yellow-700/50 text-center">
                        <span className="block text-[10px] text-yellow-400 font-bold">УВАГА</span>
                        <span className="text-[9px] text-slate-400">10–30%</span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-amber-950/60 border border-amber-700/50 text-center">
                        <span className="block text-[10px] text-amber-400 font-bold">ПІДВИЩЕНИЙ</span>
                        <span className="text-[9px] text-slate-400">40–70%</span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-red-950/60 border border-red-700/50 text-center">
                        <span className="block text-[10px] text-red-400 font-bold">КРИТИЧНИЙ</span>
                        <span className="text-[9px] text-slate-400">80–100%</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-400">
                      <span>Областей у тривозі: <strong className="text-rose-400">{alarmRegions.length}</strong></span>
                      <span className="text-cyan-300 font-mono">Індекс небезпеки: 7.2 / 10</span>
                    </div>
                  </div>

                  {/* Layer 3: Shelters Navigation */}
                  <div 
                    className={`absolute w-[360px] sm:w-[400px] h-[190px] rounded-2xl glass-panel-cyan border border-emerald-500/30 p-3.5 flex flex-col justify-between transition-all duration-500 ${
                      isExploded ? 'translate-y-[110px] translate-z-[-70px]' : 'translate-y-[35px] translate-z-[-60px]'
                    } ${hoveredLayer === 4 ? 'scale-105 border-emerald-400' : ''}`}
                    onMouseEnter={() => setHoveredLayer(4)}
                    onMouseLeave={() => setHoveredLayer(null)}
                  >
                    <div className="flex items-center justify-between border-b border-emerald-500/30 pb-1.5">
                      <div className="flex items-center gap-2 text-emerald-300 font-mono font-bold text-xs">
                        <Shield className="h-4 w-4 text-emerald-400" />
                        <span>ШАР 3: НАЙБЛИЖЧІ УКРИТТЯ</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono font-bold border border-emerald-800">
                        НАВІГАЦІЯ
                      </span>
                    </div>

                    <div className="space-y-1 my-auto">
                      <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                        <span className="font-semibold text-slate-200">🚇 Метро «Золоті Ворота»</span>
                        <span className="text-emerald-300 font-mono font-bold">340м · 4 хв</span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                        <span className="font-semibold text-slate-200">🏢 Сховище ЦО №104</span>
                        <span className="text-cyan-300 font-mono font-bold">620м · 7 хв</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>Фільтри: Генератор, Wi-Fi</span>
                      <button onClick={onOpenShelters} className="text-emerald-400 hover:text-emerald-300 font-bold underline">
                        Маршрут →
                      </button>
                    </div>
                  </div>

                  {/* Base Pedestal (Нічна Базова Карта Рельєфу) */}
                  <div 
                    className={`absolute w-[380px] sm:w-[420px] h-[220px] rounded-3xl bg-slate-950 border-2 border-cyan-500/20 shadow-2xl p-4 flex flex-col justify-between transition-all duration-500 ${
                      isExploded ? 'translate-y-[200px] translate-z-[-140px]' : 'translate-y-[55px] translate-z-[-100px]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-500 border-b border-slate-800 pb-1.5">
                      <span>ШАР 0: БАЗОВА РЕЛЬЄФНА КАРТА ТА МІСТА</span>
                      <span>1:1 000 000</span>
                    </div>
                    <div className="flex items-center justify-center my-auto">
                      <div className="flex items-center gap-2 font-mono text-xs text-cyan-400/80">
                        <Compass className="h-4 w-4 text-cyan-400 animate-spin" />
                        <span>DIGITAL TWIN ОНОВЛЮЄТЬСЯ В РЕАЛЬНОМУ ЧАСІ</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>AES-256 SECURED</span>
                      <span>LATENCY: 120ms</span>
                    </div>
                  </div>
                </>
              )}

              {/* ============================================================ */}
              {/* MODE 2: REVENUE & AFFILIATE EXPANDED SIMULATOR               */}
              {/* ============================================================ */}
              {heroMode === 'EARNINGS' && (
                <>
                  {/* Layer 1 (Top): Live Monthly Royalty Cylinder */}
                  <div 
                    className={`absolute w-[360px] sm:w-[410px] h-[240px] rounded-2xl bg-gradient-to-br from-amber-950/90 via-slate-900/95 to-yellow-950/90 border-2 border-amber-400/80 shadow-2xl shadow-amber-950/80 p-4 sm:p-5 flex flex-col justify-between transition-all duration-500 ${
                      isExploded ? 'translate-y-[-140px] translate-z-[120px]' : 'translate-y-[-20px] translate-z-[50px]'
                    } ${hoveredLayer === 1 ? 'scale-105 border-amber-300 ring-2 ring-amber-400/40' : ''}`}
                    onMouseEnter={() => setHoveredLayer(1)}
                    onMouseLeave={() => setHoveredLayer(null)}
                  >
                    <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                      <div className="flex items-center gap-2 text-amber-300 font-mono font-bold text-xs">
                        <Award className="h-4 w-4 text-amber-400" />
                        <span>РАНГ: {earningsCalc.currentRank.name.toUpperCase()} (L1: {earningsCalc.currentRank.l1Percent}% · L2: {earningsCalc.currentRank.l2Percent}%)</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono font-bold border border-amber-800 animate-pulse">
                        ЩОМІСЯЧНО
                      </span>
                    </div>

                    <div className="my-auto text-center space-y-1">
                      <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest block">
                        ПРОГНОЗОВАНИЙ ПАСИВНИЙ ПРИБУТОК
                      </span>
                      <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-400 font-mono">
                        {Math.round(earningsCalc.totalMonthlyIncome).toLocaleString()} ₴<span className="text-sm font-normal text-slate-300">/міс</span>
                      </div>
                      <span className="text-xs text-emerald-400 font-mono font-bold block">
                        ≈ {(Math.round(earningsCalc.totalMonthlyIncome) / 41.5).toFixed(0)} USDT / міс (чистими)
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-300 font-mono pt-2 border-t border-amber-500/20">
                      <span>Мережа: <strong>{earningsCalc.totalNetworkSize}</strong> підписників</span>
                      <span className="text-amber-300 font-bold">Виплати: Авто щопонеділка</span>
                    </div>
                  </div>

                  {/* Layer 2: Direct Referrals L1 Tier */}
                  <div 
                    className={`absolute w-[360px] sm:w-[400px] h-[220px] rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-900/90 border-2 border-amber-500/50 p-4 flex flex-col justify-between transition-all duration-500 ${
                      isExploded ? 'translate-y-[-50px] translate-z-[60px]' : 'translate-y-[-5px] translate-z-[25px]'
                    } ${hoveredLayer === 2 ? 'scale-105 border-amber-400' : ''}`}
                    onMouseEnter={() => setHoveredLayer(2)}
                    onMouseLeave={() => setHoveredLayer(null)}
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2 text-amber-300 font-mono font-bold text-xs">
                        <Users className="h-4 w-4 text-amber-400" />
                        <span>РІВЕНЬ 1 (L1) · ПРЯМІ ПЕРЕДПЛАТИ ({earningsCalc.currentRank.l1Percent}%)</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                        {heroL1Count} ПАРТНЕРІВ
                      </span>
                    </div>

                    <div className="space-y-2 my-auto">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Власних активних платних L1:</span>
                        <span className="text-amber-300 font-bold">{heroL1Count} користувачів</span>
                      </div>

                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Дохід лише з 1-го рівня:</span>
                        <span className="text-emerald-400 font-black">+{Math.round(earningsCalc.l1MonthlyIncome).toLocaleString()} ₴/міс</span>
                      </div>

                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div 
                          className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full"
                          style={{ width: `${Math.min(100, (heroL1Count / 75) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono flex justify-between">
                      <span>Ранг залежить виключно від L1</span>
                      <span className="text-amber-400">Потрібно для Bronze: 10 L1</span>
                    </div>
                  </div>

                  {/* Layer 3: Secondary Downline Network L2 Tier */}
                  <div 
                    className={`absolute w-[360px] sm:w-[400px] h-[220px] rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-900/90 border-2 border-emerald-500/50 p-4 flex flex-col justify-between transition-all duration-500 ${
                      isExploded ? 'translate-y-[40px] translate-z-[0px]' : 'translate-y-[10px] translate-z-[0px]'
                    } ${hoveredLayer === 3 ? 'scale-105 border-emerald-400' : ''}`}
                    onMouseEnter={() => setHoveredLayer(3)}
                    onMouseLeave={() => setHoveredLayer(null)}
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2 text-emerald-300 font-mono font-bold text-xs">
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                        <span>РІВЕНЬ 2 (L2) · ВТОРИННА МЕРЕЖА ({earningsCalc.currentRank.l2Percent}%)</span>
                      </div>
                      {earningsCalc.isL2Unlocked ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                          <Unlock className="w-3 h-3" /> ВІДКРИТО
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> ЗАБЛОКОВАНО (STARTER)
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 my-auto">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Партнерів 2-го рівня (L2):</span>
                        <span className="text-emerald-300 font-bold">{earningsCalc.totalL2Count} користувачів</span>
                      </div>

                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Пасивний дохід з L2:</span>
                        <span className={`font-black ${earningsCalc.isL2Unlocked ? 'text-emerald-400' : 'text-slate-600'}`}>
                          {earningsCalc.isL2Unlocked ? `+${Math.round(earningsCalc.l2MonthlyIncome).toLocaleString()} ₴/міс` : '0 ₴ (Потрібно Bronze 10 L1)'}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono flex justify-between">
                      <span>Кожен L1 залучає {heroAvgL2} рефералів</span>
                      <span className="text-emerald-400 font-bold">50% Max Cap</span>
                    </div>
                  </div>

                  {/* Base Pedestal: Real Payout Gateways */}
                  <div 
                    className={`absolute w-[380px] sm:w-[420px] h-[240px] rounded-3xl bg-slate-950 border-2 border-amber-500/30 shadow-2xl p-4 flex flex-col justify-between transition-all duration-500 ${
                      isExploded ? 'translate-y-[220px] translate-z-[-120px]' : 'translate-y-[40px] translate-z-[-50px]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-500 border-b border-slate-800 pb-1.5">
                      <span>ФІНАНСОВИЙ ШЛЮЗ ТА БАНКІВСЬКИЙ КЛІРИНГ</span>
                      <span>МИТТЄВО 24/7</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 my-auto">
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                        <span className="block text-[10px] text-slate-400 font-mono">MONOBANK / PRIVAT</span>
                        <span className="text-xs font-bold text-slate-200">0% Комісія виведення</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                        <span className="block text-[10px] text-slate-400 font-mono">CRYPTO USDT TRC-20</span>
                        <span className="text-xs font-bold text-slate-200">Анонімно та швидко</span>
                      </div>
                    </div>

                    <div className="flex justify-between text-[10px] text-amber-400 font-mono">
                      <span>МІНІМАЛЬНА ВИПЛАТА: 500 ₴</span>
                      <span>100% ГАРАНТІЯ СИСТЕМИ</span>
                    </div>
                  </div>
                </>
              )}

              {/* ============================================================ */}
              {/* MODE 3: MULTI-DEVICE & GADGET INTERFACE                      */}
              {/* ============================================================ */}
              {heroMode === 'ECOSYSTEM' && (
                <>
                  {/* Layer 1 (Top): Active Gadget Bezel & Display */}
                  <div 
                    className={`absolute w-[360px] sm:w-[400px] h-[230px] rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-purple-950/90 border-2 border-purple-400/80 shadow-2xl p-4 flex flex-col justify-between transition-all duration-500 ${
                      isExploded ? 'translate-y-[-140px] translate-z-[120px]' : 'translate-y-[-20px] translate-z-[50px]'
                    } ${hoveredLayer === 1 ? 'scale-105 border-purple-300 ring-2 ring-purple-400/40' : ''}`}
                    onMouseEnter={() => setHoveredLayer(1)}
                    onMouseLeave={() => setHoveredLayer(null)}
                  >
                    <div className="flex items-center justify-between border-b border-purple-500/30 pb-2">
                      <div className="flex items-center gap-2 text-purple-300 font-mono font-bold text-xs">
                        <Smartphone className="h-4 w-4 text-purple-400" />
                        <span>ПРИСТРІЙ: {selectedGadgetId}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono font-bold border border-purple-800 animate-pulse">
                        LIVE HUD
                      </span>
                    </div>

                    {/* Simulated Screen of Selected Device */}
                    <div className="relative h-24 w-full bg-slate-950/90 rounded-xl border border-purple-500/30 overflow-hidden flex items-center justify-between p-3">
                      {selectedGadgetId === 'DESKTOP' && (
                        <div className="w-full flex flex-col justify-between h-full">
                          <div className="flex justify-between items-center text-[10px] font-mono text-cyan-300">
                            <span>💻 DESKTOP COMMAND · 25 REGIONS</span>
                            <span className="text-emerald-400">● 60 FPS RAYTRACING</span>
                          </div>
                          <div className="h-10 bg-cyan-950/30 border border-cyan-500/20 rounded flex items-center justify-around px-2 text-[10px] font-mono">
                            <span className="text-rose-400">Вектор БпЛА: {primaryThreat?.etaMinutes || 18}хв</span>
                            <span className="text-cyan-300">Азимут: 315° NW</span>
                            <span className="text-amber-300">Укриття: 340м</span>
                          </div>
                        </div>
                      )}

                      {selectedGadgetId === 'TABLET' && (
                        <div className="w-full flex flex-col justify-between h-full">
                          <div className="flex justify-between items-center text-[10px] font-mono text-purple-300">
                            <span>📱 IPAD TACTICAL HUD · GESTURE PINCH</span>
                            <span className="text-purple-300">TOUCH 120HZ</span>
                          </div>
                          <div className="h-10 bg-purple-950/30 border border-purple-500/20 rounded flex items-center justify-around px-2 text-[10px] font-mono">
                            <span className="text-purple-200">Розгортання просторових шарів</span>
                            <span className="text-emerald-400">Спліт-скрін укриттів</span>
                          </div>
                        </div>
                      )}

                      {selectedGadgetId === 'PHONE' && (
                        <div className="w-full flex items-center justify-between gap-3">
                          <div className="w-10 h-10 rounded-full border-2 border-rose-500/80 bg-rose-500/20 flex items-center justify-center animate-pulse">
                            <Flame className="w-5 h-5 text-rose-400" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-bold text-rose-300">LOCKSCREEN LIVE ACTIVITY</div>
                            <div className="text-[11px] text-slate-300 font-mono">ETA {primaryThreat?.etaMinutes || 18} хв · До сховища 340м</div>
                          </div>
                          <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 px-2 py-1 rounded border border-amber-700">
                            BYPASS DND
                          </span>
                        </div>
                      )}

                      {selectedGadgetId === 'WATCH' && (
                        <div className="w-full flex items-center justify-around">
                          <div className="w-14 h-14 rounded-full border-4 border-amber-400 bg-slate-900 flex flex-col items-center justify-center">
                            <span className="text-[10px] text-slate-400 font-mono">ETA</span>
                            <span className="text-xs font-black text-amber-300 font-mono">18m</span>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-slate-200">Apple Watch Ultra</div>
                            <div className="text-[10px] text-rose-400 font-mono">Тактильний імпульс</div>
                          </div>
                        </div>
                      )}

                      {selectedGadgetId === 'CARPLAY' && (
                        <div className="w-full flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Car className="w-6 h-6 text-emerald-400" />
                            <div>
                              <div className="text-xs font-bold text-slate-200">Apple CarPlay & Android Auto</div>
                              <div className="text-[10px] text-emerald-300 font-mono">Безпечний об'їзд зони тривоги</div>
                            </div>
                          </div>
                          <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950 px-2 py-1 rounded border border-emerald-700">
                            VOICE ON
                          </span>
                        </div>
                      )}

                      {selectedGadgetId === 'GLASSES' && (
                        <div className="w-full flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Glasses className="w-6 h-6 text-sky-400 animate-pulse" />
                            <div>
                              <div className="text-xs font-bold text-slate-200">Vision Pro AR Spatial</div>
                              <div className="text-[10px] text-sky-300 font-mono">Голограма неба над кімнатою</div>
                            </div>
                          </div>
                          <span className="text-[10px] text-sky-400 font-mono font-bold bg-sky-950 px-2 py-1 rounded border border-sky-700">
                            SPATIAL AR
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-purple-200/80 pt-1 font-mono">
                      <span>Синхронізація: <strong>&lt;0.1s</strong></span>
                      <span className="text-emerald-400 font-bold">● PWA Ready (iOS/Android/Mac)</span>
                    </div>
                  </div>

                  {/* Layer 2: Cloud Mesh & P2P Synchronization */}
                  <div 
                    className={`absolute w-[360px] sm:w-[400px] h-[220px] rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-900/90 border-2 border-indigo-500/50 p-4 flex flex-col justify-between transition-all duration-500 ${
                      isExploded ? 'translate-y-[-50px] translate-z-[60px]' : 'translate-y-[-5px] translate-z-[25px]'
                    } ${hoveredLayer === 2 ? 'scale-105 border-indigo-400' : ''}`}
                    onMouseEnter={() => setHoveredLayer(2)}
                    onMouseLeave={() => setHoveredLayer(null)}
                  >
                    <div className="flex items-center justify-between border-b border-indigo-500/30 pb-2">
                      <div className="flex items-center gap-2 text-indigo-300 font-mono font-bold text-xs">
                        <Zap className="h-4 w-4 text-indigo-400" />
                        <span>ШАР СИНХРОНІЗАЦІЇ · LOW LATENCY MESH</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono font-bold border border-indigo-800">
                        120ms P2P
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 my-auto">
                      <div className="p-2 rounded-xl bg-indigo-950/60 border border-indigo-800 text-center">
                        <span className="block text-[10px] text-indigo-300 font-bold">PUSH NOTIF</span>
                        <span className="text-[9px] text-slate-400">APNs & FCM</span>
                      </div>
                      <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-800 text-center">
                        <span className="block text-[10px] text-purple-300 font-bold">OFFLINE SYNC</span>
                        <span className="text-[9px] text-slate-400">IndexedDB</span>
                      </div>
                      <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800 text-center">
                        <span className="block text-[10px] text-cyan-300 font-bold">LIVE WEBSOCKET</span>
                        <span className="text-[9px] text-slate-400">TLS 1.3</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
                      <span>Всі гаджети в єдиному акаунті</span>
                      <span className="text-emerald-400">Миттєве сповіщення</span>
                    </div>
                  </div>

                  {/* Layer 3: Universal Airspace Data Engine */}
                  <div 
                    className={`absolute w-[360px] sm:w-[400px] h-[220px] rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-900/90 border-2 border-cyan-500/50 p-4 flex flex-col justify-between transition-all duration-500 ${
                      isExploded ? 'translate-y-[40px] translate-z-[0px]' : 'translate-y-[10px] translate-z-[0px]'
                    } ${hoveredLayer === 3 ? 'scale-105 border-cyan-400' : ''}`}
                    onMouseEnter={() => setHoveredLayer(3)}
                    onMouseLeave={() => setHoveredLayer(null)}
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2 text-cyan-300 font-mono font-bold text-xs">
                        <Layers className="h-4 w-4 text-cyan-400" />
                        <span>ЄДИНЕ ЯДРО ДАНИХ (RADAR CORE)</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                        25 ОБЛАСТЕЙ
                      </span>
                    </div>

                    <div className="space-y-1.5 my-auto text-xs font-mono text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Повітряні загрози:</span>
                        <span className="text-rose-400 font-bold">{alarmRegions.length} активних тривог</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">База укриттів:</span>
                        <span className="text-emerald-400 font-bold">18,500+ з GPS-навігацією</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono flex justify-between">
                      <span>Адаптація UI під будь-яку діагональ</span>
                      <span className="text-cyan-400">Від 1.4" до 85" 4K</span>
                    </div>
                  </div>

                  {/* Base Pedestal: Cross-Platform Universal PWA */}
                  <div 
                    className={`absolute w-[380px] sm:w-[420px] h-[240px] rounded-3xl bg-slate-950 border-2 border-purple-500/30 shadow-2xl p-4 flex flex-col justify-between transition-all duration-500 ${
                      isExploded ? 'translate-y-[220px] translate-z-[-120px]' : 'translate-y-[40px] translate-z-[-50px]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-500 border-b border-slate-800 pb-1.5">
                      <span>КРОСПЛАТФОРМНИЙ PWA КАРКАС</span>
                      <span>1 КЛІК ВСТАНОВЛЕННЯ</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 my-auto">
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                        <span className="block text-[10px] text-slate-400 font-mono">APPLE IOS & IPADOS</span>
                        <span className="text-xs font-bold text-slate-200">Safari PWA Standalone</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                        <span className="block text-[10px] text-slate-400 font-mono">ANDROID & WEAROS</span>
                        <span className="text-xs font-bold text-slate-200">Google Play & PWA</span>
                      </div>
                    </div>

                    <div className="flex justify-between text-[10px] text-purple-400 font-mono">
                      <span>АВТОНОМНА РОБОТА БЕЗ ІНТЕРНЕТУ</span>
                      <span>100% БЕЗПЕКА ДАНИХ</span>
                    </div>
                  </div>
                </>
              )}

            </div>

          </div>

          {/* Quick interactive controls underneath the 3D model */}
          <div className="w-full mt-6 rounded-2xl border border-amber-500/30 bg-slate-900/95 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Швидкий тест кількості ваших рефералів:</span>
              </span>
              <span className="font-mono text-xs font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                {heroL1Count} L1 · {earningsCalc.totalL2Count} L2 ({earningsCalc.currentRank.name.toUpperCase()})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Прямі L1: {heroL1Count}</span>
                  <span className="text-amber-400 font-bold">{earningsCalc.currentRank.l1Percent}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={heroL1Count}
                  onChange={(e) => setHeroL1Count(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>L2 на партнера: {heroAvgL2}</span>
                  <span className="text-emerald-400 font-bold">{earningsCalc.currentRank.l2Percent}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={heroAvgL2}
                  onChange={(e) => setHeroAvgL2(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
              <span className="text-slate-400">Ваше реферальне посилання:</span>
              <button
                onClick={handleCopyLink}
                className="text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 font-mono"
              >
                {copiedHeroLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedHeroLink ? 'Скопійовано!' : 'sirenua.com/ref/...'}</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
