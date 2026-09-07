import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /        onToggleTheme=\{\(\) => \{\n          const nextTheme = settings\.theme === 'dark' \? 'light' : 'dark';\n          handleUpdateSettings\(\{ theme: nextTheme \}\);\n        \}\}/,
  `        onToggleTheme={() => {
          const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
          handleUpdateSettings({ theme: nextTheme });
        }}
      />`
);

code = code.replace("        regions={safeRegions}\n", ""); 

fs.writeFileSync('src/App.tsx', code);
