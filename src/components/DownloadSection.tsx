import React, { useState } from 'react';
import { Download, Apple, Smartphone, Globe, QrCode, CheckCircle2, ShieldCheck, Copy, Check } from 'lucide-react';

export const DownloadSection: React.FC = () => {
  const [copiedLink, setCopiedLink] = useState(false);
  const sampleDeepLink = 'https://sirenua.com/join/SIREN_ATLAS';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sampleDeepLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <section id="download-section" className="py-16 lg:py-24 bg-[#0B0F17] border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-3">
            <Download className="w-4 h-4" />
            <span>Встановлення застосунку</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-['Plus_Jakarta_Sans']">
            Завантажити застосунок SIREN UA
          </h2>
          <p className="mt-4 text-slate-400 text-base leading-relaxed">
            Встановіть офіційний мобільний клієнт для отримання персоналізованих сповіщень та доступу до офлайн-бази укриттів.
          </p>
        </div>

        {/* 4 Download Channels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
          
          {/* iOS App Store */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl text-center">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-white mb-4 shadow">
                <Apple className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">Apple iOS</h3>
              <p className="text-xs text-slate-400 mt-1">iOS 16.0 або новіша</p>
            </div>
            <button disabled className="mt-6 w-full py-2.5 rounded-xl bg-slate-800/60 text-xs font-bold text-slate-400 border border-slate-700/70 cursor-not-allowed">
              NOT AVAILABLE · App Store
            </button>
          </div>

          {/* Android Google Play */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl text-center">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-emerald-400 mb-4 shadow">
                <Smartphone className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">Google Play</h3>
              <p className="text-xs text-slate-400 mt-1">Android 9.0 або новіша</p>
            </div>
            <button disabled className="mt-6 w-full py-2.5 rounded-xl bg-slate-800/60 text-xs font-bold text-slate-400 border border-slate-700/70 cursor-not-allowed">
              COMING SOON · Google Play
            </button>
          </div>

          {/* Direct APK */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl text-center">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-amber-400 mb-4 shadow">
                <Download className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">Прямий APK</h3>
              <p className="text-xs text-slate-400 mt-1">Версія v2.4.1 (SHA-256)</p>
            </div>
            <button disabled className="mt-6 w-full py-2.5 rounded-xl bg-slate-800/60 text-xs font-bold text-slate-400 border border-slate-700/70 cursor-not-allowed">
              NOT AVAILABLE · APK
            </button>
          </div>

          {/* Web App / PWA */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl text-center">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-rose-400 mb-4 shadow">
                <Globe className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">Web-версія</h3>
              <p className="text-xs text-slate-400 mt-1">Будь-який браузер</p>
            </div>
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="mt-6 w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow"
            >
              Використовувати Web
            </button>
          </div>

        </div>

        {/* Deep Link Pass-Through Box */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-mono font-bold">
              DEEP LINK · EXAMPLE ONLY
            </span>
            <h4 className="text-lg font-bold text-white">
              Безшовна інтеграція реферального посилання
            </h4>
            <p className="text-slate-400 text-xs max-w-xl">
              Приклад формату для майбутньої server-side атрибуції. Реальні Universal Links та store destinations ще не підключені.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-amber-300 select-all">
              {sampleDeepLink}
            </div>
            <button
              onClick={handleCopyLink}
              className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow"
              title="Скопіювати посилання"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
