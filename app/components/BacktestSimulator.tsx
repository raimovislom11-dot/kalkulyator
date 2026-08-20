'use client';

import { useState, useMemo, memo } from 'react';

function BacktestSimulator() {
  const [selectedStrat, setSelectedStrat] = useState('silver_bullet');
  const [tradeCount, setTradeCount] = useState('50');
  const [riskReward, setRiskReward] = useState('2.5');
  const [winRateInput, setWinRateInput] = useState('68');

  const simulation = useMemo(() => {
    const total = parseInt(tradeCount) || 50;
    const wr = (parseFloat(winRateInput) || 68) / 100;
    const rr = parseFloat(riskReward) || 2.5;

    const wins = Math.round(total * wr);
    const losses = total - wins;
    const startBalance = 1000;
    const riskDollar = 20; // 2% per trade

    const profit = wins * (riskDollar * rr) - losses * riskDollar;
    const finalBal = startBalance + profit;
    const profitFactor = losses > 0 ? ((wins * (riskDollar * rr)) / (losses * riskDollar)).toFixed(2) : '∞';

    return {
      wins,
      losses,
      profit: profit.toFixed(2),
      finalBal: finalBal.toFixed(2),
      profitFactor,
      growthPct: (((finalBal - startBalance) / startBalance) * 100).toFixed(1),
    };
  }, [selectedStrat, tradeCount, riskReward, winRateInput]);

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 mb-4 backdrop-blur-xl shadow-2xl space-y-4">
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <span className="text-2xl">🧬</span>
        <div>
          <h3 className="text-white font-bold text-sm">AI KVANTITATIV BACKTESTING SIMULYATORI</h3>
          <p className="text-slate-400 text-xs mt-0.5">
            Strategiyalarning 50-100 ta bitimdagi statistik ehtimolligi va matematik daromadliligi
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Controls */}
        <div className="space-y-2.5 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Strategiya:</label>
            <select
              value={selectedStrat}
              onChange={(e) => setSelectedStrat(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
            >
              <option value="silver_bullet">🎯 ICT Silver Bullet (60m Window)</option>
              <option value="order_block">🧱 Order Block + FVG Retest</option>
              <option value="smt">⚡ SMT Divergence + Liquidity Sweep</option>
              <option value="breaker">🧱 Breaker Block Scalp</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 block mb-1">Bitimlar Soni:</label>
              <input
                type="number"
                value={tradeCount}
                onChange={(e) => setTradeCount(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Win-Rate (%):</label>
              <input
                type="number"
                value={winRateInput}
                onChange={(e) => setWinRateInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-emerald-400 font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Risk / Reward (R:R):</label>
            <input
              type="number"
              step="0.1"
              value={riskReward}
              onChange={(e) => setRiskReward(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-mono font-bold"
            />
          </div>
        </div>

        {/* Results Matrix */}
        <div className="md:col-span-2 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-emerald-950/40 border border-emerald-500/30 p-2 rounded-xl">
              <span className="text-slate-400 text-[10px] block">Yutuqli (Wins)</span>
              <span className="text-emerald-400 font-bold font-mono text-base">+{simulation.wins}</span>
            </div>
            <div className="bg-rose-950/40 border border-rose-500/30 p-2 rounded-xl">
              <span className="text-slate-400 text-[10px] block">Zararli (Losses)</span>
              <span className="text-rose-400 font-bold font-mono text-base">-{simulation.losses}</span>
            </div>
            <div className="bg-blue-950/40 border border-blue-500/30 p-2 rounded-xl">
              <span className="text-slate-400 text-[10px] block">Profit Factor</span>
              <span className="text-blue-300 font-bold font-mono text-base">{simulation.profitFactor}</span>
            </div>
          </div>

          {/* Growth Summary Card */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-950 p-3 rounded-xl border border-slate-700 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block">$1,000 boshlang'ich balans:</span>
              <span className="text-emerald-400 font-bold font-mono text-lg">${simulation.finalBal}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 text-[10px] block">Kutilayotgan Sof Foyda:</span>
              <span className="text-emerald-300 font-bold font-mono text-base">+${simulation.profit} (+{simulation.growthPct}%)</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-snug">
            💡 Matematika isboti: 68% Win-Rate va 1:2.5 R:R bilan xatto 50 ta bitimda depozit 2 barobardan ko'proqqa o'sadi.
          </p>
        </div>
      </div>
    </div>
  );
}

export default memo(BacktestSimulator);
