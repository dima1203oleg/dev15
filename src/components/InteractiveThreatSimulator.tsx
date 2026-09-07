import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Radio, 
  Zap, 
  ShieldAlert, 
  Clock, 
  Navigation, 
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Compass
} from 'lucide-react';
import { SIMULATION_WORKFLOW } from '../data/spatialThreatData';
import { SimulationStepData } from '../types';

interface InteractiveThreatSimulatorProps {
  onStepChange?: (step: number) => void;
  onNavigateToShelters?: () => void;
}

export const InteractiveThreatSimulator: React.FC<InteractiveThreatSimulatorProps> = ({
  onStepChange,
  onNavigateToShelters,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const steps: SimulationStepData[] = SIMULATION_WORKFLOW;
  const currentStep = steps[currentStepIndex];

  // Auto-play stepper
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return 0;
          }
          const next = prev + 1;
          if (onStepChange) onStepChange(next + 1);
          return next;
        });
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, steps.length, onStepChange]);

  const handleGoToStep = (index: number) => {
    setCurrentStepIndex(index);
    if (onStepChange) onStepChange(index + 1);
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      handleGoToStep(currentStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      handleGoToStep(currentStepIndex - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    handleGoToStep(0);
  };

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden mb-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 pb-5 border-b border-slate-800 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Інтерактивний 7-Кроковий Симулятор Загроз</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100">
            Як працює раннє виявлення та трекінг цілей
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Покрокова демонстрація життєвого циклу загрози: від засічки радаром до прогнозування курсу та переходу в укриття.
          </p>
        </div>

        {/* Stepper Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              isPlaying
                ? 'bg-rose-500/20 text-rose-200 border border-rose-500/50'
                : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50 hover:bg-emerald-500/30'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'Пауза' : 'Авто-відтворення'}</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs"
            title="Скинути на крок 1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Step Bar */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-6">
        {steps.map((stepItem, idx) => {
          const isActive = idx === currentStepIndex;
          const isPassed = idx < currentStepIndex;

          return (
            <button
              key={stepItem.step}
              onClick={() => handleGoToStep(idx)}
              className={`p-2 rounded-xl text-left border transition-all relative overflow-hidden ${
                isActive
                  ? 'bg-cyan-500/15 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950'
                  : isPassed
                  ? 'bg-slate-900 border-slate-700 text-slate-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500 opacity-60'
              }`}
            >
              <div className="text-[10px] font-mono font-bold truncate">КРОК {stepItem.step}</div>
              <div className="text-[11px] font-bold truncate hidden sm:block mt-0.5">{stepItem.title.split(':')[1] || stepItem.title}</div>
            </button>
          );
        })}
      </div>

      {/* Main Step Detail Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left: Step Description */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/40">
                  {currentStep.step} / {steps.length}
                </span>
                <span className="text-xs font-bold text-slate-300">{currentStep.subtitle}</span>
              </div>

              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                currentStep.riskBadge === 'CRITICAL'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : currentStep.riskBadge === 'HIGH'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                РІВЕНЬ: {currentStep.riskBadge}
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-100 mb-2">
              {currentStep.title}
            </h3>

            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              {currentStep.description}
            </p>

            {/* Technical Telemetry Box */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300/90 space-y-1">
              <div className="text-[10px] uppercase text-slate-500 font-bold">Телеметрія системи:</div>
              <div>{currentStep.technicalDetails}</div>
            </div>
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800">
            <button
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-bold text-slate-200 transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Назад
            </button>

            {currentStepIndex === steps.length - 1 ? (
              <button
                onClick={onNavigateToShelters}
                className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-950"
              >
                <Navigation className="w-3.5 h-3.5" /> Перейти до Укриттів
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-colors flex items-center gap-1.5 shadow-lg shadow-cyan-950"
              >
                Далі <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Tactical Radar Visualizer Mockup */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <span className="text-[10px] font-mono uppercase text-slate-400">ПРОСТОРОВИЙ МОНІТОРИНГ</span>
              <span className="text-[10px] text-emerald-400 font-mono">STATUS: SYNCED</span>
            </div>

            {/* Simulated Radar Visual */}
            <div className="relative h-44 w-full bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
              
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-36 h-36 rounded-full border border-slate-800" />
                <div className="w-24 h-24 rounded-full border border-cyan-500/20" />
                <div className="w-12 h-12 rounded-full border border-cyan-500/30" />
                <div className="absolute w-36 h-36 border-r border-cyan-400/40 animate-radar-sweep pointer-events-none" />
              </div>

              {/* Dynamic Step Overlays */}
              {currentStepIndex >= 2 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 150">
                  <path
                    d="M 40,110 C 110,40 180,100 260,50"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="3"
                    strokeDasharray="6 4"
                    className="animate-laser-dash"
                  />
                  <circle cx="260" cy="50" r="5" fill="#ef4444" className="animate-ping" />
                  <circle cx="260" cy="50" r="4" fill="#ef4444" />
                </svg>
              )}

              <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/80 border border-slate-800 text-[10px] font-mono text-cyan-200">
                {currentStep.threatState}
              </div>
            </div>
          </div>

          <div className="mt-3 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-[11px]">Дані моделі інтегруються з Повітряними Силами та ДСНС.</span>
          </div>
        </div>

      </div>

    </div>
  );
};
