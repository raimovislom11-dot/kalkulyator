'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { tradesStore, settingsStore, computeAnalytics } from '../lib/store';
import type { Trade, AnalyticsData } from '../lib/types';

// ─── Sparkline ───────────────────────────────────────────────────────────────
function Sparkline({ data, h = 36, color = '#818cf8' }: { data: number[]; h?: number; color?: string }) {
  if (data.length < 2) return <div style={{ height: h }} />;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const W = 90;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * W},${h - ((v - min) / range) * (h - 4) - 2}`)
    .join(' ');
  return (
    <svg width={W} height={h} className="overflow-visible">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />
    </svg>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, spark, accent = '#818cf8', icon,
}: {
  label: string; value: string; sub?: string; spark?: number[];
  accent?: string; icon?: React.ReactNode;
}) {
  return (
    <article
      className="rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden group transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}
    >
      {/* Glow */}
      <div
        className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"
        style={{ background: accent }}
        aria-hidden="true"
      />
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          {label}
        </span>
        {icon && (
          <span className="opacity-40" style={{ color: accent }} aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
        {sub && (
          <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{sub}</div>
        )}
      </div>
      {spark && spark.length > 1 && (
        <div className="-mb-1">
          <Sparkline data={spark} color={accent} />
        </div>
      )}
    </article>
  );
}

// ─── Mini Stat ───────────────────────────────────────────────────────────────
function MiniStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1.5"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
        {label}
      </span>
      <span className="text-lg font-bold font-mono" style={{ color: accent ?? 'white' }}>
        {value}
      </span>
    </div>
  );
}

// ─── Trade Row ───────────────────────────────────────────────────────────────
function TradeRow({ trade }: { trade: Trade }) {
  const isWin = trade.result === 'WIN';
  const isLoss = trade.result === 'LOSS';

  return (
    <tr
      className="group transition-colors duration-150"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
    >
      <td className="py-3 px-4">
        <span
          className="text-[10px] font-bold px-2 py-1 rounded-md"
          style={
            trade.direction === 'BUY'
              ? { background: 'rgba(99,102,241,0.15)', color: '#818cf8' }
              : { background: 'rgba(239,68,68,0.12)', color: '#f87171' }
          }
        >
          {trade.direction}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="text-sm text-white font-medium truncate max-w-[120px]">{trade.strategy}</div>
        <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {trade.timeframe} · {new Date(trade.date).toLocaleDateString('ru-RU')}
        </div>
      </td>
      <td className="py-3 px-4 text-right">
        {trade.profitUSD !== undefined && (
          <div
            className="text-sm font-bold font-mono"
            style={{ color: trade.profitUSD >= 0 ? '#34d399' : '#f87171' }}
          >
            {trade.profitUSD >= 0 ? '+' : ''}{trade.profitUSD.toFixed(2)}
          </div>
        )}
        <div
          className="text-[10px] font-semibold uppercase mt-0.5"
          style={{
            color: isWin ? '#34d399' : isLoss ? '#f87171' : 'rgba(255,255,255,0.35)',
          }}
        >
          {trade.result}
        </div>
      </td>
    </tr>
  );
}

// ─── Strategy Bars ───────────────────────────────────────────────────────────
function StrategyBars({ data }: { data: AnalyticsData['byStrategy'] }) {
  const entries = Object.entries(data).sort((a, b) => b[1].total - a[1].total).slice(0, 5);
  if (!entries.length) {
    return <div className="text-center py-8" style={{ color: 'rgba(255,255,255,0.2)' }}>No data yet</div>;
  }
  const maxTotal = Math.max(...entries.map(e => e[1].total));
  const colors = ['#818cf8', '#a78bfa', '#6ee7b7', '#fbbf24', '#f87171'];

  return (
    <ul className="space-y-4">
      {entries.map(([strat, s], idx) => {
        const wr = s.total > 0 ? (s.wins / s.total) * 100 : 0;
        const color = colors[idx % colors.length];
        return (
          <li key={strat}>
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="truncate font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>{strat}</span>
              <span className="font-bold font-mono ml-2" style={{ color }}>{wr.toFixed(0)}%</span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(s.total / maxTotal) * 100}%`,
                  background: `linear-gradient(90deg, ${color}88, ${color})`,
                }}
              />
            </div>
            <div className="text-[10px] mt-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {s.total} trades · {s.wins}W {s.losses}L
            </div>
          </li>
        );
      })}
    </ul>
  );
}

// ─── Quick Nav Card ───────────────────────────────────────────────────────────
function QuickNavCard({ href, label, sub, icon, accent }: {
  href: string; label: string; sub: string; icon: React.ReactNode; accent: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
        style={{
          background: `linear-gradient(135deg, ${accent}25, ${accent}15)`,
          border: `1px solid ${accent}30`,
          color: accent,
        }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-white group-hover:text-white transition-colors">{label}</div>
        <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{sub}</div>
      </div>
      <svg
        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="ml-auto opacity-0 group-hover:opacity-40 transition-opacity flex-shrink-0"
        aria-hidden="true"
      >
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    </Link>
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

  const hasTrades = trades.length > 0;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            XAU/USD · Trading analytics overview
          </p>
        </div>
        <Link
          href="/admin/trades"
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
        </Link>
      </header>

      {/* Empty state */}
      {!hasTrades && (
        <section
          className="rounded-2xl p-16 text-center"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(255,255,255,0.1)',
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
            aria-hidden="true"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
          <h2 className="text-white text-lg font-bold mb-2">No trades yet</h2>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Start logging trades to unlock analytics
          </p>
          <Link
            href="/admin/trades"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              color: 'white',
            }}
          >
            Add first trade
          </Link>
        </section>
      )}

      {hasTrades && analytics && (
        <>
          {/* Primary KPI cards */}
          <section aria-label="Key metrics">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Win Rate"
                value={`${analytics.winRate.toFixed(1)}%`}
                sub={`${analytics.wins}W · ${analytics.losses}L`}
                accent="#34d399"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                    <polyline points="16 7 22 7 22 13"/>
                  </svg>
                }
              />
              <StatCard
                label="P&L"
                value={`${analytics.totalProfitUSD >= 0 ? '+' : ''}${analytics.totalProfitUSD.toFixed(2)}`}
                sub={`of $${settings.deposit.toLocaleString()} deposit`}
                spark={equitySpark}
                accent="#818cf8"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                }
              />
              <StatCard
                label="Profit Factor"
                value={analytics.profitFactor === Infinity ? '∞' : analytics.profitFactor.toFixed(2)}
                sub={analytics.profitFactor >= 1.5 ? '✦ Good' : analytics.profitFactor >= 1 ? 'Positive' : 'Negative'}
                accent="#fbbf24"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                }
              />
              <StatCard
                label="Avg R:R"
                value={`1 : ${analytics.averageRR.toFixed(2)}`}
                sub={`${analytics.totalTrades} total trades`}
                accent="#a78bfa"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"/>
                    <line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                }
              />
            </div>
          </section>

          {/* Secondary stats */}
          <section aria-label="Secondary stats">
            <div className="grid grid-cols-4 gap-3">
              <MiniStat label="Open" value={String(analytics.openTrades)} accent="#fbbf24" />
              <MiniStat label="Win streak" value={String(analytics.winStreak)} accent="#34d399" />
              <MiniStat label="Loss streak" value={String(analytics.lossStreak)} accent="#f87171" />
              <MiniStat label="Total pips" value={`${analytics.totalPips >= 0 ? '+' : ''}${analytics.totalPips.toFixed(1)}`} accent="#818cf8" />
            </div>
          </section>

          {/* Two-column layout */}
          <section aria-label="Strategy and recent trades">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* By strategy */}
              <article
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <header
                  className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <h2 className="text-sm font-semibold text-white">By strategy</h2>
                  <Link
                    href="/admin/charts"
                    className="text-xs font-medium transition-colors hover:text-white"
                    style={{ color: 'rgba(129,140,248,0.7)' }}
                  >
                    View all →
                  </Link>
                </header>
                <div className="p-5">
                  <StrategyBars data={analytics.byStrategy} />
                </div>
              </article>

              {/* Recent trades */}
              <article
                className="rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <header
                  className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <h2 className="text-sm font-semibold text-white">Recent trades</h2>
                  <Link
                    href="/admin/trades"
                    className="text-xs font-medium transition-colors hover:text-white"
                    style={{ color: 'rgba(129,140,248,0.7)' }}
                  >
                    All trades →
                  </Link>
                </header>
                {trades.slice(0, 5).length === 0 ? (
                  <div className="py-10 text-center text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    No trades yet
                  </div>
                ) : (
                  <table className="w-full">
                    <tbody>
                      {trades.slice(0, 5).map(t => <TradeRow key={t.id} trade={t} />)}
                    </tbody>
                  </table>
                )}
              </article>
            </div>
          </section>

          {/* Best / Worst */}
          {(analytics.bestTrade || analytics.worstTrade) && (
            <section aria-label="Best and worst trades">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {analytics.bestTrade && (
                  <article
                    className="rounded-2xl p-5"
                    style={{
                      background: 'linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(16,185,129,0.04) 100%)',
                      border: '1px solid rgba(52,211,153,0.15)',
                    }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(52,211,153,0.6)' }}>
                      Best trade
                    </p>
                    <div className="text-2xl font-bold font-mono" style={{ color: '#34d399' }}>
                      +{analytics.bestTrade.profitUSD?.toFixed(2)}
                    </div>
                    <div className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {analytics.bestTrade.strategy} · {analytics.bestTrade.timeframe}
                    </div>
                  </article>
                )}
                {analytics.worstTrade && (
                  <article
                    className="rounded-2xl p-5"
                    style={{
                      background: 'linear-gradient(135deg, rgba(248,113,113,0.06) 0%, rgba(239,68,68,0.03) 100%)',
                      border: '1px solid rgba(248,113,113,0.12)',
                    }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(248,113,113,0.55)' }}>
                      Worst trade
                    </p>
                    <div className="text-2xl font-bold font-mono" style={{ color: '#f87171' }}>
                      {analytics.worstTrade.profitUSD?.toFixed(2)}
                    </div>
                    <div className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {analytics.worstTrade.strategy} · {analytics.worstTrade.timeframe}
                    </div>
                  </article>
                )}
              </div>
            </section>
          )}
        </>
      )}

      {/* Quick navigation to all tools */}
      <section aria-label="Barcha vositalar">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
          Tezkor Havolalar & Barcha Vositalar
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <QuickNavCard
            href="/admin/ai-analysis"
            label="AI Tahlil Paneli"
            sub="Claude Fable 5"
            accent="#8b5cf6"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
                <path d="M12 6a6 6 0 0 0-6 6 1 1 0 0 0 2 0 4 4 0 0 1 4-4 1 1 0 0 0 0-2z"/>
                <circle cx="12" cy="12" r="2"/>
              </svg>
            }
          />
          <QuickNavCard
            href="/admin/kalkulyator"
            label="Kalkulyator"
            sub="Signal & Gann"
            accent="#f59e0b"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2"/>
                <line x1="8" y1="6" x2="16" y2="6"/>
                <line x1="8" y1="10" x2="8" y2="10"/>
                <line x1="12" y1="10" x2="12" y2="10"/>
                <line x1="16" y1="10" x2="16" y2="10"/>
              </svg>
            }
          />
          <QuickNavCard
            href="/admin/grafik"
            label="Grafik"
            sub="TradingView Live"
            accent="#38bdf8"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            }
          />
          <QuickNavCard
            href="/admin/multi"
            label="Multi-Grid"
            sub="Ko'p grafiklar"
            accent="#818cf8"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="8" height="8" rx="1"/>
                <rect x="13" y="3" width="8" height="8" rx="1"/>
                <rect x="3" y="13" width="8" height="8" rx="1"/>
                <rect x="13" y="13" width="8" height="8" rx="1"/>
              </svg>
            }
          />
          <QuickNavCard
            href="/admin/trap"
            label="Trap Hunter"
            sub="Likvidlik tuzoqlari"
            accent="#f87171"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              </svg>
            }
          />
          <QuickNavCard
            href="/admin/radar"
            label="18-Radar"
            sub="Confluence radar"
            accent="#c084fc"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="6"/>
              </svg>
            }
          />
          <QuickNavCard
            href="/admin/delta"
            label="Vol Delta"
            sub="Order flow tahlili"
            accent="#34d399"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            }
          />
          <QuickNavCard
            href="/admin/checklist"
            label="Checklist"
            sub="Savdo qoidalari"
            accent="#fbbf24"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            }
          />
          <QuickNavCard
            href="/admin/risk"
            label="Risk & Lot"
            sub="Lot hisoblash"
            accent="#38bdf8"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            }
          />
          <QuickNavCard
            href="/admin/prop"
            label="Prop Guard"
            sub="Prop firma nazorati"
            accent="#f43f5e"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            }
          />
          <QuickNavCard
            href="/admin/heatmap"
            label="Heatmap"
            sub="Valyuta kuchi"
            accent="#f97316"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
              </svg>
            }
          />
          <QuickNavCard
            href="/admin/backtest"
            label="Backtest"
            sub="Strategiya sinovi"
            accent="#a855f7"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
              </svg>
            }
          />
          <QuickNavCard
            href="/admin/killzones"
            label="Killzones"
            sub="Bozor sessiyalari"
            accent="#10b981"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 14 14"/>
              </svg>
            }
          />
          <QuickNavCard
            href="/admin/taqvim"
            label="Taqvim"
            sub="Iqtisodiy yangiliklar"
            accent="#ec4899"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            }
          />
          <QuickNavCard
            href="/admin/journal"
            label="Jurnal"
            sub="Savdo qaydlari"
            accent="#eab308"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            }
          />
          <QuickNavCard
            href="/admin/chat"
            label="AI Chat"
            sub="Claude AI tahlil"
            accent="#6366f1"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            }
          />
          <QuickNavCard
            href="/admin/users"
            label="Foydalanuvchilar"
            sub="Akkountlar boshqaruvi"
            accent="#10b981"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            }
          />
        </div>
      </section>
    </div>
  );
}
