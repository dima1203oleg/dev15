import { DataEnvelope } from '../types/dataEnvelope';
import { runtimeConfig } from '../config/runtime';
import { getJsonFromPaths, isJsonObject } from './apiClient';

export interface AnalyticsFunnelStep {
  label: string;
  percent: number;
  tone: 'blue' | 'cyan' | 'amber' | 'green';
}

export interface PartnerAnalytics {
  monthlyActivity: number[];
  funnel: AnalyticsFunnelStep[];
  updatedAt: string;
}

const DEMO_ANALYTICS: PartnerAnalytics = {
  monthlyActivity: [42, 56, 51, 72, 68, 84, 96, 88, 108, 121, 116, 134],
  funnel: [
    { label: 'Переходи за посиланням', percent: 100, tone: 'blue' },
    { label: 'Реєстрації', percent: 78, tone: 'cyan' },
    { label: 'Почали trial', percent: 64, tone: 'amber' },
    { label: 'Перша оплата', percent: 52, tone: 'green' },
  ],
  updatedAt: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
};

const isValidPercent = (value: unknown): value is number => (
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100
);

const isValidAnalytics = (value: unknown): value is PartnerAnalytics => {
  if (!isJsonObject(value) || !Array.isArray(value.monthlyActivity) || value.monthlyActivity.length === 0) return false;
  if (!value.monthlyActivity.every((item) => typeof item === 'number' && Number.isFinite(item) && item >= 0)) return false;
  if (!Array.isArray(value.funnel) || value.funnel.length === 0) return false;

  return value.funnel.every((step) => (
    isJsonObject(step)
    && typeof step.label === 'string'
    && isValidPercent(step.percent)
    && ['blue', 'cyan', 'amber', 'green'].includes(String(step.tone))
  ));
};

class AnalyticsService {
  async getPartnerAnalytics(): Promise<DataEnvelope<PartnerAnalytics>> {
    const updatedAt = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

    if (!runtimeConfig.apiBaseUrl && !runtimeConfig.allowDemoData) {
      return {
        data: null,
        state: 'NOT_CONNECTED',
        source: 'SIREN_UA_PARTNER_ANALYTICS',
        updatedAt,
        isRealData: false,
        error: 'Partner analytics API не підключений',
      };
    }

    if (runtimeConfig.apiBaseUrl) {
      try {
        const remote = await getJsonFromPaths<unknown>([
          '/api/partner/analytics',
          '/api/v1/partner/analytics',
        ], 2500);
        if (!isValidAnalytics(remote)) throw new Error('Partner analytics has invalid shape');

        return {
          data: { ...remote, updatedAt },
          state: 'LIVE',
          source: 'SIREN_UA_PARTNER_ANALYTICS',
          updatedAt,
          isRealData: true,
        };
      } catch {
        return {
          data: null,
          state: 'NOT_CONNECTED',
          source: 'SIREN_UA_PARTNER_ANALYTICS',
          updatedAt,
          isRealData: false,
          error: 'Partner analytics API is not connected or returned an invalid payload',
        };
      }
    }

    return {
      data: { ...DEMO_ANALYTICS, updatedAt },
      state: 'DEMO',
      source: 'LOCAL_DEMO_PARTNER_ANALYTICS',
      updatedAt,
      isRealData: false,
    };
  }
}

export const analyticsService = new AnalyticsService();
