# Remove SmartMetricRail
sed -i '/<SmartMetricRail/d' src/App.tsx
sed -i '/alerts={alerts}/d' src/App.tsx
sed -i '/lastUpdatedTime=/d' src/App.tsx
sed -i '/theme={settings.theme}/d' src/App.tsx

# Replace HomeFinanceSituationRow with HomeFeaturesGrid
sed -i 's/<HomeFinanceSituationRow/<HomeFeaturesGrid/g' src/App.tsx
sed -i 's/import { HomeFinanceSituationRow } from .\.\/components\/HomeFinanceSituationRow.;/import { HomeFeaturesGrid } from ".\/components\/HomeFeaturesGrid";/g' src/App.tsx
sed -i '/import { SmartMetricRail }/d' src/App.tsx
