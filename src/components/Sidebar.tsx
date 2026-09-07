import React from 'react';
import { 
  Home, 
  Share2, 
  Wallet, 
  BarChart2, 
  Bell, 
  User, 
  HelpCircle 
} from 'lucide-react';
import { DashboardSection } from '../types';
import { playWebAudioSound } from '../utils/sirenAudio';

interface SidebarProps {
  activeSection: DashboardSection;
  onSelectSection: (section: DashboardSection) => void;
  onOpenSupport?: () => void;
  onOpenNotifications?: () => void;
  theme?: 'light' | 'dark';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  onOpenSupport,
  onOpenNotifications,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';

  const handleNav = (sec: DashboardSection) => {
    onSelectSection(sec);
    playWebAudioSound('click');
  };

  const menuItems = [
    {
      id: 'HOME' as DashboardSection,
      label: 'Головна',
      icon: Home,
      action: () => handleNav('HOME'),
      isActive: activeSection === 'HOME',
    },
    {
      id: 'NETWORK' as DashboardSection,
      label: 'Мережа',
      icon: Share2,
      action: () => handleNav('NETWORK'),
      isActive: activeSection === 'NETWORK',
    },
    {
      id: 'FINANCE' as DashboardSection,
      label: 'Фінанси',
      icon: Wallet,
      action: () => handleNav('FINANCE'),
      isActive: activeSection === 'FINANCE',
    },
    {
      id: 'ANALYTICS' as DashboardSection,
      label: 'Аналітика',
      icon: BarChart2,
      action: () => handleNav('HOME'),
      isActive: false,
    },
    {
      id: 'NOTIFICATIONS' as DashboardSection,
      label: 'Сповіщення',
      icon: Bell,
      badge: 3,
      action: () => {
        if (onOpenNotifications) onOpenNotifications();
        playWebAudioSound('click');
      },
      isActive: false,
    },
    {
      id: 'PROFILE' as DashboardSection,
      label: 'Профіль',
      icon: User,
      action: () => handleNav('PROFILE'),
      isActive: activeSection === 'PROFILE',
    },
    {
      id: 'SUPPORT' as DashboardSection,
      label: 'Підтримка',
      icon: HelpCircle,
      action: () => {
        if (onOpenSupport) onOpenSupport();
        playWebAudioSound('click');
      },
      isActive: false,
    },
  ];

  return (
    <aside className="w-full">
      <div className={`rounded-2xl p-2 sm:p-2.5 border backdrop-blur-md shadow-xs flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible ${
        isDark 
          ? 'bg-slate-900/90 border-slate-800 text-slate-300 shadow-black/40' 
          : 'bg-white/95 border-slate-200/70 text-slate-700'
      }`}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={item.action}
              className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                item.isActive
                  ? (isDark ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'bg-blue-50 text-blue-600 shadow-xs')
                  : (isDark ? 'hover:bg-slate-800/80 hover:text-white text-slate-400' : 'hover:bg-slate-50 hover:text-slate-900 text-slate-600')
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${item.isActive ? (isDark ? 'text-white' : 'text-blue-600') : (isDark ? 'text-slate-400' : 'text-slate-500')}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
