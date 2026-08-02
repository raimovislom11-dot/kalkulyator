'use client';

import { useState, useMemo } from 'react';

type Preset = '778 TRD' | 'AB TRADE';

interface RatioConfig {
  rRev: number;
  rCor: number;
  rCons: number;
}

const presetConfigs: Record<Preset, RatioConfig> = {
  '778 TRD': { rRev: 1.0, rCor: 0.166, rCons: 0.5 },
  'AB TRADE': { rRev: 0.3846, rCor: 0.0, rCons: 0.225 },
};

export default function XAUCalculator() {
  const [dailyHigh, setDailyHigh] = useState<string>('4095');
  const [dailyLow, setDailyLow] = useState<string>('4065');
  const [currentPrice, setCurrentPrice] = useState<string>('4070');
  const [preset, setPreset] = useState<Preset>('778 TRD');

  const calculations = useMemo(() => {
    const high = parseFloat(dailyHigh) || 0;
    const low = parseFloat(dailyLow) || 0;
    const current = parseFloat(currentPrice) || 0;
    const rangeVal = high - low;

    if (rangeVal <= 0 || current === 0) {
      return null;
    }

    const config = presetConfigs[preset];

    // Determine direction based on current price position
    const isBuy = current < (high + low) / 2;

    const reversal = isBuy ? low - rangeVal * config.rRev : high + rangeVal * config.rRev;
    const correction = isBuy ? low + rangeVal * config.rCor : high - rangeVal * config.rCor;
    const consolidation = isBuy ? low + rangeVal * config.rCons : high - rangeVal * config.rCons;

    // Calculate percentage from current price
    const reversalPercent = ((Math.abs(current - reversal) / current) * 100).toFixed(2);
    const correctionPercent = ((Math.abs(current - correction) / current) * 100).toFixed(2);
    const consolidationPercent = ((Math.abs(current - consolidation) / current) * 100).toFixed(2);

    const tp1 = isBuy ? current + rangeVal * 0.5 : current - rangeVal * 0.5;
    const tp2 = isBuy ? current + rangeVal : current - rangeVal;
    const tp3 = isBuy ? current + rangeVal * 1.5 : current - rangeVal * 1.5;

    const tp1Percent = ((Math.abs(tp1 - current) / current) * 100).toFixed(2);
    const tp2Percent = ((Math.abs(tp2 - current) / current) * 100).toFixed(2);
    const tp3Percent = ((Math.abs(tp3 - current) / current) * 100).toFixed(2);

    return {
      isBuy,
      reversal: reversal.toFixed(2),
      reversalPercent,
      correction: correction.toFixed(2),
      correctionPercent,
      consolidation: consolidation.toFixed(2),
      consolidationPercent,
      rangeVal: rangeVal.toFixed(2),
      tp1: tp1.toFixed(2),
      tp1Percent,
      tp2: tp2.toFixed(2),
      tp2Percent,
      tp3: tp3.toFixed(2),
      tp3Percent,
    };
  }, [dailyHigh, dailyLow, currentPrice, preset]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* BUY/SELL Toggle */}
        {calculations && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className={`p-4 rounded-2xl border-2 text-center font-bold text-2xl flex items-center justify-center ${
              calculations.isBuy
                ? 'bg-slate-800 border-slate-700 text-green-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <span className="text-3xl mr-2">▲</span>BUY
            </div>
            <div className={`p-4 rounded-2xl border-2 text-center font-bold text-2xl flex items-center justify-center ${
              !calculations.isBuy
                ? 'bg-red-900/20 border-red-600 text-red-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <span className="text-3xl mr-2">▼</span>SELL
            </div>
          </div>
        )}

        {/* Inputs Section */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-6 backdrop-blur">
          <h3 className="text-slate-400 text-xs font-bold tracking-widest mb-4">KUNLIK DIAPAZONI</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-slate-400 text-xs font-bold tracking-widest mb-2 block">HIGH</label>
              <input
                type="number"
                value={dailyHigh}
                onChange={(e) => setDailyHigh(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white text-2xl font-bold focus:border-orange-500 focus:outline-none"
                step="0.01"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold tracking-widest mb-2 block">LOW</label>
              <input
                type="number"
                value={dailyLow}
                onChange={(e) => setDailyLow(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white text-2xl font-bold focus:border-orange-500 focus:outline-none"
                step="0.01"
              />
            </div>
          </div>

          {calculations && (
            <div className="bg-slate-700 rounded-xl px-4 py-3 flex justify-between items-center text-sm">
              <span className="text-slate-400 font-bold">Range: {calculations.rangeVal}</span>
              <span className="text-slate-400 font-bold">&lt;60</span>
            </div>
          )}

          <div className="mt-4">
            <label className="text-slate-400 text-xs font-bold tracking-widest mb-2 block">HOZIRGI TURGAN JOYI</label>
            <input
              type="number"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white text-2xl font-bold focus:border-orange-500 focus:outline-none"
              step="0.01"
              placeholder="Current price"
            />
          </div>

          <div className="mt-4">
            <label className="text-slate-400 text-xs font-bold tracking-widest mb-2 block">PRESET</label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as Preset)}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white font-bold focus:border-orange-500 focus:outline-none"
            >
              <option value="778 TRD">778 TRD</option>
              <option value="AB TRADE">AB TRADE</option>
            </select>
          </div>
        </div>

        {/* Results Section */}
        {calculations && (
          <div className="space-y-4">
            <h3 className="text-slate-400 text-xs font-bold tracking-widest mt-8 mb-4">KIRISH NUQTALARI</h3>

            {/* Entry Points */}
            <div className="bg-slate-800/50 border border-red-600/30 rounded-2xl p-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`px-4 py-2 rounded-lg text-sm font-bold text-center min-w-24 ${
                    calculations.isBuy ? 'bg-red-900/30 text-red-400' : 'bg-red-900/30 text-red-400'
                  }`}>
                    Qaytish
                  </div>
                  <div className="text-3xl font-bold text-red-400">{calculations.reversal}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-400">{calculations.reversalPercent}%</div>
                  <div className={`text-xs font-bold px-2 py-1 rounded ${
                    calculations.isBuy ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                  }`}>
                    {calculations.isBuy ? 'BUY' : 'SELL'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-blue-600/30 rounded-2xl p-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`px-4 py-2 rounded-lg text-sm font-bold text-center min-w-24 text-blue-400 border border-blue-600`}>
                    Korreksiya
                  </div>
                  <div className="text-3xl font-bold text-cyan-400">{calculations.correction}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-400">{calculations.correctionPercent}%</div>
                  <div className={`text-xs font-bold px-2 py-1 rounded ${
                    calculations.isBuy ? 'bg-red-900/30 text-red-400' : 'bg-red-900/30 text-red-400'
                  }`}>
                    {calculations.isBuy ? 'SELL' : 'SELL'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-purple-600/30 rounded-2xl p-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`px-4 py-2 rounded-lg text-sm font-bold text-center min-w-24 text-purple-400 border border-purple-600`}>
                    Konsolidatsiya
                  </div>
                  <div className="text-3xl font-bold text-purple-300">{calculations.consolidation}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-400">{calculations.consolidationPercent}%</div>
                  <div className={`text-xs font-bold px-2 py-1 rounded ${
                    calculations.isBuy ? 'bg-red-900/30 text-red-400' : 'bg-red-900/30 text-red-400'
                  }`}>
                    {calculations.isBuy ? 'SELL' : 'SELL'}
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-slate-400 text-xs font-bold tracking-widest mt-8 mb-4">SAVDO REJASI</h3>

            {/* Entry Range */}
            <div className="bg-slate-800/50 border-2 border-cyan-600/50 rounded-2xl p-5 backdrop-blur">
              <div className="text-slate-400 text-xs font-bold tracking-widest mb-2">ENTRY PRICE</div>
              <div className="text-3xl font-bold text-cyan-400">
                {calculations.correction} - {calculations.consolidation}
              </div>
            </div>

            {/* Take Profits */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/50 border border-green-600/50 rounded-2xl p-4 backdrop-blur">
                <div className="text-green-400 font-bold text-sm mb-2">TP1</div>
                <div className="text-2xl font-bold text-green-400">{calculations.tp1}</div>
                <div className="text-xs text-slate-400 mt-1">{calculations.tp1Percent}%</div>
              </div>
              <div className="bg-slate-800/50 border border-green-600/50 rounded-2xl p-4 backdrop-blur">
                <div className="text-green-400 font-bold text-sm mb-2">TP2</div>
                <div className="text-2xl font-bold text-green-400">{calculations.tp2}</div>
                <div className="text-xs text-slate-400 mt-1">{calculations.tp2Percent}%</div>
              </div>
              <div className="bg-slate-800/50 border border-green-600/50 rounded-2xl p-4 backdrop-blur">
                <div className="text-green-400 font-bold text-sm mb-2">TP3</div>
                <div className="text-2xl font-bold text-green-400">{calculations.tp3}</div>
                <div className="text-xs text-slate-400 mt-1">{calculations.tp3Percent}%</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
