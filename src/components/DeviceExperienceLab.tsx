import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Compass,
  DatabaseZap,
  Gauge,
  Glasses,
  Home,
  Layers3,
  MapPin,
  Monitor,
  Move3d,
  Radio,
  Smartphone,
  Tablet,
  Tv,
  Watch,
  WifiOff,
} from 'lucide-react';
import {
  DEMO_SPATIAL_MODEL,
  EMPTY_SPATIAL_MODEL,
  SpatialDataMode,
  SpatialDevice,
  SpatialLayer,
  ThreatSceneModel,
} from '../data/spatialModel';

type DeviceTab = {
  id: SpatialDevice;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const DEVICE_TABS: DeviceTab[] = [
  { id: 'TV', label: 'Телевізор', description: 'пасивний екран ситуації', icon: Tv },
  { id: 'DESKTOP', label: 'Комп’ютер', description: 'повний spatial overview', icon: Monitor },
  { id: 'LAPTOP', label: 'Ноутбук', description: 'режим дослідження', icon: Monitor },
  { id: 'TABLET', label: 'Планшет', description: 'touch-first простір', icon: Tablet },
  { id: 'MOBILE', label: 'Смартфон', description: 'відповідь для тебе', icon: Smartphone },
  { id: 'WATCH', label: 'Годинник', description: 'погляд за секунду', icon: Watch },
  { id: 'CAR', label: 'Авто', description: 'мінімум відволікання', icon: Car },
  { id: 'AR', label: 'AR / VR', description: 'майбутній простір', icon: Glasses },
];

const toneClasses: Record<SpatialLayer['tone'], string> = {
  cyan: 'border-cyan-300/40 bg-cyan-400/[0.09] shadow-cyan-500/20',
  emerald: 'border-emerald-300/40 bg-emerald-400/[0.09] shadow-emerald-500/20',
  blue: 'border-blue-300/40 bg-blue-400/[0.09] shadow-blue-500/20',
  amber: 'border-amber-300/45 bg-amber-400/[0.1] shadow-amber-500/20',
  rose: 'border-rose-300/45 bg-rose-400/[0.1] shadow-rose-500/20',
  violet: 'border-violet-300/40 bg-violet-400/[0.09] shadow-violet-500/20',
};

const toneText: Record<SpatialLayer['tone'], string> = {
  cyan: 'text-cyan-200',
  emerald: 'text-emerald-200',
  blue: 'text-blue-200',
  amber: 'text-amber-200',
  rose: 'text-rose-200',
  violet: 'text-violet-200',
};

const modeLabel = (mode: SpatialDataMode) => {
  if (mode === 'LIVE') return 'THREATSERVER · LIVE';
  if (mode === 'DEMO_DATA') return 'DEMO DATA · VISUAL MODEL';
  return 'NOT CONNECTED · LIVE DATA UNAVAILABLE';
};

const SpatialCore: React.FC<{
  model: ThreatSceneModel;
  device: SpatialDevice;
  compact?: boolean;
}> = ({ model, device, compact = false }) => {
  const visibleLayers = device === 'MOBILE' || device === 'WATCH' || device === 'CAR' ? 3 : device === 'TV' ? 5 : 6;
  const layers = model.layers.slice(0, visibleLayers);
  const isUnavailable = model.dataMode === 'NOT_CONNECTED';

  return (
    <div className={`spatial-core spatial-core--${device.toLowerCase()} ${compact ? 'spatial-core--compact' : ''}`} aria-label="SIREN Spatial Intelligence Core">
      <div className="spatial-core__halo" />
      <div className="spatial-core__grid" />
      <div className="spatial-core__orbit spatial-core__orbit--one" />
      <div className="spatial-core__orbit spatial-core__orbit--two" />
      <div className="spatial-core__layers" aria-hidden="true">
        {layers.map((layer, index) => (
          <div
            className={`spatial-layer ${toneClasses[layer.tone]}`}
            key={layer.id}
            style={{ transform: `translateZ(${(layers.length - index) * (compact ? 18 : 28)}px) translateY(${index * (compact ? 12 : 18)}px) rotateX(57deg) rotateZ(-8deg)` }}
          >
            <div className="spatial-layer__shine" />
            <span className={`spatial-layer__index ${toneText[layer.tone]}`}>0{index + 1}</span>
            <span className={`spatial-layer__label ${toneText[layer.tone]}`}>{compact ? layer.shortLabel : layer.label}</span>
            <span className="spatial-layer__line" />
          </div>
        ))}
      </div>
      <svg className="spatial-core__trajectory" viewBox="0 0 520 260" fill="none" aria-hidden="true">
        <path d="M72 192 C150 170 172 96 266 115 S366 104 454 45" stroke="#fb7185" strokeWidth="3" strokeDasharray="8 12" />
        <path d="M85 210 C166 199 236 158 318 174 S407 160 472 114" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4 12" opacity=".8" />
        <circle cx="454" cy="45" r="10" fill="#fb7185" fillOpacity=".18" stroke="#fb7185" />
        <circle cx="454" cy="45" r="4" fill="#fff" />
      </svg>
      <div className="spatial-core__base" />
      {isUnavailable ? (
        <div className="spatial-core__status">
          <WifiOff className="h-4 w-4" />
          <span>Очікуємо джерело даних</span>
        </div>
      ) : (
        <div className="spatial-core__status">
          <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_14px_#fcd34d]" />
          <span>{model.region.label} · {model.risk.label}</span>
        </div>
      )}
    </div>
  );
};

const DataBadge: React.FC<{ mode: SpatialDataMode }> = ({ mode }) => (
  <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[9px] font-mono tracking-[0.12em] ${
    mode === 'LIVE' ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-200' :
    mode === 'DEMO_DATA' ? 'border-amber-300/30 bg-amber-400/10 text-amber-200' :
    'border-slate-600/60 bg-slate-950/70 text-slate-400'
  }`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {modeLabel(mode)}
  </span>
);

const StoryRail: React.FC<{ model: ThreatSceneModel }> = ({ model }) => (
  <div className="space-y-4">
    <div>
      <p className="mb-3 text-[10px] font-mono tracking-[0.2em] text-cyan-300/70">SPATIAL INTELLIGENCE CORE</p>
      <h3 className="max-w-sm text-2xl font-black tracking-tight text-white sm:text-3xl">Одна реальність. Вісім способів її побачити.</h3>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">Спільна модель даних перебудовується під відстань до екрана, тип взаємодії та рівень уваги.</p>
    </div>
    <div className="flex items-center gap-3 rounded-2xl border border-slate-700/80 bg-slate-950/50 p-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300"><Layers3 className="h-5 w-5" /></div>
      <div><div className="text-xs font-bold text-white">Шари пояснюють, а не прикрашають</div><div className="mt-1 text-[10px] text-slate-500">Дані · район · ризик · напрямок · укриття</div></div>
    </div>
    <DataBadge mode={model.dataMode} />
  </div>
);

const LiveRail: React.FC<{ model: ThreatSceneModel; compact?: boolean }> = ({ model, compact = false }) => (
  <div className="space-y-3">
    <div className="rounded-2xl border border-slate-700/80 bg-slate-950/70 p-4">
      <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-mono tracking-[0.16em] text-slate-500">ПОТОЧНА СИТУАЦІЯ</span><Radio className="h-4 w-4 text-cyan-300" /></div>
      <div className="mt-3 flex items-start justify-between gap-4"><div><div className="text-sm font-bold text-white">{model.region.label}</div><div className="mt-1 text-xs text-amber-200">{model.region.status}</div></div><div className="rounded-lg bg-amber-400/10 px-2 py-1 text-[10px] text-amber-200">{model.risk.level}</div></div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-3 text-[10px] text-slate-500"><span>Оновлено</span><span className="font-mono text-slate-300">{model.lastUpdated ?? '—'}</span></div>
    </div>
    {!compact && <div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border border-slate-700/70 bg-slate-950/50 p-3"><div className="text-[10px] text-slate-500">Активні події</div><div className="mt-1 text-2xl font-black text-white">{model.activeEvents || '—'}</div></div><div className="rounded-2xl border border-slate-700/70 bg-slate-950/50 p-3"><div className="text-[10px] text-slate-500">Впевненість</div><div className="mt-1 text-sm font-bold text-cyan-200">{model.risk.confidence}</div></div></div>}
    <div className="rounded-2xl border border-slate-700/70 bg-slate-950/45 p-3"><div className="mb-2 flex items-center justify-between text-[10px] text-slate-500"><span>Джерело / freshness</span><Clock3 className="h-3.5 w-3.5 text-cyan-300" /></div><div className="text-xs leading-5 text-slate-300">{model.dataMode === 'NOT_CONNECTED' ? 'Актуальні дані тимчасово недоступні.' : 'Кожен стан має timestamp та рівень впевненості.'}</div></div>
  </div>
);

const Timeline: React.FC<{ model: ThreatSceneModel }> = ({ model }) => (
  <div className="rounded-2xl border border-slate-700/70 bg-slate-950/55 p-4">
    <div className="mb-3 flex items-center justify-between"><span className="text-[10px] font-mono tracking-[0.16em] text-slate-500">СИНХРОНІЗОВАНА ШКАЛА</span><span className="text-[10px] text-cyan-300">drag / scrub</span></div>
    <div className="relative flex items-start justify-between gap-3">
      <div className="absolute left-2 right-2 top-2 border-t border-cyan-300/30" />
      {model.timeline.length === 0 ? <div className="relative text-xs text-slate-500">Timeline з’явиться після підключення джерела.</div> : model.timeline.map((item) => <div className="relative flex min-w-0 flex-1 flex-col gap-2" key={item.id}><span className="h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,.8)]" /><span className="text-[10px] font-mono text-slate-400">{item.time}</span><span className="truncate text-[10px] text-slate-200">{item.label}</span></div>)}
    </div>
  </div>
);

const DesktopScene: React.FC<{ model: ThreatSceneModel }> = ({ model }) => (
  <div className="device-scene device-scene--desktop">
    <StoryRail model={model} />
    <div className="min-w-0"><SpatialCore model={model} device="DESKTOP" /><Timeline model={model} /></div>
    <LiveRail model={model} />
  </div>
);

const LaptopScene: React.FC<{ model: ThreatSceneModel }> = ({ model }) => (
  <div className="device-scene device-scene--laptop">
    <div className="device-scene__map"><div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-mono tracking-[0.16em] text-cyan-300/70">INVESTIGATION MODE</p><h3 className="mt-1 text-xl font-black text-white">Карта + деталі події</h3></div><Gauge className="h-5 w-5 text-cyan-300" /></div><SpatialCore model={model} device="LAPTOP" compact /></div>
    <LiveRail model={model} compact />
    <div className="device-scene__timeline"><Timeline model={model} /></div>
  </div>
);

const TabletScene: React.FC<{ model: ThreatSceneModel }> = ({ model }) => {
  const [activeLayer, setActiveLayer] = useState(0);
  const layer = model.layers[activeLayer] ?? model.layers[0];
  return <div className="device-scene device-scene--tablet"><div className="flex items-center justify-between"><div><p className="text-[10px] font-mono tracking-[0.16em] text-cyan-300/70">TOUCH SPATIAL MODE</p><h3 className="mt-1 text-xl font-black text-white">Ситуація на дотик</h3></div><Move3d className="h-5 w-5 text-cyan-300" /></div><SpatialCore model={model} device="TABLET" /><div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => setActiveLayer((activeLayer + model.layers.length - 1) % model.layers.length)} className="rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-3 text-left text-xs text-slate-300">← Попередній шар</button><button type="button" onClick={() => setActiveLayer((activeLayer + 1) % model.layers.length)} className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-3 text-left text-xs text-cyan-100">Наступний шар →</button></div><div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/[0.06] p-4"><div className="text-[10px] font-mono tracking-[0.14em] text-cyan-200">АКТИВНИЙ ШАР · 0{activeLayer + 1}</div><div className="mt-1 text-base font-bold text-white">{layer?.label ?? 'Очікування даних'}</div><div className="mt-1 text-xs text-slate-400">{layer?.detail ?? 'Джерело ще не підключено'}</div></div></div>;
};

const MobileScene: React.FC<{ model: ThreatSceneModel }> = ({ model }) => (
  <div className="device-scene device-scene--mobile"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-mono tracking-[0.16em] text-cyan-300/70">MY REGION</p><h3 className="mt-1 text-2xl font-black text-white">Що відбувається зараз?</h3></div><Smartphone className="h-5 w-5 text-cyan-300" /></div><div className="rounded-2xl border border-amber-300/30 bg-amber-400/[0.08] p-4"><div className="flex items-center gap-2 text-amber-200"><AlertTriangle className="h-4 w-4" /><span className="text-xs font-bold">{model.risk.label}</span></div><div className="mt-2 text-sm font-bold text-white">{model.region.label}</div><div className="mt-1 text-xs text-slate-400">{model.dataMode === 'NOT_CONNECTED' ? 'Дані тимчасово недоступні' : 'Орієнтовна оцінка · не гарантія маршруту'}</div></div><SpatialCore model={model} device="MOBILE" compact /><div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-300"><div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3"><Compass className="mx-auto mb-1 h-4 w-4 text-rose-300" />Напрямок</div><div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3"><Clock3 className="mx-auto mb-1 h-4 w-4 text-amber-300" />ETA</div><div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3"><Home className="mx-auto mb-1 h-4 w-4 text-emerald-300" />Укриття</div></div><div className="mt-auto grid grid-cols-4 rounded-2xl border border-slate-700 bg-slate-950/80 p-2 text-center text-[9px] text-slate-500"><span className="rounded-xl bg-cyan-400/10 p-2 text-cyan-200">Карта</span><span className="p-2">Події</span><span className="p-2">Укриття</span><span className="p-2">Профіль</span></div></div>
);

const TVScene: React.FC<{ model: ThreatSceneModel }> = ({ model }) => (
  <div className="device-scene device-scene--tv"><div className="flex items-center justify-between border-b border-slate-700/70 pb-4"><div><p className="text-[10px] font-mono tracking-[0.2em] text-cyan-300/70">SIREN UA · SITUATIONAL DISPLAY</p><h3 className="mt-1 text-2xl font-black text-white">Стан країни зараз</h3></div><div className="text-right"><div className="text-xs text-slate-400">Поточний стан</div><div className="mt-1 text-sm font-bold text-amber-200">{model.region.status}</div></div></div><div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_250px]"><SpatialCore model={model} device="TV" /><div className="space-y-3"><div className="text-[10px] font-mono tracking-[0.16em] text-slate-500">КРИТИЧНІ ПОДІЇ</div>{(model.events.length ? model.events : [{ id: 'empty', label: 'Потік не підключено', status: 'Очікування', confidence: 'UNKNOWN', eta: '—' }]).map((event) => <div key={event.id} className="rounded-2xl border border-slate-700 bg-slate-950/75 p-4"><div className="flex items-center gap-2 text-sm font-bold text-white"><span className="h-2 w-2 rounded-full bg-rose-300" />{event.label}</div><div className="mt-2 flex justify-between gap-3 text-[10px] text-slate-400"><span>{event.status}</span><span className="text-amber-200">{event.eta}</span></div></div>)}</div></div><div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/[0.04] p-4"><div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.16em] text-slate-500"><Radio className="h-3.5 w-3.5 text-cyan-300" /> LIVE TICKER</div><div className="mt-2 text-sm text-slate-200">{model.dataMode === 'NOT_CONNECTED' ? 'Актуальні дані тимчасово недоступні.' : 'Регіони · події · джерела · часові мітки синхронізуються.'}</div></div></div>
);

const GlanceScene: React.FC<{ model: ThreatSceneModel; device: 'WATCH' | 'CAR' }> = ({ model, device }) => {
  const isWatch = device === 'WATCH';
  return <div className={`device-scene device-scene--${device.toLowerCase()}`}><div className="flex items-center justify-between"><span className="text-[10px] font-mono tracking-[0.16em] text-slate-500">{isWatch ? 'GLANCE MODE' : 'SAFE DRIVE MODE'}</span>{isWatch ? <Watch className="h-4 w-4 text-cyan-300" /> : <Car className="h-4 w-4 text-cyan-300" />}</div><div className={`mt-4 rounded-2xl border p-4 ${isWatch ? 'border-rose-300/30 bg-rose-400/[0.08]' : 'border-cyan-300/25 bg-cyan-400/[0.06]'}`}><div className="flex items-center gap-2 text-xs font-bold text-white"><span className={`h-2 w-2 rounded-full ${isWatch ? 'bg-rose-300' : 'bg-cyan-300'}`} />{model.region.label}</div><div className="mt-2 text-lg font-black text-white">{model.risk.label}</div><div className="mt-1 text-xs text-slate-400">Орієнтовно: {model.dataMode === 'NOT_CONNECTED' ? '—' : '10–15 хв'}</div></div><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" className="min-h-11 rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-3 text-xs font-bold text-cyan-100">{isWatch ? 'Відкрити карту' : 'Голосове повідомлення'}</button><button type="button" className="min-h-11 rounded-xl border border-slate-700 bg-slate-950/70 px-3 text-xs text-slate-300">{isWatch ? 'Закрити' : 'Укриття поруч'}</button></div><div className="mt-4 text-[10px] leading-4 text-slate-500">{isWatch ? 'Один погляд · одна дія.' : 'Мінімум візуальних змін під час руху.'}</div></div>;
};

const ARScene: React.FC = () => (
  <div className="device-scene device-scene--ar"><div className="flex items-start justify-between"><div><p className="text-[10px] font-mono tracking-[0.2em] text-violet-300/80">FUTURE-READY SPATIAL API</p><h3 className="mt-1 text-2xl font-black text-white">Простір, а не сторінка</h3><p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">Компоненти вже розділені так, щоб у майбутньому відобразити ту саму реальність у WebXR, AR-окулярах або VR-ситуаційній кімнаті.</p></div><Glasses className="h-6 w-6 text-violet-300" /></div><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{['SpatialScene', 'LayerStack', 'ThreatNode', 'Trajectory', 'RiskVolume', 'RegionMesh'].map((module, index) => <div key={module} className="rounded-2xl border border-violet-300/20 bg-violet-400/[0.06] p-4"><div className="text-[10px] font-mono text-violet-200">0{index + 1}</div><div className="mt-2 text-sm font-bold text-white">{module}</div><div className="mt-1 text-[10px] text-slate-500">shared spatial primitive</div></div>)}</div><div className="mt-6 inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1.5 text-[10px] font-mono text-violet-200"><CheckCircle2 className="h-3.5 w-3.5" /> FUTURE READY · БЕЗ FAKE LIVE DATA</div></div>
);

export const DeviceExperienceLab: React.FC<{ dataMode: SpatialDataMode }> = ({ dataMode }) => {
  const [activeDevice, setActiveDevice] = useState<SpatialDevice>('DESKTOP');
  const model = useMemo(() => dataMode === 'DEMO_DATA' ? DEMO_SPATIAL_MODEL : { ...EMPTY_SPATIAL_MODEL, dataMode }, [dataMode]);
  const activeTab = DEVICE_TABS.find((tab) => tab.id === activeDevice) ?? DEVICE_TABS[1];
  const renderScene = () => {
    switch (activeDevice) {
      case 'TV': return <TVScene model={model} />;
      case 'LAPTOP': return <LaptopScene model={model} />;
      case 'TABLET': return <TabletScene model={model} />;
      case 'MOBILE': return <MobileScene model={model} />;
      case 'WATCH': return <GlanceScene model={model} device="WATCH" />;
      case 'CAR': return <GlanceScene model={model} device="CAR" />;
      case 'AR': return <ARScene />;
      default: return <DesktopScene model={model} />;
    }
  };

  return <section className="device-experience-lab mt-14" aria-labelledby="device-experience-title"><div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="mb-2 text-[10px] font-mono tracking-[0.22em] text-cyan-300/70">ONE REALITY · MANY SURFACES</p><h2 id="device-experience-title" className="text-2xl font-black tracking-tight text-white sm:text-3xl">Єдина реальність. Вісім способів її побачити.</h2><p className="mt-2 max-w-2xl text-sm text-slate-400">Телевізор бачить масштаб. Смартфон — відповідь для тебе. Планшет — простір для дотику.</p></div><div className="flex items-center gap-2 text-[10px] font-mono text-slate-500"><DatabaseZap className="h-4 w-4 text-cyan-300" /> NORMALIZED DATA LAYER</div></div><div className="device-tabs" role="tablist" aria-label="Режими пристроїв">{DEVICE_TABS.map(({ id, label, icon: Icon }) => <button type="button" role="tab" aria-selected={activeDevice === id} key={id} onClick={() => setActiveDevice(id)} className={`device-tab ${activeDevice === id ? 'device-tab--active' : ''}`}><Icon className="h-4 w-4" /><span>{label}</span></button>)}</div><div className="device-stage siren-glass"><div className="mb-5 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_#67e8f9]" /><span className="text-xs font-bold text-white">{activeTab.label}</span><span className="hidden text-[10px] text-slate-500 sm:inline">· {activeTab.description}</span></div><DataBadge mode={model.dataMode} /></div>{renderScene()}<div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-4 text-[10px] text-slate-500"><span>CONFIRMED · ESTIMATED · PREDICTED · UNKNOWN</span><span className="hidden items-center gap-1 sm:flex">Безпечна візуалізація даних <ChevronRight className="h-3 w-3" /></span></div></div></section>;
};

export const TVModeShell: React.FC<{ dataMode: SpatialDataMode }> = ({ dataMode }) => {
  const model = dataMode === 'DEMO_DATA' ? DEMO_SPATIAL_MODEL : { ...EMPTY_SPATIAL_MODEL, dataMode };

  return <main className="tv-mode-shell min-h-screen bg-[#040812] px-5 py-6 text-slate-100 sm:px-10 sm:py-10" aria-label="SIREN UA TV mode"><div className="mx-auto max-w-[1800px]"><header className="mb-6 flex items-center justify-between border-b border-slate-800/80 pb-5"><div><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-400/10 text-lg text-cyan-200">✦</div><div><div className="text-lg font-black tracking-tight text-white">SIREN <span className="text-cyan-300">UA</span></div><div className="text-[9px] font-mono tracking-[0.18em] text-slate-500">SPATIAL SITUATIONAL DISPLAY</div></div></div></div><div className="flex items-center gap-3"><DataBadge mode={model.dataMode} /><span className="hidden text-xs text-slate-500 sm:inline">REMOTE READY · OK / BACK</span></div></header><TVScene model={model} /></div></main>;
};
