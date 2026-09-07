import React, { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, BarChart3, CheckCircle2, Clock3, Users } from 'lucide-react';
import { networkService, NetworkSummary } from '../services/networkService';
import { analyticsService, PartnerAnalytics } from '../services/analyticsService';
import { DataState } from '../types/dataEnvelope';
import { DataFreshnessIndicator } from './DataFreshnessIndicator';
import { runtimeConfig } from '../config/runtime';

interface AnalyticsSectionProps {
  theme?: 'light' | 'dark';
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  const [summary, setSummary] = useState<NetworkSummary | null>(null);
  const [analytics, setAnalytics] = useState<PartnerAnalytics | null>(null);
  const [dataState, setDataState] = useState<DataState>(runtimeConfig.apiBaseUrl ? 'LOADING' : runtimeConfig.allowDemoData ? 'DEMO' : 'NOT_CONNECTED');

  useEffect(() => {
    let active = true;
    Promise.all([networkService.getNetworkSummary(), analyticsService.getPartnerAnalytics()]).then(([summaryResponse, analyticsResponse]) => {
      if (!active) return;
      setDataState(analyticsResponse.state === 'LIVE' && summaryResponse.state === 'LIVE' ? 'LIVE' : analyticsResponse.state);
      setSummary(summaryResponse.data);
      setAnalytics(analyticsResponse.data);
    });
    return () => { active = false; };
  }, []);

  const data = summary;
  const unavailable = dataState === 'NOT_CONNECTED' || dataState === 'ERROR';
  const cards = [
    { label: 'Кваліфіковані L1', value: unavailable ? '—' : (data?.qualifiedL1 ?? '—'), note: 'впливають на ранг', icon: Users, tone: 'blue' },
    { label: 'Конверсія в оплату', value: unavailable || data?.metricsAvailability?.conversion === false ? '—' : `${data?.conversionRatePercent ?? '—'}%`, note: 'trial → paid', icon: CheckCircle2, tone: 'green' },
    { label: 'Нові за 30 днів', value: unavailable || data?.metricsAvailability?.new30Days === false ? '—' : (data?.new30DaysCount ?? '—'), note: 'нові учасники', icon: Activity, tone: 'cyan' },
    { label: 'Дохід мережі', value: unavailable || data?.metricsAvailability?.monthlyIncome === false ? '—' : `₴ ${(data?.monthlyNetworkIncomeUah ?? 0).toLocaleString('uk-UA')}`, note: 'поточний місяць', icon: BarChart3, tone: 'amber' },
  ];

  return (
    <section className="space-y-5 animate-in fade-in duration-200" aria-labelledby="analytics-title">
      <div className={`rounded-[28px] border p-6 sm:p-8 ${isDark ? 'bg-[#10232B] border-[#2D4A55] text-white' : 'bg-[#F7FAFC] border-[#D9E2E8] text-[#0F172A]'}`}>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold ${isDark ? 'border-[#365966] bg-[#17313B] text-[#A8CCD8]' : 'border-[#C9DEE6] bg-[#EDF7FA] text-[#4D788A]'}`}>
              <Activity className="h-3.5 w-3.5" />
              АНАЛІТИКА МЕРЕЖІ
            </div>
            <h1 id="analytics-title" className="mt-4 text-3xl sm:text-4xl font-black tracking-tight">Рішення на основі даних.</h1>
            <p className={`mt-2 max-w-2xl text-sm leading-relaxed ${isDark ? 'text-[#A8BABF]' : 'text-[#5A6A80]'}`}>
              Дивіться не лише кількість запрошень: тут видно кваліфікованих партнерів, конверсію trial → paid, темп мережі та обсяг, який реально бере участь у фінансовій моделі.
            </p>
          </div>
          <div className={`flex items-center gap-2 text-xs font-semibold ${isDark ? 'text-[#A8CCD8]' : 'text-[#4D788A]'}`}>
            <DataFreshnessIndicator state={dataState} theme={theme} />
            <span>джерело: партнерська статистика</span>
          </div>
        </div>

        {dataState !== 'LIVE' && (
          <div className={`mt-4 rounded-xl border px-3 py-2 text-xs font-semibold ${dataState === 'NOT_CONNECTED' ? (isDark ? 'border-rose-900/60 bg-rose-950/20 text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700') : (isDark ? 'border-amber-900/60 bg-amber-950/20 text-amber-300' : 'border-amber-200 bg-amber-50 text-amber-700')}`}>
            {dataState === 'NOT_CONNECTED' ? 'Аналітика тимчасово недоступна. Підключіть partner analytics API, щоб отримувати фактичні метрики.' : 'Демонстраційні метрики: підключіть partner API, щоб замінити приклади на актуальні дані.'}
          </div>
        )}

        <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {cards.map(({ label, value, note, icon: Icon, tone }) => (
            <div key={label} className={`rounded-2xl border p-4 ${isDark ? 'border-[#294651] bg-[#122A34]' : 'border-[#DDE8ED] bg-white'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone === 'amber' ? 'bg-amber-500/15 text-amber-400' : tone === 'green' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-sky-500/15 text-sky-400'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-emerald-400" />
              </div>
              <div className={`mt-4 text-xs font-semibold ${isDark ? 'text-[#92AAB1]' : 'text-[#6E7F8B]'}`}>{label}</div>
              <div className="mt-1 text-2xl font-black tracking-tight">{value}</div>
              <div className={`mt-1 text-[11px] ${isDark ? 'text-[#78939D]' : 'text-[#8B99A5]'}`}>{note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className={`xl:col-span-2 rounded-[26px] border p-5 sm:p-6 ${isDark ? 'bg-[#10232B] border-[#2D4A55] text-white' : 'bg-white border-[#D9E2E8] text-[#0F172A]'}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black">Активність мережі</h2>
              <p className={`mt-1 text-xs ${isDark ? 'text-[#92AAB1]' : 'text-[#6E7F8B]'}`}>Кваліфіковані дії за останні 12 періодів</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${isDark ? 'bg-[#17313B] text-[#A8CCD8]' : 'bg-[#EDF7FA] text-[#4D788A]'}`}><Clock3 className="h-3 w-3" /> 12 періодів</span>
          </div>
          <div className="mt-7 flex h-48 items-end gap-2 sm:gap-3">
            {(analytics?.monthlyActivity ?? []).map((value, index) => (
              <div key={`${value}-${index}`} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <div className={`w-full max-w-9 rounded-t-lg ${isDark ? 'bg-gradient-to-t from-[#4F8398] to-[#9BC7D7]' : 'bg-gradient-to-t from-[#6D9FB8] to-[#A8CCD8]'}`} style={{ height: `${Math.max(12, (value / 140) * 100)}%` }} title={`${value} qualified actions`} />
                <span className={`text-[9px] ${isDark ? 'text-[#78939D]' : 'text-[#8B99A5]'}`}>{index + 1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-[26px] border p-5 sm:p-6 ${isDark ? 'bg-[#10232B] border-[#2D4A55] text-white' : 'bg-white border-[#D9E2E8] text-[#0F172A]'}`}>
          <h2 className="text-base font-black">Воронка конверсії</h2>
          <p className={`mt-1 text-xs ${isDark ? 'text-[#92AAB1]' : 'text-[#6E7F8B]'}`}>Де саме втрачаються користувачі</p>
          <div className="mt-6 space-y-4">
            {(analytics?.funnel ?? []).map(({ label, percent, tone }) => (
              <div key={String(label)}>
                <div className="flex items-center justify-between gap-3 text-xs font-semibold"><span>{label}</span><span className={tone === 'green' ? 'text-emerald-400' : isDark ? 'text-[#A8CCD8]' : 'text-[#4D788A]'}>{percent}%</span></div>
                <div className={`mt-2 h-2 rounded-full ${isDark ? 'bg-[#1A3641]' : 'bg-[#E7EFF2]'}`}><div className={`h-full rounded-full ${tone === 'amber' ? 'bg-amber-400' : tone === 'green' ? 'bg-emerald-400' : 'bg-[#76AFC7]'}`} style={{ width: `${percent}%` }} /></div>
              </div>
            ))}
          </div>
          <div className={`mt-6 rounded-xl border p-3 text-[11px] leading-relaxed ${isDark ? 'border-[#365966] bg-[#142D37] text-[#A8CCD8]' : 'border-[#D5E4EA] bg-[#F0F7F9] text-[#506A75]'}`}>
            Ранг змінюється тільки від кваліфікованих paid L1 — реєстрації та безкоштовний trial не підміняють фінансову метрику.
          </div>
        </div>
      </div>
    </section>
  );
};
