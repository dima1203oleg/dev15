import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { AlertTicker } from './components/AlertTicker';
import { HeroSection } from './components/HeroSection';
import { ThreatMapSection } from './components/ThreatMapSection';
import { FeaturesSection } from './components/FeaturesSection';
import { PartnerLandingSection } from './components/PartnerLandingSection';
import { DownloadSection } from './components/DownloadSection';
import { PartnerDashboardModal } from './components/PartnerDashboardModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { Footer } from './components/Footer';
import { ThreatEvent, RegionAlert, Shelter } from './types';
import { DEFAULT_REGIONS, DEFAULT_THREATS, DEFAULT_SHELTERS } from './data/mockData';

export default function App() {
  const [activeSection, setActiveSection] = useState<string>('home');
  const [isPartnerCabinetOpen, setIsPartnerCabinetOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  
  // Real-time threat & environment state initialized with authentic default situational data
  const [threats, setThreats] = useState<ThreatEvent[]>(DEFAULT_THREATS);
  const [regions, setRegions] = useState<RegionAlert[]>(DEFAULT_REGIONS);
  const [shelters, setShelters] = useState<Shelter[]>(DEFAULT_SHELTERS);
  const [isThreatServerOnline, setIsThreatServerOnline] = useState<boolean>(true);
  const [currentRole, setCurrentRole] = useState<string>('PARTNER');
  const [currentRank, setCurrentRank] = useState<string>('GOLD');

  // Fetch threat feed on mount and on periodic sync
  const fetchThreatData = async () => {
    try {
      const [statusRes, threatsRes, regionsRes, sheltersRes] = await Promise.all([
        fetch('/api/threats/status').then(r => r.json()).catch(() => ({ connected: false })),
        fetch('/api/threats/live').then(r => r.json()).catch(() => ({ threats: [] })),
        fetch('/api/threats/regions').then(r => r.json()).catch(() => ({ regions: [] })),
        fetch('/api/threats/shelters').then(r => r.json()).catch(() => ({ shelters: [] }))
      ]);

      setIsThreatServerOnline(statusRes.connected !== false);
      if (threatsRes.threats) setThreats(threatsRes.threats);
      if (regionsRes.regions) setRegions(regionsRes.regions);
      if (sheltersRes.shelters) setShelters(sheltersRes.shelters);
    } catch (err) {
      console.error('Error fetching situational data:', err);
    }
  };

  useEffect(() => {
    fetchThreatData();
    const interval = setInterval(fetchThreatData, 12000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F17] text-slate-100 selection:bg-rose-500/30 selection:text-rose-200">
      
      {/* 1. Header Navigation */}
      <Header
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onOpenPartnerCabinet={() => setIsPartnerCabinetOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        threats={threats}
        isThreatServerOnline={isThreatServerOnline}
        currentRole={currentRole}
        onSwitchRole={handleSwitchRole}
      />

      {/* 2. Official Alert Safety Ticker */}
      <AlertTicker
        threats={threats}
        isThreatServerOnline={isThreatServerOnline}
      />

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
        />

        {/* Interactive Threat Map & 7-Step Simulator */}
        <ThreatMapSection
          threats={threats}
          regions={regions}
          shelters={shelters}
          isThreatServerOnline={isThreatServerOnline}
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
