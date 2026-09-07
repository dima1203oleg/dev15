import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  Percent, 
  Wallet, 
  Share2, 
  QrCode, 
  Copy, 
  ExternalLink, 
  RotateCw, 
  Maximize2, 
  Crown, 
  ArrowRight, 
  ChevronRight, 
  Check, 
  Sparkles,
  Info,
  Layers,
  List,
  BarChart2,
  PieChart,
  ShieldCheck,
  Award,
  Sliders
} from 'lucide-react';
import { playWebAudioSound } from '../utils/sirenAudio';
import { networkService, NetworkNode, NetworkSummary, NetworkActivity, NetworkBranchStats } from '../services/networkService';
import { DataEnvelope } from '../types/dataEnvelope';
import { InfoTooltip } from './InfoTooltip';
import { DataFreshnessIndicator } from './DataFreshnessIndicator';
import { ContextDrawer } from './ContextDrawer';
import { DataState } from '../types/dataEnvelope';
import { runtimeConfig } from '../config/runtime';

interface AffiliateProgramProps {
  onOpenMap?: () => void;
  onOpenSimulator?: () => void;
  theme?: 'light' | 'dark';
  view?: 'NETWORK' | 'PROGRAM';
  initialTab?: 'VISUAL' | 'TREE' | 'LIST' | 'ANALYTICS';
}

export const AffiliateProgram: React.FC<AffiliateProgramProps> = ({
  onOpenMap,
  onOpenSimulator,
  theme = 'light',
  view = 'NETWORK',
  initialTab = 'VISUAL',
}) => {
  const [activeTab, setActiveTab] = useState<'VISUAL' | 'TREE' | 'LIST' | 'ANALYTICS'>(initialTab);
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'L1' | 'L2'>('ALL');
  const [selectedPartner, setSelectedPartner] = useState<NetworkNode | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRankRules, setShowRankRules] = useState(false);
  const [isRotating, setIsRotating] = useState(true);

  const isDark = theme === 'dark';

  const [networkSummary, setNetworkSummary] = useState<NetworkSummary | null>(null);
  const [dataState, setDataState] = useState<DataState>(runtimeConfig.apiBaseUrl ? 'LOADING' : runtimeConfig.allowDemoData ? 'DEMO' : 'NOT_CONNECTED');
  const [partnerNodes, setPartnerNodes] = useState<NetworkNode[]>([]);
  const [edges, setEdges] = useState<{ from: string; to: string; level: 'L1' | 'L2' }[]>([]);
  const [activities, setActivities] = useState<NetworkActivity[]>([]);
  const [branches, setBranches] = useState<NetworkBranchStats[]>([]);
  const [graphState, setGraphState] = useState<DataState>(runtimeConfig.apiBaseUrl ? 'LOADING' : runtimeConfig.allowDemoData ? 'DEMO' : 'NOT_CONNECTED');
  const [activityState, setActivityState] = useState<DataState>(runtimeConfig.apiBaseUrl ? 'LOADING' : runtimeConfig.allowDemoData ? 'DEMO' : 'NOT_CONNECTED');
  const [branchState, setBranchState] = useState<DataState>(runtimeConfig.apiBaseUrl ? 'LOADING' : runtimeConfig.allowDemoData ? 'DEMO' : 'NOT_CONNECTED');

  const demoSummary: NetworkSummary = {
    totalNetworkSize: 2847,
    activeL1Count: 247,
    activeL2Count: 2600,
    new30DaysCount: 84,
    conversionRatePercent: 13.8,
    monthlyNetworkIncomeUah: 12460,
    qualifiedL1: 154,
    currentTier: {
      id: 'GOLD',
      name: 'Gold',
      minL1: 75,
      maxL1: 199,
      l1Percent: 20,
      l2Percent: 20,
      l1Rate: 0.2,
      l2Rate: 0.2,
      isL2Unlocked: true,
      badgeLabel: 'Gold Partner',
      description: 'Лідерський рівень. 20% з L1 та 20% з L2.'
    },
    nextTier: {
      id: 'PLATINUM',
      name: 'Platinum',
      minL1: 200,
      maxL1: null,
      l1Percent: 25,
      l2Percent: 25,
      l1Rate: 0.25,
      l2Rate: 0.25,
      isL2Unlocked: true,
      badgeLabel: 'Platinum Partner',
      description: 'Максимальний партнерський статус. 25% з L1 та 25% з L2.'
    },
    remainingToNextRank: 46,
    rankProgressPercent: 77,
    ambassador: {
      status: 'CANDIDATE',
      criteria: {
        minL1: 500,
        currentL1: 154,
        communityVerified: true,
        educationalContentCreated: true
      }
    },
    referralCode: 'OLEKSANDR25',
    referralUrl: 'https://siren.ua/r/OLEKSANDR25',
    trafficSources: []
  };
  const unavailableSummary: NetworkSummary = {
    ...demoSummary,
    totalNetworkSize: 0,
    activeL1Count: 0,
    activeL2Count: 0,
    new30DaysCount: 0,
    conversionRatePercent: 0,
    monthlyNetworkIncomeUah: 0,
    qualifiedL1: 0,
    currentTier: {
      ...demoSummary.currentTier,
      id: 'STARTER',
      name: 'Starter',
      minL1: 0,
      maxL1: 0,
      l1Percent: 5,
      l2Percent: 5,
      l1Rate: 0.05,
      l2Rate: 0.05,
      badgeLabel: 'Starter Partner',
      description: 'Реальні дані про ранг будуть доступні після підключення partner API.',
    },
    nextTier: demoSummary.nextTier,
    remainingToNextRank: 0,
    rankProgressPercent: 0,
    ambassador: {
      status: 'NOT_ELIGIBLE',
      criteria: {
        minL1: 500,
        currentL1: 0,
        communityVerified: false,
        educationalContentCreated: false,
      },
    },
    referralCode: '',
    referralUrl: '',
    trafficSources: [],
  };
  const summary: NetworkSummary = networkSummary || (dataState === 'NOT_CONNECTED' || !runtimeConfig.allowDemoData ? unavailableSummary : demoSummary);
  const referralCode = dataState === 'LIVE'
    ? summary.referralCode || '—'
    : dataState === 'NOT_CONNECTED'
      ? '—'
      : 'DEMO-КОД';
  const referralUrl = dataState === 'LIVE' ? summary.referralUrl : '';
  // Demo / unavailable payloads may include illustrative values, but must never
  // enable production-looking share or referral actions before a live partner API
  // has verified the referral URL.
  const partnerActionsAvailable = dataState === 'LIVE' && Boolean(referralUrl);
  const activePartnerTotal = summary.activeL1Count + summary.activeL2Count;
  const activeSharePercent = summary.totalNetworkSize > 0
    ? Math.round((activePartnerTotal / summary.totalNetworkSize) * 100)
    : 0;
  const inactivePartnerTotal = Math.max(0, summary.totalNetworkSize - activePartnerTotal);
  const l1SharePercent = summary.totalNetworkSize > 0
    ? ((summary.activeL1Count / summary.totalNetworkSize) * 100).toFixed(1)
    : '0.0';
  const l2SharePercent = summary.totalNetworkSize > 0
    ? ((summary.activeL2Count / summary.totalNetworkSize) * 100).toFixed(1)
    : '0.0';
  const new30DaysDisplay = summary.metricsAvailability?.new30Days === false
    ? '—'
    : summary.new30DaysCount.toLocaleString('uk-UA');
  const conversionDisplay = summary.metricsAvailability?.conversion === false
    ? '—'
    : `${summary.conversionRatePercent}%`;
  const monthlyIncomeDisplay = summary.metricsAvailability?.monthlyIncome === false
    ? '—'
    : `₴ ${summary.monthlyNetworkIncomeUah.toLocaleString('uk-UA')}`;

  useEffect(() => {
    networkService.getNetworkSummary().then(res => {
      setDataState(res.state);
      if (res.data) setNetworkSummary(res.data);
    });
    networkService.getNetworkGraph().then(res => {
      setGraphState(res.state);
      if (res.data) {
        setPartnerNodes(res.data.nodes);
        setEdges(res.data.edges);
      }
    });
    networkService.getNetworkActivity().then(res => {
      setActivityState(res.state);
      if (res.data) setActivities(res.data);
    });
    networkService.getBranchStats().then(res => {
      setBranchState(res.state);
      if (res.data) setBranches(res.data);
    });
  }, []);

  const handleCopyLink = () => {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    playWebAudioSound('click');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const partnerList = partnerNodes.filter((node) => node.level !== 'ME');
  const topPartners = [...partnerList]
    .sort((a, b) => b.rawEarningsUah - a.rawEarningsUah)
    .slice(0, 5);
  const recentReferrals = [...partnerList]
    .sort((a, b) => {
      const parseDate = (value: string) => value.split('.').reverse().join('-');
      return parseDate(b.joinDate).localeCompare(parseDate(a.joinDate));
    })
    .slice(0, 5);
  const graphIsDemo = graphState !== 'LIVE';
  const activityIsDemo = activityState !== 'LIVE';
  const branchIsDemo = branchState !== 'LIVE';
  const partnerDataIsDemo = dataState !== 'LIVE' || graphIsDemo || activityIsDemo || branchIsDemo;

  const tabButtonClass = (tab: typeof activeTab) => `px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
    activeTab === tab
      ? 'bg-blue-600 text-white shadow-xs'
      : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')
  }`;

  const renderSecondaryTab = () => {
    if (activeTab === 'TREE') {
      const l1Nodes = partnerList.filter((node) => node.level === 'L1');
      const l2Nodes = partnerList.filter((node) => node.level === 'L2');
      return (
        <div className="space-y-5">
          <div className={`rounded-3xl border p-5 ${isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-xl font-black">Дерево партнерської мережі</h2>
                <p className="text-xs text-slate-500 mt-1">Два фінансові рівні: L1 впливає на ранг, L2 — на мережеву комісію.</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1.5 rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">L1 · {summary.activeL1Count.toLocaleString('uk-UA')}</span>
                <span className="px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">L2 · {summary.activeL2Count.toLocaleString('uk-UA')}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`rounded-2xl border p-4 ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50/70'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm">L1 · прямі партнери</h3>
                  <span className="text-xs text-slate-500">{l1Nodes.length ? `${l1Nodes.length} показано` : 'Очікуємо API'}</span>
                </div>
                <div className="space-y-2">
                  {l1Nodes.map((node) => (
                    <button key={node.id} type="button" onClick={() => setSelectedPartner(node)} className={`w-full flex items-center gap-3 rounded-xl p-2 text-left transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-white'}`}>
                      {node.avatar ? <img src={node.avatar} alt="" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" /> : <span className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" aria-hidden="true" />}
                      <span className="min-w-0 flex-1"><span className="block text-xs font-bold truncate">{node.name}</span><span className="block text-[10px] text-slate-500">{node.qualifiedL1Count} кваліфікованих L1</span></span>
                      <span className="text-xs font-black text-blue-600">{node.earnings}</span>
                    </button>
                  ))}
                  {!l1Nodes.length && <p className="text-xs text-slate-500">Дані L1 ще не підключені.</p>}
                </div>
              </div>
              <div className={`rounded-2xl border p-4 ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50/70'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm">L2 · другий рівень</h3>
                  <span className="text-xs text-slate-500">{l2Nodes.length ? `${l2Nodes.length} показано` : 'Очікуємо API'}</span>
                </div>
                <div className="space-y-2">
                  {l2Nodes.map((node) => (
                    <button key={node.id} type="button" onClick={() => setSelectedPartner(node)} className={`w-full flex items-center gap-3 rounded-xl p-2 text-left transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-white'}`}>
                      {node.avatar ? <img src={node.avatar} alt="" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" /> : <span className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" aria-hidden="true" />}
                      <span className="min-w-0 flex-1"><span className="block text-xs font-bold truncate">{node.name}</span><span className="block text-[10px] text-slate-500">{node.parentName || 'Гілка не вказана'}</span></span>
                      <span className="text-xs font-black text-purple-600">{node.earnings}</span>
                    </button>
                  ))}
                  {!l2Nodes.length && <p className="text-xs text-slate-500">Дані L2 ще не підключені.</p>}
                </div>
              </div>
            </div>
            <div className={`mt-4 rounded-2xl border p-3 text-xs ${isDark ? 'border-slate-800 bg-slate-950/50 text-slate-400' : 'border-slate-100 bg-slate-50 text-slate-600'}`}>
              Зв’язків у завантаженому графі: <strong>{edges.length}</strong>. Повний граф відкривається порціями через network API, без передачі тисяч вузлів у браузер.
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'LIST') {
      return (
        <div className={`rounded-3xl border p-5 ${isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-black">Список партнерів</h2>
              <p className="text-xs text-slate-500 mt-1">Показані вузли, які повернув network API. Відкрийте партнера для деталей.</p>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-500">
              Рівень
              <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value as 'ALL' | 'L1' | 'L2')} className={`px-2.5 py-2 rounded-xl border text-xs font-semibold ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <option value="ALL">L1 + L2</option>
                <option value="L1">Тільки L1</option>
                <option value="L2">Тільки L2</option>
              </select>
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-xs">
              <thead className={`text-left border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                <tr><th className="py-3 pr-3">Партнер</th><th className="py-3 pr-3">Рівень</th><th className="py-3 pr-3">Статус</th><th className="py-3 pr-3">Кваліфіковані L1</th><th className="py-3 text-right">Внесок</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {partnerList.filter((node) => levelFilter === 'ALL' || node.level === levelFilter).map((node) => (
                  <tr key={node.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60" onClick={() => setSelectedPartner(node)}>
                    <td className="py-3 pr-3"><div className="flex items-center gap-2">{node.avatar ? <img src={node.avatar} alt="" className="w-7 h-7 rounded-full object-cover" referrerPolicy="no-referrer" /> : <span className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800" aria-hidden="true" />}<span className="font-bold">{node.name}</span></div></td>
                    <td className="py-3 pr-3"><span className={node.level === 'L1' ? 'text-cyan-600 font-bold' : 'text-purple-600 font-bold'}>{node.level}</span></td>
                    <td className="py-3 pr-3"><span className="inline-flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-full ${node.status === 'ACTIVE' ? 'bg-emerald-500' : node.status === 'NEW' ? 'bg-amber-500' : 'bg-slate-400'}`} />{node.status === 'ACTIVE' ? 'Активний' : node.status === 'NEW' ? 'Новий' : node.status === 'TRIAL' ? 'Trial' : 'Топ'}</span></td>
                    <td className="py-3 pr-3">{node.qualifiedL1Count}</td>
                    <td className="py-3 text-right font-black">{node.earnings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!partnerList.length && <p className="py-8 text-center text-xs text-slate-500">Список партнерів ще не завантажено з API.</p>}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div className={`rounded-3xl border p-5 ${isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'}`}>
          <div className="flex items-start justify-between gap-3 mb-5">
            <div><h2 className="text-xl font-black">Аналітика партнерської мережі</h2><p className="text-xs text-slate-500 mt-1">Конверсія, джерела та внесок гілок — без змішування з фінансовим ledger.</p></div>
            <BarChart2 className="w-5 h-5 text-blue-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <div className={`rounded-2xl p-4 ${isDark ? 'bg-slate-950/60' : 'bg-slate-50'}`}><div className="text-xs text-slate-500">Конверсія в оплату</div><div className="text-2xl font-black mt-1">{conversionDisplay}</div><div className="text-[10px] text-slate-500 mt-1">за даними summary API</div></div>
            <div className={`rounded-2xl p-4 ${isDark ? 'bg-slate-950/60' : 'bg-slate-50'}`}><div className="text-xs text-slate-500">Нові за 30 днів</div><div className="text-2xl font-black mt-1">{new30DaysDisplay}</div><div className="text-[10px] text-slate-500 mt-1">з нормалізованого summary</div></div>
            <div className={`rounded-2xl p-4 ${isDark ? 'bg-slate-950/60' : 'bg-slate-50'}`}><div className="text-xs text-slate-500">Мережевий дохід</div><div className="text-2xl font-black mt-1">{monthlyIncomeDisplay}</div><div className="text-[10px] text-slate-500 mt-1">період: 30 днів</div></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div><h3 className="text-sm font-bold mb-3">Джерела трафіку</h3>{summary.trafficSources.length ? <div className="space-y-3">{summary.trafficSources.map((source) => <div key={source.name}><div className="flex items-center justify-between text-xs mb-1"><span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: source.color }} />{source.name}</span><span className="font-bold">{source.percent}% · {source.count.toLocaleString('uk-UA')}</span></div><div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${source.percent}%`, backgroundColor: source.color }} /></div></div>)}</div> : <p className="text-xs text-slate-500">Джерела трафіку ще не повертає partner API.</p>}</div>
            <div><h3 className="text-sm font-bold mb-3">Гілки мережі</h3><div className="space-y-3">{branches.map((branch) => <div key={branch.branchId}><div className="flex items-center justify-between text-xs mb-1"><span className="font-semibold truncate pr-2">{branch.branchName}</span><span className="font-bold">{branch.sharePercent}%</span></div><div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"><div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(branch.sharePercent, 100)}%` }} /></div><div className="flex justify-between text-[10px] text-slate-500 mt-1"><span>L1 {branch.l1Members} · L2 {branch.l2Members}</span><span>Конверсія {branch.conversionPercent}%</span></div></div>)}{!branches.length && <p className="text-xs text-slate-500">Branch analytics ще не підключено.</p>}</div></div>
          </div>
        </div>
        <div className={`rounded-3xl border p-5 ${isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'}`}>
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold">Останні події мережі</h3><span className="text-[10px] text-slate-500">{activities.length} у відповіді API</span></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{activities.map((activity) => <div key={activity.id} className={`flex items-center gap-3 rounded-2xl border p-3 ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50/70'}`}>{activity.partnerAvatar ? <img src={activity.partnerAvatar} alt="" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" /> : <span className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" aria-hidden="true" />}<div className="min-w-0 flex-1"><div className="text-xs font-bold truncate">{activity.partnerName} · {activity.level}</div><div className="text-[10px] text-slate-500 truncate">{activity.description}</div></div><span className="text-[10px] text-slate-500 whitespace-nowrap">{activity.timestamp}</span></div>)}{!activities.length && <p className="text-xs text-slate-500">Activity stream ще не підключено.</p>}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {partnerDataIsDemo && (
        <div className={`rounded-2xl border px-4 py-3 text-xs font-semibold ${isDark ? 'border-amber-900/60 bg-amber-950/20 text-amber-300' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
          Демонстраційні або неповні дані партнерської мережі: підключіть partner API, щоб відображати реальні L1/L2, rank, earnings та activity stream.
        </div>
      )}
      
      {/* 1. Top Hero Section: "Моя мережа — моя сила" + 6 Quick Metric Cards (1:1 with Screenshot 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        
        {/* Left Headline & Action Pill */}
        <div className="lg:col-span-4 space-y-3">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
            isDark ? 'bg-slate-900 border border-slate-800 text-slate-300' : 'bg-blue-50 border border-blue-100 text-blue-700'
          }`}>
            <span>🇺🇦</span>
            <span>Разом будуємо безпечну Україну</span>
          </div>

          <h1 className={`text-3xl sm:text-4xl font-black tracking-tight leading-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            {view === 'PROGRAM' ? <>Партнерська програма — <br />
              <span className="text-blue-600">твій наступний рівень</span></> : <>Моя мережа — <br />
              <span className="text-blue-600">моя сила</span></>}
          </h1>

          <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {view === 'PROGRAM' ? <><span className="font-bold text-slate-700 dark:text-slate-300">Ранг. Винагорода. Розвиток.</span><br />
              Переглядай умови, аналізуй конверсію та керуй запрошеннями в одному партнерському кабінеті.</> : <><span className="font-bold text-slate-700 dark:text-slate-300">Люди. Довіра. Результат.</span><br />
              Розширюй свою мережу, підтримуй партнерів, відстежуй активність і разом робимо Україну безпечнішою.</>}
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              onClick={() => {
                setShowInviteModal(true);
                playWebAudioSound('click');
              }}
              disabled={!partnerActionsAvailable}
              className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-google-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Запросити партнерів</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

              <div className={`flex items-center rounded-xl border p-0.5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <button
                onClick={handleCopyLink}
                disabled={!partnerActionsAvailable}
                className={`px-3 py-2 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  isDark 
                    ? 'hover:bg-slate-800 text-slate-300' 
                    : 'hover:bg-slate-50 text-slate-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Скопіювати посилання"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copiedLink ? 'Скопійовано' : 'Скопіювати'}</span>
              </button>

              <div className={`w-px h-4 mx-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

              <button
                onClick={() => {
                  setShowQRModal(true);
                  playWebAudioSound('click');
                }}
                disabled={!partnerActionsAvailable}
                className={`px-3 py-2 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  isDark 
                    ? 'hover:bg-slate-800 text-slate-300' 
                    : 'hover:bg-slate-50 text-slate-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Показати QR-код"
              >
                <QrCode className="w-3.5 h-3.5 text-[#2563EB]" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: 6 Metric Cards in 3x2 Grid (1:1 with Screenshot 1) */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-3 relative">
          
          <div className="absolute -top-12 right-0 hidden lg:block">
             <DataFreshnessIndicator state={dataState} theme={theme} />
          </div>

          {/* Card 1: Усього в мережі */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
          }`}>
            <div className="flex items-center justify-between">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-blue-950/80 text-blue-400' : 'bg-blue-50 text-blue-600'
              }`}>
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <TrendingUp className="w-2.5 h-2.5" /> {dataState === 'LIVE' ? '—' : 'DEMO'}
              </span>
            </div>
            <div className={`text-xs font-medium mt-2 flex items-center ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
              Усього в мережі
              <InfoTooltip theme={theme} content="Загальна кількість партнерів на всіх рівнях вашої структури, незалежно від їх статусу оплати." />
            </div>
            <div className="text-2xl font-black mt-0.5">{summary.totalNetworkSize.toLocaleString()}</div>
            <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Всі рівні</div>
          </div>

          {/* Card 2: Активні L1 */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
          }`}>
            <div className="flex items-center justify-between">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-cyan-950/80 text-cyan-400' : 'bg-cyan-50 text-cyan-600'
              }`}>
                <UserPlus className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <TrendingUp className="w-2.5 h-2.5" /> {dataState === 'LIVE' ? '—' : 'DEMO'}
              </span>
            </div>
            <div className={`text-xs font-medium mt-2 flex items-center ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
              Активні L1
              <InfoTooltip theme={theme} content="Кількість ваших особисто запрошених партнерів (1-ша лінія), які здійснили оплату підписки. Тільки вони впливають на ваш Ранг." />
            </div>
            <div className="text-2xl font-black mt-0.5">{summary.activeL1Count.toLocaleString()}</div>
            <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Перший рівень</div>
          </div>

          {/* Card 3: Активні L2 */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
          }`}>
            <div className="flex items-center justify-between">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-purple-950/80 text-purple-400' : 'bg-purple-50 text-purple-600'
              }`}>
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <TrendingUp className="w-2.5 h-2.5" /> {dataState === 'LIVE' ? '—' : 'DEMO'}
              </span>
            </div>
            <div className={`text-xs font-medium mt-2 flex items-center ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
              Активні L2
              <InfoTooltip theme={theme} content="Партнери 2-го рівня (запрошені вашими L1). Ви отримуєте 20% комісійних з їх оплат, але вони не підвищують ваш Ранг." />
            </div>
            <div className="text-2xl font-black mt-0.5">{summary.activeL2Count.toLocaleString()}</div>
            <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Другий рівень</div>
          </div>

          {/* Card 4: Нові за 30 днів */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
          }`}>
            <div className="flex items-center justify-between">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-emerald-950/80 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
              }`}>
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <TrendingUp className="w-2.5 h-2.5" /> {dataState === 'LIVE' ? '—' : 'DEMO'}
              </span>
            </div>
            <div className={`text-xs font-medium mt-2 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Нові за 30 днів</div>
            <div className="text-2xl font-black mt-0.5">{new30DaysDisplay}</div>
            <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Приєдналися</div>
          </div>

          {/* Card 5: Конверсія в оплату */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
          }`}>
            <div className="flex items-center justify-between">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-blue-950/80 text-blue-400' : 'bg-blue-50 text-blue-600'
              }`}>
                <Percent className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <TrendingUp className="w-2.5 h-2.5" /> {dataState === 'LIVE' ? '—' : 'DEMO'}
              </span>
            </div>
            <div className={`text-xs font-medium mt-2 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Конверсія в оплату</div>
            <div className="text-2xl font-black mt-0.5">{conversionDisplay}</div>
            <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Від активних</div>
          </div>

          {/* Card 6: Мережевий дохід */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
          }`}>
            <div className="flex items-center justify-between">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isDark ? 'bg-indigo-950/80 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
              }`}>
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <TrendingUp className="w-2.5 h-2.5" /> {dataState === 'LIVE' ? '—' : 'DEMO'}
              </span>
            </div>
            <div className={`text-xs font-medium mt-2 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Мережевий дохід</div>
            <div className="text-2xl font-black mt-0.5">{monthlyIncomeDisplay}</div>
            <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>За 30 днів</div>
          </div>

        </div>

      </div>

      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-2 ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-100 shadow-xs'}`}>
        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: 'VISUAL', label: 'Візуалізація' },
            { id: 'TREE', label: 'Дерево' },
            { id: 'LIST', label: 'Список' },
            { id: 'ANALYTICS', label: 'Аналітика' },
          ].map((tab) => (
            <button key={tab.id} type="button" onClick={() => { setActiveTab(tab.id as typeof activeTab); playWebAudioSound('click'); }} className={tabButtonClass(tab.id as typeof activeTab)}>
              {tab.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-slate-500 px-2">Виберіть режим перегляду мережі</span>
      </div>

      {activeTab === 'VISUAL' ? <>
      {/* 2. Middle 3-Column Grid: Traffic Sources (Left) | 3D Node Constellation (Center) | Rank & Top Partners (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Column (3 cols): Джерела трафіку & Динаміка зростання */}
        <div className="lg:col-span-3 space-y-4 flex flex-col justify-between">
          
          {/* Card: Джерела трафіку */}
          <div className={`p-5 rounded-3xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold">Джерела трафіку</h3>
              <button onClick={() => { setActiveTab('ANALYTICS'); playWebAudioSound('click'); }} className="text-xs text-blue-500 font-semibold flex items-center gap-1 hover:underline cursor-pointer">
                <span>Всі</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Donut Chart with Center Total from the normalized summary */}
            <div className="flex items-center justify-center my-3 relative">
              <svg viewBox="0 0 100 100" className="w-32 h-32 transform -rotate-90">
                {/* TikTok 38% */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#2563EB" strokeWidth="12" strokeDasharray="90.7 238.7" strokeDashoffset="0" />
                {/* Instagram 24% */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#8B5CF6" strokeWidth="12" strokeDasharray="57.3 238.7" strokeDashoffset="-90.7" />
                {/* YouTube 16% */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#EF4444" strokeWidth="12" strokeDasharray="38.2 238.7" strokeDashoffset="-148" />
                {/* Telegram 12% */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#38BDF8" strokeWidth="12" strokeDasharray="28.6 238.7" strokeDashoffset="-186.2" />
                {/* Others 10% */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#CBD5E1" strokeWidth="12" strokeDasharray="23.9 238.7" strokeDashoffset="-214.8" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-base font-black leading-tight">{summary.totalNetworkSize.toLocaleString('uk-UA')}</span>
                <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Всього</span>
              </div>

              {onOpenSimulator && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenSimulator();
                    playWebAudioSound('click');
                  }}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isDark ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-500" />
                  <span>Симулятор</span>
                </button>
              )}
            </div>

            {/* Legend breakdown */}
            <div className="space-y-1.5 text-xs pt-1">
              {summary.trafficSources.length ? summary.trafficSources.map((source) => (
                <div key={source.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: source.color }} />
                    <span>{source.name}</span>
                  </span>
                  <span className="font-bold">{source.percent}%</span>
                </div>
              )) : <p className="text-xs text-slate-500">Джерела трафіку ще не повертає partner API.</p>}
            </div>
          </div>

          {/* Card: Динаміка зростання */}
          <div className={`p-5 rounded-3xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold">Динаміка зростання</h3>
                <span className="text-[10px] font-bold text-amber-500">ДЕМО-ГРАФІК</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-lg border ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                За 6 місяців ▾
              </span>
            </div>

            {/* Growth Curve Chart */}
            <div className="h-28 flex items-end justify-between gap-1 pt-3">
              {[
                { month: 'Бер', val: 20 },
                { month: 'Кві', val: 35 },
                { month: 'Тра', val: 45 },
                { month: 'Чер', val: 60 },
                { month: 'Лип', val: 80 },
                { month: 'Сер', val: 100 },
              ].map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div 
                    className="w-full bg-blue-500 rounded-t-md transition-all hover:bg-blue-600"
                    style={{ height: `${item.val}%`, opacity: 0.3 + (idx * 0.14) }}
                  />
                  <span className="text-[10px] text-slate-400">{item.month}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Center Column (6 cols): 3D Interactive Holographic Constellation Visualizer */}
        <div className={`lg:col-span-6 rounded-3xl border p-5 flex flex-col justify-between relative overflow-hidden ${
          isDark ? 'bg-[#090E18] border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
        }`}>
          
          {/* Visual controls: level filter and rotation */}
          <div className="flex items-center justify-end gap-2 z-20">
            <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value as 'ALL' | 'L1' | 'L2')} className={`text-xs font-semibold px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
              <option value="ALL">Рівні: L1 + L2</option>
              <option value="L1">Тільки L1</option>
              <option value="L2">Тільки L2</option>
            </select>
            <button type="button" onClick={() => setIsRotating(!isRotating)} className={`p-1.5 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`} title="Обертання сузір'я">
              <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin-slow' : ''}`} />
            </button>
          </div>

          {/* Legend Row (1:1 with Screenshot 1) */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] pt-3 z-20 text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-600" /> Ви</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-400" /> L1 (прямі партнери)</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500" /> L2 (другий рівень)</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Активний</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Новий</span>
            <span className="flex items-center gap-1.5">👑 Найкращий партнер</span>
          </div>

          {/* 3D Holographic Constellation Map Canvas */}
          <div className="relative w-full h-[360px] sm:h-[400px] flex items-center justify-center my-2 select-none overflow-hidden">
            
            {/* Background Nebula Atmosphere */}
            <div className={`absolute inset-0 rounded-3xl pointer-events-none ${
              isDark 
                ? 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent' 
                : 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-50/80 via-transparent to-transparent'
            }`} />

            {/* Glowing Orbit Rings */}
            <div className={`absolute w-[220px] h-[220px] rounded-full border border-dashed pointer-events-none ${
              isDark ? 'border-blue-500/20' : 'border-blue-200/80'
            }`} />
            <div className={`absolute w-[340px] h-[340px] rounded-full border border-dashed pointer-events-none ${
              isDark ? 'border-purple-500/15' : 'border-purple-200/60'
            }`} />

            {/* Connecting Lines SVG Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {partnerNodes.map((node) => {
                if (node.id === 'me') return null;
                const parent = partnerNodes.find(p => p.id === (node.parentId || 'me')) || partnerNodes[0];
                return (
                  <line
                    key={`line-${node.id}`}
                    x1={`${parent.x}%`}
                    y1={`${parent.y}%`}
                    x2={`${node.x}%`}
                    y2={`${node.y}%`}
                    stroke={node.level === 'L1' ? '#3B82F6' : '#A855F7'}
                    strokeWidth={node.level === 'L1' ? '1.5' : '1'}
                    strokeOpacity={node.level === 'L1' ? '0.4' : '0.25'}
                    strokeDasharray={node.status === 'NEW' ? '4 2' : 'none'}
                  />
                );
              })}
            </svg>

            {/* Partner Avatar Nodes */}
            {partnerNodes.map((node) => {
              if (levelFilter === 'L1' && node.level === 'L2') return null;
              if (levelFilter === 'L2' && node.level === 'L1') return null;

              const isMe = node.id === 'me';

              return (
                <div
                  key={node.id}
                  onClick={() => {
                    setSelectedPartner(node);
                    playWebAudioSound('click');
                  }}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:scale-125 z-20 group ${
                    isMe ? 'z-30' : ''
                  }`}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                >
                  {isMe ? (
                    /* Central Core Node: Oleksandr */
                    <div className="relative flex flex-col items-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 shadow-xl shadow-blue-500/30 flex items-center justify-center relative">
                        <div className="w-full h-full rounded-full overflow-hidden border-2 border-white">
                          {node.avatar ? <img src={node.avatar} alt={node.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <span className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-800" aria-hidden="true" />}
                        </div>
                        {/* Crown Badge */}
                        <div className="absolute -top-2 bg-amber-400 text-slate-900 rounded-full p-1 shadow-md">
                          <Crown className="w-3 h-3 fill-slate-900" />
                        </div>
                      </div>
                      <div className="text-center mt-1">
                        <div className={`text-xs font-black leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{node.name}</div>
                        <div className="text-[10px] text-blue-500 font-bold">{summary.currentTier.badgeLabel} • {summary.currentTier.l1Percent}%</div>
                      </div>
                    </div>
                  ) : (
                    /* Orbiting Partner Node */
                    <div className="relative flex flex-col items-center">
                      <div className={`rounded-full p-0.5 shadow-md flex items-center justify-center relative ${
                        node.level === 'L1' 
                          ? 'w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-tr from-blue-500 to-cyan-400' 
                          : 'w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-tr from-purple-500 to-indigo-400'
                      }`}>
                        <div className="w-full h-full rounded-full overflow-hidden border border-white bg-slate-800">
                          {node.avatar ? <img src={node.avatar} alt={node.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <span className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-800" aria-hidden="true" />}
                        </div>
                        {/* Top Performer Crown */}
                        {node.status === 'TOP' && (
                          <div className="absolute -top-1.5 -right-1 bg-amber-400 text-slate-900 rounded-full p-0.5 shadow-xs">
                            <Crown className="w-2.5 h-2.5 fill-slate-900" />
                          </div>
                        )}
                        {/* Activity Ring */}
                        {node.status === 'ACTIVE' && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                        )}
                        {node.status === 'NEW' && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white" />
                        )}
                      </div>
                      
                      {/* Name tooltip on hover */}
                      <span className={`text-[9px] font-bold mt-0.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity ${
                        isDark ? 'text-slate-200' : 'text-slate-800'
                      }`}>
                        {node.name}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Orbit Counter Nodes ("+12", "+28") (1:1 with Screenshot 1) */}
            <div className="absolute top-[48%] left-[24%] px-2 py-0.5 rounded-full bg-blue-500/80 text-white font-black text-[10px] shadow-sm pointer-events-none">
              +12
            </div>
            <div className="absolute top-[48%] right-[24%] px-2 py-0.5 rounded-full bg-blue-500/80 text-white font-black text-[10px] shadow-sm pointer-events-none">
              +28
            </div>

            {/* Hint pill on top right of map */}
            <div className={`absolute top-2 right-2 px-3 py-1 rounded-xl text-[10px] font-medium border backdrop-blur-sm pointer-events-none ${
              isDark ? 'bg-slate-900/80 border-slate-800 text-slate-400' : 'bg-white/90 border-slate-200 text-slate-500'
            }`}>
              Натисніть на партнера, щоб побачити деталі
            </div>

          </div>

          {/* Under-Map Stats Counter Bar (1:1 with Screenshot 1) */}
          <div className={`grid grid-cols-4 gap-2 pt-3 border-t text-center ${
            isDark ? 'border-slate-800' : 'border-slate-100'
          }`}>
            <div>
              <div className="text-base font-black text-blue-600">{summary.activeL1Count.toLocaleString('uk-UA')}</div>
              <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>L1 партнерів</div>
            </div>
            <div>
              <div className="text-base font-black text-purple-500">{summary.activeL2Count.toLocaleString('uk-UA')}</div>
              <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>L2 партнерів</div>
            </div>
            <div>
              <div className="text-base font-black text-emerald-500">{(summary.activeL1Count + summary.activeL2Count).toLocaleString('uk-UA')}</div>
              <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Активних</div>
            </div>
            <div>
              <div className="text-base font-black text-amber-500">{new30DaysDisplay}</div>
              <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Нових за 30 днів</div>
            </div>
          </div>

        </div>

        {/* Right Column (3 cols): Мій ранг & Топ-партнери у мережі */}
        <div className="lg:col-span-3 space-y-4 flex flex-col justify-between">
          
          {/* Card: Мій ранг */}
          <div className={`p-5 rounded-3xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                Мій ранг
                <button
                  onClick={() => setShowRankRules(true)}
                  className={`text-[9px] px-1.5 py-0.5 rounded font-semibold transition-colors ${
                    isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Правила
                </button>
              </h3>
            </div>

            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center">
                  <Crown className="w-5 h-5 fill-amber-500" />
                </div>
                <div>
                  <div className="text-sm font-black">{summary.currentTier.badgeLabel}</div>
                  <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Ставка: <span className="font-bold text-slate-800 dark:text-slate-200">{summary.currentTier.l1Percent}%</span></div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPartner(partnerNodes[0])}
                className="w-7 h-7 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 flex items-center justify-center cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Progress to Platinum (Strictly computed from qualified L1) */}
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>До наступного рівня: <span className="font-bold text-slate-800 dark:text-slate-200">Platinum</span></span>
                <span className="font-bold text-blue-600">{summary.rankProgressPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${summary.rankProgressPercent}%` }} />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Кваліфікованих L1: {summary.qualifiedL1}</span>
                <span>Ціль: 200</span>
              </div>
            </div>

            <div className={`grid grid-cols-2 gap-2 mt-3 pt-3 border-t text-xs ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <div>
                <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Потрібно ще</div>
                <div className="text-sm font-black text-blue-600">{summary.remainingToNextRank}</div>
                <div className={`text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>активних L1</div>
              </div>
              <div>
                <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Статус амбасадора</div>
                <div className="text-sm font-black text-purple-600">Кандидат</div>
                <div className={`text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>почесний статус</div>
              </div>
            </div>
          </div>

          {/* Card: Топ-партнери у мережі (1:1 with Screenshot 1) */}
          <div className={`p-5 rounded-3xl border ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold">Топ-партнери у мережі</h3>
              <button onClick={() => { setActiveTab('LIST'); setLevelFilter('ALL'); playWebAudioSound('click'); }} className="text-xs text-blue-500 font-semibold flex items-center gap-1 hover:underline cursor-pointer">
                <span>Всі</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {topPartners.map((p, index) => (
                <div key={p.id} onClick={() => setSelectedPartner(p)} className="flex items-center justify-between text-xs cursor-pointer rounded-xl p-1 -mx-1 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      index === 0
                        ? 'bg-amber-100 text-amber-800' 
                        : (isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600')
                    }`}>
                      {index + 1}
                    </span>
                    <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-200">
                      {p.avatar ? <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <span className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-800" aria-hidden="true" />}
                    </div>
                    <div>
                      <div className="font-bold leading-tight">{p.name}</div>
                      <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{p.level} · {p.peopleCount} людей</div>
                    </div>
                  </div>
                  <div className="font-black text-slate-900 dark:text-white">
                    {p.earnings}
                  </div>
                </div>
              ))}
              {!topPartners.length && <p className="text-xs text-slate-500">Топ партнерів ще не завантажено з API.</p>}
            </div>
          </div>

        </div>

      </div>

      {/* 3. Bottom Row: Останні реферали | Активність партнерів | Розподіл за рівнями | 3D Rocket CTA (1:1 with Screenshot 1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Card 1: Останні реферали (4 cols) */}
        <div className={`lg:col-span-4 p-5 rounded-3xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold">Останні реферали</h3>
              <button onClick={() => { setActiveTab('LIST'); setLevelFilter('ALL'); playWebAudioSound('click'); }} className="text-xs text-blue-500 font-semibold flex items-center gap-1 hover:underline cursor-pointer">
                <span>Всі</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {recentReferrals.map((r) => (
                <div key={r.id} onClick={() => setSelectedPartner(r)} className="flex items-center justify-between cursor-pointer rounded-xl p-1 -mx-1 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200">
                      {r.avatar ? <img src={r.avatar} alt={r.name} className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-800" aria-hidden="true" /> : <span className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-800" aria-hidden="true" />}
                    </div>
                    <span className="font-semibold">{r.name}</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    r.level === 'L1' ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600' : 'bg-purple-50 dark:bg-purple-950/60 text-purple-600'
                  }`}>
                    {r.level}
                  </span>
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{r.joinDate}</span>
                  <span className={`text-[11px] font-semibold flex items-center gap-1 ${
                    r.status === 'ACTIVE' ? 'text-emerald-500' : r.status === 'NEW' ? 'text-blue-500' : 'text-slate-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      r.status === 'ACTIVE' ? 'bg-emerald-500' : r.status === 'NEW' ? 'bg-blue-500' : 'bg-slate-400'
                    }`} />
                    {r.status === 'ACTIVE' ? 'Активний' : r.status === 'NEW' ? 'Новий' : r.status === 'TRIAL' ? 'Trial' : 'Топ'}
                  </span>
                </div>
              ))}
              {!recentReferrals.length && <p className="text-xs text-slate-500">Останні реферали ще не завантажені з API.</p>}
            </div>
          </div>
        </div>

        {/* Card 2: Активність партнерів (3 cols) */}
        <div className={`lg:col-span-3 p-5 rounded-3xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
        }`}>
          <div>
            <h3 className="text-sm font-bold mb-3">Активність партнерів</h3>
            
            {/* Donut Chart: derived from the normalized network summary */}
            <div className="flex items-center justify-center my-2 relative">
              <svg viewBox="0 0 100 100" className="w-28 h-28 transform -rotate-90">
                <circle cx="50" cy="50" r="38" fill="none" stroke={isDark ? '#1E293B' : '#F1F5F9'} strokeWidth="12" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#2563EB" strokeWidth="12" strokeDasharray="162.3 238.7" strokeDashoffset="0" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-lg font-black leading-tight">{activeSharePercent}%</span>
                <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{activePartnerTotal.toLocaleString('uk-UA')}</span>
                <span className={`text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Активних</span>
              </div>
            </div>

            <div className="space-y-1 text-xs pt-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Активні</span>
                <span className="font-bold">{activePartnerTotal.toLocaleString('uk-UA')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Нові</span>
                <span className="font-bold">{new30DaysDisplay}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-300" /> Неактивні</span>
                <span className="font-bold">{inactivePartnerTotal.toLocaleString('uk-UA')}</span>
              </div>
            </div>
          </div>

          <div className={`mt-3 p-2 rounded-xl text-[10px] font-semibold flex items-center gap-1.5 ${
            isDark ? 'bg-emerald-950/50 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
          }`}>
            <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{dataState === 'LIVE' ? 'Порівняльний тренд очікує analytics API.' : 'Демонстраційний тренд: підключіть analytics API для фактичної динаміки.'}</span>
          </div>
        </div>

        {/* Card 3: Розподіл за рівнями (2 cols) */}
        <div className={`lg:col-span-2 p-5 rounded-3xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900 shadow-xs'
        }`}>
          <div>
            <h3 className="text-sm font-bold mb-3">Розподіл за рівнями</h3>

            <div className="flex items-center justify-center my-2 relative">
              <svg viewBox="0 0 100 100" className="w-28 h-28 transform -rotate-90">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#8B5CF6" strokeWidth="12" strokeDasharray="218 238.7" strokeDashoffset="0" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#38BDF8" strokeWidth="12" strokeDasharray="20.7 238.7" strokeDashoffset="-218" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-base font-black leading-tight">{summary.totalNetworkSize.toLocaleString('uk-UA')}</span>
                <span className={`text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>Всього</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs pt-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-400" /> L1</span>
                <span className="font-bold">{summary.activeL1Count.toLocaleString('uk-UA')} ({l1SharePercent}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500" /> L2</span>
                <span className="font-bold">{summary.activeL2Count.toLocaleString('uk-UA')} ({l2SharePercent}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Більша мережа — більші можливості (3 cols, 3D Rocket CTA 1:1 with Screenshot 1) */}
        <div className="lg:col-span-3 p-5 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white shadow-lg flex flex-col justify-between relative overflow-hidden">
          
          {/* Top 3D Rocket SVG Illustration */}
          <div className="absolute -top-4 -right-4 w-32 h-32 opacity-80 pointer-events-none transform rotate-12">
            <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Rocket Body */}
              <path d="M50 10 C35 30 35 60 50 85 C65 60 65 30 50 10 Z" fill="#FFFFFF" />
              <path d="M50 10 C45 30 45 60 50 85 Z" fill="#E2E8F0" />
              {/* Rocket Nosecone & Window */}
              <circle cx="50" cy="35" r="7" fill="#38BDF8" stroke="#1E293B" strokeWidth="2" />
              {/* Fins */}
              <path d="M35 55 L20 75 L38 72 Z" fill="#38BDF8" />
              <path d="M65 55 L80 75 L62 72 Z" fill="#38BDF8" />
              {/* Exhaust Flame */}
              <path d="M45 85 L50 98 L55 85 Z" fill="#F59E0B" />
              <path d="M47 85 L50 93 L53 85 Z" fill="#FEF08A" />
            </svg>
          </div>

          <div>
            <h3 className="text-lg font-black leading-tight max-w-[180px]">
              Більша мережа — більші можливості
            </h3>
            <p className="text-xs text-blue-100 mt-2 max-w-[200px] leading-relaxed">
              Запрошуй, підтримуй, розвивай разом з SIREN UA.
            </p>
          </div>

          <div className="pt-4 z-10">
            <button
              onClick={() => {
                if (!partnerActionsAvailable) return;
                setShowInviteModal(true);
                playWebAudioSound('click');
              }}
              disabled={!partnerActionsAvailable}
              className="w-full py-2.5 rounded-2xl bg-white hover:bg-blue-50 text-blue-700 font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>Запросити зараз</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

      </>
      : renderSecondaryTab()}

      {/* Partner Detail Modal */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className={`relative w-full max-w-md rounded-3xl p-6 border shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            <button
              onClick={() => setSelectedPartner(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              ✕
            </button>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-500">
                {selectedPartner.avatar ? <img src={selectedPartner.avatar} alt={selectedPartner.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <span className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-800" aria-hidden="true" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black">{selectedPartner.name}</h3>
                  {selectedPartner.status === 'TOP' && <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />}
                </div>
                <div className="text-xs text-blue-500 font-bold">
                  {selectedPartner.level === 'ME' ? 'Ви (Головний партнер)' : `Партнер ${selectedPartner.level}`}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 my-5">
              <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <div className="text-[11px] text-slate-400">Внесок у дохід</div>
                <div className="text-base font-black mt-0.5">{selectedPartner.earnings}</div>
              </div>
              <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <div className="text-[11px] text-slate-400">Мережа партнера</div>
                <div className="text-base font-black mt-0.5">{selectedPartner.peopleCount} людей</div>
              </div>
            </div>

            <button
              onClick={() => setSelectedPartner(null)}
              className="w-full py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              Закрити
            </button>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className={`relative w-full max-w-sm rounded-3xl p-6 border text-center ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              ✕
            </button>
            <h3 className="text-base font-bold mb-1">Ваш персональний QR-код</h3>
            <p className="text-xs text-slate-400 mb-4">Відскануйте для швидкого приєднання до мережі</p>
            <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl border-2 border-blue-500/30 flex items-center justify-center shadow-lg">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(referralUrl)}`}
                alt="QR" 
                className="w-full h-full"
              />
            </div>
            <div className="mt-4 text-xs font-mono font-bold text-blue-600">
              {referralCode}
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className={`relative w-full max-w-md rounded-3xl p-6 border ${
            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              ✕
            </button>
            <h3 className="text-lg font-black mb-1">Запросити партнерів до SirenUA</h3>
            <p className="text-xs text-slate-400 mb-4">Поділіться вашим реферальним посиланням у соцмережах</p>
            
            <div className="space-y-3">
              <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-xs font-mono truncate mr-2">{referralUrl}</span>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Ок' : 'Копіювати'}</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <button 
                  onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}`, '_blank')}
                  className="py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  Telegram
                </button>
                <button 
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`, '_blank')}
                  className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  Facebook
                </button>
                <button 
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(referralUrl)}`, '_blank')}
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rank Rules Drawer */}
      <ContextDrawer
        isOpen={showRankRules}
        onClose={() => setShowRankRules(false)}
        title="Правила Партнерських Рангів"
        icon={<Crown className="w-5 h-5" />}
        theme={theme}
      >
        <div className="space-y-6">
          <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Ваш ранг в системі SIREN UA залежить <strong className={isDark ? 'text-white' : 'text-slate-900'}>виключно від кількості активних партнерів першої лінії (L1)</strong>. Партнери другого рівня (L2) приносять вам дохід, але не впливають на підвищення рангу.
          </p>

          <div className="space-y-3">
            <h4 className="font-bold text-sm">Таблиця рангів</h4>
            <div className={`rounded-2xl border overflow-hidden ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <table className="w-full text-xs text-left">
                <thead className={isDark ? 'bg-slate-800/50' : 'bg-slate-50'}>
                  <tr>
                    <th className="px-4 py-3 font-semibold">Ранг</th>
                    <th className="px-4 py-3 font-semibold">Активні L1</th>
                    <th className="px-4 py-3 font-semibold">Відсоток</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="px-4 py-3 font-medium">Starter</td>
                    <td className="px-4 py-3">0 - 9</td>
                    <td className="px-4 py-3">10%</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-amber-700 dark:text-amber-500">Bronze</td>
                    <td className="px-4 py-3">10 - 49</td>
                    <td className="px-4 py-3">12%</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Silver</td>
                    <td className="px-4 py-3">50 - 99</td>
                    <td className="px-4 py-3">15%</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-amber-500">Gold</td>
                    <td className="px-4 py-3">100 - 199</td>
                    <td className="px-4 py-3">20%</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-blue-500">Platinum</td>
                    <td className="px-4 py-3">200+</td>
                    <td className="px-4 py-3">25%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            isDark ? 'bg-blue-950/20 border-blue-900/50 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-700'
          }`}>
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong>Що таке "активний" партнер?</strong><br/>
              Це користувач, який зареєструвався за вашим посиланням та має оплачену і діючу підписку на даний момент.
            </div>
          </div>
        </div>
      </ContextDrawer>

    </div>
  );
};
