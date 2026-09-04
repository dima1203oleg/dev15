import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  ChevronDown,
  ChevronUp,
  Clock3,
  Compass,
  DatabaseZap,
  Home,
  Layers3,
  MapPin,
  Menu,
  Navigation,
  RefreshCcw,
  Share2,
  ShieldCheck,
  Smartphone,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react';
import { SpatialDataMode, SpatialLayer, ThreatSceneModel } from '../data/spatialModel';

type MobileMode = 'HOME' | 'TIMELINE' | 'SHELTER' | 'PARTNER' | 'PROFILE';
type BottomSheetState = 'CLOSED' | 'PEEK' | 'HALF' | 'FULL';

const mobileLayerOrder: Array<{ id: SpatialLayer['id']; label: string; tone: string }> = [
  { id: 'TRAJECTORY', label: 'Прогнозна траєкторія', tone: 'rose' },
  { id: 'RISK', label: 'Рівень ризику', tone: 'amber' },
  { id: 'PERSONAL_REGION', label: 'Мій район', tone: 'blue' },
  { id: 'SHELTERS', label: 'Укриття / базова карта', tone: 'emerald' },
];

const statusLabel = (mode: SpatialDataMode) => {
  if (mode === 'LIVE') return 'LIVE · щойно';
  if (mode === 'DEMO_DATA') return 'DEMO DATA · не для рішень у небезпеці';
  return 'NOT CONNECTED · live data недоступні';
};

const MobileHeader: React.FC<{ dataMode: SpatialDataMode; onMenu?: () => void }> = ({ dataMode, onMenu }) => (
  <header className="mobile-experience__header">
    <div className="flex items-center gap-2.5"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-400/10 text-cyan-200"><ShieldCheck className="h-5 w-5" /></div><div><div className="text-lg font-black tracking-tight text-white">SIREN <span className="text-cyan-300">UA</span></div><div className="text-[8px] font-mono tracking-[0.18em] text-slate-500">PERSONAL SPATIAL MODE</div></div></div>
    <div className="flex items-center gap-2"><span className={`mobile-data-pill mobile-data-pill--${dataMode.toLowerCase()}`}>{dataMode === 'LIVE' ? 'LIVE' : dataMode === 'DEMO_DATA' ? 'DEMO' : 'OFFLINE'}</span><button type="button" className="mobile-icon-button" onClick={onMenu} aria-label="Відкрити меню"><Menu className="h-5 w-5" /></button></div>
  </header>
);

const MobileRiskCard: React.FC<{ model: ThreatSceneModel; focused: boolean; onRegion: () => void; onFocus: () => void }> = ({ model, focused, onRegion, onFocus }) => {
  const isUnavailable = model.dataMode === 'NOT_CONNECTED';
  const leadEvent = model.events[0];
  const leadTrajectory = model.trajectories[0];
  return <section className={`mobile-risk-card ${focused ? 'mobile-risk-card--focused' : ''}`} aria-labelledby="mobile-risk-title"><button type="button" className="mobile-region-selector" onClick={onRegion}><span><span className="mobile-eyebrow">МІЙ РАЙОН</span><span className="mt-1 block text-lg font-black text-white">{isUnavailable ? 'Регіон не визначено' : model.region.label}</span></span><ChevronDown className="h-5 w-5 text-cyan-300" /></button><div className="mt-5 flex items-end justify-between gap-4"><div><div className="flex items-center gap-2 text-amber-200"><span className="h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_14px_#fcd34d]" /><span className="text-sm font-bold">{isUnavailable ? 'Актуальні дані недоступні' : model.risk.label}</span></div><h1 id="mobile-risk-title" className="mt-2 text-3xl font-black tracking-tight text-white">{isUnavailable ? 'Очікуємо підключення' : 'Ситуація для тебе'}</h1><div className="mt-2 flex items-center gap-2 text-xs text-slate-400"><Clock3 className="h-3.5 w-3.5 text-cyan-300" />{model.lastUpdated ? `Оновлено ${model.lastUpdated}` : 'Останнє оновлення відсутнє'}</div></div><div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-right"><div className="text-[10px] text-slate-400">СТАН</div><div className="mt-1 text-sm font-black text-amber-200">{model.risk.level}</div></div></div><div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-slate-700/70 bg-slate-950/40 p-3"><div className="flex min-w-0 items-center gap-2"><Navigation className="h-4 w-4 shrink-0 text-rose-300" /><div className="min-w-0"><div className="text-xs font-bold text-white">{isUnavailable ? 'Напрямок недоступний' : leadTrajectory?.direction ?? 'Напрямок не надано'}</div><div className="mt-1 text-[11px] text-slate-400">{isUnavailable ? 'Немає авторитетного потоку' : `${leadTrajectory?.confidence ?? leadEvent?.confidence ?? 'UNKNOWN'} · не гарантія`}</div></div></div><div className="shrink-0 text-right"><div className="text-[9px] text-slate-500">ОРІЄНТОВНИЙ ЧАС</div><div className="mt-1 text-sm font-black text-white">{isUnavailable ? '—' : leadEvent?.eta ?? '—'}</div></div><button type="button" onClick={onFocus} className="mobile-small-action">Деталі <ArrowRight className="h-3.5 w-3.5" /></button></div></section>;
};

const MobileSpatialMap: React.FC<{ model: ThreatSceneModel; activeLayer: number; selectedRegion: boolean; onSwipe: (direction: 'up' | 'down') => void; onTap: () => void }> = ({ model, activeLayer, selectedRegion, onSwipe, onTap }) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const layers = mobileLayerOrder.map((entry) => ({ ...entry, source: model.layers.find((layer) => layer.id === entry.id) })).filter((entry) => entry.source);
  const active = layers[activeLayer] ?? layers[0];

  return <div className={`mobile-spatial-map ${selectedRegion ? 'mobile-spatial-map--selected' : ''}`} onTouchStart={(event) => setTouchStart(event.touches[0]?.clientY ?? null)} onTouchEnd={(event) => { if (touchStart === null) return; const delta = (event.changedTouches[0]?.clientY ?? touchStart) - touchStart; if (Math.abs(delta) > 28) onSwipe(delta < 0 ? 'up' : 'down'); setTouchStart(null); }} onClick={onTap} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onTap(); }} aria-label="Персональна 3D-карта. Торкніться для деталей, проведіть вгору або вниз для перемикання шарів."><div className="mobile-spatial-map__halo" /><div className="mobile-spatial-map__grid" /><div className="mobile-spatial-map__layers" aria-hidden="true">{layers.map((layer, index) => <div key={layer.id} className={`mobile-spatial-layer mobile-spatial-layer--${layer.tone} ${index === activeLayer ? 'mobile-spatial-layer--active' : ''}`} style={{ transform: `translateZ(${(layers.length - index) * 18}px) translateY(${index * 13}px) rotateX(57deg) rotateZ(-8deg)` }}><span className="mobile-spatial-layer__number">0{index + 1}</span><span>{layer.source?.label ?? layer.label}</span><span className="mobile-spatial-layer__line" /></div>)}</div>{model.trajectories.length > 0 && <svg className="mobile-spatial-map__path" viewBox="0 0 360 250" fill="none" aria-hidden="true"><path d="M42 190 C110 164 130 88 200 112 S276 111 321 42" stroke="#fb7185" strokeWidth="3" strokeDasharray="7 10" /><path d="M42 190 C110 164 130 88 200 112" stroke="#fff" strokeWidth="2" strokeDasharray="1 10" /><circle cx="321" cy="42" r="9" fill="#fb7185" fillOpacity=".2" stroke="#fb7185" /><circle cx="321" cy="42" r="3" fill="#fff" /></svg>}<div className="mobile-spatial-map__marker mobile-spatial-map__marker--personal"><MapPin className="h-3.5 w-3.5" />{model.dataMode === 'NOT_CONNECTED' ? 'Мій район' : model.region.label}</div><div className="mobile-spatial-map__active-label"><Layers3 className="h-3.5 w-3.5" />{active?.label ?? 'Шар очікує дані'}</div><div className="mobile-spatial-map__hint"><ChevronUp className="h-3.5 w-3.5" /> Swipe між шарами <ChevronDown className="h-3.5 w-3.5" /></div></div>;
};

const MobileQuickActions: React.FC<{ model: ThreatSceneModel; onShelters: () => void; onTimeline: () => void }> = ({ model, onShelters, onTimeline }) => <div className="grid grid-cols-2 gap-3"><button type="button" onClick={onTimeline} className="mobile-quick-card"><Clock3 className="h-5 w-5 text-cyan-300" /><span><strong>Хронологія</strong><small>{model.timeline.length ? 'Останні оновлення' : 'Недоступна без потоку'}</small></span><ArrowRight className="ml-auto h-4 w-4 text-slate-500" /></button><button type="button" onClick={onShelters} className="mobile-quick-card"><Home className="h-5 w-5 text-emerald-300" /><span><strong>Укриття поруч</strong><small>{model.shelters.length ? `${model.shelters.length} · джерело` : 'Дані недоступні'}</small></span><ArrowRight className="ml-auto h-4 w-4 text-slate-500" /></button></div>;

const MobileTimeline: React.FC<{ model: ThreatSceneModel; onLive: () => void; isLive: boolean }> = ({ model, onLive, isLive }) => <section className="mobile-content-section"><div className="flex items-start justify-between gap-3"><div><div className="mobile-eyebrow">TIMELINE</div><h2 className="mt-1 text-2xl font-black text-white">Історія змін</h2></div>{isLive ? <span className="mobile-live-label"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> LIVE</span> : <button type="button" onClick={onLive} className="mobile-live-button">Повернутися в LIVE</button>}</div>{!model.timeline.length ? <div className="mobile-empty-state"><WifiOffIcon /> Актуальна timeline з’явиться після підключення джерела.</div> : <div className="mobile-timeline-list">{model.timeline.map((item, index) => <div key={item.id} className="mobile-timeline-item"><div className="mobile-timeline-rail"><span className={`mobile-timeline-dot mobile-timeline-dot--${item.tone}`} /></div><div><div className="text-xs font-mono text-cyan-200">{item.time}</div><div className="mt-1 text-sm font-bold text-white">{item.label}</div><div className="mt-1 text-xs text-slate-500">{index === model.timeline.length - 1 ? 'Останнє оновлення' : 'Подія в історії'}</div></div></div>)}</div>}</section>;

const WifiOffIcon: React.FC = () => <RefreshCcw className="h-4 w-4 text-slate-500" />;

const MobileShelters: React.FC<{ model: ThreatSceneModel }> = ({ model }) => <section className="mobile-content-section"><div className="mobile-eyebrow">SHELTER MODE</div><h2 className="mt-1 text-2xl font-black text-white">Укриття поруч</h2><p className="mt-2 text-sm leading-5 text-slate-400">Показуємо лише дані, отримані від підключеного джерела. Статус доступності не вигадуємо.</p>{!model.shelters.length ? <div className="mobile-empty-state"><Home className="h-4 w-4 text-emerald-300" /> Дані про укриття тимчасово недоступні.</div> : <div className="mt-5 space-y-3">{model.shelters.map((shelter) => <div className="mobile-shelter-card" key={shelter.id}><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300"><Home className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="text-sm font-bold text-white">{shelter.label}</div><div className="mt-1 text-xs text-slate-400">{shelter.distance} · пішохідний час не надано</div><div className="mt-1 text-[10px] text-emerald-200">Статус: {shelter.status} · {model.dataMode === 'DEMO_DATA' ? 'DEMO DATA' : 'джерело'}</div></div><button type="button" className="mobile-icon-button" aria-label={`Маршрут до ${shelter.label} недоступний без картографічного сервісу`} disabled title="Потрібен підключений картографічний сервіс"><Navigation className="h-4 w-4" /></button></div>)}</div>}</section>;

const MobilePartnerHome: React.FC<{ model: ThreatSceneModel; onInvite: () => void }> = ({ model, onInvite }) => <section className="mobile-content-section"><div className="mobile-eyebrow">PARTNER · ОКРЕМО ВІД SAFETY FLOW</div><h2 className="mt-1 text-2xl font-black text-white">Партнерський простір</h2><p className="mt-2 text-sm leading-5 text-slate-400">Користуйся продуктом. Рекомендуй його. Отримуй винагороду за кваліфікованих платних користувачів.</p><div className="mobile-partner-card"><div className="flex items-center justify-between"><div><div className="text-[10px] font-mono text-violet-200">SIREN UA PARTNER</div><div className="mt-1 text-xl font-black text-white">{model.dataMode === 'DEMO_DATA' ? 'GOLD · 20%' : 'Ранг очікує дані'}</div></div><WalletCards className="h-6 w-6 text-violet-300" /></div><div className="mt-5 grid grid-cols-2 gap-2"><div><div className="text-[10px] text-slate-500">L1</div><div className="mt-1 text-2xl font-black text-white">{model.dataMode === 'DEMO_DATA' ? '154' : '—'}</div></div><div><div className="text-[10px] text-slate-500">L2</div><div className="mt-1 text-2xl font-black text-white">{model.dataMode === 'DEMO_DATA' ? '327' : '—'}</div></div></div><div className="mt-4 rounded-xl border border-violet-300/20 bg-violet-400/10 p-3 text-xs text-violet-100">{model.dataMode === 'DEMO_DATA' ? 'DEMO DATA · приклад інтерфейсу, не фінансовий баланс' : 'Реальні партнерські дані ще не підключені.'}</div><button type="button" onClick={onInvite} className="mobile-primary-button mt-4 w-full"><Share2 className="h-4 w-4" /> Запросити</button></div></section>;

const MobileProfile: React.FC = () => <section className="mobile-content-section"><div className="mobile-eyebrow">PROFILE</div><h2 className="mt-1 text-2xl font-black text-white">Налаштування досвіду</h2><div className="mt-5 space-y-3"><div className="mobile-setting-row"><UserRound className="h-5 w-5 text-cyan-300" /><span><strong>Персональний район</strong><small>Керуйте збереженими зонами</small></span><ChevronDown className="ml-auto h-4 w-4 text-slate-500" /></div><div className="mobile-setting-row"><Bell className="h-5 w-5 text-amber-300" /><span><strong>Сповіщення</strong><small>Лише важливі зміни ризику</small></span><ChevronDown className="ml-auto h-4 w-4 text-slate-500" /></div><div className="mobile-setting-row"><ShieldCheck className="h-5 w-5 text-emerald-300" /><span><strong>Безпека даних</strong><small>Факт · оцінка · прогноз · unknown</small></span><ChevronDown className="ml-auto h-4 w-4 text-slate-500" /></div></div></section>;

const MobileBottomSheet: React.FC<{ state: BottomSheetState; model: ThreatSceneModel; onClose: () => void; onState: (state: BottomSheetState) => void; onShelters: () => void; onTimeline: () => void }> = ({ state, model, onClose, onState, onShelters, onTimeline }) => {
  if (state === 'CLOSED') return null;
  const isUnavailable = model.dataMode === 'NOT_CONNECTED';
  const leadEvent = model.events[0];
  const leadTrajectory = model.trajectories[0];
  return <div className={`mobile-bottom-sheet mobile-bottom-sheet--${state.toLowerCase()}`} role="dialog" aria-modal="false" aria-label="Деталі регіону"><div className="mobile-bottom-sheet__handle" /><div className="flex items-start justify-between gap-3"><button type="button" onClick={() => onState(state === 'PEEK' ? 'HALF' : 'PEEK')} className="min-h-11 flex-1 text-left"><div className="mobile-eyebrow">{state === 'PEEK' ? 'PEEK · НАТИСНІТЬ ДЛЯ ДЕТАЛЕЙ' : 'РЕГІОНАЛЬНА ДЕТАЛІЗАЦІЯ'}</div><div className="mt-1 text-lg font-black text-white">{model.region.label}</div><div className="mt-1 text-xs text-amber-200">{isUnavailable ? 'Дані тимчасово недоступні' : model.risk.label}</div></button><button type="button" onClick={onClose} className="mobile-icon-button" aria-label="Закрити деталі"><X className="h-5 w-5" /></button></div>{state !== 'PEEK' && <div className="mt-4 space-y-3"><div className="grid grid-cols-2 gap-2"><div className="mobile-sheet-stat"><span>Тип</span><strong>{isUnavailable ? '—' : leadEvent?.label ?? '—'}</strong></div><div className="mobile-sheet-stat"><span>Напрямок</span><strong>{isUnavailable ? '—' : leadTrajectory?.direction ?? '—'}</strong></div><div className="mobile-sheet-stat"><span>Орієнтовний час</span><strong>{isUnavailable ? '—' : leadEvent?.eta ?? '—'}</strong></div><div className="mobile-sheet-stat"><span>Впевненість</span><strong>{leadEvent?.confidence ?? model.risk.confidence}</strong></div></div>{state === 'FULL' && <div className="mobile-sheet-source"><DatabaseZap className="h-4 w-4 text-cyan-300" /><span>Оновлено: {model.lastUpdated ?? '—'} · {statusLabel(model.dataMode)}</span></div>}<div className="grid grid-cols-2 gap-2"><button type="button" onClick={onTimeline} className="mobile-secondary-button">Хронологія</button><button type="button" onClick={onShelters} className="mobile-primary-button">Укриття <ArrowRight className="h-4 w-4" /></button></div>{state === 'HALF' && <button type="button" onClick={() => onState('FULL')} className="flex min-h-11 w-full items-center justify-center gap-2 text-xs text-cyan-200">Більше деталей <ChevronUp className="h-4 w-4" /></button>}</div>}</div>;
};

const MobileBottomNav: React.FC<{ activeMode: MobileMode; onChange: (mode: MobileMode) => void }> = ({ activeMode, onChange }) => <nav className="mobile-bottom-nav" aria-label="Основна mobile навігація">{([['HOME', 'Карта', MapPin], ['TIMELINE', 'Хронологія', Clock3], ['SHELTER', 'Укриття', Home], ['PARTNER', 'Партнер', Share2], ['PROFILE', 'Профіль', UserRound]] as const).map(([mode, label, Icon]) => <button type="button" key={mode} onClick={() => onChange(mode)} className={activeMode === mode ? 'mobile-bottom-nav__item mobile-bottom-nav__item--active' : 'mobile-bottom-nav__item'}><Icon className="h-4 w-4" /><span>{label}</span></button>)}</nav>;

export const MobileExperience: React.FC<{ model: ThreatSceneModel; onDownload?: () => void }> = ({ model, onDownload }) => {
  const [activeMode, setActiveMode] = useState<MobileMode>('HOME');
  const [sheetState, setSheetState] = useState<BottomSheetState>('CLOSED');
  const [activeLayer, setActiveLayer] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState(false);
  const [isAlertFocus, setIsAlertFocus] = useState(false);
  const isLive = model.dataMode === 'LIVE' || model.dataMode === 'DEMO_DATA';
  const layerCount = useMemo(() => Math.max(1, mobileLayerOrder.filter((layer) => model.layers.some((source) => source.id === layer.id)).length), [model.layers]);

  const setMode = (mode: MobileMode) => { setActiveMode(mode); if (mode !== 'HOME') setSheetState('CLOSED'); };
  const openDetails = (state: BottomSheetState = 'HALF') => { setSelectedRegion(true); setSheetState(state); };
  const swipeLayer = (direction: 'up' | 'down') => setActiveLayer((current) => direction === 'up' ? (current + 1) % layerCount : (current + layerCount - 1) % layerCount);
  const handleInvite = async () => {
    const referralUrl = `${window.location.origin}/join/sirenua`;
    if (navigator.share) {
      await navigator.share({ title: 'SIREN UA', text: 'Розумій ситуацію.', url: referralUrl }).catch(() => undefined);
      return;
    }
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(referralUrl);
    } catch {
      // Clipboard may be unavailable outside a secure context.
    }
  };
  const handleDownload = onDownload ?? (() => { window.location.href = '/#download-section'; });

  return <main className={`mobile-experience ${isAlertFocus ? 'mobile-experience--alert-focus' : ''}`} aria-label="SIREN UA smartphone experience"><MobileHeader dataMode={model.dataMode} onMenu={() => setMode('PROFILE')} /><div className="mobile-experience__content">{activeMode === 'HOME' && <><div className="mobile-freshness"><span className={`mobile-freshness__dot mobile-freshness__dot--${model.dataMode.toLowerCase()}`} /><span>{statusLabel(model.dataMode)}</span></div><MobileRiskCard model={model} focused={isAlertFocus} onRegion={() => openDetails('PEEK')} onFocus={() => { setIsAlertFocus(true); openDetails('HALF'); }} /><div className="mobile-map-label"><span>PERSONAL REGION STACK</span><span>01 / 04</span></div><MobileSpatialMap model={model} activeLayer={activeLayer} selectedRegion={selectedRegion} onSwipe={swipeLayer} onTap={() => openDetails('HALF')} /><div className="mobile-eta-card"><div className="flex items-center gap-2 text-cyan-200"><Clock3 className="h-4 w-4" /><span className="mobile-eyebrow">ОРІЄНТОВНИЙ ЧАС</span></div><div className="mt-2 flex items-end justify-between gap-3"><strong>{model.events[0]?.eta ?? '—'}</strong><span>{model.dataMode === 'NOT_CONNECTED' ? 'За поточними даними недоступно' : 'за поточними даними · не гарантія'}</span></div></div><MobileQuickActions model={model} onShelters={() => setMode('SHELTER')} onTimeline={() => setMode('TIMELINE')} />{!isAlertFocus && <div className="mobile-download-card"><div><div className="mobile-eyebrow">SIREN UA APP</div><div className="mt-1 text-sm font-bold text-white">Завантажте персональну версію</div></div><button type="button" onClick={handleDownload} className="mobile-primary-button">Завантажити <ArrowRight className="h-4 w-4" /></button></div>}</>}{activeMode === 'TIMELINE' && <MobileTimeline model={model} isLive={isLive} onLive={() => setMode('HOME')} />}{activeMode === 'SHELTER' && <MobileShelters model={model} />}{activeMode === 'PARTNER' && <MobilePartnerHome model={model} onInvite={handleInvite} />}{activeMode === 'PROFILE' && <MobileProfile />}</div><MobileBottomSheet state={sheetState} model={model} onClose={() => setSheetState('CLOSED')} onState={setSheetState} onShelters={() => setMode('SHELTER')} onTimeline={() => setMode('TIMELINE')} /><MobileBottomNav activeMode={activeMode} onChange={(mode) => { setIsAlertFocus(false); setMode(mode); }} /></main>;
};

export const MobileModeShell: React.FC<{ model: ThreatSceneModel; onDownload?: () => void }> = ({ model, onDownload }) => <div className="mobile-mode-shell"><MobileExperience model={model} onDownload={onDownload} /></div>;
