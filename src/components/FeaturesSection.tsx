import React from 'react';
import { Compass, Clock, MapPin, ShieldCheck, Database, Layers, Radio, Lock, Zap, AlertCircle } from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features-section" className="py-16 lg:py-24 bg-[#0B0F17]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Технологічні переваги SIREN UA</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-['Plus_Jakarta_Sans']">
            Чому SIREN UA — це не просто ще одна карта тривог
          </h2>
          <p className="mt-4 text-slate-400 text-base leading-relaxed">
            Перетворення фрагментованого шуму на чітку, структуровану картину безпеки вашого району.
          </p>
        </div>

        {/* 6 Feature Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Pillar 1: Differentiated Yellow/Red Risk Model */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-[#0C1018] border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Диференційована модель ризику
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Перехід від бінарної моделі «тривога по всій області» до точного розуміння локального ступеня загрози: Нормальний, Підвищений, Високий або Критичний.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-300 font-mono">
              <span>Зональна точність</span>
              <span>Жовтий / Червоний</span>
            </div>
          </div>

          {/* Pillar 2: Vector & Trajectory Modeling */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-[#0C1018] border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Вектор та динамічна траєкторія
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Автоматичний розрахунок азимуту руху, швидкості (км/год) та побудова ймовірного коридору переміщення цілі на найближчі 15–40 хвилин.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-rose-300 font-mono">
              <span>Швидкість & Азимут</span>
              <span>Коридор польоту</span>
            </div>
          </div>

          {/* Pillar 3: Realistic ETA Intervals */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-[#0C1018] border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Орієнтовний часовий інтервал (ETA)
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Відмова від фальшивої категоричності. Система чесно показує орієнтовні інтервали (наприклад, 10–15 хв) на основі актуальних телеметричних даних.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-blue-300 font-mono">
              <span>Без фейк-прогнозів</span>
              <span>Діапазон хвилин</span>
            </div>
          </div>

          {/* Pillar 4: Hyper-Local District Precision */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-[#0C1018] border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Районна та територіальна точність
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Персоналізація для вашого міста, району чи громади. Дозволяє розуміти, чи загроза пролітає повз транзитом, чи рухається безпосередньо у ваш сектор.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-emerald-300 font-mono">
              <span>Геоприв'язка</span>
              <span>Конкретний район</span>
            </div>
          </div>

          {/* Pillar 5: Verified Shelter Database */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-[#0C1018] border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Укриття з фільтрами автономності
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Швидкий пошук захисних споруд, станцій метро та підземних паркінгів із мітками цілодобового доступу, місткості та наявності резервного живлення.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-purple-300 font-mono">
              <span>24/7 доступ</span>
              <span>Генератори & Вода</span>
            </div>
          </div>

          {/* Pillar 6: Data Transparency & Confidence */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-[#0C1018] border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl">
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Маркування достовірності даних
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Чітке технічне розмежування: CONFIRMED (підтверджено), ESTIMATED (розрахунково), PREDICTED (прогнозно) чи UNVERIFIED (непідтверджено).
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-cyan-300 font-mono">
              <span>CONFIRMED / ESTIMATED</span>
              <span>Часові мітки</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
