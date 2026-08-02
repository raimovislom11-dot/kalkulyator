'use client';

import { useState, useMemo } from 'react';

type Preset = '778 TRD' | 'AB TRADE' | 'Manual';
type Direction = 'BUY' | 'SELL';

interface RatioConfig {
  rRev: number;
  rCor: number;
  rCons: number;
}

const presetConfigs: Record<Preset, RatioConfig> = {
  '778 TRD': { rRev: 1.0, rCor: 0.166, rCons: 0.5 },
  'AB TRADE': { rRev: 0.3846, rCor: 0.0, rCons: 0.225 },
  'Manual': { rRev: 1.0, rCor: 0.166, rCons: 0.5 },
};

export default function XAUCalculator() {
  const [dailyHigh, setDailyHigh] = useState<string>('2100');
  const [dailyLow, setDailyLow] = useState<string>('2050');
  const [direction, setDirection] = useState<Direction>('BUY');
  const [preset, setPreset] = useState<Preset>('778 TRD');
  const [manualRRev, setManualRRev] = useState<string>('1.0');
  const [manualRCor, setManualRCor] = useState<string>('0.166');
  const [manualRCons, setManualRCons] = useState<string>('0.5');
  const [rTp, setRTp] = useState<string>('1.0');

  const calculations = useMemo(() => {
    const high = parseFloat(dailyHigh) || 0;
    const low = parseFloat(dailyLow) || 0;
    const rangeVal = high - low;

    if (rangeVal <= 0) {
      return null;
    }

    const config = preset === 'Manual' 
      ? { rRev: parseFloat(manualRRev) || 0, rCor: parseFloat(manualRCor) || 0, rCons: parseFloat(manualRCons) || 0 }
      : presetConfigs[preset];

    const isBuy = direction === 'BUY';
    const tpMultiplier = parseFloat(rTp) || 1.0;

    const reversal = isBuy ? low - rangeVal * config.rRev : high + rangeVal * config.rRev;
    const correction = isBuy ? low + rangeVal * config.rCor : high - rangeVal * config.rCor;
    const consolidation = isBuy ? low + rangeVal * config.rCons : high - rangeVal * config.rCons;

    const entryLevel = correction;
    const slLvl = reversal;
    const tp1 = isBuy ? entryLevel + rangeVal * tpMultiplier : entryLevel - rangeVal * tpMultiplier;
    const tp2 = isBuy ? entryLevel + rangeVal * tpMultiplier * 2 : entryLevel - rangeVal * tpMultiplier * 2;
    const tp3 = isBuy ? entryLevel + rangeVal * tpMultiplier * 3 : entryLevel - rangeVal * tpMultiplier * 3;

    const risk = Math.abs(entryLevel - slLvl);
    const rr1 = risk > 0 ? Math.abs(tp1 - entryLevel) / risk : 0;
    const rr2 = risk > 0 ? Math.abs(tp2 - entryLevel) / risk : 0;
    const rr3 = risk > 0 ? Math.abs(tp3 - entryLevel) / risk : 0;

    return {
      reversal: reversal.toFixed(2),
      correction: correction.toFixed(2),
      consolidation: consolidation.toFixed(2),
      entryLevel: entryLevel.toFixed(2),
      slLvl: slLvl.toFixed(2),
      tp1: tp1.toFixed(2),
      tp2: tp2.toFixed(2),
      tp3: tp3.toFixed(2),
      rr1: rr1.toFixed(2),
      rr2: rr2.toFixed(2),
      rr3: rr3.toFixed(2),
      risk: risk.toFixed(2),
    };
  }, [dailyHigh, dailyLow, direction, preset, manualRRev, manualRCor, manualRCons, rTp]);

  const handleInputChange = (value: string, setter: (v: string) => void) => {
    setter(value === '' ? '' : value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">XAU Range Trading Calculator</h1>
          <p className="text-slate-400">Calculate entry, exit, and risk-reward levels</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>

            <div className="space-y-5">
              {/* Daily High/Low */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Daily High</label>
                  <input
                    type="number"
                    value={dailyHigh}
                    onChange={(e) => handleInputChange(e.target.value, setDailyHigh)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                    placeholder="2100"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Daily Low</label>
                  <input
                    type="number"
                    value={dailyLow}
                    onChange={(e) => handleInputChange(e.target.value, setDailyLow)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                    placeholder="2050"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Direction */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Direction</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDirection('BUY')}
                    className={`py-3 rounded-lg font-semibold transition-colors ${
                      direction === 'BUY'
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    BUY
                  </button>
                  <button
                    onClick={() => setDirection('SELL')}
                    className={`py-3 rounded-lg font-semibold transition-colors ${
                      direction === 'SELL'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    SELL
                  </button>
                </div>
              </div>

              {/* Preset Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Preset</label>
                <select
                  value={preset}
                  onChange={(e) => setPreset(e.target.value as Preset)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="778 TRD">778 TRD</option>
                  <option value="AB TRADE">AB TRADE</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>

              {/* Manual Ratios */}
              {preset === 'Manual' && (
                <div className="bg-slate-700 p-4 rounded-lg space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Reversal Ratio (rRev)</label>
                    <input
                      type="number"
                      value={manualRRev}
                      onChange={(e) => handleInputChange(e.target.value, setManualRRev)}
                      className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                      step="0.001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Correction Ratio (rCor)</label>
                    <input
                      type="number"
                      value={manualRCor}
                      onChange={(e) => handleInputChange(e.target.value, setManualRCor)}
                      className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                      step="0.001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Consolidation Ratio (rCons)</label>
                    <input
                      type="number"
                      value={manualRCons}
                      onChange={(e) => handleInputChange(e.target.value, setManualRCons)}
                      className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                      step="0.001"
                    />
                  </div>
                </div>
              )}

              {/* TP Ratio */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">TP Step Ratio (rTp)</label>
                <input
                  type="number"
                  value={rTp}
                  onChange={(e) => handleInputChange(e.target.value, setRTp)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                  placeholder="1.0"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Trading Plan</h2>

            {calculations ? (
              <div className="space-y-4">
                <div className="bg-slate-700 p-4 rounded-lg">
                  <p className="text-slate-400 text-sm mb-1">Direction</p>
                  <p className={`text-2xl font-bold ${direction === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                    {direction}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-orange-900/30 border border-orange-700 p-4 rounded-lg">
                    <p className="text-slate-400 text-sm mb-1">Reversal Level</p>
                    <p className="text-xl font-bold text-orange-400">{calculations.reversal}</p>
                  </div>
                  <div className="bg-blue-900/30 border border-blue-700 p-4 rounded-lg">
                    <p className="text-slate-400 text-sm mb-1">Correction Level</p>
                    <p className="text-xl font-bold text-blue-400">{calculations.correction}</p>
                  </div>
                  <div className="bg-purple-900/30 border border-purple-700 p-4 rounded-lg">
                    <p className="text-slate-400 text-sm mb-1">Consolidation Level</p>
                    <p className="text-xl font-bold text-purple-400">{calculations.consolidation}</p>
                  </div>
                  <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
                    <p className="text-slate-400 text-sm mb-1">Risk (Points)</p>
                    <p className="text-xl font-bold text-slate-200">{calculations.risk}</p>
                  </div>
                </div>

                <div className="border-t border-slate-600 pt-4 mt-4">
                  <p className="text-slate-400 text-sm mb-4 font-semibold">Entry & Exit Levels</p>

                  <div className="bg-slate-700 p-4 rounded-lg mb-3">
                    <p className="text-slate-400 text-sm mb-1">Entry Level</p>
                    <p className="text-2xl font-bold text-yellow-400">{calculations.entryLevel}</p>
                  </div>

                  <div className="bg-red-900/30 border border-red-700 p-4 rounded-lg mb-3">
                    <p className="text-slate-400 text-sm mb-1">Stop Loss</p>
                    <p className="text-2xl font-bold text-red-400">{calculations.slLvl}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="bg-teal-900/30 border border-teal-700 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">TP1</span>
                        <div className="text-right">
                          <p className="text-lg font-bold text-teal-400">{calculations.tp1}</p>
                          <p className="text-xs text-teal-300">RR {calculations.rr1}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-teal-900/30 border border-teal-700 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">TP2</span>
                        <div className="text-right">
                          <p className="text-lg font-bold text-teal-400">{calculations.tp2}</p>
                          <p className="text-xs text-teal-300">RR {calculations.rr2}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-teal-900/30 border border-teal-700 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-sm">TP3</span>
                        <div className="text-right">
                          <p className="text-lg font-bold text-teal-400">{calculations.tp3}</p>
                          <p className="text-xs text-teal-300">RR {calculations.rr3}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-400">Enter valid daily high and low to calculate</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
