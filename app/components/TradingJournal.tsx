'use client';

import { useState, useEffect, useMemo } from 'react';

export interface JournalTrade {
  id: string;
  timestamp: number;
  dateStr: string;
  asset: string;
  strategy: string;
  direction: 'BUY' | 'SELL';
  entry: string;
  sl: string;
  tp1: string;
  tp2: string;
  tp3: string;
  lotSize?: string;
  riskDollar?: string;
  status: 'PENDING' | 'WIN' | 'LOSS' | 'BE';
  pnlDollar?: number;
  notes?: string;
}

const STORAGE_KEY = 'trading_journal_trades_v1';

export const saveTradeToJournalStorage = (trade: Omit<JournalTrade, 'id' | 'timestamp' | 'dateStr' | 'status'>) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: JournalTrade[] = raw ? JSON.parse(raw) : [];
    const now = new Date();
    const newEntry: JournalTrade = {
      ...trade,
      id: `trade_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      dateStr: now.toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' }),
      status: 'PENDING',
    };
    list.unshift(newEntry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('journal_updated'));
    return true;
  } catch (e) {
    console.error('Save to journal failed', e);
    return false;
  }
};

export default function TradingJournal() {
  const [trades, setTrades] = useState<JournalTrade[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'WIN' | 'LOSS' | 'BE'>('ALL');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');
  const [tempPnl, setTempPnl] = useState('');

  const loadTrades = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setTrades(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadTrades();
    const handleUpdate = () => loadTrades();
    window.addEventListener('journal_updated', handleUpdate);
    return () => window.removeEventListener('journal_updated', handleUpdate);
  }, []);

  const updateTradeStatus = (id: string, status: JournalTrade['status'], pnl?: number) => {
    const updated = trades.map((t) => {
      if (t.id === id) {
        return { ...t, status, pnlDollar: pnl !== undefined ? pnl : t.pnlDollar };
      }
      return t;
    });
    setTrades(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteTrade = (id: string) => {
    if (!confirm("Ushbu savdo yozuvini o'chirmoqchimisiz?")) return;
    const updated = trades.filter((t) => t.id !== id);
    setTrades(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const clearAllTrades = () => {
    if (!confirm("Barcha jurnaldagi savdolarni o'chirib tashlamoqchimisiz?")) return;
    setTrades([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const saveNote = (id: string) => {
    const pnlNum = tempPnl !== '' ? parseFloat(tempPnl) : undefined;
    const updated = trades.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          notes: tempNote,
          pnlDollar: isNaN(pnlNum as number) ? t.pnlDollar : pnlNum,
        };
      }
      return t;
    });
    setTrades(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setEditingNotesId(null);
  };

  // Export to CSV
  const exportCSV = () => {
    if (trades.length === 0) return alert('Eksport qilish uchun savdolar mavjud emas');
    const headers = ['Sana', 'Instrument', 'Strategiya', 'Yonalish', 'Entry', 'Stop Loss', 'TP1', 'TP2', 'TP3', 'Lot', 'Risk $', 'Status', 'Foyda/Zarar $', 'Eslatma'];
    const rows = trades.map((t) => [
      `"${t.dateStr}"`,
      `"${t.asset}"`,
      `"${t.strategy}"`,
      `"${t.direction}"`,
      t.entry,
      t.sl,
      t.tp1,
      t.tp2,
      t.tp3,
      t.lotSize || '',
      t.riskDollar || '',
      t.status,
      t.pnlDollar !== undefined ? t.pnlDollar : '',
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `trading_journal_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Analytics
  const stats = useMemo(() => {
    const closedTrades = trades.filter((t) => t.status !== 'PENDING');
    const wins = trades.filter((t) => t.status === 'WIN').length;
    const losses = trades.filter((t) => t.status === 'LOSS').length;
    const be = trades.filter((t) => t.status === 'BE').length;
    const pending = trades.filter((t) => t.status === 'PENDING').length;

    const winRate = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : '0';
    const totalPnl = trades.reduce((acc, t) => acc + (t.pnlDollar || 0), 0);

    return {
      total: trades.length,
      closed: closedTrades.length,
      wins,
      losses,
      be,
      pending,
      winRate,
      totalPnl: totalPnl.toFixed(2),
    };
  }, [trades]);

  const filteredTrades = useMemo(() => {
    if (filter === 'ALL') return trades;
    return trades.filter((t) => t.status === filter);
  }, [trades, filter]);

  return (
    <div className="bg-slate-900/85 border border-emerald-600/50 rounded-2xl p-5 mb-4 backdrop-blur shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-700/80">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📓</span>
          <div>
            <h3 className="text-emerald-400 text-sm font-bold tracking-wider">TREYDING JURNALI & STATISTIKA</h3>
            <p className="text-slate-500 text-xs">Saqlangan savdolar, natijalar va Win Rate tahlili</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {trades.length > 0 && (
            <>
              <button
                onClick={exportCSV}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-emerald-600/40"
              >
                <span>📥</span> CSV Eksport
              </button>
              <button
                onClick={clearAllTrades}
                className="px-2.5 py-1.5 bg-red-900/40 hover:bg-red-900/70 text-red-300 rounded-xl text-xs font-bold transition-all border border-red-700/50"
              >
                Tozalash
              </button>
            </>
          )}
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 text-center">
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
          <div className="text-slate-400 text-[11px] font-bold">WIN RATE</div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">{stats.winRate}%</div>
          <div className="text-[10px] text-slate-500">{stats.wins}W / {stats.losses}L</div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
          <div className="text-slate-400 text-[11px] font-bold">UMUMIY FOYDA / ZARAR</div>
          <div
            className={`text-2xl font-black font-mono mt-0.5 ${
              parseFloat(stats.totalPnl) >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {parseFloat(stats.totalPnl) >= 0 ? `+$${stats.totalPnl}` : `-$${Math.abs(parseFloat(stats.totalPnl))}`}
          </div>
          <div className="text-[10px] text-slate-500">Sof balans o&apos;zgarishi</div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
          <div className="text-slate-400 text-[11px] font-bold">SAVDOLAR SONI</div>
          <div className="text-2xl font-black text-white font-mono mt-0.5">{stats.total}</div>
          <div className="text-[10px] text-slate-500">{stats.pending} ta faol/kutilmoqda</div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3">
          <div className="text-slate-400 text-[11px] font-bold">NATIJALAR</div>
          <div className="flex justify-center gap-1.5 mt-1 text-xs font-bold">
            <span className="text-green-400">{stats.wins}🟢</span>
            <span className="text-red-400">{stats.losses}🔴</span>
            <span className="text-slate-400">{stats.be}⚪</span>
          </div>
          <div className="text-[10px] text-slate-500">W / L / Breakeven</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 text-xs font-bold">
        {[
          { key: 'ALL', label: `Barchasi (${trades.length})` },
          { key: 'PENDING', label: `Kutilmoqda (${stats.pending})` },
          { key: 'WIN', label: `Win (${stats.wins})` },
          { key: 'LOSS', label: `Loss (${stats.losses})` },
          { key: 'BE', label: `BE (${stats.be})` },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key as any)}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              filter === item.key
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Trades List */}
      {filteredTrades.length === 0 ? (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 text-center text-xs text-slate-400">
          📭 Jurnalda hozircha hech qanday savdo mavjud emas. Yuqoridagi kalkulyator yoki AI signallaridan{' '}
          <strong className="text-emerald-400">&quot;Jurnalga saqlash&quot;</strong> tugmasini bosing.
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {filteredTrades.map((trade) => {
            const isEditing = editingNotesId === trade.id;
            return (
              <div
                key={trade.id}
                className="bg-slate-800/70 border border-slate-700 rounded-xl p-3.5 hover:border-slate-600 transition-all"
              >
                {/* Top Row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                        trade.direction === 'BUY'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                          : 'bg-red-500/20 text-red-400 border border-red-500/40'
                      }`}
                    >
                      {trade.direction === 'BUY' ? '▲ BUY' : '▼ SELL'}
                    </span>
                    <span className="text-white font-bold text-xs">{trade.asset}</span>
                    <span className="text-slate-500 text-[11px]">• {trade.strategy}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-[10px]">{trade.dateStr}</span>
                    <button
                      onClick={() => deleteTrade(trade.id)}
                      className="text-slate-500 hover:text-red-400 text-xs p-1"
                      title="O'chirish"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Levels Grid */}
                <div className="grid grid-cols-4 gap-2 bg-slate-900/60 rounded-lg p-2 text-center text-xs font-mono mb-2.5">
                  <div>
                    <div className="text-slate-500 text-[10px]">ENTRY</div>
                    <div className="text-cyan-300 font-bold">{trade.entry}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">SL</div>
                    <div className="text-red-400 font-bold">{trade.sl}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">TP1</div>
                    <div className="text-green-300 font-bold">{trade.tp1}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">LOT / RISK</div>
                    <div className="text-amber-300 font-bold">
                      {trade.lotSize ? `${trade.lotSize}L` : '—'}{' '}
                      {trade.riskDollar ? `($${trade.riskDollar})` : ''}
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-700/50 text-xs">
                  {/* Status buttons */}
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 text-[11px] mr-1">Status:</span>
                    <button
                      onClick={() => updateTradeStatus(trade.id, 'PENDING')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                        trade.status === 'PENDING' ? 'bg-amber-500 text-slate-950' : 'bg-slate-700/60 text-slate-400'
                      }`}
                    >
                      ⏳ Kutilmoqda
                    </button>
                    <button
                      onClick={() => updateTradeStatus(trade.id, 'WIN')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                        trade.status === 'WIN' ? 'bg-green-600 text-white' : 'bg-slate-700/60 text-slate-400'
                      }`}
                    >
                      🟢 WIN
                    </button>
                    <button
                      onClick={() => updateTradeStatus(trade.id, 'LOSS')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                        trade.status === 'LOSS' ? 'bg-red-600 text-white' : 'bg-slate-700/60 text-slate-400'
                      }`}
                    >
                      🔴 LOSS
                    </button>
                    <button
                      onClick={() => updateTradeStatus(trade.id, 'BE')}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                        trade.status === 'BE' ? 'bg-slate-600 text-white' : 'bg-slate-700/60 text-slate-400'
                      }`}
                    >
                      ⚪ BE
                    </button>
                  </div>

                  {/* PnL and Notes toggle */}
                  <div className="flex items-center gap-2">
                    {trade.pnlDollar !== undefined && (
                      <span
                        className={`font-mono font-bold ${
                          trade.pnlDollar >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {trade.pnlDollar >= 0 ? `+$${trade.pnlDollar}` : `-$${Math.abs(trade.pnlDollar)}`}
                      </span>
                    )}
                    <button
                      onClick={() => {
                        if (isEditing) {
                          setEditingNotesId(null);
                        } else {
                          setEditingNotesId(trade.id);
                          setTempNote(trade.notes || '');
                          setTempPnl(trade.pnlDollar !== undefined ? String(trade.pnlDollar) : '');
                        }
                      }}
                      className="text-slate-400 hover:text-emerald-400 text-xs underline"
                    >
                      {isEditing ? 'Yopish' : trade.notes ? '📝 Eslatma' : '+ Eslatma/PnL'}
                    </button>
                  </div>
                </div>

                {/* Edit Notes & PnL Drawer */}
                {isEditing && (
                  <div className="mt-3 p-3 bg-slate-900/80 rounded-xl border border-slate-700 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-slate-400 text-[10px] font-bold block mb-1">
                          Haqiqiy Foyda / Zarar ($)
                        </label>
                        <input
                          type="number"
                          value={tempPnl}
                          onChange={(e) => setTempPnl(e.target.value)}
                          placeholder="masalan: 120 yoki -40"
                          className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                      <div className="flex-2">
                        <label className="text-slate-400 text-[10px] font-bold block mb-1">
                          Eslatma / Izoh
                        </label>
                        <input
                          type="text"
                          value={tempNote}
                          onChange={(e) => setTempNote(e.target.value)}
                          placeholder="masalan: NY Open FVG sweep bo'yicha..."
                          className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => saveNote(trade.id)}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all"
                    >
                      ✓ Saqlash
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
