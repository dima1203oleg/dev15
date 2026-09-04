import React, { useState } from 'react';
import { Shield, Radio, Activity, Users, Settings, Download, ExternalLink, Flame, CheckCircle2, Menu, X } from 'lucide-react';
import { ThreatEvent } from '../types';

interface HeaderProps {
  activeSection: string;
  setActiveSection: (sec: string) => void;
  onOpenPartnerCabinet: () => void;
  onOpenAdmin: () => void;
  threats: ThreatEvent[];
  isThreatServerOnline: boolean;
  threatDataMode: 'LIVE' | 'DEMO_DATA' | 'NOT_CONNECTED';
  currentRole: string;
  onSwitchRole: (role: string, rank?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  setActiveSection,
  onOpenPartnerCabinet,
  onOpenAdmin,
  threats,
  isThreatServerOnline,
  threatDataMode,
  currentRole,
  onSwitchRole
}) => {
  const activeThreatsCount = threats.length;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navigateMobile = (section: string) => {
    setActiveSection(section);
    setMobileNavOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#0B0F17]/90 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Brand Logo & Live Radar Pulse */}
          <div 
            onClick={() => setActiveSection('home')}
            className="flex items-center gap-3 cursor-pointer group"
            id="brand-logo-btn"
          >
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-slate-900 border border-cyan-400/40 group-hover:border-cyan-400 transition-all shadow-lg shadow-cyan-950/40">
              <Shield className="w-5 h-5 text-cyan-400 group-hover:scale-105 transition-transform" />
              {/* Radar rings */}
              <div className="absolute inset-0 rounded-2xl border border-cyan-400/20 animate-ping opacity-40 pointer-events-none"></div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white font-['Plus_Jakarta_Sans']">
                  Siren<span className="text-cyan-400">UA</span>
                </span>
                <span className="px-2 py-0.5 text-[9px] font-extrabold tracking-widest uppercase rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                  РОЗУМІЙ СИТУАЦІЮ
                </span>
              </div>
              <p className="text-[11px] text-slate-400 tracking-tight hidden sm:block">
                3D-платформа повітряної безпеки & Партнерська мережа
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveSection('home')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === 'home'
                  ? 'text-white bg-slate-800/70 border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
              id="nav-home-btn"
            >
              Головна
            </button>
            <button
              onClick={() => setActiveSection('map')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                activeSection === 'map'
                  ? 'text-white bg-slate-800/70 border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
              id="nav-map-btn"
            >
              <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
              Карта ситуації
              {activeThreatsCount > 0 && (
                <span className="px-1.5 py-0.2 text-xs font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {activeThreatsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveSection('features')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === 'features'
                  ? 'text-white bg-slate-800/70 border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
              id="nav-features-btn"
            >
              Можливості
            </button>
            <button
              onClick={() => setActiveSection('partner')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                activeSection === 'partner'
                  ? 'text-amber-300 bg-amber-950/30 border border-amber-500/30'
                  : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-950/20'
              }`}
              id="nav-partner-btn"
            >
              <Users className="w-4 h-4 text-amber-400" />
              Партнерка 5–25%
            </button>
            <button
              onClick={() => setActiveSection('download')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === 'download'
                  ? 'text-white bg-slate-800/70 border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
              id="nav-download-btn"
            >
              Завантажити
            </button>
          </nav>

          {/* Action CTAs & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">

            <button
              onClick={() => setMobileNavOpen((isOpen) => !isOpen)}
              aria-label={mobileNavOpen ? 'Закрити меню' : 'Відкрити меню'}
              aria-expanded={mobileNavOpen}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700/70 bg-slate-900/80 text-slate-200"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            
            {/* Live Threat Indicator */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
              <span className={`w-2 h-2 rounded-full ${isThreatServerOnline ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
              <span className="text-slate-300 font-mono text-[11px]">
                {threatDataMode === 'DEMO_DATA' ? 'DEMO DATA' : threatDataMode === 'LIVE' && isThreatServerOnline ? 'ThreatServer: LIVE' : 'NOT CONNECTED'}
              </span>
            </div>

            {/* Partner Cabinet Button */}
            <button
              onClick={onOpenPartnerCabinet}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-amber-500/20 to-amber-600/10 hover:from-amber-500/30 hover:to-amber-600/20 text-amber-300 border border-amber-500/40 transition-all shadow-md shadow-amber-950/20 active:scale-98"
              id="open-partner-cabinet-btn"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>Кабінет партнера</span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] bg-amber-400/20 font-bold text-amber-300 border border-amber-400/30">
                {currentRole === 'PARTNER' ? 'ПАРТНЕР' : 'УВІЙТИ'}
              </span>
            </button>

            {/* Admin Back-Office Button */}
            <button
              onClick={onOpenAdmin}
              title="Панель адміністратора"
              className="hidden sm:flex p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
              id="open-admin-btn"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

        </div>

        {mobileNavOpen && (
          <div className="md:hidden absolute left-3 right-3 top-[calc(100%+0.5rem)] z-50 rounded-2xl border border-cyan-400/20 bg-[#07101d]/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl">
            {[
              ['home', 'Головна'],
              ['map', 'Карта ситуації'],
              ['features', 'Можливості'],
              ['partner', 'Партнерка 5–25%'],
              ['download', 'Завантажити']
            ].map(([section, label]) => (
              <button
                key={section}
                onClick={() => navigateMobile(section)}
                className={`flex min-h-11 w-full items-center justify-between rounded-xl px-4 text-left text-sm ${activeSection === section ? 'bg-cyan-400/10 text-cyan-200' : 'text-slate-300 hover:bg-slate-800/80'}`}
              >
                <span>{label}</span>
                {section === 'map' && activeThreatsCount > 0 && <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-300">{activeThreatsCount}</span>}
              </button>
            ))}
            <button onClick={() => { onOpenPartnerCabinet(); setMobileNavOpen(false); }} className="mt-2 min-h-11 w-full rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 text-left text-sm font-semibold text-amber-200">
              Відкрити кабінет партнера
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
