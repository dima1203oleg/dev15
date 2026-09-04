import React from 'react';
import { 
  Shield, ArrowRight, Download, Radio, Compass, Navigation, Clock, MapPin, 
  Users, Bell, AlertTriangle, ChevronRight, QrCode, Sparkles, Building2,
  Award
} from 'lucide-react';
import { ThreatEvent } from '../types';
import { ThreeDShowcase } from './ThreeDShowcase';
import { HeroIntelligenceStack } from './HeroIntelligenceStack';
import { DeviceExperienceLab } from './DeviceExperienceLab';

interface HeroSectionProps {
  onNavigateToMap: () => void;
  onNavigateToFeatures: () => void;
  onNavigateToPartner: () => void;
  onNavigateToDownload: () => void;
  threats: ThreatEvent[];
  threatDataMode: 'LIVE' | 'DEMO_DATA' | 'NOT_CONNECTED';
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigateToMap,
  onNavigateToFeatures,
  onNavigateToPartner,
  onNavigateToDownload,
  threats,
  threatDataMode
}) => {
  return (
    <section className="relative overflow-hidden pt-6 pb-20 lg:pt-10 lg:pb-28">
      
      {/* Background High-Tech Cyan & Deep Space Gradients */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] sm:w-[1000px] h-[450px] bg-gradient-to-b from-cyan-500/10 via-blue-600/10 to-transparent blur-[140px] rounded-full pointer-events-none -z-10"></div>
      <div className="absolute top-1/2 -left-20 w-[400px] h-[400px] bg-rose-600/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
      <div className="absolute top-1/3 -right-20 w-[450px] h-[450px] bg-amber-600/10 blur-[130px] rounded-full pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ========================================================================= */}
        {/* HERO TITLE & CALL TO ACTION HEADER (Matching reference images)           */}
        {/* ========================================================================= */}
        <div className="grid max-w-7xl mx-auto gap-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-center">
          <div className="flex flex-col items-center text-center lg:col-span-1 lg:items-start lg:text-left">
          
          {/* Eyebrow Pill as in Image 2: "У БЕЗПЕЧНІШЕ ЗАВТРА" */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/40 text-xs font-mono tracking-widest text-cyan-300 mb-5 shadow-lg shadow-cyan-950/30">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
            <span className="font-bold uppercase tracking-wider">У БЕЗПЕЧНІШЕ ЗАВТРА</span>
          </div>

          {/* Main Headline (Exact words from reference image 1) */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.04] font-['Plus_Jakarta_Sans']">
            Не просто тривога. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 drop-shadow-[0_0_35px_rgba(0,212,255,0.4)]">
              Розумій ситуацію.
            </span>
          </h1>

          <div className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-mono ${
            threatDataMode === 'LIVE' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' :
            threatDataMode === 'DEMO_DATA' ? 'border-amber-400/30 bg-amber-400/10 text-amber-300' :
            'border-slate-700 bg-slate-900/70 text-slate-400'
          }`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {threatDataMode === 'LIVE' ? 'THREATSERVER · LIVE' : threatDataMode === 'DEMO_DATA' ? 'DEMO DATA · ВІЗУАЛЬНИЙ РЕЖИМ' : 'NOT CONNECTED · ПІДКЛЮЧЕННЯ ОЧІКУЄТЬСЯ'}
          </div>

          {/* 4 Feature Key Bullets with Shields (Exact match to Reference Image 1) */}
          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto text-left">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200">
              <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-medium">Реальні дані в режимі реального часу</span>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200">
              <Navigation className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-medium">Траєкторії та напрямок загроз</span>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200">
              <Bell className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-medium">Персоналізовані сповіщення</span>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-medium">Інтелектуальний аналіз ризиків</span>
            </div>
          </div>

          {/* CTA Buttons & Store Badges Row */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full">
            
            {/* Primary Glowing Download Button */}
            <button
              onClick={onNavigateToDownload}
              className="flex items-center gap-3 px-7 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 hover:from-blue-500 hover:to-cyan-400 transition-all shadow-[0_0_30px_rgba(0,180,255,0.45)] hover:shadow-[0_0_45px_rgba(0,212,255,0.7)] active:scale-98 group"
              id="hero-primary-download-btn"
            >
              <span>Завантажити SIREN UA</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Learn More Button */}
            <button
              onClick={onNavigateToFeatures}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition-all active:scale-98"
              id="hero-learn-more-btn"
            >
              <span>▶ Дізнатися більше</span>
            </button>

          </div>

          {/* App Store / Google Play / QR Code Pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs">
            
            {/* Apple App Store */}
            <button
              onClick={onNavigateToDownload}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-left transition-all"
            >
              <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.87-.96.04-2.12.64-2.79 1.43-.59.68-1.11 1.76-1.03 2.81 1.07.08 2.19-.58 2.81-1.37z" />
              </svg>
              <div>
                <div className="text-[9px] text-slate-400 leading-tight">Завантажити з</div>
                <div className="text-xs font-bold text-white leading-tight">App Store</div>
              </div>
            </button>

            {/* Google Play */}
            <button
              onClick={onNavigateToDownload}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-left transition-all"
            >
              <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
              </svg>
              <div>
                <div className="text-[9px] text-slate-400 leading-tight">Доступно в</div>
                <div className="text-xs font-bold text-slate-400 leading-tight">COMING SOON</div>
              </div>
            </button>

            {/* QR Code Quick Scan Box */}
            <div 
              onClick={onNavigateToDownload}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-slate-300 hover:border-cyan-500/40 cursor-pointer transition-all"
            >
              <QrCode className="w-4 h-4 text-cyan-400" />
              <span className="text-[11px] font-mono">Скануй QR та завантажуй</span>
            </div>

          </div>

          </div>

          <HeroIntelligenceStack />
        </div>

        <DeviceExperienceLab dataMode={threatDataMode} />

        {/* ========================================================================= */}
        {/* THE MASTERPIECE 3D HOLOGRAPHIC & GADGET SHOWCASE                           */}
        {/* ========================================================================= */}
        <ThreeDShowcase
          onNavigateToDownload={onNavigateToDownload}
          onNavigateToMap={onNavigateToMap}
          onNavigateToPartner={onNavigateToPartner}
        />

        {/* ========================================================================= */}
        {/* 4 HIGH-TECH CAPABILITY CARDS (Directly under 3D as in reference images)   */}
        {/* ========================================================================= */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Актуальні попередження */}
          <div 
            onClick={onNavigateToMap}
            className="group relative p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer shadow-lg hover:shadow-cyan-950/30"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 font-mono">
              Актуальні попередження
            </h3>
            <p className="text-xs text-slate-400">
              Реальний час та перевірені джерела радіолокаційних комплексів.
            </p>
          </div>

          {/* Card 2: Прогнозні траєкторії */}
          <div 
            onClick={onNavigateToMap}
            className="group relative p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-rose-500/50 transition-all cursor-pointer shadow-lg hover:shadow-rose-950/30"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Navigation className="w-5 h-5 text-rose-400 rotate-45" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 font-mono">
              Прогнозні траєкторії
            </h3>
            <p className="text-xs text-slate-400">
              Швидкість, азимут, векторний коридор та орієнтовний час ETA.
            </p>
          </div>

          {/* Card 3: Інформація про укриття */}
          <div 
            onClick={onNavigateToMap}
            className="group relative p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer shadow-lg hover:shadow-emerald-950/30"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                <MapPin className="w-5 h-5 text-emerald-400" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 font-mono">
              Інформація про укриття
            </h3>
            <p className="text-xs text-slate-400">
              Поруч із вами: радіус пішої доступності, статус доступу 24/7 та місткість.
            </p>
          </div>

          {/* Card 4: Персональні сповіщення */}
          <div 
            onClick={onNavigateToFeatures}
            className="group relative p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer shadow-lg hover:shadow-amber-950/30"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Bell className="w-5 h-5 text-amber-400" />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 font-mono">
              Персональні сповіщення
            </h3>
            <p className="text-xs text-slate-400">
              Лише важливе: адаптивні фільтри без спаму та хибних спрацьовувань.
            </p>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* PARTNER PROGRAM HIGHLIGHT BANNER (Matching reference images)              */}
        {/* ========================================================================= */}
        <div className="mt-8 p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-blue-600/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-white uppercase tracking-wide font-mono">
                  Партнерська програма
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  5% – 25% комісії
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Рекомендуй корисне. Отримуй винагороду за кожне активне підключення.
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToPartner}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-950/40 active:scale-98 whitespace-nowrap"
            id="hero-partner-banner-btn"
          >
            <span>Стати партнером</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TRUST OF MILLIONS SECTION (Matching reference images)                     */}
        {/* ========================================================================= */}
        <div className="mt-14 pt-10 border-t border-slate-800/80 text-center">
          
          <h4 className="text-xs sm:text-sm font-mono tracking-widest text-slate-400 font-bold uppercase mb-8">
            ДОВІРА МІЛЬЙОНІВ В УКРАЇНІ
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            
            {/* 1. Люди */}
            <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-cyan-500/30 transition-all">
              <Users className="w-6 h-6 text-cyan-400 mb-2" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Люди
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">Цивільний захист 24/7</span>
            </div>

            {/* 2. Бізнес */}
            <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-amber-500/30 transition-all">
              <Building2 className="w-6 h-6 text-amber-400 mb-2" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Бізнес
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">Захист персоналу & логістики</span>
            </div>

            {/* 3. Державні органи (Trident Coat of Arms) */}
            <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-blue-500/30 transition-all">
              {/* Stylized Coat of Arms / Trident icon */}
              <div className="w-6 h-6 flex items-center justify-center text-blue-400 font-bold text-lg mb-2">
                🔱
              </div>
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Державні органи
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">Офіційні протоколи</span>
            </div>

            {/* 4. Сили безпеки */}
            <div className="flex flex-col items-center p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-emerald-500/30 transition-all">
              <Shield className="w-6 h-6 text-emerald-400 mb-2" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Сили безпеки
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">Радіолокаційна координація</span>
            </div>

          </div>

          <div className="mt-8">
            <span className="text-xs font-mono font-extrabold tracking-widest text-cyan-400 uppercase">
              БЕЗПЕЧНІША УКРАЇНА РАЗОМ
            </span>
          </div>

        </div>

      </div>
    </section>
  );
};
