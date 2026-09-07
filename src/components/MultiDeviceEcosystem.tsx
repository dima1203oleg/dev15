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
  Building2, 
  Layers, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Radio, 
  Volume2, 
  Check, 
  MapPin, 
  Clock, 
  Flame,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { RegionData, ThreatTrajectory, UserSettings } from '../types';

interface MultiDeviceEcosystemProps {
  regions: RegionData[];
  trajectories: ThreatTrajectory[];
  settings: UserSettings;
  onNavigateToMap: () => void;
  onNavigateToSimulator: () => void;
  onNavigateToShelters: () => void;
}

interface DeviceProfile {
  id: string;
  name: string;
  category: string;
  icon: any;
  tagline: string;
  screenDesc: string;
  keyFeatures: string[];
  gradient: string;
  borderGlow: string;
}

const DEVICES: DeviceProfile[] = [
  {
    id: 'DESKTOP',
    name: 'Desktop Command',
    category: 'Аналітичний штаб',
    icon: Monitor,
    tagline: 'Повна аналітична картина для великих екранів',
    screenDesc: 'Багатопанельний інтерфейс: рельєф, детальні траєкторії, кореляція джерел, статус енергосистеми та моніторинг усіх 25 регіонів одночасно.',
    keyFeatures: ['Raytracing карти', 'Мультимоніторний режим', 'Гарячі клавіші управління', 'Експорт звітів'],
    gradient: 'from-cyan-500/20 to-sky-950/40',
    borderGlow: 'border-cyan-500/40',
  },
  {
    id: 'LAPTOP',
    name: 'Laptop Workstation',
    category: 'Робочий режим',
    icon: Laptop,
    tagline: 'Компактний командний пункт для роботи в дорозі та офісі',
    screenDesc: 'Оптимізований 13-16" інтерфейс з боковим віджетом загроз, швидким пошуком укриттів та низьким споживанням батареї.',
    keyFeatures: ['Режим низького енергоспоживання', 'Міні-віджет у треї', 'Офлайн кеш укриттів', 'Швидкі сповіщення'],
    gradient: 'from-blue-500/20 to-slate-950/40',
    borderGlow: 'border-blue-500/40',
  },
  {
    id: 'TABLET',
    name: 'Tablet Touch Tactical',
    category: 'Сенсорне керування',
    icon: Tablet,
    tagline: 'Керування жестами та обертання кінчиками пальців',
    screenDesc: 'Спеціальний сенсорний режим: масштабування двома пальцями, розгортання шарів одним рухом, швидкі перемикачі шарів.',
    keyFeatures: ['Плавний Pinch-to-Zoom', 'Жестове перемикання шарів', 'Мобільний штабний екран', 'Спліт-скрін режим'],
    gradient: 'from-purple-500/20 to-purple-950/40',
    borderGlow: 'border-purple-500/40',
  },
  {
    id: 'PHONE',
    name: 'Smartphone Safety',
    category: 'Персональна безпека',
    icon: Smartphone,
    tagline: 'Миттєве розуміння небезпеки за 1 секунду',
    screenDesc: 'Головний екран фокусується на вашому районі: точний час підльоту (ETA), звук сирени в обхід беззвучного режиму та найближче бомбосховище.',
    keyFeatures: ['Критичні сповіщення (Bypass DND)', 'Віджет на Lock Screen', 'Live Activity таймер ETA', 'GPS-компас до укриття'],
    gradient: 'from-amber-500/20 to-amber-950/40',
    borderGlow: 'border-amber-500/40',
  },
  {
    id: 'TV',
    name: 'Smart TV Hub',
    category: 'Дім та Офіс',
    icon: Tv,
    tagline: 'Ситуація для всієї родини, бізнесу чи холу',
    screenDesc: 'Великоформатний 4K Dashboard з автооновленням для телевізорів у будинках, навчальних закладах та на підприємствах.',
    keyFeatures: ['4K Ultra-HD оптимізація', 'Голосове сповіщення диктора', 'Режим скрінсейвера безпеки', 'Великі читабельні шрифти'],
    gradient: 'from-emerald-500/20 to-emerald-950/40',
    borderGlow: 'border-emerald-500/40',
  },
  {
    id: 'WATCH',
    name: 'Apple Watch & WearOS',
    category: 'Швидкий погляд',
    icon: Watch,
    tagline: 'Головне на зап’ясті навіть без смартфона поруч',
    screenDesc: 'Тактильна вібрація, колір загрози та лічильник хвилин прямо на циферблаті. Працює автономно через LTE.',
    keyFeatures: ['Тактильні шаблони вібрації', 'Ускладнення на циферблат', 'ETA відлік часу', 'Офлайн компас'],
    gradient: 'from-rose-500/20 to-rose-950/40',
    borderGlow: 'border-rose-500/40',
  },
  {
    id: 'CAR',
    name: 'CarPlay & Android Auto',
    category: 'Безпека в дорозі',
    icon: Car,
    tagline: 'Спокій за кермом: уникнення небезпечних зон на маршруті',
    screenDesc: 'Інтеграція в автомобільну медіасистему: голосове попередження, побудова об’їзду зон ураження та напрямок до придорожніх укриттів.',
    keyFeatures: ['Голосовий асистент водія', 'Анти-паніка навігація', 'Мінімалістичний інтерфейс', 'Авто-приглушення музики'],
    gradient: 'from-orange-500/20 to-orange-950/40',
    borderGlow: 'border-orange-500/40',
  },
  {
    id: 'VISION',
    name: 'AR Glasses & Vision Pro',
    category: 'Просторова аналітика',
    icon: Glasses,
    tagline: 'Голограма простору України перед вашими очима',
    screenDesc: 'Просторова візуалізація з реальними висотами польоту ракет, тривимірними променями РЛС та проекцією безпечних зон.',
    keyFeatures: ['Spatial Computing', 'Голографічний Digital Twin', 'Керування поглядом та пальцями', 'Повне занурення'],
    gradient: 'from-sky-500/20 to-indigo-950/40',
    borderGlow: 'border-sky-500/40',
  },
  {
    id: 'KIOSK',
    name: 'Public Safety Kiosk',
    category: 'Громадські місця',
    icon: Building2,
    tagline: 'Публічний доступ на вокзалах, ТРЦ та в метро',
    screenDesc: 'Вандалостійкий інформаційний термінал з планом евакуації, звуковою сиреною та картою доступності міських сховищ.',
    keyFeatures: ['Публічні звукові маяки', 'Плани поверхів та виходів', 'Багатомовний інтерфейс', 'Резервне живлення'],
    gradient: 'from-indigo-500/20 to-slate-950/40',
    borderGlow: 'border-indigo-500/40',
  },
];

export const MultiDeviceEcosystem: React.FC<MultiDeviceEcosystemProps> = ({
  regions,
  trajectories,
  settings,
  onNavigateToMap,
  onNavigateToSimulator,
  onNavigateToShelters,
}) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('DESKTOP');
  const selectedDevice = DEVICES.find((d) => d.id === selectedDeviceId) || DEVICES[0];
  const alarmRegions = regions.filter((r) => r.isAlarm);
  const myRegionData = regions.find((r) => r.id === settings.myRegion) || regions[0];
  const primaryThreat = trajectories[0];

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden mb-10">
      
      {/* Background Ambience */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(56, 189, 248, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute top-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-3">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Кросплатформна Екосистема SirenUA</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
            Один простір даних.<br />
            <span className="bg-gradient-to-r from-purple-400 via-sky-300 to-cyan-300 bg-clip-text text-transparent">
              9 спеціалізованих інтерфейсів під кожен сценарій життя.
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl">
            Від циферблата годинника до 4K телевізора та AR окулярів — кожен пристрій отримує адаптовані просторові дані та виконує свою роль у вашому захисті.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToSimulator}
            className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Тест симуляції загроз</span>
          </button>
        </div>
      </div>

      {/* Device Selection Bar (9 Chips) */}
      <div className="relative z-10 grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 mb-8">
        {DEVICES.map((device) => {
          const Icon = device.icon;
          const isSelected = selectedDeviceId === device.id;
          return (
            <button
              key={device.id}
              onClick={() => setSelectedDeviceId(device.id)}
              className={`p-3 rounded-2xl border transition-all flex flex-col items-center text-center gap-1.5 ${
                isSelected
                  ? 'bg-slate-900 border-cyan-400 shadow-lg shadow-cyan-950/80 scale-105'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-2 rounded-xl ${isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[11px] font-bold truncate w-full ${isSelected ? 'text-slate-100' : 'text-slate-400'}`}>
                {device.name.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Interactive Selected Device Preview Box */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        
        {/* Left: Device Mockup Display (7 Cols on LG) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          
          <div className="w-full max-w-lg bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
            
            {/* Device Frame Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 text-xs">
              <div className="flex items-center gap-2 font-mono font-bold text-cyan-300">
                {React.createElement(selectedDevice.icon, { className: 'w-4 h-4' })}
                <span>{selectedDevice.name.toUpperCase()} · LIVE SIMULATION</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>CONNECTED</span>
              </div>
            </div>

            {/* Dynamic Screen Interior */}
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 min-h-[260px] flex flex-col justify-between relative overflow-hidden">
              
              {/* Specialized visual per device */}
              {selectedDeviceId === 'WATCH' ? (
                <div className="flex flex-col items-center justify-center my-auto space-y-3">
                  <div className="w-24 h-24 rounded-full border-4 border-rose-500 bg-rose-950/40 flex flex-col items-center justify-center p-2 text-center animate-pulse">
                    <span className="font-mono text-xs font-bold text-rose-300">ТРИВОГА</span>
                    <span className="font-mono text-2xl font-black text-white">18m</span>
                    <span className="text-[9px] text-slate-300 font-mono">ETA {myRegionData.shortName}</span>
                  </div>
                  <span className="text-xs text-slate-300 font-medium">Тактильна вібрація активована</span>
                </div>
              ) : selectedDeviceId === 'CAR' ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs">
                    <div className="font-bold flex items-center justify-between mb-1">
                      <span>⚠️ УВАГА НА МАРШРУТІ (через 12 км)</span>
                      <span className="font-mono">ETA 18 хв</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Зафіксовано рух БпЛА за вашим вектором руху. Побудовано безпечний об’їзд.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <span>Найближче укриття на автотрасі:</span>
                    <span className="font-bold text-emerald-300 font-mono">АЗС + Сховище (1.8 км)</span>
                  </div>
                </div>
              ) : selectedDeviceId === 'VISION' ? (
                <div className="relative h-44 w-full bg-slate-950 rounded-xl border border-sky-500/40 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-36 h-36 rounded-full border border-sky-400/30 animate-spin" />
                    <div className="w-20 h-20 rounded-full border border-cyan-400/40" />
                  </div>
                  <div className="relative z-10 text-center font-mono">
                    <span className="text-xs font-bold text-sky-300 block">SPATIAL HOLOGRAM</span>
                    <span className="text-lg font-black text-white">450m AGL · 185 km/h</span>
                    <span className="text-[10px] text-slate-400 block mt-1">Траєкторія Shahed-136 у вашому полі зору</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                      <span className="font-bold text-slate-200">Повітряний простір України</span>
                    </div>
                    <span className="font-mono text-rose-400 font-bold">{alarmRegions.length} областей у тривозі</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Провідна загроза:</span>
                      <span className="text-amber-300 font-bold">{primaryThreat?.name || 'БпЛА Shahed-136'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Вектор руху:</span>
                      <span className="text-cyan-300 font-mono">{primaryThreat?.azimuthDirection || '315° NW'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Мій регіон ({myRegionData.shortName}):</span>
                      <span className="text-emerald-400 font-bold font-mono">Укриття: 340м (4 хв)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Quick Controls */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">{selectedDevice.tagline}</span>
                <button
                  onClick={onNavigateToMap}
                  className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                >
                  Карта загроз <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>

        </div>

        {/* Right: Device Specs & Features Breakdown (5 Cols on LG) */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
            <span>{selectedDevice.category}</span>
          </div>

          <h3 className="text-2xl font-black text-slate-100">
            {selectedDevice.name}
          </h3>

          <p className="text-sm text-slate-300 leading-relaxed">
            {selectedDevice.screenDesc}
          </p>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase block mb-1">
              КЛЮЧОВІ ОСОБЛИВОСТІ
            </span>
            {selectedDevice.keyFeatures.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-slate-200">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 flex flex-wrap gap-3">
            <button
              onClick={onNavigateToShelters}
              className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Знайти укриття для {myRegionData.shortName}</span>
            </button>
            <button
              onClick={onNavigateToSimulator}
              className="px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" />
              <span>Симуляція загрози</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
