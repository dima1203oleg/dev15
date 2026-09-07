import React from 'react';
import { ArrowRight, Check, Database, Layers3, ShieldCheck, Sparkles, Smartphone, Tablet, Monitor } from 'lucide-react';

interface AboutSectionProps {
  theme?: 'light' | 'dark';
  onOpenMap?: () => void;
  onOpenGuide?: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ theme = 'light', onOpenMap, onOpenGuide }) => {
  const isDark = theme === 'dark';
  const panel = isDark ? 'bg-slate-900/80 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-sm';
  const muted = isDark ? 'text-slate-400' : 'text-slate-600';

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <section className={`rounded-3xl border p-6 sm:p-8 relative overflow-hidden ${panel}`}>
        <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold ${isDark ? 'border-slate-700 bg-slate-800/70 text-cyan-300' : 'border-blue-100 bg-blue-50 text-blue-700'}`}>
            <Sparkles className="h-3.5 w-3.5" /> SIREN UA · про платформу
          </div>
          <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight">Не просто тривога.<br /><span className="text-blue-500">Контроль над ситуацією.</span></h1>
          <p className={`mt-4 max-w-2xl text-sm sm:text-base leading-relaxed ${muted}`}>
            SIREN UA об’єднує просторову карту, підтверджені події, прогнозні напрямки, часовий контекст та інформацію про укриття в одному зрозумілому інтерфейсі.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={onOpenMap} className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 cursor-pointer">
              Відкрити карту <ArrowRight className="h-4 w-4" />
            </button>
            <button type="button" onClick={onOpenGuide} className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-bold cursor-pointer ${isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}>
              Як це працює
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Database, title: 'Дані з поясненням', text: 'Кожен стан має freshness, джерело та семантику: підтверджено, оцінка, прогноз або недоступно.' },
          { icon: Layers3, title: 'Просторова модель', text: 'Карта, області, ризик, події, траєкторії та укриття працюють як пов’язані шари, а не випадкові віджети.' },
          { icon: ShieldCheck, title: 'Безпека понад ефект', text: 'Критична інформація завжди має пріоритет над маркетингом, а demo-дані не маскуються під live.' },
        ].map(({ icon: Icon, title, text }) => (
          <article key={title} className={`rounded-3xl border p-5 ${panel}`}>
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${isDark ? 'bg-blue-950/60 text-cyan-300' : 'bg-blue-50 text-blue-600'}`}><Icon className="h-5 w-5" /></div>
            <h2 className="mt-4 text-base font-black">{title}</h2>
            <p className={`mt-2 text-xs leading-relaxed ${muted}`}>{text}</p>
          </article>
        ))}
      </div>

      <section className={`rounded-3xl border p-5 sm:p-6 ${panel}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black">Одна інтелектуальна основа — різні сценарії</h2>
            <p className={`mt-1 text-xs ${muted}`}>Інтерфейс змінюється відповідно до пристрою, але джерело істини залишається єдиним.</p>
          </div>
          <div className={`flex items-center gap-4 rounded-2xl border px-4 py-3 text-xs font-semibold ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50'}`}>
            <span className="inline-flex items-center gap-1.5"><Monitor className="h-4 w-4 text-blue-500" /> Desktop</span>
            <span className="inline-flex items-center gap-1.5"><Tablet className="h-4 w-4 text-cyan-500" /> Tablet</span>
            <span className="inline-flex items-center gap-1.5"><Smartphone className="h-4 w-4 text-indigo-500" /> Mobile</span>
          </div>
        </div>
        <div className={`mt-5 grid gap-2 text-xs ${muted} sm:grid-cols-2`}>
          {['REAL DATA ONLY у production', 'Чітке розділення live / demo / stale', 'Touch-first та accessible controls', 'Fallback без WebGL із тією ж інформацією'].map((item) => (
            <div key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" />{item}</div>
          ))}
        </div>
      </section>
    </div>
  );
};
