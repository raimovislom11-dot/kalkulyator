'use client';

import { useState, useMemo, useEffect } from 'react';

type Preset = '778 TRD' | 'AB TRADE' | '2.6 STRATEGY' | 'ORDER BLOCK' | 'IFVG';

interface RatioConfig {
  rRev: number;
  rCor: number;
  rCons: number;
}

const presetConfigs: Record<string, RatioConfig> = {
  '778 TRD': { rRev: 1.0, rCor: 0.166, rCons: 0.5 },
  'AB TRADE': { rRev: 0.3846, rCor: 0.0, rCons: 0.225 },
  '2.6 STRATEGY': { rRev: 1 / 2.6, rCor: 0.0, rCons: 0.0 },
  'ORDER BLOCK': { rRev: 0, rCor: 0, rCons: 0 },
  'IFVG': { rRev: 0, rCor: 0, rCons: 0 },
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
        <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-8 backdrop-blur">
          <h1 className="text-3xl font-bold text-white text-center mb-2">XAU Calculator</h1>
          <p className="text-slate-400 text-center mb-8">Kirish uchun parol kiriting</p>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="text-slate-400 text-sm font-bold tracking-widest mb-2 block">PAROL</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-4 bg-slate-700/80 border border-slate-600 rounded-xl text-white text-2xl font-bold text-center focus:border-orange-500 focus:outline-none tracking-widest"
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

  // 2.6 STRATEGY uchun
  const [hhPrice, setHhPrice] = useState<string>('');
  const [llPrice, setLlPrice] = useState<string>('');

  // ORDER BLOCK uchun
  const [obHigh, setObHigh] = useState<string>('');
  const [obLow, setObLow] = useState<string>('');

  // IFVG uchun
  const [fvgHigh, setFvgHigh] = useState<string>('');
  const [fvgLow, setFvgLow] = useState<string>('');

  const calculations = useMemo(() => {
    const high = parseFloat(dailyHigh) || 0;
    const low = parseFloat(dailyLow) || 0;
    const current = parseFloat(currentPrice) || 0;
    const rangeVal = high - low;

    if (current === 0) return null;

    // ─── ORDER BLOCK ───────────────────────────────────────────
    if (preset === 'ORDER BLOCK') {
      const obH = parseFloat(obHigh);
      const obL = parseFloat(obLow);
      if (isNaN(obH) || isNaN(obL) || obH <= obL) return null;

      const obMid = (obH + obL) / 2;
      const obSize = obH - obL;

      // Narx OB dan pastda → BUY (bullish OB), tepada → SELL (bearish OB)
      const isBuy = current <= obH;

      const entryLow = obL;
      const entryHigh = obH;
      const stopLoss = isBuy ? obL - 3.0 : obH + 3.0;

      // TP: OB kattaligiga qarab
      const tp1 = isBuy ? obH + obSize * 1.0 : obL - obSize * 1.0;
      const tp2 = isBuy ? obH + obSize * 2.0 : obL - obSize * 2.0;
      const tp3 = isBuy ? obH + (rangeVal > 0 ? rangeVal : obSize * 3) : obL - (rangeVal > 0 ? rangeVal : obSize * 3);

      const stopLossPercent = ((Math.abs(current - stopLoss) / current) * 100).toFixed(2);
      const tp1Percent = ((Math.abs(tp1 - current) / current) * 100).toFixed(2);
      const tp2Percent = ((Math.abs(tp2 - current) / current) * 100).toFixed(2);
      const tp3Percent = ((Math.abs(tp3 - current) / current) * 100).toFixed(2);
      const obMidPercent = ((Math.abs(obMid - current) / current) * 100).toFixed(2);

      // Gann
      const gannSqrt = Math.sqrt(current);
      const gannS1 = Math.pow(gannSqrt - 0.25, 2);
      const gannS2 = Math.pow(gannSqrt - 0.50, 2);
      const gannS3 = Math.pow(gannSqrt - 0.75, 2);
      const gannS4 = Math.pow(gannSqrt - 1.00, 2);
      const gannR1 = Math.pow(gannSqrt + 0.25, 2);
      const gannR2 = Math.pow(gannSqrt + 0.50, 2);
      const gannR3 = Math.pow(gannSqrt + 0.75, 2);
      const gannR4 = Math.pow(gannSqrt + 1.00, 2);

      const gMin = obL - 3.0;
      const gMax = obH + 3.0;
      let gannConfluence = '';
      let isStrongSignal = false;

      if (isBuy) {
        const supports = [{ label: 'S1', val: gannS1 }, { label: 'S2', val: gannS2 }, { label: 'S3', val: gannS3 }, { label: 'S4', val: gannS4 }];
        const c = supports.find(s => s.val >= gMin && s.val <= gMax);
        if (c) { gannConfluence = `Gann ${c.label} (${c.val.toFixed(2)}) OB bilan mos keldi!`; isStrongSignal = true; }
        else gannConfluence = "Gann bilan sinergiya yo'q";
      } else {
        const resistances = [{ label: 'R1', val: gannR1 }, { label: 'R2', val: gannR2 }, { label: 'R3', val: gannR3 }, { label: 'R4', val: gannR4 }];
        const c = resistances.find(r => r.val >= gMin && r.val <= gMax);
        if (c) { gannConfluence = `Gann ${c.label} (${c.val.toFixed(2)}) OB bilan mos keldi!`; isStrongSignal = true; }
        else gannConfluence = "Gann bilan sinergiya yo'q";
      }

      return {
        preset: 'ORDER BLOCK' as const,
        isBuy,
        obHigh: obH.toFixed(2),
        obLow: obL.toFixed(2),
        obMid: obMid.toFixed(2),
        obMidPercent,
        obSize: obSize.toFixed(2),
        entryLow: entryLow.toFixed(2),
        entryHigh: entryHigh.toFixed(2),
        stopLoss: stopLoss.toFixed(2),
        stopLossPercent,
        tp1: tp1.toFixed(2), tp1Percent,
        tp2: tp2.toFixed(2), tp2Percent,
        tp3: tp3.toFixed(2), tp3Percent,
        rangeVal: rangeVal.toFixed(2),
        gann: {
          S1: gannS1.toFixed(2), S2: gannS2.toFixed(2), S3: gannS3.toFixed(2), S4: gannS4.toFixed(2),
          R1: gannR1.toFixed(2), R2: gannR2.toFixed(2), R3: gannR3.toFixed(2), R4: gannR4.toFixed(2),
        },
        gannConfluence,
        isStrongSignal,
      };
    }

    // ─── IFVG ──────────────────────────────────────────────────
    if (preset === 'IFVG') {
      const fvgH = parseFloat(fvgHigh);
      const fvgL = parseFloat(fvgLow);
      if (isNaN(fvgH) || isNaN(fvgL) || fvgH <= fvgL) return null;

      const fvgMid = (fvgH + fvgL) / 2;
      const fvgSize = fvgH - fvgL;

      // Narx FVG tepasidan pastga (SELL IFVG) yoki pastdan tepaga (BUY IFVG)
      // BUY IFVG: narx FVG ga tushib qaytadi (FVG support bo'ladi)
      const isBuy = current <= fvgMid;

      const entry = isBuy ? fvgL : fvgH;
      const stopLoss = isBuy ? fvgL - 3.0 : fvgH + 3.0;

      // TP: FVG kengligi asosida
      const tp1 = isBuy ? fvgH + fvgSize * 0.618 : fvgL - fvgSize * 0.618;
      const tp2 = isBuy ? fvgH + fvgSize * 1.0   : fvgL - fvgSize * 1.0;
      const tp3 = isBuy ? fvgH + fvgSize * 1.618  : fvgL - fvgSize * 1.618;

      const stopLossPercent = ((Math.abs(current - stopLoss) / current) * 100).toFixed(2);
      const tp1Percent = ((Math.abs(tp1 - current) / current) * 100).toFixed(2);
      const tp2Percent = ((Math.abs(tp2 - current) / current) * 100).toFixed(2);
      const tp3Percent = ((Math.abs(tp3 - current) / current) * 100).toFixed(2);
      const entryPercent = ((Math.abs(entry - current) / current) * 100).toFixed(2);
      const fvgMidPercent = ((Math.abs(fvgMid - current) / current) * 100).toFixed(2);

      // Gann
      const gannSqrt = Math.sqrt(current);
      const gannS1 = Math.pow(gannSqrt - 0.25, 2);
      const gannS2 = Math.pow(gannSqrt - 0.50, 2);
      const gannS3 = Math.pow(gannSqrt - 0.75, 2);
      const gannS4 = Math.pow(gannSqrt - 1.00, 2);
      const gannR1 = Math.pow(gannSqrt + 0.25, 2);
      const gannR2 = Math.pow(gannSqrt + 0.50, 2);
      const gannR3 = Math.pow(gannSqrt + 0.75, 2);
      const gannR4 = Math.pow(gannSqrt + 1.00, 2);

      const gMin = fvgL - 3.0;
      const gMax = fvgH + 3.0;
      let gannConfluence = '';
      let isStrongSignal = false;

      if (isBuy) {
        const supports = [{ label: 'S1', val: gannS1 }, { label: 'S2', val: gannS2 }, { label: 'S3', val: gannS3 }, { label: 'S4', val: gannS4 }];
        const c = supports.find(s => s.val >= gMin && s.val <= gMax);
        if (c) { gannConfluence = `Gann ${c.label} (${c.val.toFixed(2)}) IFVG bilan mos keldi!`; isStrongSignal = true; }
        else gannConfluence = "Gann bilan sinergiya yo'q";
      } else {
        const resistances = [{ label: 'R1', val: gannR1 }, { label: 'R2', val: gannR2 }, { label: 'R3', val: gannR3 }, { label: 'R4', val: gannR4 }];
        const c = resistances.find(r => r.val >= gMin && r.val <= gMax);
        if (c) { gannConfluence = `Gann ${c.label} (${c.val.toFixed(2)}) IFVG bilan mos keldi!`; isStrongSignal = true; }
        else gannConfluence = "Gann bilan sinergiya yo'q";
      }

      return {
        preset: 'IFVG' as const,
        isBuy,
        fvgHigh: fvgH.toFixed(2),
        fvgLow: fvgL.toFixed(2),
        fvgMid: fvgMid.toFixed(2),
        fvgMidPercent,
        fvgSize: fvgSize.toFixed(2),
        entry: entry.toFixed(2),
        entryPercent,
        stopLoss: stopLoss.toFixed(2),
        stopLossPercent,
        tp1: tp1.toFixed(2), tp1Percent,
        tp2: tp2.toFixed(2), tp2Percent,
        tp3: tp3.toFixed(2), tp3Percent,
        rangeVal: rangeVal.toFixed(2),
        gann: {
          S1: gannS1.toFixed(2), S2: gannS2.toFixed(2), S3: gannS3.toFixed(2), S4: gannS4.toFixed(2),
          R1: gannR1.toFixed(2), R2: gannR2.toFixed(2), R3: gannR3.toFixed(2), R4: gannR4.toFixed(2),
        },
        gannConfluence,
        isStrongSignal,
      };
    }

    // ─── STANDART STRATEGIYALAR (778 TRD, AB TRADE, 2.6) ──────
    if (rangeVal <= 0) return null;

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

    const reversal = isBuy ? low - rangeVal * config.rRev : high + rangeVal * config.rRev;
    const correction = isBuy ? low + rangeVal * config.rCor : high - rangeVal * config.rCor;
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

    const gannSqrt = Math.sqrt(current);
    const gannS1 = Math.pow(gannSqrt - 0.25, 2);
    const gannS2 = Math.pow(gannSqrt - 0.50, 2);
    const gannS3 = Math.pow(gannSqrt - 0.75, 2);
    const gannS4 = Math.pow(gannSqrt - 1.00, 2);
    const gannR1 = Math.pow(gannSqrt + 0.25, 2);
    const gannR2 = Math.pow(gannSqrt + 0.50, 2);
    const gannR3 = Math.pow(gannSqrt + 0.75, 2);
    const gannR4 = Math.pow(gannSqrt + 1.00, 2);

    let gannCheckCenter: number;
    let gannTolerance: number;
    if (preset === '2.6 STRATEGY') {
      gannCheckCenter = reversal; gannTolerance = 5.0;
    } else {
      gannCheckCenter = (Math.min(correction, consolidation) + Math.max(correction, consolidation)) / 2;
      gannTolerance = 3.0;
    }

    const gannCheckMin = gannCheckCenter - gannTolerance;
    const gannCheckMax = gannCheckCenter + gannTolerance;
    let gannConfluence = '';
    let isStrongSignal = false;

    if (isBuy) {
      const supports = [{ label: 'S1', val: gannS1 }, { label: 'S2', val: gannS2 }, { label: 'S3', val: gannS3 }, { label: 'S4', val: gannS4 }];
      const c = supports.find(s => s.val >= gannCheckMin && s.val <= gannCheckMax);
      if (c) { gannConfluence = `Gann ${c.label} (${c.val.toFixed(2)}) bilan mos keldi!`; isStrongSignal = true; }
      else gannConfluence = "Gann bilan sinergiya yo'q";
    } else {
      const resistances = [{ label: 'R1', val: gannR1 }, { label: 'R2', val: gannR2 }, { label: 'R3', val: gannR3 }, { label: 'R4', val: gannR4 }];
      const c = resistances.find(r => r.val >= gannCheckMin && r.val <= gannCheckMax);
      if (c) { gannConfluence = `Gann ${c.label} (${c.val.toFixed(2)}) bilan mos keldi!`; isStrongSignal = true; }
      else gannConfluence = "Gann bilan sinergiya yo'q";
    }

    let liquidityInfo = '';
    if (preset === '2.6 STRATEGY') {
      const hh = parseFloat(hhPrice);
      const ll = parseFloat(llPrice);
      if (!isNaN(hh) && !isNaN(ll)) {
        const offset = rangeVal / 2.6;
        if (isBuy) liquidityInfo = `LL: ${ll.toFixed(2)} | Offset (div2.6): ${offset.toFixed(3)} | Maqsad: ${(ll + offset).toFixed(2)}`;
        else liquidityInfo = `HH: ${hh.toFixed(2)} | Offset (div2.6): ${offset.toFixed(3)} | Maqsad: ${(hh - offset).toFixed(2)}`;
      }
    }

    return {
      preset: preset as '778 TRD' | 'AB TRADE' | '2.6 STRATEGY',
      isBuy,
      reversal: reversal.toFixed(2), reversalPercent,
      correction: correction.toFixed(2), correctionPercent,
      consolidation: consolidation.toFixed(2), consolidationPercent,
      rangeVal: rangeVal.toFixed(2),
      tp1: tp1.toFixed(2), tp1Percent,
      tp2: tp2.toFixed(2), tp2Percent,
      tp3: tp3.toFixed(2), tp3Percent,
      stopLoss: stopLoss.toFixed(2), stopLossPercent,
      gann: {
        S1: gannS1.toFixed(2), S2: gannS2.toFixed(2), S3: gannS3.toFixed(2), S4: gannS4.toFixed(2),
        R1: gannR1.toFixed(2), R2: gannR2.toFixed(2), R3: gannR3.toFixed(2), R4: gannR4.toFixed(2),
      },
      gannConfluence, isStrongSignal, liquidityInfo,
    };
  }, [dailyHigh, dailyLow, currentPrice, preset, hhPrice, llPrice, obHigh, obLow, fvgHigh, fvgLow]);

  const isBuy = calculations?.isBuy ?? false;

  return (
    <div className="min-h-screen p-4 md:p-8" style={{backgroundImage: "url('/image.png')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundAttachment: 'fixed'}}>
      <div className="max-w-2xl mx-auto">

        {/* BUY / SELL */}
        {calculations && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className={`p-4 rounded-2xl border-2 text-center font-bold text-2xl flex items-center justify-center ${isBuy ? 'bg-green-900/40 border-green-500 text-green-400' : 'bg-slate-900/60 border-slate-700 text-slate-500'}`}>
              <span className="text-3xl mr-2">&#9650;</span>BUY
            </div>
            <div className={`p-4 rounded-2xl border-2 text-center font-bold text-2xl flex items-center justify-center ${!isBuy ? 'bg-red-900/40 border-red-600 text-red-400' : 'bg-slate-900/60 border-slate-700 text-slate-500'}`}>
              <span className="text-3xl mr-2">&#9660;</span>SELL
            </div>
          </div>
        )}

        {/* INPUT PANEL */}
        <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 mb-6 backdrop-blur">
          <h3 className="text-slate-400 text-xs font-bold tracking-widest mb-4">KUNLIK DIAPAZONI</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-slate-400 text-xs font-bold tracking-widest mb-2 block">HIGH (Liquidity)</label>
              <input type="number" value={dailyHigh} onChange={(e) => setDailyHigh(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600 rounded-xl text-white text-2xl font-bold focus:border-orange-500 focus:outline-none" step="0.01"/>
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold tracking-widest mb-2 block">LOW (Liquidity)</label>
              <input type="number" value={dailyLow} onChange={(e) => setDailyLow(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600 rounded-xl text-white text-2xl font-bold focus:border-orange-500 focus:outline-none" step="0.01"/>
            </div>
          </div>

          {calculations && 'rangeVal' in calculations && (
            <div className="bg-slate-700/80 rounded-xl px-4 py-3 flex justify-between items-center text-sm mb-4">
              <span className="text-slate-400 font-bold">Range: {calculations.rangeVal}</span>
              <span className="text-slate-400 font-bold">&lt;60</span>
            </div>
          )}

          <div className="mb-4">
            <label className="text-slate-400 text-xs font-bold tracking-widest mb-2 block">HOZIRGI TURGAN JOYI</label>
            <input type="number" value={currentPrice} onChange={(e) => setCurrentPrice(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600 rounded-xl text-white text-2xl font-bold focus:border-orange-500 focus:outline-none" step="0.01" placeholder="Current price"/>
          </div>

          <div>
            <label className="text-slate-400 text-xs font-bold tracking-widest mb-2 block">PRESET / STRATEGIYA</label>
            <select value={preset} onChange={(e) => setPreset(e.target.value as Preset)}
              className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600 rounded-xl text-white font-bold focus:border-orange-500 focus:outline-none">
              <option value="778 TRD">778 TRD</option>
              <option value="AB TRADE">AB TRADE</option>
              <option value="2.6 STRATEGY">2.6 STRATEGY</option>
              <option value="ORDER BLOCK">ORDER BLOCK</option>
              <option value="IFVG">IFVG (Inverse FVG)</option>
            </select>
          </div>

          {/* 2.6 STRATEGY HH/LL */}
          {preset === '2.6 STRATEGY' && (
            <div className="mt-4 p-4 bg-amber-900/30 border border-amber-600/40 rounded-xl">
              <p className="text-amber-400 text-xs font-bold tracking-widest mb-3">2.6 STRATEGY — HH / LL</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs font-bold mb-1 block">HH (Higher High)</label>
                  <input type="number" value={hhPrice} onChange={(e) => setHhPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/80 border border-amber-600/50 rounded-lg text-white text-lg font-bold focus:border-amber-400 focus:outline-none" step="0.01" placeholder="HH narxi"/>
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-bold mb-1 block">LL (Lower Low)</label>
                  <input type="number" value={llPrice} onChange={(e) => setLlPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/80 border border-amber-600/50 rounded-lg text-white text-lg font-bold focus:border-amber-400 focus:outline-none" step="0.01" placeholder="LL narxi"/>
                </div>
              </div>
            </div>
          )}

          {/* ORDER BLOCK inputs */}
          {preset === 'ORDER BLOCK' && (
            <div className="mt-4 p-4 bg-blue-900/30 border border-blue-600/40 rounded-xl">
              <p className="text-blue-400 text-xs font-bold tracking-widest mb-1">ORDER BLOCK ZONE</p>
              <p className="text-slate-500 text-xs mb-3">Oxirgi qarama-qarshi svechaning High va Low qiymatini kiriting</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs font-bold mb-1 block">OB HIGH</label>
                  <input type="number" value={obHigh} onChange={(e) => setObHigh(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/80 border border-blue-600/50 rounded-lg text-white text-lg font-bold focus:border-blue-400 focus:outline-none" step="0.01" placeholder="OB yuqori"/>
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-bold mb-1 block">OB LOW</label>
                  <input type="number" value={obLow} onChange={(e) => setObLow(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/80 border border-blue-600/50 rounded-lg text-white text-lg font-bold focus:border-blue-400 focus:outline-none" step="0.01" placeholder="OB pastki"/>
                </div>
              </div>
            </div>
          )}

          {/* IFVG inputs */}
          {preset === 'IFVG' && (
            <div className="mt-4 p-4 bg-purple-900/30 border border-purple-600/40 rounded-xl">
              <p className="text-purple-400 text-xs font-bold tracking-widest mb-1">IFVG ZONE (Fair Value Gap)</p>
              <p className="text-slate-500 text-xs mb-3">FVG ning tepa va pastki chegarasini kiriting</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs font-bold mb-1 block">FVG HIGH</label>
                  <input type="number" value={fvgHigh} onChange={(e) => setFvgHigh(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/80 border border-purple-600/50 rounded-lg text-white text-lg font-bold focus:border-purple-400 focus:outline-none" step="0.01" placeholder="FVG yuqori"/>
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-bold mb-1 block">FVG LOW</label>
                  <input type="number" value={fvgLow} onChange={(e) => setFvgLow(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/80 border border-purple-600/50 rounded-lg text-white text-lg font-bold focus:border-purple-400 focus:outline-none" step="0.01" placeholder="FVG pastki"/>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RESULTS */}
        {calculations && (
          <div className="space-y-4">

            {/* ─── ORDER BLOCK natijalar ─── */}
            {calculations.preset === 'ORDER BLOCK' && (
              <>
                <h3 className="text-blue-400 text-xs font-bold tracking-widest mt-2 mb-4">&#9632; ORDER BLOCK TAHLILI</h3>

                <div className="bg-blue-900/20 border border-blue-600/50 rounded-2xl p-5 backdrop-blur">
                  <div className="text-blue-400 text-xs font-bold tracking-widest mb-3">OB ZONE</div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-slate-400 text-xs mb-1">OB HIGH</div>
                      <div className="text-xl font-bold text-red-400">{calculations.obHigh}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs mb-1">OB MID</div>
                      <div className="text-xl font-bold text-blue-400">{calculations.obMid}</div>
                      <div className="text-xs text-slate-500">{calculations.obMidPercent}%</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs mb-1">OB LOW</div>
                      <div className="text-xl font-bold text-green-400">{calculations.obLow}</div>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-slate-500 text-xs">OB hajmi: </span>
                    <span className="text-blue-300 font-bold text-sm">{calculations.obSize} pip</span>
                  </div>
                </div>

                <div className="bg-slate-900/80 border-2 border-cyan-600/50 rounded-2xl p-5 backdrop-blur">
                  <div className="text-slate-400 text-xs font-bold tracking-widest mb-2">ENTRY ZONE</div>
                  <div className="text-2xl font-bold text-cyan-400">{calculations.entryLow} — {calculations.entryHigh}</div>
                  <div className="text-xs text-slate-500 mt-1">{isBuy ? 'Bullish OB — BUY zoni' : 'Bearish OB — SELL zoni'}</div>
                </div>

                <div className="bg-slate-900/80 border-2 border-red-600/50 rounded-2xl p-5 backdrop-blur">
                  <div className="text-red-400 text-xs font-bold tracking-widest mb-2">STOP LOSS</div>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-red-500">{calculations.stopLoss}</div>
                    <div className="text-sm font-bold text-slate-400">({calculations.stopLossPercent}%)</div>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">OB {isBuy ? 'pastidan' : 'tepasidan'} 3 pip narida</div>
                </div>
              </>
            )}

            {/* ─── IFVG natijalar ─── */}
            {calculations.preset === 'IFVG' && (
              <>
                <h3 className="text-purple-400 text-xs font-bold tracking-widest mt-2 mb-4">&#9670; IFVG TAHLILI</h3>

                <div className="bg-purple-900/20 border border-purple-600/50 rounded-2xl p-5 backdrop-blur">
                  <div className="text-purple-400 text-xs font-bold tracking-widest mb-3">FVG ZONE (Inverse)</div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-slate-400 text-xs mb-1">FVG HIGH</div>
                      <div className="text-xl font-bold text-red-400">{calculations.fvgHigh}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs mb-1">FVG MID</div>
                      <div className="text-xl font-bold text-purple-400">{calculations.fvgMid}</div>
                      <div className="text-xs text-slate-500">{calculations.fvgMidPercent}%</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs mb-1">FVG LOW</div>
                      <div className="text-xl font-bold text-green-400">{calculations.fvgLow}</div>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-slate-500 text-xs">Gap kengligi: </span>
                    <span className="text-purple-300 font-bold text-sm">{calculations.fvgSize} pip</span>
                  </div>
                </div>

                <div className="bg-slate-900/80 border-2 border-cyan-600/50 rounded-2xl p-5 backdrop-blur">
                  <div className="text-slate-400 text-xs font-bold tracking-widest mb-2">ENTRY PRICE</div>
                  <div className="text-3xl font-bold text-cyan-400">{calculations.entry}</div>
                  <div className="text-xs text-slate-500 mt-1">{isBuy ? 'FVG LOW — narx gap ga tushib qaytadi (BUY)' : 'FVG HIGH — narx gap ga chiqib tushadi (SELL)'}</div>
                  <div className="text-sm text-slate-400 mt-1">{calculations.entryPercent}% uzoqlikda</div>
                </div>

                <div className="bg-slate-900/80 border-2 border-red-600/50 rounded-2xl p-5 backdrop-blur">
                  <div className="text-red-400 text-xs font-bold tracking-widest mb-2">STOP LOSS</div>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-red-500">{calculations.stopLoss}</div>
                    <div className="text-sm font-bold text-slate-400">({calculations.stopLossPercent}%)</div>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">FVG {isBuy ? 'LOW dan' : 'HIGH dan'} 3 pip narida</div>
                </div>
              </>
            )}

            {/* ─── 778 TRD / AB TRADE / 2.6 natijalar ─── */}
            {(calculations.preset === '778 TRD' || calculations.preset === 'AB TRADE' || calculations.preset === '2.6 STRATEGY') && (
              <>
                <h3 className="text-slate-400 text-xs font-bold tracking-widest mt-2 mb-4">KIRISH NUQTALARI</h3>

                <div className="bg-slate-900/80 border border-red-600/30 rounded-2xl p-5 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="px-4 py-2 rounded-lg text-sm font-bold text-center min-w-24 bg-red-900/30 text-red-400">
                        {calculations.preset === '2.6 STRATEGY' ? 'Liquidity' : 'Qaytish'}
                      </div>
                      <div className="text-3xl font-bold text-red-400">{calculations.reversal}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-400">{calculations.reversalPercent}%</div>
                      <div className={`text-xs font-bold px-2 py-1 rounded ${isBuy ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                        {isBuy ? 'BUY' : 'SELL'}
                      </div>
                    </div>
                  </div>
                </div>

                {calculations.preset !== '2.6 STRATEGY' && (
                  <>
                    <div className="bg-slate-900/80 border border-blue-600/30 rounded-2xl p-5 backdrop-blur">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="px-4 py-2 rounded-lg text-sm font-bold text-center min-w-24 text-blue-400 border border-blue-600">Korreksiya</div>
                          <div className="text-3xl font-bold text-cyan-400">{calculations.correction}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-400">{calculations.correctionPercent}%</div>
                          <div className="text-xs font-bold px-2 py-1 rounded bg-red-900/30 text-red-400">SELL</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-900/80 border border-purple-600/30 rounded-2xl p-5 backdrop-blur">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="px-4 py-2 rounded-lg text-sm font-bold text-center min-w-24 text-purple-400 border border-purple-600">Konsolidatsiya</div>
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

                <h3 className="text-slate-400 text-xs font-bold tracking-widest mt-6 mb-4">SAVDO REJASI</h3>

                {calculations.preset === '2.6 STRATEGY' && calculations.liquidityInfo && (
                  <div className="bg-amber-900/20 border border-amber-600/30 rounded-2xl p-4 backdrop-blur mb-3">
                    <div className="text-amber-400 text-xs font-bold tracking-widest mb-1">LIQUIDITY ANALIZI</div>
                    <div className="text-sm text-amber-200 font-mono">{calculations.liquidityInfo}</div>
                  </div>
                )}

                <div className="bg-slate-900/80 border-2 border-cyan-600/50 rounded-2xl p-5 backdrop-blur mb-3">
                  <div className="text-slate-400 text-xs font-bold tracking-widest mb-2">ENTRY PRICE</div>
                  <div className="text-3xl font-bold text-cyan-400">
                    {calculations.preset === '2.6 STRATEGY' ? calculations.reversal : `${calculations.correction} - ${calculations.consolidation}`}
                  </div>
                </div>

                <div className="bg-slate-900/80 border-2 border-red-600/50 rounded-2xl p-5 backdrop-blur">
                  <div className="text-red-400 text-xs font-bold tracking-widest mb-2">STOP LOSS</div>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-red-500">{calculations.stopLoss}</div>
                    <div className="text-sm font-bold text-slate-400">({calculations.stopLossPercent}%)</div>
                  </div>
                </div>
              </>
            )}

            {/* ─── TP1 / TP2 / TP3 (hammasi uchun) ─── */}
            <h3 className="text-slate-400 text-xs font-bold tracking-widest mt-6 mb-4">
              MAQSAD NARXLAR (TP)
              {(calculations.preset === 'IFVG') && <span className="text-purple-400 ml-2">Fibonacci asosida</span>}
              {(calculations.preset === 'ORDER BLOCK') && <span className="text-blue-400 ml-2">OB hajmi asosida</span>}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900/80 border border-green-600/50 rounded-2xl p-4 backdrop-blur">
                <div className="text-green-400 font-bold text-sm mb-2">
                  TP1 {calculations.preset === 'IFVG' ? '(0.618)' : ''}
                </div>
                <div className="text-2xl font-bold text-green-400">{calculations.tp1}</div>
                <div className="text-xs text-slate-400 mt-1">{calculations.tp1Percent}%</div>
              </div>
              <div className="bg-slate-900/80 border border-green-600/50 rounded-2xl p-4 backdrop-blur">
                <div className="text-green-400 font-bold text-sm mb-2">
                  TP2 {calculations.preset === 'IFVG' ? '(1.0)' : ''}
                </div>
                <div className="text-2xl font-bold text-green-400">{calculations.tp2}</div>
                <div className="text-xs text-slate-400 mt-1">{calculations.tp2Percent}%</div>
              </div>
              <div className="bg-slate-900/80 border border-green-600/50 rounded-2xl p-4 backdrop-blur">
                <div className="text-green-400 font-bold text-sm mb-2">
                  TP3 {calculations.preset === 'IFVG' ? '(1.618)' : ''}
                </div>
                <div className="text-2xl font-bold text-green-400">{calculations.tp3}</div>
                <div className="text-xs text-slate-400 mt-1">{calculations.tp3Percent}%</div>
              </div>
            </div>

            {/* ─── UMUMIY ANALIZ ─── */}
            <h3 className="text-slate-400 text-xs font-bold tracking-widest mt-8 mb-4">UMUMIY ANALIZ</h3>
            <div className={`border-2 rounded-2xl p-5 backdrop-blur ${calculations.isStrongSignal ? 'bg-green-900/30 border-green-500/50' : 'bg-slate-900/80 border-slate-700/50'}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`px-3 py-1 rounded text-xs font-bold ${calculations.isStrongSignal ? 'bg-green-500/20 text-green-400' : 'bg-slate-700/80 text-slate-400'}`}>
                  {calculations.isStrongSignal ? 'KUCHLI SIGNAL' : 'ODDIY SIGNAL'}
                </div>
                <div className="px-3 py-1 rounded text-xs font-bold bg-slate-700/80 text-slate-400">
                  {calculations.preset}
                </div>
              </div>
              <p className="text-lg font-bold text-white mb-1">
                Yo&apos;nalish: <span className={isBuy ? 'text-green-400' : 'text-red-400'}>{isBuy ? 'BUY' : 'SELL'}</span>
              </p>
              <p className="text-sm text-slate-400">{calculations.gannConfluence}</p>
            </div>

            {/* ─── GANN DARAJALARI ─── */}
            <h3 className="text-slate-400 text-xs font-bold tracking-widest mt-8 mb-4">GANN DARAJALARI</h3>
            <div className="grid grid-cols-2 gap-4 pb-8">
              <div className="bg-slate-900/80 border border-red-900/30 rounded-2xl p-4 backdrop-blur">
                <div className="text-red-400 text-xs font-bold tracking-widest mb-3 text-center">RESISTANCE</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-slate-400">R4:</span><span className="text-red-300 font-bold">{calculations.gann.R4}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">R3:</span><span className="text-red-300 font-bold">{calculations.gann.R3}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">R2:</span><span className="text-red-300 font-bold">{calculations.gann.R2}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-400">R1:</span><span className="text-red-300 font-bold">{calculations.gann.R1}</span></div>
                </div>
              </div>
              <div className="bg-slate-900/80 border border-green-900/30 rounded-2xl p-4 backdrop-blur">
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
