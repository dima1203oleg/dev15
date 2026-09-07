import React, { useState } from 'react';
import { 
  Maximize2, 
  Crosshair, 
  Compass, 
  Clock, 
  ArrowRight, 
  AlertTriangle, 
  Award,
  TrendingUp,
  BarChart3,
  Users
} from 'lucide-react';
import { RegionData, ThreatSceneModel, UserSettings } from '../types';
import { playWebAudioSound } from '../utils/sirenAudio';
import { ThreeMapUkraine } from './ThreeMapUkraine';

interface CentralWorkspaceProps {
  regions: RegionData[];
  selectedRegion: RegionData | null;
  onSelectRegion: (reg: RegionData | null) => void;
  myRegionId: string;
  onSetMyRegion: (id: string) => void;
  threatModel?: ThreatSceneModel;
  settings?: UserSettings;
  onUpdateSettings?: (settings: Partial<UserSettings>) => void;
  onNavigateToShelters?: () => void;
  onNavigateToFinance?: () => void;
  onNavigateToNetwork?: () => void;
  onTestSiren?: () => void;
  theme?: 'light' | 'dark';
}

export const CentralWorkspace: React.FC<CentralWorkspaceProps> = ({
  regions,
  selectedRegion,
  onSelectRegion,
  myRegionId,
  onSetMyRegion,
  threatModel,
  onNavigateToShelters,
  onNavigateToFinance,
  onNavigateToNetwork,
  onTestSiren,
  theme = 'light',
}) => {
  const [activeTab, setActiveTab] = useState<'SITUATION' | 'NETWORK' | 'ANALYTICS'>('SITUATION');
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const isDark = theme === 'dark';

  return (
    <div className="w-full flex flex-col h-full justify-between">
      
      {/* Top Header with 3-Pill Switcher: "Ситуація" | "Моя мережа" | "Аналітика" (1:1 with Screenshot 3) */}
      <div className="flex items-center justify-start mb-3">
        <div className={`p-1 rounded-full inline-flex items-center gap-1 border shadow-xs ${
          isDark 
            ? 'bg-slate-900 border-slate-800' 
            : 'bg-slate-100/90 border-slate-200/70'
        }`}>
          <button
            onClick={() => {
              setActiveTab('SITUATION');
              playWebAudioSound('click');
            }}
            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'SITUATION'
                ? (isDark ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-blue-600 shadow-sm')
                : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')
            }`}
          >
            Ситуація
          </button>

          <button
            onClick={() => {
              setActiveTab('NETWORK');
              playWebAudioSound('click');
            }}
            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'NETWORK'
                ? (isDark ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-blue-600 shadow-sm')
                : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')
            }`}
          >
            Моя мережа
          </button>

          <button
            onClick={() => {
              setActiveTab('ANALYTICS');
              playWebAudioSound('click');
            }}
            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ANALYTICS'
                ? (isDark ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-blue-600 shadow-sm')
                : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800')
            }`}
          >
            Аналітика
          </button>
        </div>
      </div>

      {/* Main Workspace Card Container */}
      <div className={`rounded-3xl p-5 sm:p-6 border flex-1 flex flex-col justify-center ${
        isDark 
          ? 'bg-slate-900/95 border-slate-800 text-white shadow-xl shadow-black/50' 
          : 'bg-white border-slate-100 text-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.03)]'
      }`}>
        
        {activeTab === 'SITUATION' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Left 60%: 3D Ukraine Map Mini Viewport with Threat Focus */}
            <div className={`md:col-span-7 relative aspect-[16/11] rounded-2xl border p-2 flex items-center justify-center overflow-hidden group ${
              isDark ? 'bg-[#0B111E] border-slate-800' : 'bg-slate-50/60 border-slate-100'
            }`}>
              
              {/* Expand button at top right */}
              <button
                onClick={() => setIsMapExpanded(!isMapExpanded)}
                className={`absolute top-2.5 right-2.5 p-1.5 rounded-xl border shadow-xs transition-all z-20 cursor-pointer ${
                  isDark 
                    ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border-slate-700' 
                    : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200/80'
                }`}
                title="Розгорнути карту"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              {/* 3D Map Viewport */}
              <ThreeMapUkraine
                variant="workspace"
                theme={theme}
                regions={regions}
                selectedRegionId={selectedRegion?.id || 'kyiv_obl'}
                onSelectRegion={(reg) => onSelectRegion(reg)}
                className="w-full h-full"
                enableControls={false}
              />

              {/* Bottom right zoom control hint */}
              <div className={`absolute bottom-2.5 right-2.5 p-1 rounded-md border text-[10px] font-mono shadow-xs z-20 ${
                isDark 
                  ? 'bg-slate-800/90 border-slate-700 text-slate-400' 
                  : 'bg-white/90 border-slate-200/80 text-slate-500'
              }`}>
                <Maximize2 className="w-3 h-3" />
              </div>

            </div>

            {/* Right 40%: Operational Threat Card (1:1 with Screenshot 3) */}
            <div className="md:col-span-5 space-y-4">
              
              <div>
                <h4 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Київська область
                </h4>
                
                {/* Amber Warning Pill Badge */}
                <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${
                  isDark 
                    ? 'bg-amber-950/70 text-amber-300 border-amber-800/80' 
                    : 'bg-amber-50 text-amber-800 border-amber-200/80'
                }`}>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Підвищена увага</span>
                </div>
              </div>

              {/* Threat Attributes List */}
              <div className={`space-y-3 pt-2 border-t text-xs ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                
                {/* Attribute 1: Тип загрози */}
                <div className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isDark ? 'bg-blue-950/80 text-blue-400' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <Crosshair className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Тип загрози</div>
                    <div className={`font-bold text-sm mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>БпЛА</div>
                  </div>
                </div>

                {/* Attribute 2: Напрямок */}
                <div className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isDark ? 'bg-blue-950/80 text-blue-400' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <Compass className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Напрямок</div>
                    <div className={`font-bold text-sm mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>Південно-західний</div>
                  </div>
                </div>

                {/* Attribute 3: Оновлено */}
                <div className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isDark ? 'bg-blue-950/80 text-blue-400' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Оновлено</div>
                    <div className={`font-bold text-sm mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>Сьогодні, 22:14</div>
                  </div>
                </div>

              </div>

              {/* Detail Action Link */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    if (onNavigateToShelters) onNavigateToShelters();
                    playWebAudioSound('click');
                  }}
                  className={`font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer group ${
                    isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                  }`}
                >
                  <span>Детальніше</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

            </div>

          </div>
        )}

        {activeTab === 'NETWORK' && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Партнерська мережа L1/L2
                </h4>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                  Ваша реферальна структура та статистика нарахувань
                </p>
              </div>
              <button
                onClick={onNavigateToNetwork}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Повна мережа</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-100'
              }`}>
                <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                  Партнери L1 (15%)
                </div>
                <div className={`text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  247
                </div>
                <div className="text-[11px] text-emerald-500 font-bold mt-1">+18 цього тижня</div>
              </div>
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-100'
              }`}>
                <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                  Партнери L2 (5%)
                </div>
                <div className={`text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  2 600
                </div>
                <div className="text-[11px] text-emerald-500 font-bold mt-1">+42 цього тижня</div>
              </div>
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-100'
              }`}>
                <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                  Поточний статус
                </div>
                <div className="text-2xl font-black text-amber-500 mt-1 flex items-center gap-1">
                  <Award className="w-5 h-5" /> Gold
                </div>
                <div className={`text-[11px] font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  До Platinum: 18 рефералів
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ANALYTICS' && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Аналітика загроз та реагування
                </h4>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                  Швидкість сповіщень та оперативна безпекова статистика
                </p>
              </div>
              <button
                onClick={onNavigateToFinance}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Детальний звіт</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-100'
              }`}>
                <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                  Швидкість детекції
                </div>
                <div className={`text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  0.4 сек
                </div>
                <div className="text-[11px] text-emerald-500 font-bold mt-1">В 3.2х швидше звичайних каналів</div>
              </div>
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-100'
              }`}>
                <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                  Точність верифікації
                </div>
                <div className={`text-2xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  99.8%
                </div>
                <div className="text-[11px] text-blue-500 font-bold mt-1">Multi-source Radar AI</div>
              </div>
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-100'
              }`}>
                <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                  Охоплення населення
                </div>
                <div className="text-2xl font-black text-blue-600 mt-1">
                  2.8M+
                </div>
                <div className={`text-[11px] font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  В 24 областях України
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
