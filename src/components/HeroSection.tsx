import React, { Suspense, useEffect, useState } from 'react';
import { 
  ArrowRight, 
  Apple,
  Play,
  Check,
  AlertTriangle,
  ShieldCheck,
  QrCode
} from 'lucide-react';
import { RegionData, ThreatSceneModel, ThreatTrajectory } from '../types';
import { playWebAudioSound } from '../utils/sirenAudio';
import { runtimeConfig } from '../config/runtime';
import ukraine3dCutoutDark from '../assets/images/ukraine_3d_cutout_dark.webp';

const ThreeMapUkraine = React.lazy(() => import('./ThreeMapUkraine').then((module) => ({
  default: module.ThreeMapUkraine,
})));

interface HeroSectionProps {
  regions?: RegionData[];
  selectedRegion?: RegionData | null;
  onSelectRegion?: (region: RegionData | null) => void;
  trajectories?: ThreatTrajectory[];
  threatModel?: ThreatSceneModel;
  onRefreshData?: () => void;
  onNavigateToShelters?: () => void;
  onOpenDemo?: () => void;
  theme?: 'light' | 'dark';
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  regions = [],
  selectedRegion = null,
  onSelectRegion,
  trajectories = [],
  threatModel,
  onRefreshData,
  onNavigateToShelters,
  onOpenDemo,
  theme = 'light'
}) => {
  const [mapMode, setMapMode] = useState<'RENDER' | 'WEBGL'>('RENDER');
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const isDark = theme === 'dark';
  const dataModeMessage = threatModel?.dataMode === 'CACHED'
    ? 'ОСТАННІ ЗБЕРЕЖЕНІ ДАНІ'
    : threatModel?.dataMode === 'STALE'
      ? 'ДАНІ ЗАСТАРІЛІ'
      : threatModel?.dataMode === 'ERROR'
        ? 'ПОМИЛКА ДЖЕРЕЛА ДАНИХ'
        : 'LIVE DATA НЕ ПІДКЛЮЧЕНО';
  const freshnessLabel = threatModel?.dataMode === 'LIVE'
    ? `LIVE · ${threatModel.timestamp}`
    : threatModel?.dataMode === 'DEMO_DATA'
      ? `DEMO · ${threatModel.timestamp}`
      : threatModel?.dataMode === 'CACHED'
        ? `CACHED · ${threatModel.timestamp}`
        : threatModel?.dataMode === 'STALE'
          ? `STALE · ${threatModel.timestamp}`
          : 'ДАНІ НЕДОСТУПНІ';
  const freshnessAccessibleLabel = threatModel?.dataMode === 'LIVE'
    ? `LIVE. Оновлено ${threatModel.timestamp}`
    : threatModel?.dataMode === 'DEMO_DATA'
      ? `DEMO. Сценарій оновлено ${threatModel.timestamp}`
      : threatModel?.dataMode === 'CACHED'
        ? `CACHED. Останнє збережене оновлення ${threatModel.timestamp}`
        : threatModel?.dataMode === 'STALE'
          ? `STALE. Останнє оновлення ${threatModel.timestamp}`
          : 'Актуальні дані недоступні';
  const freshnessTone = threatModel?.dataMode === 'LIVE'
    ? 'bg-emerald-500/15 text-emerald-300'
    : threatModel?.dataMode === 'DEMO_DATA'
      ? 'bg-purple-500/15 text-purple-300'
      : 'bg-amber-500/15 text-amber-300';
  const trustPoints = threatModel?.dataMode === 'LIVE'
    ? [
        'Швидке встановлення',
        'Покриття всієї України',
        'Оновлення в реальному часі',
      ]
    : threatModel?.dataMode === 'DEMO_DATA'
      ? [
          'Демонстраційний spatial twin',
          'Реальний API позначається окремо',
          'Сценарій не видається за live',
        ]
      : [
          'Швидке встановлення',
          'Джерело даних видно на екрані',
          'Застарілі дані не маскуються під live',
        ];

  // Verified live data uses the normalized selectable scene. Explicit demo
  // data keeps the polished product preview on the first paint; its paths are
  // labelled demo-only and never claim an authoritative threat surface.
  useEffect(() => {
    if (threatModel?.dataMode === 'LIVE') setMapMode('WEBGL');
    if (threatModel?.dataMode !== 'LIVE') setMapMode('RENDER');
  }, [threatModel?.dataMode]);

  return (
    <div className={`siren-panel siren-hero w-full rounded-[30px] p-5 sm:p-7 lg:p-4 border relative overflow-hidden transition-all duration-300 ${
      isDark 
        ? 'bg-[#10232B] border-[#2D4A55] text-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]'
        : 'bg-[#F7FAFC] border-[#D9E2E8] text-[#0F172A] shadow-[0_20px_70px_rgba(42,68,83,0.08)]'
    }`}>
      
      {/* Background Soft Glow */}
      <div className={`absolute top-1/2 right-10 -translate-y-1/2 w-[650px] h-[650px] rounded-full blur-[130px] pointer-events-none -z-10 ${
        isDark ? 'bg-blue-600/15' : 'bg-blue-200/40'
      }`} />

      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-7 relative z-10 w-full min-h-[330px] lg:min-h-[290px]">
        
        {/* Left: Text Content & Sub-Block */}
        <div className="flex-1 w-full flex flex-col items-start text-left max-w-[620px]">
          
          {/* Top Pill Badge */}
          <div className={`inline-flex max-w-full flex-wrap items-center gap-2 px-4 py-1.5 rounded-full border mb-3 lg:mb-2 text-[12px] font-extrabold tracking-wide ${
            isDark 
              ? 'bg-[#1B293F] border-[#2E4160] text-blue-400' 
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            <span>UA | Платформа безпеки та ситуаційної обізнаності</span>
            <span role="status" aria-label={freshnessAccessibleLabel} title={freshnessAccessibleLabel} className={`ml-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-black tracking-wide ${freshnessTone}`}>
              {freshnessLabel}
            </span>
          </div>

          {/* Heading */}
          <h1 className={`text-4xl sm:text-5xl lg:text-[36px] font-black tracking-tight leading-[1.06] ${
            isDark ? 'text-[#ECE4D8]' : 'text-[#0F172A]'
          }`}>
            Розумій ситуацію.<br />
            <span className={isDark ? 'text-[#9DB0BA]' : 'text-[#5E87A0]'}>Не просто отримуй тривогу.</span>
          </h1>
          
          {/* Subtitle */}
          <p className={`mt-3 lg:mt-2 text-[14px] sm:text-[15px] lg:text-[13px] lg:leading-[1.35] leading-relaxed font-medium ${
            isDark ? 'text-slate-300' : 'text-[#46566B]'
          }`}>
            SIREN UA — на карті повітряної ситуації, напрями загроз, прогнозні траєкторії, орієнтовний час, хронологія подій та інформація про укриття — в одному застосунку.
          </p>
          
          {/* Primary & Secondary Buttons */}
          <div className="mt-5 lg:mt-3 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                if (runtimeConfig.appStoreUrl) {
                  window.open(runtimeConfig.appStoreUrl, '_blank', 'noopener,noreferrer');
                  return;
                }
                setDownloadNotice('App Store-посилання буде активне після публікації офіційного застосунку.');
                playWebAudioSound('click');
                window.setTimeout(() => setDownloadNotice(null), 4200);
              }}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-full font-bold text-[13px] flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-lg cursor-pointer ${
                isDark
                  ? 'bg-[#73AFC7] hover:bg-[#8BC2D7] active:bg-[#5E9BB4] text-[#07151C] shadow-[0_10px_28px_rgba(115,175,199,0.25)]'
                  : 'bg-[#6D9FB8] hover:bg-[#5E8EA7] active:bg-[#4F7D96] text-white shadow-[0_10px_28px_rgba(80,128,153,0.20)]'
              }`}
            >
              <Apple className="w-4 h-4 fill-white mb-0.5" />
              <span>Завантажити для iPhone</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>
            <button
              onClick={() => {
                onOpenDemo?.();
                if (!onOpenDemo) {
                  setMapMode((current) => threatModel?.dataMode === 'LIVE' ? 'WEBGL' : current === 'RENDER' ? 'WEBGL' : 'RENDER');
                }
                playWebAudioSound('click');
              }}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-full border font-bold text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isDark 
                  ? 'bg-[#182335] border-[#2E4160] text-white hover:bg-[#202E46]' 
                  : 'bg-white border-[#CBD6E2] text-[#0F172A] hover:bg-slate-50 shadow-sm'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current text-blue-600" />
              <span>{onOpenDemo ? 'Дивитись демо' : 'Відкрити карту'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigateToShelters?.();
                playWebAudioSound('click');
              }}
              className={`w-full sm:w-auto lg:hidden px-5 py-2.5 rounded-full border font-bold text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isDark
                  ? 'border-[#2E4160] text-[#B9D8E2] hover:bg-[#182335]'
                  : 'bg-white/80 border-[#CBD6E2] text-[#416B7C] hover:bg-white shadow-sm'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Найближче укриття</span>
            </button>
          </div>

          {downloadNotice && (
            <div role="status" className={`mt-3 max-w-md rounded-xl border px-3 py-2 text-[11px] font-semibold ${
              isDark ? 'border-[#3B5B68] bg-[#17313B] text-[#B9D8E2]' : 'border-[#C7DCE5] bg-[#EDF7FA] text-[#416B7C]'
            }`}>
              {downloadNotice}
            </div>
          )}

          {/* Sub-block: QR Code, App Store Pill & Checkmarks */}
          <div className={`mt-4 lg:mt-2 pt-3 lg:pt-2 border-t w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            isDark ? 'border-[#24344D]' : 'border-[#DBE4EC]'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 border ${
                isDark ? 'bg-[#182335] border-[#2E4160] text-white' : 'bg-white border-[#CBD6E2] text-slate-800 shadow-sm'
              }`}>
                <QrCode className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex flex-col">
                <div className={`px-3 py-1.5 rounded-lg bg-black text-white text-[10px] font-bold flex items-center gap-1.5 border border-slate-700 shadow-sm mb-1`}>
                  <Apple className="w-3.5 h-3.5 fill-white" />
                  <div>
                    <div className="text-[8px] uppercase tracking-wider text-slate-400">Завантажуйте в</div>
                    <div className="text-[10px] font-bold leading-none">App Store</div>
                  </div>
                </div>
                {!runtimeConfig.appStoreUrl && (
                  <span className={`text-[9px] font-semibold ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    Посилання готується
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              {trustPoints.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-200' : 'text-[#334155]'}`}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right: 3D Ukraine Map matching screenshots 1:1 with pins & arcs */}
        <div className="flex-1 w-full flex items-center justify-center relative min-h-[280px] lg:min-h-[270px]">
          <div className={`siren-hero-map relative w-full max-w-[620px] aspect-[16/10] lg:aspect-auto lg:h-[250px] flex items-center justify-center ${
            isDark ? 'siren-hero-map--dark' : 'siren-hero-map--light'
          }`}>
            {mapMode === 'WEBGL' ? (
              <Suspense fallback={(
                <div className={`absolute inset-0 flex items-center justify-center text-xs font-semibold ${isDark ? 'text-[#9BC7D7]' : 'text-[#5E87A0]'}`}>
                  Завантаження інтерактивної 3D-сцени…
                </div>
              )}>
                <ThreeMapUkraine
                  variant="hero"
                  theme={theme}
                  regions={regions}
                  trajectories={trajectories}
                  selectedRegionId={selectedRegion?.id || null}
                  onSelectRegion={(region) => onSelectRegion?.(region)}
                  activeThreatCount={threatModel?.activeAlarmsCount || 0}
                  enableControls
                  className="absolute inset-0"
                />
              </Suspense>
            ) : (
              <>
                <img
                  // The light cutout has an opaque canvas baked into the asset.
                  // Use the alpha-preserving asset in both themes so the map
                  // floats directly on the hero surface instead of sitting in a
                  // rectangular image tile.
                  src={ukraine3dCutoutDark}
                  alt="3D Карта України SIREN UA — дизайн-прев’ю"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  style={{
                    opacity: isDark ? 0.92 : 0.96,
                    filter: isDark
                      ? 'saturate(0.38) brightness(0.76) contrast(0.92)'
                      : 'saturate(0.28) brightness(1.18) contrast(1.04)'
                  }}
                  className="w-full h-auto object-contain max-h-[290px] lg:max-h-[255px] drop-shadow-[0_20px_35px_rgba(79,132,154,0.27)]"
                />
                {threatModel?.dataMode !== 'DEMO_DATA' && threatModel?.dataMode !== 'LIVE' && (
                  <div className={`absolute right-3 top-3 rounded-xl border px-3 py-2 text-left text-[9px] font-black tracking-[0.12em] backdrop-blur-md shadow-[0_10px_26px_rgba(0,0,0,0.16)] ${
                    isDark
                      ? 'border-amber-400/40 bg-slate-950/80 text-amber-200'
                      : 'border-amber-300 bg-white/90 text-amber-700'
                  }`}>
                    <span className="block">ДАНІ НЕДОСТУПНІ</span>
                    <span className="mt-1 block text-[9px] font-bold tracking-normal opacity-80">{dataModeMessage}</span>
                    {onRefreshData && (
                      <button
                        type="button"
                        onClick={onRefreshData}
                        className={`mt-2 rounded-lg border px-2.5 py-1.5 text-[9px] font-black tracking-normal transition-colors ${
                          isDark
                            ? 'border-amber-300/40 bg-amber-300/10 text-amber-100 hover:bg-amber-300/20'
                            : 'border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100'
                        }`}
                      >
                        Повторити підключення
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Conceptual arcs are allowed only in explicit DEMO mode. Live spatial paths come from the normalized threat model. */}
            {mapMode === 'RENDER' && threatModel?.dataMode === 'DEMO_DATA' && <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              {/* Arc 1: Львів (28, 42) -> Київ (57, 28) */}
              <path d="M 28,42 Q 42,22 57,28" fill="none" stroke={isDark ? '#9BC7D7' : '#6D9FB8'} strokeWidth="0.8" strokeDasharray="1.5 1" filter="url(#glow)" />
              {/* Arc 2: Київ (57, 28) -> Харків (80, 36) */}
              <path d="M 57,28 Q 68,22 80,36" fill="none" stroke={isDark ? '#9BC7D7' : '#6D9FB8'} strokeWidth="0.8" strokeDasharray="1.5 1" filter="url(#glow)" />
              {/* Arc 3: Київ (57, 28) -> Дніпро (72, 58) */}
              <path d="M 57,28 Q 66,42 72,58" fill="none" stroke={isDark ? '#9BC7D7' : '#6D9FB8'} strokeWidth="0.8" strokeDasharray="1.5 1" filter="url(#glow)" />
              {/* Arc 4: Дніпро (72, 58) -> Одеса (58, 76) */}
              <path d="M 72,58 Q 64,72 58,76" fill="none" stroke={isDark ? '#9BC7D7' : '#6D9FB8'} strokeWidth="0.8" strokeDasharray="1.5 1" filter="url(#glow)" />
              {/* Arc 5: Львів (28, 42) -> Одеса (58, 76) */}
              <path d="M 28,42 Q 40,68 58,76" fill="none" stroke={isDark ? '#9BC7D7' : '#6D9FB8'} strokeWidth="0.5" strokeDasharray="1 1" opacity="0.5" />
            </svg>}

            {/* Map Pins and City Labels (the WebGL scene owns its own overlays) */}
            {mapMode === 'RENDER' && <>
            {[
              { name: 'Львів', top: '42%', left: '28%' },
              { name: 'Київ', top: '28%', left: '57%' },
              { name: 'Харків', top: '36%', left: '80%' },
              { name: 'Дніпро', top: '58%', left: '72%' },
              { name: 'Одеса', top: '76%', left: '58%' },
            ].map((city, idx) => (
              <button
                key={idx} 
                type="button"
                aria-label={`Вибрати регіон ${city.name}`}
                onClick={() => {
                  const lookup: Record<string, string[]> = {
                    'Київ': ['kyiv_obl', 'kyiv_city'],
                    'Харків': ['kharkiv'],
                    'Дніпро': ['dnipro'],
                    'Одеса': ['odesa'],
                    'Львів': ['lviv'],
                  };
                  const region = (regions || []).find((item) => lookup[city.name]?.includes(item.id));
                  if (region) onSelectRegion?.(region);
                }}
                className="absolute flex items-center gap-1.5 -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10 transition-transform hover:scale-110"
                style={{ top: city.top, left: city.left }}
              >
                {/* 3D Map Teardrop Pin Icon */}
                <div className="relative flex items-center justify-center">
                  <svg className="w-5 h-5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" viewBox="0 0 24 24" fill="none">
                    <defs>
                      <linearGradient id={`pinGrad-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={isDark ? '#B8D5DF' : '#A8C8D8'} />
                        <stop offset="100%" stopColor={isDark ? '#557A88' : '#6D9FB8'} />
                      </linearGradient>
                    </defs>
                    <path 
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
                      fill={`url(#pinGrad-${idx})`} 
                      stroke={isDark ? '#D8E9EE' : '#FFFFFF'}
                      strokeWidth="1.2"
                    />
                    <circle cx="12" cy="9" r="2.5" fill="#FFFFFF" />
                  </svg>
                </div>

                {/* City Name Label */}
                <span className={`text-[12px] sm:text-[13px] font-extrabold tracking-tight select-none ${
                  isDark ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]' : 'text-[#0F172A] drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]'
                }`}>
                  {city.name}
                </span>
              </button>
            ))}
            </>}

            {/* Bottom Right Pill Badge: SIREN UA - Україна */}
            <div className={`absolute bottom-3 right-4 px-4 py-1.5 rounded-full border text-[11px] font-bold shadow-md backdrop-blur-md z-20 ${
              isDark 
                ? 'bg-[#182335]/90 border-[#2E4160] text-slate-200' 
                : 'bg-white/90 border-[#CBD6E2] text-slate-700'
            }`}>
              SIREN UA • Україна
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
