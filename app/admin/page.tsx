'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { tradesStore, settingsStore, computeAnalytics } from '../lib/store';
import type { Trade, AnalyticsData } from '../lib/types';

// ─── Inline SVG sparkline ────────────────────────────────────────────────────
function Sparkline({ data, h = 32 }: { data: number[]; h?: number }) {
  if (data.length < 2) return <div style={{ height: h }} />;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const W = 80;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${h - ((v - min) / range) * h}`).join(' ');
  const trend = data[data.length - 1] >= data[0];
  return (
    <svg width={W} height={h} className="overflow-visible opacity-60">
      <polyline points={pts} fill="none" stroke={trend ? '#fff' : '#555'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, spark, muted }: {
  label: string; value: string; sub?: string; spark?: number[]; muted?: boolean;
}) {
  return (
    <div className={`rounded-lg border border-[#1f1f1f] p-5 ${muted ? 'opacity-50' : ''}`}>
      <div className="text-[11px] text-[#555] uppercase tracking-widest font-medium mb-3">{label}</div>
      <div className="text-2xl font-semibold text-white tracking-tight">{value}</div>
      {sub && <div className="text-[#555] text-xs mt-1">{sub}</div>}
      {spark && spark.length > 1 && <div className="mt-3"><Sparkline data={spark} /></div>}
    </div>
  );
}

// ─── Trade row ───────────────────────────────────────────────────────────────
function TradeRow({ trade }: { trade: Trade }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-[#111] last:border-0">
      <div className={`text-xs font-mono ${trade.direction === 'BUY' ? 'text-white' : 'text-[#555]'}`}>
        {trade.direction}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white truncate">{trade.strategy}</div>
        <div className="text-[#555] text-xs">{trade.timeframe} · {new Date(trade.date).toLocaleDateString('ru-RU')}</div>
      </div>
      <div className="text-right">
        {trade.profitUSD !== undefined && (
          <div className={`text-sm font-mono ${trade.profitUSD >= 0 ? 'text-white' : 'text-[#666]'}`}>
            {trade.profitUSD >= 0 ? '+' : ''}{trade.profitUSD.toFixed(2)}
          </div>
        )}
        <div className={`text-[10px] uppercase tracking-wider ${
          trade.result === 'WIN' ? 'text-white' : trade.result === 'LOSS' ? 'text-[#444]' : 'text-[#555]'
        }`}>{trade.result}</div>
      </div>
    </div>
  );
}

// ─── Strategy bars ────────────────────────────────────────────────────────────
function StrategyBars({ data }: { data: AnalyticsData['byStrategy'] }) {
  const entries = Object.entries(data).sort((a, b) => b[1].total - a[1].total).slice(0, 5);
  if (!entries.length) return <div className="text-[#333] text-sm py-6 text-center">—</div>;
  const maxTotal = Math.max(...entries.map(e => e[1].total));
  return (
    <div className="space-y-4">
      {entries.map(([strat, s]) => {
        const wr = s.total > 0 ? (s.wins / s.total) * 100 : 0;
        return (
          <div key={strat}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-[#888] truncate">{strat}</span>
              <span className="text-white font-mono ml-2">{wr.toFixed(0)}%</span>
            </div>
            <div className="h-px bg-[#1f1f1f] relative">
              <div className="h-px bg-white absolute top-0 left-0 transition-all"
                style={{ width: `${(s.total / maxTotal) * 100}%` }} />
            </div>
            <div className="text-[10px] text-[#444] mt-1">{s.total} trades · {s.wins}W {s.losses}L</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [settings, setSettings] = useState({ deposit: 10000 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = tradesStore.getAll();
    const s = settingsStore.get();
    setTrades(t);
    setSettings(s);
    setAnalytics(computeAnalytics(t, s.deposit));
  }, []);

  const equitySpark = useMemo(() => analytics?.equityCurve.map(p => p.value) ?? [], [analytics]);

  if (!mounted) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border border-[#333] border-t-white rounded-full animate-spin" />
    </div>
  );

  const hasTrades = trades.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-6">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Dashboard</h1>
          <p className="text-[#555] text-sm mt-0.5">XAU/USD analytics</p>
        </div>
        <Link href="/admin/trades"
          className="px-4 py-2 border border-[#2a2a2a] text-[#888] hover:text-white hover:border-[#444] text-sm rounded-md transition-colors">
          + Add trade
        </Link>
      </div>

      {/* Empty */}
      {!hasTrades && (
        <div className="border border-dashed border-[#1f1f1f] rounded-lg p-16 text-center">
          <div className="text-[#333] text-4xl mb-4 font-mono">∅</div>
          <div className="text-white text-sm font-medium mb-1">No trades yet</div>
          <div className="text-[#555] text-xs mb-6">Start logging trades to see analytics</div>
          <Link href="/admin/trades"
            className="inline-block px-5 py-2.5 bg-white text-black text-sm font-medium rounded-md hover:bg-[#e0e0e0] transition-colors">
            Add first trade
          </Link>
        </div>
      )}

      {hasTrades && analytics && (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Win Rate"
              value={`${analytics.winRate.toFixed(1)}%`}
              sub={`${analytics.wins}W / ${analytics.losses}L`}
            />
            <StatCard
              label="P&L"
              value={`${analytics.totalProfitUSD >= 0 ? '+' : ''}${analytics.totalProfitUSD.toFixed(2)}`}
              sub={`of ${settings.deposit.toLocaleString()} deposit`}
              spark={equitySpark}
            />
            <StatCard
              label="Profit Factor"
              value={analytics.profitFactor === Infinity ? '∞' : analytics.profitFactor.toFixed(2)}
              sub={analytics.profitFactor >= 1.5 ? 'Good' : analytics.profitFactor >= 1 ? 'Positive' : 'Negative'}
            />
            <StatCard
              label="Avg R:R"
              value={`1 : ${analytics.averageRR.toFixed(2)}`}
              sub={`${analytics.totalTrades} total trades`}
            />
          </div>

          {/* Secondary row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Open', value: String(analytics.openTrades) },
              { label: 'Win streak', value: String(analytics.winStreak) },
              { label: 'Loss streak', value: String(analytics.lossStreak) },
              { label: 'Total pips', value: `${analytics.totalPips >= 0 ? '+' : ''}${analytics.totalPips.toFixed(1)}` },
            ].map(s => (
              <div key={s.label} className="rounded-lg border border-[#1f1f1f] p-4">
                <div className="text-[10px] text-[#444] uppercase tracking-widest mb-1.5">{s.label}</div>
                <div className="text-lg font-semibold text-white font-mono">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border border-[#1f1f1f] rounded-lg p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="text-sm font-medium text-white">By strategy</div>
                <Link href="/admin/charts" className="text-[#555] text-xs hover:text-white transition-colors">View all →</Link>
              </div>
              <StrategyBars data={analytics.byStrategy} />
            </div>

            <div className="border border-[#1f1f1f] rounded-lg p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="text-sm font-medium text-white">Recent trades</div>
                <Link href="/admin/trades" className="text-[#555] text-xs hover:text-white transition-colors">All trades →</Link>
              </div>
              {trades.slice(0, 5).length === 0 ? (
                <div className="text-[#333] text-sm text-center py-6">—</div>
              ) : (
                <div>{trades.slice(0, 5).map(t => <TradeRow key={t.id} trade={t} />)}</div>
              )}
            </div>
          </div>

          {/* Best / Worst */}
          {(analytics.bestTrade || analytics.worstTrade) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {analytics.bestTrade && (
                <div className="border border-[#1f1f1f] rounded-lg p-5">
                  <div className="text-[10px] text-[#444] uppercase tracking-widest mb-3">Best trade</div>
                  <div className="text-2xl font-semibold text-white font-mono">
                    +{analytics.bestTrade.profitUSD?.toFixed(2)}
                  </div>
                  <div className="text-[#555] text-xs mt-1">{analytics.bestTrade.strategy} · {analytics.bestTrade.timeframe}</div>
                </div>
              )}
              {analytics.worstTrade && (
                <div className="border border-[#1f1f1f] rounded-lg p-5">
                  <div className="text-[10px] text-[#444] uppercase tracking-widest mb-3">Worst trade</div>
                  <div className="text-2xl font-semibold text-[#555] font-mono">
                    {analytics.worstTrade.profitUSD?.toFixed(2)}
                  </div>
                  <div className="text-[#555] text-xs mt-1">{analytics.worstTrade.strategy} · {analytics.worstTrade.timeframe}</div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Quick nav */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-[#111]">
        {[
          { href: '/admin/charts', label: 'Charts', sub: 'Lightweight Charts' },
          { href: '/admin/trades', label: 'Trades', sub: 'Journal' },
          { href: '/admin/chat', label: 'AI Chat', sub: 'Claude + history' },
          { href: '/admin/notes', label: 'Notes', sub: 'Trading diary' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="rounded-lg border border-[#1f1f1f] p-4 hover:border-[#333] hover:bg-[#0a0a0a] transition-all group">
            <div className="text-sm font-medium text-white group-hover:text-white">{item.label}</div>
            <div className="text-[#444] text-xs mt-0.5">{item.sub}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
