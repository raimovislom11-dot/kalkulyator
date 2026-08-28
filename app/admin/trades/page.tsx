'use client';

import { useState, useEffect, useMemo } from 'react';
import { tradesStore, settingsStore } from '../../lib/store';
import type { Trade, TradeStrategy, TradeResult } from '../../lib/types';

const STRATEGIES: TradeStrategy[] = [
  'Elif trading', 'AB TRADE', '2.6 STRATEGY', 'ORDER BLOCK', 'IFVG', 'SNR_ICT', 'SMT', 'OTHER',
];
const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'];
const RESULTS: TradeResult[] = ['WIN', 'LOSS', 'BREAKEVEN', 'OPEN'];

type SortKey = 'date' | 'profitUSD' | 'rrPlanned';

const RESULT_STYLES: Record<TradeResult, { bg: string; color: string; border: string }> = {
  WIN:       { bg: 'rgba(52,211,153,0.1)',  color: '#34d399', border: 'rgba(52,211,153,0.2)'  },
  LOSS:      { bg: 'rgba(248,113,113,0.08)', color: '#f87171', border: 'rgba(248,113,113,0.18)' },
  BREAKEVEN: { bg: 'rgba(251,191,36,0.08)', color: '#fbbf24', border: 'rgba(251,191,36,0.18)' },
  OPEN:      { bg: 'rgba(99,102,241,0.1)',  color: '#818cf8', border: 'rgba(99,102,241,0.2)'  },
};

// ─── Shared input styles ──────────────────────────────────────────────────────
const inputCls = [
  'w-full px-3 py-2.5 rounded-xl text-white text-sm',
  'focus:outline-none transition-all duration-200',
  'placeholder-[#333]',
].join(' ');
const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'white',
};
const inputFocusStyle = {
  borderColor: 'rgba(99,102,241,0.5)',
  boxShadow: '0 0 0 3px rgba(99,102,241,0.1)',
};
const labelCls = 'text-[10px] font-semibold uppercase tracking-widest mb-1.5 block';

// ─── Trade Modal ──────────────────────────────────────────────────────────────
function TradeModal({ trade, onSave, onClose, defaultDeposit, defaultRisk }: {
  trade?: Trade | null;
  onSave: (d: Omit<Trade, 'id'>) => void;
  onClose: () => void;
  defaultDeposit: number;
  defaultRisk: number;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<Omit<Trade, 'id'>>({
    date: trade?.date ?? today,
    instrument: trade?.instrument ?? 'XAU/USD',
    strategy: trade?.strategy ?? 'Elif trading',
    timeframe: trade?.timeframe ?? '1h',
    direction: trade?.direction ?? 'BUY',
    entry: trade?.entry ?? 0,
    stopLoss: trade?.stopLoss ?? 0,
    tp1: trade?.tp1 ?? 0,
    tp2: trade?.tp2, tp3: trade?.tp3,
    exitPrice: trade?.exitPrice,
    result: trade?.result ?? 'OPEN',
    pips: trade?.pips, rrActual: trade?.rrActual,
    rrPlanned: trade?.rrPlanned ?? 1,
    notes: trade?.notes ?? '',
    deposit: trade?.deposit ?? defaultDeposit,
    riskPercent: trade?.riskPercent ?? defaultRisk,
    profitUSD: trade?.profitUSD,
    tags: trade?.tags ?? [],
  });

  const set = (k: keyof typeof form, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    const risk = Math.abs(form.entry - form.stopLoss);
    const reward = Math.abs(form.tp1 - form.entry);
    if (risk > 0) set('rrPlanned', Math.round((reward / risk) * 100) / 100);
  }, [form.entry, form.stopLoss, form.tp1]);

  useEffect(() => {
    if (form.result !== 'OPEN' && form.exitPrice && form.entry) {
      const riskUSD = (form.deposit ?? defaultDeposit) * ((form.riskPercent ?? defaultRisk) / 100);
      const pipsRisk = Math.abs(form.entry - form.stopLoss);
      if (pipsRisk > 0) {
        const pipValue = riskUSD / pipsRisk;
        const pipsGained = form.result === 'WIN'
          ? Math.abs(form.exitPrice - form.entry)
          : form.result === 'LOSS' ? -Math.abs(form.exitPrice - form.entry) : 0;
        set('pips', Math.round(pipsGained * 100) / 100);
        set('profitUSD', Math.round(pipsGained * pipValue * 100) / 100);
      }
    }
  }, [form.result, form.exitPrice, form.entry, form.stopLoss, form.deposit, form.riskPercent]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      role="dialog"
      aria-modal="true"
      aria-label={trade ? 'Edit trade' : 'Add trade'}
    >
      <div
        className="w-full max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(145deg, #0e0e1a 0%, #0a0a14 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Modal header */}
        <div
          className="sticky top-0 flex items-center justify-between px-6 py-4 z-10"
          style={{
            background: 'rgba(14,14,26,0.95)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <h2 className="text-base font-bold text-white">{trade ? 'Edit trade' : 'Add new trade'}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Date + Instrument */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ color: 'rgba(255,255,255,0.35)' }} htmlFor="trade-date">Date</label>
              <input
                id="trade-date"
                type="date"
                value={form.date.slice(0, 10)}
                onChange={e => set('date', e.target.value)}
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelCls} style={{ color: 'rgba(255,255,255,0.35)' }} htmlFor="trade-instrument">Instrument</label>
              <input
                id="trade-instrument"
                value={form.instrument}
                onChange={e => set('instrument', e.target.value)}
                className={inputCls}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Strategy + Timeframe */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ color: 'rgba(255,255,255,0.35)' }} htmlFor="trade-strategy">Strategy</label>
              <select
                id="trade-strategy"
                value={form.strategy}
                onChange={e => set('strategy', e.target.value as TradeStrategy)}
                className={inputCls}
                style={inputStyle}
              >
                {STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ color: 'rgba(255,255,255,0.35)' }} htmlFor="trade-timeframe">Timeframe</label>
              <select
                id="trade-timeframe"
                value={form.timeframe}
                onChange={e => set('timeframe', e.target.value)}
                className={inputCls}
                style={inputStyle}
              >
                {TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Direction + Result */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className={labelCls} style={{ color: 'rgba(255,255,255,0.35)' }}>Direction</p>
              <div className="grid grid-cols-2 gap-2">
                {(['BUY', 'SELL'] as const).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => set('direction', d)}
                    className="py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                    style={
                      form.direction === d
                        ? d === 'BUY'
                          ? { background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }
                          : { background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)' }
                        : { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.07)' }
                    }
                    aria-pressed={form.direction === d}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls} style={{ color: 'rgba(255,255,255,0.35)' }} htmlFor="trade-result">Result</label>
              <select
                id="trade-result"
                value={form.result}
                onChange={e => set('result', e.target.value as TradeResult)}
                className={inputCls}
                style={inputStyle}
              >
                {RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* Entry / SL / TP1 */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls} style={{ color: 'rgba(255,255,255,0.35)' }} htmlFor="trade-entry">Entry</label>
              <input id="trade-entry" type="number" value={form.entry || ''} onChange={e => set('entry', parseFloat(e.target.value) || 0)} step="0.01" className={inputCls} style={inputStyle} placeholder="3320.00" />
            </div>
            <div>
              <label className={labelCls} style={{ color: 'rgba(255,255,255,0.35)' }} htmlFor="trade-sl">Stop Loss</label>
              <input id="trade-sl" type="number" value={form.stopLoss || ''} onChange={e => set('stopLoss', parseFloat(e.target.value) || 0)} step="0.01" className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={{ color: 'rgba(255,255,255,0.35)' }} htmlFor="trade-tp1">TP1</label>
              <input id="trade-tp1" type="number" value={form.tp1 || ''} onChange={e => set('tp1', parseFloat(e.target.value) || 0)} step="0.01" className={inputCls} style={inputStyle} />
            </div>
          </div>

          {/* TP2 / TP3 / Exit */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls} style={{ color: 'rgba(255,255,255,0.35)' }} htmlFor="trade-tp2">TP2</label>
              <input id="trade-tp2" type="number" value={form.tp2 || ''} onChange={e => set('tp2', parseFloat(e.target.value) || undefined)} step="0.01" className={inputCls} style={inputStyle} placeholder="—" />
            </div>
            <div>
              <label className={labelCls} style={{ color: 'rgba(255,255,255,0.35)' }} htmlFor="trade-tp3">TP3</label>
              <input id="trade-tp3" type="number" value={form.tp3 || ''} onChange={e => set('tp3', parseFloat(e.target.value) || undefined)} step="0.01" className={inputCls} style={inputStyle} placeholder="—" />
            </div>
            <div>
              <label className={labelCls} style={{ color: 'rgba(255,255,255,0.35)' }} htmlFor="trade-exit">Exit price</label>
              <input id="trade-exit" type="number" value={form.exitPrice || ''} onChange={e => set('exitPrice', parseFloat(e.target.value) || undefined)} step="0.01" className={inputCls} style={inputStyle} placeholder="—" />
            </div>
          </div>

          {/* Deposit / Risk / R:R */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls} style={{ color: 'rgba(255,255,255,0.35)' }} htmlFor="trade-deposit">Deposit ($)</label>
              <input id="trade-deposit" type="number" value={form.deposit || ''} onChange={e => set('deposit', parseFloat(e.target.value) || 0)} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={{ color: 'rgba(255,255,255,0.35)' }} htmlFor="trade-risk">Risk (%)</label>
              <input id="trade-risk" type="number" value={form.riskPercent || ''} onChange={e => set('riskPercent', parseFloat(e.target.value) || 0)} step="0.1" className={inputCls} style={inputStyle} />
            </div>
            <div>
              <p className={labelCls} style={{ color: 'rgba(255,255,255,0.35)' }}>R:R</p>
              <div
                className="px-3 py-2.5 rounded-xl text-sm font-mono"
                style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', color: '#818cf8' }}
              >
                1 : {form.rrPlanned?.toFixed(2) ?? '—'}
              </div>
            </div>
          </div>

          {/* Estimated P&L */}
          {form.profitUSD !== undefined && (
            <div
              className="rounded-xl p-4"
              style={{
                background: (form.profitUSD ?? 0) >= 0 ? 'rgba(52,211,153,0.06)' : 'rgba(248,113,113,0.06)',
                border: `1px solid ${(form.profitUSD ?? 0) >= 0 ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.15)'}`,
              }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Estimated P&L
              </p>
              <div
                className="text-xl font-bold font-mono"
                style={{ color: (form.profitUSD ?? 0) >= 0 ? '#34d399' : '#f87171' }}
              >
                {(form.profitUSD ?? 0) >= 0 ? '+' : ''}{form.profitUSD?.toFixed(2)}
                {form.pips !== undefined && (
                  <span className="text-xs font-normal ml-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    ({form.pips?.toFixed(1)} pips)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className={labelCls} style={{ color: 'rgba(255,255,255,0.35)' }} htmlFor="trade-notes">Notes</label>
            <textarea
              id="trade-notes"
              value={form.notes ?? ''}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
              style={inputStyle}
              placeholder="Trade details, observations..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(form)}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                color: 'white',
              }}
            >
              {trade ? 'Save changes' : 'Add trade'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editTrade, setEditTrade] = useState<Trade | null>(null);
  const [filterResult, setFilterResult] = useState<TradeResult | 'ALL'>('ALL');
  const [filterStrategy, setFilterStrategy] = useState('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [settings, setSettings] = useState({ deposit: 10000, riskPercentage: 1 });

  const load = () => {
    setTrades(tradesStore.getAll());
    setSettings(settingsStore.get());
  };

  useEffect(() => { setMounted(true); load(); }, []);

  const filtered = useMemo(() => {
    let t = [...trades];
    if (filterResult !== 'ALL') t = t.filter(tr => tr.result === filterResult);
    if (filterStrategy !== 'ALL') t = t.filter(tr => tr.strategy === filterStrategy);
    t.sort((a, b) => {
      const av = sortKey === 'date' ? new Date(a.date).getTime() : sortKey === 'profitUSD' ? (a.profitUSD ?? 0) : a.rrPlanned;
      const bv = sortKey === 'date' ? new Date(b.date).getTime() : sortKey === 'profitUSD' ? (b.profitUSD ?? 0) : b.rrPlanned;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return t;
  }, [trades, filterResult, filterStrategy, sortKey, sortDir]);

  const stats = useMemo(() => {
    const wins = trades.filter(t => t.result === 'WIN').length;
    const losses = trades.filter(t => t.result === 'LOSS').length;
    const pnl = trades.reduce((s, t) => s + (t.profitUSD ?? 0), 0);
    const wr = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 0;
    return { wins, losses, total: trades.length, wr, pnl };
  }, [trades]);

  const handleSave = (data: Omit<Trade, 'id'>) => {
    if (editTrade) tradesStore.update(editTrade.id, data);
    else tradesStore.add(data);
    load();
    setShowModal(false);
    setEditTrade(null);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: '#818cf8', borderRightColor: '#818cf8' }}
          role="status"
          aria-label="Loading..."
        />
      </div>
    );
  }

  const selectStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.6)',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Trades</h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {trades.length} trades logged · Trade journal
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditTrade(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
            color: 'white',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12l7-7 7 7"/>
          </svg>
          Add trade
        </button>
      </header>

      {/* Stats */}
      <section aria-label="Trade statistics">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: String(stats.total), accent: '#818cf8' },
            { label: 'Win', value: String(stats.wins), accent: '#34d399' },
            { label: 'Loss', value: String(stats.losses), accent: '#f87171' },
            { label: 'Win Rate', value: `${stats.wr.toFixed(1)}%`, accent: '#34d399' },
            { label: 'P&L', value: `${stats.pnl >= 0 ? '+' : ''}${stats.pnl.toFixed(2)}`, accent: stats.pnl >= 0 ? '#34d399' : '#f87171' },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-xl p-4 text-center"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {s.label}
              </div>
              <div className="text-base font-bold font-mono" style={{ color: s.accent }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Filters */}
      <section aria-label="Filters" className="flex flex-wrap gap-2">
        <select
          value={filterResult}
          onChange={e => setFilterResult(e.target.value as TradeResult | 'ALL')}
          className="px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-all duration-200"
          style={selectStyle}
          aria-label="Filter by result"
        >
          <option value="ALL">All results</option>
          {RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          value={filterStrategy}
          onChange={e => setFilterStrategy(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-all duration-200"
          style={selectStyle}
          aria-label="Filter by strategy"
        >
          <option value="ALL">All strategies</option>
          {STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {trades.length > 0 && (
          <button
            type="button"
            onClick={() => { if (confirm('Clear all trades?')) { tradesStore.clear(); load(); } }}
            className="px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', color: '#f87171' }}
          >
            Clear all
          </button>
        )}
      </section>

      {/* Table / Empty */}
      {filtered.length === 0 ? (
        <section
          className="rounded-2xl p-16 text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
            aria-hidden="true"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
          <h2 className="text-white text-base font-bold mb-2">No trades</h2>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.3)' }}>Add your first trade to start tracking</p>
          <button
            type="button"
            onClick={() => { setEditTrade(null); setShowModal(true); }}
            className="px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              color: 'white',
            }}
          >
            Add trade
          </button>
        </section>
      ) : (
        <section
          aria-label="Trades table"
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {[
                    { key: 'date' as SortKey, label: 'Date' },
                    { key: null, label: 'Instrument' },
                    { key: null, label: 'Strategy' },
                    { key: null, label: 'TF' },
                    { key: null, label: 'Dir' },
                    { key: null, label: 'Entry / SL / TP' },
                    { key: 'rrPlanned' as SortKey, label: 'R:R' },
                    { key: null, label: 'Exit' },
                    { key: 'profitUSD' as SortKey, label: 'P&L' },
                    { key: null, label: 'Result' },
                    { key: null, label: '' },
                  ].map((col, i) => (
                    <th
                      key={i}
                      onClick={() => col.key && toggleSort(col.key)}
                      className={`px-4 py-3.5 text-left text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap select-none ${col.key ? 'cursor-pointer' : ''}`}
                      style={{ color: col.key && sortKey === col.key ? '#818cf8' : 'rgba(255,255,255,0.25)' }}
                      aria-sort={col.key && sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                    >
                      {col.label}
                      {col.key && sortKey === col.key && (
                        <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(trade => {
                  const rs = RESULT_STYLES[trade.result];
                  return (
                    <tr
                      key={trade.id}
                      className="group transition-colors duration-150 hover:bg-white/[0.02]"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <td className="px-4 py-3.5 text-xs whitespace-nowrap font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {new Date(trade.date).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-bold text-white">{trade.instrument}</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {trade.strategy}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono font-bold" style={{ color: '#818cf8' }}>
                        {trade.timeframe}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                          style={
                            trade.direction === 'BUY'
                              ? { background: 'rgba(52,211,153,0.1)', color: '#34d399' }
                              : { background: 'rgba(248,113,113,0.1)', color: '#f87171' }
                          }
                        >
                          {trade.direction}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono whitespace-nowrap">
                        <span className="text-white">{trade.entry}</span>
                        <span style={{ color: 'rgba(255,255,255,0.2)' }}> / </span>
                        <span style={{ color: '#f87171' }}>{trade.stopLoss}</span>
                        <span style={{ color: 'rgba(255,255,255,0.2)' }}> / </span>
                        <span style={{ color: '#34d399' }}>{trade.tp1}</span>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono" style={{ color: '#818cf8' }}>
                        1:{trade.rrPlanned.toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {trade.exitPrice?.toFixed(2) ?? '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="text-sm font-bold font-mono"
                          style={{ color: (trade.profitUSD ?? 0) >= 0 ? '#34d399' : '#f87171' }}
                        >
                          {trade.profitUSD !== undefined
                            ? `${(trade.profitUSD ?? 0) >= 0 ? '+' : ''}${trade.profitUSD.toFixed(2)}`
                            : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md"
                          style={{ background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}
                        >
                          {trade.result}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            type="button"
                            onClick={() => { setEditTrade(trade); setShowModal(true); }}
                            className="text-xs font-medium px-2.5 py-1 rounded-lg transition-all duration-150"
                            style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => { if (confirm('Delete?')) { tradesStore.remove(trade.id); load(); } }}
                            className="text-xs font-medium px-2.5 py-1 rounded-lg transition-all duration-150"
                            style={{ background: 'rgba(248,113,113,0.07)', color: '#f87171', border: '1px solid rgba(248,113,113,0.15)' }}
                          >
                            Del
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {showModal && (
        <TradeModal
          trade={editTrade}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTrade(null); }}
          defaultDeposit={settings.deposit}
          defaultRisk={settings.riskPercentage}
        />
      )}
    </div>
  );
}
