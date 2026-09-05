import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { AlertTicker } from './components/AlertTicker';
import { HeroSection } from './components/HeroSection';
import { MobileModeShell } from './components/MobileExperience';
import { TabletModeShell } from './components/TabletExperience';
import { ThreatMapSection } from './components/ThreatMapSection';
import { FeaturesSection } from './components/FeaturesSection';
import { PartnerLandingSection } from './components/PartnerLandingSection';
import { DownloadSection } from './components/DownloadSection';
import { PartnerDashboardModal } from './components/PartnerDashboardModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { Footer } from './components/Footer';
import { ThreatEvent, RegionAlert, Shelter } from './types';
import { createSpatialModel, isValidThreatPayload } from './data/spatialModel';

type ThreatDataMode = 'LIVE' | 'DEMO_DATA' | 'NOT_CONNECTED';

const DesktopModeShell = React.lazy(() => import('./components/DeviceExperienceLab').then(({ DesktopModeShell: component }) => ({ default: component })));
const TVModeShell = React.lazy(() => import('./components/DeviceExperienceLab').then(({ TVModeShell: component }) => ({ default: component })));

const SpatialRouteLoading: React.FC = () => (
  <main className="min-h-screen bg-[#040812] px-6 py-10 text-slate-100" aria-busy="true" aria-label="SIREN UA spatial experience">
    <div className="mx-auto max-w-3xl rounded-3xl border border-cyan-300/20 bg-slate-950/70 p-8">
      <p className="text-xs font-mono tracking-[0.18em] text-cyan-200">SIREN UA · SPATIAL CORE</p>
      <p className="mt-3 text-lg font-bold text-white">Завантажуємо просторову систему…</p>
    </div>
  </main>
);

export default function App() {
  const [activeSection, setActiveSection] = useState<string>('home');
  const [isPartnerCabinetOpen, setIsPartnerCabinetOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  
  // Never render bundled data as live data. The API decides whether this is a
  // demo feed or an authoritative integration; production starts empty.
  const [threats, setThreats] = useState<ThreatEvent[]>([]);
  const [regions, setRegions] = useState<RegionAlert[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [isThreatServerOnline, setIsThreatServerOnline] = useState<boolean>(false);
  const [threatDataMode, setThreatDataMode] = useState<ThreatDataMode>('NOT_CONNECTED');
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<string>('USER');
  const [currentRank, setCurrentRank] = useState<string>('—');
  const threatSyncRequestRef = useRef(0);
  const activeThreatRequestRef = useRef<AbortController | null>(null);

  const clearThreatState = () => {
    setIsThreatServerOnline(false);
    setThreatDataMode('NOT_CONNECTED');
    setLastSyncAt(null);
    setThreats([]);
    setRegions([]);
    setShelters([]);
  };

  const readJson = async (url: string, signal: AbortSignal): Promise<{ response: Response; body: unknown }> => {
    const response = await fetch(url, { signal });
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) throw new Error(`NON_JSON_RESPONSE:${url}`);
    const body = await response.json();
    return { response, body };
  };

  // Fetch threat feed on mount and on periodic sync
  const fetchThreatData = async () => {
    const requestId = ++threatSyncRequestRef.current;
    activeThreatRequestRef.current?.abort();
    const controller = new AbortController();
    activeThreatRequestRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 8_000);
    const isCurrentRequest = () => threatSyncRequestRef.current === requestId;
    try {
      const statusResult = await readJson('/api/threats/status', controller.signal);
      const statusRes = statusResult.body as { connected?: unknown; mode?: unknown; lastSyncAt?: unknown };

      // A disconnected status is a valid, explicit boundary. Do not request
      // or retain any cached-looking payloads after it is reported.
      if (statusResult.response.status !== 200 || statusRes.connected !== true || (statusRes.mode !== 'LIVE' && statusRes.mode !== 'DEMO_DATA')) {
        if (isCurrentRequest()) clearThreatState();
        return;
      }

      const [threatsResult, regionsResult, sheltersResult] = await Promise.all([
        readJson('/api/threats/live', controller.signal),
        readJson('/api/threats/regions', controller.signal),
        readJson('/api/threats/shelters', controller.signal)
      ]);
      if (!threatsResult.response.ok || !regionsResult.response.ok || !sheltersResult.response.ok) {
        throw new Error('INCOMPLETE_THREAT_PAYLOAD');
      }

      const combinedPayload = {
        threats: (threatsResult.body as { threats?: unknown }).threats,
        regions: (regionsResult.body as { regions?: unknown }).regions,
        shelters: (sheltersResult.body as { shelters?: unknown }).shelters
      };
      if (!isValidThreatPayload(combinedPayload) || !isCurrentRequest()) {
        throw new Error('INVALID_THREAT_PAYLOAD');
      }

      setIsThreatServerOnline(true);
      setThreatDataMode(statusRes.mode);
      setLastSyncAt(typeof statusRes.lastSyncAt === 'string' ? statusRes.lastSyncAt : null);
      setThreats(combinedPayload.threats);
      setRegions(combinedPayload.regions);
      setShelters(combinedPayload.shelters);
    } catch (err) {
      // Never leave the previous feed rendered as if it were still current.
      if (isCurrentRequest()) {
        clearThreatState();
        if (!(err instanceof DOMException && err.name === 'AbortError')) console.error('Error fetching situational data:', err);
      }
    } finally {
      window.clearTimeout(timeoutId);
      if (isCurrentRequest()) activeThreatRequestRef.current = null;
    }
  };

  useEffect(() => {
    fetchThreatData();
    const interval = setInterval(fetchThreatData, 12000);
    return () => {
      clearInterval(interval);
      threatSyncRequestRef.current += 1;
      activeThreatRequestRef.current?.abort();
      activeThreatRequestRef.current = null;
    };
  }, []);

  const spatialModel = useMemo(() => createSpatialModel({
    dataMode: threatDataMode,
    threats,
    regions,
    shelters,
    lastUpdated: lastSyncAt
  }), [threatDataMode, threats, regions, shelters, lastSyncAt]);

  // Sandbox simulation: Add 1 paid subscriber to demo partner
  const handleSimulateNewSubscriber = async () => {
    try {
      const res = await fetch('/api/admin/sandbox/create-paid-user', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 }
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Switch demo role
  const handleSwitchRole = async (role: string, rank?: string) => {
    try {
      const response = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, rank })
      });
      if (!response.ok) return;
      setCurrentRole(role);
      if (rank) setCurrentRank(rank);
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle threat server online/offline
  const handleToggleThreatServer = async () => {
    try {
      const res = await fetch('/api/admin/toggle-threat-server', { method: 'POST' });
      const data = await res.json();
      setIsThreatServerOnline(data.connected);
      fetchThreatData();
    } catch (e) {
      console.error(e);
    }
  };

  if (window.location.pathname === '/tv') {
    return <React.Suspense fallback={<SpatialRouteLoading />}><TVModeShell model={spatialModel} /></React.Suspense>;
  }

  if (window.location.pathname === '/desktop') {
    return <React.Suspense fallback={<SpatialRouteLoading />}><DesktopModeShell model={spatialModel} /></React.Suspense>;
  }

  if (window.location.pathname === '/mobile') {
    return <MobileModeShell model={spatialModel} />;
  }

  if (window.location.pathname === '/tablet') {
    return <TabletModeShell model={spatialModel} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F17] text-slate-100 selection:bg-rose-500/30 selection:text-rose-200">
      
      {/* 1. Header Navigation */}
      <div className="mobile-global-chrome">
        <Header
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onOpenPartnerCabinet={() => setIsPartnerCabinetOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
          threats={threats}
          isThreatServerOnline={isThreatServerOnline}
          threatDataMode={threatDataMode}
          currentRole={currentRole}
          onSwitchRole={handleSwitchRole}
        />
      </div>

      {/* 2. Official Alert Safety Ticker */}
      <div className="mobile-global-alert">
        <AlertTicker
          threats={threats}
          isThreatServerOnline={isThreatServerOnline}
          threatDataMode={threatDataMode}
          lastSyncAt={lastSyncAt}
        />
      </div>

      {/* 3. Main Sections Layout */}
      <main className="flex-1">
        
        {/* Hero Section */}
        <HeroSection
          onNavigateToMap={() => {
            setActiveSection('map');
            const el = document.getElementById('map-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          onNavigateToFeatures={() => {
            setActiveSection('features');
            const el = document.getElementById('features-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          onNavigateToPartner={() => {
            setActiveSection('partner');
            const el = document.getElementById('partner-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          onNavigateToDownload={() => {
            setActiveSection('download');
            const el = document.getElementById('download-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          model={spatialModel}
        />

        {/* Interactive Threat Map & 7-Step Simulator */}
        <ThreatMapSection
          threats={threats}
          regions={regions}
          shelters={shelters}
          isThreatServerOnline={isThreatServerOnline}
          threatDataMode={threatDataMode}
        />

        {/* Feature Pillars: Yellow/Red Differentiated Model & Technology */}
        <FeaturesSection />

        {/* 2-Level Partner Revenue Platform (5–25%) & Calculator */}
        <PartnerLandingSection
          onOpenCabinet={() => setIsPartnerCabinetOpen(true)}
        />

        {/* App Download Channels & Deep Links */}
        <DownloadSection />

      </main>

      {/* 4. Footer */}
      <Footer />

      {/* 5. Partner Cabinet Modal */}
      <PartnerDashboardModal
        isOpen={isPartnerCabinetOpen}
        onClose={() => setIsPartnerCabinetOpen(false)}
        onSimulateNewSubscriber={handleSimulateNewSubscriber}
      />

      {/* 6. Admin Control Center Modal */}
      <AdminDashboardModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onToggleThreatServer={handleToggleThreatServer}
        isThreatServerOnline={isThreatServerOnline}
        onSimulateNewSubscriber={handleSimulateNewSubscriber}
        currentRole={currentRole}
        onSwitchRole={handleSwitchRole}
      />

    </div>
  );
}
