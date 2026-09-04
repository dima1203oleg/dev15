import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Compass,
  Database,
  Home,
  Layers3,
  MapPin,
  Maximize2,
  Menu,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Target,
  Users,
  WifiOff,
  X,
} from 'lucide-react';
import {
  SpatialDataMode,
  SpatialLayer,
  SpatialLayerKey,
  ThreatSceneModel,
} from '../data/spatialModel';

type TabletMode = 'OVERVIEW' | 'EVENTS' | 'TIMELINE' | 'SHELTERS' | 'PARTNER' | 'PROFILE' | 'PRESENTATION' | 'ALERT_FOCUS';
type PanelMode = 'COMPACT' | 'STANDARD' | 'EXPANDED';
type Orientation = 'PORTRAIT' | 'LANDSCAPE';

export type TabletSceneState = {
  orientation: Orientation;
  mode: TabletMode;
  selectedRegion: string | null;
  personalRegion: string;
  activeLayers: SpatialLayerKey[];
  selectedLayer: SpatialLayerKey;
  selectedEvent: string | null;
  contextPanelMode: PanelMode;
  liveMode: boolean;
  timelinePosition: number;
  layerSeparation: number;
};

const layerOrder: SpatialLayerKey[] = ['LIVE_DATA', 'SHELTERS', 'PERSONAL_REGION', 'RISK', 'TRAJECTORY', 'EVENTS'];
const layerTone: Record<SpatialLayerKey, string> = {
  LIVE_DATA: 'tablet-layer--cyan',
  SHELTERS: 'tablet-layer--emerald',
  PERSONAL_REGION: 'tablet-layer--blue',
  RISK: 'tablet-layer--amber',
  TRAJECTORY: 'tablet-layer--rose',
  EVENTS: 'tablet-layer--violet',
};

const tabletModeLabel: Record<TabletMode, string> = {
  OVERVIEW: 'Ситуація',
  EVENTS: 'Події',
  TIMELINE: 'Хронологія',
  SHELTERS: 'Укриття',
  PARTNER: 'Партнер',
  PROFILE: 'Профіль',
  PRESENTATION: 'Презентація',
  ALERT_FOCUS: 'Фокус уваги',
};


const freshnessLabel = (model: ThreatSceneModel) => {
  if (model.dataMode === 'LIVE') return model.lastUpdated ? `LIVE · ${model.lastUpdated}` : 'LIVE · оновлюється';
  if (model.dataMode === 'DEMO_DATA') return `DEMO DATA · ${model.lastUpdated ?? 'fixture'}`;
  return 'NOT CONNECTED · дані недоступні';
};

const statusCopy = (model: ThreatSceneModel) => model.dataMode === 'NOT_CONNECTED'
  ? 'Актуальні дані тимчасово недоступні.'
  : model.dataMode === 'DEMO_DATA'
    ? 'Демонстраційний режим · не є оперативним джерелом.'
    : `Оновлено ${model.lastUpdated ?? 'щойно'}`;

const DataMark: React.FC<{ model: ThreatSceneModel }> = ({ model }) => (
  <span className={`tablet-data-mark tablet-data-mark--${model.dataMode.toLowerCase()}`}>
    <span className="tablet-data-mark__dot" /> {freshnessLabel(model)}
  </span>
);

const TabletHeader: React.FC<{
  model: ThreatSceneModel;
  onPresentation: () => void;
  onReset: () => void;
  presentation: boolean;
}> = ({ model, onPresentation, onReset, presentation }) => (
  <header className="tablet-header">
    <div className="tablet-brand">
      <div className="tablet-brand__mark">✦</div>
      <div><strong>SIREN <span>UA</span></strong><small>TOUCH SPATIAL INTELLIGENCE</small></div>
    </div>
    <div className="tablet-header__state"><DataMark model={model} /><span className="tablet-header__mode">{presentation ? 'PRESENTATION MODE' : 'SPATIAL DECK'}</span></div>
    <div className="tablet-header__actions">
      <button type="button" className="tablet-icon-button" onClick={onReset} aria-label="Скинути стан карти" title="Скинути стан"><RotateCcw size={17} /></button>
      <button type="button" className={`tablet-presentation-button ${presentation ? 'is-active' : ''}`} onClick={onPresentation} aria-pressed={presentation}><Sparkles size={16} /> <span>{presentation ? 'Вийти з показу' : 'Як це працює'}</span></button>
      <button type="button" className="tablet-icon-button tablet-menu-button" aria-label="Меню недоступне у цьому режимі" title="Навігація доступна через панель режимів" disabled><Menu size={20} /></button>
    </div>
  </header>
);

const TabletSpatialDeck: React.FC<{
  model: ThreatSceneModel;
  state: TabletSceneState;
  onLayer: (id: SpatialLayerKey) => void;
  onSeparate: (value: number) => void;
  onRegion: () => void;
  onZoom: (delta: number) => void;
}> = ({ model, state, onLayer, onSeparate, onRegion, onZoom }) => {
  const touchStart = useRef<{ y: number; distance?: number } | null>(null);
  const selectedIndex = Math.max(0, layerOrder.indexOf(state.selectedLayer));
  const visibleLayers = model.layers.filter((layer) => state.activeLayers.includes(layer.id)).slice(-6);
  const displayLayers = visibleLayers.length ? visibleLayers : model.layers.slice(0, 4);

  const onTouchStart = (event: React.TouchEvent) => {
    const first = event.touches[0];
    const second = event.touches[1];
    const distance = second ? Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY) : undefined;
    touchStart.current = { y: first.clientY, distance };
  };
  const onTouchEnd = (event: React.TouchEvent) => {
    const start = touchStart.current;
    if (!start) return;
    const end = event.changedTouches[0];
    const deltaY = start.y - end.clientY;
    if (Math.abs(deltaY) > 34) {
      const nextIndex = (selectedIndex + (deltaY > 0 ? 1 : layerOrder.length - 1)) % layerOrder.length;
      onLayer(layerOrder[nextIndex]);
    }
    touchStart.current = null;
  };
  const onTouchMove = (event: React.TouchEvent) => {
    if (event.touches.length < 2 || !touchStart.current?.distance) return;
    const [first, second] = [event.touches[0], event.touches[1]];
    const nextDistance = Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
    onZoom((nextDistance - touchStart.current.distance) / 170);
    touchStart.current.distance = nextDistance;
  };

  return <section className="tablet-deck-panel" aria-label="Інтерактивна просторова карта">
    <div className="tablet-deck-heading"><div><span className="tablet-kicker">INTERACTIVE SPATIAL MAP DECK</span><h1>{state.mode === 'ALERT_FOCUS' ? 'Фокус на події' : 'Ситуація, яку можна розкласти'}</h1></div><div className="tablet-deck-tools"><button type="button" className="tablet-icon-button" onClick={() => onSeparate(state.layerSeparation > 0.5 ? 0.16 : 0.82)} aria-label="Розсунути шари" aria-pressed={state.layerSeparation > 0.5}><Layers3 size={18} /></button><span className="tablet-gesture-hint">свайп · pinch · tap</span></div></div>
    <div className={`tablet-spatial-deck ${state.mode === 'ALERT_FOCUS' ? 'tablet-spatial-deck--alert' : ''}`} style={{ ['--tablet-zoom' as string]: state.layerSeparation > 0.6 ? 1.04 : 0.96 }} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div className="tablet-deck-ambient" aria-hidden="true"><div className="tablet-deck-ambient__grid" /><div className="tablet-deck-ambient__halo tablet-deck-ambient__halo--blue" /><div className="tablet-deck-ambient__halo tablet-deck-ambient__halo--amber" /><div className="tablet-deck-ambient__scan" /><div className="tablet-deck-ambient__readout"><span>SPATIAL CORE</span><b>{model.dataMode === 'DEMO_DATA' ? 'SIMULATION' : model.dataMode === 'LIVE' ? 'LIVE FEED' : 'WAITING FOR SOURCE'}</b></div>{model.dataMode === 'DEMO_DATA' && <><i className="tablet-deck-beacon tablet-deck-beacon--one" /><i className="tablet-deck-beacon tablet-deck-beacon--two" /><i className="tablet-deck-beacon tablet-deck-beacon--three" /><span className="tablet-deck-arc tablet-deck-arc--one" /><span className="tablet-deck-arc tablet-deck-arc--two" /></>}</div>
      <div className="tablet-deck-orbit tablet-deck-orbit--one" /><div className="tablet-deck-orbit tablet-deck-orbit--two" />
      <button type="button" className="tablet-deck-region-hit" onClick={onRegion} aria-label={`Відкрити регіон ${state.personalRegion}`}>
        <span className="tablet-deck-region-pin"><MapPin size={17} /></span><strong>{state.personalRegion}</strong><small>обрана зона · натисніть для деталей</small>
      </button>
      <div className="tablet-deck-stack" role="group" aria-label="Шари карти">
        {displayLayers.map((layer: SpatialLayer, index) => {
          const active = layer.id === state.selectedLayer;
          const reverseIndex = displayLayers.length - index - 1;
          return <button type="button" key={layer.id} className={`tablet-layer ${layerTone[layer.id]} ${active ? 'is-selected' : ''}`} style={{ ['--tablet-layer-index' as string]: reverseIndex, ['--tablet-layer-gap' as string]: state.layerSeparation }} onClick={() => onLayer(layer.id)} aria-pressed={active}>
            <span className="tablet-layer__edge" /><span><b>{layer.label}</b><small>{layer.detail}</small></span><ChevronRight size={15} />
          </button>;
        })}
      </div>
      {model.dataMode === 'NOT_CONNECTED' ? <div className="tablet-deck-fallback"><WifiOff size={18} /><span>2.5D FALLBACK · {statusCopy(model)}</span></div> : <div className="tablet-deck-signal"><Radio size={14} /> {model.dataMode === 'DEMO_DATA' ? 'DEMO VISUALIZATION' : 'LIVE SCENE'}</div>}
    </div>
    <div className="tablet-deck-controls"><div className="tablet-layer-strip" aria-label="Керування шарами">{displayLayers.map((layer) => <button type="button" key={layer.id} className={layer.id === state.selectedLayer ? 'is-active' : ''} onClick={() => onLayer(layer.id)} aria-pressed={layer.id === state.selectedLayer}><span className={`tablet-layer-dot ${layerTone[layer.id]}`} />{layer.shortLabel}</button>)}</div><div className="tablet-separation-control"><span>Глибина шарів</span><input type="range" min="0" max="1" step="0.01" value={state.layerSeparation} onChange={(event) => onSeparate(Number(event.target.value))} aria-label="Глибина розділення шарів" /></div></div>
  </section>;
};

const TabletRegionSelector: React.FC<{ model: ThreatSceneModel; current: string; onClose: () => void; onSelect: (region: string) => void }> = ({ model, current, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const regions = ['Київська область', 'Бучанський район', 'Львівська область', 'Одеська область', 'Харківська область', 'Дніпропетровська область'];
  const filtered = regions.filter((region) => region.toLowerCase().includes(query.toLowerCase()));
  return <div className="tablet-sheet-backdrop" role="presentation" onClick={onClose}><section className="tablet-selector-sheet" role="dialog" aria-modal="true" aria-labelledby="tablet-region-title" onClick={(event) => event.stopPropagation()}>
    <div className="tablet-sheet-handle" /><div className="tablet-sheet-heading"><div><span className="tablet-kicker">PERSONAL CONTEXT</span><h2 id="tablet-region-title">Обрати мій район</h2></div><button type="button" className="tablet-icon-button" onClick={onClose} aria-label="Закрити"><X size={19} /></button></div>
    <label className="tablet-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Пошук області або району" autoFocus /></label>
    <div className="tablet-selector-grid"><div><span className="tablet-section-label">ОБЛАСТІ / РАЙОНИ</span><div className="tablet-selector-list">{filtered.map((region) => <button type="button" key={region} className={region === current ? 'is-selected' : ''} onClick={() => onSelect(region)}><MapPin size={15} />{region}<ChevronRight size={15} /></button>)}{filtered.length === 0 && <p className="tablet-empty-copy">Нічого не знайдено.</p>}</div></div><div className="tablet-selector-side"><span className="tablet-section-label">ЗБЕРЕЖЕНІ</span><button type="button" className="tablet-saved-area" onClick={() => onSelect(current)}><Home size={16} /><span><b>Мій район</b><small>{current}</small></span><CheckCircle2 size={16} /></button><button type="button" className="tablet-saved-area tablet-saved-area--muted" onClick={() => onSelect('Поточна локація')}><Target size={16} /><span><b>Поточна локація</b><small>потрібен дозвіл браузера</small></span></button><p className="tablet-privacy-note">Розташування використовується лише для персонального відображення.</p></div></div>
    <div className="tablet-sheet-footnote"><Database size={14} /> {model.dataMode === 'DEMO_DATA' ? 'ДЕМОНСТРАЦІЯ · вибір не підключає live-профіль' : 'Обраний район синхронізується з профілем після авторизації'}</div>
  </section></div>;
};

const TabletContextPanel: React.FC<{ model: ThreatSceneModel; state: TabletSceneState; onMode: (mode: TabletMode) => void; onEvent: (id: string) => void; onPanel: (mode: PanelMode) => void }> = ({ model, state, onMode, onEvent, onPanel }) => {
  const event = model.events.find((item) => item.id === state.selectedEvent) ?? model.events[0];
  const compact = state.contextPanelMode === 'COMPACT';
  const expanded = state.contextPanelMode === 'EXPANDED';
  return <aside className={`tablet-context-panel tablet-context-panel--${state.contextPanelMode.toLowerCase()}`} aria-label="Контекст ситуації">
    <div className="tablet-panel-heading"><div><span className="tablet-kicker">CONTEXT PANEL</span><h2>Поточна ситуація</h2></div><div className="tablet-panel-mode-buttons">{(['COMPACT', 'STANDARD', 'EXPANDED'] as PanelMode[]).map((mode) => <button type="button" key={mode} onClick={() => onPanel(mode)} className={state.contextPanelMode === mode ? 'is-active' : ''} aria-label={`Режим ${mode.toLowerCase()}`}>{mode === 'COMPACT' ? '–' : mode === 'STANDARD' ? '□' : '＋'}</button>)}</div></div>
    <div className="tablet-status-card"><div className="tablet-status-card__top"><span className="tablet-status-icon"><AlertTriangle size={17} /></span><span className="tablet-status-label">{model.risk.label}</span><span className="tablet-status-live">{model.dataMode === 'LIVE' ? 'LIVE' : model.dataMode === 'DEMO_DATA' ? 'DEMO' : 'OFFLINE'}</span></div><strong>{state.personalRegion}</strong><small>{statusCopy(model)}</small></div>
    {!compact && <>
      <div className="tablet-panel-actions"><button type="button" onClick={() => onMode('ALERT_FOCUS')}><AlertTriangle size={15} />Фокус уваги</button><button type="button" onClick={() => onMode('SHELTERS')}><Home size={15} />Укриття</button><button type="button" onClick={() => onMode('TIMELINE')}><Clock3 size={15} />Час</button></div>
      <div className="tablet-context-stat-grid"><div><span>АКТИВНІ ПОДІЇ</span><b>{model.dataMode === 'NOT_CONNECTED' ? '—' : model.activeEvents}</b></div><div><span>НАПРЯМОК</span><b>{model.trajectories[0]?.direction ?? '—'}</b></div><div><span>ОРІЄНТОВНИЙ ЧАС</span><b>{event?.eta ?? '—'}</b></div><div><span>ВПЕВНЕНІСТЬ</span><b>{event?.confidence ?? model.risk.confidence}</b></div></div>
      {event && <button type="button" className="tablet-featured-event" onClick={() => onEvent(event.id)}><div><span className="tablet-section-label">ОБРАНА ПОДІЯ · {event.confidence}</span><strong>{event.label}</strong><small>{event.status} · {event.eta}</small></div><ChevronRight size={18} /></button>}
    </>}
    {expanded && <div className="tablet-source-card"><span className="tablet-section-label">DATA PROVENANCE</span><div><Radio size={15} /><span>Джерело та freshness</span><b>{freshnessLabel(model)}</b></div><p>Статуси відділені від оцінок. Прогноз не є гарантованим маршрутом.</p></div>}
  </aside>;
};

const TabletTimeline: React.FC<{ model: ThreatSceneModel; state: TabletSceneState; onPosition: (value: number) => void; onLive: () => void }> = ({ model, state, onPosition, onLive }) => {
  const timeline = model.timeline;
  const isHistory = !state.liveMode;
  return <section className="tablet-timeline-panel" aria-label="Хронологія ситуації"><div className="tablet-timeline-heading"><div><span className="tablet-kicker">TIME RECONSTRUCTION</span><h2>{isHistory ? `ІСТОРІЯ · ${timeline[state.timelinePosition]?.time ?? '—'}` : 'LIVE · синхронізація часу'}</h2></div>{isHistory ? <button type="button" className="tablet-live-button" onClick={onLive}><Play size={14} /> До LIVE</button> : <span className="tablet-timeline-live"><span /> {model.dataMode === 'LIVE' ? 'LIVE' : model.dataMode === 'DEMO_DATA' ? 'DEMO TIMELINE' : 'TIMELINE OFFLINE'}</span>}</div><input className="tablet-timeline-range" type="range" min="0" max={Math.max(0, timeline.length - 1)} value={Math.min(state.timelinePosition, Math.max(0, timeline.length - 1))} onChange={(event) => onPosition(Number(event.target.value))} aria-label="Позиція на хронології" disabled={!timeline.length} /><div className="tablet-timeline-events">{timeline.length ? timeline.map((item, index) => <button type="button" key={item.id} className={index === state.timelinePosition ? 'is-active' : ''} onClick={() => onPosition(index)}><span className={`tablet-timeline-dot tablet-timeline-dot--${item.tone}`} /> <b>{item.time}</b><small>{item.label}</small></button>) : <span className="tablet-empty-copy">Історична шкала з’явиться після підключення джерела.</span>}</div></section>;
};

const TabletShelters: React.FC<{ model: ThreatSceneModel }> = ({ model }) => <section className="tablet-shelters-panel"><div className="tablet-panel-heading"><div><span className="tablet-kicker">SHELTER VIEW</span><h2>Укриття поруч</h2></div><Home size={20} className="text-emerald-300" /></div><div className="tablet-shelter-layout"><div className="tablet-shelter-map"><div className="tablet-shelter-map__pulse" /><MapPin size={26} /><span>Карта маршруту</span><small>Точне прокладання маршруту відкривається через підключений картографічний сервіс.</small></div><div className="tablet-shelter-list">{model.shelters.length ? model.shelters.map((shelter) => <article className="tablet-shelter-card" key={shelter.id}><span className="tablet-shelter-icon"><Home size={16} /></span><div><strong>{shelter.label}</strong><small>{shelter.distance} · пішохідний час не надано</small><span>{shelter.status} · статус джерела</span></div><button type="button" aria-label={`Маршрут до ${shelter.label} недоступний без картографічного сервісу`} title="Потрібен підключений картографічний сервіс" disabled><ArrowRight size={16} /></button></article>) : <div className="tablet-empty-state"><WifiOff size={18} /><span>Дані про укриття тимчасово недоступні.</span></div>}</div></div></section>;

const TabletPartner: React.FC<{ model: ThreatSceneModel }> = ({ model }) => {
  const isDemo = model.dataMode === 'DEMO_DATA';
  return <section className="tablet-partner-panel"><div className="tablet-panel-heading"><div><span className="tablet-kicker">PARTNER SPATIAL VIEW</span><h2>Партнерська програма</h2></div><Users size={21} className="text-violet-300" /></div><div className="tablet-partner-grid"><div className="tablet-rank-card"><span className="tablet-section-label">RANK PROGRESS · {isDemo ? 'DEMO FIXTURE' : 'NOT CONNECTED'}</span><strong>{isDemo ? 'GOLD' : 'Ранг недоступний'} {isDemo && <em>20%</em>}</strong><b>{isDemo ? '154 / 200' : '—'}</b><div className="tablet-progress"><span style={{ width: isDemo ? '77%' : '0%' }} /></div><small>{isDemo ? '46 до Platinum · DEMO DATA' : 'Партнерські дані не підключені'}</small></div><div className="tablet-network-card"><div className="tablet-network-ring tablet-network-ring--l2"><span>L2</span></div><div className="tablet-network-ring tablet-network-ring--l1"><span>L1</span></div><div className="tablet-network-core"><Users size={18} /><span>YOU</span></div><small>Два рівні · privacy-safe aggregate view</small></div><div className="tablet-source-analytics"><span className="tablet-section-label">SOURCE ANALYTICS</span>{['TikTok', 'Telegram', 'Instagram', 'Direct'].map((source, index) => <div key={source}><span>{source}</span><i style={{ width: isDemo ? `${72 - index * 14}%` : '0%' }} /><b>{isDemo ? ['42%', '26%', '18%', '14%'][index] : '—'}</b></div>)}</div></div><div className="tablet-partner-note"><BarChart3 size={16} /> {isDemo ? 'ДЕМОНСТРАЦІЯ · фінансові баланси не є live-даними.' : 'Партнерські дані NOT CONNECTED · потрібні auth, DB та payment provider.'}</div></section>;
};

const TabletSideRail: React.FC<{ mode: TabletMode; onMode: (mode: TabletMode) => void }> = ({ mode, onMode }) => { const items: Array<[TabletMode, React.ReactNode]> = [['OVERVIEW', <Compass size={18} />], ['EVENTS', <AlertTriangle size={18} />], ['TIMELINE', <Clock3 size={18} />], ['SHELTERS', <Home size={18} />], ['PARTNER', <Users size={18} />], ['PROFILE', <Shield size={18} />]]; return <nav className="tablet-side-rail" aria-label="Навігація планшета">{items.map(([id, icon]) => <button type="button" key={id} className={mode === id ? 'is-active' : ''} onClick={() => onMode(id)} aria-current={mode === id ? 'page' : undefined}>{icon}<span>{tabletModeLabel[id]}</span></button>)}</nav>; };

const TabletBottomNav: React.FC<{ mode: TabletMode; onMode: (mode: TabletMode) => void }> = ({ mode, onMode }) => <nav className="tablet-bottom-nav" aria-label="Нижня навігація планшета">{(['OVERVIEW', 'EVENTS', 'TIMELINE', 'SHELTERS', 'PROFILE'] as TabletMode[]).map((id, index) => <button type="button" key={id} className={mode === id ? 'is-active' : ''} onClick={() => onMode(id)} aria-current={mode === id ? 'page' : undefined}>{[<Compass size={17} />, <AlertTriangle size={17} />, <Clock3 size={17} />, <Home size={17} />, <Shield size={17} />][index]}<span>{tabletModeLabel[id]}</span></button>)}</nav>;

const TabletPresentation: React.FC<{ model: ThreatSceneModel; onExit: () => void }> = ({ model, onExit }) => <section className="tablet-presentation"><div><span className="tablet-kicker">GUIDED EXPLAIN MODE</span><h2>Як SIREN UA структурує ситуацію</h2><p>Просторова карта послідовно показує дані, район, ризик, прогноз і укриття. Це демонстрація продукту, а не оперативний канал.</p></div><div className="tablet-presentation-steps">{['01 Дані', '02 Мій район', '03 Ризик', '04 Траєкторія', '05 Укриття'].map((step, index) => <div key={step} className={index === 2 ? 'is-current' : ''}><span>{step.split(' ')[0]}</span><b>{step.substring(3)}</b></div>)}</div><button type="button" className="tablet-primary-action" onClick={onExit}><Pause size={16} /> Завершити показ</button><span className="tablet-presentation-data"><Database size={14} /> {model.dataMode === 'DEMO_DATA' ? 'DEMO DATA · без оперативних тверджень' : statusCopy(model)}</span></section>;

export const TabletExperience: React.FC<{ model: ThreatSceneModel }> = ({ model }) => {
  const [orientation, setOrientation] = useState<Orientation>(() => typeof window !== 'undefined' && window.matchMedia('(orientation: landscape)').matches ? 'LANDSCAPE' : 'PORTRAIT');
  const [mode, setMode] = useState<TabletMode>('OVERVIEW');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [personalRegion, setPersonalRegion] = useState(model.region.label);
  const [activeLayers, setActiveLayers] = useState<SpatialLayerKey[]>(['LIVE_DATA', 'SHELTERS', 'PERSONAL_REGION', 'RISK', 'TRAJECTORY', 'EVENTS']);
  const [selectedLayer, setSelectedLayer] = useState<SpatialLayerKey>('RISK');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [contextPanelMode, setContextPanelMode] = useState<PanelMode>('STANDARD');
  const [liveMode, setLiveMode] = useState(true);
  const [timelinePosition, setTimelinePosition] = useState(0);
  const [layerSeparation, setLayerSeparation] = useState(0.28);
  const [zoom, setZoom] = useState(1);
  const [regionSheet, setRegionSheet] = useState(false);
  const [presentation, setPresentation] = useState(false);
  const sceneState: TabletSceneState = useMemo(() => ({ orientation, mode, selectedRegion, personalRegion, activeLayers, selectedLayer, selectedEvent, contextPanelMode, liveMode, timelinePosition, layerSeparation }), [orientation, mode, selectedRegion, personalRegion, activeLayers, selectedLayer, selectedEvent, contextPanelMode, liveMode, timelinePosition, layerSeparation]);

  useEffect(() => {
    if (personalRegion === 'Регіон не визначено' && model.region.label !== 'Регіон не визначено') {
      setPersonalRegion(model.region.label);
    }
  }, [model.region.label, personalRegion]);

  useEffect(() => {
    const media = window.matchMedia('(orientation: landscape)');
    const update = () => setOrientation(media.matches ? 'LANDSCAPE' : 'PORTRAIT');
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  const selectLayer = (id: SpatialLayerKey) => setSelectedLayer(id);
  const reset = () => { setMode('OVERVIEW'); setSelectedRegion(null); setSelectedEvent(null); setSelectedLayer('RISK'); setContextPanelMode('STANDARD'); setLiveMode(true); setTimelinePosition(0); setLayerSeparation(0.28); setZoom(1); };
  const routeMode = mode === 'PRESENTATION' ? 'OVERVIEW' : mode;

  return <main className={`tablet-mode-shell tablet-mode-shell--${orientation.toLowerCase()}`} aria-label="SIREN UA tablet experience">
    <TabletHeader model={model} onPresentation={() => setPresentation((value) => !value)} onReset={reset} presentation={presentation} />
    {presentation ? <TabletPresentation model={model} onExit={() => setPresentation(false)} /> : <>
      <div className="tablet-main-frame"><TabletSideRail mode={mode} onMode={setMode} /><div className="tablet-workspace">
        <div className="tablet-workspace-bar"><div><span className="tablet-kicker">{orientation === 'LANDSCAPE' ? 'LANDSCAPE · MAP-FIRST WORKSPACE' : 'PORTRAIT · VERTICAL SPATIAL FEED'}</span><h2>{tabletModeLabel[routeMode]}</h2></div><div className="tablet-workspace-actions"><button type="button" className="tablet-region-button" onClick={() => setRegionSheet(true)}><MapPin size={15} /><span>Мій район: <b>{personalRegion}</b></span><ChevronRight size={15} /></button><span className="tablet-zoom-indicator">{Math.round(zoom * 100)}% · {stateLabel(model)}</span></div></div>
        {routeMode === 'PARTNER' ? <TabletPartner model={model} /> : routeMode === 'PROFILE' ? <section className="tablet-profile-panel"><Shield size={26} /><h2>Профіль і налаштування</h2><p>Авторизація, персональний район та сповіщення підключаються через спільну identity-систему SIREN UA.</p><DataMark model={model} /></section> : routeMode === 'SHELTERS' ? <TabletShelters model={model} /> : <div className="tablet-stage-body"><TabletSpatialDeck model={model} state={sceneState} onLayer={selectLayer} onSeparate={setLayerSeparation} onRegion={() => setRegionSheet(true)} onZoom={(delta) => setZoom((value) => Math.max(0.86, Math.min(1.18, value + delta)))} /><TabletContextPanel model={model} state={sceneState} onMode={setMode} onEvent={(id) => { setSelectedEvent(id); setMode('EVENTS'); }} onPanel={setContextPanelMode} /><TabletTimeline model={model} state={sceneState} onPosition={(position) => { setTimelinePosition(position); setLiveMode(false); setMode('TIMELINE'); }} onLive={() => { setLiveMode(true); setMode('OVERVIEW'); }} /></div>}
      </div></div><TabletBottomNav mode={mode} onMode={setMode} />
    </>}
    {regionSheet && <TabletRegionSelector model={model} current={personalRegion} onClose={() => setRegionSheet(false)} onSelect={(region) => { setPersonalRegion(region); setSelectedRegion(region); setRegionSheet(false); }} />}
  </main>;
};

const stateLabel = (model: ThreatSceneModel) => model.dataMode === 'LIVE' ? 'LIVE' : model.dataMode === 'DEMO_DATA' ? 'DEMO' : 'OFFLINE';

export const TabletModeShell: React.FC<{ model: ThreatSceneModel }> = ({ model }) => <TabletExperience model={model} />;
