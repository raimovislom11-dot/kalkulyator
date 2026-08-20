'use client';

import { useState, useMemo, memo } from 'react';

function PropRiskCalculator() {
  // Prop account settings
  const [accountSize, setAccountSize] = useState('10000');
  const [dailyLossLimitPct, setDailyLossLimitPct] = useState('5');
  const [maxLossLimitPct, setMaxLossLimitPct] = useState('10');
  const [todayLoss, setTodayLoss] = useState('120');

  // Compound settings
  const [compoundDays, setCompoundDays] = useState('30');
  const [dailyGrowthPct, setDailyGrowthPct] = useState('2');

  // Prop calculations
  const acct = parseFloat(accountSize) || 0;
  const dailyLimitDollar = acct * ((parseFloat(dailyLossLimitPct) || 5) / 100);
  const maxLimitDollar = acct * ((parseFloat(maxLossLimitPct) || 10) / 100);
  const currentLoss = parseFloat(todayLoss) || 0;
  const remainingDailyBuffer = Math.max(0, dailyLimitDollar - currentLoss);
  const bufferPercent = Math.min(100, Math.round((currentLoss / dailyLimitDollar) * 100));

  // Compound calculations
  const compoundResult = useMemo(() => {
    const start = parseFloat(accountSize) || 1000;
    const days = parseInt(compoundDays) || 30;
    const rate = (parseFloat(dailyGrowthPct) || 2) / 100;

    let total = start;
    for (let i = 0; i < days; i++) {
      total += total * rate;
    }
    return {
      finalBalance: total.toFixed(2),
      profitDollar: (total - start).toFixed(2),
      totalGrowthPct: (((total - start) / start) * 100).toFixed(1),
    };
  }, [accountSize, compoundDays, dailyGrowthPct]);

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 mb-4 backdrop-blur-xl shadow-2xl space-y-4">
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <span className="text-2xl">🛡️</span>
        <div>
          <h3 className="text-white font-bold text-sm">PROP FIRM RISK GUARD & MURAKKAB FOIZ</h3>
          <p className="text-slate-400 text-xs mt-0.5">
            FTMO / FundedNext limitlari monitoringi va depozit o'sish hisoblagichi
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Prop Firm Drawdown Guard */}
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <span>🏛️</span> PROP DRAWDOWN QALQONI
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              Limit: {dailyLossLimitPct}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Hisob Balansi ($):</label>
              <input
                type="number"
                value={accountSize}
                onChange={(e) => setAccountSize(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Bugungi Zarar ($):</label>
              <input
                type="number"
                value={todayLoss}
                onChange={(e) => setTodayLoss(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-red-400 font-mono font-bold focus:outline-none focus:border-red-400"
              />
            </div>
          </div>

          {/* Drawdown Gauge Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>Ishlatilgan limit: {bufferPercent}%</span>
              <span>Maksimal kunlik: ${dailyLimitDollar}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  bufferPercent > 80 ? 'bg-red-500' : bufferPercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${bufferPercent}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-xs flex items-center justify-between">
            <span className="text-slate-400">Qolgan xavfsiz zaxira:</span>
            <span className="font-bold font-mono text-emerald-400 text-sm">${remainingDailyBuffer.toFixed(2)}</span>
          </div>
        </div>

        {/* 2. Compound Interest Growth (Murakkab Foiz) */}
        <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <span>📈</span> MURAKKAB FOIZ PROGNOZI
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 font-mono border border-emerald-500/30">
              +{compoundResult.totalGrowthPct}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Kunlik Foyda (%):</label>
              <input
                type="number"
                value={dailyGrowthPct}
                onChange={(e) => setDailyGrowthPct(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Savdo Kunlari (Kun):</label>
              <input
                type="number"
                value={compoundDays}
                onChange={(e) => setCompoundDays(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-500/30 rounded-xl p-2.5 flex items-center justify-between text-xs">
            <div>
              <div className="text-slate-400 text-[10px]">Kutilayotgan yakuniy balans:</div>
              <div className="text-emerald-300 font-bold font-mono text-base">${compoundResult.finalBalance}</div>
            </div>
            <div className="text-right">
              <div className="text-slate-400 text-[10px]">Sof Foyda:</div>
              <div className="text-teal-400 font-bold font-mono text-sm">+${compoundResult.profitDollar}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(PropRiskCalculator);
