'use client';

import { useState, memo } from 'react';

interface CurrencyStrength {
  currency: string;
  score: number; // 0 - 10
  trend: 'Strong' | 'Neutral' | 'Weak';
  color: string;
}

const CURRENCIES: CurrencyStrength[] = [
  { currency: 'USD', score: 8.4, trend: 'Strong', color: 'bg-emerald-500' },
  { currency: 'XAU (Oltin)', score: 9.1, trend: 'Strong', color: 'bg-amber-400' },
  { currency: 'BTC', score: 7.8, trend: 'Strong', color: 'bg-orange-500' },
  { currency: 'GBP', score: 5.6, trend: 'Neutral', color: 'bg-blue-400' },
  { currency: 'EUR', score: 4.2, trend: 'Neutral', color: 'bg-indigo-400' },
  { currency: 'JPY', score: 2.1, trend: 'Weak', color: 'bg-rose-500' },
  { currency: 'CHF', score: 3.5, trend: 'Weak', color: 'bg-red-400' },
];

function MarketHeatmap() {
  const [fearGreedScore] = useState(68); // 68: Greed

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 mb-4 backdrop-blur-xl shadow-2xl space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <div>
            <h3 className="text-white font-bold text-sm">BOZOR ISSIQLIK XARITASI & VALYUTALAR KUCHI</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Aktivlarning o'zaro nisbiy quvvati va bozor psixologiyasi indeksi
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Currency Strength Matrix */}
        <div className="md:col-span-2 bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2.5">
          <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>⚡ VALYUTA VA AKTIVLAR KUCHI (STRENGTH METER)</span>
            <span className="text-[10px] text-slate-500 font-mono">Real-time nisbat</span>
          </div>

          <div className="space-y-2">
            {CURRENCIES.map((c) => (
              <div key={c.currency} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-bold text-slate-200">{c.currency}</span>
                  <span className={c.score > 7 ? 'text-emerald-400 font-bold' : c.score > 4 ? 'text-blue-300' : 'text-rose-400'}>
                    {c.score}/10 ({c.trend})
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${c.color} transition-all duration-700`}
                    style={{ width: `${c.score * 10}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fear & Greed Index Gauge */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between items-center text-center space-y-3">
          <div className="text-xs font-bold text-slate-300">
            🎭 BOZOR PSIXOLOGIYASI (FEAR & GREED)
          </div>

          <div className="relative flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border-4 border-amber-500/30 flex items-center justify-center bg-gradient-to-b from-amber-500/10 to-transparent">
              <div>
                <span className="text-3xl font-black font-mono text-amber-400">{fearGreedScore}</span>
                <span className="block text-[10px] text-slate-400 uppercase font-bold">Ochko'zlik (Greed)</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-900/90 p-2 rounded-lg border border-slate-800 w-full leading-tight">
            💡 Bozor optimistik holatda. Oltin va Kriptoda trend davom etish ehtimoli yuqori.
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(MarketHeatmap);
