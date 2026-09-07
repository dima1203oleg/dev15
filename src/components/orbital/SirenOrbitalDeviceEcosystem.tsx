import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { ThreatSceneModel } from '../../types';
import { playWebAudioSound } from '../../utils/sirenAudio';
import devices3dCutout from '../../assets/images/devices_3d_cutout.webp';
import devices3dCutoutDark from '../../assets/images/devices_3d_cutout_dark.webp';

interface SirenOrbitalDeviceEcosystemProps {
  threatModel?: ThreatSceneModel;
  onNavigateToTab?: (tabId: string) => void;
  isCriticalAlert?: boolean;
  theme?: 'light' | 'dark';
  [key: string]: any;
}

export const SirenOrbitalDeviceEcosystem: React.FC<SirenOrbitalDeviceEcosystemProps> = ({
  threatModel,
  theme = 'light',
}) => {
  const [activeDeviceIndex, setActiveDeviceIndex] = useState(2);
  const [showDetails, setShowDetails] = useState(false);
  const isDark = theme === 'dark';
  const ecosystemPoints = threatModel?.dataMode === 'LIVE'
    ? [
        'Синхронізація в реальному часі',
        'Єдині налаштування між пристроями',
        'Максимальна безпека',
        "Завжди на зв'язку",
      ]
    : threatModel?.dataMode === 'DEMO_DATA'
      ? [
          'Єдина демонстраційна модель даних',
          'Реальні джерела позначаються окремо',
          'Безпечний demo fallback',
          'Готовність до підключення live API',
        ]
      : [
          'Статус джерел видно на екрані',
          'Реальні дані не підміняються',
          'Безпечний fallback без live-обіцянок',
          'Готовність до підключення API',
        ];

  const devices = [
    { id: 'tv', name: 'Smart TV', sub: 'Телевізор', description: 'Ситуаційний екран для дому та спільного простору.' },
    { id: 'laptop', name: 'Ноутбук', sub: 'macOS / Windows', description: 'Робочий режим для аналізу подій і історії.' },
    { id: 'desktop', name: 'Десктоп', sub: 'Персональний', description: 'Повна просторова картина та керування шарами.' },
    { id: 'tablet', name: 'Планшет', sub: 'iPad / Android', description: 'Touch Spatial Intelligence для роботи з картою руками.' },
    { id: 'smartphone', name: 'Смартфон', sub: 'iOS / Android', description: 'Персональний район, ризик і найближча дія.' },
    { id: 'car', name: 'Auto', sub: 'CarPlay', description: 'Мінімальний driver-safe режим і голосові сповіщення.' },
    { id: 'ar_vr', name: 'AR / VR', sub: 'Шоломи', description: 'Просторовий контекст і розширена аналітика.' },
  ];
  const selectedDevice = devices[activeDeviceIndex] || devices[2];

  return (
    <div className={`siren-panel siren-device-panel w-full rounded-[28px] p-6 sm:p-8 lg:p-4 lg:h-[160px] border relative overflow-hidden my-2 transition-all duration-300 ${
      isDark 
        ? 'bg-[#10232B] border-[#2D4A55] text-white shadow-[0_20px_70px_rgba(0,0,0,0.22)]'
        : 'bg-[#F7FAFC] border-[#D9E2E8] text-[#0F172A] shadow-[0_16px_60px_rgba(42,68,83,0.07)]'
    }`}>
      
      {/* Background Soft Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[250px] rounded-full blur-[90px] pointer-events-none -z-10 ${
        isDark ? 'bg-blue-600/10' : 'bg-blue-100/60'
      }`} />

      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-4 relative z-10 w-full h-full">
        
        {/* Left Headline */}
        <div className="space-y-2.5 lg:space-y-1 max-w-[280px] lg:max-w-[245px] shrink-0">
          <div className="flex flex-col">
            <span className="text-[13px] font-extrabold text-[#2563EB] tracking-wider uppercase">
              SIREN UA
            </span>
            <h2 className={`text-[28px] sm:text-[32px] lg:text-[22px] font-black tracking-tight leading-[1.1] mt-1 ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
              На всіх пристроях
            </h2>
          </div>
          
          <p className={`text-[13px] lg:text-[10px] font-medium leading-relaxed lg:leading-tight ${isDark ? 'text-slate-300' : 'text-[#5A6A80]'}`}>
            Вдома, в дорозі або на роботі — єдина інтелектуальна екосистема сповіщень.
          </p>

          <div className="pt-2">
            <button
              onClick={() => {
                setShowDetails((current) => !current);
                playWebAudioSound('click');
              }}
              aria-expanded={showDetails}
              className={`px-6 py-2.5 lg:px-4 lg:py-1.5 rounded-full border text-[13px] lg:text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isDark 
                  ? 'bg-[#182335] border-[#2E4160] text-blue-400 hover:bg-[#202E46]' 
                  : 'bg-blue-50 border-blue-100 text-[#2563EB] hover:bg-blue-100 shadow-sm'
              }`}
            >
              <span>Дізнатись більше</span>
              <ArrowRight className="w-3.5 h-3.5" />
              </button>
              {showDetails && (
                <div className={`mt-3 rounded-2xl border px-3 py-2.5 text-[11px] leading-relaxed ${
                  isDark ? 'border-[#345562] bg-[#142D37] text-[#B9D8E2]' : 'border-[#D5E4EA] bg-[#F0F7F9] text-[#506A75]'
                }`}>
                  Єдина модель даних синхронізує карту, події, партнерську статистику та налаштування між сумісними пристроями.
                </div>
              )}
          </div>
        </div>

        {/* Center: Devices Image & Pedestal Platform */}
        <div className="flex-1 min-w-0 w-full flex flex-col items-center justify-center h-full">
          <div className="relative w-full max-w-2xl min-h-[180px] lg:min-h-0 lg:h-[112px] lg:aspect-auto flex items-center justify-center">
            {/* Devices 3D Render Image */}
            <img
              src={isDark ? devices3dCutoutDark : devices3dCutout}
              alt="SIREN UA на всіх пристроях"
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center drop-shadow-[0_15px_30px_rgba(37,99,235,0.18)]"
            />
          </div>

          {/* Labels Below Pedestal */}
          <div className="flex items-center justify-center gap-5 lg:gap-3 mt-2 lg:mt-0 hidden sm:flex flex-wrap">
            {devices.map((device, idx) => (
              <button
                key={device.id} 
                type="button"
                aria-pressed={activeDeviceIndex === idx}
                aria-label={`Показати роль пристрою ${device.name}`}
                className={`flex flex-col items-center text-center cursor-pointer opacity-85 hover:opacity-100 transition-opacity ${activeDeviceIndex === idx ? 'opacity-100' : ''}`}
                onClick={() => {
                  setActiveDeviceIndex(idx);
                  playWebAudioSound('click');
                }}
              >
                <span className={`text-[11px] lg:text-[8px] font-extrabold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                  {device.name}
                </span>
                <span className={`text-[9px] lg:text-[7px] font-semibold mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#5A6A80]'}`}>
                  {device.sub}
                </span>
              </button>
            ))}
          </div>
          
          {/* Pagination Dots */}
          <div className="flex items-center gap-1.5 justify-center mt-4 lg:mt-1">
            {devices.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Обрати пристрій ${devices[idx].name}`}
                aria-pressed={activeDeviceIndex === idx}
                onClick={() => {
                  setActiveDeviceIndex(idx);
                  playWebAudioSound('click');
                }}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  activeDeviceIndex === idx 
                    ? 'w-5 bg-[#2563EB]' 
                    : (isDark ? 'w-1.5 bg-[#24344D]' : 'w-1.5 bg-slate-300 hover:bg-slate-400')
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right Slogan and Features List */}
        <div className="max-w-[280px] lg:max-w-[235px]">
          <h3 className={`text-[16px] lg:text-[14px] font-black leading-snug ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
            Одна платформа.<br />
            На всіх пристроях.
          </h3>

          <div className={`mt-3 rounded-2xl border px-3 py-2.5 ${
            isDark ? 'border-[#345562] bg-[#142D37] text-[#B9D8E2]' : 'border-[#D5E4EA] bg-[#F0F7F9] text-[#506A75]'
          }`} aria-live="polite">
            <div className="text-[9px] font-black uppercase tracking-[0.12em] opacity-70">Обраний пристрій</div>
            <div className={`mt-1 text-[13px] font-black ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>{selectedDevice.name}</div>
            <div className="mt-0.5 text-[10px] leading-snug">{selectedDevice.description}</div>
          </div>

          <div className="mt-3.5 lg:mt-2 space-y-2.5 lg:space-y-1.5">
            {ecosystemPoints.map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-4 h-4 lg:w-3 lg:h-3 rounded-full bg-[#2563EB] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span className={`text-[12px] lg:text-[10px] font-semibold leading-tight ${isDark ? 'text-slate-200' : 'text-[#334155]'}`}>
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
