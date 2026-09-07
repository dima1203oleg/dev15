import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Box, 
  Layers, 
  Activity, 
  ShieldCheck, 
  Flame, 
  Zap, 
  Check, 
  AlertCircle,
  Download,
  Share2
} from 'lucide-react';

interface ThreeDSpecModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThreeDSpecModal: React.FC<ThreeDSpecModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 text-slate-200 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SIREN UA ТЕХНІЧНА СПЕЦИФІКАЦІЯ · v2.0</span>
            </div>
            <h2 className="text-2xl font-black text-white">
              ТЗ на візуальну частину SirenUA v2.0
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Офіційний документ концепції: «Живий Digital Twin України»
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Закрити специфікацію 3D"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Sections based on Images 10 & 11 */}
        <div className="space-y-6 text-xs sm:text-sm leading-relaxed">
          
          {/* Section 1: МЕТА ТА КЛЮЧОВА ІДЕЯ */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h3 className="font-bold text-cyan-300 text-base mb-2 flex items-center gap-2">
              <Box className="w-4 h-4" /> 1. МЕТА ТА КЛЮЧОВА ІДЕЯ
            </h3>
            <p className="text-slate-300 mb-2">
              <strong>Мета:</strong> Створити унікальну, реалістичну, високотехнологічну просторову візуалізацію повітряної обстановки в Україні, яка швидко, інтуїтивно і без паніки пояснює людині: <em>«Що летить? Куди? Скільки є часу? Що робити?»</em>.
            </p>
            <p className="text-slate-300">
              <strong>Ключова ідея:</strong> <strong>«Живий Digital Twin України»</strong> — не просто плоска карта із зафарбованими областями, а просторова цифрова копія з реальними висотами, рельєфом, векторами загроз та безпечними сховищами.
            </p>
          </div>

          {/* Section 2: ПРИНЦИПИ РОБОТИ */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h3 className="font-bold text-amber-300 text-base mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> 2. БАЗОВІ ПРИНЦИПИ
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-slate-100 block mb-1">● Реальність</span>
                <span className="text-slate-400">Форми України, рельєф, висоти польоту, азимути та фізично обґрунтовані траєкторії.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-slate-100 block mb-1">● Зрозумілість за 1 секунду</span>
                <span className="text-slate-400">Людина має миттєво зрозуміти рівень небезпеки без складного аналізу тексту.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-slate-100 block mb-1">● Глибина (Просторові шари)</span>
                <span className="text-slate-400">Шари розгортаються у вертикальній площині для детального вивчення.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-bold text-slate-100 block mb-1">● Продуктивність (60 FPS)</span>
                <span className="text-slate-400">Миттєвий рендеринг на будь-якому смартфоні без перегріву та зависань.</span>
              </div>
            </div>
          </div>

          {/* Section 3: ШАРИ ВІЗУАЛІЗАЦІЇ */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h3 className="font-bold text-purple-300 text-base mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" /> 3. СТРУКТУРА ШАРІВ
            </h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-rose-400 font-bold">Шар 6: Траєкторії</span>
                <span className="text-slate-400">Підтверджені / оцінені / прогнозні вектори, швидкість, висота</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-amber-400 font-bold">Шар 5: Рівень ризику</span>
                <span className="text-slate-400">Heatmap (Спокійно → Увага → Підвищений → Високий)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-cyan-400 font-bold">Шар 4: Персональний</span>
                <span className="text-slate-400">Мій район, дистанція до загроз, персональні сповіщення</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-emerald-400 font-bold">Шар 3: Укриття</span>
                <span className="text-slate-400">Бомбосховища, метро, місткість, статус доступності, генератори</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-300 font-bold">Шар 2: Межі & Інфраструктура</span>
                <span className="text-slate-400">Області, райони, аеродроми, ТЕС, АЕС, ключові мости</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400 font-bold">Шар 1: Базова Карта</span>
                <span className="text-slate-400">Рельєф, річки, вогні міст у темному кібер-стилі</span>
              </div>
            </div>
          </div>

          {/* Section 4: МАТЕРІАЛИ ТА ЕФЕКТИ */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h3 className="font-bold text-cyan-300 text-base mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" /> 4. ДИЗАЙН-СИСТЕМА ТА КОЛЬОРИ
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
                <span className="block text-cyan-400 font-bold">#00D2FF</span>
                <span className="text-[10px] text-slate-400">Головний акцент</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
                <span className="block text-rose-400 font-bold">#EF4444</span>
                <span className="text-[10px] text-slate-400">Критична небезпека</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
                <span className="block text-amber-400 font-bold">#FACC15</span>
                <span className="text-[10px] text-slate-400">Увага / ETA</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
                <span className="block text-emerald-400 font-bold">#22C55E</span>
                <span className="text-[10px] text-slate-400">Безпечно / Укриття</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-black hover:bg-cyan-400 transition-colors text-xs"
          >
            Зрозуміло, закрити
          </button>
        </div>

      </div>
    </div>
  );
};
