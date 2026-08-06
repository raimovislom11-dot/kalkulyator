'use client';

import { useState, useMemo, useEffect } from 'react';

type Preset = '778 TRD' | 'AB TRADE' | '2.6 STRATEGY' | 'ORDER BLOCK' | 'IFVG';
type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
type OBType = 'bullish' | 'bearish';

interface RatioConfig { rRev: number; rCor: number; rCons: number; }

const timeframeConfig: Record<Timeframe, { label: string; maxRange: number; pipBuffer: number; consolOffset: number; color: string; }> = {
  '1m':  { label: '1 Daqiqa',  maxRange: 10,  pipBuffer: 1.0,  consolOffset: 0.5,  color: 'text-sky-400'    },
  '5m':  { label: '5 Daqiqa',  maxRange: 25,  pipBuffer: 1.5,  consolOffset: 1.0,  color: 'text-blue-400'   },
  '15m': { label: '15 Daqiqa', maxRange: 50,  pipBuffer: 2.0,  consolOffset: 2.0,  color: 'text-indigo-400' },
  '1h':  { label: '1 Soat',    maxRange: 100, pipBuffer: 3.0,  consolOffset: 3.0,  color: 'text-violet-400' },
  '4h':  { label: '4 Soat',    maxRange: 250, pipBuffer: 5.0,  consolOffset: 5.0,  color: 'text-purple-400' },
  '1d':  { label: '1 Kun',     maxRange: 600, pipBuffer: 10.0, consolOffset: 10.0, color: 'text-orange-400' },
};

const presetConfigs: Record<string, RatioConfig> = {
  '778 TRD':      { rRev: 1.0,      rCor: 0.166, rCons: 0.5   },
  'AB TRADE':     { rRev: 0.3846,   rCor: 0.0,   rCons: 0.225 },
  '2.6 STRATEGY': { rRev: 1 / 2.6,  rCor: 0.0,   rCons: 0.0   },
};

const getTimeBasedPassword = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
};

// RR hisobi
const calcRR = (entry: number, sl: number, tp: number): string => {
  const risk   = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  if (risk === 0) return '—';
  return `1 : ${(reward / risk).toFixed(2)}`;
};

// ─────────────────────────────────────────────
function PasswordScreen({ onAuthenticate }: { onAuthenticate: () => void }) {
  const [passwordInput, setPasswordInput] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  // FIX #5 — real-time soat yangilanadi
  useEffect(() => {
    setCurrentTime(getTimeBasedPassword());
    const id = setInterval(() => setCurrentTime(getTimeBasedPassword()), 10000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === getTimeBasedPassword()) { onAuthenticate(); }
    else { setPasswordInput(''); alert("Parol noto'g'ri!"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{backgroundImage:"url('/image.png')",backgroundSize:'cover',backgroundPosition:'center'}}>
      <div className="w-full max-w-md">
        <div className="bg-slate-900/85 border border-slate-700 rounded-2xl p-8 backdrop-blur">
          <h1 className="text-3xl font-bold text-white text-center mb-2">XAU Calculator</h1>
          <p className="text-slate-400 text-center mb-8">Kirish uchun parol kiriting</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-slate-400 text-sm font-bold tracking-widest mb-2 block">PAROL</label>
              <input type="password" value={passwordInput} onChange={e=>setPasswordInput(e.target.value)}
                className="w-full px-4 py-4 bg-slate-700/80 border border-slate-600 rounded-xl text-white text-2xl font-bold text-center focus:border-orange-500 focus:outline-none tracking-widest"
                placeholder="0000" maxLength={4} autoFocus/>
              <p className="text-slate-500 text-xs mt-2 text-center">Hozirgi soat: {currentTime}</p>
            </div>
            <button type="submit"
              className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold rounded-xl transition-all active:scale-95">
              KIRISH
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
function CalculatorContent() {
  const [dailyHigh,    setDailyHigh]    = useState('4095');
  const [dailyLow,     setDailyLow]     = useState('4065');
  const [currentPrice, setCurrentPrice] = useState('4070');
  const [preset,       setPreset]       = useState<Preset>('778 TRD');
  const [timeframe,    setTimeframe]    = useState<Timeframe>('1h');

  // 2.6
  const [hhPrice, setHhPrice] = useState('');
  const [llPrice, setLlPrice] = useState('');
  // OB — FIX #2: Bullish/Bearish tanlash
  const [obHigh,  setObHigh]  = useState('');
  const [obLow,   setObLow]   = useState('');
  const [obType,  setObType]  = useState<OBType>('bullish');
  // IFVG — FIX #3: Bullish/Bearish tanlash
  const [fvgHigh, setFvgHigh] = useState('');
  const [fvgLow,  setFvgLow]  = useState('');
  const [fvgType, setFvgType] = useState<OBType>('bullish');

  const calculations = useMemo(() => {
    const high    = parseFloat(dailyHigh)    || 0;
    const low     = parseFloat(dailyLow)     || 0;
    const current = parseFloat(currentPrice) || 0;
    const rangeVal = high - low;

    // FIX #3: dependency array dan tf olib tashlandi — faqat timeframe
    const tf  = timeframeConfig[timeframe];
    const buf = tf.pipBuffer;
    const con = tf.consolOffset;

    if (current === 0) return null;

    // ── Gann helpers ───────────────────────────────────────────
    const sq = Math.sqrt(current);
    const gann = {
      S1: Math.pow(sq-0.25,2), S2: Math.pow(sq-0.50,2),
      S3: Math.pow(sq-0.75,2), S4: Math.pow(sq-1.00,2),
      R1: Math.pow(sq+0.25,2), R2: Math.pow(sq+0.50,2),
      R3: Math.pow(sq+0.75,2), R4: Math.pow(sq+1.00,2),
    };

    const checkGann = (isBuy: boolean, min: number, max: number, tag = '') => {
      if (isBuy) {
        const s = [{l:'S1',v:gann.S1},{l:'S2',v:gann.S2},{l:'S3',v:gann.S3},{l:'S4',v:gann.S4}];
        const c = s.find(x=>x.v>=min&&x.v<=max);
        return c ? {text:`Gann ${c.l} (${c.v.toFixed(2)}) ${tag}bilan mos keldi!`,strong:true}
                 : {text:"Gann bilan sinergiya yo'q",strong:false};
      } else {
        const r = [{l:'R1',v:gann.R1},{l:'R2',v:gann.R2},{l:'R3',v:gann.R3},{l:'R4',v:gann.R4}];
        const c = r.find(x=>x.v>=min&&x.v<=max);
        return c ? {text:`Gann ${c.l} (${c.v.toFixed(2)}) ${tag}bilan mos keldi!`,strong:true}
                 : {text:"Gann bilan sinergiya yo'q",strong:false};
      }
    };

    const pct = (a:number,b:number) => ((Math.abs(a-b)/b)*100).toFixed(2);
    const fmt = (n:number)          => n.toFixed(2);
    const gFmt = {
      S1:gann.S1.toFixed(2),S2:gann.S2.toFixed(2),S3:gann.S3.toFixed(2),S4:gann.S4.toFixed(2),
      R1:gann.R1.toFixed(2),R2:gann.R2.toFixed(2),R3:gann.R3.toFixed(2),R4:gann.R4.toFixed(2),
    };

    // ── ORDER BLOCK ────────────────────────────────────────────
    if (preset === 'ORDER BLOCK') {
      const obH = parseFloat(obHigh);
      const obL = parseFloat(obLow);
      if (isNaN(obH)||isNaN(obL)||obH<=obL) return null;

      // FIX #1: isBuy — foydalanuvchi tanlagan OB turi
      const isBuy  = obType === 'bullish';
      const obMid  = (obH + obL) / 2;
      const obSize = obH - obL;

      // Entry: narx OB ga qaytib kelganida
      // Bullish OB → narx OB dan yuqoriga ketadi → entry = OB yuqori qismi (obH)
      // Bearish OB → narx OB dan pastga ketadi   → entry = OB pastki qismi (obL)
      const entry = isBuy ? obH : obL;

      // SL: OB ning qarama-qarshi tomonidan buf pip narida
      const sl = isBuy ? obL - buf : obH + buf;

      // TP: entry + OB hajmi × 1,2,3
      const tp1 = isBuy ? entry + obSize*1.0 : entry - obSize*1.0;
      const tp2 = isBuy ? entry + obSize*2.0 : entry - obSize*2.0;
      const tp3 = isBuy ? entry + (rangeVal>0 ? rangeVal : obSize*3) : entry - (rangeVal>0 ? rangeVal : obSize*3);

      const gRes = checkGann(isBuy, obL-buf, obH+buf, 'OB ');

      return {
        preset:'ORDER BLOCK' as const, isBuy,
        obHigh:fmt(obH), obLow:fmt(obL),
        obMid:fmt(obMid), obMidPct:pct(obMid,current),
        obSize:fmt(obSize),
        entry:fmt(entry), entryPct:pct(entry,current),
        stopLoss:fmt(sl), slPct:pct(sl,current),
        tp1:fmt(tp1), tp1Pct:pct(tp1,current), rr1:calcRR(entry,sl,tp1),
        tp2:fmt(tp2), tp2Pct:pct(tp2,current), rr2:calcRR(entry,sl,tp2),
        tp3:fmt(tp3), tp3Pct:pct(tp3,current), rr3:calcRR(entry,sl,tp3),
        rangeVal:fmt(rangeVal), gann:gFmt,
        gannConfluence:gRes.text, isStrongSignal:gRes.strong,
        pipBuffer:buf,
      };
    }

    // ── IFVG ──────────────────────────────────────────────────
    if (preset === 'IFVG') {
      const fvgH = parseFloat(fvgHigh);
      const fvgL = parseFloat(fvgLow);
      if (isNaN(fvgH)||isNaN(fvgL)||fvgH<=fvgL) return null;

      // FIX #2: isBuy — foydalanuvchi tanlagan FVG turi
      const isBuy   = fvgType === 'bullish';
      const fvgMid  = (fvgH + fvgL) / 2;
      const fvgSize = fvgH - fvgL;

      // Bullish IFVG: narx FVG ga pastdan kiradi, FVG support bo'lib qaytadi → BUY
      // Bearish IFVG: narx FVG ga tepadan kiradi, FVG resistance bo'lib qaytadi → SELL
      const entry = isBuy ? fvgL : fvgH;
      const sl    = isBuy ? fvgL - buf : fvgH + buf;

      // TP: Fibonacci darajalari FVG hajmiga nisbatan
      const tp1 = isBuy ? fvgH + fvgSize*0.618 : fvgL - fvgSize*0.618;
      const tp2 = isBuy ? fvgH + fvgSize*1.0   : fvgL - fvgSize*1.0;
      const tp3 = isBuy ? fvgH + fvgSize*1.618  : fvgL - fvgSize*1.618;

      const gRes = checkGann(isBuy, fvgL-buf, fvgH+buf, 'IFVG ');

      return {
        preset:'IFVG' as const, isBuy,
        fvgHigh:fmt(fvgH), fvgLow:fmt(fvgL),
        fvgMid:fmt(fvgMid), fvgMidPct:pct(fvgMid,current),
        fvgSize:fmt(fvgSize),
        entry:fmt(entry), entryPct:pct(entry,current),
        stopLoss:fmt(sl), slPct:pct(sl,current),
        tp1:fmt(tp1), tp1Pct:pct(tp1,current), rr1:calcRR(entry,sl,tp1),
        tp2:fmt(tp2), tp2Pct:pct(tp2,current), rr2:calcRR(entry,sl,tp2),
        tp3:fmt(tp3), tp3Pct:pct(tp3,current), rr3:calcRR(entry,sl,tp3),
        rangeVal:fmt(rangeVal), gann:gFmt,
        gannConfluence:gRes.text, isStrongSignal:gRes.strong,
        pipBuffer:buf,
      };
    }

    // ── 778 TRD / AB TRADE / 2.6 ──────────────────────────────
    if (rangeVal <= 0) return null;
    const config = presetConfigs[preset];

    let isBuy: boolean;
    if (preset === '2.6 STRATEGY') {
      const hh = parseFloat(hhPrice);
      const ll = parseFloat(llPrice);
      isBuy = (!isNaN(hh)&&!isNaN(ll))
        ? Math.abs(current-ll) < Math.abs(current-hh)
        : current < (high+low)/2;
    } else {
      isBuy = current < (high+low)/2;
    }

    const reversal      = isBuy ? low  - rangeVal*config.rRev : high + rangeVal*config.rRev;
    const correction    = isBuy ? low  + rangeVal*config.rCor : high - rangeVal*config.rCor;
    const consolidation = isBuy ? correction + con : correction - con;

    // FIX #4: SL entry dan hisoblanadi (correction/reversal)
    let sl: number;
    let entry: number;
    if (preset === '2.6 STRATEGY') {
      entry = reversal;
      sl    = isBuy ? reversal - buf : reversal + buf;
    } else {
      entry = isBuy ? Math.max(correction,consolidation) : Math.min(correction,consolidation);
      sl    = isBuy ? Math.min(correction,consolidation) - buf : Math.max(correction,consolidation) + buf;
    }

    // FIX #4: TP entry nuqtasidan emas, current dan hisoblash (narx hali entry ga yetmagan)
    const tp1 = isBuy ? current + rangeVal*0.5 : current - rangeVal*0.5;
    const tp2 = isBuy ? current + rangeVal     : current - rangeVal;
    const tp3 = isBuy ? current + rangeVal*1.5 : current - rangeVal*1.5;

    let gannCenter: number, gannTol: number;
    if (preset === '2.6 STRATEGY') { gannCenter = reversal; gannTol = buf+2; }
    else { gannCenter = (correction+consolidation)/2; gannTol = buf; }

    const gRes = checkGann(isBuy, gannCenter-gannTol, gannCenter+gannTol);

    let liquidityInfo = '';
    if (preset === '2.6 STRATEGY') {
      const hh = parseFloat(hhPrice); const ll = parseFloat(llPrice);
      if (!isNaN(hh)&&!isNaN(ll)) {
        const offset = rangeVal/2.6;
        liquidityInfo = isBuy
          ? `LL: ${fmt(ll)} | Offset: ${offset.toFixed(3)} | Maqsad: ${fmt(ll+offset)}`
          : `HH: ${fmt(hh)} | Offset: ${offset.toFixed(3)} | Maqsad: ${fmt(hh-offset)}`;
      }
    }

    return {
      preset: preset as '778 TRD'|'AB TRADE'|'2.6 STRATEGY', isBuy,
      reversal:fmt(reversal), reversalPct:pct(reversal,current),
      correction:fmt(correction), correctionPct:pct(correction,current),
      consolidation:fmt(consolidation), consolidationPct:pct(consolidation,current),
      rangeVal:fmt(rangeVal),
      entry:fmt(entry),
      tp1:fmt(tp1), tp1Pct:pct(tp1,current), rr1:calcRR(entry,sl,tp1),
      tp2:fmt(tp2), tp2Pct:pct(tp2,current), rr2:calcRR(entry,sl,tp2),
      tp3:fmt(tp3), tp3Pct:pct(tp3,current), rr3:calcRR(entry,sl,tp3),
      stopLoss:fmt(sl), slPct:pct(sl,current),
      gann:gFmt,
      gannConfluence:gRes.text, isStrongSignal:gRes.strong,
      liquidityInfo, pipBuffer:buf,
    };
  }, [dailyHigh,dailyLow,currentPrice,preset,timeframe,hhPrice,llPrice,obHigh,obLow,obType,fvgHigh,fvgLow,fvgType]);

  const isBuy     = calculations?.isBuy ?? false;
  const rangeVal  = parseFloat(dailyHigh) - parseFloat(dailyLow);
  const tf        = timeframeConfig[timeframe];
  const rangeOk      = rangeVal > 0 && rangeVal <= tf.maxRange;
  const rangeWarning = rangeVal > tf.maxRange;
  const TIMEFRAMES: Timeframe[] = ['1m','5m','15m','1h','4h','1d'];

  // ─── UI helpers ───────────────────────────────────────────
  const TypeToggle = ({ value, onChange, isBuyLabel='Bullish', isSellLabel='Bearish' }:
    { value: OBType; onChange: (v:OBType)=>void; isBuyLabel?:string; isSellLabel?:string }) => (
    <div className="grid grid-cols-2 gap-2 mt-3">
      <button onClick={()=>onChange('bullish')}
        className={`py-2 rounded-lg text-sm font-bold transition-all ${value==='bullish'?'bg-green-600 text-white':'bg-slate-700/80 text-slate-400 hover:bg-slate-600'}`}>
        ▲ {isBuyLabel}
      </button>
      <button onClick={()=>onChange('bearish')}
        className={`py-2 rounded-lg text-sm font-bold transition-all ${value==='bearish'?'bg-red-600 text-white':'bg-slate-700/80 text-slate-400 hover:bg-slate-600'}`}>
        ▼ {isSellLabel}
      </button>
    </div>
  );

  const RRBadge = ({ rr }: {rr:string}) => (
    <span className="ml-2 px-2 py-0.5 bg-yellow-900/40 text-yellow-400 text-xs font-bold rounded">
      R:R {rr}
    </span>
  );

  return (
    <div className="min-h-screen p-4 md:p-8"
      style={{backgroundImage:"url('/image.png')",backgroundSize:'cover',backgroundPosition:'center',backgroundAttachment:'fixed'}}>
      <div className="max-w-2xl mx-auto">

        {/* TIMEFRAME */}
        <div className="bg-slate-900/85 border border-slate-700 rounded-2xl p-4 mb-4 backdrop-blur">
          <div className="text-slate-400 text-xs font-bold tracking-widest mb-3">VAQT ORALIG&apos;I</div>
          <div className="grid grid-cols-6 gap-2">
            {TIMEFRAMES.map(t=>(
              <button key={t} onClick={()=>setTimeframe(t)}
                className={`py-2 rounded-xl font-bold text-sm transition-all ${timeframe===t?'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105':'bg-slate-700/80 text-slate-400 hover:bg-slate-600/80'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className={`mt-3 text-xs font-bold text-center ${tf.color}`}>
            {tf.label} &nbsp;|&nbsp; Max Range: {tf.maxRange} pip &nbsp;|&nbsp; SL Buffer: {tf.pipBuffer} pip
          </div>
        </div>

        {/* BUY / SELL */}
        {calculations && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className={`p-4 rounded-2xl border-2 text-center font-bold text-2xl flex items-center justify-center ${isBuy?'bg-green-900/40 border-green-500 text-green-400':'bg-slate-900/60 border-slate-700 text-slate-500'}`}>
              <span className="text-3xl mr-2">&#9650;</span>BUY
            </div>
            <div className={`p-4 rounded-2xl border-2 text-center font-bold text-2xl flex items-center justify-center ${!isBuy?'bg-red-900/40 border-red-600 text-red-400':'bg-slate-900/60 border-slate-700 text-slate-500'}`}>
              <span className="text-3xl mr-2">&#9660;</span>SELL
            </div>
          </div>
        )}

        {/* INPUTS */}
        <div className="bg-slate-900/85 border border-slate-700 rounded-2xl p-6 mb-6 backdrop-blur">
          <h3 className="text-slate-400 text-xs font-bold tracking-widest mb-4">{tf.label.toUpperCase()} DIAPAZONI</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-slate-400 text-xs font-bold tracking-widest mb-2 block">HIGH (Liquidity)</label>
              <input type="number" value={dailyHigh} onChange={e=>setDailyHigh(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600 rounded-xl text-white text-2xl font-bold focus:border-orange-500 focus:outline-none" step="0.01"/>
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold tracking-widest mb-2 block">LOW (Liquidity)</label>
              <input type="number" value={dailyLow} onChange={e=>setDailyLow(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600 rounded-xl text-white text-2xl font-bold focus:border-orange-500 focus:outline-none" step="0.01"/>
            </div>
          </div>

          {rangeVal > 0 && (
            <div className={`rounded-xl px-4 py-3 flex justify-between items-center text-sm mb-4 ${rangeWarning?'bg-red-900/40 border border-red-600/50':rangeOk?'bg-green-900/20 border border-green-600/30':'bg-slate-700/80'}`}>
              <span className={`font-bold ${rangeWarning?'text-red-400':rangeOk?'text-green-400':'text-slate-400'}`}>
                Range: {rangeVal.toFixed(2)} pip
              </span>
              <span className={`font-bold text-xs ${rangeWarning?'text-red-400':rangeOk?'text-green-400':'text-slate-400'}`}>
                {rangeWarning ? `⚠ Katta! Max: ${tf.maxRange}` : `✓ ${timeframe} uchun mos`}
              </span>
            </div>
          )}

          <div className="mb-4">
            <label className="text-slate-400 text-xs font-bold tracking-widest mb-2 block">HOZIRGI NARX</label>
            <input type="number" value={currentPrice} onChange={e=>setCurrentPrice(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600 rounded-xl text-white text-2xl font-bold focus:border-orange-500 focus:outline-none" step="0.01"/>
          </div>

          <div>
            <label className="text-slate-400 text-xs font-bold tracking-widest mb-2 block">STRATEGIYA</label>
            <select value={preset} onChange={e=>setPreset(e.target.value as Preset)}
              className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600 rounded-xl text-white font-bold focus:border-orange-500 focus:outline-none">
              <option value="778 TRD">778 TRD</option>
              <option value="AB TRADE">AB TRADE</option>
              <option value="2.6 STRATEGY">2.6 STRATEGY</option>
              <option value="ORDER BLOCK">ORDER BLOCK</option>
              <option value="IFVG">IFVG (Inverse FVG)</option>
            </select>
          </div>

          {/* 2.6 HH/LL */}
          {preset==='2.6 STRATEGY' && (
            <div className="mt-4 p-4 bg-amber-900/30 border border-amber-600/40 rounded-xl">
              <p className="text-amber-400 text-xs font-bold tracking-widest mb-3">HH / LL</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs font-bold mb-1 block">HH (Higher High)</label>
                  <input type="number" value={hhPrice} onChange={e=>setHhPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/80 border border-amber-600/50 rounded-lg text-white text-lg font-bold focus:border-amber-400 focus:outline-none" step="0.01" placeholder="HH"/>
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-bold mb-1 block">LL (Lower Low)</label>
                  <input type="number" value={llPrice} onChange={e=>setLlPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/80 border border-amber-600/50 rounded-lg text-white text-lg font-bold focus:border-amber-400 focus:outline-none" step="0.01" placeholder="LL"/>
                </div>
              </div>
            </div>
          )}

          {/* ORDER BLOCK */}
          {preset==='ORDER BLOCK' && (
            <div className="mt-4 p-4 bg-blue-900/30 border border-blue-600/40 rounded-xl">
              <p className="text-blue-400 text-xs font-bold tracking-widest mb-1">ORDER BLOCK ZONE</p>
              <p className="text-slate-500 text-xs mb-1">Oxirgi qarama-qarshi svechaning High va Low</p>
              {/* FIX #7: OB turi tanlash */}
              <TypeToggle value={obType} onChange={setObType} isBuyLabel="Bullish OB" isSellLabel="Bearish OB"/>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-slate-400 text-xs font-bold mb-1 block">OB HIGH</label>
                  <input type="number" value={obHigh} onChange={e=>setObHigh(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/80 border border-blue-600/50 rounded-lg text-white text-lg font-bold focus:border-blue-400 focus:outline-none" step="0.01" placeholder="Yuqori"/>
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-bold mb-1 block">OB LOW</label>
                  <input type="number" value={obLow} onChange={e=>setObLow(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/80 border border-blue-600/50 rounded-lg text-white text-lg font-bold focus:border-blue-400 focus:outline-none" step="0.01" placeholder="Pastki"/>
                </div>
              </div>
            </div>
          )}

          {/* IFVG */}
          {preset==='IFVG' && (
            <div className="mt-4 p-4 bg-purple-900/30 border border-purple-600/40 rounded-xl">
              <p className="text-purple-400 text-xs font-bold tracking-widest mb-1">IFVG ZONE</p>
              <p className="text-slate-500 text-xs mb-1">Fair Value Gap ning tepa va pastki chegarasi</p>
              {/* FIX #8: IFVG turi tanlash */}
              <TypeToggle value={fvgType} onChange={setFvgType} isBuyLabel="Bullish IFVG" isSellLabel="Bearish IFVG"/>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-slate-400 text-xs font-bold mb-1 block">FVG HIGH</label>
                  <input type="number" value={fvgHigh} onChange={e=>setFvgHigh(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/80 border border-purple-600/50 rounded-lg text-white text-lg font-bold focus:border-purple-400 focus:outline-none" step="0.01" placeholder="Yuqori"/>
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-bold mb-1 block">FVG LOW</label>
                  <input type="number" value={fvgLow} onChange={e=>setFvgLow(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/80 border border-purple-600/50 rounded-lg text-white text-lg font-bold focus:border-purple-400 focus:outline-none" step="0.01" placeholder="Pastki"/>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─────── NATIJALAR ─────── */}
        {calculations && (
          <div className="space-y-4">

            {/* ORDER BLOCK natijalar */}
            {calculations.preset==='ORDER BLOCK' && (
              <>
                <h3 className="text-blue-400 text-xs font-bold tracking-widest mb-2">&#9632; ORDER BLOCK — {timeframe} | {obType.toUpperCase()}</h3>
                <div className="bg-blue-900/20 border border-blue-600/50 rounded-2xl p-5 backdrop-blur">
                  <div className="text-blue-400 text-xs font-bold tracking-widest mb-3">OB ZONE</div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div><div className="text-slate-400 text-xs mb-1">OB HIGH</div><div className="text-xl font-bold text-red-400">{calculations.obHigh}</div></div>
                    <div><div className="text-slate-400 text-xs mb-1">OB MID</div><div className="text-xl font-bold text-blue-400">{calculations.obMid}</div><div className="text-xs text-slate-500">{calculations.obMidPct}%</div></div>
                    <div><div className="text-slate-400 text-xs mb-1">OB LOW</div><div className="text-xl font-bold text-green-400">{calculations.obLow}</div></div>
                  </div>
                  <div className="mt-3 text-center text-xs text-slate-500">OB hajmi: <span className="text-blue-300 font-bold">{calculations.obSize} pip</span></div>
                </div>
                <div className="bg-slate-900/85 border-2 border-cyan-600/50 rounded-2xl p-5 backdrop-blur">
                  <div className="text-slate-400 text-xs font-bold tracking-widest mb-2">ENTRY</div>
                  <div className="text-3xl font-bold text-cyan-400">{calculations.entry}</div>
                  <div className="text-xs text-slate-500 mt-1">{isBuy?'Bullish OB — BUY (OB yuqori chegarasidan)':'Bearish OB — SELL (OB pastki chegarasidan)'} | {calculations.entryPct}%</div>
                </div>
                <div className="bg-slate-900/85 border-2 border-red-600/50 rounded-2xl p-5 backdrop-blur">
                  <div className="text-red-400 text-xs font-bold tracking-widest mb-2">STOP LOSS</div>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-red-500">{calculations.stopLoss}</div>
                    <div className="text-sm font-bold text-slate-400">({calculations.slPct}%)</div>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">OB {isBuy?'LOW dan':'HIGH dan'} {calculations.pipBuffer} pip narida</div>
                </div>
              </>
            )}

            {/* IFVG natijalar */}
            {calculations.preset==='IFVG' && (
              <>
                <h3 className="text-purple-400 text-xs font-bold tracking-widest mb-2">&#9670; IFVG — {timeframe} | {fvgType.toUpperCase()}</h3>
                <div className="bg-purple-900/20 border border-purple-600/50 rounded-2xl p-5 backdrop-blur">
                  <div className="text-purple-400 text-xs font-bold tracking-widest mb-3">FVG ZONE</div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div><div className="text-slate-400 text-xs mb-1">FVG HIGH</div><div className="text-xl font-bold text-red-400">{calculations.fvgHigh}</div></div>
                    <div><div className="text-slate-400 text-xs mb-1">FVG MID</div><div className="text-xl font-bold text-purple-400">{calculations.fvgMid}</div><div className="text-xs text-slate-500">{calculations.fvgMidPct}%</div></div>
                    <div><div className="text-slate-400 text-xs mb-1">FVG LOW</div><div className="text-xl font-bold text-green-400">{calculations.fvgLow}</div></div>
                  </div>
                  <div className="mt-3 text-center text-xs text-slate-500">Gap: <span className="text-purple-300 font-bold">{calculations.fvgSize} pip</span></div>
                </div>
                <div className="bg-slate-900/85 border-2 border-cyan-600/50 rounded-2xl p-5 backdrop-blur">
                  <div className="text-slate-400 text-xs font-bold tracking-widest mb-2">ENTRY</div>
                  <div className="text-3xl font-bold text-cyan-400">{calculations.entry}</div>
                  <div className="text-xs text-slate-500 mt-1">{isBuy?'FVG LOW — BUY':'FVG HIGH — SELL'} | {calculations.entryPct}%</div>
                </div>
                <div className="bg-slate-900/85 border-2 border-red-600/50 rounded-2xl p-5 backdrop-blur">
                  <div className="text-red-400 text-xs font-bold tracking-widest mb-2">STOP LOSS</div>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-red-500">{calculations.stopLoss}</div>
                    <div className="text-sm font-bold text-slate-400">({calculations.slPct}%)</div>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">FVG {isBuy?'LOW dan':'HIGH dan'} {calculations.pipBuffer} pip narida</div>
                </div>
              </>
            )}

            {/* 778 / AB / 2.6 */}
            {(calculations.preset==='778 TRD'||calculations.preset==='AB TRADE'||calculations.preset==='2.6 STRATEGY') && (
              <>
                <h3 className="text-slate-400 text-xs font-bold tracking-widest mb-2">KIRISH NUQTALARI — {timeframe}</h3>
                <div className="bg-slate-900/85 border border-red-600/30 rounded-2xl p-5 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="px-4 py-2 rounded-lg text-sm font-bold bg-red-900/30 text-red-400">
                        {calculations.preset==='2.6 STRATEGY'?'Liquidity':'Qaytish'}
                      </div>
                      <div className="text-3xl font-bold text-red-400">{calculations.reversal}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-400">{calculations.reversalPct}%</div>
                      <div className={`text-xs font-bold px-2 py-1 rounded ${isBuy?'bg-green-900/30 text-green-400':'bg-red-900/30 text-red-400'}`}>{isBuy?'BUY':'SELL'}</div>
                    </div>
                  </div>
                </div>

                {calculations.preset!=='2.6 STRATEGY' && (
                  <>
                    <div className="bg-slate-900/85 border border-blue-600/30 rounded-2xl p-5 backdrop-blur">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="px-4 py-2 rounded-lg text-sm font-bold text-blue-400 border border-blue-600">Korreksiya</div>
                          <div className="text-3xl font-bold text-cyan-400">{calculations.correction}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-400">{calculations.correctionPct}%</div>
                          <div className="text-xs font-bold px-2 py-1 rounded bg-red-900/30 text-red-400">SELL</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-900/85 border border-purple-600/30 rounded-2xl p-5 backdrop-blur">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="px-4 py-2 rounded-lg text-sm font-bold text-purple-400 border border-purple-600">Konsolidatsiya</div>
                          <div className="text-3xl font-bold text-purple-300">{calculations.consolidation}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-400">{calculations.consolidationPct}%</div>
                          <div className="text-xs font-bold px-2 py-1 rounded bg-red-900/30 text-red-400">SELL</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <h3 className="text-slate-400 text-xs font-bold tracking-widest mt-4 mb-3">SAVDO REJASI</h3>
                {calculations.preset==='2.6 STRATEGY' && calculations.liquidityInfo && (
                  <div className="bg-amber-900/20 border border-amber-600/30 rounded-2xl p-4 backdrop-blur mb-3">
                    <div className="text-amber-400 text-xs font-bold tracking-widest mb-1">LIQUIDITY ANALIZI</div>
                    <div className="text-sm text-amber-200 font-mono">{calculations.liquidityInfo}</div>
                  </div>
                )}
                <div className="bg-slate-900/85 border-2 border-cyan-600/50 rounded-2xl p-5 backdrop-blur mb-3">
                  <div className="text-slate-400 text-xs font-bold tracking-widest mb-2">ENTRY PRICE</div>
                  <div className="text-3xl font-bold text-cyan-400">
                    {calculations.preset==='2.6 STRATEGY'?calculations.reversal:`${calculations.correction} — ${calculations.consolidation}`}
                  </div>
                  <div className={`text-xs font-bold mt-1 ${tf.color}`}>Buffer: {tf.pipBuffer} pip</div>
                </div>
                <div className="bg-slate-900/85 border-2 border-red-600/50 rounded-2xl p-5 backdrop-blur">
                  <div className="text-red-400 text-xs font-bold tracking-widest mb-2">STOP LOSS</div>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-red-500">{calculations.stopLoss}</div>
                    <div className="text-sm font-bold text-slate-400">({calculations.slPct}%)</div>
                  </div>
                </div>
              </>
            )}

            {/* TP1 / TP2 / TP3 — R:R bilan */}
            <h3 className="text-slate-400 text-xs font-bold tracking-widest mt-6 mb-3">MAQSAD NARXLAR (TP)</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                {label:'TP1', val:calculations.tp1, pct:calculations.tp1Pct, rr:calculations.rr1},
                {label:'TP2', val:calculations.tp2, pct:calculations.tp2Pct, rr:calculations.rr2},
                {label:'TP3', val:calculations.tp3, pct:calculations.tp3Pct, rr:calculations.rr3},
              ].map(tp=>(
                <div key={tp.label} className="bg-slate-900/85 border border-green-600/50 rounded-2xl p-4 backdrop-blur">
                  <div className="text-green-400 font-bold text-sm mb-1">{tp.label}</div>
                  <div className="text-xl font-bold text-green-400">{tp.val}</div>
                  <div className="text-xs text-slate-400 mt-1">{tp.pct}%</div>
                  {/* FIX #6: R:R badge */}
                  <div className="text-xs font-bold text-yellow-400 mt-1">{tp.rr}</div>
                </div>
              ))}
            </div>

            {/* UMUMIY ANALIZ */}
            <h3 className="text-slate-400 text-xs font-bold tracking-widest mt-6 mb-3">UMUMIY ANALIZ</h3>
            <div className={`border-2 rounded-2xl p-5 backdrop-blur ${calculations.isStrongSignal?'bg-green-900/30 border-green-500/50':'bg-slate-900/85 border-slate-700/50'}`}>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <div className={`px-3 py-1 rounded text-xs font-bold ${calculations.isStrongSignal?'bg-green-500/20 text-green-400':'bg-slate-700/80 text-slate-400'}`}>
                  {calculations.isStrongSignal?'KUCHLI SIGNAL':'ODDIY SIGNAL'}
                </div>
                <div className="px-3 py-1 rounded text-xs font-bold bg-slate-700/80 text-slate-400">{calculations.preset}</div>
                <div className={`px-3 py-1 rounded text-xs font-bold bg-slate-700/80 ${tf.color}`}>{timeframe}</div>
              </div>
              <p className="text-lg font-bold text-white mb-1">
                Yo&apos;nalish: <span className={isBuy?'text-green-400':'text-red-400'}>{isBuy?'▲ BUY':'▼ SELL'}</span>
              </p>
              <p className="text-sm text-slate-400">{calculations.gannConfluence}</p>
            </div>

            {/* GANN */}
            <h3 className="text-slate-400 text-xs font-bold tracking-widest mt-6 mb-3">GANN DARAJALARI</h3>
            <div className="grid grid-cols-2 gap-4 pb-8">
              <div className="bg-slate-900/85 border border-red-900/30 rounded-2xl p-4 backdrop-blur">
                <div className="text-red-400 text-xs font-bold tracking-widest mb-3 text-center">RESISTANCE</div>
                <div className="space-y-2">
                  {(['R4','R3','R2','R1'] as const).map(k=>(
                    <div key={k} className="flex justify-between text-sm">
                      <span className="text-slate-400">{k}:</span>
                      <span className="text-red-300 font-bold">{calculations.gann[k]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-900/85 border border-green-900/30 rounded-2xl p-4 backdrop-blur">
                <div className="text-green-400 text-xs font-bold tracking-widest mb-3 text-center">SUPPORT</div>
                <div className="space-y-2">
                  {(['S1','S2','S3','S4'] as const).map(k=>(
                    <div key={k} className="flex justify-between text-sm">
                      <span className="text-slate-400">{k}:</span>
                      <span className="text-green-300 font-bold">{calculations.gann[k]}</span>
                    </div>
                  ))}
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  if (!isAuthenticated) return <PasswordScreen onAuthenticate={()=>setIsAuthenticated(true)}/>;
  return <CalculatorContent/>;
}
