import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// The file currently has TWO `activeSection === 'HOME'` blocks.
// Let's remove them both and insert a clean one.

const section2Start = code.indexOf("{/* =========================================================================" + "\n" + "              SECTION 2");

const mainContentStart = code.indexOf("<main className=\"flex-1 min-w-0 pb-12 w-full\">") + "<main className=\"flex-1 min-w-0 pb-12 w-full\">".length;

if (section2Start !== -1 && mainContentStart !== -1) {
  const newHomeBlock = `\n                    {/* =========================================================================
              SECTION 1: HOME (Головна) - Premium clean design
             ========================================================================= */}
          {activeSection === 'HOME' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Row 1: Top Hero Section with 3D Map of Ukraine */}
              <HeroSection
                regions={safeRegions}
                selectedRegion={selectedRegion}
                onSelectRegion={(reg) => setSelectedRegion(reg)}
                threatModel={threatSceneModel}
                theme={settings.theme || 'light'}
              />

              {/* Row 2: 4 Quick Premium Cards */}
              <HomeFeaturesGrid 
                onNavigateToTab={(tab) => setActiveSection(tab)}
                theme={settings.theme || 'light'}
              />

              {/* Row 3: SIREN UA на всіх твоїх пристроях (3D Device Ecosystem) */}
              <SirenOrbitalDeviceEcosystem
                theme={settings.theme || 'light'}
              />
              
            </div>
          )}\n\n          `;
          
  code = code.substring(0, mainContentStart) + newHomeBlock + code.substring(section2Start);
  fs.writeFileSync('src/App.tsx', code);
} else {
  console.log("Could not find boundaries");
}
