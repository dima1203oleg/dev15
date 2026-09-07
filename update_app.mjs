import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Fix imports
code = code.replace("import { SmartMetricRail } from './components/SmartMetricRail';\n", "");

const homeStart = code.indexOf("{activeSection === 'HOME' && (");
const nextSection = code.indexOf("{/* =========================================================================");

if (homeStart !== -1 && nextSection !== -1) {
  const oldHomeBlock = code.substring(homeStart, nextSection);
  
  const newHomeBlock = `{activeSection === 'HOME' && (
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
          )}

          `;
  
  code = code.replace(oldHomeBlock, newHomeBlock);
}

fs.writeFileSync('src/App.tsx', code);
