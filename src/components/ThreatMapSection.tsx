import React, { useState } from 'react';
import { Radio, Compass, Navigation, Clock, MapPin, Shield, AlertTriangle, Layers, Info, CheckCircle2, Play, RefreshCw, Eye, Check } from 'lucide-react';
import { ThreatEvent, RegionAlert, Shelter } from '../types';
import { DEFAULT_REGIONS } from '../data/mockData';

interface ThreatMapSectionProps {
  threats: ThreatEvent[];
  regions: RegionAlert[];
  shelters: Shelter[];
  isThreatServerOnline: boolean;
  threatDataMode: 'LIVE' | 'DEMO_DATA' | 'NOT_CONNECTED';
}

export const ThreatMapSection: React.FC<ThreatMapSectionProps> = ({
  threats,
  regions,
  shelters,
  isThreatServerOnline,
  threatDataMode
}) => {
  const [selectedRegionId, setSelectedRegionId] = useState<string>('reg-kyiv');
  const [activeTab, setActiveTab] = useState<'MAP' | 'SIMULATOR' | 'SHELTERS'>('MAP');
  const [simulatorStep, setSimulatorStep] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [navigatedShelterId, setNavigatedShelterId] = useState<string | null>(null);

  const safeRegions = (regions && regions.length > 0)
    ? regions
    : threatDataMode === 'DEMO_DATA'
      ? DEFAULT_REGIONS
      : [];
  const selectedRegion = safeRegions.find(r => r.id === selectedRegionId) || safeRegions[0] || {
    id: 'unavailable',
    name: 'Дані регіонів недоступні',
    nameEn: 'Regional data unavailable',
    code: '—',
    hasAlert: false,
    alertType: 'NONE' as const,
    riskLevel: 'NORMAL' as const,
    threatCount: 0,
    sheltersCount: 0,
    lastUpdated: '—',
    districts: []
  };

  // 7-Step Interactive Simulator Data
  const simulationSteps = [
    {
      step: 1,
      title: 'Крок 1: Засічка загрози',
      description: 'РЛС та сенсори раннього попередження фіксують повітряний об’єкт на висоті 450м зі швидкістю 185 км/год.',
      threatState: 'Зафіксовано нову ціль (БПЛА Shahed-136) над Полтавщиною',
      riskBadge: 'ELEVATED'
    },
    {
      step: 2,
      title: 'Крок 2: Зона ураження',
      description: 'Система накладає просторову зону потенційної небезпеки та передає статус на сервер.',
      threatState: 'Зона попередження активована для 3 суміжних областей',
      riskBadge: 'ELEVATED'
    },
    {
      step: 3,
      title: 'Крок 3: Вектор та напрямок',
      description: 'Обчислюється поточний азимут (315° NW — Північно-Західний напрямок).',
      threatState: 'Курс на Київську область вздовж русла Дніпра',
      riskBadge: 'HIGH'
    },
    {
      step: 4,
      title: 'Крок 4: Прогнозна траєкторія',
      description: 'Алгоритм будує конус ймовірної траєкторії польоту на найближчі 30 хвилин.',
      threatState: 'Прогнозний коридор: Золотоноша → Переяслав → Бориспіль',
      riskBadge: 'HIGH'
    },
    {
      step: 5,
      title: 'Крок 5: Диференціація ризику району',
      description: 'Для кожного конкретного району формується персональний рівень ризику (Жовтий/Червоний/Звичайний).',
      threatState: 'Бориспільський район переведено у статус: ВИСОКИЙ РИЗИК',
      riskBadge: 'HIGH'
    },
    {
      step: 6,
      title: 'Крок 6: Орієнтовний час (ETA)',
      description: 'Відображається діапазон часу до наближення без категоричних тверджень.',
      threatState: 'Орієнтовний час за поточними даними: 18–25 хв',
      riskBadge: 'CRITICAL'
    },
    {
      step: 7,
      title: 'Крок 7: Маршрутизація до укриття',
      description: 'Користувач отримує перелік найближчих перевірених укриттів з фільтром автономності та цілодобового доступу.',
      threatState: 'Найближче укриття: Метро «Золоті Ворота» (340 м, резервне живлення)',
      riskBadge: 'NORMAL'
    }
  ];

  return (
    <section id="map-section" className="py-12 lg:py-20 bg-[#090D14] border-t border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {threatDataMode !== 'DEMO_DATA' && !isThreatServerOnline && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/5 px-4 py-3 text-sm text-amber-100/90">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <div>
              <p className="font-semibold">Актуальні дані тимчасово недоступні</p>
              <p className="mt-0.5 text-xs text-amber-100/60">Цей інтерфейс не підміняє офіційні сповіщення. Після підключення авторитетного ThreatServer тут з’являться часові мітки, confidence та свіжість даних.</p>
            </div>
          </div>
        )}
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-3">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Оперативна обстановка в реальному часі</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-['Plus_Jakarta_Sans']">
              Карта ситуації та траєкторії загроз
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl">
              Візуалізація повітряної обстановки з векторним моделюванням, прогнозом часу та диференціацією по районах.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('MAP')}
              className={`px-3.5 py-2 rounded-lg transition-all ${
                activeTab === 'MAP'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Оперативна карта
            </button>
            <button
              onClick={() => setActiveTab('SIMULATOR')}
              className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'SIMULATOR'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <Play className="w-3 h-3" />
              Демо-симулятор (7 кроків)
            </button>
            <button
              onClick={() => setActiveTab('SHELTERS')}
              className={`px-3.5 py-2 rounded-lg transition-all ${
                activeTab === 'SHELTERS'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Укриття ({shelters.length})
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: OPERATIONAL MAP VIEW                                              */}
        {/* ========================================================================= */}
        {activeTab === 'MAP' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Interactive Ukraine Regions & Vector Map Canvas */}
            <div className="lg:col-span-8 rounded-2xl bg-gradient-to-b from-slate-900 to-[#0B0F17] border border-slate-800 p-5 relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[480px]">
              
              {/* Map Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4 z-10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
                  <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                    SECTOR INTELLIGENCE MAP
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Фільтр:</span>
                  <button 
                    onClick={() => setSelectedCategory('ALL')}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono ${selectedCategory === 'ALL' ? 'bg-slate-700 text-white' : 'bg-slate-800/60 text-slate-400'}`}
                  >
                    Всі цілі
                  </button>
                  <button 
                    onClick={() => setSelectedCategory('DRONE')}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono ${selectedCategory === 'DRONE' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800/60 text-slate-400'}`}
                  >
                    БПЛА (1)
                  </button>
                  <button 
                    onClick={() => setSelectedCategory('MISSILE')}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono ${selectedCategory === 'MISSILE' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800/60 text-slate-400'}`}
                  >
                    Ракети (1)
                  </button>
                </div>
              </div>

              {/* Map Canvas with SVG Region Nodes & Trajectory Overlays */}
              <div className="relative w-full flex-1 rounded-xl bg-[#070B11] border border-slate-800/80 p-4 flex flex-col justify-center items-center overflow-hidden">
                
                {/* Radar Grid overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none"></div>

                {/* SVG Visual Representation of Ukrainian Airspace & Threat Vectors */}
                <svg className="w-full h-72 sm:h-80" viewBox="0 0 800 450" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Ukraine Outline approximation contours */}
                  <path 
                    d="M100 180 Q 250 80 450 100 Q 680 120 730 200 Q 690 320 540 340 Q 420 400 280 360 Q 140 330 80 260 Z" 
                    fill="#0F172A" 
                    stroke="#334155" 
                    strokeWidth="2" 
                    strokeDasharray="4 4"
                  />

                  {/* Regions Interactive Hotspots */}
                  {/* Kyiv Region Node */}
                  <g 
                    onClick={() => setSelectedRegionId('reg-kyiv')} 
                    className="cursor-pointer transition-transform hover:scale-105"
                  >
                    <circle cx="410" cy="180" r="28" fill="#e11d48" fillOpacity="0.25" stroke="#f43f5e" strokeWidth="2" />
                    <circle cx="410" cy="180" r="10" fill="#f43f5e" />
                    <text x="410" y="222" textAnchor="middle" fill="#fecdd3" fontSize="13" fontWeight="bold" fontFamily="Plus Jakarta Sans">
                      Київщина (Тривога)
                    </text>
                  </g>

                  {/* Vinnytsia Region Node */}
                  <g 
                    onClick={() => setSelectedRegionId('reg-vin')} 
                    className="cursor-pointer transition-transform hover:scale-105"
                  >
                    <circle cx="330" cy="250" r="32" fill="#e11d48" fillOpacity="0.35" stroke="#e11d48" strokeWidth="2.5" className="animate-pulse" />
                    <circle cx="330" cy="250" r="12" fill="#e11d48" />
                    <text x="330" y="295" textAnchor="middle" fill="#fda4af" fontSize="12" fontWeight="bold">
                      Вінниччина (Критичний)
                    </text>
                  </g>

                  {/* Cherkasy Region Node */}
                  <g 
                    onClick={() => setSelectedRegionId('reg-cherkasy')} 
                    className="cursor-pointer"
                  >
                    <circle cx="470" cy="240" r="22" fill="#d97706" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="1.5" />
                    <circle cx="470" cy="240" r="7" fill="#f59e0b" />
                    <text x="470" y="275" textAnchor="middle" fill="#fde68a" fontSize="11">
                      Черкащина
                    </text>
                  </g>

                  {/* Lviv Region Node */}
                  <g 
                    onClick={() => setSelectedRegionId('reg-lviv')} 
                    className="cursor-pointer"
                  >
                    <circle cx="160" cy="220" r="20" fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="1.5" />
                    <circle cx="160" cy="220" r="6" fill="#10b981" />
                    <text x="160" y="252" textAnchor="middle" fill="#a7f3d0" fontSize="11">
                      Львівщина (Норма)
                    </text>
                  </g>

                  {/* Dnipro Region Node */}
                  <g 
                    onClick={() => setSelectedRegionId('reg-dnipro')} 
                    className="cursor-pointer"
                  >
                    <circle cx="580" cy="260" r="20" fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="1.5" />
                    <circle cx="580" cy="260" r="6" fill="#10b981" />
                    <text x="580" y="292" textAnchor="middle" fill="#a7f3d0" fontSize="11">
                      Дніпропетровщина
                    </text>
                  </g>

                  {/* Trajectory Vector 1: Shahed heading NW to Kyiv */}
                  <path 
                    d="M 470 240 L 410 180" 
                    stroke="#fb7185" 
                    strokeWidth="3" 
                    strokeDasharray="6 4" 
                  />
                  {/* Moving drone marker */}
                  <circle cx="440" cy="210" r="5" fill="#ffffff" stroke="#f43f5e" strokeWidth="2" className="animate-ping" />

                  {/* Trajectory Vector 2: Missile heading West to Vinnytsia */}
                  <path 
                    d="M 490 280 L 330 250" 
                    stroke="#f43f5e" 
                    strokeWidth="4" 
                  />
                  <circle cx="390" cy="261" r="6" fill="#f43f5e" />
                </svg>

                {threatDataMode !== 'DEMO_DATA' && !isThreatServerOnline && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#070B11]/80 p-6 text-center backdrop-blur-[2px]">
                    <div className="max-w-sm rounded-2xl border border-amber-400/25 bg-slate-950/90 px-5 py-4 shadow-2xl">
                      <div className="font-mono text-xs font-bold tracking-[0.18em] text-amber-300">NOT CONNECTED</div>
                      <p className="mt-2 text-sm font-semibold text-white">Карта очікує авторитетне джерело даних</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">Схематичні шари нижче не є live-телеметрією. Під час небезпеки користуйтеся офіційними сповіщеннями.</p>
                    </div>
                  </div>
                )}

                {/* Map Bottom Metadata Legend */}
                <div className="absolute bottom-3 inset-x-4 flex flex-wrap items-center justify-between gap-2 text-[11px] bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Червоний (Високий / Критичний)
                    </span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Жовтий (Підвищений)
                    </span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Звичайний (Відбій)
                    </span>
                  </div>

                  <span className="text-slate-400 font-mono">
                    Клікніть на область для деталізації
                  </span>
                </div>

              </div>

            </div>

            {/* Right: Selected Region & Active Threat Dossier */}
            <div className="lg:col-span-4 space-y-4">
              
              {/* Region Risk Card */}
              <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedRegion?.name || 'Київська область та м. Київ'}</h3>
                    <p className="text-xs text-slate-400 font-mono">{selectedRegion?.code || 'UA-32'} • Оновлено: {selectedRegion?.lastUpdated || '18:34:21'}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                    selectedRegion?.riskLevel === 'CRITICAL' ? 'bg-rose-600 text-white' :
                    selectedRegion?.riskLevel === 'HIGH' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                    selectedRegion?.riskLevel === 'ELEVATED' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {selectedRegion?.riskLevel || 'HIGH'}
                  </span>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Диференціація по районах:
                  </h4>
                  {(selectedRegion?.districts || []).map((d, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-slate-800 text-xs">
                      <span className="text-slate-200">{d?.name}</span>
                      <div className="flex items-center gap-2">
                        {d?.etaMinutes && (
                          <span className="text-[11px] font-mono text-rose-400 font-semibold">
                            ~{d.etaMinutes}
                          </span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          d?.riskLevel === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                          d?.riskLevel === 'HIGH' ? 'bg-rose-950/60 text-rose-300' :
                          d?.riskLevel === 'ELEVATED' ? 'bg-amber-950/60 text-amber-300' :
                          'bg-emerald-950/60 text-emerald-300'
                        }`}>
                          {d?.riskLevel === 'CRITICAL' ? 'Критичний' : d?.riskLevel === 'HIGH' ? 'Високий' : d?.riskLevel === 'ELEVATED' ? 'Підвищений' : 'Норма'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Доступних укриттів:</span>
                  <span className="font-bold text-white font-mono">{selectedRegion?.sheltersCount ?? 4120}</span>
                </div>
              </div>

              {/* Active Threat Intelligence Feed */}
              <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  Активні повітряні загрози ({threats.length})
                </h4>

                <div className="space-y-3">
                  {threats.map((t) => (
                    <div key={t.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{t.categoryLabel}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          {t.confidence}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-tight">
                        Напрямок: <span className="text-amber-300">{t.directionLabel}</span>
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                        <span className="text-slate-400">Швидкість: <b className="text-slate-200">{t.speedKmh} км/год</b></span>
                        <span className="text-rose-400 font-bold font-mono">ETA: {t.estimatedArrivalMin}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: 7-STEP INTERACTIVE SIMULATOR (DEMO MODE)                          */}
        {/* ========================================================================= */}
        {activeTab === 'SIMULATOR' && (
          <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-[#0B0F17] border border-amber-500/40 p-6 sm:p-8 shadow-2xl relative">
            
            {/* DEMO Watermark */}
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span>SYNTHETIC DEMO SIMULATOR</span>
            </div>

            <div className="max-w-3xl">
              <h3 className="text-xl sm:text-2xl font-bold text-white font-['Plus_Jakarta_Sans']">
                Як працює обробка загрози в системі SIREN UA
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Інтерактивний покроковий процес: від першої радіолокаційної засічки до прокладання маршруту в укриття.
              </p>
            </div>

            {/* Stepper Progress Bar */}
            <div className="mt-8 grid grid-cols-7 gap-2">
              {simulationSteps.map((s) => (
                <button
                  key={s.step}
                  onClick={() => setSimulatorStep(s.step)}
                  className={`py-2 px-1 rounded-lg text-xs font-bold transition-all text-center ${
                    simulatorStep === s.step
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                      : simulatorStep > s.step
                      ? 'bg-slate-800 text-amber-300 border border-slate-700'
                      : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}
                >
                  Крок {s.step}
                </button>
              ))}
            </div>

            {/* Step Card Details */}
            {(() => {
              const current = simulationSteps[simulatorStep - 1];
              return (
                <div className="mt-6 p-6 rounded-2xl bg-slate-950/80 border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-8 space-y-3">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                      {current.title}
                    </div>
                    <h4 className="text-lg font-bold text-white">{current.threatState}</h4>
                    <p className="text-slate-300 text-sm leading-relaxed">{current.description}</p>
                  </div>

                  <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <span className="text-xs text-slate-400 mb-1">Статус ризику:</span>
                    <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      {current.riskBadge}
                    </span>
                    <div className="mt-4 flex items-center gap-2 w-full">
                      <button
                        onClick={() => setSimulatorStep(prev => prev > 1 ? prev - 1 : 1)}
                        disabled={simulatorStep === 1}
                        className="flex-1 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300 disabled:opacity-40"
                      >
                        Назад
                      </button>
                      <button
                        onClick={() => setSimulatorStep(prev => prev < 7 ? prev + 1 : 1)}
                        className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
                      >
                        {simulatorStep === 7 ? 'Спочатку' : 'Далі'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SHELTERS FINDER                                                   */}
        {/* ========================================================================= */}
        {activeTab === 'SHELTERS' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {shelters.map((sh) => (
              <div key={sh.id} className="rounded-2xl bg-slate-900 border border-slate-800 p-5 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {sh.type === 'SUBWAY' ? 'МЕТРО' : sh.type === 'BOMB_SHELTER' ? 'БОМБОСХОВИЩЕ' : 'ПАРКІНГ'}
                    </span>
                    <span className="text-xs text-emerald-400 font-bold font-mono">
                      {sh.distanceMeters} м від вас
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white mb-1">{sh.name}</h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{sh.address}</span>
                  </p>
                  
                  <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-slate-300">
                    <div className="p-2 rounded bg-slate-800/60 text-center">
                      <span className="text-slate-500 block text-[9px]">Місткість</span>
                      <b>{sh.capacity} ос.</b>
                    </div>
                    <div className="p-2 rounded bg-slate-800/60 text-center">
                      <span className="text-slate-500 block text-[9px]">24/7 доступ</span>
                      <b className="text-emerald-400">ТАК</b>
                    </div>
                    <div className="p-2 rounded bg-slate-800/60 text-center">
                      <span className="text-slate-500 block text-[9px]">Генератор</span>
                      <b className="text-emerald-400">ТАК</b>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setNavigatedShelterId(sh.id);
                    setTimeout(() => setNavigatedShelterId(null), 4000);
                  }}
                  className={`mt-4 w-full py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                    navigatedShelterId === sh.id
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  {navigatedShelterId === sh.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white animate-bounce" />
                      <span>Маршрут побудовано (~4 хв пішки)</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Прокласти маршрут</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
