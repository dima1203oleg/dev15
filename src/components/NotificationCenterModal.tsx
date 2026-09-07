import React, { useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  ShieldCheck, 
  Wallet, 
  Users, 
  Lock, 
  Info, 
  AlertTriangle,
  X
} from 'lucide-react';
import { notificationPreferencesService, InAppNotification } from '../services/notificationPreferencesService';
import { playWebAudioSound } from '../utils/sirenAudio';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  theme = 'light',
}) => {
  const [filter, setFilter] = useState<'ALL' | 'SAFETY' | 'FINANCE' | 'NETWORK' | 'SECURITY'>('ALL');
  const [notifications, setNotifications] = useState<InAppNotification[]>(() => 
    notificationPreferencesService.getInAppNotifications()
  );

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const handleMarkAllAsRead = () => {
    notificationPreferencesService.markAllAsRead();
    setNotifications(notificationPreferencesService.getInAppNotifications());
    playWebAudioSound('click');
  };

  const handleClear = () => {
    notificationPreferencesService.clearNotifications();
    setNotifications([]);
    playWebAudioSound('click');
  };

  const handleItemClick = (id: string) => {
    notificationPreferencesService.markAsRead(id);
    setNotifications(notificationPreferencesService.getInAppNotifications());
    playWebAudioSound('click');
  };

  const filtered = notifications.filter(n => filter === 'ALL' || n.category === filter);
  const unreadCount = notifications.filter(n => !n.read).length;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'SAFETY':
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      case 'FINANCE':
        return <Wallet className="w-4 h-4 text-blue-500" />;
      case 'NETWORK':
        return <Users className="w-4 h-4 text-purple-500" />;
      case 'SECURITY':
        return <Lock className="w-4 h-4 text-amber-500" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className={`relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
        isDark ? 'bg-[#111827] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/70'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Центр сповіщень</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white">
                    {unreadCount} нових
                  </span>
                )}
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Всі важливі оновлення безпеки, фінансів та мережі
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <>
                <button
                  onClick={handleMarkAllAsRead}
                  title="Прочитати всі"
                  className={`p-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-white text-slate-600'
                  }`}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Прочитати всі</span>
                </button>
                <button
                  onClick={handleClear}
                  title="Очистити"
                  className={`p-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isDark ? 'border-slate-700 hover:bg-slate-800 text-rose-400' : 'border-slate-200 hover:bg-white text-rose-600'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={`px-5 py-2.5 border-b flex items-center gap-2 overflow-x-auto ${
          isDark ? 'border-slate-800 bg-slate-900/20' : 'border-slate-100 bg-white'
        }`}>
          {[
            { id: 'ALL', label: 'Всі' },
            { id: 'SAFETY', label: 'Безпека' },
            { id: 'FINANCE', label: 'Фінанси' },
            { id: 'NETWORK', label: 'Мережа' },
            { id: 'SECURITY', label: 'Акаунт' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setFilter(tab.id as any);
                playWebAudioSound('click');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark 
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${
                isDark ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-400'
              }`}>
                <Bell className="w-6 h-6" />
              </div>
              <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Немає нових сповіщень
              </p>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Тут з’являтимуться сповіщення про виплати, тривоги та партнерську активність
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                  !item.read
                    ? isDark 
                      ? 'bg-blue-950/20 border-blue-900/60 shadow-xs' 
                      : 'bg-blue-50/40 border-blue-200/80 shadow-xs'
                    : isDark 
                      ? 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900' 
                      : 'bg-white border-slate-100 hover:bg-slate-50'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isDark ? 'bg-slate-800' : 'bg-slate-100'
                }`}>
                  {getCategoryIcon(item.category)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`text-xs sm:text-sm font-bold truncate ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {item.title}
                    </h4>
                    <span className={`text-[10px] whitespace-nowrap flex-shrink-0 ${
                      isDark ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      {item.timestamp}
                    </span>
                  </div>

                  <p className={`text-xs mt-1 leading-relaxed ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {item.message}
                  </p>
                </div>

                {!item.read && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-2" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className={`px-5 py-3 border-t flex items-center justify-between text-[11px] ${
          isDark ? 'border-slate-800 bg-slate-900/30 text-slate-500' : 'border-slate-100 bg-slate-50 text-slate-500'
        }`}>
          <span>Оновлення в реальному часі</span>
          <span className="font-semibold text-blue-600">SIREN UA v2.4.0</span>
        </div>

      </div>
    </div>
  );
};
