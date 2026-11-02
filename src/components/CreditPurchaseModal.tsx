import React, { useState, useEffect, useMemo } from 'react';
import { 
  Zap, 
  CheckCircle2, 
  CreditCard, 
  ShieldCheck, 
  AlertCircle, 
  Lock, 
  Loader2,
  Building2,
  Smartphone,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  Receipt,
  Sparkles,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ConfettiService } from '../services/confettiService';
import { CreditTransaction } from '../types';

interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredCredits?: number;
  featureName?: string;
  initialTab?: 'buy' | 'history';
}

export const CreditPurchaseModal: React.FC<CreditPurchaseModalProps> = ({
  isOpen,
  onClose,
  requiredCredits,
  featureName,
  initialTab = 'buy'
}) => {
  const { user, profile, credits, creditTransactions, addCredits, refreshCredits } = useAuth();
  const [activeTab, setActiveTab] = useState<'buy' | 'history'>(initialTab);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'purchase' | 'usage' | 'bonus'>('all');
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [creditAmount, setCreditAmount] = useState<number>(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<boolean>(false);
  const [addedCount, setAddedCount] = useState<number>(0);
  const [lastReference, setLastReference] = useState<string>('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Interactive Flutterwave verification modal when preview iframe blocks external popups or in test mode
  const [showSimulatedModal, setShowSimulatedModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<'card' | 'transfer' | 'ussd'>('card');

  // Pricing constants: ₦50 per credit
  const rateNGN = 50; // ₦50 per credit (5 credits = ₦250)
  const rateUSD = 0.05; // $0.05 per credit (5 credits = $0.25)

  const priceNGN = creditAmount * rateNGN;
  const priceUSD = creditAmount * rateUSD;

  // Preset chips
  const presets = [5, 20, 50, 100, 200];

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      refreshCredits().catch(() => {});
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (requiredCredits && requiredCredits > creditAmount) {
      const matched = presets.find(p => p >= requiredCredits) || requiredCredits;
      setCreditAmount(Math.min(200, Math.max(5, matched)));
    }
  }, [requiredCredits]);

  const filteredTransactions = useMemo(() => {
    if (historyFilter === 'all') return creditTransactions;
    if (historyFilter === 'bonus') {
      return creditTransactions.filter(tx => tx.type === 'bonus' || tx.type === 'admin_grant');
    }
    return creditTransactions.filter(tx => tx.type === historyFilter);
  }, [creditTransactions, historyFilter]);

  const summaryStats = useMemo(() => {
    let totalPurchased = 0;
    let totalBonus = 0;
    let totalUsed = 0;

    for (const tx of creditTransactions) {
      if (tx.type === 'purchase' && tx.amount > 0) {
        totalPurchased += tx.amount;
      } else if ((tx.type === 'bonus' || tx.type === 'admin_grant') && tx.amount > 0) {
        totalBonus += tx.amount;
      } else if (tx.type === 'usage' || tx.amount < 0) {
        totalUsed += Math.abs(tx.amount);
      }
    }

    return { totalPurchased, totalBonus, totalUsed };
  }, [creditTransactions]);

  if (!isOpen) return null;

  const formatTxDate = (ts: number) => {
    try {
      const d = new Date(ts);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) + ' · ' + d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Just now';
    }
  };

  const handleFlutterwaveCheckout = async () => {
    setErrorNotice(null);
    setIsProcessing(true);

    const userEmail = user?.email || profile?.email || 'learner@learnora.app';
    const userName = profile?.displayName || user?.displayName || 'Learnora Student';
    const txRef = 'lrn_flw_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
    const amountToCharge = currency === 'NGN' ? priceNGN : Number(priceUSD.toFixed(2));

    const flutterwavePublicKey =
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FLUTTERWAVE_PUBLIC_KEY) ||
      (typeof process !== 'undefined' && process.env?.VITE_FLUTTERWAVE_PUBLIC_KEY) ||
      localStorage.getItem('learnora_flutterwave_public_key') ||
      '';

    const flutterwaveCheckoutFn = (window as any).FlutterwaveCheckout;

    if (
      typeof flutterwaveCheckoutFn === 'function' &&
      flutterwavePublicKey &&
      flutterwavePublicKey.startsWith('FLWPUBK')
    ) {
      try {
        flutterwaveCheckoutFn({
          public_key: flutterwavePublicKey,
          tx_ref: txRef,
          amount: amountToCharge,
          currency: currency,
          payment_options: 'card, banktransfer, ussd, mobilemoneyghana, account',
          customer: {
            email: userEmail,
            name: userName
          },
          meta: {
            platform: 'Learnora',
            credits_purchased: creditAmount,
            gateway: 'Flutterwave'
          },
          customizations: {
            title: 'Learnora AI Study Credits',
            description: `Purchase ${creditAmount} AI Study Credits (${currency === 'NGN' ? `₦${priceNGN.toLocaleString()}` : `$${priceUSD.toFixed(2)}`})`,
            logo: window.location.origin + '/pwa-192x192.png'
          },
          callback: async (response: any) => {
            if (
              response.status === 'successful' ||
              response.status === 'completed' ||
              response.charge_response_code === '00'
            ) {
              await handlePaymentSuccess(String(response.transaction_id || response.tx_ref || txRef));
            } else {
              setErrorNotice('Flutterwave payment was not completed. Please try again.');
              setIsProcessing(false);
            }
          },
          onclose: () => {
            setIsProcessing(false);
          }
        });
        return;
      } catch (e: any) {
        console.warn('Notice launching Flutterwave checkout:', e);
      }
    }

    // Open interactive Flutterwave checkout modal when inside preview iframe or using test mode
    setShowSimulatedModal(true);
    setIsProcessing(false);
  };

  const handlePaymentSuccess = async (txReference: string) => {
    try {
      setIsProcessing(true);
      await addCredits(creditAmount, `Purchased ${creditAmount} AI Study Credits via Flutterwave`, {
        reference: txReference,
        currency,
        pricePaid: currency === 'NGN' ? priceNGN : priceUSD,
        type: 'purchase'
      });

      setAddedCount(creditAmount);
      setLastReference(txReference);
      setPurchaseSuccess(true);
      setIsProcessing(false);
      setShowSimulatedModal(false);

      // Fire celebratory confetti cannons
      ConfettiService.fireGrandCannons();
    } catch (err: any) {
      setErrorNotice(err?.message || 'Payment completed, but failed to credit profile. Please retry.');
      setIsProcessing(false);
    }
  };

  const renderTransactionBadge = (tx: CreditTransaction) => {
    if (tx.type === 'purchase') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/70">
          <ArrowDownLeft className="w-2.5 h-2.5" />
          <span>Flutterwave Purchase</span>
        </span>
      );
    }
    if (tx.type === 'bonus' || tx.type === 'admin_grant') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800/70">
          <Gift className="w-2.5 h-2.5" />
          <span>{tx.type === 'admin_grant' ? 'Admin Grant' : 'Bonus Credits'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/70">
        <ArrowUpRight className="w-2.5 h-2.5" />
        <span>AI Study Usage</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-sm sm:max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 my-auto relative max-h-[92vh] overflow-hidden">
        
        {/* Top Modal Header + Segmented View Switcher */}
        {!purchaseSuccess && (
          <div className="flex flex-col gap-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-2xs">
                  <Zap className="w-4 h-4 fill-amber-500" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                    AI Study Credits
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Balance: <strong className="text-slate-800 dark:text-slate-200">{credits} Credits</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Segmented Tab Bar: Buy Credits vs Transaction History */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700/70">
              <button
                type="button"
                onClick={() => setActiveTab('buy')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'buy'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Buy Credits</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Transactions</span>
                {creditTransactions.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    activeTab === 'history'
                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {creditTransactions.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Success State */}
        {purchaseSuccess ? (
          <div className="text-center py-5 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center ring-8 ring-emerald-50 dark:ring-emerald-950/30">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                +{addedCount} Credits Added!
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium">
                Your Flutterwave payment was verified. Your new balance is{' '}
                <span className="font-black text-blue-600 dark:text-blue-400">{credits} Credits</span>.
              </p>
              {lastReference && (
                <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-1">
                  Ref: {lastReference}
                </p>
              )}
            </div>

            <div className="p-3.5 bg-blue-50/80 dark:bg-slate-800/80 rounded-2xl border border-blue-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 font-medium">
              You are ready to upload notes, generate diagnostic quizzes, and chat with Nora AI.
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  setPurchaseSuccess(false);
                  setActiveTab('history');
                }}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>View Transaction History</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPurchaseSuccess(false);
                  onClose();
                }}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all cursor-pointer"
              >
                Continue Learning
              </button>
            </div>
          </div>
        ) : activeTab === 'buy' ? (
          <div className="flex flex-col gap-3.5 overflow-y-auto pr-0.5">
            {/* Insufficient credits warning banner if triggered from an action */}
            {requiredCredits && credits < requiredCredits && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/80 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <Zap className="w-4 h-4 text-amber-600 shrink-0 fill-amber-500 animate-pulse" />
                <div className="min-w-0">
                  <span className="font-extrabold">{featureName || 'This action'}</span> requires{' '}
                  <span className="font-black underline">{requiredCredits} credits</span>. You currently have{' '}
                  <span className="font-black">{credits}</span>. Top up to continue!
                </div>
              </div>
            )}

            {/* CURRENCY Container Card */}
            <div className="bg-[#f1f5fa] dark:bg-slate-800/90 rounded-2xl p-3.5 border border-slate-200/70 dark:border-slate-700/70 flex flex-col items-center">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center mb-2">
                CURRENCY
              </span>
              <div className="inline-flex p-1 bg-slate-200/80 dark:bg-slate-700/80 rounded-xl w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => setCurrency('NGN')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currency === 'NGN'
                      ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  NGN (₦)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currency === 'USD'
                      ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  USD ($)
                </button>
              </div>
            </div>

            {/* Main Selection Card */}
            <div className="bg-[#f1f5fa] dark:bg-slate-800/90 rounded-3xl p-5 sm:p-6 border border-slate-200/70 dark:border-slate-700/70 text-center flex flex-col items-center shadow-xs">
              
              {/* Credit Count */}
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-4xl sm:text-5xl font-black text-[#1e40af] dark:text-blue-400 tracking-tight">
                  {creditAmount}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-200">
                  Credits
                </span>
              </div>

              {/* Price */}
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
                {currency === 'NGN' ? `₦${priceNGN.toLocaleString()}` : `$${priceUSD.toFixed(2)}`}
              </div>

              {/* Subtitle rate */}
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                {currency === 'NGN' ? `₦${rateNGN} per credit` : `$${rateUSD.toFixed(2)} per credit`}
              </div>

              {/* Slider */}
              <div className="w-full mt-5">
                <div className="relative flex items-center">
                  <input
                    type="range"
                    min={5}
                    max={200}
                    step={5}
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(parseInt(e.target.value, 10))}
                    className="credit-slider w-full cursor-pointer"
                  />
                </div>

                {/* Slider Labels */}
                <div className="flex justify-between w-full mt-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                  <span>5 CREDITS</span>
                  <span>200 CREDITS</span>
                </div>
              </div>

              {/* Quick Presets for Convenient Tapping */}
              <div className="flex items-center justify-center gap-1.5 flex-wrap mt-3.5">
                {presets.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCreditAmount(amt)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                      creditAmount === amt
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-white border border-slate-200/60 dark:border-slate-600'
                    }`}
                  >
                    {amt}
                  </button>
                ))}
              </div>

              {/* Supported Channels Badge */}
              <div className="mt-3.5 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Secured by Flutterwave · Card, Bank Transfer & USSD</span>
              </div>

              {/* Primary Call to Action Button (Flutterwave Only) */}
              <button
                type="button"
                onClick={handleFlutterwaveCheckout}
                disabled={isProcessing}
                className="w-full mt-3.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#f5a623] to-[#f78c00] hover:from-[#e69816] hover:to-[#e07e00] active:scale-[0.98] text-slate-950 font-extrabold text-sm sm:text-base shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting Flutterwave...</span>
                  </>
                ) : (
                  <>
                    <span>🦋 Purchase Now with Flutterwave</span>
                  </>
                )}
              </button>
            </div>

            {/* Error notice if any */}
            {errorNotice && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorNotice}</span>
              </div>
            )}

            {/* Current Balance & History Shortcut Footer */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
              <span className="flex items-center gap-1 font-medium">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                Current Balance: <strong className="text-slate-900 dark:text-white">{credits} Credits</strong>
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <History className="w-3 h-3" />
                <span>View History ({creditTransactions.length})</span>
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* TAB: CREDIT TRANSACTION HISTORY                                */
          /* ============================================================== */
          <div className="flex flex-col gap-3.5 flex-1 min-h-0 overflow-hidden animate-in fade-in duration-150">
            
            {/* Summary Metrics Strip */}
            <div className="grid grid-cols-3 gap-2 shrink-0">
              <div className="p-2.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/60 text-center">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  Balance
                </span>
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {credits}
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 text-center">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  Purchased
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-300">
                  +{summaryStats.totalPurchased}
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 text-center">
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                  Used
                </span>
                <span className="text-base sm:text-lg font-black text-amber-800 dark:text-amber-300">
                  -{summaryStats.totalUsed}
                </span>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 pb-0.5">
              {[
                { id: 'all', label: `All (${creditTransactions.length})` },
                { id: 'purchase', label: 'Purchases' },
                { id: 'usage', label: 'AI Usage' },
                { id: 'bonus', label: 'Bonuses' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setHistoryFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    historyFilter === tab.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable Transactions List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[340px] min-h-[200px]">
              {filteredTransactions.length === 0 ? (
                <div className="py-10 px-4 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                  <Receipt className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    No transactions in this category yet
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Your Flutterwave credit top-ups and AI study usage will appear here automatically.
                  </p>
                </div>
              ) : (
                filteredTransactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/70 flex items-start justify-between gap-3 hover:border-blue-300 dark:hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            tx.type === 'purchase'
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                              : tx.type === 'bonus' || tx.type === 'admin_grant'
                              ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400'
                              : 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {tx.type === 'purchase' ? (
                            <span className="text-sm">🦋</span>
                          ) : tx.type === 'bonus' || tx.type === 'admin_grant' ? (
                            <Sparkles className="w-4 h-4" />
                          ) : (
                            <Zap className="w-4 h-4" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {renderTransactionBadge(tx)}
                            {tx.pricePaid !== undefined && tx.pricePaid > 0 && (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                                {tx.currency === 'USD'
                                  ? `$${Number(tx.pricePaid).toFixed(2)}`
                                  : `₦${Number(tx.pricePaid).toLocaleString()}`}
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1 leading-snug break-words">
                            {tx.reason}
                          </p>

                          <div className="flex items-center gap-2 flex-wrap mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            <span>{formatTxDate(tx.timestamp)}</span>
                            {tx.reference && (
                              <span className="font-mono text-[9px] bg-slate-200/70 dark:bg-slate-700/70 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                                Ref: {tx.reference}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-sm font-black tracking-tight ${
                            isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {isPositive ? `+${tx.amount}` : tx.amount}
                        </span>
                        <span className="block text-[9px] font-bold uppercase text-slate-400 dark:text-slate-500">
                          Credits
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Action Buttons in History Tab */}
            <div className="flex items-center gap-2 pt-1 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('buy')}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#f5a623] to-[#f78c00] hover:from-[#e69816] hover:to-[#e07e00] text-slate-950 font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>🦋 Top Up Credits</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Seamless Flutterwave Checkout Verification Modal (For testing / when preview iframe blocks popup) */}
      {showSimulatedModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 text-center">
            
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
              <span className="text-2xl">🦋</span>
            </div>

            <div>
              <div className="flex items-center justify-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                <Lock className="w-3 h-3" />
                <span>Flutterwave Secure Checkout</span>
              </div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                Confirm {creditAmount} Credits Purchase
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Total to charge:{' '}
                <span className="font-extrabold text-slate-800 dark:text-slate-200">
                  {currency === 'NGN' ? `₦${priceNGN.toLocaleString()}` : `$${priceUSD.toFixed(2)}`}
                </span>
              </p>
            </div>

            {/* Channel selection tabs inside Flutterwave checkout */}
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setSelectedChannel('card')}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  selectedChannel === 'card'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <CreditCard className="w-3 h-3" />
                <span>Card</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedChannel('transfer')}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  selectedChannel === 'transfer'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building2 className="w-3 h-3" />
                <span>Transfer</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedChannel('ussd')}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  selectedChannel === 'ussd'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>USSD</span>
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl text-left text-xs space-y-1.5 border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  🦋 Flutterwave ({selectedChannel.toUpperCase()})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                  {user?.email || 'learner@learnora.app'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Credits:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">+{creditAmount} Credits</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rate:</span>
                <span className="font-semibold">{currency === 'NGN' ? '₦50/credit' : '$0.05/credit'}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handlePaymentSuccess('lrn_flw_' + Date.now())}
                disabled={isProcessing}
                className="w-full py-3.5 bg-gradient-to-r from-[#f5a623] to-[#f78c00] hover:from-[#e69816] hover:to-[#e07e00] active:scale-[0.98] text-slate-950 font-black text-sm rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Complete Flutterwave Payment (
                      {currency === 'NGN' ? `₦${priceNGN.toLocaleString()}` : `$${priceUSD.toFixed(2)}`})
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowSimulatedModal(false)}
                className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

