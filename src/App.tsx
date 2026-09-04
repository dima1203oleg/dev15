import React, { useState, useEffect, useMemo } from 'react';
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
import { createSpatialModel } from './data/spatialModel';

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

  // Fetch threat feed on mount and on periodic sync
  const fetchThreatData = async () => {
    try {
      const [statusRes, threatsRes, regionsRes, sheltersRes] = await Promise.all([
        fetch('/api/threats/status').then(r => r.json()).catch(() => ({ connected: false })),
        fetch('/api/threats/live').then(r => r.json()).catch(() => ({ threats: [] })),
        fetch('/api/threats/regions').then(r => r.json()).catch(() => ({ regions: [] })),
        fetch('/api/threats/shelters').then(r => r.json()).catch(() => ({ shelters: [] }))
      ]);

      setIsThreatServerOnline(statusRes.connected === true);
      setThreatDataMode(statusRes.mode ?? (statusRes.connected ? 'LIVE' : 'NOT_CONNECTED'));
      setLastSyncAt(statusRes.lastSyncAt ?? null);
      setThreats(Array.isArray(threatsRes.threats) ? threatsRes.threats : []);
      setRegions(Array.isArray(regionsRes.regions) ? regionsRes.regions : []);
      setShelters(Array.isArray(sheltersRes.shelters) ? sheltersRes.shelters : []);
    } catch (err) {
      console.error('Error fetching situational data:', err);
    }
  };

  useEffect(() => {
    fetchThreatData();
    const interval = setInterval(fetchThreatData, 12000);
    return () => clearInterval(interval);
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
      await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, rank })
      });
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
          threats={threats}
          threatDataMode={threatDataMode}
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
