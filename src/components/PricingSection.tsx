import React, { useState } from 'react';
import { ArrowRight, Check, Clock3, CreditCard, Database, ShieldCheck, Sparkles } from 'lucide-react';
import { subscriptionService } from '../services/subscriptionService';
import { commercialPolicy } from '../config/commercial';

interface PricingSectionProps {
  theme?: 'light' | 'dark';
  onStartOnboarding?: () => void;
  onOpenHome?: () => void;
}

/**
 * Public pricing surface.  The commercial values are policy copy, not a
 * payment confirmation: billing must come from the verified provider before
 * a user can be charged or a subscription can become paid.
 */
export const PricingSection: React.FC<PricingSectionProps> = ({
  theme = 'light',
  onStartOnboarding,
  onOpenHome,
}) => {
  const [notice, setNotice] = useState<string | null>(null);
  const [trialPending, setTrialPending] = useState(false);
  const isDark = theme === 'dark';
  const panel = isDark
    ? 'bg-slate-900/80 border-slate-800 text-white'
    : 'bg-white border-slate-100 text-slate-900 shadow-sm';
  const muted = isDark ? 'text-slate-400' : 'text-slate-600';

  const handleStart = () => {
    onStartOnboarding?.();
  };

  const handleTrial = async () => {
    setTrialPending(true);
    setNotice(null);
    const response = await subscriptionService.startTrial();
    setTrialPending(false);
    if (response.data) {
      const endDate = response.data.trialEndsAt
        ? new Date(response.data.trialEndsAt).toLocaleDateString('uk-UA')
        : 'після підтвердження provider';
      setNotice(`Trial активовано до ${endDate}. Платіж не створено.`);
      return;
    }
    setNotice(response.error || 'Trial тимчасово недоступний.');
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <section className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 ${panel}`}>
        <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
          <div>
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold ${isDark ? 'border-slate-700 bg-slate-800/70 text-cyan-300' : 'border-blue-100 bg-blue-50 text-blue-700'}`}>
              <Sparkles className="h-3.5 w-3.5" /> SIREN UA · Premium
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              Розумій ситуацію.<br /><span className="text-blue-500">Користуйся без паніки.</span>
            </h1>
            <p className={`mt-4 max-w-2xl text-sm leading-relaxed sm:text-base ${muted}`}>
              Один зрозумілий простір для карти, підтверджених подій, прогнозних напрямків, хронології та інформації про укриття.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={handleTrial} disabled={trialPending} className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
                {trialPending ? 'Перевіряємо доступ…' : `Почати ${commercialPolicy.trialDays}-денний trial`} <ArrowRight className="h-4 w-4" />
              </button>
              <button type="button" onClick={handleStart} className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-bold transition ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}>
                Ознайомитися
              </button>
              <button type="button" onClick={onOpenHome} className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-bold transition ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}>
                Відкрити карту
              </button>
            </div>
            {notice && (
              <p role="status" className={`mt-3 max-w-xl rounded-xl border px-3 py-2 text-xs font-semibold ${isDark ? 'border-amber-500/30 bg-amber-950/30 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                {notice}
              </p>
            )}
          </div>

          <div className={`rounded-3xl border p-5 ${isDark ? 'border-cyan-900/70 bg-slate-950/70' : 'border-blue-100 bg-blue-50/60'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`text-xs font-bold uppercase tracking-[0.16em] ${muted}`}>{commercialPolicy.displayName}</p>
                <p className="mt-3 text-5xl font-black tracking-tight">${commercialPolicy.basePriceUsd}<span className={`text-base font-bold ${muted}`}> / місяць</span></p>
              </div>
              <span className="rounded-full bg-purple-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-purple-500">{commercialPolicy.trialDays} днів trial</span>
            </div>
            <p className={`mt-3 text-xs leading-relaxed ${muted}`}>
              Цільова базова ціна. Локальна валюта, VAT та ціна каналу визначаються verified billing provider під час оформлення.
            </p>
            <div className={`mt-5 border-t pt-4 text-xs ${isDark ? 'border-slate-800' : 'border-blue-100'}`}>
              <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Trial не створює комісію партнерам.</div>
              <div className="mt-2 flex items-center gap-2"><CreditCard className="h-4 w-4 text-blue-500" /> Несподіване списання без consent заборонене.</div>
            </div>
          </div>
        </div>
      </section>

      <section className={`rounded-3xl border p-5 sm:p-6 ${panel}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black">Що входить у Premium</h2>
            <p className={`mt-1 text-xs ${muted}`}>Функціональність однакова за змістом, але presentation змінюється відповідно до пристрою.</p>
          </div>
          <Database className="hidden h-6 w-6 text-cyan-500 sm:block" />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Просторова карта', 'Області, ризик, події та траєкторії з чітким статусом даних.'],
            ['Персональний район', 'Швидкий контекст для обраної області та найближчих дій.'],
            ['Хронологія', 'Перехід між поточним станом і доступною історією подій.'],
            ['Укриття', 'Пошук за підключеним реєстром без вигаданої доступності.'],
          ].map(([title, description]) => (
            <article key={title} className={`rounded-2xl border p-4 ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50'}`}>
              <Check className="h-5 w-5 text-emerald-500" />
              <h3 className="mt-3 text-sm font-black">{title}</h3>
              <p className={`mt-1 text-xs leading-relaxed ${muted}`}>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`grid gap-3 md:grid-cols-3 ${muted}`}>
        {[
          [Clock3, `Trial ${commercialPolicy.trialDays} днів`, 'Нагадування T−7 / T−3 / T−1 та завершення trial — окремі події системи.'],
          [CreditCard, 'Прозора оплата', 'Provider fee, FX та локальна ціна показуються до підтвердження.'],
          [ShieldCheck, 'REAL DATA ONLY', 'Якщо billing або джерело даних не підключено, інтерфейс прямо показує це.'],
        ].map(([Icon, title, description]) => {
          const FeatureIcon = Icon as typeof Clock3;
          return (
            <article key={title as string} className={`rounded-2xl border p-4 ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-white shadow-sm'}`}>
              <FeatureIcon className="h-5 w-5 text-blue-500" />
              <h3 className="mt-2 text-sm font-black text-current">{title as string}</h3>
              <p className="mt-1 text-xs leading-relaxed">{description as string}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
};
