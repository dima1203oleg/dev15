/**
 * SIREN UA Auth & Security Domain Service
 */

import { DataEnvelope } from '../types/dataEnvelope';
import { getJsonFromPaths, isJsonObject } from './apiClient';

export interface UserSecuritySession {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface UserSecurityData {
  twoFactorEnabled: boolean;
  twoFactorMethod: 'AUTHENTICATOR_APP' | 'SMS' | 'TELEGRAM';
  lastPasswordChange: string;
  activeSessions: UserSecuritySession[];
  securityScorePercent: number;
}

const DEFAULT_SECURITY: UserSecurityData = {
  twoFactorEnabled: true,
  twoFactorMethod: 'AUTHENTICATOR_APP',
  lastPasswordChange: '15 серпня 2024 (22 дні тому)',
  activeSessions: [
    {
      id: 'sess-1',
      device: 'MacBook Pro 16" (M2 Max)',
      browser: 'Chrome 128.0',
      ip: '178.150.***.***',
      location: 'Одеса, Україна',
      lastActive: 'Зараз онлайн',
      isCurrent: true,
    },
    {
      id: 'sess-2',
      device: 'iPhone 15 Pro Max',
      browser: 'SIREN UA iOS App 2.4.0',
      ip: '178.150.***.***',
      location: 'Одеса, Україна',
      lastActive: '15 хв тому',
      isCurrent: false,
    },
  ],
  securityScorePercent: 95,
};

class AuthSecurityService {
  private security: UserSecurityData = DEFAULT_SECURITY;

  public async getSecurityStatus(): Promise<DataEnvelope<UserSecurityData>> {
    const updatedAt = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

    try {
      const remote = await getJsonFromPaths<unknown>([
        '/api/auth/security',
        '/api/v1/auth/security',
      ], 2000);
      if (!isJsonObject(remote) || typeof remote.twoFactorEnabled !== 'boolean' || !Array.isArray(remote.activeSessions)) {
        throw new Error('Security payload has invalid shape');
      }

      return {
        data: remote as unknown as UserSecurityData,
        state: 'LIVE',
        source: 'SIREN_UA_AUTH_SECURITY',
        updatedAt,
        isRealData: true,
      };
    } catch {
      // A local browser cannot prove account security state.
    }

    return {
      data: {
        ...this.security,
        twoFactorEnabled: false,
        activeSessions: [],
        securityScorePercent: 0,
      },
      state: 'NOT_CONNECTED',
      source: 'AUTH_SECURITY_API_UNAVAILABLE',
      updatedAt,
      isRealData: false,
      error: 'Стан безпеки акаунта не підтверджено сервером',
    };
  }

  public toggle2FA(): boolean {
    this.security.twoFactorEnabled = !this.security.twoFactorEnabled;
    return this.security.twoFactorEnabled;
  }
}

export const authSecurityService = new AuthSecurityService();
