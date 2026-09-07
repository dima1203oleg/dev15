import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/onClose=\{\(\) => setIsGuideOpen\(false\)\}\s*\{\/\* Simulator Modal \*\/\}/g, 
  "onClose={() => setIsGuideOpen(false)}\n      />\n      {/* Simulator Modal */}");

code = code.replace(/onPlayAllClear=\{handlePlayAllClear\}\s*\{\/\* Region Inspector Modal \*\/\}/g, 
  "onPlayAllClear={handlePlayAllClear}\n      />\n      {/* Region Inspector Modal */}");

code = code.replace(/setIsSheltersModalOpen\(true\);\s*\}\}\s*\)\}/g,
  "setIsSheltersModalOpen(true);\n          }}\n        />\n      )}");

fs.writeFileSync('src/App.tsx', code);
