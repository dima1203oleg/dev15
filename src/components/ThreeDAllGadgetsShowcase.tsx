import React, { useState, useEffect, useRef } from 'react';
import { 
  Monitor, 
  Laptop, 
  Tablet, 
  Smartphone, 
  Tv, 
  Watch, 
  Car, 
  Glasses, 
  Building2, 
  Layers, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Radio, 
  Volume2, 
  VolumeX,
  Check, 
  MapPin, 
  Clock, 
  Flame,
  ChevronRight,
  Maximize2,
  RotateCcw,
  Sparkles,
  Eye,
  Sliders,
  Compass,
  Play,
  Share2,
  Activity,
  Cpu,
  Shield,
  Wifi,
  BatteryCharging,
  Grid,
  RadioTower,
  BellRing,
  Navigation,
  Move,
  ZoomIn,
  ZoomOut,
  HelpCircle
} from 'lucide-react';
import { RegionData, ThreatTrajectory, UserSettings, ThreatSceneModel, OrbitalDeviceType } from '../types';
import { playWebAudioSound } from '../utils/sirenAudio';
import { OrbitalDeviceModel } from './orbital/OrbitalDeviceModels';

export const mapGadgetIdToOrbitalType = (id: GadgetId): OrbitalDeviceType => {
  switch (id) {
    case 'PHONE': return 'smartphone';
    case 'TABLET': return 'tablet';
    case 'DESKTOP': return 'desktop';
    case 'LAPTOP': return 'laptop';
    case 'WATCH': return 'watch';
    case 'VISION': return 'ar_vr';
    case 'CAR': return 'car';
    case 'TV': return 'tv';
    case 'KIOSK': return 'kiosk';
    default: return 'desktop';
  }
};

interface ThreeDAllGadgetsShowcaseProps {
  regions: RegionData[];
  trajectories: ThreatTrajectory[];
  settings: UserSettings;
  onNavigateToMap: () => void;
  onNavigateToSimulator: () => void;
  onNavigateToShelters: () => void;
  onNavigateToWebGL?: () => void;
}

export type GadgetId = 
  | 'DESKTOP' 
  | 'LAPTOP' 
  | 'TABLET' 
  | 'PHONE' 
  | 'WATCH' 
  | 'VISION' 
  | 'CAR' 
  | 'TV' 
  | 'KIOSK';

export interface GadgetInfo {
  id: GadgetId;
  name: string;
  category: string;
  icon: any;
  tagline: string;
  screenDesc: string;
  specs: {
    screen: string;
    refreshRate: string;
    latency: string;
    interfaceRole: string;
    powerProfile: string;
  };
  keyFeatures: string[];
  gradient: string;
  glowColor: string;
  badge: string;
  formFactor: string;
}

export const ALL_GADGETS_DATA: GadgetInfo[] = [
  {
    id: 'DESKTOP',
    name: '34" Curved Command Desktop',
    category: 'Аналітичний Штаб',
    icon: Monitor,
    tagline: 'Повноформатний штабний моніторинг для великих дисплеїв',
    screenDesc: 'Багатопанельний інтерфейс: просторовий рельєф, детальні траєкторії, статус енергосистеми та миттєва телеметрія всіх 25 областей одночасно.',
    specs: {
      screen: '34" UWQHD 3440×1440',
      refreshRate: '144 Hz Multi-layer',
      latency: '24 ms Broadcast',
      interfaceRole: 'Головний командний пункт',
      powerProfile: 'High Perf (Direct AC)'
    },
    keyFeatures: ['Багатошаровий 3D радар', 'Мультимоніторна сітка', 'Гарячі клавіші ППО', 'Швидкий експорт звітів'],
    gradient: 'from-cyan-500/20 to-sky-950/40',
    glowColor: 'cyan',
    badge: '3D Pro Studio',
    formFactor: 'Ultrawide Curved Display'
  },
  {
    id: 'LAPTOP',
    name: '16" Pro Tactical Workstation',
    category: 'Мобільний Штаб',
    icon: Laptop,
    tagline: 'Автономна робоча станція для штабів та роботи в дорозі',
    screenDesc: 'Оптимізований 13-16" інтерфейс з боковим віджетом загроз, швидким пошуком укриттів та енергоефективним рендерингом.',
    specs: {
      screen: '16" Liquid Retina XDR',
      refreshRate: '120 Hz ProMotion',
      latency: '35 ms Offline-Sync',
      interfaceRole: 'Польовий координатор',
      powerProfile: 'Battery + Auto Throttle'
    },
    keyFeatures: ['Офлайн кеш укриттів', 'Режим низького споживання', 'Міні-віджет у треї', 'Автономний компас'],
    gradient: 'from-blue-500/20 to-slate-950/40',
    glowColor: 'blue',
    badge: '3D Workstation',
    formFactor: 'Foldable Dual-Plane'
  },
  {
    id: 'PHONE',
    name: 'iPhone 16 Pro / Flagship Mobile',
    category: 'Персональний Захист',
    icon: Smartphone,
    tagline: 'Миттєве розуміння небезпеки за 1 секунду на екрані блокування',
    screenDesc: 'Фокус на вашому районі: точний час підльоту (ETA), звук сирени в обхід беззвучного режиму та найближче бомбосховище за GPS.',
    specs: {
      screen: '6.7" Super Retina XDR',
      refreshRate: '120 Hz Always-On',
      latency: '15 ms Push Alert',
      interfaceRole: 'Миттєве особисте сповіщення',
      powerProfile: 'Ultra Low Idle Power'
    },
    keyFeatures: ['Критичні сповіщення (Bypass DND)', 'Dynamic Island таймер ETA', 'Live Activity на замкненому екрані', 'AR навігатор до сховища'],
    gradient: 'from-amber-500/20 to-amber-950/40',
    glowColor: 'amber',
    badge: '3D Mobile Shield',
    formFactor: 'Titanium Handheld'
  },
  {
    id: 'TABLET',
    name: '13" Tactical Military Tablet',
    category: 'Сенсорний Планшет',
    icon: Tablet,
    tagline: 'Керування жестами, Pinch-to-Zoom та обертання кінчиками пальців',
    screenDesc: 'Спеціальний сенсорний режим: масштабування двома пальцями, розгортання шарів одним рухом, інтерактивні перемикачі зон ППО.',
    specs: {
      screen: '13" Ultra Retina Tandem OLED',
      refreshRate: '120 Hz Touch Matrix',
      latency: '20 ms Multi-Touch',
      interfaceRole: 'Тактичний польовий планшет',
      powerProfile: 'Military Grade Armor'
    },
    keyFeatures: ['Жестове 3D обертання', 'Спліт-скрін розвідки', 'Тактичний стілус-маркер', 'Мобільний штабний екран'],
    gradient: 'from-purple-500/20 to-purple-950/40',
    glowColor: 'purple',
    badge: '3D Tactical Pad',
    formFactor: 'Armor Bumper Slate'
  },
  {
    id: 'WATCH',
    name: 'Apple Watch Ultra & WearOS',
    category: 'Носимий Радар',
    icon: Watch,
    tagline: 'Головне на зап’ясті навіть без смартфона поруч',
    screenDesc: 'Тактильна вібрація, колірний статус загрози та лічильник хвилин прямо на циферблаті. Працює автономно через вбудований LTE.',
    specs: {
      screen: '2.0" 3000 nits Sapphire Glass',
      refreshRate: '60 Hz Micro-Display',
      latency: '8 ms Haptic Pulse',
      interfaceRole: 'Тактильний швидкий маяк',
      powerProfile: 'Autonomous LTE Link'
    },
    keyFeatures: ['Індивідуальні вібро-шаблони', 'Ускладнення на циферблат', 'Офлайн компас до дверей', 'Автономний LTE зв’язок'],
    gradient: 'from-rose-500/20 to-rose-950/40',
    glowColor: 'rose',
    badge: '3D Haptic Watch',
    formFactor: 'Titanium Smartwatch'
  },
  {
    id: 'VISION',
    name: 'AR Vision Glasses & Spatial HUD',
    category: 'Просторова Голограма',
    icon: Glasses,
    tagline: 'Голограма простору України прямо у вашому полі зору',
    screenDesc: 'Просторова візуалізація з реальними висотами польоту ракет, тривимірними куполами РЛС та проекцією безпечних секторів перед очима.',
    specs: {
      screen: 'Dual 4K Micro-OLED Visor',
      refreshRate: '90 Hz Spatial Track',
      latency: '12 ms Photon-to-Motion',
      interfaceRole: 'Голографічний Digital Twin',
      powerProfile: 'Spatial Processing Unit'
    },
    keyFeatures: ['Spatial Computing 3D', 'Керування поглядом та жестами', 'Справжні висоти траєкторій', 'Голографічний захисний купол'],
    gradient: 'from-sky-500/20 to-indigo-950/40',
    glowColor: 'sky',
    badge: '3D Spatial AR',
    formFactor: 'Holographic Visor'
  },
  {
    id: 'CAR',
    name: 'In-Car Cockpit / CarPlay & Auto',
    category: 'Безпека в Дорозі',
    icon: Car,
    tagline: 'Спокій за кермом: уникнення небезпечних зон на маршруті',
    screenDesc: 'Інтеграція в автомобільну медіасистему: голосове попередження, побудова об’їзду зон ураження та напрямок до придорожніх укриттів.',
    specs: {
      screen: '15" Automotive Center Console',
      refreshRate: '60 Hz Road Map',
      latency: '40 ms Auto-Route',
      interfaceRole: 'Анти-паніка навігація в авто',
      powerProfile: 'Vehicle CAN-Bus Link'
    },
    keyFeatures: ['Голосовий асистент водія', 'Динамічний об’їзд БпЛА', 'Авто-приглушення аудіо', 'АЗС-укриття по трасі'],
    gradient: 'from-orange-500/20 to-orange-950/40',
    glowColor: 'orange',
    badge: '3D Car HUD',
    formFactor: 'Dashboard Infotainment'
  },
  {
    id: 'TV',
    name: '65" 4K Smart TV & Command Wall',
    category: 'Дім, Офіс & Бізнес',
    icon: Tv,
    tagline: 'Постійний моніторинг для всієї родини, бізнесу чи холу',
    screenDesc: 'Великоформатний 4K Dashboard з автооновленням для телевізорів у будинках, навчальних закладах та на підприємствах.',
    specs: {
      screen: '65" 4K HDR Ambient Display',
      refreshRate: '120 Hz Big Screen',
      latency: '50 ms Wall Stream',
      interfaceRole: 'Громадський монітор безпеки',
      powerProfile: 'Always-On Wall Monitor'
    },
    keyFeatures: ['4K Ultra-HD оптимізація', 'Голосове сповіщення диктора', 'Режим скрінсейвера', 'Великі читабельні шрифти'],
    gradient: 'from-emerald-500/20 to-emerald-950/40',
    glowColor: 'emerald',
    badge: '3D TV Wall',
    formFactor: '4K Ambient Wall Panel'
  },
  {
    id: 'KIOSK',
    name: 'Public Safety Street Kiosk',
    category: 'Міські Простори',
    icon: Building2,
    tagline: 'Публічний доступ на вокзалах, ТРЦ, зупинках та в метро',
    screenDesc: 'Вандалостійкий інформаційний термінал з планом евакуації, фізичною звуковою сиреною та картою доступності міських сховищ.',
    specs: {
      screen: '55" High-Brightness IP65 Kiosk',
      refreshRate: '60 Hz Outdoor Matrix',
      latency: '10 ms Offline Siren',
      interfaceRole: 'Міський публічний термінал',
      powerProfile: '48h UPS Backup Battery'
    },
    keyFeatures: ['Публічні звукові маяки', 'Плани поверхів та виходів', 'Багатомовний інтерфейс', 'Резервне живлення 48 год'],
    gradient: 'from-indigo-500/20 to-slate-950/40',
    glowColor: 'indigo',
    badge: '3D Street Totem',
    formFactor: 'IP65 Rugged Column'
  }
];

export const ThreeDAllGadgetsShowcase: React.FC<ThreeDAllGadgetsShowcaseProps> = ({
  regions,
  trajectories,
  settings,
  onNavigateToMap,
  onNavigateToSimulator,
  onNavigateToShelters,
  onNavigateToWebGL,
}) => {
  const [selectedGadgetId, setSelectedGadgetId] = useState<GadgetId>('DESKTOP');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'MOBILE' | 'DESKTOP' | 'WEARABLE' | 'INFRA'>('ALL');
  const [displayMode, setDisplayMode] = useState<'3D_GRID' | '3D_STAGE' | '3D_LINEUP'>('3D_GRID');
  
  // 3D Orbit & Tilt Angle state for interactive stage
  const [orbitAngle, setOrbitAngle] = useState({ pitch: 16, yaw: -14, zoom: 1 });
  const [isAutoOrbit, setIsAutoOrbit] = useState(false);
  const [activePreset, setActivePreset] = useState<'ISOMETRIC' | 'TACTICAL' | 'FRONT' | 'TOP_DOWN' | 'MACRO'>('TACTICAL');
  const [isSimulatingAlert, setIsSimulatingAlert] = useState(false);
  const [isSyncBroadcastActive, setIsSyncBroadcastActive] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);

  // Mouse / Touch Drag Orbit Ref
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const dragStartAnglesRef = useRef({ pitch: 16, yaw: -14 });
  const stageRef = useRef<HTMLDivElement>(null);

  const selectedGadget = ALL_GADGETS_DATA.find((g) => g.id === selectedGadgetId) || ALL_GADGETS_DATA[0];
  const activeAlarms = regions.filter((r) => r.isAlarm);
  const myRegionData = regions.find((r) => r.id === settings.myRegion) || regions[0];
  const currentThreat = trajectories[0];

  const currentThreatSceneModel: ThreatSceneModel = {
    timestamp: new Date().toISOString(),
    freshness: 'REALTIME',
    dataMode: 'LIVE',
    activeAlarmsCount: activeAlarms.length,
    criticalRegions: activeAlarms.map((r) => r.name),
    primaryThreat: currentThreat || null,
    nearestShelter: {
      id: 'sh-1',
      name: 'Станція метро "Золоті Ворота"',
      address: 'вул. Володимирська, 40',
      regionId: myRegionData.id,
      type: 'metro',
      distanceMeters: 340,
      walkTimeMins: 4,
      capacity: 2500,
      features: {
        powerGenerator: true,
        wifi: true,
        ventilation: true,
        waterSupply: true,
        wheelchairAccessible: true,
        allDayOpen: true,
      },
      verifiedStatus: 'VERIFIED_DSNS',
    },
    myRegionStatus: {
      id: myRegionData.id,
      name: myRegionData.name,
      isAlarm: isSimulatingAlert || isSyncBroadcastActive || myRegionData.isAlarm,
      etaMinutes: 18,
      riskLevel: isSimulatingAlert || isSyncBroadcastActive || myRegionData.isAlarm ? 'HIGH' : 'LOW',
    }
  };

  // Auto orbit animation
  useEffect(() => {
    let animFrame: number;
    if (isAutoOrbit) {
      const step = () => {
        setOrbitAngle((prev) => ({
          ...prev,
          yaw: (prev.yaw + 0.35) % 360,
        }));
        animFrame = requestAnimationFrame(step);
      };
      animFrame = requestAnimationFrame(step);
    }
    return () => cancelAnimationFrame(animFrame);
  }, [isAutoOrbit]);

  // Handle preset selection
  const handleApplyPreset = (preset: 'ISOMETRIC' | 'TACTICAL' | 'FRONT' | 'TOP_DOWN' | 'MACRO') => {
    setActivePreset(preset);
    setIsAutoOrbit(false);
    if (preset === 'ISOMETRIC') {
      setOrbitAngle({ pitch: 24, yaw: -28, zoom: 1 });
    } else if (preset === 'TACTICAL') {
      setOrbitAngle({ pitch: 16, yaw: -14, zoom: 1 });
    } else if (preset === 'FRONT') {
      setOrbitAngle({ pitch: 0, yaw: 0, zoom: 1 });
    } else if (preset === 'TOP_DOWN') {
      setOrbitAngle({ pitch: 50, yaw: 0, zoom: 1.05 });
    } else if (preset === 'MACRO') {
      setOrbitAngle({ pitch: 8, yaw: -6, zoom: 1.25 });
    }
  };

  // Trigger single gadget test alert
  const handleTestGadgetAlert = () => {
    setIsSimulatingAlert(true);
    if (!soundMuted) playWebAudioSound('alert');
    setTimeout(() => {
      setIsSimulatingAlert(false);
    }, 4500);
  };

  // Trigger synchronized broadcast alert to all 9 gadgets
  const handleTriggerSyncBroadcast = () => {
    setIsSyncBroadcastActive(true);
    if (!soundMuted) playWebAudioSound('alert');
    setTimeout(() => {
      setIsSyncBroadcastActive(false);
    }, 5500);
  };

  // Filter devices
  const filteredGadgets = ALL_GADGETS_DATA.filter((gadget) => {
    if (categoryFilter === 'ALL') return true;
    if (categoryFilter === 'MOBILE') return ['PHONE', 'TABLET'].includes(gadget.id);
    if (categoryFilter === 'DESKTOP') return ['DESKTOP', 'LAPTOP', 'TV'].includes(gadget.id);
    if (categoryFilter === 'WEARABLE') return ['WATCH', 'VISION'].includes(gadget.id);
    if (categoryFilter === 'INFRA') return ['CAR', 'KIOSK'].includes(gadget.id);
    return true;
  });

  // Mouse & Touch Drag orbit handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    dragStartAnglesRef.current = { pitch: orbitAngle.pitch, yaw: orbitAngle.yaw };
    setIsAutoOrbit(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - dragStartPosRef.current.x;
    const deltaY = e.clientY - dragStartPosRef.current.y;
    
    // Sensitivity factor
    const sensitivity = 0.45;
    const newYaw = dragStartAnglesRef.current.yaw + deltaX * sensitivity;
    const newPitch = Math.max(-45, Math.min(65, dragStartAnglesRef.current.pitch - deltaY * sensitivity));

    setOrbitAngle((prev) => ({
      ...prev,
      pitch: newPitch,
      yaw: newYaw,
    }));
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Zoom helpers
  const handleZoom = (direction: 'in' | 'out') => {
    setOrbitAngle((prev) => ({
      ...prev,
      zoom: direction === 'in' ? Math.min(1.4, prev.zoom + 0.1) : Math.max(0.7, prev.zoom - 0.1),
    }));
  };

  const handleResetOrbit = () => {
    setOrbitAngle({ pitch: 16, yaw: -14, zoom: 1 });
    setActivePreset('TACTICAL');
    setIsAutoOrbit(false);
  };

  return (
    <section 
      id="all-gadgets-3d-showcase" 
      className="bg-gradient-to-b from-slate-950 via-[#050b18] to-slate-950 border border-slate-800/90 rounded-3xl p-4 sm:p-7 md:p-9 shadow-2xl relative overflow-hidden mb-12"
    >
      {/* 3D Cyber Blueprint Grid & Dynamic Atmosphere Glows */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(56, 189, 248, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '36px 36px',
        }}
      />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Global Broadcast Banner When Active */}
      {isSyncBroadcastActive && (
        <div className="relative z-20 mb-6 p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/90 via-rose-900/80 to-amber-950/90 border border-rose-500/80 text-white shadow-2xl shadow-rose-950/90 flex flex-wrap items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-slate-950 flex items-center justify-center font-black animate-bounce">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black tracking-wide flex items-center gap-2">
                <span>СИНХРОННЕ 3D СПОВІЩЕННЯ АКТИВНЕ</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-slate-950 font-mono font-bold">
                  9/9 ГАДЖЕТІВ ПРИЙНЯЛИ СИГНАЛ
                </span>
              </h4>
              <p className="text-xs text-rose-200">
                Всі пристрої одночасно перейшли в режим тривоги: розрахунок ETA 18 хв, тактильні вібрації та побудова об'їзду.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSyncBroadcastActive(false)}
            className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-xs font-bold text-slate-200 border border-slate-700"
          >
            Скинути тест
          </button>
        </div>
      )}

      {/* Section Header */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between mb-7 gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-2.5">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>3D Мультиплатформна Екосистема SirenUA</span>
            <span className="text-[10px] px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-200 font-mono font-bold">
              9 ГАДЖЕТІВ
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            Всі види гаджетів у <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-300 bg-clip-text text-transparent">живому 3D просторі</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-3xl leading-relaxed">
            Повна кросплатформна сумісність. Кожен пристрій — від Apple Watch та смартфона до автомобільної консолі та 4K телевізора — отримує синхронізовані в реальному часі векторні дані та тривимірну телеметрію.
          </p>
        </div>

        {/* View Switchers & Broadcast Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Synchronized Broadcast Trigger Button */}
          <button
            onClick={handleTriggerSyncBroadcast}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-rose-950/60 flex items-center gap-1.5 transition-all transform active:scale-95"
            title="Запустити синхронне 3D оповіщення на всіх 9 гаджетах одночасно"
          >
            <BellRing className="w-4 h-4 animate-bounce" />
            <span>Синхронний 3D тест (Всі 9)</span>
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={() => setSoundMuted(!soundMuted)}
            className={`p-2 rounded-xl border text-xs transition-all ${
              soundMuted 
                ? 'bg-slate-900 border-slate-700 text-slate-500' 
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
            }`}
            title={soundMuted ? 'Увімкнути звук 3D тестів' : 'Вимкнути звук'}
          >
            {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* View mode toggle */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setDisplayMode('3D_GRID')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                displayMode === '3D_GRID'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>3D Галерея</span>
            </button>

            <button
              onClick={() => setDisplayMode('3D_STAGE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                displayMode === '3D_STAGE'
                  ? 'bg-purple-500 text-white font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>3D Сцена фокусу</span>
            </button>

            <button
              onClick={() => setDisplayMode('3D_LINEUP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                displayMode === '3D_LINEUP'
                  ? 'bg-sky-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3D Лінійка</span>
            </button>
          </div>

          {onNavigateToWebGL && (
            <button
              onClick={onNavigateToWebGL}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Three.js Студія</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {[
            { id: 'ALL', label: '🌐 Всі 9 гаджетів' },
            { id: 'MOBILE', label: '📱 Смартфони & Планшети' },
            { id: 'DESKTOP', label: '💻 Десктопи & ТБ' },
            { id: 'WEARABLE', label: '⌚ Годинники & AR Окуляри' },
            { id: 'INFRA', label: '🚗 Авто & Вуличні Термінали' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                categoryFilter === cat.id
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-950'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Live sync indicator */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>СИНХРОНІЗАЦІЯ 9/9 АКТИВНА</span>
        </div>
      </div>

      {/* MODE 1: 3D GRID OF ALL 9 GADGETS */}
      {displayMode === '3D_GRID' && (
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGadgets.map((gadget) => {
            const Icon = gadget.icon;
            const isSelected = selectedGadgetId === gadget.id;
            const isDeviceAlarming = isSyncBroadcastActive || (isSimulatingAlert && isSelected);

            return (
              <div
                key={gadget.id}
                onClick={() => {
                  setSelectedGadgetId(gadget.id);
                  if (!soundMuted) playWebAudioSound('click');
                }}
                className={`group cursor-pointer rounded-2xl p-4 sm:p-5 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                  isDeviceAlarming
                    ? 'bg-rose-950/40 border-rose-500/80 shadow-2xl shadow-rose-950/80 ring-2 ring-rose-500/50 -translate-y-1'
                    : isSelected
                    ? 'bg-slate-900/95 border-cyan-400 shadow-xl shadow-cyan-950/80 ring-2 ring-cyan-500/30 -translate-y-1'
                    : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90 hover:-translate-y-0.5'
                }`}
              >
                {/* 3D Hardware Accent Top */}
                <div className="flex items-center justify-between mb-3 border-b border-slate-800/70 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${
                      isDeviceAlarming 
                        ? 'bg-rose-500 text-slate-950 animate-pulse'
                        : isSelected 
                        ? 'bg-cyan-500/20 text-cyan-300' 
                        : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-100 group-hover:text-cyan-300 transition-colors">
                        {gadget.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {gadget.category}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    isDeviceAlarming
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}>
                    {gadget.badge}
                  </span>
                </div>

                {/* 3D Perspective Mini Stage for the Gadget */}
                <div className="perspective-1000 my-2 flex items-center justify-center overflow-hidden py-2 min-h-[170px] bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <div 
                    className="preserve-3d transition-transform duration-500 scale-[0.68] sm:scale-[0.72] group-hover:scale-[0.78] pointer-events-none"
                    style={{
                      transform: isSelected ? 'rotateX(8deg) rotateY(-6deg)' : 'rotateX(4deg) rotateY(-2deg)'
                    }}
                  >
                    <OrbitalDeviceModel
                      type={mapGadgetIdToOrbitalType(gadget.id)}
                      threatModel={{
                        ...currentThreatSceneModel,
                        activeAlarmsCount: isDeviceAlarming ? 8 : activeAlarms.length,
                        myRegionStatus: {
                          ...currentThreatSceneModel.myRegionStatus,
                          isAlarm: isDeviceAlarming || currentThreatSceneModel.myRegionStatus.isAlarm,
                        }
                      }}
                      isSelected={isSelected}
                    />
                  </div>
                </div>

                {/* Specs List */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/60">
                    <span className="text-slate-500 block">Дисплей:</span>
                    <span className="text-slate-300 font-bold truncate block">{gadget.specs.screen.split(' ')[0]}</span>
                  </div>
                  <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/60">
                    <span className="text-slate-500 block">Затримка:</span>
                    <span className="text-cyan-400 font-bold block">{gadget.specs.latency}</span>
                  </div>
                </div>

                {/* Select button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedGadgetId(gadget.id);
                    setDisplayMode('3D_STAGE');
                    if (!soundMuted) playWebAudioSound('click');
                  }}
                  className="mt-3 w-full py-2 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1 group-hover:border-cyan-500/50"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>3D Огляд пристрою</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* MODE 2: INTERACTIVE 3D HOLOGRAPHIC STAGE WITH ORBIT / ROTATION */}
      {displayMode === '3D_STAGE' && (
        <div className="relative z-10 space-y-6">
          
          {/* Quick Gadget Selector Ribbon */}
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
            {ALL_GADGETS_DATA.map((gadget) => {
              const Icon = gadget.icon;
              const isSelected = selectedGadgetId === gadget.id;
              return (
                <button
                  key={gadget.id}
                  onClick={() => {
                    setSelectedGadgetId(gadget.id);
                    if (!soundMuted) playWebAudioSound('click');
                  }}
                  className={`p-2.5 rounded-2xl border transition-all flex flex-col items-center text-center gap-1 ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-400 shadow-lg shadow-cyan-950/80 scale-105'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-bold truncate w-full ${isSelected ? 'text-slate-100' : 'text-slate-400'}`}>
                    {gadget.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Main 3D Stage + Specs Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-2xl">
            
            {/* Left: 3D Rotational Canvas Stage (7 Cols on LG) */}
            <div className="lg:col-span-7 flex flex-col items-center">
              
              {/* 3D Camera Controls Bar */}
              <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-3 bg-slate-950/80 p-2 rounded-xl border border-slate-800 text-xs font-mono">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-slate-400 text-[10px] uppercase font-bold px-1">Ракурс:</span>
                  {[
                    { id: 'TACTICAL', label: '🎮 Тактичний' },
                    { id: 'ISOMETRIC', label: '📐 Ізометрія' },
                    { id: 'FRONT', label: '🖼️ Фронт' },
                    { id: 'TOP_DOWN', label: '🗺️ Зверху' },
                    { id: 'MACRO', label: '🔍 Макро' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleApplyPreset(p.id as any)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        activePreset === p.id
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Zoom controls */}
                  <button
                    onClick={() => handleZoom('in')}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                    title="Збільшити"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleZoom('out')}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                    title="Зменшити"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleResetOrbit}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                    title="Скинути ракурс"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setIsAutoOrbit(!isAutoOrbit)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                      isAutoOrbit
                        ? 'bg-purple-500 text-white animate-pulse'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <RotateCcw className={`w-3 h-3 ${isAutoOrbit ? 'animate-spin' : ''}`} />
                    <span>Auto-Orbit</span>
                  </button>
                </div>
              </div>

              {/* 3D Hologram Container with Interactive Drag to Orbit */}
              <div 
                ref={stageRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="w-full h-[380px] sm:h-[440px] bg-slate-950 rounded-2xl border-2 border-slate-800/90 shadow-2xl relative overflow-hidden flex items-center justify-center select-none perspective-1500 cursor-grab active:cursor-grabbing group"
              >
                {/* 3D Floor Grid */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-30"
                  style={{
                    backgroundImage: `
                      radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.25) 0%, transparent 70%),
                      linear-gradient(to right, rgba(56, 189, 248, 0.1) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(56, 189, 248, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '100% 100%, 30px 30px, 30px 30px',
                    transform: 'rotateX(60deg) translateZ(-60px)',
                  }}
                />

                {/* 3D Light Beams & Elevation Glow */}
                <div className="absolute w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

                {/* Drag hint overlay */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800 pointer-events-none">
                  <Move className="w-3 h-3 text-cyan-400 animate-pulse" />
                  <span>Тягніть мишкою або пальцем для 3D обертання</span>
                </div>

                {/* THE 3D ROTATABLE DEVICE MODEL */}
                <div 
                  className="relative preserve-3d transition-transform duration-100 flex items-center justify-center py-6"
                  style={{
                    transform: `rotateX(${orbitAngle.pitch}deg) rotateY(${orbitAngle.yaw}deg) scale(${orbitAngle.zoom})`,
                  }}
                >
                  <div className={`transition-all duration-300 transform-gpu ${
                    isSimulatingAlert || isSyncBroadcastActive 
                      ? 'ring-4 ring-rose-500/80 ring-offset-4 ring-offset-slate-950 rounded-2xl animate-pulse' 
                      : ''
                  }`}>
                    <OrbitalDeviceModel
                      type={mapGadgetIdToOrbitalType(selectedGadget.id)}
                      threatModel={currentThreatSceneModel}
                      isSelected={true}
                    />
                  </div>

                  {/* 3D Hardware Ground Ambient Shadow */}
                  <div 
                    className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-64 h-6 rounded-full bg-cyan-500/20 blur-xl pointer-events-none"
                  />
                </div>

                {/* Pitch/Yaw Manual Live Indicators */}
                <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2 bg-slate-900/90 p-2 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400">
                  <span>Pitch: {Math.round(orbitAngle.pitch)}°</span>
                  <span>Yaw: {Math.round(orbitAngle.yaw)}°</span>
                  <span>Zoom: {Math.round(orbitAngle.zoom * 100)}%</span>
                </div>
              </div>

              {/* Slider for Manual 3D Yaw Rotation */}
              <div className="w-full mt-3 flex items-center gap-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-slate-400 whitespace-nowrap">3D Обертання:</span>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={orbitAngle.yaw}
                  onChange={(e) => setOrbitAngle((prev) => ({ ...prev, yaw: Number(e.target.value) }))}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-mono text-cyan-300 w-12 text-right">{Math.round(orbitAngle.yaw)}°</span>
              </div>

            </div>

            {/* Right: Selected Gadget Deep Specs & Testing (5 Cols on LG) */}
            <div className="lg:col-span-5 space-y-4">
              
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
                  <span>{selectedGadget.category}</span>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  {selectedGadget.badge}
                </span>
              </div>

              <h3 className="text-2xl font-black text-white">
                {selectedGadget.name}
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {selectedGadget.screenDesc}
              </p>

              {/* Specs Matrix */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono mb-0.5">
                    <Monitor className="w-3 h-3 text-cyan-400" />
                    <span>Дисплей:</span>
                  </div>
                  <span className="text-xs font-bold text-slate-200 block">{selectedGadget.specs.screen}</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono mb-0.5">
                    <Activity className="w-3 h-3 text-purple-400" />
                    <span>Частота кадрів:</span>
                  </div>
                  <span className="text-xs font-bold text-slate-200 block">{selectedGadget.specs.refreshRate}</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono mb-0.5">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>Затримка Push:</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 block font-mono">{selectedGadget.specs.latency}</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono mb-0.5">
                    <Shield className="w-3 h-3 text-sky-400" />
                    <span>Роль захисту:</span>
                  </div>
                  <span className="text-xs font-bold text-slate-200 block truncate">{selectedGadget.specs.interfaceRole}</span>
                </div>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase block mb-1">
                  КЛЮЧОВІ ОСОБЛИВОСТІ
                </span>
                {selectedGadget.keyFeatures.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-200">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Interactive Device Test Controls */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2.5">
                <button
                  onClick={handleTestGadgetAlert}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-rose-950/60 flex items-center gap-1.5 transition-all transform active:scale-95"
                >
                  <Flame className="w-4 h-4" />
                  <span>Тест 3D сповіщення</span>
                </button>

                <button
                  onClick={onNavigateToShelters}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Укриття ({myRegionData.shortName})</span>
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* MODE 3: 3D SPATIAL LINEUP OF ALL 9 DEVICES */}
      {displayMode === '3D_LINEUP' && (
        <div className="relative z-10 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-x-auto">
            <div className="text-xs font-mono text-cyan-300 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>3D Лінійка: Всі 9 пристроїв у єдиному синхронному просторі</span>
              </span>
              <span className="text-slate-400 text-[11px]">Натисніть на будь-який гаджет для фокусування</span>
            </div>

            <div className="flex items-end gap-5 min-w-[1100px] py-6 px-4">
              {ALL_GADGETS_DATA.map((gadget, index) => {
                const Icon = gadget.icon;
                const isSelected = selectedGadgetId === gadget.id;
                const isDeviceAlarming = isSyncBroadcastActive;

                return (
                  <div
                    key={gadget.id}
                    onClick={() => {
                      setSelectedGadgetId(gadget.id);
                      setDisplayMode('3D_STAGE');
                      if (!soundMuted) playWebAudioSound('click');
                    }}
                    className={`cursor-pointer transition-all duration-300 flex flex-col items-center flex-1 max-w-[160px] group ${
                      isSelected ? 'scale-110 -translate-y-2' : 'hover:scale-105 hover:-translate-y-1'
                    }`}
                  >
                    {/* 3D Model Mini Pillar */}
                    <div className={`w-full h-44 rounded-2xl p-2.5 border flex flex-col justify-between transition-all ${
                      isDeviceAlarming
                        ? 'bg-rose-950/60 border-rose-500 shadow-xl shadow-rose-950/80 animate-pulse'
                        : isSelected
                        ? 'bg-slate-900 border-cyan-400 shadow-xl shadow-cyan-950/80 ring-2 ring-cyan-500/30'
                        : 'bg-slate-950/90 border-slate-800 group-hover:border-slate-700'
                    }`}>
                      <div className="flex items-center justify-between">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-300' : 'text-slate-400'}`} />
                        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {gadget.specs.latency}
                        </span>
                      </div>

                      <div className="my-auto text-center font-mono">
                        <span className="text-[10px] font-bold text-white block truncate">
                          {gadget.name.split(' ')[0]}
                        </span>
                        <span className="text-[8px] text-slate-400 block truncate">
                          {gadget.category}
                        </span>
                      </div>

                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className={`h-full ${isDeviceAlarming ? 'bg-rose-500 animate-ping' : 'bg-cyan-400'} w-full`} />
                      </div>
                    </div>

                    {/* 3D Platform Base */}
                    <div className="w-20 h-2 rounded-full bg-cyan-500/20 blur-xs mt-2" />
                    <span className="text-[10px] font-mono text-slate-400 mt-1 font-bold group-hover:text-cyan-300">
                      #{index + 1} {gadget.id}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Footer Info Bar */}
      <div className="mt-8 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>GPU Апаратне 3D Прискорення</span>
          </span>
          <span>•</span>
          <span>Adaptive Multi-Resolution CSS & WebGL</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToSimulator}
            className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
          >
            <span>7-Кроковий Симулятор загроз</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </section>
  );
};
