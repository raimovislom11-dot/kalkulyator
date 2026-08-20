'use client';

import { useState, memo } from 'react';

function MultiChartGrid() {
  const [layout, setLayout] = useState<'2' | '4'>('2');

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 mb-4 backdrop-blur-xl shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🪟</span>
          <div>
            <h3 className="text-white font-bold text-sm">MULTI-CHART SPLIT VIEW (2x2 / 1x2 GRID)</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              XAU/USD, DXY va EUR/USD grafiklarini bir vaqtda yonma-yon kuzatish
            </p>
          </div>
        </div>

        {/* Layout Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setLayout('2')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              layout === '2' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            2 Grafik (1x2)
          </button>
          <button
            onClick={() => setLayout('4')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              layout === '4' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            4 Grafik (2x2)
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className={`grid gap-3 ${layout === '2' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
        {/* Chart 1: Gold 15m */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden h-80 flex flex-col">
          <div className="bg-slate-900/90 px-3 py-1.5 border-b border-slate-800 text-xs font-bold text-amber-400 flex justify-between items-center">
            <span>🥇 XAU/USD (Gold) • 15m</span>
            <span className="text-[10px] text-slate-400 font-mono">HTF Trend</span>
          </div>
          <iframe
            src="https://s.tradingview.com/widgetembed/?symbol=OANDA%3AXAUUSD&interval=15&theme=dark&style=1"
            className="w-full flex-1 border-0"
          />
        </div>

        {/* Chart 2: Gold 1m / Scalp */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden h-80 flex flex-col">
          <div className="bg-slate-900/90 px-3 py-1.5 border-b border-slate-800 text-xs font-bold text-orange-400 flex justify-between items-center">
            <span>⚡ XAU/USD (Gold) • 1m</span>
            <span className="text-[10px] text-emerald-400 font-mono">Tezkor Trigger</span>
          </div>
          <iframe
            src="https://s.tradingview.com/widgetembed/?symbol=OANDA%3AXAUUSD&interval=1&theme=dark&style=1"
            className="w-full flex-1 border-0"
          />
        </div>

        {layout === '4' && (
          <>
            {/* Chart 3: DXY (Dollar Index) */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden h-80 flex flex-col">
              <div className="bg-slate-900/90 px-3 py-1.5 border-b border-slate-800 text-xs font-bold text-emerald-400 flex justify-between items-center">
                <span>💵 DXY (Dollar Index) • 15m</span>
                <span className="text-[10px] text-slate-400 font-mono">SMT Korrelyatsiya</span>
              </div>
              <iframe
                src="https://s.tradingview.com/widgetembed/?symbol=TVC%3ADXY&interval=15&theme=dark&style=1"
                className="w-full flex-1 border-0"
              />
            </div>

            {/* Chart 4: EUR/USD */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden h-80 flex flex-col">
              <div className="bg-slate-900/90 px-3 py-1.5 border-b border-slate-800 text-xs font-bold text-blue-400 flex justify-between items-center">
                <span>💶 EUR/USD • 15m</span>
                <span className="text-[10px] text-slate-400 font-mono">Forex Major</span>
              </div>
              <iframe
                src="https://s.tradingview.com/widgetembed/?symbol=FX%3AEURUSD&interval=15&theme=dark&style=1"
                className="w-full flex-1 border-0"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default memo(MultiChartGrid);
