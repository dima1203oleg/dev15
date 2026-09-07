import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { playWebAudioSound } from '../utils/sirenAudio';

interface ContextDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  theme?: 'light' | 'dark';
}

export const ContextDrawer: React.FC<ContextDrawerProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  theme = 'light'
}) => {
  const isDark = theme === 'dark';

  useEffect(() => {
    if (isOpen) {
      playWebAudioSound('click');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`relative w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 ${
        isDark ? 'bg-slate-900 border-l border-slate-800 text-white' : 'bg-white border-l border-slate-200 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            {icon && (
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-blue-950/50 text-blue-400' : 'bg-blue-50 text-blue-600'
              }`}>
                {icon}
              </div>
            )}
            <h2 className="text-lg font-bold">{title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
