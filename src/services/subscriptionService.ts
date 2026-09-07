import { DataEnvelope } from '../types/dataEnvelope';
import { isJsonObject, postJson } from './apiClient';

export interface SubscriptionRecord {
  id?: string;
  planCode?: string;
  state?: string;
  trialEndsAt?: string;
  currentPeriodEnd?: string;
}

/**
 * Canonical subscription boundary.  No client-side trial is ever considered
 * activated: only the authenticated Dev15/provider response can confirm it.
 */
export const subscriptionService = {
  async startTrial(): Promise<DataEnvelope<SubscriptionRecord>> {
    const updatedAt = new Date().toISOString();
    try {
      const remote = await postJson<unknown>('/api/subscription/trial', {});
      const record = isJsonObject(remote) && isJsonObject(remote.subscription)
        ? remote.subscription
        : remote;

      if (!isJsonObject(record)) throw new Error('Subscription response has invalid shape');

      return {
        data: {
          id: typeof record.id === 'string' ? record.id : undefined,
          planCode: typeof record.planCode === 'string' ? record.planCode : undefined,
          state: typeof record.state === 'string' ? record.state : undefined,
          trialEndsAt: typeof record.trialEndsAt === 'string' ? record.trialEndsAt : undefined,
          currentPeriodEnd: typeof record.currentPeriodEnd === 'string' ? record.currentPeriodEnd : undefined,
        },
        state: 'LIVE',
        source: 'SIREN_UA_SUBSCRIPTION_API',
        updatedAt,
        isRealData: true,
      };
    } catch {
      return {
        data: null,
        state: 'NOT_CONNECTED',
        source: 'SIREN_UA_SUBSCRIPTION_API',
        updatedAt,
        isRealData: false,
        error: 'Не вдалося активувати trial: потрібні автентифікований профіль і підключений платіжний сервіс.',
      };
    }
  },
};
