import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/onComplete=\{handleCompleteOnboarding\} \n      \)\}/g,
  "onComplete={handleCompleteOnboarding}\n        />\n      )}");

fs.writeFileSync('src/App.tsx', code);
