import React from 'react';
import { Clock3, DatabaseZap, Home, MapPinned, Navigation2, ShieldCheck } from 'lucide-react';

const layers = [
  { title: 'ТРАЄКТОРІЯ', detail: 'напрямок + прогноз', tone: 'rose', icon: Navigation2 },
  { title: 'РІВЕНЬ РИЗИКУ', detail: 'високий / червоний', tone: 'amber', icon: ShieldCheck },
  { title: 'ТВІЙ РАЙОН', detail: 'персональний шар', tone: 'blue', icon: MapPinned },
  { title: 'УКРИТТЯ', detail: 'перевірені поруч', tone: 'emerald', icon: Home },
];

export const HeroIntelligenceStack: React.FC = () => (
  <div className="relative mx-auto mt-12 h-[390px] w-full max-w-[560px] lg:col-span-1 lg:mt-0 lg:h-[520px]" aria-label="SIREN Intelligence Prism — візуальна модель шарів ситуації">
    <div className="absolute inset-x-8 top-8 h-64 rounded-full bg-cyan-500/10 blur-3xl" />
    <div className="absolute inset-0 siren-grid opacity-60" />
    <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/20 [box-shadow:0_0_80px_rgba(34,211,238,0.18),inset_0_0_60px_rgba(34,211,238,0.08)]" />
    <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-cyan-400/15 animate-[spin_24s_linear_infinite]" />

    <div className="absolute left-1/2 top-1/2 h-[235px] w-[310px] -translate-x-1/2 -translate-y-1/2 [perspective:1000px] sm:h-[280px] sm:w-[390px] lg:h-[330px] lg:w-[460px]">
      <div className="absolute inset-0 [transform:rotateX(58deg)_rotateZ(-8deg)] [transform-style:preserve-3d]">
        {layers.map(({ title, detail, tone, icon: Icon }, index) => (
          <div
            key={title}
            className={`absolute inset-x-0 top-1/2 flex h-20 -translate-y-1/2 items-center justify-between rounded-2xl border px-4 shadow-2xl backdrop-blur-md transition-transform duration-500 sm:h-24 sm:px-6 lg:h-28 ${
              tone === 'rose' ? 'border-rose-300/45 bg-rose-500/10 shadow-rose-500/25' :
              tone === 'amber' ? 'border-amber-300/45 bg-amber-400/10 shadow-amber-400/20' :
              tone === 'blue' ? 'border-cyan-300/45 bg-cyan-500/10 shadow-cyan-400/25' :
              'border-emerald-300/45 bg-emerald-400/10 shadow-emerald-400/20'
            }`}
            style={{ transform: `translateZ(${(layers.length - index) * 34}px) translateY(${(index - 1.5) * 16}px)` }}
          >
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-slate-950/60 text-cyan-200 sm:h-11 sm:w-11">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-[0.18em] text-white sm:text-xs">{title}</div>
                <div className="mt-1 text-[9px] text-slate-300/75 sm:text-[10px]">{detail}</div>
              </div>
            </div>
            <span className={`h-2 w-2 rounded-full ${tone === 'rose' ? 'bg-rose-300' : tone === 'amber' ? 'bg-amber-300' : tone === 'blue' ? 'bg-cyan-300' : 'bg-emerald-300'} shadow-[0_0_18px_currentColor]`} />
          </div>
        ))}

        <svg className="pointer-events-none absolute -inset-16 h-[calc(100%+8rem)] w-[calc(100%+8rem)] overflow-visible" viewBox="0 0 600 400" fill="none" aria-hidden="true">
          <path d="M112 250 C180 210 190 145 270 124 S390 115 460 55" stroke="#fb7185" strokeWidth="2" strokeDasharray="6 8" className="animate-dash-flow" />
          <path d="M164 304 C240 260 315 290 398 240" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="3 9" opacity=".8" className="animate-dash-flow" />
          <circle cx="460" cy="55" r="9" fill="#fb7185" fillOpacity=".25" stroke="#fb7185" />
          <circle cx="460" cy="55" r="3" fill="#fff" />
        </svg>
      </div>
    </div>

    <div className="absolute left-1 top-10 flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-slate-950/75 px-3 py-2 text-[9px] font-mono text-cyan-100/80 backdrop-blur-md sm:left-4 sm:top-14">
      <DatabaseZap className="h-3.5 w-3.5 text-cyan-300" />
      <span>INTELLIGENCE PRISM<br /><span className="text-slate-500">4 data layers · one decision</span></span>
    </div>
    <div className="absolute right-1 top-24 flex items-center gap-2 rounded-xl border border-amber-300/20 bg-slate-950/75 px-3 py-2 text-[9px] font-mono text-amber-100/80 backdrop-blur-md sm:right-4 sm:top-28">
      <Clock3 className="h-3.5 w-3.5 text-amber-300" />
      <span>ETA RANGE<br /><span className="text-slate-500">не гарантія маршруту</span></span>
    </div>
    <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-300/20 bg-slate-950/80 px-3 py-1.5 text-[9px] font-mono text-emerald-200/80 backdrop-blur-md sm:bottom-10">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
      CONFIDENCE · TIMESTAMP · SOURCE
    </div>
  </div>
);
