import React from 'react';
import { Shield, Github, Radio, Heart, ExternalLink, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#070B11] border-t border-slate-800/80 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          
          {/* Brand Col */}
          <div className="md:col-span-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-white tracking-tight font-['Plus_Jakarta_Sans']">
                SIREN <span className="text-rose-400">UA</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Центральна вебплатформа ситуаційної обізнаності повітряної безпеки та офіційна партнерська програма 5–25% на 2 рівні.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              Atlas Trinity Ecosystem © 2026. Всі права захищено.
            </div>
          </div>

          {/* Nav Col 1 */}
          <div className="md:col-span-2 space-y-2">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Продукт</h4>
            <ul className="space-y-1.5 text-xs">
              <li><a href="#map-section" className="hover:text-white transition-colors">Оперативна карта</a></li>
              <li><a href="#features-section" className="hover:text-white transition-colors">Можливості та ETA</a></li>
              <li><a href="#download-section" className="hover:text-white transition-colors">Мобільні застосунки</a></li>
              <li><a href="#map-section" className="hover:text-white transition-colors">База укриттів</a></li>
            </ul>
          </div>

          {/* Nav Col 2: Partner */}
          <div className="md:col-span-3 space-y-2">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Партнерська програма</h4>
            <ul className="space-y-1.5 text-xs">
              <li><a href="#partner-section" className="hover:text-amber-300 transition-colors">2-Рівнева модель (L1 + L2)</a></li>
              <li><a href="#partner-section" className="hover:text-amber-300 transition-colors">Ранги 5–25% (Starter до Platinum)</a></li>
              <li><a href="#partner-section" className="hover:text-amber-300 transition-colors">Ambassador Program</a></li>
              <li><a href="#partner-section" className="hover:text-amber-300 transition-colors">Калькулятор прибутку</a></li>
            </ul>
          </div>

          {/* Nav Col 3: Repositories & Legal */}
          <div className="md:col-span-3 space-y-2">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Atlas Trinity Repositories</h4>
            <ul className="space-y-1.5 text-[11px] font-mono">
              <li className="flex items-center gap-1.5 text-slate-300">
                <Github className="w-3.5 h-3.5 text-slate-400" />
                <span>SirenUA-Website (Web Platform)</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <Github className="w-3.5 h-3.5 text-slate-500" />
                <span>SirenUA-ThreatServer (Threat API)</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <Github className="w-3.5 h-3.5 text-slate-500" />
                <span>SirenUA (Mobile App iOS/Android)</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Safety Disclaimer & Compliance */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div className="flex items-center gap-2 text-center md:text-left">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Увага: SIREN UA є аналітичним інформаційним шаром. Під час повітряної тривоги завжди прямуйте до укриття та керуйтеся офіційними джерелами органів влади.
            </span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <span className="text-slate-500">Made with Ukrainian Resilience 🇺🇦</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
