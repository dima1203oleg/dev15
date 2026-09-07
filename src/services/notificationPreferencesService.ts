/**
 * SIREN UA Notification Preferences & In-App Notification Center Service
 */

import { DataEnvelope } from '../types/dataEnvelope';
import { runtimeConfig } from '../config/runtime';

export interface UserNotificationPreferences {
  push: boolean;
  email: boolean;
  financial: boolean;
  newReferrals: boolean;
  bonuses: boolean;
  ranks: boolean;
  marketing: boolean;
  system: boolean;
  soundAlerts: boolean;
}

export interface InAppNotification {
  id: string;
  category: 'SAFETY' | 'FINANCE' | 'NETWORK' | 'SECURITY' | 'SYSTEM';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  actionUrl?: string;
}

const DEFAULT_PREFERENCES: UserNotificationPreferences = {
  push: true,
  email: true,
  financial: true,
  newReferrals: true,
  bonuses: true,
  ranks: true,
  marketing: false,
  system: true,
  soundAlerts: true,
};

const INITIAL_NOTIFICATIONS: InAppNotification[] = [
  {
    id: 'notif-1',
    category: 'FINANCE',
    title: 'Виплата успішно виконана',
    message: '₴ 4 230 зараховано на карту Monobank (•••• 2291).',
    timestamp: '2 год тому',
    read: false,
    priority: 'HIGH',
  },
  {
    id: 'notif-2',
    category: 'NETWORK',
    title: 'Нова реєстрація партнера L1',
    message: 'Сергій Ткаченко приєднався за вашим реферальним посиланням.',
    timestamp: '5 год тому',
    read: false,
    priority: 'NORMAL',
  },
  {
    id: 'notif-3',
    category: 'SAFETY',
    title: 'Моніторинг загроз активний',
    message: 'Для Одеської області активних балістичних чи ракетних загроз наразі не виявлено.',
    timestamp: 'Сьогодні, 12:00',
    read: true,
    priority: 'NORMAL',
  },
  {
    id: 'notif-4',
    category: 'SECURITY',
    title: 'Успішний вхід у систему',
    message: 'Нова сесія з MacBook Pro (Одеса, Chrome 128).',
    timestamp: 'Вчора, 18:40',
    read: true,
    priority: 'LOW',
  },
];

class NotificationPreferencesService {
  private preferences: UserNotificationPreferences = DEFAULT_PREFERENCES;
  private notifications: InAppNotification[] = INITIAL_NOTIFICATIONS;

  public async getPreferences(): Promise<DataEnvelope<UserNotificationPreferences>> {
    if (!runtimeConfig.allowDemoData) {
      return {
        data: null,
        state: 'NOT_CONNECTED',
        source: 'SIREN_UA_NOTIFICATION_API',
        updatedAt: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
        isRealData: false,
        error: 'Notification API не підключений',
      };
    }
    return {
      data: this.preferences,
      state: 'DEMO',
      source: 'LOCAL_BROWSER_PREFERENCES',
      updatedAt: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
      isRealData: false,
    };
  }

  public updatePreference(key: keyof UserNotificationPreferences, value: boolean): UserNotificationPreferences {
    this.preferences = { ...this.preferences, [key]: value };
    return this.preferences;
  }

  public getInAppNotifications(): InAppNotification[] {
    return runtimeConfig.allowDemoData ? this.notifications : [];
  }

  public markAsRead(id: string): void {
    this.notifications = this.notifications.map(n => n.id === id ? { ...n, read: true } : n);
  }

  public markAllAsRead(): void {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
  }

  public clearNotifications(): void {
    this.notifications = [];
  }
}

export const notificationPreferencesService = new NotificationPreferencesService();
