sed -i '/Row 2: 4 Quick Smart Metric Cards/d' src/App.tsx
sed -i '/threatModel={threatSceneModel}/d' src/App.tsx
sed -i '/myRegionName={myRegionObj.name/d' src/App.tsx
sed -i '/isAlarm={myRegionObj.isAlarm/d' src/App.tsx
sed -i '/activeEventsCount={3}/d' src/App.tsx
sed -i '/lastUpdatedTime="Сьогодні, 22:14"/d' src/App.tsx
sed -i '/onSelectRegion={() => setSelectedRegion/d' src/App.tsx
sed -i '/onOpenStatus={() => handleToggleTestSiren()}/d' src/App.tsx
sed -i '/onOpenEvents={() => setIsSimulatorOpen(true)}/d' src/App.tsx
sed -i '/theme={settings.theme || .light.}/d' src/App.tsx
sed -i '/\/>/d' src/App.tsx
