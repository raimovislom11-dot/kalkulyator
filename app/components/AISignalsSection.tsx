'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import type {
  AISignal,
  AISignalOutcome,
  AISignalMistakeReason,
} from '../lib/types';
import {
  signalsStore,
  MISTAKE_REASON_LABELS,
  MISTAKE_AI_LESSONS,
} from '../lib/signalsStore';

interface AISignalsSectionProps {
  currentAssetSymbol?: string;
  isAdmin?: boolean;
  onOpenTelegram?: (data: any) => void;
}

const REASONS: AISignalMistakeReason[] = [
  'NO_SWEEP',
  'EARLY_ENTRY',
  'NEWS_VOLATILITY',
  'COUNTER_TREND',
  'MISSED_FVG',
  'SL_TOO_TIGHT',
  'CHOPPY_MARKET',
  'OTHER',
];

function AISignalsSection({
  currentAssetSymbol,
  isAdmin = false,
  onOpenTelegram,
}: AISignalsSectionProps) {
  const [signals, setSignals] = useState<AISignal[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | AISignalOutcome>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAsset, setFilterAsset] = useState<string>('ALL');
  const [showLearningModal, setShowLearningModal] = useState(false);
  const [activeReasonModalSignalId, setActiveReasonModalSignalId] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<AISignalMistakeReason>('NO_SWEEP');
  const [customMistakeNote, setCustomMistakeNote] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load signals on mount and dynamic sync
  useEffect(() => {
    const refresh = () => setSignals(signalsStore.getAll());
    refresh();
    signalsStore.fetchRemote().then(res => {
      if (res && res.length > 0) setSignals(res);
    });

    window.addEventListener('signals_updated', refresh);
    window.addEventListener('storage', refresh);
    const interval = setInterval(refresh, 3000);

    return () => {
      window.removeEventListener('signals_updated', refresh);
      window.removeEventListener('storage', refresh);
      clearInterval(interval);
    };
  }, []);

  const stats = useMemo(() => signalsStore.computeStats(signals), [signals]);

  const uniqueAssets = useMemo(() => {
    const set = new Set<string>();
    signals.forEach(s => {
      if (s.symbol) set.add(s.symbol.toUpperCase());
    });
    return Array.from(set);
  }, [signals]);

  const filteredSignals = useMemo(() => {
    return signals.filter(s => {
      if (activeFilter !== 'ALL' && s.outcome !== activeFilter) return false;
      if (filterAsset !== 'ALL' && s.symbol?.toUpperCase() !== filterAsset.toUpperCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const str = `${s.asset} ${s.symbol} ${s.strategy} ${s.direction} ${s.entry} ${s.mistakeNote || ''}`.toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [signals, activeFilter, filterAsset, searchQuery]);

  const handleSetOutcome = (id: string, outcome: AISignalOutcome) => {
    if (outcome === 'SL_HIT') {
      setActiveReasonModalSignalId(id);
      setSelectedReason('NO_SWEEP');
      setCustomMistakeNote('');
      return;
    }

    const updated = signalsStore.updateOutcome(id, outcome);
    if (updated) {
      setSignals(signalsStore.getAll());
    }
  };

  const handleConfirmSLOutcome = () => {
    if (!activeReasonModalSignalId) return;
    signalsStore.updateOutcome(
      activeReasonModalSignalId,
      'SL_HIT',
      selectedReason,
      customMistakeNote.trim() || undefined
    );
    setSignals(signalsStore.getAll());
    setActiveReasonModalSignalId(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Rostdan ham ushbu signalni o'chirmoqchimisiz?")) {
      signalsStore.remove(id);
      setSignals(signalsStore.getAll());
    }
  };

  const handleCopySignal = (sig: AISignal) => {
    const text =
      `⚡ AI SIGNAL • ${sig.asset || sig.symbol}\n` +
      `● Yo'nalish: ${sig.direction === 'BUY' ? '🟢 BUY' : sig.direction === 'SELL' ? '🔴 SELL' : '⏸️ KUTISH'}\n` +
      `● Kirish (Entry): ${sig.entry}\n` +
      `● Stop Loss: ${sig.sl}\n` +
      `● TP1: ${sig.tp1}` +
      (sig.tp2 ? `\n● TP2: ${sig.tp2}` : '') +
      (sig.tp3 ? `\n● TP3: ${sig.tp3}` : '') +
      `\n● Strategiya: ${sig.strategy || '10 ta SMC/ICT'}\n` +
      `● Holati: ${sig.outcome === 'TP_HIT' ? '🎯 TP Oldi' : sig.outcome === 'SL_HIT' ? '🛑 SL Oldi' : sig.outcome === 'MISSED_LIMIT' ? '⚠️ Limitga bormadi' : '⏳ Kutilmoqda'}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(sig.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const learningPrompt = useMemo(
    () => signalsStore.buildAILearningPrompt(signals, currentAssetSymbol),
    [signals, currentAssetSymbol]
  );

  return (
    <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-6 backdrop-blur-xl shadow-2xl space-y-6 mt-6 relative overflow-hidden" id="ai-signals-section">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ─── SECTION HEADER ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-lg shadow-lg shadow-amber-500/20">
              📁
            </div>
            <div>
              <h2 className="text-white font-black text-lg sm:text-xl tracking-tight flex items-center gap-2">
                <span>ARXIV • AI SIGNALLAR VA NATIJALAR</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  SELF-LEARNING AI
                </span>
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                AI tavsiya qilgan barcha signallar arxivi, natijalarni (TP, SL, Limitga bormadi) belgilash va xatolardan saboq olish bo&apos;limi
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Memory Viewer Button */}
          <button
            onClick={() => setShowLearningModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-lg shadow-violet-500/20 flex items-center gap-1.5 active:scale-95 border border-violet-400/30"
          >
            <span>🧠</span>
            <span>AI Xotirasi &amp; Saboqlar</span>
            {stats.slHit + stats.missed > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black animate-pulse">
                {stats.slHit + stats.missed} ta xulosa
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ─── STATS OVERVIEW CARDS ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 relative z-10">
        {/* Total */}
        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl shadow-md">
          <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Jami Signallar</div>
          <div className="text-xl font-black text-white font-mono mt-1">{stats.total}</div>
          <div className="text-slate-500 text-[10px] mt-0.5">Tarixiy baza</div>
        </div>

        {/* Pending */}
        <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl shadow-md">
          <div className="text-amber-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Kutilmoqda</span>
          </div>
          <div className="text-xl font-black text-amber-300 font-mono mt-1">{stats.pending}</div>
          <div className="text-amber-500/70 text-[10px] mt-0.5">Ochiq pozitsiyalar</div>
        </div>

        {/* TP Oldi (Wins) */}
        <div className="bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-xl shadow-md">
          <div className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider">🎯 TP Oldi (Foyda)</div>
          <div className="text-xl font-black text-emerald-300 font-mono mt-1">{stats.tpHit}</div>
          <div className="text-emerald-500/70 text-[10px] mt-0.5">Muvaffaqiyatli</div>
        </div>

        {/* SL Oldi (Losses) */}
        <div className="bg-rose-950/20 border border-rose-500/30 p-3 rounded-xl shadow-md">
          <div className="text-rose-400 text-[10px] uppercase font-bold tracking-wider">🛑 SL Oldi (Zarar)</div>
          <div className="text-xl font-black text-rose-300 font-mono mt-1">{stats.slHit}</div>
          <div className="text-rose-500/70 text-[10px] mt-0.5">AI saboq oladi</div>
        </div>

        {/* Limitga bormadi */}
        <div className="bg-slate-950/80 border border-slate-700/60 p-3 rounded-xl shadow-md">
          <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">⚠️ Limitga Bormadi</div>
          <div className="text-xl font-black text-slate-200 font-mono mt-1">{stats.missed}</div>
          <div className="text-slate-500 text-[10px] mt-0.5">O&apos;tib ketgan / Bekor</div>
        </div>

        {/* Win Rate % */}
        <div className="bg-gradient-to-br from-indigo-950/60 to-purple-950/40 border border-indigo-500/40 p-3 rounded-xl shadow-md">
          <div className="text-indigo-300 text-[10px] uppercase font-bold tracking-wider">AI Win Rate</div>
          <div className="text-xl font-black text-indigo-200 font-mono mt-1">{stats.winRate}%</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(0, stats.winRate))}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── FILTERS & SEARCH BAR ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 relative z-10">
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === 'ALL'
                ? 'bg-slate-800 text-white shadow border border-slate-600'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Barchasi ({stats.total})
          </button>
          <button
            onClick={() => setActiveFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === 'PENDING'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-amber-300 hover:bg-slate-900'
            }`}
          >
            ⏳ Kutilmoqda ({stats.pending})
          </button>
          <button
            onClick={() => setActiveFilter('TP_HIT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === 'TP_HIT'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-900'
            }`}
          >
            🎯 TP Oldi ({stats.tpHit})
          </button>
          <button
            onClick={() => setActiveFilter('SL_HIT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === 'SL_HIT'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-rose-300 hover:bg-slate-900'
            }`}
          >
            🛑 SL Oldi ({stats.slHit})
          </button>
          <button
            onClick={() => setActiveFilter('MISSED_LIMIT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === 'MISSED_LIMIT'
                ? 'bg-slate-800 text-slate-200 border border-slate-600'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            ⚠️ Limitga Bormadi ({stats.missed})
          </button>
        </div>

        {/* Asset Selector & Search */}
        <div className="flex items-center gap-2">
          {uniqueAssets.length > 1 && (
            <select
              value={filterAsset}
              onChange={e => setFilterAsset(e.target.value)}
              className="bg-slate-900 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-indigo-500 font-bold"
            >
              <option value="ALL">Barcha aktivlar</option>
              {uniqueAssets.map(ast => (
                <option key={ast} value={ast}>{ast}</option>
              ))}
            </select>
          )}

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Qidirish..."
              className="bg-slate-900 text-white placeholder-slate-500 text-xs px-3 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-indigo-500 w-32 sm:w-44 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── SIGNALS LIST ─── */}
      {filteredSignals.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 space-y-3">
          <span className="text-4xl block opacity-60">📥</span>
          <div className="text-slate-300 font-bold text-sm">Hozircha saqlangan signallar yo&apos;q</div>
          <p className="text-slate-500 text-xs max-w-md mx-auto">
            AI Tahlili (Jonli grafik, 10 Strategiya yoki Trap Hunter) orqali signal olganingizda, <strong>&quot;📥 Signallar bo&apos;limiga qo&apos;shish&quot;</strong> tugmasini bosing. Signallar bu yerda saqlanadi va ularning natijasini belgilashingiz mumkin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          {filteredSignals.map(sig => {
            const isBuy = sig.direction === 'BUY';
            const isSell = sig.direction === 'SELL';
            const isWait = sig.direction === 'WAIT';

            const isPending = sig.outcome === 'PENDING';
            const isTpHit = sig.outcome === 'TP_HIT';
            const isSlHit = sig.outcome === 'SL_HIT';
            const isMissed = sig.outcome === 'MISSED_LIMIT';

            let outcomeBadgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
            let outcomeLabel = '⏳ KUTILMOQDA';
            if (isTpHit) {
              outcomeBadgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
              outcomeLabel = '🎯 TP OLDI (FOYDA)';
            } else if (isSlHit) {
              outcomeBadgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
              outcomeLabel = '🛑 SL OLDI (ZARAR)';
            } else if (isMissed) {
              outcomeBadgeBg = 'bg-slate-800 text-slate-300 border-slate-600';
              outcomeLabel = '⚠️ LIMITGA BORMADI';
            }

            return (
              <div
                key={sig.id}
                className={`bg-slate-950/90 border rounded-xl p-4 space-y-3.5 transition-all shadow-xl hover:border-slate-600 ${
                  isTpHit
                    ? 'border-emerald-500/30 shadow-emerald-950/20'
                    : isSlHit
                    ? 'border-rose-500/30 shadow-rose-950/20'
                    : isPending
                    ? 'border-amber-500/30 shadow-amber-950/20'
                    : 'border-slate-800'
                }`}
              >
                {/* Header info */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-white">{sig.asset || sig.symbol}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-bold">
                      {sig.timeframe || '1H'}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-md font-black border ${
                        isBuy
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : isSell
                          ? 'bg-red-500/20 text-red-300 border-red-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {isBuy ? '🟢 BUY' : isSell ? '🔴 SELL' : '⏸️ KUTISH'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black border ${outcomeBadgeBg}`}>
                      {outcomeLabel}
                    </span>
                    <button
                      onClick={() => handleCopySignal(sig)}
                      title="Signalni nusxalash"
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white text-xs transition-colors"
                    >
                      {copiedId === sig.id ? '✓' : '📋'}
                    </button>
                    {onOpenTelegram && (
                      <button
                        onClick={() =>
                          onOpenTelegram({
                            asset: sig.asset || sig.symbol,
                            strategy: sig.strategy,
                            direction: sig.direction,
                            entry: sig.entry,
                            sl: sig.sl,
                            tp1: sig.tp1,
                            tp2: sig.tp2,
                            tp3: sig.tp3,
                          })
                        }
                        title="Telegramga ulashish"
                        className="p-1 rounded hover:bg-slate-800 text-sky-400 hover:text-sky-300 text-xs transition-colors"
                      >
                        ✈️
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(sig.id)}
                      title="O'chirish"
                      className="p-1 rounded hover:bg-red-950/40 text-slate-500 hover:text-red-400 text-xs transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Strategy & Date */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5 truncate max-w-[250px]">
                    {sig.source === 'manual' ? (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        ✏️ Qo&apos;lda
                      </span>
                    ) : sig.source === 'trap-hunter' ? (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                        🪤 Trap Hunter
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                        🤖 AI
                      </span>
                    )}
                    <span className="truncate text-indigo-300 font-semibold">
                      ⚡ {sig.strategy || '10 ta SMC/ICT Strategiya'}
                    </span>
                  </div>
                  <span className="font-mono text-slate-500 text-[10px]">
                    {new Date(sig.createdAt).toLocaleString('uz-UZ', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Price levels grid */}
                <div className="grid grid-cols-4 gap-1.5 font-mono text-center text-xs">
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[9px] block uppercase">Entry</span>
                    <span className="text-white font-bold text-[11px] sm:text-xs">{sig.entry || '—'}</span>
                  </div>
                  <div className="bg-red-950/30 p-2 rounded-lg border border-red-500/30">
                    <span className="text-red-400 text-[9px] block uppercase">Stop Loss</span>
                    <span className="text-red-300 font-bold text-[11px] sm:text-xs">{sig.sl || '—'}</span>
                  </div>
                  <div className="bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/30">
                    <span className="text-emerald-400 text-[9px] block uppercase">TP 1</span>
                    <span className="text-emerald-300 font-bold text-[11px] sm:text-xs">{sig.tp1 || '—'}</span>
                  </div>
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[9px] block uppercase">TP 2 / 3</span>
                    <span className="text-sky-300 font-bold text-[11px] sm:text-xs">{sig.tp2 || sig.tp3 || '—'}</span>
                  </div>
                </div>

                {/* Mistake & Learning Reason Box if SL or Missed */}
                {(isSlHit || isMissed) && (
                  <div className="bg-slate-900/90 border border-rose-500/30 rounded-lg p-2.5 text-xs space-y-1 text-slate-300">
                    <div className="flex items-center gap-1.5 text-rose-400 font-bold text-[11px]">
                      <span>⚠️ Xato sababi:</span>
                      <span>
                        {sig.mistakeReason ? MISTAKE_REASON_LABELS[sig.mistakeReason] : (sig.mistakeNote || 'Belgilanmagan')}
                      </span>
                    </div>
                    {sig.aiLearnedLesson && (
                      <p className="text-slate-400 text-[10px] leading-relaxed italic">
                        💡 <strong>AI xulosasi:</strong> {sig.aiLearnedLesson}
                      </p>
                    )}
                  </div>
                )}

                {/* Action status change buttons */}
                <div className="pt-1 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Natijani belgilash:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSetOutcome(sig.id, 'TP_HIT')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                        isTpHit
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                          : 'bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      🎯 TP Oldi
                    </button>
                    <button
                      onClick={() => handleSetOutcome(sig.id, 'SL_HIT')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                        isSlHit
                          ? 'bg-rose-500 text-white font-black shadow-md'
                          : 'bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      🛑 SL Oldi
                    </button>
                    <button
                      onClick={() => handleSetOutcome(sig.id, 'MISSED_LIMIT')}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                        isMissed
                          ? 'bg-slate-700 text-white font-black shadow-md'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                      }`}
                    >
                      ⚠️ Limitga yetmadi
                    </button>
                    {!isPending && (
                      <button
                        onClick={() => handleSetOutcome(sig.id, 'PENDING')}
                        title="Qayta kutilmoqda holatiga o'tkazish"
                        className="px-1.5 py-1 rounded-md text-[11px] text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                      >
                        ⏳
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── MODAL: SL SABABINI TANLASH (MISTAKE REASON SELECTOR) ─── */}
      {activeReasonModalSignalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛑</span>
                <div>
                  <h3 className="text-white font-black text-sm">SL SABABINI BELGILASH</h3>
                  <p className="text-slate-400 text-[11px]">AI ushbu xatoni ko&apos;rib kelgusi tahlilda takrorlamaydi</p>
                </div>
              </div>
              <button
                onClick={() => setActiveReasonModalSignalId(null)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-slate-300 text-xs font-bold block">
                Qaysi sababga ko&apos;ra SL urildi?
              </label>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {REASONS.map(reasonKey => (
                  <button
                    key={reasonKey}
                    type="button"
                    onClick={() => setSelectedReason(reasonKey)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between border ${
                      selectedReason === reasonKey
                        ? 'bg-rose-500/20 text-rose-200 border-rose-500/50 shadow-md font-bold'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <span>{MISTAKE_REASON_LABELS[reasonKey]}</span>
                    {selectedReason === reasonKey && <span className="text-rose-400">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Lesson Preview */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <span className="text-amber-400 font-bold text-[10px] uppercase block">AI Chiqaradigan Xulosa:</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {MISTAKE_AI_LESSONS[selectedReason]}
              </p>
            </div>

            {/* Optional Custom Note */}
            <div>
              <label className="text-slate-400 text-[11px] block mb-1">
                Qo&apos;shimcha izoh (ixtiyoriy):
              </label>
              <input
                type="text"
                value={customMistakeNote}
                onChange={e => setCustomMistakeNote(e.target.value)}
                placeholder="Masalan: NY sessiyasi ochilishida spred kengaydi..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-rose-500"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveReasonModalSignalId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleConfirmSLOutcome}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-xs font-black shadow-lg shadow-rose-500/25"
              >
                ✓ SL va Saboqni Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: AI XOTIRASI VA O'RGANISHLAR KO'RINIShI ─── */}
      {showLearningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-violet-500/40 rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧠</span>
                <div>
                  <h3 className="text-white font-black text-base">AI XOTIRASI VA O&apos;Z-O&apos;ZINI O&apos;RGATISH BAZASI</h3>
                  <p className="text-slate-400 text-xs">AI har bir yangi tahlilda o&apos;tmishdagi xatolar va saboqlarni avtomatik hisobga oladi</p>
                </div>
              </div>
              <button
                onClick={() => setShowLearningModal(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            {/* Prompt context view */}
            <div className="space-y-2">
              <div className="text-slate-300 font-bold text-xs flex items-center justify-between">
                <span>AI ga yuboriladigan xotira prompti:</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">● Active Feedback Loop</span>
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                {learningPrompt || "Hozircha xatoliklar yoki signallar tarixi to'planmagan. Signallar saqlanib SL yoki TP belgilangandan so'ng AI xotirasi bu yerda aks etadi."}
              </pre>
            </div>

            {/* AI Learning Principles */}
            <div className="bg-gradient-to-br from-violet-950/40 to-indigo-950/40 border border-violet-500/30 p-4 rounded-xl text-xs space-y-2 text-slate-200">
              <div className="font-bold text-violet-300 flex items-center gap-1.5">
                <span>⚡</span>
                <span>AI Tahlil qilishda qanday o&apos;rganadi?</span>
              </div>
              <ul className="space-y-1 text-slate-400 text-[11px] list-disc list-inside">
                <li>SL bo&apos;lgan signallarning sabablarini tahlil qilib, kelgusi tahlillarda shubhali zonalarda signal bermaydi.</li>
                <li>Likvidlik olinmagan bo&apos;lsa erta kirmaslikni va 1m/5m dagi tasdiqni kutishni ta&apos;kidlaydi.</li>
                <li>Limitga yetmagan holatlarda Entry darajasini FVG va Order Block muvozanatiga yaqinroq belgilaydi.</li>
              </ul>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowLearningModal(false)}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs"
              >
                Tushundim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(AISignalsSection);
