import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, Map, Users, Wallet, Shield, X } from 'lucide-react';
import { playWebAudioSound } from '../utils/sirenAudio';

interface OnboardingFlowProps {
  onComplete: () => void;
  theme?: 'light' | 'dark';
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, theme = 'light' }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const isDark = theme === 'dark';

  useEffect(() => {
    setIsVisible(true);
    playWebAudioSound('ping');
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      playWebAudioSound('click');
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(onComplete, 300);
    playWebAudioSound('click');
  };

  const steps = [
    {
      title: 'Ласкаво просимо до SIREN UA',
      description: 'Ваша особиста екосистема безпеки та ситуативної обізнаності. Давайте швидко оглянемо основні можливості.',
      icon: <Shield className="w-8 h-8 text-blue-500" />
    },
    {
      title: 'Точна Карта Загроз',
      description: 'Головна сторінка показує інтерактивну 3D карту та статус регіонів. Реальні вектори з’являються лише після підключення verified джерела, а demo-режим завжди позначений.',
      icon: <Map className="w-8 h-8 text-emerald-500" />
    },
    {
      title: 'Партнерська Мережа',
      description: 'Запрошуйте друзів та будуйте свою мережу безпеки. Ваш ранг залежить від кількості активних партнерів першої лінії.',
      icon: <Users className="w-8 h-8 text-purple-500" />
    },
    {
      title: 'Фінанси та Виплати',
      description: 'У захищеному розділі можна переглядати баланс, ledger та payout flow. Реальні комісії й виплати з’являються лише після підключення billing/payout provider.',
      icon: <Wallet className="w-8 h-8 text-amber-500" />
    },
    {
      title: 'Інформаційна Прозорість',
      description: 'Звертайте увагу на індикатори "LIVE", "CACHED" та значки інформації. Вони допоможуть зрозуміти актуальність даних.',
      icon: <Check className="w-8 h-8 text-blue-500" />
    }
  ];

  if (!isVisible && currentStep === 0) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`} role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleComplete} />

      {/* Modal */}
      <div className={`relative w-full max-w-md p-6 rounded-3xl shadow-2xl transition-transform duration-300 ${
        isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'
      } ${
        isDark ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white border border-slate-100 text-slate-900'
      }`}>
        
        {/* Close Button */}
        <button 
          onClick={handleComplete}
          aria-label="Закрити onboarding"
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2 mb-8 mt-2">
          {steps.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStep 
                  ? 'w-6 bg-blue-600' 
                  : idx < currentStep
                  ? 'w-2 bg-blue-600/40'
                  : 'w-2 bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center px-4 min-h-[160px]">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 bg-slate-50 dark:bg-slate-800">
            {steps[currentStep].icon}
          </div>
          <h2 id="onboarding-title" className="text-xl font-bold mb-3">{steps[currentStep].title}</h2>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {steps[currentStep].description}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className={`flex-1 py-3.5 rounded-2xl font-bold text-sm transition-colors ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
              }`}
            >
              Назад
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-[2] py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-colors"
          >
            <span>{currentStep === steps.length - 1 ? 'Розпочати' : 'Далі'}</span>
            {currentStep < steps.length - 1 && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>

      </div>
    </div>
  );
};
