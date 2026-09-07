import React, { useEffect, useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Award, 
  Edit3, 
  Copy, 
  Check, 
  Share2, 
  Download, 
  QrCode, 
  CreditCard, 
  Plus, 
  Lock, 
  Key, 
  Smartphone, 
  FileText, 
  HelpCircle, 
  MessageSquare, 
  Send, 
  BookOpen, 
  LogOut, 
  UserX, 
  Trash2, 
  ArrowRight, 
  ChevronRight, 
  CheckCircle2, 
  MoreVertical,
  Camera,
  Layers,
  Sparkles,
  Crown
} from 'lucide-react';
import { playWebAudioSound } from '../utils/sirenAudio';

import { InfoTooltip } from './InfoTooltip';
import { ContextDrawer } from './ContextDrawer';
import { DataFreshnessIndicator } from './DataFreshnessIndicator';
import { profileService, UserProfileData } from '../services/profileService';
import { DataState } from '../types/dataEnvelope';
import { kycService, KycVerificationData } from '../services/kycService';
import { authSecurityService, UserSecurityData } from '../services/authSecurityService';
import { runtimeConfig } from '../config/runtime';

interface ProfileSectionProps {
  theme?: 'light' | 'dark';
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  theme = 'light',
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isEditingData, setIsEditingData] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [profileState, setProfileState] = useState<DataState>(runtimeConfig.apiBaseUrl ? 'LOADING' : runtimeConfig.allowDemoData ? 'DEMO' : 'NOT_CONNECTED');
  const [kycData, setKycData] = useState<KycVerificationData | null>(null);
  const [kycState, setKycState] = useState<DataState>(runtimeConfig.apiBaseUrl ? 'LOADING' : 'NOT_CONNECTED');
  const [securityData, setSecurityData] = useState<UserSecurityData | null>(null);
  const [securityState, setSecurityState] = useState<DataState>(runtimeConfig.apiBaseUrl ? 'LOADING' : 'NOT_CONNECTED');
  const [activeDrawer, setActiveDrawer] = useState<'rank' | 'payments' | 'kyc' | 'security' | 'achievements' | 'support' | null>(null);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    financial: true,
    newReferrals: true,
    bonuses: true,
    ranks: true,
    marketing: false,
    system: true,
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    let mounted = true;
    profileService.getProfile().then((response) => {
      if (!mounted) return;
      setProfileState(response.state);
      if (response.data) setProfileData(response.data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.all([kycService.getKycStatus(), authSecurityService.getSecurityStatus()]).then(([kyc, security]) => {
      if (!mounted) return;
      setKycState(kyc.state);
      setKycData(kyc.data || null);
      setSecurityState(security.state);
      setSecurityData(security.data || null);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const profile = profileData;
  const profileUnavailable = profileState === 'NOT_CONNECTED';
  const profileLoading = profileState === 'LOADING';
  const displayName = profile?.fullName || (profileUnavailable ? 'Профіль недоступний' : profileLoading ? 'Завантаження профілю…' : 'Демонстраційний профіль');
  const displayFirstName = profile?.firstName || (profileUnavailable || profileLoading ? '—' : 'Демо');
  const displayLastName = profile?.lastName || (profileUnavailable || profileLoading ? '—' : 'користувач');
  const displayPartnerId = profile?.partnerId || '—';
  const displayCode = profileState === 'LIVE' ? (profile?.partnerCode || '—') : profileState === 'DEMO' ? 'DEMO-КОД' : '—';
  const displayEmail = profile?.email || 'Дані недоступні';
  const displayPhone = profile?.phone || 'Дані недоступні';
  const displayCity = profile?.city || '—';
  const displayRegistrationDate = profile?.registrationDate || '—';
  const displayRank = profile?.currentRank.badgeLabel || '—';
  const displayRate = profile?.currentRank.l1Percent ?? 0;
  const displayQualifiedL1 = profile?.qualifiedL1 ?? 0;
  const displayNetworkCount = profile?.totalNetworkCount ?? 0;
  const displayNextRank = profile?.nextRank?.name || (profileUnavailable || profileLoading ? '—' : 'DEMO');
  const displayRemainingL1 = profile?.remainingL1ToNextRank ?? 0;
  const displayRankProgress = profile?.rankProgressPercent ?? 0;
  const displayAvatar = profile?.avatarUrl || '';
  const liveReferralUrl = profileState === 'LIVE' && profile?.partnerCode ? `https://siren.ua/r/${profile.partnerCode}` : '';
  const displayReferralUrl = liveReferralUrl || (profileState === 'DEMO' ? 'Посилання недоступне в DEMO' : 'Посилання недоступне');
  const partnerActionsAvailable = Boolean(liveReferralUrl);
  const isKycLive = kycState === 'LIVE';
  const isSecurityLive = securityState === 'LIVE';
  const kycStatusLabel = isKycLive && kycData?.status === 'VERIFIED' ? 'Підтверджено' : 'Не підтверджено';
  const securitySessions = isSecurityLive ? (securityData?.activeSessions.length ?? 0) : 0;
  const accountStatusLabel = profileState === 'LIVE' && isSecurityLive ? 'Активний' : profileState === 'DEMO' ? 'DEMO' : 'Статус невідомий';
  const accountVerificationLabel = profileState === 'LIVE' && isKycLive && kycData?.status === 'VERIFIED' ? 'Верифікований' : profileState === 'DEMO' ? 'DEMO-профіль' : 'Не підтверджено';

  const handleCopyCode = () => {
    if (!partnerActionsAvailable || !profile?.partnerCode) return;
    navigator.clipboard.writeText(displayCode);
    setCopiedCode(true);
    playWebAudioSound('click');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!liveReferralUrl) return;
    navigator.clipboard.writeText(liveReferralUrl);
    setCopiedLink(true);
    playWebAudioSound('click');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    playWebAudioSound('click');
  };

  const notifyAction = (message: string) => {
    setProfileNotice(message);
    playWebAudioSound('click');
    window.setTimeout(() => setProfileNotice(null), 4200);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* 1. Top Hero Profile Banner with User Card & 3D Holographic ID Card (1:1 with Screenshot 2) */}
      <div className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden flex flex-col xl:flex-row items-center justify-between gap-6 ${
        isDark 
          ? 'bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border-slate-800 text-white' 
          : 'bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-blue-50/80 border-slate-100 text-slate-900 shadow-xs'
      }`}>
        
        {/* Left Column: Headline & Subtitle */}
        <div className="space-y-3 max-w-sm flex-shrink-0 z-10">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
            isDark ? 'bg-slate-900 border border-slate-800 text-slate-300' : 'bg-blue-100/70 border border-blue-200/60 text-blue-700'
          }`}>
            <span>🇺🇦</span>
            <span>Разом будуємо безпечну Україну</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className={`text-3xl sm:text-4xl font-black tracking-tight leading-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Мій профіль
            </h1>
            <DataFreshnessIndicator state={profileState} theme={theme} />
          </div>

          <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <span className="font-bold text-slate-700 dark:text-slate-200">Більше, ніж акаунт. Це твій внесок у безпечне завтра.</span><br />
            Керуй своїми даними, безпекою, партнерським статусом та відкривай нові можливості разом із SIREN UA. {profileState === 'DEMO' ? 'Дані профілю демонстраційні до підключення auth API.' : profileState === 'NOT_CONNECTED' ? 'Дані профілю тимчасово недоступні, доки auth API не відновить з’єднання.' : 'Дані профілю підтверджені auth API.'}
          </p>
        </div>

        {/* Center: Detailed Avatar & Personal Info Card (1:1 with Screenshot 2) */}
        <div className="flex flex-col sm:flex-row items-center gap-5 z-10 flex-1 justify-center">
          
          {/* Avatar with Camera & Online Badge */}
          <div className="relative flex flex-col items-center flex-shrink-0">
            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-blue-600 to-cyan-400 shadow-xl relative">
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-slate-800">
                {displayAvatar ? (
                  <img
                    src={displayAvatar || undefined}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-9 h-9 text-slate-400 mx-auto mt-5" aria-hidden="true" />
                )}
              </div>
              {/* Camera Icon Overlay */}
              <button 
                onClick={() => notifyAction('Зміна фото стане доступною після підключення auth/storage API.')}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-colors cursor-pointer"
                title="Змінити фото"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {/* Online Status Pill */}
            <div className={`mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${
              profileState === 'LIVE'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 text-emerald-600'
                : profileState === 'DEMO'
                  ? 'bg-purple-50 dark:bg-purple-950/70 border-purple-200 text-purple-600'
                  : 'bg-amber-50 dark:bg-amber-950/70 border-amber-200 text-amber-600'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${profileState === 'LIVE' ? 'bg-emerald-500 animate-pulse' : profileState === 'DEMO' ? 'bg-purple-500' : 'bg-amber-500'}`} />
              <span>{profileState === 'LIVE' ? 'Онлайн' : profileState === 'DEMO' ? 'DEMO-профіль' : 'Статус недоступний'}</span>
            </div>
          </div>

          {/* User Details Column */}
          <div className="space-y-1.5 text-center sm:text-left text-xs">
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <h2 className="text-xl font-black">{displayName}</h2>
              <InfoTooltip text="Статус профілю та KYC підтверджуються підключеним auth-сервісом.">
                <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500 text-white" />
              </InfoTooltip>
            </div>
            
            <div className={`text-[11px] font-mono flex items-center justify-center sm:justify-start gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Partner ID: <span className="font-bold text-blue-600">{displayPartnerId}</span>
              <InfoTooltip text="Ваш унікальний ідентифікатор у мережі SIREN UA. Використовується для реферальних нарахувань та служби підтримки." />
            </div>

            <div className={`space-y-1 pt-1 text-slate-600 dark:text-slate-300 text-[11px]`}>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{displayEmail}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{displayPhone}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Україна, {displayCity}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>У системі з {displayRegistrationDate}</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Часовий пояс: Europe/Kyiv</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right: 3D Holographic ID Card Widget & Quick Action Button */}
        <div className="flex flex-col items-center sm:items-end gap-3 z-10 flex-shrink-0">
          
          {/* 3D Holographic ID Card (1:1 with Screenshot 2) */}
          <div className="relative w-56 h-32 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 p-3.5 text-white shadow-xl shadow-blue-500/20 transform perspective-1000 rotate-y-6 hover:rotate-0 transition-transform duration-500 flex flex-col justify-between overflow-hidden border border-blue-400/40">
            {/* Hologram Shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full animate-shimmer pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              {/* Trident Emblem */}
              <div className="w-6 h-6 text-amber-300">
                <svg viewBox="0 0 24 24" className="w-full h-full fill-none stroke-current" strokeWidth="2">
                  <path d="M7 16V6M17 16V6M12 4V20M4 9L12 20L20 9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <div>
              <div className="text-sm font-black tracking-wider">SIREN UA</div>
              <div className="text-[9px] text-blue-200">Партнерська спільнота</div>
            </div>
          </div>

          {/* Quick Status Pill */}
          <div className={`w-56 p-2.5 rounded-2xl border text-xs space-y-1.5 ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white/90 border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1 text-amber-500">
                <Crown className="w-3.5 h-3.5 fill-amber-500" /> {displayRank}
              </span>
              <span className="text-[10px] text-slate-400">Ставка: {displayRate}%</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span className={`flex items-center gap-1 ${accountVerificationLabel === 'Верифікований' ? 'text-emerald-600' : 'text-amber-600'}`}><ShieldCheck className="w-3 h-3" /> {accountVerificationLabel}</span>
              <span className={`flex items-center gap-1 ${accountStatusLabel === 'Активний' ? 'text-emerald-600' : 'text-amber-600'}`}><span className={`w-1.5 h-1.5 rounded-full ${accountStatusLabel === 'Активний' ? 'bg-emerald-500' : 'bg-amber-500'}`} /> {accountStatusLabel}</span>
            </div>
          </div>

          <button
            onClick={() => {
              setIsEditingData(!isEditingData);
              playWebAudioSound('click');
            }}
            className="w-56 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Редагувати профіль</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Slogan */}
          <div className="text-right text-[10px] text-slate-400 mt-1 pointer-events-none hidden xl:block">
            Технології. Люди. Безпечніше завтра.
          </div>
        </div>

      </div>

      {/* 2. Main 10-Card Comprehensive Grid (1:1 with Screenshot 2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
        
        {/* Card 1: Особисті дані */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold">Особисті дані</h3>
              </div>
              <button 
                onClick={() => setIsEditingData(!isEditingData)}
                className="text-xs text-blue-500 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Редагувати</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-400">Ім'я</span>
                <span className="font-semibold">{displayFirstName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-400">Прізвище</span>
                <span className="font-semibold">{displayLastName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-400">Email</span>
                <span className="font-semibold">{displayEmail}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-400">Телефон</span>
                <span className="font-semibold">{displayPhone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-400">Країна</span>
                <span className="font-semibold">Україна</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-400">Місто</span>
                <span className="font-semibold">{displayCity}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-400">Мова</span>
                <span className="font-semibold">Українська</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-400">Дата реєстрації</span>
                <span className="font-semibold">{displayRegistrationDate}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Partner ID</span>
                <span className="font-mono font-bold text-blue-600">{displayPartnerId}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Партнерський статус */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold">Партнерський статус</h3>
              </div>
              <button onClick={() => setActiveDrawer('rank')} className="text-xs text-blue-500 font-semibold flex items-center gap-0.5 hover:underline cursor-pointer">
                <span>Інфо</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-3 my-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
                <Crown className="w-6 h-6 fill-amber-500" />
              </div>
              <div>
                <div className="text-base font-black">{displayRank}</div>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ставка: <span className="font-bold text-slate-900 dark:text-white">{displayRate}%</span></div>
              </div>
            </div>

            {/* Progress to Platinum */}
            <div className="my-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>До наступного рівня: <span className="font-bold text-slate-800 dark:text-slate-200">{displayNextRank}</span></span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${displayRankProgress}%` }} />
              </div>
              <div className="text-right text-[10px] font-mono text-slate-400">{displayRemainingL1} L1 до {displayNextRank}</div>
            </div>

            {/* 6 Rank Tier Steps Visualizer (1:1 with Screenshot 2) */}
            <div className="flex items-center justify-between text-[9px] text-center pt-2">
              {['Starter', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Ambassador'].map((t, i) => (
                <div key={t} className="flex flex-col items-center gap-1">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                    t === 'Gold' 
                      ? 'bg-amber-500 text-white ring-2 ring-amber-300' 
                      : i < 3 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}>
                    {i < 3 ? '✓' : ''}
                  </div>
                  <span className={t === 'Gold' ? 'font-bold text-amber-500' : 'text-slate-400'}>{t}</span>
                </div>
              ))}
            </div>

            <div className={`grid grid-cols-3 gap-2 mt-4 pt-3 border-t text-center text-xs ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <div>
                <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Активні реферали</div>
                <div className="text-sm font-black mt-0.5">{displayQualifiedL1}</div>
              </div>
              <div>
                <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Особиста мережа</div>
                <div className="text-sm font-black mt-0.5">{displayNetworkCount}</div>
              </div>
              <div>
                <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Оновлено статус</div>
                <div className="text-xs font-semibold mt-0.5">{profile?.registrationDate || '—'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Реферальні інструменти */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  Реферальні інструменти
                  <InfoTooltip text="Використовуйте код або посилання для запрошення нових користувачів. Вони стануть вашими партнерами L1." />
                </h3>
              </div>
              <button 
                onClick={handleCopyLink}
                disabled={!partnerActionsAvailable}
                title={partnerActionsAvailable ? 'Поділитися referral-посиланням' : 'Referral API не підключений'}
                className="text-xs text-blue-500 font-semibold flex items-center gap-1 hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Поділитися</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-[11px] text-slate-400 mb-1">Твій код</div>
                <div className={`p-2.5 rounded-2xl border flex items-center justify-between ${
                  isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-sm font-mono font-bold">{displayCode}</span>
                  <button onClick={handleCopyCode} disabled={!partnerActionsAvailable} title={partnerActionsAvailable ? 'Скопіювати referral-код' : 'Referral API не підключений'} className="p-1 text-slate-400 hover:text-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-400 mb-1">Твоє посилання</div>
                <div className={`p-2.5 rounded-2xl border flex items-center justify-between ${
                  isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-xs font-mono truncate mr-2">{displayReferralUrl}</span>
                  <button onClick={handleCopyLink} disabled={!partnerActionsAvailable} title={partnerActionsAvailable ? 'Скопіювати referral-посилання' : 'Referral API не підключений'} className="p-1 text-slate-400 hover:text-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  onClick={handleCopyLink}
                  disabled={!partnerActionsAvailable}
                  title={partnerActionsAvailable ? 'Скопіювати referral-посилання' : 'Referral API не підключений'}
                  className="flex-1 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Копіювати</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  disabled={!partnerActionsAvailable}
                  title={partnerActionsAvailable ? 'Поділитися referral-посиланням' : 'Referral API не підключений'}
                  className="flex-1 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Поділитися</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  disabled={!partnerActionsAvailable}
                  title={partnerActionsAvailable ? 'Завантажити QR referral-посилання' : 'Referral API не підключений'}
                  className="flex-1 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Завантажити QR</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Способи виплати */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold">Способи виплати</h3>
              </div>
              <button onClick={() => setActiveDrawer('payments')} className="text-xs text-blue-500 font-semibold flex items-center gap-1 hover:underline cursor-pointer">
                <span>Додати</span>
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {profileState !== 'LIVE' ? (
                <div className={`p-4 rounded-2xl border text-xs ${isDark ? 'bg-slate-800/80 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  {profileState === 'DEMO' ? 'Демонстраційні платіжні реквізити навмисно не показуємо як реальні. Підключіть payout API, щоб отримати верифіковані методи.' : 'Платіжні методи стануть доступні після підключення профільного та payout API. Реквізити не вважаються верифікованими.'}
                </div>
              ) : <>
              <div className={`p-2.5 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-100'
              }`}>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-bold leading-tight">Банківська картка</div>
                    <div className="text-[10px] text-slate-400">***** 4242</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                  Основна
                </span>
              </div>

              <div className={`p-2.5 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-100'
              }`}>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-600" />
                  <div>
                    <div className="font-bold leading-tight">IBAN (UAH)</div>
                    <div className="text-[10px] text-slate-400">UA12 3003 0000 0002 ...</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                  Верифіковано
                </span>
              </div>

              <div className={`p-2.5 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-100'
              }`}>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-sky-500" />
                  <div>
                    <div className="font-bold leading-tight">PayPal</div>
                    <div className="text-[10px] text-slate-400">{displayEmail}</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                  Підключено
                </span>
              </div>
              </>}
            </div>
          </div>
        </div>

        {/* Card 5: Верифікація / KYC */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold">Верифікація / KYC</h3>
              </div>
              <button onClick={() => setActiveDrawer('kyc')} className="text-xs text-blue-500 font-semibold flex items-center gap-0.5 hover:underline cursor-pointer">
                <span>Переглянути</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-2 my-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500 text-white" />
              <div>
                <div className={`text-sm font-black ${kycStatusLabel === 'Підтверджено' ? 'text-emerald-600' : 'text-amber-600'}`}>{kycStatusLabel}</div>
                <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{isKycLive ? 'Статус наданий KYC-провайдером' : 'Провайдер KYC не підключений'}</div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs pt-2">
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-400">Підтвердження email</span>
                <span className={`font-bold ${isKycLive && kycData?.status === 'VERIFIED' ? 'text-emerald-500' : 'text-amber-500'}`}>{isKycLive && kycData?.status === 'VERIFIED' ? 'Так' : 'Не підтверджено'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-400">Підтвердження телефону</span>
                <span className={`font-bold ${isKycLive && kycData?.status === 'VERIFIED' ? 'text-emerald-500' : 'text-amber-500'}`}>{isKycLive && kycData?.status === 'VERIFIED' ? 'Так' : 'Не підтверджено'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-400">Документ (ID Card)</span>
                <span className={`font-bold ${isKycLive ? 'text-blue-600' : 'text-amber-500'}`}>{isKycLive ? 'Завантажено' : 'Немає даних'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Остання перевірка</span>
                <span className="font-semibold">{isKycLive ? (kycData?.verifiedAt || 'Провайдер') : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 6: Безпека */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold">Безпека</h3>
              </div>
              <button onClick={() => setActiveDrawer('security')} className="text-xs text-blue-500 font-semibold flex items-center gap-1 hover:underline cursor-pointer">
                <span>Керувати</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-400">Пароль</span>
                <span className="font-semibold">{isSecurityLive ? (securityData?.lastPasswordChange || 'Провайдер') : 'Немає даних'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-400 flex items-center gap-1">
                  Двофакторна автентифікація (2FA)
                  <InfoTooltip text="Захист вашого акаунта. Під час входу потрібно буде ввести код із додатка Google Authenticator." />
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isSecurityLive && securityData?.twoFactorEnabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                  {isSecurityLive && securityData?.twoFactorEnabled ? 'Увімкнено' : 'Не підтверджено'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-400">Активні сесії</span>
                <span className={`font-bold ${isSecurityLive ? 'text-blue-600' : 'text-amber-500'}`}>{isSecurityLive ? `${securitySessions} пристрої` : 'Немає даних'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                <span className="text-slate-400">Останній вхід</span>
                <span className="font-semibold">{isSecurityLive ? 'Провайдер' : '—'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Статус акаунта</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isSecurityLive ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                  {isSecurityLive ? 'Підтверджено' : 'Не підтверджено'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 7: Налаштування сповіщень */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
        }`}>
          <div>
            <h3 className="text-sm font-bold mb-3">Налаштування сповіщень</h3>

            <div className="space-y-2.5 text-xs">
              {[
                { key: 'push', label: 'Push-сповіщення' },
                { key: 'email', label: 'Email-сповіщення' },
                { key: 'financial', label: 'Фінансові оновлення' },
                { key: 'newReferrals', label: 'Нові реферали' },
                { key: 'bonuses', label: 'Нарахування та бонуси' },
                { key: 'ranks', label: 'Досягнення / ранги' },
                { key: 'marketing', label: 'Маркетингові новини' },
                { key: 'system', label: 'Системні оновлення' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <span>{item.label}</span>
                  <button
                    onClick={() => toggleNotification(item.key as any)}
                    className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                      (notifications as any)[item.key] ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform ${
                      (notifications as any)[item.key] ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 8: Мої досягнення */}
        <div className={`p-5 rounded-3xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold">Мої досягнення</h3>
              </div>
              <button onClick={() => setActiveDrawer('achievements')} className="text-xs text-blue-500 font-semibold flex items-center gap-1 hover:underline cursor-pointer">
                <span>Всі досягнення</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center text-[10px] pt-1">
              <div className={`p-2.5 rounded-2xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-blue-50/50 border-blue-100'}`}>
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white mx-auto flex items-center justify-center mb-1">
                  🥇
                </div>
                <div className="font-bold">Перший реферал</div>
              </div>
              <div className={`p-2.5 rounded-2xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-amber-50/50 border-amber-100'}`}>
                <div className="w-8 h-8 rounded-full bg-amber-600 text-white mx-auto flex items-center justify-center mb-1">
                  🥉
                </div>
                <div className="font-bold">Bronze Partner</div>
              </div>
              <div className={`p-2.5 rounded-2xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-purple-50/50 border-purple-100'}`}>
                <div className="w-8 h-8 rounded-full bg-purple-500 text-white mx-auto flex items-center justify-center mb-1">
                  👥
                </div>
                <div className="font-bold">10 активних</div>
              </div>
              <div className={`p-2.5 rounded-2xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-amber-50/50 border-amber-100'}`}>
                <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-900 mx-auto flex items-center justify-center mb-1">
                  👑
                </div>
                <div className="font-bold">{displayRank}</div>
              </div>
              <div className={`p-2.5 rounded-2xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-emerald-50/50 border-emerald-100'}`}>
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center mb-1">
                  🛡️
                </div>
                <div className="font-bold">Safe Contributor</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 9: Підтримка & Card 10: Небезпечні дії */}
        <div className="space-y-4">
          
          {/* Підтримка */}
          <div className={`p-5 rounded-3xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold">Підтримка</h3>
              </div>
              <button onClick={() => setActiveDrawer('support')} className="text-xs text-blue-500 font-semibold flex items-center gap-1 hover:underline cursor-pointer">
                <span>Перейти</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <button type="button" onClick={() => setActiveDrawer('support')} className="w-full flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
                <span className="flex items-center gap-2"><HelpCircle className="w-3.5 h-3.5 text-slate-400" /> Центр допомоги (FAQ)</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button type="button" onClick={() => setActiveDrawer('support')} className="w-full flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
                <span className="flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5 text-slate-400" /> Написати в підтримку</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <a href="https://t.me/sirenua_support" target="_blank" rel="noreferrer" className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <span className="flex items-center gap-2"><Send className="w-3.5 h-3.5 text-sky-500" /> Telegram-чат</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </a>
              <button type="button" onClick={() => setActiveDrawer('support')} className="w-full flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
                <span className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5 text-slate-400" /> База знань</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Небезпечні дії */}
          <div className={`p-5 rounded-3xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
          }`}>
            <h3 className="text-sm font-bold text-rose-500 mb-3">Небезпечні дії</h3>

            <div className="space-y-2 text-xs">
              <button onClick={() => notifyAction('Завершення всіх сесій потребує підключеного auth API.')} className="w-full flex items-center justify-between p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
                <span className="flex items-center gap-2"><LogOut className="w-3.5 h-3.5" /> Вийти з усіх пристроїв</span>
              </button>
              <button onClick={() => notifyAction('Деактивація профілю доступна після підтвердження особи та підключення auth API.')} className="w-full flex items-center justify-between p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
                <span className="flex items-center gap-2"><UserX className="w-3.5 h-3.5" /> Деактивувати профіль</span>
              </button>
              <button onClick={() => notifyAction('Експорт даних буде доступний після підключення profile API.')} className="w-full flex items-center justify-between p-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
                <span className="flex items-center gap-2"><Download className="w-3.5 h-3.5" /> Запросити експорт даних</span>
              </button>
              
              <button onClick={() => notifyAction('Видалення акаунта заблоковано до підключення auth/compliance API.')} className="w-full mt-2 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" />
                <span>Видалити акаунт</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {profileNotice && (
        <div role="status" className={`fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl border px-4 py-3 text-xs font-semibold shadow-xl ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
        }`}>
          {profileNotice}
        </div>
      )}

      <ContextDrawer
        isOpen={activeDrawer !== null}
        onClose={() => setActiveDrawer(null)}
        title={activeDrawer === 'rank' ? 'Партнерський статус' : activeDrawer === 'payments' ? 'Способи виплати' : activeDrawer === 'kyc' ? 'KYC-перевірка' : activeDrawer === 'security' ? 'Безпека акаунта' : activeDrawer === 'achievements' ? 'Досягнення' : 'Підтримка'}
        icon={<ShieldCheck className="w-5 h-5" />}
        theme={theme}
      >
        <div className="space-y-4 text-sm">
          {activeDrawer === 'rank' && <><p>Поточний ранг: <strong>{displayRank}</strong>, ставка L1: <strong>{displayRate}%</strong>.</p><p className="text-xs text-slate-500">Ранг визначається кваліфікованими активними L1. Історичні нарахування не перераховуються після зміни рангу.</p></>}
          {activeDrawer === 'payments' && <><p>Платіжні методи керуються payout-провайдером.</p><p className="text-xs text-amber-600">{profileState === 'LIVE' ? 'Провайдер повернув live-дані.' : 'Payout API не підключений: локальні реквізити не зберігаються і не вважаються верифікованими.'}</p></>}
          {activeDrawer === 'kyc' && <><p>Статус: <strong>{kycStatusLabel}</strong>.</p><p className="text-xs text-slate-500">{isKycLive ? 'Дані надані підключеним KYC-провайдером.' : 'Підключіть KYC-провайдера, щоб пройти перевірку та відкрити payout-ліміти.'}</p></>}
          {activeDrawer === 'security' && <><p>Стан безпеки: <strong>{isSecurityLive ? 'підтверджено' : 'не підтверджено'}</strong>.</p><p className="text-xs text-slate-500">{isSecurityLive ? `2FA: ${securityData?.twoFactorEnabled ? 'увімкнено' : 'вимкнено'}. Активних сесій: ${securitySessions}.` : 'Auth security API не підключений; локальний екран не робить заяв про захищені сесії.'}</p></>}
          {activeDrawer === 'achievements' && <><p>Досягнення відокремлені від фінансової компенсації.</p><p className="text-xs text-slate-500">У demo mode показані приклади badge; реальні achievements завантажуються з partner API.</p></>}
          {activeDrawer === 'support' && <><p>Для швидкої відповіді відкрийте офіційний Telegram-чат або FAQ.</p><a className="inline-flex items-center gap-2 text-blue-600 font-semibold" href="https://t.me/sirenua_support" target="_blank" rel="noreferrer">Відкрити Telegram-підтримку <ArrowRight className="w-3.5 h-3.5" /></a></>}
        </div>
      </ContextDrawer>

    </div>
  );
};
