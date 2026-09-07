import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  CheckSquare, 
  Square, 
  PhoneCall, 
  ShieldCheck, 
  BookOpen, 
  Info, 
  AlertTriangle,
  Flame,
  Radio,
  Zap,
  RotateCcw
} from 'lucide-react';
import { DEFAULT_EMERGENCY_KIT, SAFETY_RULES, EMERGENCY_CONTACTS } from '../data/emergencyGuideData';
import { EmergencyKitItem } from '../types';

interface EmergencyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyGuideModal: React.FC<EmergencyGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'kit' | 'contacts'>('rules');
  const [kitItems, setKitItems] = useState<EmergencyKitItem[]>(() => {
    try {
      const saved = localStorage.getItem('sirenua_emergency_kit');
      return saved ? JSON.parse(saved) : DEFAULT_EMERGENCY_KIT;
    } catch {
      return DEFAULT_EMERGENCY_KIT;
    }
  });

  if (!isOpen) return null;

  const handleToggleKitItem = (id: string) => {
    setKitItems((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item));
      try {
        localStorage.setItem('sirenua_emergency_kit', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleResetKit = () => {
    setKitItems(DEFAULT_EMERGENCY_KIT);
    try {
      localStorage.setItem('sirenua_emergency_kit', JSON.stringify(DEFAULT_EMERGENCY_KIT));
    } catch {
      // ignore
    }
  };

  const completedCount = kitItems.filter((i) => i.checked).length;
  const progressPercent = Math.round((completedCount / kitItems.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                Пам'ятка безпеки та цивільного захисту
              </h2>
              <p className="text-xs text-slate-400">
                Офіційні рекомендації ДСНС України під час надзвичайних ситуацій
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Закрити пам’ятку безпеки"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Правила безпеки
          </button>

          <button
            onClick={() => setActiveTab('kit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'kit'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Тривожна валізка ({completedCount}/{kitItems.length})
          </button>

          <button
            onClick={() => setActiveTab('contacts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'contacts'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            Екстрені служби
          </button>
        </div>

        {/* Tab 1: Safety Rules */}
        {activeTab === 'rules' && (
          <div className="space-y-3">
            {SAFETY_RULES.map((rule, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <h4 className="font-bold text-sm text-slate-100">{rule.title}</h4>
                  <span className="text-[11px] text-amber-400/90 font-medium ml-auto">
                    {rule.subtitle}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {rule.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Emergency Kit (Interactive Checklist) */}
        {activeTab === 'kit' && (
          <div>
            {/* Progress Header */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 mb-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  Готовність тривожної валізки: {progressPercent}%
                </span>
                <span className="text-[11px] text-slate-400">
                  Зібрано {completedCount} з {kitItems.length} необхідних предметів
                </span>
              </div>
              <button
                onClick={handleResetKit}
                title="Скинути чек-лист"
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs flex items-center gap-1 border border-slate-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Скинути</span>
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {kitItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleKitItem(item.id)}
                  className={`p-3 rounded-xl border cursor-pointer select-none transition-all flex items-start gap-3 ${
                    item.checked
                      ? 'bg-emerald-950/20 border-emerald-900/40 text-slate-200'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:bg-slate-950'
                  }`}
                >
                  <span className="mt-0.5 text-emerald-400" aria-hidden="true">
                    {item.checked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                  </span>

                  <div className="flex-1">
                    <h5 className={`text-xs font-bold ${item.checked ? 'text-slate-100 line-through opacity-75' : 'text-slate-200'}`}>
                      {item.title}
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Emergency Contacts */}
        {activeTab === 'contacts' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {EMERGENCY_CONTACTS.map((contact, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-extrabold text-amber-400 font-mono">
                      {contact.number}
                    </span>
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {contact.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {contact.subtitle}
                  </p>
                </div>

                <a
                  href={`tel:${contact.number}`}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center transition-colors"
                >
                  <PhoneCall className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Зрозуміло
          </button>
        </div>

      </div>
    </div>
  );
};
