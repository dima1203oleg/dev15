import React, { useState, useEffect } from 'react';
import { 
  X, Users, DollarSign, TrendingUp, Share2, Copy, Check, QrCode, 
  ArrowUpRight, ShieldCheck, Clock, Layers, AlertCircle, RefreshCw, 
  CreditCard, Send, CheckCircle2, ChevronRight, Lock, ExternalLink, Sparkles
} from 'lucide-react';
import { PartnerProfile, WalletProjection, ReferralAttribution, LedgerEntry, PayoutRequest } from '../types';

function parseMinorUnits(value: string): number {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d{0,2})?$/.test(normalized)) return 0;
  const [whole, fraction = ''] = normalized.split('.');
  const minor = Number(`${whole}${fraction.padEnd(2, '0')}`);
  return Number.isSafeInteger(minor) ? minor : 0;
}

interface PartnerDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateNewSubscriber: () => void;
}

export const PartnerDashboardModal: React.FC<PartnerDashboardModalProps> = ({
  isOpen,
  onClose,
  onSimulateNewSubscriber
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TOOLKIT' | 'NETWORK' | 'LEDGER' | 'PAYOUTS'>('OVERVIEW');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<string>('0');
  const [payoutProvider, setPayoutProvider] = useState<'MONOBANK' | 'LIQPAY' | 'IBAN_SEPA'>('MONOBANK');
  const [payoutCardNumber, setPayoutCardNumber] = useState<string>('');
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null);

  // Local state fetched from server API
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [networkData, setNetworkData] = useState<{ l1: ReferralAttribution[]; l2: ReferralAttribution[] }>({ l1: [], l2: [] });
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [payoutsList, setPayoutsList] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPartnerData = async () => {
    try {
      setLoading(true);
      const [dashRes, netRes, ledRes, poRes] = await Promise.all([
        fetch('/api/partner/dashboard').then(r => r.json()),
        fetch('/api/partner/network').then(r => r.json()),
        fetch('/api/partner/ledger').then(r => r.json()),
        fetch('/api/partner/payouts').then(r => r.json())
      ]);

      setDashboardData(dashRes);
      setNetworkData({ l1: netRes.l1?.items || [], l2: netRes.l2?.items || [] });
      setLedgerEntries(ledRes.entries || []);
      setPayoutsList(poRes.payouts || []);
    } catch (e) {
      console.error('Error fetching partner data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setDashboardData(null);
      fetchPartnerData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  if (loading && !dashboardData) {
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"><div className="w-full max-w-md rounded-3xl border border-cyan-400/20 bg-[#090D14] p-8 text-center"><RefreshCw className="mx-auto h-6 w-6 animate-spin text-cyan-300" /><p className="mt-4 text-sm text-slate-300">Завантажуємо partner-дані…</p></div></div>;
  }

  if (dashboardData?.error) {
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"><div className="w-full max-w-md rounded-3xl border border-amber-400/30 bg-[#090D14] p-8"><div className="flex items-start justify-between gap-4"><div><div className="text-[10px] font-mono uppercase tracking-widest text-amber-300">PARTNER PLATFORM</div><h2 className="mt-2 text-xl font-bold text-white">Фінансові дані недоступні</h2></div><button type="button" onClick={onClose} className="rounded-xl bg-slate-800 p-2 text-slate-300" aria-label="Закрити"><X className="h-5 w-5" /></button></div><p className="mt-4 text-sm leading-6 text-slate-400">{dashboardData.message || 'Підключіть identity, database та billing provider перед використанням партнерського кабінету.'}</p><div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-3 font-mono text-xs text-amber-200">STATUS: {dashboardData.status || 'NOT_CONNECTED'}</div></div></div>;
  }

  if (!dashboardData?.partner || !dashboardData?.wallet) {
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"><div className="w-full max-w-md rounded-3xl border border-amber-400/30 bg-[#090D14] p-8"><div className="flex items-start justify-between gap-4"><div><div className="text-[10px] font-mono uppercase tracking-widest text-amber-300">PARTNER PLATFORM</div><h2 className="mt-2 text-xl font-bold text-white">Неповна відповідь partner API</h2></div><button type="button" onClick={onClose} className="rounded-xl bg-slate-800 p-2 text-slate-300" aria-label="Закрити"><X className="h-5 w-5" /></button></div><p className="mt-4 text-sm leading-6 text-slate-400">Кабінет не показує непідтверджені баланси або ранги. Повторіть запит після підключення фінансового backend.</p><div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-3 font-mono text-xs text-amber-200">STATUS: INCOMPLETE_RESPONSE</div></div></div>;
  }

  const partner: PartnerProfile = dashboardData.partner;

  const wallet: WalletProjection = dashboardData.wallet;

  const payoutEligibility = dashboardData?.payoutEligibility;
  const minimumPayoutMinor = Number.isSafeInteger(payoutEligibility?.minimumPayoutMinor)
    ? payoutEligibility.minimumPayoutMinor
    : null;

  const rankProgress = dashboardData.rankProgress;

  const referralUrl = `${window.location.origin}/r/${encodeURIComponent(partner.referralCode)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountMinor = parseMinorUnits(payoutAmount);
    try {
      const res = await fetch('/api/partner/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountMinor,
          provider: payoutProvider,
          destinationAccount: payoutCardNumber
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPayoutSuccessMsg(`Запит на виплату ${payoutAmount} грн успішно прийнято!`);
        fetchPartnerData();
        setTimeout(() => setPayoutSuccessMsg(null), 4000);
      } else {
        alert(data.error || 'Помилка при створенні виплати');
      }
    } catch (err) {
      alert('Помилка мережі при запиті виплати');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-5xl rounded-3xl bg-[#090D14] border border-amber-500/30 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Top Header Banner */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/30 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white font-['Plus_Jakarta_Sans']">
                  Кабінет партнера SIREN UA
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {partner.rank} · {partner.partnerRateBps / 100}%
                </span>
                {partner.qualityScore >= 90 && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Quality: {partner.qualityScore}/100
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Реферальний код: <span className="text-amber-300 font-mono font-bold">{partner.referralCode}</span> • Ставка застосовується однаково до L1 та L2
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onSimulateNewSubscriber();
                setTimeout(fetchPartnerData, 400);
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all flex items-center gap-1.5"
              title="Тестова дія: нарахувати комісію за нового платника"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>+1 Платний підписник</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-800 bg-slate-950/60 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'OVERVIEW'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Огляд & Фінанси
          </button>

          <button
            onClick={() => setActiveTab('TOOLKIT')}
            className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'TOOLKIT'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Share2 className="w-4 h-4" />
            Інструменти поширення
          </button>

          <button
            onClick={() => setActiveTab('NETWORK')}
            className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'NETWORK'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Мережа L1 / L2 ({networkData.l1.length + networkData.l2.length})
          </button>

          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'LEDGER'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Імутабельний Ledger ({ledgerEntries.length})
          </button>

          <button
            onClick={() => setActiveTab('PAYOUTS')}
            className={`py-3.5 px-4 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'PAYOUTS'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Виведення коштів
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW & WALLET CARDS                                            */}
          {/* ========================================================================= */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              
              {/* Financial KPI Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                
                {/* Available for Payout */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/40">
                  <span className="text-xs text-amber-300 font-medium block">Доступно до виплати:</span>
                  <div className="text-2xl font-extrabold text-amber-400 font-mono mt-1">
                    {(wallet.availableMinor / 100).toLocaleString('uk-UA')} <span className="text-sm font-bold">грн</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Мінімум: еквівалент $10 · FX snapshot</span>
                </div>

                {/* Pending Hold */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium block">В очікуванні (versioned hold policy):</span>
                  <div className="text-2xl font-extrabold text-slate-200 font-mono mt-1">
                    {(wallet.pendingMinor / 100).toLocaleString('uk-UA')} <span className="text-sm font-bold">грн</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Захист від повернень</span>
                </div>

                {/* Lifetime Earned */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium block">Зароблено всього:</span>
                  <div className="text-2xl font-extrabold text-white font-mono mt-1">
                    {(wallet.lifetimeEarnedMinor / 100).toLocaleString('uk-UA')} <span className="text-sm font-bold">грн</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">За весь час співпраці</span>
                </div>

                {/* Paid Out */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium block">Виплачено на карту:</span>
                  <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
                    {(wallet.paidTotalMinor / 100).toLocaleString('uk-UA')} <span className="text-sm font-bold">грн</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Успішно перераховано</span>
                </div>

              </div>

              {/* Rank Progress Bar to Platinum */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs text-slate-400 font-mono">ПОТОЧНИЙ РАНГ:</span>
                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="text-amber-400">{partner.rank} ({partner.partnerRateBps / 100}%)</span>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                      <span className="text-purple-300">Наступний: {rankProgress.nextRank} (25%)</span>
                    </h4>
                  </div>
                  <div className="text-xs text-slate-300 font-mono text-left sm:text-right">
                    <span className="text-amber-400 font-bold">{rankProgress.currentPaidL1}</span> / {rankProgress.targetThreshold} активних L1
                    <div className="text-[11px] text-slate-400">Залишилося: <b className="text-white">{rankProgress.remainingToNext}</b> платних L1</div>
                  </div>
                </div>

                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${rankProgress.percentageToNext}%` }}
                  ></div>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  *Після досягнення рангу Platinum ваша ставка становитиме 25% на всі кваліфіковані L1 та L2 без обмежень за часом.
                </p>
              </div>

              {/* Quick Referral Link Banner */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-left w-full sm:w-auto">
                  <span className="text-xs text-amber-300 font-semibold flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5" />
                    Ваше персональне реферальне посилання:
                  </span>
                  <div className="text-sm text-slate-200 font-mono select-all break-all">
                    {referralUrl}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    onClick={handleCopy}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Скопійовано!' : 'Копіювати'}</span>
                  </button>

                  <button
                    onClick={() => setShowQrModal(!showQrModal)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    title="Показати QR-код"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick QR Code Display if toggled */}
              {showQrModal && (
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-700 flex flex-col items-center text-center animate-fadeIn">
                  <div className="w-44 h-44 rounded-2xl bg-white p-3 flex items-center justify-center shadow-xl mb-3">
                    {/* SVG generated clean QR representation */}
                    <div className="w-full h-full border-4 border-slate-950 p-2 flex flex-col justify-between">
                      <div className="flex justify-between">
                        <div className="w-8 h-8 bg-slate-950"></div>
                        <div className="w-8 h-8 bg-slate-950"></div>
                      </div>
                      <div className="text-[10px] font-mono text-slate-950 font-bold">SIREN UA</div>
                      <div className="flex justify-between">
                        <div className="w-8 h-8 bg-slate-950"></div>
                        <div className="w-6 h-6 bg-slate-950"></div>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-white font-mono">{referralUrl}</span>
                  <p className="text-[11px] text-slate-400 mt-1">Використовуйте для стікерів, відео в TikTok або Telegram-каналів</p>
                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: TOOLKIT & SOCIAL CHANNELS                                         */}
          {/* ========================================================================= */}
          {activeTab === 'TOOLKIT' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Social Share 1: Telegram */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">Telegram канал / чат</h4>
                    <p className="text-xs text-slate-400">Швидка публікація з готовим текстом</p>
                  </div>
                  <button
                    onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent('Дізнавайся точну ситуацію по загрозах у своєму районі з SIREN UA:')}`, '_blank')}
                    className="px-3 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-bold"
                  >
                    Поділитися в TG
                  </button>
                </div>

                {/* Social Share 2: TikTok / Instagram */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">TikTok / Instagram Bio</h4>
                    <p className="text-xs text-slate-400">Скорочене посилання для профілю</p>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 text-xs font-bold"
                  >
                    Скопіювати Bio Link
                  </button>
                </div>

                {/* Social Share 3: Viber / WhatsApp */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">Viber / WhatsApp</h4>
                    <p className="text-xs text-slate-400">Надіслати родичам та колегам</p>
                  </div>
                  <button
                    onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent('Встанови корисний застосунок SIREN UA: ' + referralUrl)}`, '_blank')}
                    className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold"
                  >
                    Поділитися
                  </button>
                </div>

                {/* UTM Generator */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">UTM Генератор</h4>
                    <p className="text-xs text-slate-400">Відстеження окремих відео та кампаній</p>
                  </div>
                  <button
                    onClick={() => alert(`Посилання з UTM: ${referralUrl}?utm_source=tiktok_video_1`)}
                    className="px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold"
                  >
                    Згенерувати UTM
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: NETWORK LIST (L1 and L2 breakdown)                                */}
          {/* ========================================================================= */}
          {activeTab === 'NETWORK' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Показано лише анонімізовані дані відповідно до політики конфіденційності</span>
                <span className="font-mono text-amber-300">L1: {networkData.l1.length} • L2: {networkData.l2.length}</span>
              </div>

              <div className="divide-y divide-slate-800/80 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden text-xs">
                {networkData.l1.slice(0, 10).map((u) => (
                  <div key={u.id} className="p-3.5 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold font-mono">
                        L1
                      </div>
                      <div>
                        <div className="font-bold text-white">{u.userAnonymousLabel}</div>
                        <div className="text-[11px] text-slate-400 font-mono">Канал: {u.sourceChannel} • {u.subscriptionPlan}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.isQualifiedPaid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                        {u.isQualifiedPaid ? 'Кваліфікований платний' : 'Безкоштовний'}
                      </span>
                      <div className="text-[11px] text-amber-400 font-mono font-bold mt-1">
                        +{(u.monthlyQcbMinor * (partner.partnerRateBps / 10000) / 100).toFixed(2)} грн/міс
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: IMMUTABLE LEDGER ENTRIES                                          */}
          {/* ========================================================================= */}
          {activeTab === 'LEDGER' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Подвійний запис (Double-entry) • Жодних прямих змін балансу</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  DOUBLE_ENTRY_VIEW · {ledgerEntries.length ? 'ENTRIES LOADED' : 'NO ENTRIES'}
                </span>
              </div>

              <div className="divide-y divide-slate-800/80 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden text-xs">
                {ledgerEntries.map((e) => (
                  <div key={e.id} className="p-3.5 flex items-center justify-between hover:bg-slate-800/50">
                    <div className="space-y-0.5">
                      <div className="font-bold text-white">{e.description}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        TX: {e.transactionId} • {new Date(e.timestamp).toLocaleTimeString()} • Дебет: {e.debitAccount} → Кредит: {e.creditAccount}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold font-mono text-emerald-400">
                        +{(e.amountMinor / 100).toFixed(2)} грн
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Ставка: {e.rateBps ? e.rateBps / 100 : 20}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: PAYOUT DISPATCH & HISTORY                                         */}
          {/* ========================================================================= */}
          {activeTab === 'PAYOUTS' && (
            <div className="space-y-6">
              
              {payoutSuccessMsg && (
                <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{payoutSuccessMsg}</span>
                </div>
              )}

              {/* Payout Form */}
              <form onSubmit={handleRequestPayout} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  Запит на виведення коштів
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Платіжна система:</label>
                    <select
                      value={payoutProvider}
                      onChange={(e: any) => setPayoutProvider(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                    >
                      <option value="MONOBANK">Monobank (Миттєве P2P зарахування)</option>
                      <option value="LIQPAY">LiqPay / ПриватБанк</option>
                      <option value="IBAN_SEPA">IBAN рахунок (Україна / ЄС)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Номер картки / IBAN:</label>
                    <input
                      type="text"
                      value={payoutCardNumber}
                      onChange={(e) => setPayoutCardNumber(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    Сума виведення (грн) • Доступно: {(wallet.availableMinor / 100).toLocaleString('uk-UA')} грн:
                  </label>
                  <input
                    type="number"
                    min={minimumPayoutMinor === null ? undefined : minimumPayoutMinor / 100}
                    max={wallet.availableMinor / 100}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono text-base font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Мінімум: {minimumPayoutMinor === null ? 'очікує FX snapshot' : `${(minimumPayoutMinor / 100).toLocaleString('uk-UA')} грн`} • Комісія провайдера — за рахунок партнера
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={minimumPayoutMinor === null || wallet.availableMinor < minimumPayoutMinor}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-slate-950 text-xs font-bold transition-all shadow"
                >
                  Підтвердити та вивести кошти
                </button>
              </form>

              {/* Payout History List */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Історія виплат:</h5>
                <div className="divide-y divide-slate-800/80 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden text-xs">
                  {payoutsList.map((po) => (
                    <div key={po.id} className="p-3.5 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">Виплата {po.id} ({po.provider})</div>
                        <div className="text-[10px] text-slate-500 font-mono">{po.destinationAccount} • {new Date(po.requestedAt).toLocaleDateString()}</div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold font-mono text-white">
                          {(po.amountMinor / 100).toFixed(2)} грн
                        </span>
                        <div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                            {po.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
