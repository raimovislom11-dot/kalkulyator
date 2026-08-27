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
  const [activePendingFilter, setActivePendingFilter] = useState<'ALL' | string>('ALL');
  const [activeClosedFilter, setActiveClosedFilter] = useState<'ALL' | AISignalOutcome>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAsset, setFilterAsset] = useState<string>('ALL');
  const [showLearningModal, setShowLearningModal] = useState(false);
  const [activeReasonModalSignalId, setActiveReasonModalSignalId] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<AISignalMistakeReason>('NO_SWEEP');
  const [customMistakeNote, setCustomMistakeNote] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedAnalysisId, setExpandedAnalysisId] = useState<string | null>(null);
  const [selectedDetailSignal, setSelectedDetailSignal] = useState<AISignal | null>(null);

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

  // Split into Pending (Active cards) and Closed (Table rows)
  const pendingSignals = useMemo(() => {
    return signals.filter(s => s.outcome === 'PENDING');
  }, [signals]);

  const closedSignals = useMemo(() => {
    return signals.filter(s => s.outcome !== 'PENDING');
  }, [signals]);

  // Filtered Pending Signals
  const filteredPendingSignals = useMemo(() => {
    return pendingSignals.filter(s => {
      if (filterAsset !== 'ALL' && s.symbol?.toUpperCase() !== filterAsset.toUpperCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const str = `${s.asset} ${s.symbol} ${s.strategy} ${s.direction} ${s.entry} ${s.fullAnalysisText || ''}`.toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [pendingSignals, filterAsset, searchQuery]);

  // Filtered Closed Signals for the Table
  const filteredClosedSignals = useMemo(() => {
    return closedSignals.filter(s => {
      if (activeClosedFilter !== 'ALL' && s.outcome !== activeClosedFilter) return false;
      if (filterAsset !== 'ALL' && s.symbol?.toUpperCase() !== filterAsset.toUpperCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const str = `${s.asset} ${s.symbol} ${s.strategy} ${s.direction} ${s.entry} ${s.mistakeNote || ''} ${s.aiLearnedLesson || ''}`.toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [closedSignals, activeClosedFilter, filterAsset, searchQuery]);

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
    if (window.confirm("Rostdan ham ushbu signalni arxivdan o'chirmoqchimisiz?")) {
      signalsStore.remove(id);
      setSignals(signalsStore.getAll());
      if (selectedDetailSignal?.id === id) {
        setSelectedDetailSignal(null);
      }
    }
  };

  const handleCopySignal = (sig: AISignal) => {
    const text =
      `⚡ SAVDO SIGNALI • ${sig.asset || sig.symbol}\n` +
      `● Yo'nalish: ${sig.direction === 'BUY' ? '🟢 BUY' : sig.direction === 'SELL' ? '🔴 SELL' : '⏸️ KUTISH'}\n` +
      `● Kirish (Entry): ${sig.entry}\n` +
      `● Stop Loss: ${sig.sl}\n` +
      `● TP1: ${sig.tp1}` +
      (sig.tp2 ? `\n● TP2: ${sig.tp2}` : '') +
      (sig.tp3 ? `\n● TP3: ${sig.tp3}` : '') +
      (sig.rr ? `\n● R:R: ${sig.rr}` : '') +
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
    <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-6 backdrop-blur-xl shadow-2xl space-y-7 mt-6 relative overflow-hidden" id="ai-signals-section">
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
                Ochiq signallar kartochka ko&apos;rinishida, natijasi belgilangan savdolar esa pastki jadvalda saqlanadi
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
          <div className="text-slate-500 text-[10px] mt-0.5">Barcha signallar</div>
        </div>

        {/* Pending */}
        <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl shadow-md">
          <div className="text-amber-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Kutilmoqda (Ochiq)</span>
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
          <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">⚠️ Limitga Yetmadi</div>
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

      {/* Global Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">Filtr:</span>
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
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Aktiv, narx yoki izoh bo'yicha qidirish..."
            className="bg-slate-900 text-white placeholder-slate-500 text-xs px-3 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-indigo-500 w-48 sm:w-64 font-medium"
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

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ─── 1. OCHIQ / KUTILAYOTGAN SIGNALLAR (KARTALAR KO'RINIShIDA) ─── */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">⏳</span>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Ochiq / Kutilayotgan Signallar
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/30">
              {filteredPendingSignals.length} ta ochiq
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Natijasi belgilangach, avtomatik ravishda pastdagi jadvalga o&apos;tadi
          </span>
        </div>

        {filteredPendingSignals.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 space-y-2">
            <span className="text-3xl block opacity-60">🎯</span>
            <div className="text-slate-300 font-bold text-sm">Hozirda kutilayotgan ochiq signallar yo&apos;q</div>
            <p className="text-slate-500 text-xs max-w-md mx-auto">
              AI tahlil yoki Kalkulyator orqali yangi hisob-kitob qilib, <strong>&quot;Arxivga qo&apos;shish&quot;</strong> tugmasini bosing.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPendingSignals.map(sig => {
              const isBuy = sig.direction === 'BUY';
              const isSell = sig.direction === 'SELL';

              return (
                <div
                  key={sig.id}
                  className="bg-slate-950/90 border border-amber-500/30 shadow-amber-950/20 rounded-2xl p-4 space-y-3.5 transition-all shadow-xl hover:border-amber-500/50"
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
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-black border bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse">
                        ⏳ KUTILMOQDA
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
                    <div className="bg-slate-900/90 p-2 rounded-xl border border-cyan-500/30">
                      <span className="text-cyan-400 text-[9px] block uppercase font-bold">Entry</span>
                      <span className="text-white font-bold text-[11px] sm:text-xs">{sig.entry || '—'}</span>
                    </div>
                    <div className="bg-red-950/30 p-2 rounded-xl border border-red-500/40">
                      <span className="text-red-400 text-[9px] block uppercase font-bold">Stop Loss</span>
                      <span className="text-red-300 font-bold text-[11px] sm:text-xs">{sig.sl || '—'}</span>
                    </div>
                    <div className="bg-emerald-950/30 p-2 rounded-xl border border-emerald-500/40">
                      <span className="text-emerald-400 text-[9px] block uppercase font-bold">TP 1</span>
                      <span className="text-emerald-300 font-bold text-[11px] sm:text-xs">{sig.tp1 || '—'}</span>
                    </div>
                    <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[9px] block uppercase font-bold">TP 2 / 3</span>
                      <span className="text-sky-300 font-bold text-[11px] sm:text-xs">{sig.tp2 || sig.tp3 || '—'}</span>
                    </div>
                  </div>

                  {/* Full Analysis text toggle if exists */}
                  {sig.fullAnalysisText && (
                    <div>
                      <button
                        onClick={() =>
                          setExpandedAnalysisId(expandedAnalysisId === sig.id ? null : sig.id)
                        }
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
                      >
                        <span>{expandedAnalysisId === sig.id ? '▲ Tahlil matnini yopish' : '▼ Tahlil matnini ko\'rish'}</span>
                      </button>
                      {expandedAnalysisId === sig.id && (
                        <pre className="mt-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-sans whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                          {sig.fullAnalysisText}
                        </pre>
                      )}
                    </div>
                  )}

                  {/* Action status change buttons (Mark as TP, SL, Missed) */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                      <span>⚡</span>
                      <span>Natijani belgilash:</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleSetOutcome(sig.id, 'TP_HIT')}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/40 shadow transition-all active:scale-95 flex items-center gap-1"
                      >
                        <span>🎯</span>
                        <span>TP Oldi</span>
                      </button>
                      <button
                        onClick={() => handleSetOutcome(sig.id, 'SL_HIT')}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 shadow transition-all active:scale-95 flex items-center gap-1"
                      >
                        <span>🛑</span>
                        <span>SL Oldi</span>
                      </button>
                      <button
                        onClick={() => handleSetOutcome(sig.id, 'MISSED_LIMIT')}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 shadow transition-all active:scale-95 flex items-center gap-1"
                      >
                        <span>⚠️</span>
                        <span>Limitga yetmadi</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ─── 2. YOPILGAN SAVDOLAR VA NATIJALAR ARXIVI (TABLITSA) ─── */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="space-y-4 pt-4 border-t border-slate-800 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>Yopilgan Savdolar va Natijalar Arxivi</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold border border-indigo-500/30">
                  {closedSignals.length} ta yopilgan
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                TP, SL yoki Limitga yetmagan barcha yakunlangan savdolar statistik jadvali
              </p>
            </div>
          </div>

          {/* Table Filters */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveClosedFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                activeClosedFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow border border-slate-600'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Barchasi ({closedSignals.length})
            </button>
            <button
              onClick={() => setActiveClosedFilter('TP_HIT')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                activeClosedFilter === 'TP_HIT'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              🎯 TP ({stats.tpHit})
            </button>
            <button
              onClick={() => setActiveClosedFilter('SL_HIT')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                activeClosedFilter === 'SL_HIT'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              🛑 SL ({stats.slHit})
            </button>
            <button
              onClick={() => setActiveClosedFilter('MISSED_LIMIT')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                activeClosedFilter === 'MISSED_LIMIT'
                  ? 'bg-slate-800 text-slate-200 border border-slate-600'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚠️ Limit ({stats.missed})
            </button>
          </div>
        </div>

        {/* ─── TABLE VIEW ─── */}
        {filteredClosedSignals.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 space-y-2">
            <span className="text-3xl block opacity-60">📋</span>
            <div className="text-slate-300 font-bold text-sm">Hozircha yopilgan savdolar yo&apos;q</div>
            <p className="text-slate-500 text-xs max-w-md mx-auto">
              Yuqoridagi ochiq signallarga <strong>&quot;TP Oldi&quot;</strong>, <strong>&quot;SL Oldi&quot;</strong> yoki <strong>&quot;Limitga yetmadi&quot;</strong> deb belgilaganingizdan so&apos;ng, ular avtomatik ravishda ushbu jadvalga qo&apos;shiladi.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80 shadow-2xl">
            <table className="w-full text-left text-xs font-medium border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3.5">Sana / Vaqt</th>
                  <th className="py-3 px-3.5">Aktiv &amp; TF</th>
                  <th className="py-3 px-3.5">Yo&apos;nalish</th>
                  <th className="py-3 px-3.5">Manba</th>
                  <th className="py-3 px-3.5">Strategiya</th>
                  <th className="py-3 px-3.5 font-mono">Entry</th>
                  <th className="py-3 px-3.5 font-mono text-red-400">Stop Loss</th>
                  <th className="py-3 px-3.5 font-mono text-emerald-400">TP Darajalari</th>
                  <th className="py-3 px-3.5 text-center">Natija</th>
                  <th className="py-3 px-3.5">Xato sababi / Xulosa</th>
                  <th className="py-3 px-3.5 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredClosedSignals.map((sig, idx) => {
                  const isBuy = sig.direction === 'BUY';
                  const isSell = sig.direction === 'SELL';
                  const isTpHit = sig.outcome === 'TP_HIT';
                  const isSlHit = sig.outcome === 'SL_HIT';
                  const isMissed = sig.outcome === 'MISSED_LIMIT';

                  let outcomeBadge = (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black border bg-slate-800 text-slate-300 border-slate-700 inline-flex items-center gap-1">
                      ⚠️ Limitga yetmadi
                    </span>
                  );

                  if (isTpHit) {
                    outcomeBadge = (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black border bg-emerald-500/20 text-emerald-300 border-emerald-500/40 inline-flex items-center gap-1 shadow-sm">
                        🎯 TP Oldi (Foyda)
                      </span>
                    );
                  } else if (isSlHit) {
                    outcomeBadge = (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black border bg-rose-500/20 text-rose-300 border-rose-500/40 inline-flex items-center gap-1 shadow-sm">
                        🛑 SL Oldi (Zarar)
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={sig.id}
                      className={`transition-colors hover:bg-slate-900/60 ${
                        isTpHit
                          ? 'hover:bg-emerald-950/20'
                          : isSlHit
                          ? 'hover:bg-rose-950/20'
                          : ''
                      }`}
                    >
                      {/* Sana & Vaqt */}
                      <td className="py-3 px-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        <div>
                          {new Date(sig.createdAt).toLocaleDateString('uz-UZ', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(sig.createdAt).toLocaleTimeString('uz-UZ', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Aktiv & TF */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-bold text-white text-xs">{sig.asset || sig.symbol}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{sig.timeframe || '1H'}</div>
                      </td>

                      {/* Yo'nalish */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-black border ${
                            isBuy
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : isSell
                              ? 'bg-red-500/20 text-red-300 border-red-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {isBuy ? '▲ BUY' : isSell ? '▼ SELL' : '⏸️ WAIT'}
                        </span>
                      </td>

                      {/* Manba */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {sig.source === 'manual' ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            ✏️ Qo&apos;lda
                          </span>
                        ) : sig.source === 'trap-hunter' ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                            🪤 Trap
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                            🤖 AI
                          </span>
                        )}
                      </td>

                      {/* Strategiya */}
                      <td className="py-3 px-3.5 max-w-[150px] truncate text-slate-300 text-xs">
                        {sig.strategy || 'SMC/ICT'}
                      </td>

                      {/* Entry */}
                      <td className="py-3 px-3.5 font-mono text-cyan-300 font-bold text-xs whitespace-nowrap">
                        {sig.entry}
                      </td>

                      {/* Stop Loss */}
                      <td className="py-3 px-3.5 font-mono text-red-300 font-bold text-xs whitespace-nowrap">
                        {sig.sl}
                      </td>

                      {/* TP Darajalari */}
                      <td className="py-3 px-3.5 font-mono text-emerald-300 text-xs whitespace-nowrap">
                        <div>TP1: {sig.tp1}</div>
                        {(sig.tp2 || sig.tp3) && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {sig.tp2 ? `TP2: ${sig.tp2}` : ''} {sig.tp3 ? `TP3: ${sig.tp3}` : ''}
                          </div>
                        )}
                      </td>

                      {/* Natija Badge */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        {outcomeBadge}
                      </td>

                      {/* Xato sababi / AI sabog'i */}
                      <td className="py-3 px-3.5 max-w-[200px] text-xs">
                        {isSlHit && sig.mistakeReason ? (
                          <div className="space-y-0.5">
                            <div className="text-rose-400 font-bold text-[11px] truncate">
                              ⚠️ {MISTAKE_REASON_LABELS[sig.mistakeReason]}
                            </div>
                            {sig.mistakeNote && (
                              <div className="text-slate-400 text-[10px] italic truncate">
                                &quot;{sig.mistakeNote}&quot;
                              </div>
                            )}
                          </div>
                        ) : isMissed ? (
                          <span className="text-slate-400 text-[11px]">Limit narxiga yetmadi</span>
                        ) : isTpHit ? (
                          <span className="text-emerald-400 font-bold text-[11px]">✓ Maqsadga yetdi</span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Amallar */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Reopen / Move back to Pending */}
                          <button
                            onClick={() => handleSetOutcome(sig.id, 'PENDING')}
                            title="Qayta kutilayotgan (Ochiq) holatiga qaytarish"
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-[11px] font-bold rounded-lg border border-slate-700 transition-all flex items-center gap-1"
                          >
                            <span>🔄</span>
                            <span>Qayta ochish</span>
                          </button>

                          {/* Details modal trigger if full analysis exists */}
                          {sig.fullAnalysisText && (
                            <button
                              onClick={() => setSelectedDetailSignal(sig)}
                              title="To'liq tahlilni ko'rish"
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs transition-colors"
                            >
                              🔍
                            </button>
                          )}

                          {/* Copy */}
                          <button
                            onClick={() => handleCopySignal(sig)}
                            title="Nusxalash"
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs transition-colors"
                          >
                            {copiedId === sig.id ? '✓' : '📋'}
                          </button>

                          {/* Telegram Share */}
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
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 text-xs transition-colors"
                            >
                              ✈️
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(sig.id)}
                            title="O'chirish"
                            className="p-1 rounded hover:bg-red-950/50 text-slate-500 hover:text-red-400 text-xs transition-colors"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── MODAL: TO'LIQ TAHLILNI KO'RISH (DETAIL MODAL) ─── */}
      {selectedDetailSignal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📑</span>
                <div>
                  <h3 className="text-white font-black text-sm">
                    {selectedDetailSignal.asset || selectedDetailSignal.symbol} • {selectedDetailSignal.strategy}
                  </h3>
                  <p className="text-slate-400 text-[11px]">
                    {new Date(selectedDetailSignal.createdAt).toLocaleString('uz-UZ')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetailSignal(null)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono text-center text-xs">
              <div className="bg-slate-950 p-2 rounded-xl border border-cyan-500/30">
                <span className="text-cyan-400 text-[9px] block">ENTRY</span>
                <span className="text-white font-bold">{selectedDetailSignal.entry}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-xl border border-red-500/30">
                <span className="text-red-400 text-[9px] block">STOP LOSS</span>
                <span className="text-red-300 font-bold">{selectedDetailSignal.sl}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-xl border border-emerald-500/30">
                <span className="text-emerald-400 text-[9px] block">TP1</span>
                <span className="text-emerald-300 font-bold">{selectedDetailSignal.tp1}</span>
              </div>
            </div>

            {selectedDetailSignal.fullAnalysisText && (
              <div className="space-y-1">
                <span className="text-slate-400 text-xs font-bold">To&apos;liq tahlil matni:</span>
                <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-slate-300 text-xs font-sans whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {selectedDetailSignal.fullAnalysisText}
                </pre>
              </div>
            )}

            {selectedDetailSignal.aiLearnedLesson && (
              <div className="bg-violet-950/30 border border-violet-500/30 p-3 rounded-xl text-xs space-y-1">
                <span className="text-violet-300 font-bold text-[11px] block">💡 AI Xulosasi va Sabog&apos;i:</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {selectedDetailSignal.aiLearnedLesson}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedDetailSignal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Yopish
              </button>
            </div>
          </div>
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
