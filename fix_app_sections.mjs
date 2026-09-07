import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const newSections = `          {/* =========================================================================
              SECTION 5: ANALYTICS (Аналітика)
             ========================================================================= */}
          {activeSection === 'ANALYTICS' && (
            <div className="animate-in fade-in duration-200 p-8 text-center text-slate-500">
              <h2 className="text-2xl font-bold mb-4">Аналітика</h2>
              <p>Розділ знаходиться в розробці.</p>
            </div>
          )}

          {/* =========================================================================
              SECTION 6: AFFILIATE (Партнерська програма) - New Tab
             ========================================================================= */}
          {activeSection === 'AFFILIATE' && (
            <div className="animate-in fade-in duration-200">
              <AffiliateProgram
                onOpenMap={() => setActiveSection('HOME')}
                onOpenSimulator={() => setIsSimulatorOpen(true)}
              />
            </div>
          )}
          
        </main>`;

code = code.replace("        </main>", newSections);

fs.writeFileSync('src/App.tsx', code);
