import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/nearestShelter=\{threatSceneModel\.nearestShelter\}\s*\)\}/g,
  "nearestShelter={threatSceneModel.nearestShelter}\n        />\n      )}");

fs.writeFileSync('src/App.tsx', code);
