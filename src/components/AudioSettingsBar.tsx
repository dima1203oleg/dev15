import React from 'react';
import { 
  Volume2, 
  VolumeX, 
  Volume1, 
  Mic, 
  BellRing, 
  Sparkles, 
  Radio,
  SlidersHorizontal
} from 'lucide-react';
import { UserSettings } from '../types';

interface AudioSettingsBarProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  isSirenPlaying: boolean;
  onToggleTestSiren: () => void;
  onPlayAllClear: () => void;
}

export const AudioSettingsBar: React.FC<AudioSettingsBarProps> = ({
  settings,
  onUpdateSettings,
  isSirenPlaying,
  onToggleTestSiren,
  onPlayAllClear,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md mt-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Siren Sound Controls */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl border ${
              isSirenPlaying
                ? 'bg-red-950/60 border-red-700 text-red-400 animate-pulse'
                : 'bg-slate-950 border-slate-800 text-slate-300'
            }`}>
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200">
                Звукові сповіщення сирени
              </h4>
              <p className="text-[11px] text-slate-400">
                Автоматичний сигнал тривоги при нових загрозах
              </p>
            </div>
          </div>

          {/* Test Siren Button */}
          <button
            id="test-siren-bar-btn"
            onClick={onToggleTestSiren}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              isSirenPlaying
                ? 'bg-red-600 hover:bg-red-700 text-white border-red-500 shadow-lg shadow-red-950/50 animate-pulse'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-700'
            }`}
          >
            {isSirenPlaying ? (
              <>
                <Volume2 className="w-4 h-4 animate-bounce" />
                <span>Зупинити звук сирени</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span>Тестувати звук тривоги</span>
              </>
            )}
          </button>

          {/* Test All Clear Button */}
          <button
            id="test-all-clear-btn"
            onClick={onPlayAllClear}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-emerald-300 border border-emerald-800/50 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Тест звуку відбою</span>
          </button>
        </div>

        {/* Right: Volume & Voice Options */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-5 ml-auto">
          
          {/* Volume Slider */}
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              title={settings.soundEnabled ? 'Вимкнути звук' : 'Увімкнути звук'}
              className="text-slate-400 hover:text-white"
            >
              {settings.soundEnabled ? (
                settings.volume > 50 ? <Volume2 className="w-4 h-4 text-amber-400" /> : <Volume1 className="w-4 h-4 text-amber-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-red-400" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="100"
              value={settings.soundEnabled ? settings.volume : 0}
              onChange={(e) => onUpdateSettings({ volume: Number(e.target.value), soundEnabled: true })}
              className="w-20 sm:w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <span className="text-[11px] font-mono text-slate-300 w-7 text-right">
              {settings.soundEnabled ? `${settings.volume}%` : '0%'}
            </span>
          </div>

          {/* Voice Announcement Toggle */}
          <button
            onClick={() => onUpdateSettings({ voiceChime: !settings.voiceChime })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
              settings.voiceChime
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Озвучення тривог</span>
          </button>

        </div>

      </div>
    </div>
  );
};
