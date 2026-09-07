import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  Search, 
  Sun, 
  Moon,
  ChevronDown,
  ShieldAlert,
  Star,
  Menu,
  X
} from 'lucide-react';
import { DashboardSection, ThreatDataMode } from '../types';
import { playWebAudioSound } from '../utils/sirenAudio';
import { profileService, UserProfileData } from '../services/profileService';
import { DataState } from '../types/dataEnvelope';
import { runtimeConfig } from '../config/runtime';

interface HeaderProps {
  activeSection: DashboardSection;
  onSelectSection: (section: DashboardSection) => void;
  onOpenFeatures?: () => void;
  onOpenGuide?: () => void;
  onToggleTheme?: () => void;
  theme?: 'light' | 'dark';
  dataMode?: ThreatDataMode;
}

type PublicNavTab = 'home' | 'features' | 'how' | 'pricing' | 'about';

export const Header: React.FC<HeaderProps> = ({ 
  activeSection,
  onSelectSection,
  onOpenFeatures,
  onOpenGuide,
  onToggleTheme,
  theme = 'light',
  dataMode = 'NOT_CONNECTED'
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<PublicNavTab>('home');
  const [lang, setLang] = useState('UK');
  const [languageOpen, setLanguageOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [profileState, setProfileState] = useState<DataState>(runtimeConfig.apiBaseUrl ? 'LOADING' : runtimeConfig.allowDemoData ? 'DEMO' : 'NOT_CONNECTED');

  useEffect(() => {
    let active = true;
    profileService.getProfile().then((response) => {
      if (!active) return;
      setProfileState(response.state);
      setProfileData(response.data);
    });
    return () => { active = false; };
  }, []);
  
  const isDark = theme === 'dark';
  const searchItems: Array<{ label: string; section: DashboardSection }> = [
    { label: 'Головна карта', section: 'HOME' },
    { label: 'Мережа та реферали', section: 'NETWORK' },
    { label: 'Фінанси та виплати', section: 'FINANCE' },
    { label: 'Тарифи Premium', section: 'PRICING' },
    { label: 'Аналітика', section: 'ANALYTICS' },
    { label: 'Укриття та маршрути', section: 'SHELTERS' },
    { label: 'Партнерська програма', section: 'AFFILIATE' },
    { label: 'Про SIREN UA', section: 'ABOUT' },
    { label: 'Профіль і безпека', section: 'PROFILE' },
  ];
  const searchResults = searchItems.filter((item) =>
    item.label.toLocaleLowerCase('uk-UA').includes(searchQuery.trim().toLocaleLowerCase('uk-UA'))
  );

  const handleNavClick = (section: DashboardSection, tabId?: PublicNavTab) => {
    if (tabId) {
      setActiveTab(tabId);
    } else if (section === 'HOME') {
      setActiveTab('home');
    } else if (section === 'PRICING') {
      setActiveTab('pricing');
    } else if (section === 'ABOUT') {
      setActiveTab('about');
    }
    onSelectSection(section);
    playWebAudioSound('click');
  };

  const handleMobileNavClick = (item: { id: string; section: DashboardSection }) => {
    if (item.id === 'features') onOpenFeatures?.();
    const publicTab = ['home', 'features', 'how', 'pricing', 'about'].includes(item.id)
      ? item.id as PublicNavTab
      : undefined;
    handleNavClick(item.section, publicTab);
    if (item.id === 'how') onOpenGuide?.();
    setMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'home', label: 'Головна', section: 'HOME' as DashboardSection },
    { id: 'features', label: 'Можливості', section: 'HOME' as DashboardSection },
    { id: 'how', label: 'Як це працює', section: 'HOME' as DashboardSection },
    { id: 'pricing', label: 'Тарифи', section: 'PRICING' as DashboardSection },
    { id: 'about', label: 'Про нас', section: 'ABOUT' as DashboardSection },
  ];

  const isNavItemActive = (item: { id: string; section: DashboardSection }) => {
    // The public header must reflect the routed workspace, not the last tab
    // the user happened to click before opening a product section.
    if (item.section === 'PRICING') return activeSection === 'PRICING';
    if (item.section === 'ABOUT') return activeSection === 'ABOUT';
    return activeSection === 'HOME' && activeTab === item.id;
  };

  const mobileSectionItems = [
    { id: 'network', label: 'Мережа та реферали', section: 'NETWORK' as DashboardSection },
    { id: 'finance', label: 'Фінанси та виплати', section: 'FINANCE' as DashboardSection },
    { id: 'analytics', label: 'Аналітика', section: 'ANALYTICS' as DashboardSection },
    { id: 'shelters', label: 'Укриття та маршрути', section: 'SHELTERS' as DashboardSection },
    { id: 'affiliate', label: 'Партнерська програма', section: 'AFFILIATE' as DashboardSection },
  ];

  return (
    <header className={`sticky top-0 z-40 w-full transition-colors duration-200 border-b backdrop-blur-xl ${
      isDark 
        ? 'bg-[#0D131F]/90 border-[#1B273D] text-white' 
        : 'bg-[#EAEFF5]/90 border-[#D1DCE5] text-[#0F172A]'
    }`}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Logo with double signal wave */}
        <div 
          className="flex items-center gap-3 cursor-pointer flex-shrink-0" 
          onClick={() => handleNavClick('HOME', 'home')}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') handleNavClick('HOME', 'home');
          }}
          aria-label="Відкрити головну сторінку"
        >
          <div className={`w-9 h-9 flex items-center justify-center transition-colors ${
            isDark ? 'text-slate-300' : 'text-[#6F8593]'
          }`}>
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.93 19.07A10 10 0 0 1 4.93 4.93" />
              <path d="M7.76 16.24a6 6 0 0 1 0-8.48" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
              <path d="M16.24 7.76a6 6 0 0 1 0 8.48" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className={`text-base font-black tracking-wider leading-none ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
              SIREN UA
            </span>
            <span className={`text-[9px] font-extrabold tracking-widest mt-0.5 uppercase ${isDark ? 'text-slate-400' : 'text-[#5A6A80]'}`}>
              НА КРОК ПОПЕРЕДУ
            </span>
          </div>
        </div>

        {/* Center: Main Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 min-[1160px]:gap-8">
          {navItems.map((item) => {
            const isActive = isNavItemActive(item);
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'features') onOpenFeatures?.();
                  handleNavClick(item.section as DashboardSection, item.id as PublicNavTab);
                  if (item.id === 'how') onOpenGuide?.();
                }}
                className={`text-[13.5px] font-semibold transition-colors cursor-pointer py-1 relative ${
                  isActive
                    ? (isDark ? 'text-white font-bold' : 'text-[#0F172A] font-bold')
                    : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-[#5A6A80] hover:text-[#0F172A]')
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-[#2563EB] rounded-full" />
                )}
              </button>
            );
          })}
          </nav>

        {/* Right: Search, Theme, Notifications, Lang, Profile Capsule */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Search Bar (Capsule) */}
          <div className="relative hidden min-[1160px]:flex items-center">
            <Search className={`w-3.5 h-3.5 absolute left-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="Пошук..."
              aria-label="Пошук розділу SIREN UA"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchResults[0]) {
                  handleNavClick(searchResults[0].section);
                  setSearchQuery('');
                }
                if (e.key === 'Escape') setSearchQuery('');
              }}
              className={`pl-9 pr-3 py-1.5 rounded-full text-[12px] font-medium outline-none transition-all w-36 focus:w-48 ${
                isDark 
                  ? 'bg-[#182335] text-white placeholder-slate-400 border border-[#24344D]' 
                  : 'bg-white/80 text-[#0F172A] placeholder-slate-500 border border-[#CBD6E2]'
              }`}
            />
            {searchQuery.trim() && (
              <div role="listbox" aria-label="Результати пошуку" className={`absolute right-0 top-full mt-2 w-64 rounded-2xl border p-2 shadow-xl z-50 ${
                isDark ? 'bg-[#131C2B] border-[#24344D] text-white' : 'bg-white border-[#CBD6E2] text-[#0F172A]'
              }`}>
                {searchResults.length > 0 ? searchResults.map((item) => (
                  <button
                    key={item.section}
                    type="button"
                    onClick={() => {
                      handleNavClick(item.section);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                      isDark ? 'hover:bg-[#1C293E]' : 'hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                )) : (
                  <div className={`px-3 py-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Нічого не знайдено
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Theme Switcher Button */}
          {onToggleTheme && (
            <button
              onClick={() => {
                onToggleTheme();
                playWebAudioSound('click');
              }}
              title="Переключити тему"
              className={`min-h-11 min-w-11 p-2 rounded-full flex items-center justify-center transition-colors cursor-pointer border ${
                isDark 
                  ? 'bg-[#182335] text-amber-400 border-[#24344D] hover:bg-[#202E46]' 
                  : 'bg-white/80 text-slate-700 border-[#CBD6E2] hover:bg-white'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          )}

          <button
            type="button"
            aria-label={mobileMenuOpen ? 'Закрити меню' : 'Відкрити меню'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
            className={`md:hidden min-h-11 min-w-11 p-2 rounded-full flex items-center justify-center transition-colors cursor-pointer border ${
              isDark
                ? 'bg-[#182335] text-slate-300 border-[#24344D] hover:bg-[#202E46]'
                : 'bg-white/80 text-slate-700 border-[#CBD6E2] hover:bg-white'
            }`}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          {/* Notifications Icon with Red Badge */}
          <div className="relative">
            <button
              type="button"
              aria-label="Відкрити сповіщення"
              aria-expanded={notificationsOpen}
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className={`min-h-11 min-w-11 p-2 rounded-full relative flex items-center justify-center transition-colors cursor-pointer border ${
                isDark 
                  ? 'bg-[#182335] text-slate-300 border-[#24344D] hover:bg-[#202E46]' 
                  : 'bg-white/80 text-slate-700 border-[#CBD6E2] hover:bg-white'
              }`}
            >
              <Bell className="w-4 h-4" />
              {dataMode === 'LIVE' && (
                <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[8.5px] font-black flex items-center justify-center border border-white dark:border-[#0D131F]">
                  1
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className={`absolute right-0 mt-2 w-72 rounded-2xl shadow-xl p-3 z-50 ${
                isDark ? 'bg-[#131C2B] border border-[#24344D] text-white' : 'bg-white border border-[#CBD6E2] text-[#0F172A]'
              }`}>
                <div className="text-[11px] font-bold mb-2 px-1">Сповіщення системи</div>
                <div className={`p-2 rounded-xl flex items-start gap-2.5 ${isDark ? 'bg-[#1C293E]' : 'bg-slate-50'}`}>
                  <ShieldAlert className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${dataMode === 'LIVE' ? 'text-rose-500' : 'text-amber-500'}`} />
                  <div>
                    <div className="text-[12px] font-semibold">
                      {dataMode === 'LIVE' ? 'Realtime-канал активний' : 'Актуальні сповіщення недоступні'}
                    </div>
                    <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {dataMode === 'LIVE' ? 'Системні оновлення надходитимуть сюди.' : 'Підключіть realtime API, щоб отримувати live-події.'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Language Selector Dropdown */}
          <div className="relative hidden sm:block">
          <button type="button" aria-label="Змінити мову" aria-expanded={languageOpen} onClick={() => setLanguageOpen((open) => !open)} className={`min-h-11 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[12px] font-bold cursor-pointer transition-colors border ${
            isDark 
              ? 'bg-[#182335] text-slate-300 border-[#24344D] hover:bg-[#202E46]' 
              : 'bg-white/80 text-slate-700 border-[#CBD6E2] hover:bg-white'
          }`}>
            <span>{lang}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          {languageOpen && (
            <div className={`absolute right-0 top-full mt-2 w-44 rounded-2xl border p-2 shadow-xl z-50 ${
              isDark ? 'bg-[#131C2B] border-[#24344D] text-white' : 'bg-white border-[#CBD6E2] text-[#0F172A]'
            }`}>
              <button type="button" onClick={() => { setLang('UK'); setLanguageOpen(false); }} className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold ${isDark ? 'hover:bg-[#1C293E]' : 'hover:bg-slate-50'}`}>
                Українська <span className="float-right text-emerald-500">✓</span>
              </button>
              <div className={`px-3 py-2 text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>English — локалізація готується</div>
            </div>
          )}
          </div>

          {/* Profile capsule: identity and rank come from auth/profile API, never a static production fallback. */}
          <button
            type="button"
              onClick={() => handleNavClick('PROFILE')}
            aria-label={profileData ? `Відкрити профіль ${profileData.firstName}` : 'Відкрити профіль'}
            className={`hidden min-[1120px]:flex items-center gap-2.5 pl-1.5 pr-3.5 py-1 rounded-full cursor-pointer border transition-all ${
              isDark 
                ? 'bg-[#182335] border-[#24344D] hover:bg-[#202E46] text-white' 
                : 'bg-white/90 border-[#CBD6E2] hover:bg-white text-[#0F172A] shadow-sm'
            }`}
          >
            <div className={`w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border ${profileState === 'LIVE' ? 'bg-blue-500 border-amber-400/60' : profileState === 'DEMO' ? 'bg-purple-500/30 border-purple-400/60' : 'bg-slate-500/30 border-slate-400/60'}`}>
              {profileData?.avatarUrl ? (
                <img
                  src={profileData.avatarUrl}
                  alt={profileData.firstName || 'Профіль'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-[10px] font-black text-white">—</span>
              )}
            </div>
            <div className="flex flex-col text-left">
              <span className={`text-[11.5px] font-bold leading-tight ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                {profileState === 'NOT_CONNECTED' ? 'Профіль недоступний' : profileData?.firstName || 'Завантаження…'}
              </span>
              <span className={`text-[9px] font-extrabold flex items-center gap-0.5 leading-none mt-0.5 ${profileState === 'LIVE' ? 'text-amber-500' : profileState === 'DEMO' ? 'text-purple-400' : 'text-slate-400'}`}>
                {profileState === 'LIVE' && <Star className="w-2.5 h-2.5 fill-amber-500" />}
                {profileState === 'DEMO' ? `${profileData?.currentRank.name || 'Demo'} · DEMO` : profileState === 'NOT_CONNECTED' ? 'AUTH API OFFLINE' : profileData?.currentRank.name || 'Завантаження…'}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

        </div>
      </div>

      {mobileMenuOpen && (
        <div className={`md:hidden border-t px-4 pb-4 pt-3 ${
          isDark ? 'border-[#1B273D] bg-[#0D131F]' : 'border-[#D1DCE5] bg-[#EAEFF5]'
        }`}>
          <nav aria-label="Мобільна навігація" className="grid grid-cols-1 gap-1.5">
            {navItems.map((item) => {
              const isActive = isNavItemActive(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleMobileNavClick(item)}
                  className={`w-full rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors ${
                    isActive
                      ? (isDark ? 'bg-[#182335] text-white' : 'bg-white text-[#0F172A] shadow-sm')
                      : (isDark ? 'text-slate-300 hover:bg-[#182335]' : 'text-[#5A6A80] hover:bg-white/80')
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <div className={`mt-2 border-t pt-2 ${isDark ? 'border-[#1B273D]' : 'border-[#D1DCE5]'}`}>
              <p className={`px-3 pb-1 text-[10px] font-black uppercase tracking-[0.16em] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                Робочі розділи
              </p>
              {mobileSectionItems.map((item) => {
                const isActive = activeSection === item.section;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleMobileNavClick(item)}
                    className={`mt-1 w-full rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors ${
                      isActive
                        ? (isDark ? 'bg-[#182335] text-white' : 'bg-white text-[#0F172A] shadow-sm')
                        : (isDark ? 'text-slate-300 hover:bg-[#182335]' : 'text-[#5A6A80] hover:bg-white/80')
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => { handleNavClick('PROFILE'); setMobileMenuOpen(false); }}
              className={`w-full rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors ${
                activeSection === 'PROFILE'
                  ? (isDark ? 'bg-[#182335] text-white' : 'bg-white text-[#0F172A] shadow-sm')
                  : (isDark ? 'text-slate-300 hover:bg-[#182335]' : 'text-[#5A6A80] hover:bg-white/80')
              }`}
            >
              Профіль і безпека
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
