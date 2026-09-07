import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /            <SheltersSection\n              myRegionId=\{settings\.myRegion\}\n              onClose=\{\(\) => setIsSheltersModalOpen\(false\)\}\n          <\/div>/g,
  `            <SheltersSection
              myRegionId={settings.myRegion}
              onClose={() => setIsSheltersModalOpen(false)}
            />
          </div>`
);

code = code.replace(
  /      <EmergencyGuideModal\n        isOpen=\{isGuideOpen\}\n        onClose=\{\(\) => setIsGuideOpen\(false\)\}\n      \{\/\* Simulator Modal \*\/\}/g,
  `      <EmergencyGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
      {/* Simulator Modal */}`
);

code = code.replace(
  /      <SimulatorModal\n        isOpen=\{isSimulatorOpen\}\n        onClose=\{\(\) => setIsSimulatorOpen\(false\)\}\n        regions=\{safeRegions\}\n        onApplyScenario=\{\(\) => \{\}\}\n        onToggleRegionAlarm=\{\(\) => \{\}\}\n        onPlayAllClear=\{handlePlayAllClear\}\n      \{\/\* Region Inspector Modal \*\/\}/g,
  `      <SimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        regions={safeRegions}
        onApplyScenario={() => {}}
        onToggleRegionAlarm={() => {}}
        onPlayAllClear={handlePlayAllClear}
      />
      {/* Region Inspector Modal */}`
);

code = code.replace(
  /          onNavigateToShelters=\{\(\) => \{\n            setSelectedRegion\(null\);\n            setIsSheltersModalOpen\(true\);\n          \}\}\n        \n      \)\}/g,
  `          onNavigateToShelters={() => {
            setSelectedRegion(null);
            setIsSheltersModalOpen(true);
          }}
        />
      )}`
);

code = code.replace(
  /      <OnboardingFlow \n        onComplete=\{handleCompleteOnboarding\} \n    <\/div>/g,
  `      <OnboardingFlow 
        onComplete={handleCompleteOnboarding} 
      />
    </div>`
);

code = code.replace(
  /      \{\/\* 4\. Footer \*\/\}\n      \n      \{\/\* =========================================================================/g,
  `      {/* 4. Footer */}
      <Footer />
      {/* =========================================================================`
);

fs.writeFileSync('src/App.tsx', code);
