import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Wallet, 
  BarChart2, 
  Award,
  ArrowRight
} from 'lucide-react';
import { playWebAudioSound } from '../utils/sirenAudio';
import { DashboardSection } from '../types';
import { financialService, DEFAULT_FINANCIAL_SUMMARY, UNAVAILABLE_FINANCIAL_SUMMARY } from '../services/financialService';
import { networkService, NetworkSummary } from '../services/networkService';
import { DataState } from '../types/dataEnvelope';
import { runtimeConfig } from '../config/runtime';

interface HomeFeaturesGridProps {
  onNavigateToTab?: (tab: DashboardSection) => void;
  theme?: 'light' | 'dark';
}

export const HomeFeaturesGrid: React.FC<HomeFeaturesGridProps> = ({
  onNavigateToTab,
  theme = 'light'
}) => {
  const isDark = theme === 'dark';
  const [financeSummary, setFinanceSummary] = useState(runtimeConfig.allowDemoData ? DEFAULT_FINANCIAL_SUMMARY : UNAVAILABLE_FINANCIAL_SUMMARY);
  const [financeState, setFinanceState] = useState<DataState>(runtimeConfig.apiBaseUrl ? 'LOADING' : runtimeConfig.allowDemoData ? 'DEMO' : 'NOT_CONNECTED');
  const [networkSummary, setNetworkSummary] = useState<NetworkSummary | null>(null);
  const [networkState, setNetworkState] = useState<DataState>(runtimeConfig.apiBaseUrl ? 'LOADING' : runtimeConfig.allowDemoData ? 'DEMO' : 'NOT_CONNECTED');

  useEffect(() => {
    let mounted = true;
    Promise.all([financialService.getPartnerFinancialSummary(), networkService.getNetworkSummary()]).then(([financeResponse, networkResponse]) => {
      if (!mounted) return;
      setFinanceState(financeResponse.state);
      if (financeResponse.data) setFinanceSummary(financeResponse.data);
      else if (financeResponse.state === 'NOT_CONNECTED') setFinanceSummary(UNAVAILABLE_FINANCIAL_SUMMARY);
      setNetworkState(networkResponse.state);
      setNetworkSummary(networkResponse.data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const financeBalanceLabel = financeState === 'LOADING'
    ? 'Завантаження…'
    : financeState === 'LIVE'
    ? `₴ ${financeSummary.totalBalance.toLocaleString('uk-UA')}`
    : financeState === 'NOT_CONNECTED'
      ? 'Дані недоступні'
      : `₴ ${financeSummary.totalBalance.toLocaleString('uk-UA')} · DEMO`;
  const affiliateRankLabel = networkState === 'LOADING'
    ? 'Завантаження…'
    : networkState === 'LIVE'
    ? networkSummary?.currentTier.badgeLabel || 'Ранг недоступний'
    : networkState === 'NOT_CONNECTED'
      ? 'Ранг недоступний'
      : `${networkSummary?.currentTier.badgeLabel || 'Demo Partner'} · DEMO`;
  const affiliateStatusLabel = networkState === 'LOADING'
    ? 'Перевірка статусу…'
    : networkState === 'LIVE'
    ? 'Статус підтверджено'
    : networkState === 'NOT_CONNECTED'
      ? 'API не підключено'
      : 'Демонстраційний статус';

  const cards = [
    {
      id: 'NETWORK',
      title: 'Мережа',
      icon: <Users className="w-5 h-5 text-blue-500" />,
      features: [
        ['Управління інформацією', 'L1/L2 структура'],
        ['Структура L1', 'Запрошення']
      ]
    },
    {
      id: 'FINANCE',
      title: 'Фінанси',
      icon: <Wallet className="w-5 h-5 text-blue-500" />,
      features: [
        [financeBalanceLabel, 'Виплати/доступність'],
        [financeState === 'LOADING' ? 'Завантаження…' : financeState === 'LIVE' ? 'Дохід' : financeState === 'NOT_CONNECTED' ? 'API не підключено' : 'Дохід · DEMO', 'Історія']
      ]
    },
    {
      id: 'ANALYTICS',
      title: 'Аналітика',
      icon: <BarChart2 className="w-5 h-5 text-blue-500" />,
      features: [
        ['Конверсії', 'Активність'],
        ['Зростання мережі', 'Ефективність']
      ]
    },
    {
      id: 'AFFILIATE',
      title: 'Партнерська програма',
      icon: <Award className="w-5 h-5 text-blue-500" />,
      features: [
        [affiliateRankLabel, affiliateStatusLabel],
        ['Прогрес', 'Запрошення амбасадорів']
      ]
    }
  ];

  return (
    <div id="home-features" className="w-full my-0 scroll-mt-24">
      <div className="siren-home-features-grid grid grid-cols-1 md:grid-cols-2 gap-3">
        {cards.map((card) => (
          <button
            type="button"
            key={card.id}
            aria-label={`Відкрити розділ ${card.title}`}
            onClick={() => {
              if (onNavigateToTab) onNavigateToTab(card.id as DashboardSection);
              playWebAudioSound('click');
            }}
            className={`siren-feature-card w-full min-w-0 text-left rounded-[22px] p-4 lg:p-3 border flex flex-col min-[1160px]:h-[78px] min-[1160px]:justify-center cursor-pointer group transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
              isDark 
                ? 'bg-[#131C2B] border-[#24344D] text-white hover:border-[#334768] shadow-lg' 
                : 'bg-white border-[#CBD6E2] text-[#0F172A] hover:border-blue-300 shadow-sm hover:shadow-md'
            }`}
          >
            <div className="min-w-0 min-[1160px]:flex min-[1160px]:items-center min-[1160px]:gap-3">
              <div className="flex items-center justify-between mb-3 min-[1160px]:mb-0 min-[1160px]:w-9 min-[1160px]:shrink-0">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                  isDark ? 'bg-[#1B293F] border border-[#2E4160]' : 'bg-blue-50 border border-blue-100'
                }`}>
                  {card.icon}
                </div>
                <ArrowRight className={`w-4 h-4 lg:hidden transition-transform group-hover:translate-x-1 ${
                  isDark ? 'text-slate-500 group-hover:text-blue-400' : 'text-slate-400 group-hover:text-blue-600'
                }`} />
              </div>
              
              <div className="min-w-0 flex-1">
                <h3 className={`text-[15px] font-extrabold tracking-tight mb-1.5 min-[1160px]:mb-1 ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                  {card.title}
                </h3>

                <div className="space-y-0.5 text-[10px] leading-tight">
                  {card.features.map((row, idx) => (
                    <div key={idx} className="flex min-w-0 items-center justify-between gap-2">
                      <span className={`min-w-0 font-semibold ${isDark ? 'text-slate-300' : 'text-[#334155]'}`}>
                        {row[0]}
                      </span>
                      <span className={`min-w-0 text-right font-medium ${isDark ? 'text-slate-400' : 'text-[#5A6A80]'}`}>
                        {row[1]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
