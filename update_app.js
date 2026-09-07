const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace DashboardSection type usage if any
// Add HomeFeaturesGrid import
code = code.replace(
  "import { HomeFinanceSituationRow } from './components/HomeFinanceSituationRow';",
  "import { HomeFeaturesGrid } from './components/HomeFeaturesGrid';"
);

// Remove SmartMetricRail import
code = code.replace("import { SmartMetricRail } from './components/SmartMetricRail';\n", "");

// Replace the HOME section
const homeStart = code.indexOf("{/* Row 1: Top Hero Section");
const nextSection = code.indexOf("{/* =========================================================================");

if (homeStart !== -1 && nextSection !== -1) {
  // Find the exact end of the HOME section (just before the next section)
  // Let's replace the content between homeStart and the end of the HOME block.
  
  const oldHomeBlock = code.substring(code.lastIndexOf("{activeSection === 'HOME' && ("), nextSection);
  
  const newHomeBlock = `{activeSection === 'HOME' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Row 1: Top Hero Section with 3D Map of Ukraine */}
              <HeroSection
                regions={safeRegions}
                selectedRegionId={selectedRegion?.id}
                onSelectRegion={(reg) => setSelectedRegion(reg)}
                onOpenMap={() => setSelectedRegion(safeRegions.find(r => r.id === 'kyiv_obl') || null)}
                onOpenGuide={() => setIsGuideOpen(true)}
                onOpenThreats={() => setIsSimulatorOpen(true)}
                activeThreatsCount={3}
                theme={settings.theme || 'light'}
              />

              {/* Row 2: 4 Quick Premium Cards */}
              <HomeFeaturesGrid 
                onNavigateToTab={(tab) => setActiveSection(tab)}
                theme={settings.theme || 'light'}
              />

              {/* Row 3: SIREN UA на всіх твоїх пристроях (3D Device Ecosystem) */}
              <SirenOrbitalDeviceEcosystem
                threatModel={threatSceneModel}
                onNavigateToTab={(tab) => setActiveSection(tab as DashboardSection)}
                isCriticalAlert={myRegionObj.isAlarm}
                theme={settings.theme || 'light'}
              />
              
            </div>
          )}

          `;
  
  code = code.replace(oldHomeBlock, newHomeBlock);
}

fs.writeFileSync('src/App.tsx', code);
