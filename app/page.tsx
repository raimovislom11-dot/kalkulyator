'use client';

import { useState, useMemo, useEffect } from 'react';

type Preset = '778 TRD' | 'AB TRADE' | '2.6 STRATEGY';

interface RatioConfig {
  rRev: number;
  rCor: number;
  rCons: number;
}

const presetConfigs: Record<Preset, RatioConfig> = {
  '778 TRD': { rRev: 1.0, rCor: 0.166, rCons: 0.5 },
  'AB TRADE': { rRev: 0.3846, rCor: 0.0, rCons: 0.225 },
  '2.6 STRATEGY': { rRev: 1 / 2.6, rCor: 0.0, rCons: 0.0 },
};

const getTimeBasedPassword = (): string => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}${minutes}`;
};

function PasswordScreen({ onAuthenticate }: { onAuthenticate: () => void }) {
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    setCurrentTime(getTimeBasedPassword());
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === getTimeBasedPassword()) {
      onAuthenticate();
    } else {
      setPasswordInput('');
      alert("Parol noto'g'ri!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{backgroundImage: "url('/image.png')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat'}}>
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 backdrop-blur">
          <h1 className="text-3xl font-bold text-white text-center mb-2">XAU Calculator</h1>
          <p className="text-slate-400 text-center mb-8">Kirish uchun parol kiriting</p>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="text-slate-400 text-sm font-bold tracking-widest mb-2 block">PAROL</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-4 bg-slate-700 border border-slate-600 rounded-xl text-white text-2xl font-bold text-center focus:border-orange-500 focus:outline-none tracking-widest"
                placeholder="0000"
                maxLength={4}
                autoFocus
              />
              <p className="text-slate-500 text-xs mt-2 text-center">Hozirgi soat: {currentTime}</p>
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold rounded-xl transition-all active:scale-95"
            >
              KIRISH
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function CalculatorContent() {
  const [dailyHigh, setDailyHigh] = useState<string>('4095');
  const [dailyLow, setDailyLow] = useState<string>('4065');
  const [currentPrice, setCurrentPrice] = useState<string>('4070');
  const [preset, setPreset] = useState<Preset>('778 TRD');
  const [hhPrice, setHhPrice] = useState<string>('');
  const [llPrice, setLlPrice] = useState<string>('');

  const calculations = useMemo(() => {
    const high = parseFloat(dailyHigh) || 0;
    const low = parseFloat(dailyLow) || 0;
    const current = parseFloat(currentPrice) || 0;
    const rangeVal = high - low;

    if (rangeVal <= 0 || current === 0) return null;

    const config = presetConfigs[preset];

    let isBuy: boolean;
    if (preset === '2.6 STRATEGY') {
      const hh = parseFloat(hhPrice);
      const ll = parseFloat(llPrice);
      if (!isNaN(hh) && !isNaN(ll)) {
        isBuy = Math.abs(current - ll) < Math.abs(current - hh);
      } else {
        isBuy = current < (high + low) / 2;
      }
    } else {
      isBuy = current < (high + low) / 2;
    }

    const reversal = isBuy
      ? low - rangeVal * config.rRev
      : high + rangeVal * config.rRev;

    const correction = isBuy
      ? low + rangeVal * config.rCor
      : high - rangeVal * config.rCor;

    const consolidation = isBuy ? correction + 3.0 : correction - 3.0;

    const reversalPercent = ((Math.abs(current - reversal) / current) * 100).toFixed(2);
    const correctionPercent = ((Math.abs(current - correction) / current) * 100).toFixed(2);
    const consolidationPercent = ((Math.abs(current - consolidation) / current) * 100).toFixed(2);

    let stopLoss: number;
    if (preset === '2.6 STRATEGY') {
      stopLoss = isBuy ? reversal - 3.0 : reversal + 3.0;
    } else {
      stopLoss = isBuy
        ? Math.min(correction, consolidation) - 3.0
        : Math.max(correction, consolidation) + 3.0;
    }
    const stopLossPercent = ((Math.abs(current - stopLoss) / current) * 100).toFixed(2);

    const tp1 = isBuy ? current + rangeVal * 0.5 : current - rangeVal * 0.5;
    const tp2 = isBuy ? current + rangeVal : current - rangeVal;
    const tp3 = isBuy ? current + rangeVal * 1.5 : current - rangeVal * 1.5;

    const tp1Percent = ((Math.abs(tp1 - current) / current) * 100).toFixed(2);
    const tp2Percent = ((Math.abs(tp2 - current) / current) * 100).toFixed(2);
    const tp3Percent = ((Math.abs(tp3 - current) / current) * 100).toFixed(2);

    // Gann Square of 9 — 0.25 qadam bilan
    const gannSqrt = Math.sqrt(current);
    const gannS1 = Math.pow(gannSqrt - 0.25, 2);
    const gannS2 = Math.pow(gannSqrt - 0.50, 2);
    const gannS3 = Math.pow(gannSqrt - 0.75, 2);
    const gannS4 = Math.pow(gannSqrt - 1.00, 2);
    const gannR1 = Math.pow(gannSqrt + 0.25, 2);
    const gannR2 = Math.pow(gannSqrt + 0.50, 2);
    const gannR3 = Math.pow(gannSqrt + 0.75, 2);
    const gannR4 = Math.pow(gannSqrt + 1.00, 2);

    // Gann confluence tekshiruvi
    let gannCheckCenter: number;
    let gannTolerance: number;

    if (preset === '2.6 STRATEGY') {
      gannCheckCenter = reversal;
      gannTolerance = 5.0;
    } else {
      gannCheckCenter = (Math.min(correction, consolidation) + Math.max(correction, consolidation)) / 2;
      gannTolerance = 3.0;
    }

    const gannCheckMin = gannCheckCenter - gannTolerance;
    const gannCheckMax = gannCheckCenter + gannTolerance;

    let gannConfluence = '';
    let isStrongSignal = false;

    if (isBuy) {
      const supports = [
        { label: 'S1', val: gannS1 },
        { label: 'S2', val: gannS2 },
        { label: 'S3', val: gannS3 },
        { label: 'S4', val: gannS4 },
      ];
      const closest = supports.find(s => s.val >= gannCheckMin && s.val <= gannCheckMax);
      if (closest) {
        gannConfluence = `Gann ${closest.label} (${closest.val.toFixed(2)}) bilan mos keldi!`;
        isStrongSignal = true;
      } else {
        gannConfluence = "Gann bilan sinergiya yo'q";
      }
    } else {
      const resistances = [
        { label: 'R1', val: gannR1 },
        { label: 'R2', val: gannR2 },
        { label: 'R3', val: gannR3 },
        { label: 'R4', val: gannR4 },
      ];
      const closest = resistances.find(r => r.val >= gannCheckMin && r.val <= gannCheckMax);
      if (closest) {
        gannConfluence = `Gann ${closest.label} (${closest.val.toFixed(2)}) bilan mos keldi!`;
        isStrongSignal = true;
      } else {
        gannConfluence = "Gann bilan sinergiya yo'q";
      }
    }

    let liquidityInfo = '';
    if (preset === '2.6 STRATEGY') {
      const hh = parseFloat(hhPrice);
      const ll = parseFloat(llPrice);
      if (!isNaN(hh) && !isNaN(ll)) {
        const offset = rangeVal / 2.6;
        if (isBuy) {
          liquidityInfo = `LL: ${ll.toFixed(2)} | Offset (div2.6): ${offset.toFixed(3)} | Maqsad: ${(ll + offset).toFixed(2)}`;
        } else {
          liquidityInfo = `HH: ${hh.toFixed(2)} | Offset (div2.6): ${offset.toFixed(3)} | Maqsad: ${(hh - offset).toFixed(2)}`;
        }
      }
    }

    return {
      isBuy,
      reversal: reversal.toFixed(2),
      reversalPercent,
      correction: correction.toFixed(2),
      correctionPercent,
      consolidation: consolidation.toFixed(2),
      consolidationPercent,
      rangeVal: rangeVal.toFixed(2),
      tp1: tp1.toFixed(2), tp1Percent,
      tp2: tp2.toFixed(2), tp2Percent,
      tp3: tp3.toFixed(2), tp3Percent,
      stopLoss: stopLoss.toFixed(2),
      stopLossPercent,
      gann: {
        S1: gannS1.toFixed(2), S2: gannS2.toFixed(2),
        S3: gannS3.toFixed(2), S4: gannS4.toFixed(2),
        R1: gannR1.toFixed(2), R2: gannR2.toFixed(2),
        R3: gannR3.toFixed(2), R4: gannR4.toFixed(2),
      },
      gannConfluence,
      isStrongSignal,
      liquidityInfo,
    };
  }, [dailyHigh, dailyLow, currentPrice, preset, hhPrice, llPrice]);

  return (
    <div className="min-h-screen p-4 md:p-8" style={{backgroundImage: "url('/image.png')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed'}}>
      <div className="max-w-2xl mx-auto">
        {calculations && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className={`p-4 rounded-2xl border-2 text-center font-bold text-2xl flex items-center justify-center ${
              calculations.isBuy
                ? 'bg-green-900/20 border-green-500 text-green-400'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}>
              <span className="text-3xl mr-2">&#9650;</span>BUY
            </div>
            <div className={`p-4 rounded-2xl border-2 text-center font-bold text-2xl flex items-center justify-center ${
              !calculations.isBuy
                ? 'bg-red-900/20 border-red-600 text-red-400'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}>
              <span className="text-3xl mr-2">&#9660;</span>SELL
            </div>
          </div>
        )}

        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-6 backdrop-blur">
          <h3 className="text-slate-400 text-xs font-bold tracking-widest mb-4">KUNLIK DIAPAZONI</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-slate-400 text-xs font-bold tracking-widest mb-2 block">HIGH (Liquidity)</label>
              <input
                type="number"
                value={dailyHigh}
                onChange={(e) => setDailyHigh(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white text-2xl font-bold focus:border-orange-500 focus:outline-none"
                step="0.01"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold tracking-widest mb-2 block">LOW (Liquidity)</label>
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
            <div className="bg-slate-700 rounded-xl px-4 py-3 flex justify-between items-center text-sm mb-4">
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
              <option value="2.6 STRATEGY">2.6 STRATEGY</option>
            </select>
          </div>

          {preset === '2.6 STRATEGY' && (
            <div className="mt-4 p-4 bg-amber-900/20 border border-amber-600/40 rounded-xl">
              <p className="text-amber-400 text-xs font-bold tracking-widest mb-3">2.6 STRATEGY — HH / LL</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs font-bold mb-1 block">HH (Higher High)</label>
                  <input
                    type="number"
                    value={hhPrice}
                    onChange={(e) => setHhPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-amber-600/50 rounded-lg text-white text-lg font-bold focus:border-amber-400 focus:outline-none"
                    step="0.01"
                    placeholder="HH narxi"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-bold mb-1 block">LL (Lower Low)</label>
                  <input
                    type="number"
                    value={llPrice}
                    onChange={(e) => setLlPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-amber-600/50 rounded-lg text-white text-lg font-bold focus:border-amber-400 focus:outline-none"
                    step="0.01"
                    placeholder="LL narxi"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {calculations && (
          <div className="space-y-4">
            <h3 className="text-slate-400 text-xs font-bold tracking-widest mt-8 mb-4">KIRISH NUQTALARI</h3>

            <div className="bg-slate-800/50 border border-red-600/30 rounded-2xl p-5 backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="px-4 py-2 rounded-lg text-sm font-bold text-center min-w-24 bg-red-900/30 text-red-400">
                    {preset === '2.6 STRATEGY' ? 'Liquidity' : 'Qaytish'}
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

            {preset !== '2.6 STRATEGY' && (
              <>
                <div className="bg-slate-800/50 border border-blue-600/30 rounded-2xl p-5 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="px-4 py-2 rounded-lg text-sm font-bold text-center min-w-24 text-blue-400 border border-blue-600">
                        Korreksiya
                      </div>
                      <div className="text-3xl font-bold text-cyan-400">{calculations.correction}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-400">{calculations.correctionPercent}%</div>
                      <div className="text-xs font-bold px-2 py-1 rounded bg-red-900/30 text-red-400">SELL</div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-purple-600/30 rounded-2xl p-5 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="px-4 py-2 rounded-lg text-sm font-bold text-center min-w-24 text-purple-400 border border-purple-600">
                        Konsolidatsiya
                      </div>
                      <div className="text-3xl font-bold text-purple-300">{calculations.consolidation}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-400">{calculations.consolidationPercent}%</div>
                      <div className="text-xs font-bold px-2 py-1 rounded bg-red-900/30 text-red-400">SELL</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <h3 className="text-slate-400 text-xs font-bold tracking-widest mt-8 mb-4">SAVDO REJASI</h3>

            {preset === '2.6 STRATEGY' && calculations.liquidityInfo && (
              <div className="bg-amber-900/10 border border-amber-600/30 rounded-2xl p-4 backdrop-blur mb-3">
                <div className="text-amber-400 text-xs font-bold tracking-widest mb-1">LIQUIDITY ANALIZI</div>
                <div className="text-sm text-amber-200 font-mono">{calculations.liquidityInfo}</div>
              </div>
            )}

            <div className="bg-slate-800/50 border-2 border-cyan-600/50 rounded-2xl p-5 backdrop-blur mb-3">
              <div className="text-slate-400 text-xs font-bold tracking-widest mb-2">ENTRY PRICE</div>
              <div className="text-3xl font-bold text-cyan-400">
                {preset === '2.6 STRATEGY'
                  ? calculations.reversal
                  : `${calculations.correction} - ${calculations.consolidation}`}
              </div>
            </div>

            <div className="bg-slate-800/50 border-2 border-red-600/50 rounded-2xl p-5 backdrop-blur mb-4">
              <div className="text-red-400 text-xs font-bold tracking-widest mb-2">STOP LOSS</div>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold text-red-500">{calculations.stopLoss}</div>
                <div className="text-sm font-bold text-slate-400">({calculations.stopLossPercent}%)</div>
              </div>
            </div>

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

            <h3 className="text-slate-400 text-xs font-bold tracking-widest mt-8 mb-4">UMUMIY ANALIZ</h3>

            <div className={`border-2 rounded-2xl p-5 backdrop-blur ${
              calculations.isStrongSignal
                ? 'bg-green-900/20 border-green-500/50'
                : 'bg-slate-800/50 border-slate-700/50'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`px-3 py-1 rounded text-xs font-bold ${
                  calculations.isStrongSignal ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
                }`}>
                  {calculations.isStrongSignal ? 'KUCHLI SIGNAL' : 'ODDIY SIGNAL'}
                </div>
              </div>
              <p className="text-lg font-bold text-white mb-1">
                Yo&apos;nalish: <span className={calculations.isBuy ? 'text-green-400' : 'text-red-400'}>
                  {calculations.isBuy ? 'BUY' : 'SELL'}
                </span>
              </p>
              <p className="text-sm text-slate-400">{calculations.gannConfluence}</p>
            </div>

            <h3 className="text-slate-400 text-xs font-bold tracking-widest mt-8 mb-4">GANN DARAJALARI</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 border border-red-900/30 rounded-2xl p-4 backdrop-blur">
                <div className="text-red-400 text-xs font-bold tracking-widest mb-3 text-center">RESISTANCE</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-slate-400">R4:</span><span className="text-red-300 font-bold">{calculations.gann.R4}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">R3:</span><span className="text-red-300 font-bold">{calculations.gann.R3}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">R2:</span><span className="text-red-300 font-bold">{calculations.gann.R2}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">R1:</span><span className="text-red-300 font-bold">{calculations.gann.R1}</span></div>
                </div>
              </div>
              <div className="bg-slate-800/50 border border-green-900/30 rounded-2xl p-4 backdrop-blur">
                <div className="text-green-400 text-xs font-bold tracking-widest mb-3 text-center">SUPPORT</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-slate-400">S1:</span><span className="text-green-300 font-bold">{calculations.gann.S1}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">S2:</span><span className="text-green-300 font-bold">{calculations.gann.S2}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">S3:</span><span className="text-green-300 font-bold">{calculations.gann.S3}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">S4:</span><span className="text-green-300 font-bold">{calculations.gann.S4}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function XAUCalculator() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  if (!isAuthenticated) {
    return <PasswordScreen onAuthenticate={() => setIsAuthenticated(true)} />;
  }

  return <CalculatorContent />;
}
