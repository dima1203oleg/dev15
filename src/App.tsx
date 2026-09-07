import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { HomeFeaturesGrid } from './components/HomeFeaturesGrid';
import { HomeFinanceSituationRow } from './components/HomeFinanceSituationRow';
import { SirenOrbitalDeviceEcosystem } from './components/orbital/SirenOrbitalDeviceEcosystem';
import { Footer } from './components/Footer';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { threatServerService, LiveThreatsPayload } from './services/threatServerService';
import { DataState } from './types/dataEnvelope';
import { runtimeConfig } from './config/runtime';

import { INITIAL_REGIONS, INITIAL_ALERTS_FEED } from './data/ukraineMapData';
import { INITIAL_TRAJECTORIES } from './data/spatialThreatData';
import { 
  RegionData, 
  AlertEvent, 
  ThreatType,
  UserSettings, 
  ThreatSceneModel,
  ThreatDataMode,
  DashboardSection 
} from './types';
import { 
  startSirenSound, 
  stopSirenSound, 
  playAllClearSound, 
  speakAlertNotification 
} from './utils/sirenAudio';

const AnalyticsSection = React.lazy(() => import('./components/AnalyticsSection').then((module) => ({ default: module.AnalyticsSection })));
const FinanceSection = React.lazy(() => import('./components/FinanceSection').then((module) => ({ default: module.FinanceSection })));
const PricingSection = React.lazy(() => import('./components/PricingSection').then((module) => ({ default: module.PricingSection })));
const ProfileSection = React.lazy(() => import('./components/ProfileSection').then((module) => ({ default: module.ProfileSection })));
const AffiliateProgram = React.lazy(() => import('./components/AffiliateProgram').then((module) => ({ default: module.AffiliateProgram })));
const RegionInspectorModal = React.lazy(() => import('./components/RegionInspectorModal').then((module) => ({ default: module.RegionInspectorModal })));
const SimulatorModal = React.lazy(() => import('./components/SimulatorModal').then((module) => ({ default: module.SimulatorModal })));
const EmergencyGuideModal = React.lazy(() => import('./components/EmergencyGuideModal').then((module) => ({ default: module.EmergencyGuideModal })));
const SheltersSection = React.lazy(() => import('./components/SheltersSection').then((module) => ({ default: module.SheltersSection })));
const OnboardingFlow = React.lazy(() => import('./components/OnboardingFlow').then((module) => ({ default: module.OnboardingFlow })));
const AboutSection = React.lazy(() => import('./components/AboutSection').then((module) => ({ default: module.AboutSection })));

const sectionByHash: Record<string, DashboardSection> = {
  home: 'HOME',
  network: 'NETWORK',
  finance: 'FINANCE',
  pricing: 'PRICING',
  analytics: 'ANALYTICS',
  shelters: 'SHELTERS',
  affiliate: 'AFFILIATE',
  profile: 'PROFILE',
  about: 'ABOUT',
};

const sectionFromLocation = (): DashboardSection => {
  if (typeof window === 'undefined') return 'HOME';
  const hash = window.location.hash.replace(/^#/, '').toLowerCase();
  return sectionByHash[hash] || 'HOME';
};

const clearRegionThreatState = (region: RegionData): RegionData => ({
  ...region,
  isAlarm: false,
  threatType: 'none',
  startedAt: null,
  durationMinutes: 0,
  threatDetails: undefined,
  activeRayons: undefined,
});

const offlineRegions = () => INITIAL_REGIONS.map(clearRegionThreatState);

export default function App() {
  // Navigation: HOME | NETWORK | FINANCE | PROFILE | ANALYTICS | AFFILIATE
  const [activeSection, setActiveSection] = useState<DashboardSection>(sectionFromLocation);

  const navigateToSection = (section: DashboardSection) => {
    setActiveSection(section);
    if (typeof window === 'undefined') return;
    const nextHash = `#${section.toLowerCase()}`;
    if (window.location.hash !== nextHash) {
      window.history.pushState({ section }, '', nextHash);
    }
  };

  useEffect(() => {
    const syncSectionFromLocation = () => setActiveSection(sectionFromLocation());
    window.addEventListener('popstate', syncSectionFromLocation);
    window.addEventListener('hashchange', syncSectionFromLocation);
    return () => {
      window.removeEventListener('popstate', syncSectionFromLocation);
      window.removeEventListener('hashchange', syncSectionFromLocation);
    };
  }, []);

  // Onboarding remains available in the codebase, but it must not block the
  // production landing surface on a fresh browser visit.
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleCompleteOnboarding = () => {
    try {
      localStorage.setItem('sirenua_onboarding_completed', 'true');
    } catch {
      // ignore
    }
    setShowOnboarding(false);
  };

  // Regions & Alert Data
  const [regions, setRegions] = useState<RegionData[]>(() => {
    if (runtimeConfig.isProduction) return offlineRegions();
    try {
      const saved = localStorage.getItem('sirenua_regions_state');
      return saved ? JSON.parse(saved) : INITIAL_REGIONS;
    } catch {
      return INITIAL_REGIONS;
    }
  });

  const [alerts, setAlerts] = useState<AlertEvent[]>(() => {
    if (runtimeConfig.isProduction) return [];
    try {
      const saved = localStorage.getItem('sirenua_alerts_state');
      return saved ? JSON.parse(saved) : INITIAL_ALERTS_FEED;
    } catch {
      return INITIAL_ALERTS_FEED;
    }
  });

  const [settings, setSettings] = useState<UserSettings>(() => {
    const defaultSettings: UserSettings = {
      myRegion: 'odesa',
      soundEnabled: true,
      volume: 0.75,
      voiceChime: true,
      vibrateOnMobile: true,
      theme: 'dark',
      showLabels: true,
      showThreatIcons: true,
      show3DDepth: true,
      showTrajectories: true,
      showRadarBeams: true,
      viewMode: '3D',
      autoRefreshInterval: 5,
    };
    try {
      const saved = localStorage.getItem('sirenua_user_settings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  // Active selections & Modals
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isSheltersModalOpen, setIsSheltersModalOpen] = useState(false);
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);
  const [bannerAlert, setBannerAlert] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [threatDataState, setThreatDataState] = useState<DataState>(runtimeConfig.apiBaseUrl ? 'LOADING' : 'NOT_CONNECTED');
  const [threatUpdatedAt, setThreatUpdatedAt] = useState('—');
  const [threatPayload, setThreatPayload] = useState<LiveThreatsPayload | null>(null);
  const [sceneTrajectories, setSceneTrajectories] = useState<typeof INITIAL_TRAJECTORIES>([]);
  const previousThreatStateRef = useRef<DataState>('LOADING');
  const [threatRefreshNonce, setThreatRefreshNonce] = useState(0);

  useEffect(() => {
    let mounted = true;

    const refreshThreatData = async () => {
      const response = await threatServerService.fetchLiveThreats(settings.myRegion);
      if (!mounted) return;

      const previousState = previousThreatStateRef.current;
      if ((previousState === 'NOT_CONNECTED' || previousState === 'STALE' || previousState === 'ERROR') && response.state === 'LIVE') {
        setBannerAlert('З’єднання відновлено. Оновлюємо дані…');
        window.setTimeout(() => setBannerAlert(null), 4000);
      }
      previousThreatStateRef.current = response.state;
      setThreatDataState(response.state);
      setThreatUpdatedAt(response.updatedAt || '—');
      if (response.data) {
        setThreatPayload(response.data);
        setRegions(response.data.regions);
        setAlerts(response.data.alerts);
        setSceneTrajectories(response.state === 'LIVE' || response.state === 'DEMO' ? response.data.trajectories : []);
      } else if (response.state !== 'LIVE' && !isDemoMode) {
        setSceneTrajectories([]);
      }
    };

    if (!isDemoMode) refreshThreatData();
    const refreshTimer = window.setInterval(() => {
      if (!isDemoMode) refreshThreatData();
    }, 30_000);

    return () => {
      mounted = false;
      window.clearInterval(refreshTimer);
    };
  }, [settings.myRegion, isDemoMode, threatRefreshNonce]);

  const handleRefreshThreatData = () => {
    if (isDemoMode) return;
    setThreatDataState('LOADING');
    setThreatRefreshNonce((current) => current + 1);
  };

  const handleExitDemo = () => {
    setIsDemoMode(false);
    setThreatDataState('LOADING');
    setThreatRefreshNonce((current) => current + 1);
  };

  // Sync to LocalStorage
  useEffect(() => {
    try {
      if (!runtimeConfig.isProduction) localStorage.setItem('sirenua_regions_state', JSON.stringify(regions));
    } catch {
      // ignore
    }
  }, [regions]);

  useEffect(() => {
    try {
      if (!runtimeConfig.isProduction) localStorage.setItem('sirenua_alerts_state', JSON.stringify(alerts));
    } catch {
      // ignore
    }
  }, [alerts]);

  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('sirenua_user_settings', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Siren Controls
  const handleToggleTestSiren = () => {
    if (isSirenPlaying) {
      stopSirenSound();
      setIsSirenPlaying(false);
    } else {
      startSirenSound(settings.volume);
      setIsSirenPlaying(true);
      if (settings.voiceChime) {
        speakAlertNotification('Увага! Повітряна тривога! Пройдіть в укриття!');
      }
    }
  };

  const handlePlayAllClear = () => {
    if (isSirenPlaying) {
      stopSirenSound();
      setIsSirenPlaying(false);
    }
    playAllClearSound(settings.volume);
    if (settings.voiceChime) {
      speakAlertNotification('Відбій повітряної тривоги!');
    }
    setBannerAlert('🟢 Відбій загрози. Звуковий сигнал відбою активовано.');
    setTimeout(() => setBannerAlert(null), 4000);
  };

  const handleToggleRegionAlarm = (regionId: string, threatType: ThreatType = 'air') => {
    if (!runtimeConfig.allowDemoData) return;
    setIsDemoMode(true);
    setThreatDataState('DEMO');
    setSceneTrajectories(INITIAL_TRAJECTORIES);
    setRegions((current) => current.map((region) => {
      if (region.id !== regionId) return region;
      const nextIsAlarm = !region.isAlarm;
      return {
        ...region,
        isAlarm: nextIsAlarm,
        threatType: nextIsAlarm ? threatType : 'none',
        startedAt: nextIsAlarm ? new Date().toISOString() : null,
        durationMinutes: 0,
      };
    }));
  };

  const handleApplyScenario = (
    scenario: 'massive_drone' | 'ballistic_all' | 'eastern_front' | 'all_clear' | 'central_ukraine'
  ) => {
    if (!runtimeConfig.allowDemoData) return;
    const droneRegions = new Set(['kyiv_obl', 'kyiv_city', 'chernihiv', 'sumy', 'poltava', 'cherkasy', 'odesa']);
    const easternRegions = new Set(['sumy', 'kharkiv', 'luhansk', 'donetsk', 'dnipro', 'zaporizhzhia', 'kherson']);
    const centralRegions = new Set(['kyiv_obl', 'kyiv_city', 'zhytomyr', 'vinnytsia', 'cherkasy', 'poltava', 'kirovohrad']);

    setIsDemoMode(true);
    setThreatDataState('DEMO');
    setSceneTrajectories(INITIAL_TRAJECTORIES);
    setRegions((current) => current.map((region) => {
      let isAlarm = false;
      let nextThreatType: ThreatType = 'none';

      if (scenario === 'ballistic_all') {
        isAlarm = true;
        nextThreatType = 'ballistic';
      } else if (scenario === 'massive_drone' && droneRegions.has(region.id)) {
        isAlarm = true;
        nextThreatType = 'drone';
      } else if (scenario === 'eastern_front' && easternRegions.has(region.id)) {
        isAlarm = true;
        nextThreatType = 'ballistic';
      } else if (scenario === 'central_ukraine' && centralRegions.has(region.id)) {
        isAlarm = true;
        nextThreatType = 'air';
      }

      return {
        ...region,
        isAlarm,
        threatType: nextThreatType,
        startedAt: isAlarm ? new Date().toISOString() : null,
        durationMinutes: 0,
      };
    }));

    const labels = {
      massive_drone: 'Масований сценарій БпЛА',
      ballistic_all: 'Масований балістичний сценарій',
      eastern_front: 'Сценарій східного та південного напрямку',
      all_clear: 'Демонстраційний повний відбій',
      central_ukraine: 'Демонстраційний сценарій центрального регіону',
    };
    setBannerAlert(`ДЕМО-РЕЖИМ: ${labels[scenario]}`);
    setTimeout(() => setBannerAlert(null), 4500);
  };

  const safeRegions = regions || offlineRegions();
  const hasUsableThreatScene = threatDataState === 'LIVE' || threatDataState === 'DEMO';
  const displayRegions = isDemoMode || hasUsableThreatScene
    ? safeRegions
    : safeRegions.map((region) => ({ ...region, isAlarm: false, threatType: 'none' as ThreatType, startedAt: null, durationMinutes: 0 }));
  const myRegionObj = displayRegions.find((r) => r.id === settings.myRegion) || {
    id: 'odesa',
    name: 'Одеська область',
    isAlarm: false,
    threatType: 'none' as ThreatType,
  };

  const activeAlarmsCount = displayRegions.filter((r) => r.isAlarm).length;
  const currentTimestamp = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  const currentDataMode: ThreatDataMode = isDemoMode
    ? 'DEMO_DATA'
    : threatDataState === 'LIVE'
      ? 'LIVE'
      : threatDataState === 'DEMO'
        ? 'DEMO_DATA'
        : threatDataState === 'CACHED'
          ? 'CACHED'
          : threatDataState === 'STALE'
            ? 'STALE'
            : threatDataState === 'ERROR'
              ? 'ERROR'
              : 'NOT_CONNECTED';
  // Once the local simulator is active, its region/trajectory state is the
  // source for the current demo scene. Do not leak a previous API snapshot
  // into the scenario's ETA, risk or primary event.
  const liveScene = !isDemoMode && (currentDataMode === 'LIVE' || currentDataMode === 'DEMO_DATA')
    ? threatPayload?.threatScene
    : null;
  const primaryThreat = liveScene?.primaryThreat || (isDemoMode ? sceneTrajectories[0] || null : null);
  const currentFreshness: ThreatSceneModel['freshness'] = currentDataMode === 'LIVE'
    ? 'REALTIME'
    : currentDataMode === 'DEMO_DATA' || currentDataMode === 'CACHED'
      ? 'STABLE'
      : currentDataMode === 'STALE'
        ? 'STALE'
        : 'DEGRADED';
  const sceneTimestamp = currentDataMode === 'LIVE' || currentDataMode === 'DEMO_DATA' || currentDataMode === 'CACHED' || currentDataMode === 'STALE'
    ? (threatUpdatedAt === '—' ? currentTimestamp : threatUpdatedAt)
    : '—';

  const threatSceneModel: ThreatSceneModel = {
    timestamp: sceneTimestamp,
    freshness: currentFreshness,
    dataMode: currentDataMode,
    activeAlarmsCount,
    criticalRegions: displayRegions.filter((r) => r.isAlarm && (r.threatType === 'ballistic' || r.threatType === 'missile')).map((r) => r.id),
    // Do not expose cached/offline trajectory records as current scene data.
    // A non-live scene is intentionally rendered as a truthful preview only.
    primaryThreat,
    nearestShelter: liveScene?.nearestShelter || null,
    myRegionStatus: {
      id: settings.myRegion,
      name: myRegionObj.name || 'Одеська область',
      isAlarm: myRegionObj.isAlarm || false,
      etaMinutes: liveScene?.myRegionStatus.etaMinutes || (myRegionObj.isAlarm && (isDemoMode || currentDataMode === 'DEMO_DATA') ? primaryThreat?.etaMinutes || 18 : 0),
      riskLevel: liveScene?.myRegionStatus.riskLevel || (myRegionObj.isAlarm ? 'HIGH' : 'LOW'),
    },
    partnerModeActive: activeSection === 'NETWORK' || activeSection === 'FINANCE',
  };

  return (
    <div
      data-active-section={activeSection}
      className={`siren-app ${settings.theme === 'dark' ? 'siren-app--dark' : 'siren-app--light'} min-h-screen flex flex-col font-sans transition-colors duration-300 ${
      settings.theme === 'dark' ? 'bg-[#0E1520] text-slate-100' : 'bg-[#EAEFF5] text-[#111827]'
      }`}
    >
      
      {/* 1. Header with Navigation */}
      <Header
        activeSection={activeSection}
        onOpenFeatures={() => {
          navigateToSection('HOME');
          window.setTimeout(() => {
            document.getElementById('home-features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 0);
        }}
        onSelectSection={(sec) => {
          navigateToSection(sec);
          try {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } catch {
            // Some embedded/headless runtimes do not implement smooth scroll.
            // Section navigation must remain functional without it.
          }
        }}
        onOpenGuide={() => setIsGuideOpen(true)}
        onToggleTheme={() => {
          const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
          handleUpdateSettings({ theme: nextTheme });
        }}
        theme={settings.theme || 'light'}
        dataMode={threatSceneModel.dataMode}
      />

      {/* 2. Critical Alert Banner if Active */}
      {bannerAlert && (
        <div role="status" aria-live="polite" className="bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 text-white px-4 py-2 shadow-md text-center text-xs sm:text-sm font-bold flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300 z-40">
          <span>{bannerAlert}</span>
          <button
            onClick={() => setBannerAlert(null)}
            className="ml-3 px-2 py-0.5 rounded bg-black/20 hover:bg-black/40 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. Main Container */}
      <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 flex-1 flex flex-col gap-2">
        
        <main className="flex-1 min-w-0 pb-12 w-full">
          <AppErrorBoundary theme={settings.theme || 'light'}>
            <Suspense fallback={(
              <div className="min-h-[280px] rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white/40 dark:bg-slate-950/30 flex items-center justify-center">
                <span className="text-xs font-semibold text-slate-500">Завантаження розділу…</span>
              </div>
            )}>
          {/* =========================================================================
              SECTION 1: HOME (Головна) - 1:1 Premium Design as in Mockup
             ========================================================================= */}
          {activeSection === 'HOME' && (
            <div className="space-y-2 animate-in fade-in duration-200">
              
              {/* Row 1: Hero Section with 3D Map of Ukraine & Floating Threat Info */}
              <HeroSection
                regions={displayRegions}
                trajectories={sceneTrajectories}
                selectedRegion={selectedRegion}
                onSelectRegion={(reg) => setSelectedRegion(reg)}
                threatModel={threatSceneModel}
                onRefreshData={handleRefreshThreatData}
                onNavigateToShelters={() => setIsSheltersModalOpen(true)}
                onOpenDemo={runtimeConfig.allowDemoData ? () => setIsSimulatorOpen(true) : undefined}
                theme={settings.theme || 'light'}
              />

              {/* Row 2: 4 Feature Navigation Cards (Мережа, Фінанси, Аналітика, Партнерська програма) */}
              <HomeFeaturesGrid
                onNavigateToTab={(tab) => navigateToSection(tab)}
                theme={settings.theme || 'light'}
              />

              {/* Row 3: Financial Information Block (Фінансова інформація) */}
              <HomeFinanceSituationRow
                onNavigateToFinance={() => navigateToSection('FINANCE')}
                onNavigateToNetwork={() => navigateToSection('NETWORK')}
                theme={settings.theme || 'light'}
              />

              {/* Row 4: SIREN UA на всіх пристроях (3D Device Ecosystem) */}
              <SirenOrbitalDeviceEcosystem
                threatModel={threatSceneModel}
                theme={settings.theme || 'light'}
              />
              
            </div>
          )}

          {/* =========================================================================
              SECTION 2: NETWORK (Мережа)
             ========================================================================= */}
          {activeSection === 'NETWORK' && (
            <div className="animate-in fade-in duration-200">
              <AffiliateProgram
                onOpenMap={() => navigateToSection('HOME')}
                onOpenSimulator={() => setIsSimulatorOpen(true)}
                view="NETWORK"
                initialTab="TREE"
                theme={settings.theme || 'light'}
              />
            </div>
          )}

          {/* =========================================================================
              SECTION 3: FINANCE (Фінанси)
             ========================================================================= */}
          {activeSection === 'FINANCE' && (
            <div className="animate-in fade-in duration-200">
              <FinanceSection
                onOpenNetwork={() => navigateToSection('NETWORK')}
                theme={settings.theme || 'light'}
              />
            </div>
          )}

          {/* SECTION 3b: PRICING (public Premium offer) */}
          {activeSection === 'PRICING' && (
            <PricingSection
              theme={settings.theme || 'light'}
              onStartOnboarding={() => setShowOnboarding(true)}
              onOpenHome={() => navigateToSection('HOME')}
            />
          )}

          {/* =========================================================================
              SECTION 4: PROFILE (Профіль)
             ========================================================================= */}
          {activeSection === 'PROFILE' && (
            <div className="animate-in fade-in duration-200">
              <ProfileSection theme={settings.theme || 'light'} />
            </div>
          )}

          {/* =========================================================================
              SECTION 5: ANALYTICS (Аналітика)
             ========================================================================= */}
          {activeSection === 'ANALYTICS' && (
            <AnalyticsSection theme={settings.theme || 'light'} />
          )}

          {/* SECTION 5b: SHELTERS (Укриття) */}
          {activeSection === 'SHELTERS' && (
            <div className="animate-in fade-in duration-200">
              <SheltersSection
                myRegionId={settings.myRegion}
                regions={displayRegions}
                dataState={currentDataMode === 'DEMO_DATA' ? 'DEMO' : currentDataMode}
                theme={settings.theme === 'dark' ? 'dark' : 'light'}
              />
            </div>
          )}

          {/* =========================================================================
              SECTION 6: AFFILIATE (Партнерська програма)
             ========================================================================= */}
          {activeSection === 'AFFILIATE' && (
            <div className="animate-in fade-in duration-200">
              <AffiliateProgram
                onOpenMap={() => navigateToSection('HOME')}
                onOpenSimulator={() => setIsSimulatorOpen(true)}
                view="PROGRAM"
                initialTab="ANALYTICS"
                theme={settings.theme || 'light'}
              />
            </div>
          )}

          {activeSection === 'ABOUT' && (
            <div className="animate-in fade-in duration-200">
              <AboutSection
                theme={settings.theme || 'light'}
                onOpenMap={() => navigateToSection('HOME')}
                onOpenGuide={() => setIsGuideOpen(true)}
              />
            </div>
          )}
            </Suspense>
          </AppErrorBoundary>
        </main>
      </div>

      {/* 4. Footer */}
      <Footer theme={settings.theme || 'light'} />

      {/* =========================================================================
          MODALS
         ========================================================================= */}
      
      {/* Shelters Modal */}
      <Suspense fallback={null}>
      {isSheltersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-4 sm:p-6 ${
            settings.theme === 'dark'
              ? 'bg-[#0B171F] border border-[#2D4A55]'
              : 'bg-white border border-slate-200'
          }`}>
            <div className={`flex items-center justify-between pb-3 mb-4 border-b ${settings.theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <h3 className={`text-lg font-bold ${settings.theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>Карта укриттів та безпечні маршрути</h3>
              </div>
              <button
                onClick={() => setIsSheltersModalOpen(false)}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer ${settings.theme === 'dark' ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'}`}
              >
                ✕
              </button>
            </div>
            <SheltersSection
              myRegionId={settings.myRegion}
              regions={displayRegions}
              dataState={currentDataMode === 'DEMO_DATA' ? 'DEMO' : currentDataMode}
              theme={settings.theme === 'dark' ? 'dark' : 'light'}
            />
          </div>
        </div>
      )}

      {/* Emergency Guide Modal */}
      <EmergencyGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Simulator Modal */}
      <SimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        regions={safeRegions}
        onApplyScenario={handleApplyScenario}
        onToggleRegionAlarm={handleToggleRegionAlarm}
        onExitDemo={handleExitDemo}
        onPlayAllClear={handlePlayAllClear}
      />

      {/* Region Inspector Modal */}
      {selectedRegion && (
        <RegionInspectorModal
          region={selectedRegion}
          onClose={() => setSelectedRegion(null)}
          isMyRegion={selectedRegion.id === settings.myRegion}
          onSetMyRegion={(regionId) => handleUpdateSettings({ myRegion: regionId })}
          onTestSiren={handleToggleTestSiren}
          isSirenPlaying={isSirenPlaying}
          dataMode={currentDataMode}
        />
      )}

      {/* Onboarding Flow */}
      {showOnboarding && (
        <OnboardingFlow 
          onComplete={handleCompleteOnboarding}
          theme={settings.theme || 'light'}
        />
      )}
      </Suspense>

    </div>
  );
}
