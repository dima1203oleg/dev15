import React, { useState } from 'react';
import { Users, TrendingUp, ShieldCheck, Award, DollarSign, ArrowRight, CheckCircle2, AlertTriangle, Sparkles, HelpCircle, Layers, Sliders } from 'lucide-react';

interface PartnerLandingSectionProps {
  onOpenCabinet: () => void;
}

export const PartnerLandingSection: React.FC<PartnerLandingSectionProps> = ({ onOpenCabinet }) => {
  // Interactive Calculator State
  const [calcL1Count, setCalcL1Count] = useState<number>(35); // Silver tier
  const [calcL2Count, setCalcL2Count] = useState<number>(70);
  // This calculator is intentionally illustrative. Production earnings must
  // come from the versioned QCB/ledger API, not from a frontend price.
  const illustrativeSubscriptionPriceUah = 149;

  // Determine Rank and Partner Rate based on L1 count
  let currentRank = 'Starter';
  let ratePercent = 5;

  if (calcL1Count >= 200) {
    currentRank = 'Platinum';
    ratePercent = 25;
  } else if (calcL1Count >= 75) {
    currentRank = 'Gold';
    ratePercent = 20;
  } else if (calcL1Count >= 30) {
    currentRank = 'Silver';
    ratePercent = 15;
  } else if (calcL1Count >= 10) {
    currentRank = 'Bronze';
    ratePercent = 10;
  } else {
    currentRank = 'Starter';
    ratePercent = 5;
  }

  // Monthly Earnings Calculations (L1 + L2 at single Partner Rate)
  const l1MonthlyRevenue = calcL1Count * illustrativeSubscriptionPriceUah * (ratePercent / 100);
  const l2MonthlyRevenue = calcL2Count * illustrativeSubscriptionPriceUah * (ratePercent / 100);
  const totalMonthlyEarnings = Math.round(l1MonthlyRevenue + l2MonthlyRevenue);

  return (
    <section id="partner-section" className="py-16 lg:py-24 bg-gradient-to-b from-[#090D14] via-[#0B0F17] to-[#090D14] border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-3">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Офіційна партнерська програма 5–25%</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-['Plus_Jakarta_Sans']">
            Користуйся. Рекомендуй. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-400">
              Отримуй винагороду.
            </span>
          </h2>
          <p className="mt-4 text-slate-300 text-base leading-relaxed">
            SIREN UA — це реальний продукт безпеки з високою цінністю. Ви рекомендуєте корисний застосунок своїй аудиторії та можете отримувати винагороду за кваліфіковані активні передплати.
          </p>
        </div>

        {/* Message for Creators / Influencers Banner */}
        <div className="mb-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20 border border-amber-500/30 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl space-y-3">
            <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[11px] font-bold uppercase">
              Для авторів контенту (TikTok, Telegram, Instagram, YouTube)
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              «Я не пропоную рекламувати абстрактний продукт. Спочатку переконайся сам.»
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Відкрий SIREN UA і подивись, що він реально дає: карту ситуації, траєкторію загрози, персональний район, орієнтовний час та найближчі укриття. Якщо продукт корисний тобі — рекомендуй його своїй спільноті.
            </p>
          </div>
        </div>

        {/* 2-Level Revenue Logic Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col justify-between shadow-xl">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold font-mono mb-4">
                L1
              </div>
              <h4 className="text-base font-bold text-white mb-2">
                1-й рівень (Особисті рекомендації)
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Користувачі, які зареєструвалися та оплатили передплату безпосередньо за вашим реферальним посиланням або QR-кодом.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono text-amber-300 font-bold">
              Ваша ставка: 5%–25% щомісяця
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col justify-between shadow-xl">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold font-mono mb-4">
                L2
              </div>
              <h4 className="text-base font-bold text-white mb-2">
                2-й рівень (Мережа партнерів)
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Користувачі, яких залучили ваші L1-партнери. L2 відкривається одразу на ранзі Starter (від 1-го користувача)!
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono text-amber-300 font-bold">
              Така сама ставка: 5%–25% щомісяця
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col justify-between shadow-xl">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold font-mono mb-4">
                50%
              </div>
              <h4 className="text-base font-bold text-white mb-2">
                Абсолютний Hard Cap (50% QCB)
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Сувора фінансова стійкість. Сума всіх виплат ніколи не перевищує 50% від базової вартості передплати. L3+ суворо не оплачується.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs font-mono text-emerald-400 font-bold">
              100% захист від пірамідних схем
            </div>
          </div>

        </div>

        {/* Rank Matrix Table */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl mb-14">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Рангова матриця та відсоткові ставки</h3>
              <p className="text-xs text-slate-400">Ранг визначається виключно кількістю особистих платних L1 користувачів</p>
            </div>
            <div className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold font-mono">
              L2 активний з рангу Starter
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="py-3 px-4">Ранг</th>
                  <th className="py-3 px-4">Активних платних L1</th>
                  <th className="py-3 px-4">Ставка L1</th>
                  <th className="py-3 px-4">Ставка L2</th>
                  <th className="py-3 px-4">Grace захист</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                <tr className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                    Starter
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">1 – 9</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-400">5%</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-400">5%</td>
                  <td className="py-3.5 px-4 text-slate-400">Базовий</td>
                </tr>
                <tr className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-amber-200 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-700"></span>
                    Bronze
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">10 – 29</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-400">10%</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-400">10%</td>
                  <td className="py-3.5 px-4 text-emerald-400">14 днів</td>
                </tr>
                <tr className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-200 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                    Silver
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">30 – 74</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-400">15%</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-400">15%</td>
                  <td className="py-3.5 px-4 text-emerald-400">14 днів</td>
                </tr>
                <tr className="hover:bg-slate-800/40 transition-colors bg-amber-500/5">
                  <td className="py-3.5 px-4 font-bold text-amber-400 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-md shadow-amber-400/50"></span>
                    Gold (Поточний)
                  </td>
                  <td className="py-3.5 px-4 font-mono text-amber-300 font-bold">75 – 199</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-400 text-base">20%</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-400 text-base">20%</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-semibold">14 днів</td>
                </tr>
                <tr className="hover:bg-slate-800/40 transition-colors bg-gradient-to-r from-purple-500/10 to-transparent">
                  <td className="py-3.5 px-4 font-bold text-purple-300 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-md shadow-purple-400/50"></span>
                    Platinum
                  </td>
                  <td className="py-3.5 px-4 font-mono text-purple-200 font-bold">200+</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-purple-300 text-base">25%</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-purple-300 text-base">25%</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-semibold">14 днів</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Interactive Earnings Calculator */}
        <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-[#0C1018] border border-amber-500/40 p-6 sm:p-10 shadow-2xl mb-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Sliders Left */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 text-xs font-bold font-mono">
                  ІЛЮСТРАТИВНИЙ КАЛЬКУЛЯТОР
                </span>
                <h3 className="text-2xl font-bold text-white mt-2">
                  Розрахуйте свій щомісячний дохід
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  Приклад за умовною ціною 149 грн/міс. Фактична виплата залежить від QCB, правил каналу та ledger.
                </p>
              </div>

              {/* Slider 1: L1 Count */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">Особисто залучені користувачі (L1):</span>
                  <span className="font-bold text-amber-400 font-mono text-sm">{calcL1Count} чол.</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="300"
                  value={calcL1Count}
                  onChange={(e) => setCalcL1Count(Number(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1 (Starter 5%)</span>
                  <span>75 (Gold 20%)</span>
                  <span>200+ (Platinum 25%)</span>
                </div>
              </div>

              {/* Slider 2: L2 Count */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">Користувачі 2-го рівня (L2):</span>
                  <span className="font-bold text-amber-400 font-mono text-sm">{calcL2Count} чол.</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={calcL2Count}
                  onChange={(e) => setCalcL2Count(Number(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0</span>
                  <span>250</span>
                  <span>500+</span>
                </div>
              </div>
            </div>

            {/* Result Box Right */}
            <div className="lg:col-span-5 rounded-2xl bg-[#080C12] border border-amber-500/40 p-6 flex flex-col justify-between text-center space-y-4 shadow-xl">
              <div>
                <span className="text-xs text-slate-400 font-mono uppercase">Ваш розрахунковий ранг:</span>
                <div className="text-xl font-extrabold text-amber-400 mt-1 font-mono">
                  {currentRank.toUpperCase()} ({ratePercent}%)
                </div>
              </div>

              <div className="py-4 border-y border-slate-800 space-y-2">
                <span className="text-xs text-slate-400">Орієнтовний дохід на місяць:</span>
                <div className="text-3xl sm:text-4xl font-extrabold text-white font-['Plus_Jakarta_Sans']">
                  {totalMonthlyEarnings.toLocaleString('uk-UA')} <span className="text-amber-400 text-2xl font-bold">грн/міс</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  L1: {Math.round(l1MonthlyRevenue)} грн + L2: {Math.round(l2MonthlyRevenue)} грн
                </p>
              </div>

              <button
                onClick={onOpenCabinet}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 transition-all active:scale-98"
              >
                Відкрити кабінет партнера
              </button>
            </div>

          </div>
        </div>

        {/* Ambassador Program & Creator Benefits */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold font-mono">
              AMBASSADOR PROGRAM
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-white">
              Стратегічний статус Амбасадора SIREN UA
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Для лідерів думок, блогерів та волонтерських спільнот із аудиторією від 500+ активних користувачів.
            </p>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Особистий верифікований бейдж та ко-брендинговий лендинг</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Пріоритетний вивід коштів за 1 хвилину через Monobank / LiqPay</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Індивідуальні промо-матеріали та доступ до ранніх функцій</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-purple-500/30 text-center">
              <div className="text-xs text-slate-400 font-mono">Ambassador Candidate</div>
              <div className="text-xl font-bold text-purple-300 mt-1">500+ L1</div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-purple-500/30 text-center">
              <div className="text-xs text-slate-400 font-mono">Ambassador Pro</div>
              <div className="text-xl font-bold text-purple-300 mt-1">750+ L1</div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-purple-500/30 text-center">
              <div className="text-xs text-slate-400 font-mono">Ambassador Elite</div>
              <div className="text-xl font-bold text-purple-300 mt-1">1000+ L1</div>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900 border border-purple-500/30 text-center">
              <div className="text-xs text-slate-400 font-mono">Ambassador Legend</div>
              <div className="text-xl font-bold text-purple-300 mt-1">2500+ L1</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
