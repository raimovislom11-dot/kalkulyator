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

// ─── Modal ────────────────────────────────────────────────────────────────────
function TradeModal({ trade, onSave, onClose, defaultDeposit, defaultRisk }: {
  trade?: Trade | null; onSave: (d: Omit<Trade, 'id'>) => void;
  onClose: () => void; defaultDeposit: number; defaultRisk: number;
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

  const inp = 'w-full px-3 py-2 bg-black border border-[#1f1f1f] rounded-md text-white text-sm focus:border-[#444] focus:outline-none transition-colors placeholder-[#333]';
  const lbl = 'text-[10px] text-[#444] uppercase tracking-widest mb-1.5 block font-medium';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
      <div className="w-full max-w-xl bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-[#1f1f1f] bg-[#0a0a0a]">
          <div className="text-sm font-medium text-white">{trade ? 'Edit trade' : 'Add trade'}</div>
          <button onClick={onClose} className="text-[#444] hover:text-white transition-colors text-sm">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Date</label><input type="date" value={form.date.slice(0, 10)} onChange={e => set('date', e.target.value)} className={inp} /></div>
            <div><label className={lbl}>Instrument</label><input value={form.instrument} onChange={e => set('instrument', e.target.value)} className={inp} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Strategy</label>
              <select value={form.strategy} onChange={e => set('strategy', e.target.value as TradeStrategy)} className={inp}>
                {STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className={lbl}>Timeframe</label>
              <select value={form.timeframe} onChange={e => set('timeframe', e.target.value)} className={inp}>
                {TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Direction</label>
              <div className="grid grid-cols-2 gap-2">
                {(['BUY', 'SELL'] as const).map(d => (
                  <button key={d} onClick={() => set('direction', d)}
                    className={`py-2 rounded-md text-sm transition-colors border ${
                      form.direction === d ? 'bg-white text-black border-white font-medium' : 'border-[#1f1f1f] text-[#555] hover:text-white'
                    }`}>{d}</button>
                ))}
              </div>
            </div>
            <div><label className={lbl}>Result</label>
              <select value={form.result} onChange={e => set('result', e.target.value as TradeResult)} className={inp}>
                {RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lbl}>Entry</label><input type="number" value={form.entry || ''} onChange={e => set('entry', parseFloat(e.target.value) || 0)} step="0.01" className={inp} placeholder="3320.00" /></div>
            <div><label className={lbl}>Stop Loss</label><input type="number" value={form.stopLoss || ''} onChange={e => set('stopLoss', parseFloat(e.target.value) || 0)} step="0.01" className={inp} /></div>
            <div><label className={lbl}>TP1</label><input type="number" value={form.tp1 || ''} onChange={e => set('tp1', parseFloat(e.target.value) || 0)} step="0.01" className={inp} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lbl}>TP2</label><input type="number" value={form.tp2 || ''} onChange={e => set('tp2', parseFloat(e.target.value) || undefined)} step="0.01" className={inp} placeholder="—" /></div>
            <div><label className={lbl}>TP3</label><input type="number" value={form.tp3 || ''} onChange={e => set('tp3', parseFloat(e.target.value) || undefined)} step="0.01" className={inp} placeholder="—" /></div>
            <div><label className={lbl}>Exit price</label><input type="number" value={form.exitPrice || ''} onChange={e => set('exitPrice', parseFloat(e.target.value) || undefined)} step="0.01" className={inp} placeholder="—" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={lbl}>Deposit ($)</label><input type="number" value={form.deposit || ''} onChange={e => set('deposit', parseFloat(e.target.value) || 0)} className={inp} /></div>
            <div><label className={lbl}>Risk (%)</label><input type="number" value={form.riskPercent || ''} onChange={e => set('riskPercent', parseFloat(e.target.value) || 0)} step="0.1" className={inp} /></div>
            <div><label className={lbl}>R:R</label>
              <div className={`${inp} font-mono text-[#888]`}>1 : {form.rrPlanned?.toFixed(2) ?? '—'}</div>
            </div>
          </div>
          {form.profitUSD !== undefined && (
            <div className="border border-[#1f1f1f] rounded-md p-3">
              <div className={`text-[10px] uppercase tracking-widest mb-1 ${(form.profitUSD ?? 0) >= 0 ? 'text-[#555]' : 'text-[#444]'}`}>Estimated P&L</div>
              <div className={`text-xl font-semibold font-mono ${(form.profitUSD ?? 0) >= 0 ? 'text-white' : 'text-[#555]'}`}>
                {(form.profitUSD ?? 0) >= 0 ? '+' : ''}{form.profitUSD?.toFixed(2)}
                {form.pips !== undefined && <span className="text-xs font-normal text-[#444] ml-2">({form.pips?.toFixed(1)} pips)</span>}
              </div>
            </div>
          )}
          <div><label className={lbl}>Notes</label><textarea value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={2} className={`${inp} resize-none`} placeholder="Trade details..." /></div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 border border-[#1f1f1f] text-[#555] hover:text-white hover:border-[#333] rounded-md text-sm transition-colors">Cancel</button>
            <button onClick={() => onSave(form)} className="flex-1 py-2.5 bg-white text-black font-medium rounded-md text-sm hover:bg-[#e0e0e0] transition-colors">{trade ? 'Save' : 'Add'}</button>
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

  const selCls = 'px-3 py-2 bg-black border border-[#1f1f1f] rounded-md text-[#666] text-sm focus:border-[#444] focus:outline-none hover:border-[#333] transition-colors';

  if (!mounted) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border border-[#333] border-t-white rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-6">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Trades</h1>
          <p className="text-[#555] text-sm mt-0.5">{trades.length} trades logged</p>
        </div>
        <button onClick={() => { setEditTrade(null); setShowModal(true); }}
          className="px-4 py-2 bg-white text-black text-sm font-medium rounded-md hover:bg-[#e0e0e0] transition-colors">
          + Add trade
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total', value: String(stats.total) },
          { label: 'Win', value: String(stats.wins) },
          { label: 'Loss', value: String(stats.losses) },
          { label: 'Win Rate', value: `${stats.wr.toFixed(1)}%` },
          { label: 'P&L', value: `${stats.pnl >= 0 ? '+' : ''}${stats.pnl.toFixed(2)}` },
        ].map(s => (
          <div key={s.label} className="border border-[#1f1f1f] rounded-lg p-3 text-center">
            <div className="text-[10px] text-[#444] uppercase tracking-widest mb-1">{s.label}</div>
            <div className="text-base font-semibold text-white font-mono">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select value={filterResult} onChange={e => setFilterResult(e.target.value as TradeResult | 'ALL')} className={selCls}>
          <option value="ALL">All results</option>
          {RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterStrategy} onChange={e => setFilterStrategy(e.target.value)} className={selCls}>
          <option value="ALL">All strategies</option>
          {STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {trades.length > 0 && (
          <button onClick={() => { if (confirm('Clear all trades?')) { tradesStore.clear(); load(); } }}
            className="px-3 py-2 border border-[#1f1f1f] text-[#444] hover:text-white hover:border-[#333] rounded-md text-sm transition-colors">
            Clear all
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="border border-dashed border-[#1f1f1f] rounded-lg p-16 text-center">
          <div className="text-[#222] text-3xl mb-4 font-mono">∅</div>
          <div className="text-white text-sm mb-1">No trades</div>
          <div className="text-[#444] text-xs mb-6">Add your first trade to start tracking</div>
          <button onClick={() => { setEditTrade(null); setShowModal(true); }}
            className="px-5 py-2.5 bg-white text-black text-sm font-medium rounded-md hover:bg-[#e0e0e0] transition-colors">
            Add trade
          </button>
        </div>
      ) : (
        <div className="border border-[#1f1f1f] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1f1f1f]">
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
                    <th key={i}
                      onClick={() => col.key && toggleSort(col.key)}
                      className={`px-4 py-3 text-left text-[10px] uppercase tracking-widest font-medium text-[#444] whitespace-nowrap ${col.key ? 'cursor-pointer hover:text-white transition-colors' : ''}`}>
                      {col.label}{col.key && sortKey === col.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(trade => (
                  <tr key={trade.id} className="border-b border-[#0d0d0d] hover:bg-[#0a0a0a] transition-colors group">
                    <td className="px-4 py-3 text-[#555] text-xs whitespace-nowrap font-mono">{new Date(trade.date).toLocaleDateString('ru-RU')}</td>
                    <td className="px-4 py-3 text-white text-xs font-medium">{trade.instrument}</td>
                    <td className="px-4 py-3 text-[#666] text-xs whitespace-nowrap">{trade.strategy}</td>
                    <td className="px-4 py-3 text-[#555] text-xs font-mono">{trade.timeframe}</td>
                    <td className={`px-4 py-3 text-xs font-medium ${trade.direction === 'BUY' ? 'text-white' : 'text-[#555]'}`}>
                      {trade.direction}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono whitespace-nowrap">
                      <span className="text-white">{trade.entry}</span>
                      <span className="text-[#333]"> / </span>
                      <span className="text-[#555]">{trade.stopLoss}</span>
                      <span className="text-[#333]"> / </span>
                      <span className="text-[#666]">{trade.tp1}</span>
                    </td>
                    <td className="px-4 py-3 text-[#666] text-xs font-mono">1:{trade.rrPlanned.toFixed(2)}</td>
                    <td className="px-4 py-3 text-[#555] text-xs font-mono">{trade.exitPrice?.toFixed(2) ?? '—'}</td>
                    <td className={`px-4 py-3 text-sm font-semibold font-mono ${(trade.profitUSD ?? 0) >= 0 ? 'text-white' : 'text-[#555]'}`}>
                      {trade.profitUSD !== undefined ? `${(trade.profitUSD ?? 0) >= 0 ? '+' : ''}${trade.profitUSD.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] uppercase tracking-widest font-medium px-2 py-1 rounded border ${
                        trade.result === 'WIN'
                          ? 'border-[#2a2a2a] text-white bg-[#111]'
                          : trade.result === 'LOSS'
                          ? 'border-[#1a1a1a] text-[#444] bg-transparent'
                          : 'border-[#1a1a1a] text-[#333]'
                      }`}>
                        {trade.result}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditTrade(trade); setShowModal(true); }} className="text-[#444] hover:text-white text-xs transition-colors">Edit</button>
                        <button onClick={() => { if (confirm('Delete?')) { tradesStore.remove(trade.id); load(); } }} className="text-[#333] hover:text-[#888] text-xs transition-colors">Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <TradeModal trade={editTrade} onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTrade(null); }}
          defaultDeposit={settings.deposit} defaultRisk={settings.riskPercentage} />
      )}
    </div>
  );
}
