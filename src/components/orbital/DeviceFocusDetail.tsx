import React, { useState } from 'react';
import { 
  Monitor, 
  Laptop, 
  Tablet, 
  Smartphone, 
  Tv, 
  Watch, 
  Car, 
  Glasses, 
  ArrowLeft, 
  ShieldCheck, 
  Zap, 
  Radio, 
  Volume2, 
  Check, 
  MapPin, 
  Clock, 
  Flame,
  Activity,
  Layers,
  Sparkles,
  SmartphoneNfc
} from 'lucide-react';
import { OrbitalDeviceType, ThreatSceneModel, OrbitalDeviceConfig } from '../../types';
import { playWebAudioSound } from '../../utils/sirenAudio';
import { OrbitalDeviceModel } from './OrbitalDeviceModels';

interface DeviceFocusDetailProps {
  deviceType: OrbitalDeviceType;
  threatModel: ThreatSceneModel;
  onBackToEcosystem: () => void;
  onNavigateToMap?: () => void;
  onNavigateToSimulator?: () => void;
  onNavigateToShelters?: () => void;
}

export const DEVICE_CONFIGS_DICT: Record<OrbitalDeviceType, OrbitalDeviceConfig> = {
  tv: {
    id: 'tv',
    title: 'Smart TV & 4K Ambient Wall Display',
    subtitle: 'National Overview & Ambient Public Safety',
    category: 'Великі Дисплеї / Дім та Офіс',
    modeTag: 'Ambient Situation',
    depthZone: 'BACKGROUND',
    orbitRadius: 3.6,
    orbitAngle: 270, // TOP
    orbitSpeed: 0.008,
    verticalOffset: -125,
    bobAmplitude: 8,
    bobFrequency: 0.6,
    tilt: [-6, 0, 0],
    scale: 0.95,
    specs: {
      screen: '65" 4K OLED Ambient Matrix',
      latency: '50 ms Wall Stream',
      role: 'Постійний фоновий моніторинг для родини, холу чи оперативного пункту',
      hapticOrSound: 'Динамічний Ambilight-статус + голосовий диктор сповіщень',
    },
    keyFeatures: [
      'Загальнонаціональний моніторинг 25 областей у 4K HDR',
      'Фоновий колірний Ambilight-статус загрози у реальному часі',
      'Голосовий асистент оголошення тривог та відбоїв',
      'Мінімалістичний інтерфейс високої контрастності для перегляду здалеку',
    ],
  },
  desktop: {
    id: 'desktop',
    title: '34" Curved 21:9 Command Desktop',
    subtitle: 'Spatial Command & Deep Analytics',
    category: 'Аналітичний Штаб',
    modeTag: 'Spatial Command',
    depthZone: 'MIDGROUND',
    orbitRadius: 3.3,
    orbitAngle: 0, // RIGHT
    orbitSpeed: 0.012,
    verticalOffset: -15,
    bobAmplitude: 7,
    bobFrequency: 0.8,
    tilt: [4, -12, 0],
    scale: 1.02,
    specs: {
      screen: '34" UWQHD 3440×1440 144Hz 1500R',
      latency: '24 ms Broadcast',
      role: 'Командний пункт із максимальним аналітичним покриттям усіх секторів',
      hapticOrSound: 'Звукові схеми ППО + гарячі клавіші оператора F1-F12',
    },
    keyFeatures: [
      'Багатошаровий 3D радар та висотні вектори цілей',
      'Паралельний моніторинг 25 областей на надширокому екрані 21:9',
      'Роботизований кронштейн із регулюванням положення та кута огляду',
      'Миттєвий експорт телеметрії та перемикання радарних шарів',
    ],
  },
  laptop: {
    id: 'laptop',
    title: '16" Pro Tactical Workstation',
    subtitle: 'Investigation Workspace',
    category: 'Мобільний Штаб',
    modeTag: 'Investigation Workspace',
    depthZone: 'MIDGROUND',
    orbitRadius: 3.1,
    orbitAngle: 220, // TOP-LEFT
    orbitSpeed: 0.014,
    verticalOffset: -75,
    bobAmplitude: 9,
    bobFrequency: 0.85,
    tilt: [6, 14, 0],
    scale: 0.98,
    specs: {
      screen: '16" Liquid Retina XDR 120Hz (105° Clamshell)',
      latency: '35 ms Offline-Sync',
      role: 'Автономна мобільна станція для розслідування та координації на місцях',
      hapticOrSound: 'Тактильний скляний трекпад + підсвітка клавіатури Magic Keyboard',
    },
    keyFeatures: [
      'Реалістичний розкритий корпус 105° з алюмінієвим шарніром',
      'Офлайн-кеш бази укриттів та карти без доступу до інтернету',
      'Спліт-панель розвідки інцидентів та радіусу зон ППО',
      'Енергоефективний рендеринг для автономної роботи від батареї',
    ],
  },
  tablet: {
    id: 'tablet',
    title: '13" Ultra-Thin Tactical Tablet',
    subtitle: 'Touch Spatial Intelligence',
    category: 'Польовий Планшет',
    modeTag: 'Touch Spatial Intelligence',
    depthZone: 'MIDGROUND',
    orbitRadius: 2.9,
    orbitAngle: 40, // BOTTOM-RIGHT
    orbitSpeed: 0.016,
    verticalOffset: 65,
    bobAmplitude: 11,
    bobFrequency: 0.95,
    tilt: [-6, -12, 0],
    scale: 0.96,
    specs: {
      screen: '13" Tandem OLED Multi-Touch + Apple Pencil Pro',
      latency: '20 ms Touch Matrix',
      role: 'Сенсорне польове керування шарами карти, зонами та сховищами',
      hapticOrSound: 'Магнітний стілус з індукційною зарядкою + жести Pinch-to-Zoom',
    },
    keyFeatures: [
      'Ультратонкий корпус 4.8мм з алмазною фаскою граней',
      'Магнітно закріплений Apple Pencil Pro на верхній грані',
      'Сенсорне розгортання просторових шарів рельєфу та векторів',
      'Швидке виділення безпечних коридорів та секторів укриттів',
    ],
  },
  smartphone: {
    id: 'smartphone',
    title: 'Flagship Titanium Smartphone',
    subtitle: 'Personal Safety & Rapid Action',
    category: 'Персональний Захист',
    modeTag: 'Personal Safety',
    depthZone: 'FOREGROUND',
    orbitRadius: 2.3,
    orbitAngle: 90, // BOTTOM
    orbitSpeed: 0.022,
    verticalOffset: 105,
    bobAmplitude: 14,
    bobFrequency: 1.1,
    tilt: [8, -6, 0],
    scale: 1.1,
    specs: {
      screen: '6.7" Super Retina XDR Always-On (Titanium Frame)',
      latency: '15 ms Push Alert',
      role: 'Миттєве особисте сповіщення та порятунок за 1 секунду',
      hapticOrSound: 'Bypass DND сирена у беззвучному режимі + Taptic Engine',
    },
    keyFeatures: [
      'Dynamic Island з живою пульсацією таймера ETA підльоту',
      'Live Activity на заблокованому екрані з маршрутом до сховища',
      'Пряма кнопка навігації до найближчого укриття (340м)',
      'Титановий Grade 5 корпус з кнопкою Action Button та безрамковим склом',
    ],
  },
  watch: {
    id: 'watch',
    title: 'Rugged Titanium Smart Watch',
    subtitle: 'One-Glance Wrist Radar',
    category: 'Носимий Радар',
    modeTag: 'One-Glance Safety',
    depthZone: 'FOREGROUND',
    orbitRadius: 2.5,
    orbitAngle: 180, // LEFT
    orbitSpeed: 0.024,
    verticalOffset: 12,
    bobAmplitude: 13,
    bobFrequency: 1.15,
    tilt: [4, 16, 0],
    scale: 1.12,
    specs: {
      screen: '2.0" 3000 nits Sapphire Crystal (Cushion Case)',
      latency: '8 ms Haptic Pulse',
      role: 'Миттєвий тактильний маяк безпосередньо на зап’ясті',
      hapticOrSound: 'Індивідуальні вібро-патерни загрози + рифлена Digital Crown',
    },
    keyFeatures: [
      'Помаранчевий ремінець Alpine Loop з титановим замком G-Hook',
      'Циферблат Wayfinder з лімбом компаса та таймером хвилин',
      'Офлайн-стрілка напрямку до дверей найближчого сховища',
      'Фізична кнопка Action Button та мікрофонні отвори',
    ],
  },
  car: {
    id: 'car',
    title: 'Automotive Infotainment Cockpit',
    subtitle: 'Driver & Passenger Safety On-Road',
    category: 'Безпека в Дорозі',
    modeTag: 'Driver/Passenger Safety',
    depthZone: 'MIDGROUND',
    orbitRadius: 3.2,
    orbitAngle: 140, // BOTTOM-LEFT
    orbitSpeed: 0.011,
    verticalOffset: 80,
    bobAmplitude: 9,
    bobFrequency: 0.75,
    tilt: [3, 14, 0],
    scale: 0.96,
    specs: {
      screen: '15" Floating Automotive Console (Leather Brow Cockpit)',
      latency: '40 ms Auto-Route',
      role: 'Захист водія та пасажирів під час руху трасою чи містом',
      hapticOrSound: 'Авто-приглушення аудіосистеми + голосові підказки маневру',
    },
    keyFeatures: [
      'Козирок торпеди з фактурної шкіри з декоративною прошивкою',
      'Автоматична побудова об’їзду небезпечних секторів підльоту',
      'Відображення перевірених АЗС-укриттів (WOG, OKKO, Socar) на шляху',
      'Великий водійський інтерфейс із мінімальним відволіканням від керма',
    ],
  },
  ar_vr: {
    id: 'ar_vr',
    title: 'AR/VR Spatial Headset & HUD',
    subtitle: 'Spatial Intelligence & Holographic Airspace',
    category: 'Просторова Голограма',
    modeTag: 'Spatial Intelligence',
    depthZone: 'BACKGROUND',
    orbitRadius: 3.5,
    orbitAngle: 320, // TOP-RIGHT
    orbitSpeed: 0.010,
    verticalOffset: -85,
    bobAmplitude: 10,
    bobFrequency: 0.7,
    tilt: [-8, 10, 0],
    scale: 0.95,
    specs: {
      screen: 'Dual 4K Micro-OLED Spatial Visor (Solo Knit Band)',
      latency: '12 ms Photon-to-Motion',
      role: 'Тривимірна голограма купола захисту прямо у полі зору',
      hapticOrSound: 'Spatial 3D Audio позиціонування джерела звуку',
    },
    keyFeatures: [
      'Вигнуте тривимірне ламіноване скло з ефектом сяйва EyeSight',
      'Ребристий текстильний ремінець Solo Knit з регулятором Fit Dial',
      'Голографічна проекція висоти (AGL), азимута та купола ППО',
      'Керування поглядом (Gaze Tracking) та мікро-жестом Pinch',
    ],
  },
  kiosk: {
    id: 'kiosk',
    title: '55" Outdoor Public Safety Totem',
    subtitle: 'Municipal Emergency Alert & Shelter Guide',
    category: 'Муніципальна Безпека',
    modeTag: 'Public Safety Totem',
    depthZone: 'BACKGROUND',
    orbitRadius: 3.5,
    orbitAngle: 150,
    orbitSpeed: 0.014,
    verticalOffset: 60,
    bobAmplitude: 8,
    bobFrequency: 0.7,
    tilt: [-5, -10, 0],
    scale: 0.95,
    specs: {
      screen: '55" Ultra-Bright 4000 nits Outdoor Display',
      latency: '20 ms Municipal Broadcast',
      role: 'Публічне міське сповіщення, схема евакуації та SOS зв’язок 112',
      hapticOrSound: '120 dB фізична електросирена та стробоскоп',
    },
    keyFeatures: [
      'Антивандальний корпус IP65 зі сталі 4мм',
      'Автономний UPS на 48 годин безперебійної роботи',
      'Інтерактивна схема підземних укриттів та виходів метро',
      'Кнопка екстреного виклику ДСНС/Поліції з двостороннім аудіо',
    ],
  },
};

export const DeviceFocusDetail: React.FC<DeviceFocusDetailProps> = ({
  deviceType,
  threatModel,
  onBackToEcosystem,
  onNavigateToMap,
  onNavigateToSimulator,
  onNavigateToShelters,
}) => {
  const config = DEVICE_CONFIGS_DICT[deviceType];
  const [isTestActive, setIsTestActive] = useState(false);
  const isAlarm = threatModel.activeAlarmsCount > 0;

  const handleTriggerDeviceTest = () => {
    setIsTestActive(true);
    playWebAudioSound('alert');
    setTimeout(() => {
      setIsTestActive(false);
    }, 4000);
  };

  return (
    <div className="relative z-30 bg-slate-950/95 border-2 border-cyan-500/50 rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-300">
      
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-5 mb-6">
        <button
          onClick={onBackToEcosystem}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center gap-2 transition-all hover:-translate-x-0.5 shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>До екосистеми (Орбітальний вигляд)</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
            {config.modeTag.toUpperCase()}
          </span>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            {config.specs.latency}
          </span>
        </div>
      </div>

      {/* Main Focus Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Col: Device Title, Specs & Key Capabilities */}
        <div className="lg:col-span-6 space-y-4">
          <div>
            <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider block mb-1">
              {config.category}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {config.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              {config.specs.role}
            </p>
          </div>

          {/* Specs Matrix */}
          <div className="grid grid-cols-2 gap-2.5 text-xs font-mono pt-2">
            <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Дисплей & Матриця:</span>
              <span className="text-slate-200 font-bold block mt-0.5">{config.specs.screen}</span>
            </div>
            <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Затримка сигналу:</span>
              <span className="text-cyan-400 font-bold block mt-0.5">{config.specs.latency}</span>
            </div>
            <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 col-span-2">
              <span className="text-[10px] text-slate-500 block">Сповіщення та звук:</span>
              <span className="text-amber-300 font-bold block mt-0.5">{config.specs.hapticOrSound}</span>
            </div>
          </div>

          {/* Key Features Checklist */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Ключові можливості режиму:
            </h4>
            <div className="space-y-1.5">
              {config.keyFeatures.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                  <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Test & Deep Dive Buttons */}
          <div className="pt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={handleTriggerDeviceTest}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                isTestActive
                  ? 'bg-rose-500 text-slate-950 font-black animate-pulse shadow-lg shadow-rose-950'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-950/60'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>{isTestActive ? 'Тестова тривога активна...' : 'Протестувати сповіщення на цьому пристрої'}</span>
            </button>

            {onNavigateToMap && (
              <button
                onClick={onNavigateToMap}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold"
              >
                Відкрити 3D Карту
              </button>
            )}
          </div>
        </div>

        {/* Right Col: Live Authentic 3D Device Model & Interactive Screen Demo */}
        <div className="lg:col-span-6 bg-slate-900/90 rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-inner flex flex-col justify-between min-h-[380px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 text-xs font-mono">
            <span className="text-cyan-300 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>3D АПАРАТНИЙ МОДУЛЬ · {config.modeTag.toUpperCase()}</span>
            </span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isAlarm || isTestActive ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
              <span className="text-emerald-400 font-bold text-[10px]">
                {isTestActive ? 'ТЕСТ АКТИВНИЙ' : 'REALTIME SYNC OK'}
              </span>
            </div>
          </div>

          {/* 3D Model Stage Container */}
          <div className="my-auto py-4 flex flex-col items-center justify-center relative perspective-1200">
            {/* Subtle Floor Glow */}
            <div className="absolute w-56 h-12 bg-cyan-500/15 rounded-full blur-xl pointer-events-none -bottom-2" />

            <div 
              className={`transition-all duration-500 transform-gpu ${
                isTestActive ? 'scale-110 animate-bounce' : 'hover:scale-105'
              }`}
              style={{
                transform: 'rotateX(8deg) rotateY(-4deg)',
                transformStyle: 'preserve-3d',
              }}
            >
              <OrbitalDeviceModel
                type={deviceType}
                threatModel={{
                  ...threatModel,
                  activeAlarmsCount: isTestActive ? 8 : threatModel.activeAlarmsCount,
                }}
                isSelected={true}
                partnerMode={false}
              />
            </div>
          </div>

          {/* Telemetry Footer */}
          <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2">
            <span className="text-slate-300">
              {threatModel.myRegionStatus.name} · ETA {threatModel.myRegionStatus.etaMinutes || 18} хв
            </span>
            <span className="text-cyan-300 font-bold">Шифрування AES-256</span>
          </div>
        </div>

      </div>
    </div>
  );
};
