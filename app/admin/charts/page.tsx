'use client';

import { useEffect, useRef, useState } from 'react';
import { tradesStore, settingsStore, computeAnalytics } from '../../lib/store';
import type { Trade, AnalyticsData } from '../../lib/types';
// lightweight-charts v5 named series exports
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
          background: { type: ColorType.Solid, color: '#000' },
          textColor: '#444',
        },
        grid: {
          vertLines: { color: '#111' },
          horzLines: { color: '#111' },
        },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: '#1f1f1f', textColor: '#444' },
        timeScale: { borderColor: '#1f1f1f', timeVisible: true, secondsVisible: false },
        width: containerRef.current.clientWidth,
        height: 400,
      });

      const ro = new ResizeObserver(e => {
        for (const en of e) chart.applyOptions({ width: en.contentRect.width });
      });
      ro.observe(containerRef.current);

      if (mode === 'candles') {
        const s = chart.addSeries(CandlestickSeries, {
          upColor: '#fff', downColor: '#333',
          borderUpColor: '#fff', borderDownColor: '#555',
          wickUpColor: '#666', wickDownColor: '#444',
        });
        s.setData(generateDemoCandles(90) as CandlestickData[]);
      } else if (mode === 'equity') {
        const analytics = computeAnalytics(trades, deposit);
        const s = chart.addSeries(AreaSeries, {
          lineColor: '#fff', topColor: 'rgba(255,255,255,0.1)',
          bottomColor: 'rgba(255,255,255,0)', lineWidth: 1,
        });
        const data = analytics.equityCurve.length > 1
          ? analytics.equityCurve
          : [
              { time: new Date(Date.now() - 86400000).toISOString().slice(0, 10), value: deposit },
              { time: new Date().toISOString().slice(0, 10), value: deposit },
            ];
        s.setData(data as AreaData<Time>[]);
      } else {
        const s = chart.addSeries(HistogramSeries, { color: '#fff', priceFormat: { type: 'price', precision: 2 } });
        const closed = trades
          .filter(t => t.result !== 'OPEN' && t.profitUSD !== undefined)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        if (!closed.length) {
          s.setData([{ time: new Date().toISOString().slice(0, 10) as Time, value: 0, color: '#1f1f1f' }]);
        } else {
          s.setData(closed.map(t => ({
            time: t.date.slice(0, 10) as Time,
            value: t.profitUSD!,
            color: (t.profitUSD ?? 0) >= 0 ? '#fff' : '#333',
          })) as HistogramData<Time>[]);
        }
      }

      chart.timeScale().fitContent();
      cleanup = () => { ro.disconnect(); chart.remove(); };
    });

    return () => cleanup();
  }, [mode, trades, deposit]);

  return <div ref={containerRef} className="w-full rounded-md overflow-hidden" />;
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

  const MODES: { key: ChartMode; label: string }[] = [
    { key: 'candles', label: 'Candlestick' },
    { key: 'equity', label: 'Equity curve' },
    { key: 'pnl', label: 'P&L' },
  ];

  return (
    <div className="space-y-8">
      <div className="border-b border-[#1f1f1f] pb-6">
        <h1 className="text-xl font-semibold text-white tracking-tight">Charts</h1>
        <p className="text-[#555] text-sm mt-0.5">TradingView Lightweight Charts</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0a0a0a] border border-[#1f1f1f] rounded-md p-1 w-fit">
        {MODES.map(m => (
          <button key={m.key} onClick={() => setMode(m.key)}
            className={`px-4 py-1.5 rounded text-sm transition-colors ${
              mode === m.key ? 'bg-white text-black font-medium' : 'text-[#555] hover:text-white'
            }`}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="border border-[#1f1f1f] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1f1f1f]">
          <div className="text-sm font-medium text-white">
            {mode === 'candles' ? 'XAU/USD' : mode === 'equity' ? 'Equity Curve' : 'P&L per trade'}
          </div>
          {mode === 'candles' && (
            <div className="text-[10px] text-[#444] uppercase tracking-widest border border-[#1f1f1f] px-2 py-1 rounded">DEMO</div>
          )}
        </div>
        <div className="p-0">
          {mounted ? (
            <LWChart mode={mode} trades={trades} deposit={deposit} />
          ) : (
            <div className="flex items-center justify-center h-[400px]">
              <div className="w-5 h-5 border border-[#333] border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {mounted && analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'P&L', value: `${analytics.totalProfitUSD >= 0 ? '+' : ''}${analytics.totalProfitUSD.toFixed(2)}` },
            { label: 'Trades', value: String(analytics.totalTrades) },
            { label: 'Win Rate', value: `${analytics.winRate.toFixed(1)}%` },
            { label: 'Profit Factor', value: analytics.profitFactor === Infinity ? '∞' : analytics.profitFactor.toFixed(2) },
          ].map(s => (
            <div key={s.label} className="border border-[#1f1f1f] rounded-lg p-4">
              <div className="text-[10px] text-[#444] uppercase tracking-widest mb-1.5">{s.label}</div>
              <div className="text-lg font-semibold text-white font-mono">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Timeframe table */}
      {mounted && analytics && Object.keys(analytics.byTimeframe).length > 0 && (
        <div className="border border-[#1f1f1f] rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-[#1f1f1f]">
            <div className="text-sm font-medium text-white">By timeframe</div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#111]">
                {['Timeframe', 'Trades', 'Win', 'Loss', 'Win Rate'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] text-[#444] uppercase tracking-widest font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(analytics.byTimeframe).map(([tf, s]) => {
                const wr = s.total > 0 ? (s.wins / s.total) * 100 : 0;
                return (
                  <tr key={tf} className="border-b border-[#0d0d0d] hover:bg-[#0a0a0a] transition-colors">
                    <td className="px-5 py-3 text-white text-sm font-mono">{tf}</td>
                    <td className="px-5 py-3 text-[#666] text-sm">{s.total}</td>
                    <td className="px-5 py-3 text-white text-sm">{s.wins}</td>
                    <td className="px-5 py-3 text-[#555] text-sm">{s.losses}</td>
                    <td className="px-5 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-px bg-[#1f1f1f] relative">
                          <div className="h-px bg-white absolute" style={{ width: `${wr}%` }} />
                        </div>
                        <span className="text-white text-xs font-mono">{wr.toFixed(0)}%</span>
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
  );
}
