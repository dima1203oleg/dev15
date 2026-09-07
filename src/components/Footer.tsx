import React, { useState } from 'react';
import { ChevronDown, Send, Youtube, Facebook, Instagram } from 'lucide-react';
import { runtimeConfig } from '../config/runtime';

interface FooterProps {
  theme?: 'light' | 'dark';
}

export const Footer: React.FC<FooterProps> = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  const [languageNote, setLanguageNote] = useState(false);
  const sourceContentHref = `${import.meta.env.BASE_URL}source-content/index.html`;

  return (
    <footer className={`w-full border-t mt-8 py-6 transition-colors ${
      isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200/80 text-slate-500'
    }`}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        
        {/* Left: Copyright */}
        <div className="flex items-center gap-2">
          <span>© 2025 SIREN UA</span>
          <span>Всі права захищені.</span>
        </div>

        {/* Center: Mission tagline */}
        <div className={`hidden sm:flex items-center gap-3 font-semibold ${
          isDark ? 'text-slate-300' : 'text-slate-700'
        }`}>
          <span>Безпека</span>
          <span>·</span>
          <span>Технології</span>
          <span>·</span>
          <span>Люди</span>
          <span>·</span>
          <span className="text-blue-600">Україна</span>
        </div>

        {/* Right: Language Switcher & Social Links */}
        <div className="flex items-center gap-5">
          <a
            href={sourceContentHref}
            className={`hidden md:inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${
              isDark
                ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
                : 'border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Розширений сайт SIREN UA
          </a>

          {/* Language selector */}
          <button type="button" onClick={() => setLanguageNote((visible) => !visible)} className={`px-2.5 py-1 rounded-full border flex items-center gap-1.5 transition-colors cursor-pointer text-[11px] font-bold ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-200/80 text-slate-800 hover:bg-slate-50 shadow-2xs'
          }`}>
            <span>🇺🇦</span>
            <span>Українська</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          {languageNote && <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>English — локалізація готується</span>}

          {/* Social Icons */}
          <div className="flex items-center gap-3 text-slate-400">
            <a 
              href={runtimeConfig.telegramUrl}
              target="_blank" 
              rel="noreferrer"
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isDark ? 'hover:text-white hover:bg-slate-800' : 'hover:text-blue-600 hover:bg-slate-100'
              }`}
              title="Telegram"
            >
              <Send className="w-4 h-4" />
            </a>

            {runtimeConfig.youtubeUrl && <a href={runtimeConfig.youtubeUrl} target="_blank" rel="noreferrer" className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark ? 'hover:text-white hover:bg-slate-800' : 'hover:text-rose-600 hover:bg-slate-100'}`} title="YouTube"><Youtube className="w-4 h-4" /></a>}
            {runtimeConfig.facebookUrl && <a href={runtimeConfig.facebookUrl} target="_blank" rel="noreferrer" className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark ? 'hover:text-white hover:bg-slate-800' : 'hover:text-blue-600 hover:bg-slate-100'}`} title="Facebook"><Facebook className="w-4 h-4" /></a>}
            {runtimeConfig.instagramUrl && <a href={runtimeConfig.instagramUrl} target="_blank" rel="noreferrer" className={`p-1.5 rounded-full transition-colors cursor-pointer ${isDark ? 'hover:text-white hover:bg-slate-800' : 'hover:text-pink-600 hover:bg-slate-100'}`} title="Instagram"><Instagram className="w-4 h-4" /></a>}
          </div>
        </div>

      </div>
    </footer>
  );
};
