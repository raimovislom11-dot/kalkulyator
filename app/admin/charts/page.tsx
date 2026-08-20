'use client';

import { useEffect, useRef, useState } from 'react';
import { tradesStore, settingsStore, computeAnalytics } from '../../lib/store';
import type { Trade, AnalyticsData } from '../../lib/types';
import type { CandlestickData, AreaData, HistogramData, Time } from 'lightweight-charts';

function generateDemoCandles(days = 90) {
  const candles = [];
  let price = 3320;
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const change = (Math.random() - 0.48) * 18;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 8;
    const low = Math.min(open, close) - Math.random() * 8;
    candles.push({
      time: d.toISOString().slice(0, 10),
      open: +open.toFixed(2), high: +high.toFixed(2),
      low: +low.toFixed(2), close: +close.toFixed(2),
    });
    price = close;
  }
  return candles;
}

type ChartMode = 'candles' | 'equity' | 'pnl';

function LWChart({ mode, trades, deposit }: { mode: ChartMode; trades: Trade[]; deposit: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let cleanup = () => {};

    import('lightweight-charts').then(({ createChart, ColorType, CrosshairMode, CandlestickSeries, AreaSeries, HistogramSeries }) => {
      if (!containerRef.current) return;

      const chart = createChart(containerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: 'rgba(255,255,255,0.3)',
        },
        grid: {
          vertLines: { color: 'rgba(255,255,255,0.04)' },
          horzLines: { color: 'rgba(255,255,255,0.04)' },
        },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: 'rgba(255,255,255,0.07)', textColor: 'rgba(255,255,255,0.3)' },
        timeScale: { borderColor: 'rgba(255,255,255,0.07)', timeVisible: true, secondsVisible: false },
        width: containerRef.current.clientWidth,
        height: 420,
      });

      const ro = new ResizeObserver(e => {
        for (const en of e) chart.applyOptions({ width: en.contentRect.width });
      });
      ro.observe(containerRef.current);

      if (mode === 'candles') {
        const s = chart.addSeries(CandlestickSeries, {
          upColor: '#34d399', downColor: '#f87171',
          borderUpColor: '#34d399', borderDownColor: '#f87171',
          wickUpColor: '#34d39980', wickDownColor: '#f8717180',
        });
        s.setData(generateDemoCandles(90) as CandlestickData[]);
      } else if (mode === 'equity') {
        const analytics = computeAnalytics(trades, deposit);
        const s = chart.addSeries(AreaSeries, {
          lineColor: '#818cf8', topColor: 'rgba(129,140,248,0.2)',
          bottomColor: 'rgba(129,140,248,0)', lineWidth: 2,
        });
        const data = analytics.equityCurve.length > 1
          ? analytics.equityCurve
          : [
              { time: new Date(Date.now() - 86400000).toISOString().slice(0, 10), value: deposit },
              { time: new Date().toISOString().slice(0, 10), value: deposit },
            ];
        s.setData(data as AreaData<Time>[]);
      } else {
        const s = chart.addSeries(HistogramSeries, { color: '#818cf8', priceFormat: { type: 'price', precision: 2 } });
        const closed = trades
          .filter(t => t.result !== 'OPEN' && t.profitUSD !== undefined)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        if (!closed.length) {
          s.setData([{ time: new Date().toISOString().slice(0, 10) as Time, value: 0, color: 'rgba(255,255,255,0.08)' }]);
        } else {
          s.setData(closed.map(t => ({
            time: t.date.slice(0, 10) as Time,
            value: t.profitUSD!,
            color: (t.profitUSD ?? 0) >= 0 ? '#34d399' : '#f87171',
          })) as HistogramData<Time>[]);
        }
      }

      chart.timeScale().fitContent();
      cleanup = () => { ro.disconnect(); chart.remove(); };
    });

    return () => cleanup();
  }, [mode, trades, deposit]);

  return <div ref={containerRef} className="w-full rounded-b-2xl overflow-hidden" />;
}

export default function ChartsPage() {
  const [mode, setMode] = useState<ChartMode>('candles');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [deposit, setDeposit] = useState(10000);
  const [mounted, setMounted] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    setMounted(true);
    const t = tradesStore.getAll();
    const s = settingsStore.get();
    setTrades(t);
    setDeposit(s.deposit);
    setAnalytics(computeAnalytics(t, s.deposit));
  }, []);

  const MODES: { key: ChartMode; label: string; color: string }[] = [
    { key: 'candles', label: 'Candlestick', color: '#fbbf24' },
    { key: 'equity', label: 'Equity curve', color: '#818cf8' },
    { key: 'pnl', label: 'P&L', color: '#34d399' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Charts</h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            TradingView Lightweight Charts · Visual analysis
          </p>
        </div>
      </header>

      {/* Mode tabs */}
      <div
        className="inline-flex p-1 rounded-xl gap-1"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        role="tablist"
        aria-label="Chart mode"
      >
        {MODES.map(m => (
          <button
            key={m.key}
            role="tab"
            aria-selected={mode === m.key}
            onClick={() => setMode(m.key)}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
            style={
              mode === m.key
                ? {
                    background: `linear-gradient(135deg, ${m.color}25, ${m.color}15)`,
                    color: m.color,
                    border: `1px solid ${m.color}30`,
                    boxShadow: `0 2px 8px ${m.color}20`,
                  }
                : { color: 'rgba(255,255,255,0.35)' }
            }
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Chart panel */}
      <section
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
        aria-label="Chart panel"
      >
        <header
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <h2 className="text-sm font-semibold text-white">
            {mode === 'candles' ? 'XAU/USD · Candlestick' : mode === 'equity' ? 'Equity Curve' : 'P&L per trade'}
          </h2>
          {mode === 'candles' && (
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest"
              style={{ background: 'rgba(251,191,36,0.1)', color: 'rgba(251,191,36,0.7)', border: '1px solid rgba(251,191,36,0.2)' }}
            >
              DEMO DATA
            </span>
          )}
        </header>
        <div>
          {mounted ? (
            <LWChart mode={mode} trades={trades} deposit={deposit} />
          ) : (
            <div className="flex items-center justify-center h-[420px]">
              <div
                className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
                style={{ borderTopColor: '#818cf8', borderRightColor: '#818cf8' }}
                role="status"
                aria-label="Loading chart..."
              />
            </div>
          )}
        </div>
      </section>

      {/* Stats */}
      {mounted && analytics && (
        <section aria-label="Chart statistics">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'P&L', value: `${analytics.totalProfitUSD >= 0 ? '+' : ''}${analytics.totalProfitUSD.toFixed(2)}`, accent: '#34d399' },
              { label: 'Trades', value: String(analytics.totalTrades), accent: '#818cf8' },
              { label: 'Win Rate', value: `${analytics.winRate.toFixed(1)}%`, accent: '#34d399' },
              { label: 'Profit Factor', value: analytics.profitFactor === Infinity ? '∞' : analytics.profitFactor.toFixed(2), accent: '#fbbf24' },
            ].map(s => (
              <div
                key={s.label}
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {s.label}
                </div>
                <div className="text-lg font-bold font-mono" style={{ color: s.accent }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Timeframe table */}
      {mounted && analytics && Object.keys(analytics.byTimeframe).length > 0 && (
        <section aria-label="Performance by timeframe">
          <article
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <header
              className="px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              <h2 className="text-sm font-semibold text-white">By timeframe</h2>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {['Timeframe', 'Trades', 'Win', 'Loss', 'Win Rate'].map(h => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest"
                        style={{ color: 'rgba(255,255,255,0.25)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analytics.byTimeframe).map(([tf, s]) => {
                    const wr = s.total > 0 ? (s.wins / s.total) * 100 : 0;
                    return (
                      <tr
                        key={tf}
                        className="transition-colors duration-150 hover:bg-white/[0.02]"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      >
                        <td className="px-5 py-3 text-white text-sm font-mono font-bold">{tf}</td>
                        <td className="px-5 py-3 text-sm font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.total}</td>
                        <td className="px-5 py-3 text-sm font-mono" style={{ color: '#34d399' }}>{s.wins}</td>
                        <td className="px-5 py-3 text-sm font-mono" style={{ color: '#f87171' }}>{s.losses}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-20 h-1.5 rounded-full overflow-hidden"
                              style={{ background: 'rgba(255,255,255,0.06)' }}
                            >
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${wr}%`, background: 'linear-gradient(90deg, #818cf8, #a78bfa)' }}
                              />
                            </div>
                            <span className="text-xs font-bold font-mono" style={{ color: '#818cf8' }}>
                              {wr.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      )}
    </div>
  );
}
