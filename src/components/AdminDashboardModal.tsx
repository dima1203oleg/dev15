import React, { useState, useEffect } from 'react';
import { 
  X, Shield, Activity, Settings, Radio, CheckCircle2, AlertTriangle, 
  Layers, Lock, Play, RefreshCw, Database, DollarSign, Users, Scale
} from 'lucide-react';
import { CapValidationResult } from '../types';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleThreatServer: () => void;
  isThreatServerOnline: boolean;
  onSimulateNewSubscriber: () => void;
  currentRole: string;
  onSwitchRole: (role: string, rank?: string) => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  onToggleThreatServer,
  isThreatServerOnline,
  onSimulateNewSubscriber,
  currentRole,
  onSwitchRole
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'OVERVIEW' | 'CAP_VALIDATOR' | 'THREAT_SETTINGS' | 'ROLES'>('OVERVIEW');
  
  // Cap Validator State
  const [testL1Rate, setTestL1Rate] = useState<number>(2500); // 25%
  const [testL2Rate, setTestL2Rate] = useState<number>(2500); // 25%
  const [testCampaignBonus, setTestCampaignBonus] = useState<number>(0);
  const [capResult, setCapResult] = useState<CapValidationResult | null>(null);
  const [capError, setCapError] = useState<{ error?: string; message?: string; status?: string } | null>(null);

  // Overview stats fetched from backend
  const [overviewStats, setOverviewStats] = useState<any>(null);

  const fetchAdminStats = async () => {
    try {
      const res = await fetch('/api/admin/overview');
      const data = await res.json();
      setOverviewStats(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleValidateCap = async () => {
    try {
      const res = await fetch('/api/admin/validate-cap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          l1RateBps: testL1Rate,
          l2RateBps: testL2Rate,
          campaignBonusBps: testCampaignBonus
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setCapResult(null);
        setCapError(data);
        return;
      }
      setCapError(null);
      setCapResult(data);
    } catch (e) {
      setCapResult(null);
      setCapError({ error: 'NETWORK_ERROR', message: 'Не вдалося перевірити правило cap. Перевірте з’єднання.' });
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdminStats();
      handleValidateCap();
    }
  }, [isOpen, testL1Rate, testL2Rate, testCampaignBonus]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl rounded-3xl bg-[#090D14] border border-slate-700 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Top Header */}
        <div className="p-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Адміністративна панель управління</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 font-bold">
                  SUPER_ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-400">SIREN UA Web Platform Back-Office Engine</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-800 bg-slate-950/60 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveAdminTab('OVERVIEW')}
            className={`py-3.5 px-4 border-b-2 transition-all ${
              activeAdminTab === 'OVERVIEW' ? 'border-rose-400 text-rose-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Огляд системи
          </button>
          <button
            onClick={() => setActiveAdminTab('CAP_VALIDATOR')}
            className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
              activeAdminTab === 'CAP_VALIDATOR' ? 'border-rose-400 text-rose-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            50% Hard Cap Валідатор
          </button>
          <button
            onClick={() => setActiveAdminTab('THREAT_SETTINGS')}
            className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
              activeAdminTab === 'THREAT_SETTINGS' ? 'border-rose-400 text-rose-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" />
            ThreatServer інтеграція
          </button>
          <button
            onClick={() => setActiveAdminTab('ROLES')}
            className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-1.5 ${
              activeAdminTab === 'ROLES' ? 'border-rose-400 text-rose-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Тестовий перемикач ролей
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          
          {/* TAB 1: OVERVIEW */}
          {activeAdminTab === 'OVERVIEW' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Стан ThreatServer:</span>
                  <div className={`text-base font-bold font-mono ${isThreatServerOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isThreatServerOnline ? 'HEALTHY (2.4.1)' : 'OFFLINE'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Активних загроз:</span>
                  <div className="text-base font-bold font-mono text-rose-400">
                    {overviewStats ? overviewStats.activeThreatsCount : '—'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Cap Compliance:</span>
                  <div className="text-base font-bold font-mono text-emerald-400">
                    {overviewStats?.capComplianceStatus === '100%_PASS' ? 'RULES PASS' : 'NOT CONNECTED'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Fraud Alerts:</span>
                  <div className="text-base font-bold font-mono text-slate-300">
                    {overviewStats ? `${overviewStats.fraudIncidentsCount} (DEMO/REPORTED)` : '—'}
                  </div>
                </div>
              </div>

              {/* Sandbox Controls */}
              {overviewStats?.financialDataMode === 'DEMO_DATA' ? <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-amber-400" />
                  Пісочниця тестування бізнес-логіки (Sandbox)
                </h4>
                <p className="text-slate-400">
                  Запуск симуляцій у реальному часі без зміни сторонніх баз даних.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={onSimulateNewSubscriber}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow"
                  >
                    +1 Кваліфікований платник (L1)
                  </button>

                  <button
                    onClick={onToggleThreatServer}
                    className={`px-4 py-2.5 rounded-xl font-bold transition-all ${
                      isThreatServerOnline 
                        ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {isThreatServerOnline ? 'Відключити ThreatServer (DATA UNAVAILABLE)' : 'Підключити ThreatServer (LIVE)'}
                  </button>
                </div>
              </div> : <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-200">Фінансовий backend не підключений. Sandbox вимкнено.</div>}
            </div>
          )}

          {/* TAB 2: CAP VALIDATOR */}
          {activeAdminTab === 'CAP_VALIDATOR' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white">Тестування правила 50% Hard Cap (QCB)</h4>
                <p className="text-slate-400 leading-relaxed">
                  Будь-яка комбінація ставок L1 + L2 + Кампанійних бонусів не повинна перевищувати 50.00% (5000 bps). При спробі нарахувати понад 50% система генерує помилку `CAP_VALIDATION_FAILED` і блокує запис у Ledger.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-300 block mb-1">Ставка L1 (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={testL1Rate / 100}
                    onChange={(e) => setTestL1Rate(Math.round(Number(e.target.value) * 100))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Ставка L2 (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={testL2Rate / 100}
                    onChange={(e) => setTestL2Rate(Math.round(Number(e.target.value) * 100))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Бонус кампанії (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={testCampaignBonus / 100}
                    onChange={(e) => setTestCampaignBonus(Math.round(Number(e.target.value) * 100))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold"
                  />
                </div>
              </div>

              {capError && (
                <div className="p-5 rounded-2xl border border-amber-500/40 bg-amber-950/30 text-amber-200">
                  <div className="flex items-center gap-2 text-sm font-bold mb-1">
                    <AlertTriangle className="w-5 h-5" />
                    <span>CAP VALIDATOR · NOT CONNECTED</span>
                  </div>
                  <p className="font-mono text-xs">{capError.message || 'Фінансовий backend не підключений.'}</p>
                  <div className="mt-2 text-[11px] text-slate-400">Перевірка правил доступна після підключення авторизованого financial backend.</div>
                </div>
              )}

              {capResult && (
                <div className={`p-5 rounded-2xl border ${capResult.passed ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'}`}>
                  <div className="flex items-center gap-2 text-sm font-bold mb-1">
                    {capResult.passed ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    <span>{capResult.passed ? 'CAP VALIDATION PASSED' : 'CAP VALIDATION FAILED'}</span>
                  </div>
                  <p className="font-mono text-xs">{capResult.reason}</p>
                  <div className="mt-2 text-[11px] text-slate-400">
                    Сумарне виділення: <b>{capResult.totalAllocationBps / 100}%</b> / Ліміт: <b>50.00%</b>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: THREAT SERVER INTEGRATION */}
          {activeAdminTab === 'THREAT_SETTINGS' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="font-bold text-white">SirenUA-ThreatServer Integration Dossier</h4>
                <p className="text-slate-400">
                  Авторитетне джерело оперативних даних: зовнішній ThreatServer потребує окремого підключення та перевірки доступу.
                </p>
                <div className="p-3 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-300 space-y-1">
                  <div>ENDPOINT: server-side configuration (THREAT_SERVER_URL)</div>
                  <div>STATUS: {isThreatServerOnline ? 'DEMO DATA' : 'NOT CONNECTED'}</div>
                  <div>FAILOVER: офіційні повідомлення органів влади</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ROLES SWITCHER */}
          {activeAdminTab === 'ROLES' && (
            <div className="space-y-4">
              <h4 className="font-bold text-white">Миттєвий перемикач тестових профілів:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => onSwitchRole('PARTNER', 'STARTER')}
                  className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left"
                >
                  <div className="font-bold text-white">Partner Starter</div>
                  <div className="text-[11px] text-slate-400 font-mono">5% L1 + 5% L2 (1-9 users)</div>
                </button>

                <button
                  onClick={() => onSwitchRole('PARTNER', 'SILVER')}
                  className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left"
                >
                  <div className="font-bold text-white">Partner Silver</div>
                  <div className="text-[11px] text-slate-400 font-mono">15% L1 + 15% L2 (30-74 users)</div>
                </button>

                <button
                  onClick={() => onSwitchRole('PARTNER', 'GOLD')}
                  className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-left bg-amber-500/5"
                >
                  <div className="font-bold text-amber-400">Partner Gold (Default)</div>
                  <div className="text-[11px] text-slate-400 font-mono">20% L1 + 20% L2 (75-199)</div>
                </button>

                <button
                  onClick={() => onSwitchRole('PARTNER', 'PLATINUM')}
                  className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-purple-500/40 text-left bg-purple-500/5"
                >
                  <div className="font-bold text-purple-300">Partner Platinum</div>
                  <div className="text-[11px] text-slate-400 font-mono">25% L1 + 25% L2 (200+)</div>
                </button>

                <button
                  onClick={() => onSwitchRole('AMBASSADOR', 'PLATINUM')}
                  className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left"
                >
                  <div className="font-bold text-white">Ambassador Profile</div>
                  <div className="text-[11px] text-slate-400 font-mono">Verified Badge + 25%</div>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
