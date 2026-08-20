'use client';

import { useState, memo } from 'react';

interface StrategyVote {
  name: string;
  vote: 'BUY' | 'SELL' | 'NEUTRAL';
  weight: number;
}

const VOTES_DATA: StrategyVote[] = [
  { name: 'Order Block (OB Demand)', vote: 'BUY', weight: 10 },
  { name: 'Breaker Block (BB Retest)', vote: 'BUY', weight: 8 },
  { name: '1m/5m FVG (Fair Value Gap)', vote: 'BUY', weight: 10 },
  { name: 'iFVG (Inverted FVG Support)', vote: 'BUY', weight: 7 },
  { name: 'SMT Divergence (DXY vs Gold)', vote: 'BUY', weight: 10 },
  { name: 'ICT Silver Bullet (NY AM)', vote: 'BUY', weight: 9 },
  { name: 'ICT Judas Swing (Sweep Done)', vote: 'BUY', weight: 9 },
  { name: 'Fibonacci OTE (0.705 Sweet Spot)', vote: 'BUY', weight: 8 },
  { name: 'Ganna Kvadrat 90° Tayanch', vote: 'BUY', weight: 7 },
  { name: 'Liquidity Sweep (SSL Olingan)', vote: 'BUY', weight: 9 },
  { name: 'BOS (Break of Structure Up)', vote: 'BUY', weight: 8 },
  { name: 'CHoCH (Bullish Reversal)', vote: 'BUY', weight: 7 },
  { name: 'Multi-Timeframe H4/M15/M5', vote: 'BUY', weight: 10 },
  { name: 'Yolg\'iz Sham (Displacement)', vote: 'BUY', weight: 6 },
  { name: 'SNR Major Support', vote: 'BUY', weight: 6 },
  { name: 'Matematik ATR Risk Matrix', vote: 'BUY', weight: 8 },
  { name: 'Daily Open / Midnight Open', vote: 'NEUTRAL', weight: 4 },
  { name: 'Swing High Resistance', vote: 'SELL', weight: 4 },
];

function ConfluenceRadar() {
  const totalStrategies = VOTES_DATA.length;
  const buyCount = VOTES_DATA.filter((v) => v.vote === 'BUY').length;
  const sellCount = VOTES_DATA.filter((v) => v.vote === 'SELL').length;
  const neutralCount = VOTES_DATA.filter((v) => v.vote === 'NEUTRAL').length;

  const buyScorePct = Math.round((buyCount / totalStrategies) * 100);

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 mb-4 backdrop-blur-xl shadow-2xl space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧬</span>
          <div>
            <h3 className="text-white font-bold text-sm">AI 18-MATRIX SMART CONFLUENCE RADAR</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              18 ta professional strategiyaning o'zaro "Rozilik" va uyg'unlik foizi
            </p>
          </div>
        </div>
      </div>

      {/* Main Score Bar */}
      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex flex-col items-center justify-center text-slate-950 shadow-xl shadow-emerald-500/25">
            <span className="text-2xl font-black font-mono">{buyScorePct}%</span>
            <span className="text-[10px] font-black uppercase">BUY KUCHI</span>
          </div>
          <div>
            <div className="text-emerald-400 font-bold text-sm">A+ INSTITUTSIONAL SETUP (94% Ishonch)</div>
            <p className="text-slate-300 text-xs mt-0.5 leading-snug">
              18 ta strategiyadan <strong>{buyCount} tasi BUY</strong> yo'nalishini bir ovozdan tasdiqlamoqda.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-bold">
            🟢 BUY: {buyCount} ta
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-400 font-bold">
            🔴 SELL: {sellCount} ta
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 font-bold">
            ⚪ Neytral: {neutralCount} ta
          </span>
        </div>
      </div>

      {/* 18 Strategy Matrix Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {VOTES_DATA.map((s, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-xl border text-[11px] font-mono flex items-center justify-between ${
              s.vote === 'BUY'
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                : s.vote === 'SELL'
                ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                : 'bg-slate-950/40 border-slate-800 text-slate-400'
            }`}
          >
            <span className="truncate mr-1">{s.name}</span>
            <span className="font-bold text-[10px]">
              {s.vote === 'BUY' ? '🟢' : s.vote === 'SELL' ? '🔴' : '⚪'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(ConfluenceRadar);
