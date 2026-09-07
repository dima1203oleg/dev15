import React, { useEffect, useState } from 'react';
import { 
  Shield, 
  MapPin, 
  Navigation, 
  Zap, 
  Wifi, 
  Clock, 
  CheckCircle2, 
  Search, 
  Compass
} from 'lucide-react';
import { Shelter, RegionData } from '../types';
import { DataState } from '../types/dataEnvelope';
import { DataFreshnessIndicator } from './DataFreshnessIndicator';
import { shelterService } from '../services/shelterService';
import { runtimeConfig } from '../config/runtime';

interface SheltersSectionProps {
  myRegionId: string;
  regions: RegionData[];
  dataState?: DataState;
  theme?: 'light' | 'dark';
}

export const SheltersSection: React.FC<SheltersSectionProps> = ({ myRegionId, regions, dataState = 'NOT_CONNECTED', theme = 'light' }) => {
  const isDark = theme === 'dark';
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [shelterState, setShelterState] = useState<DataState>(runtimeConfig.apiBaseUrl ? 'LOADING' : runtimeConfig.allowDemoData ? 'DEMO' : 'NOT_CONNECTED');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'METRO' | 'GENERATOR' | 'WIFI' | 'ACCESSIBLE'>('ALL');
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);

  useEffect(() => {
    let mounted = true;
    setShelterState('LOADING');
    setSelectedShelter(null);

    shelterService.getShelters(myRegionId).then((response) => {
      if (!mounted) return;
      setShelterState(response.state);
      setShelters(response.data || []);
      setSelectedShelter(response.data?.[0] || null);
    });

    return () => {
      mounted = false;
    };
  }, [myRegionId]);

  const currentRegion = regions.find((r) => r.id === myRegionId) || regions[0];

  const filteredShelters = shelters.filter((shelter) => {
    const matchesSearch = 
      shelter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shelter.address.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'METRO') return shelter.type === 'metro';
    if (activeFilter === 'GENERATOR') return shelter.features.powerGenerator;
    if (activeFilter === 'WIFI') return shelter.features.wifi;
    if (activeFilter === 'ACCESSIBLE') return shelter.features.wheelchairAccessible;

    return true;
  });

  const surfaceClass = isDark
    ? 'bg-slate-950/90 border-slate-800 text-slate-100 shadow-2xl'
    : 'bg-[#F7FAFC] border-[#D9E2E8] text-[#0F172A] shadow-sm';
  const cardClass = isDark
    ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
    : 'bg-white border-[#D9E2E8] hover:border-blue-200 hover:bg-white shadow-sm';
  const detailClass = isDark
    ? 'bg-slate-900/90 border-slate-800'
    : 'bg-white border-[#D9E2E8] shadow-sm';
  const primaryTextClass = isDark ? 'text-slate-100' : 'text-[#0F172A]';
  const mutedTextClass = isDark ? 'text-slate-400' : 'text-[#5A6A80]';
  const subtleBorderClass = isDark ? 'border-slate-800' : 'border-[#E3EBF0]';

  return (
    <div className={`rounded-3xl border p-5 sm:p-7 relative mb-8 ${surfaceClass}`}>
      
      {/* Header */}
      <div className={`flex flex-col md:flex-row md:items-end justify-between mb-6 pb-5 border-b gap-4 ${subtleBorderClass}`}>
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>{shelterState === 'LIVE' ? 'Захисні споруди цивільного захисту' : shelterState === 'NOT_CONNECTED' ? 'Реєстр укриттів недоступний' : 'Каталог укриттів'}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className={`text-xl sm:text-2xl font-black ${primaryTextClass}`}>
              {shelterState === 'LIVE' ? 'Перевірені укриття та маршрутизація' : shelterState === 'NOT_CONNECTED' ? 'Укриття тимчасово недоступні' : 'Укриття та маршрутизація'}
            </h1>
            <DataFreshnessIndicator state={shelterState} theme={theme} />
          </div>
          <p className={`text-xs sm:text-sm mt-1 ${mutedTextClass}`}>
            {shelterState === 'LIVE'
              ? 'Швидкий пошук укриттів із актуальними даними джерела та маршрутом до обраної точки.'
              : shelterState === 'NOT_CONNECTED'
                ? 'Актуальні дані реєстру укриттів тимчасово недоступні. Не використовуємо локальні записи як live.'
                : 'Показано демонстраційний каталог. Актуальні дані та доступність будуть показані після підключення джерела укриттів.'}
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Пошук вулиці або назви..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-xl border pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-cyan-400 transition-colors ${isDark ? 'bg-slate-900 border-slate-700/80 text-slate-200 placeholder-slate-500' : 'bg-white border-[#CBD6E2] text-[#0F172A] placeholder-slate-400'}`}
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {[
          { id: 'ALL', label: 'Всі укриття' },
          { id: 'METRO', label: '🚇 Станції метро' },
          { id: 'GENERATOR', label: '⚡ З генератором' },
          { id: 'WIFI', label: '📶 Є Wi-Fi / Зв\'язок' },
          { id: 'ACCESSIBLE', label: '♿ Безбар\'єрні' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === tab.id
                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50'
                : isDark ? 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800' : 'bg-white text-[#5A6A80] hover:text-[#0F172A] border border-[#D9E2E8]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid of Shelters + Detail Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* List of Shelters */}
        <div className="lg:col-span-7 space-y-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
          {filteredShelters.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Укриттів за вказаними параметрами не знайдено.
            </div>
          ) : (
            filteredShelters.map((shelter) => {
              const isSelected = selectedShelter?.id === shelter.id;
              return (
                <button
                  type="button"
                  key={shelter.id}
                  onClick={() => setSelectedShelter(shelter)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                    isSelected
                      ? (isDark ? 'bg-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-950/40' : 'bg-blue-50/70 border-cyan-500/60 shadow-sm')
                      : cardClass
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          shelter.type === 'metro'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : shelter.type === 'bunker'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}>
                          {shelter.type === 'metro' ? 'МЕТРОПОЛІТЕН' : shelter.type === 'bunker' ? 'СПЕЦСХОВИЩЕ' : 'ПАРКІНГ / ПІДВАЛ'}
                        </span>
                        <span className={`text-[10px] flex items-center gap-1 ${shelterState === 'LIVE' ? 'text-emerald-400' : 'text-purple-300'}`}>
                          <CheckCircle2 className="w-3 h-3" /> {shelterState === 'LIVE' ? 'ДСНС ПЕРЕВІРЕНО' : shelterState === 'NOT_CONNECTED' ? 'ДАНІ НЕДОСТУПНІ' : 'ДЕМО-ДАНІ'}
                        </span>
                      </div>
                      <h4 className={`text-sm font-bold mt-1.5 ${primaryTextClass}`}>{shelter.name}</h4>
                      <p className={`text-xs flex items-center gap-1 mt-0.5 ${mutedTextClass}`}>
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" /> {shelter.address}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-black font-mono text-cyan-300">
                        {shelter.distanceMeters} м
                      </div>
                      <div className={`text-[10px] flex items-center gap-1 justify-end mt-0.5 ${mutedTextClass}`}>
                        <Clock className="w-3 h-3" /> ~{shelter.walkTimeMins} хв пішки
                      </div>
                    </div>
                  </div>

                  {/* Feature Badges */}
                  <div className={`flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t text-[10px] ${subtleBorderClass}`}>
                    {shelter.features.powerGenerator && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" /> Генератор
                      </span>
                    )}
                    {shelter.features.wifi && (
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1">
                        <Wifi className="w-2.5 h-2.5" /> Wi-Fi
                      </span>
                    )}
                    {shelter.features.allDayOpen && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> 24/7 Доступ
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Shelter Detail / Tactical Navigation Panel */}
        <div className={`lg:col-span-5 rounded-2xl border p-5 relative overflow-hidden ${detailClass}`}>
          {selectedShelter ? (
            <div className="space-y-4">
              <div className={`flex items-center justify-between border-b pb-3 ${subtleBorderClass}`}>
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">КАРТКА УКРИТТЯ</span>
                  <h3 className={`text-base font-black ${primaryTextClass}`}>{selectedShelter.name}</h3>
                </div>
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '10s' }} />
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className={`flex justify-between py-1 border-b ${subtleBorderClass}`}>
                  <span className={mutedTextClass}>Адреса:</span>
                  <span className={`${primaryTextClass} font-medium text-right max-w-[200px]`}>{selectedShelter.address}</span>
                </div>
                <div className={`flex justify-between py-1 border-b ${subtleBorderClass}`}>
                  <span className={mutedTextClass}>Місткість:</span>
                  <span className={`${primaryTextClass} font-mono font-bold`}>{selectedShelter.capacity} осіб</span>
                </div>
                <div className={`flex justify-between py-1 border-b ${subtleBorderClass}`}>
                  <span className={mutedTextClass}>Дистанція / Час:</span>
                  <span className="text-cyan-300 font-mono font-bold">{selectedShelter.distanceMeters}м (~{selectedShelter.walkTimeMins} хв)</span>
                </div>
                <div className={`flex justify-between py-1 border-b ${subtleBorderClass}`}>
                  <span className={mutedTextClass}>Статус верифікації:</span>
                  <span className={`${shelterState === 'LIVE' ? 'text-emerald-400' : 'text-purple-300'} font-bold`}>{shelterState === 'LIVE' ? 'Офіційний реєстр ДСНС' : shelterState === 'NOT_CONNECTED' ? 'Дані не підтверджені' : 'Демонстраційний запис'}</span>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 space-y-2">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(selectedShelter.name + ' ' + selectedShelter.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/20"
                >
                  <Navigation className="w-4 h-4" /> Прокласти маршрут на карті
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Оберіть укриття зі списку для перегляду деталей.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
