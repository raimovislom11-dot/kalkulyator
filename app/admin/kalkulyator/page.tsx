'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import MultiAssetSelector, { ASSET_LIST, AssetConfig } from '../../components/MultiAssetSelector';
import SignalCardGenerator from '../../components/SignalCardGenerator';
import MetaTraderCommandGenerator from '../../components/MetaTraderCommandGenerator';

const RiskCalculator = dynamic(() => import('../../components/RiskCalculator'), { ssr: false });

type Preset = 'Elif trading' | 'AB TRADE' | '2.6 STRATEGY' | 'ORDER BLOCK' | 'IFVG' | 'SNR_ICT' | 'SMT' | 'FIBONACCI';
type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
type OBType = 'bullish' | 'bearish';

const timeframeConfig: Record<Timeframe, { label: string; maxRange: number; pipBuffer: number; consolOffset: number; color: string }> = {
  '1m': { label: '1 Daqiqa', maxRange: 10, pipBuffer: 1.0, consolOffset: 0.5, color: 'text-sky-400' },
  '5m': { label: '5 Daqiqa', maxRange: 25, pipBuffer: 1.5, consolOffset: 1.0, color: 'text-blue-400' },
  '15m': { label: '15 Daqiqa', maxRange: 100, pipBuffer: 2.0, consolOffset: 2.0, color: 'text-indigo-400' },
  '1h': { label: '1 Soat', maxRange: 100, pipBuffer: 3.0, consolOffset: 3.0, color: 'text-violet-400' },
  '4h': { label: '4 Soat', maxRange: 250, pipBuffer: 5.0, consolOffset: 5.0, color: 'text-purple-400' },
  '1d': { label: '1 Kun', maxRange: 600, pipBuffer: 10.0, consolOffset: 10.0, color: 'text-orange-400' },
};

const calcRR = (entry: number, sl: number, tp: number): string => {
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  if (risk === 0) return '—';
  return `1 : ${(reward / risk).toFixed(2)}`;
};

export default function KalkulyatorPage() {
  const [selectedAsset, setSelectedAsset] = useState<AssetConfig>(ASSET_LIST[0]);
  const [dailyHigh, setDailyHigh] = useState('4510.50');
  const [dailyLow, setDailyLow] = useState('4485.20');
  const [currentPrice, setCurrentPrice] = useState('4502.80');
  const [preset, setPreset] = useState<Preset>('Elif trading');
  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const [obHigh, setObHigh] = useState('4505.00');
  const [obLow, setObLow] = useState('4495.00');
  const [obType, setObType] = useState<OBType>('bullish');

  const calculations = useMemo(() => {
    const high = parseFloat(dailyHigh) || 0;
    const low = parseFloat(dailyLow) || 0;
    const current = parseFloat(currentPrice) || 0;
    const rangeVal = high - low;
    const tf = timeframeConfig[timeframe];
    const buf = tf.pipBuffer * selectedAsset.pipSize;

    if (current === 0) return null;

    const sq = Math.sqrt(current);
    const gann = {
      S1: Math.pow(sq - 0.25, 2),
      S2: Math.pow(sq - 0.50, 2),
      R1: Math.pow(sq + 0.25, 2),
      R2: Math.pow(sq + 0.50, 2),
    };

    const isBuy = current > (high + low) / 2;
    const entry = isBuy ? high - rangeVal * 0.382 : low + rangeVal * 0.382;
    const sl = isBuy ? entry - (rangeVal * 0.2 + buf) : entry + (rangeVal * 0.2 + buf);
    const tp1 = isBuy ? entry + (rangeVal * 0.5) : entry - (rangeVal * 0.5);
    const tp2 = isBuy ? entry + (rangeVal * 1.0) : entry - (rangeVal * 1.0);

    return {
      isBuy,
      entry: entry.toFixed(selectedAsset.digits),
      sl: sl.toFixed(selectedAsset.digits),
      tp1: tp1.toFixed(selectedAsset.digits),
      tp2: tp2.toFixed(selectedAsset.digits),
      rr: calcRR(entry, sl, tp1),
      gann: {
        S1: gann.S1.toFixed(selectedAsset.digits),
        S2: gann.S2.toFixed(selectedAsset.digits),
        R1: gann.R1.toFixed(selectedAsset.digits),
        R2: gann.R2.toFixed(selectedAsset.digits),
      },
      rangeVal: rangeVal.toFixed(selectedAsset.digits),
    };
  }, [dailyHigh, dailyLow, currentPrice, timeframe, selectedAsset]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Kalkulyator & Signallar</h1>
          <p className="mt-1 text-sm text-slate-400">Ko'p strategiyali narx darajalari va Gann darajalari hisoblash</p>
        </div>
      </header>

      {/* Asset Tanlash */}
      <MultiAssetSelector selectedAsset={selectedAsset} onSelectAsset={setSelectedAsset} />

      {/* Asosiy kalkulyator griddagi panellar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chap panel: Kirish parametrlari */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-5 backdrop-blur-xl space-y-4 shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>⚙️</span> Narx Parametrlari
            </h2>

            {/* Timeframe tanlash */}
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1.5 block">Timeframe</label>
              <div className="grid grid-cols-6 gap-1.5">
                {(['1m', '5m', '15m', '1h', '4h', '1d'] as Timeframe[]).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTimeframe(tf)}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                      timeframe === tf
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md font-black'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Strategiya */}
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1.5 block">Strategiya</label>
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value as Preset)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-amber-500"
              >
                <option value="Elif trading">Elif trading (Gann & SMC)</option>
                <option value="AB TRADE">AB TRADE</option>
                <option value="2.6 STRATEGY">2.6 STRATEGY</option>
                <option value="ORDER BLOCK">ORDER BLOCK</option>
                <option value="IFVG">IFVG (Inversion FVG)</option>
                <option value="SNR_ICT">SNR + ICT</option>
                <option value="SMT">SMT Divergence</option>
                <option value="FIBONACCI">Fibonacci OTE</option>
              </select>
            </div>

            {/* Narxlar inputi */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 mb-1 block">Maksimum (High)</label>
                <input
                  type="number"
                  step="any"
                  value={dailyHigh}
                  onChange={(e) => setDailyHigh(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 mb-1 block">Minimum (Low)</label>
                <input
                  type="number"
                  step="any"
                  value={dailyLow}
                  onChange={(e) => setDailyLow(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-400 mb-1 block">Joriy Narx</label>
                <input
                  type="number"
                  step="any"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Gann & Darajalar Hisobi */}
          {calculations && (
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-5 backdrop-blur-xl space-y-3 shadow-xl">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>📐</span> Gann Matematik Darajalari
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2.5">
                  <div className="text-red-400 font-bold text-[10px]">R2 (Maks Qarshilik)</div>
                  <div className="text-white font-bold">{calculations.gann.R2}</div>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-2.5">
                  <div className="text-orange-400 font-bold text-[10px]">R1 (Qarshilik)</div>
                  <div className="text-white font-bold">{calculations.gann.R1}</div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5">
                  <div className="text-emerald-400 font-bold text-[10px]">S1 (Qo'llab-quvvatlash)</div>
                  <div className="text-white font-bold">{calculations.gann.S1}</div>
                </div>
                <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-2.5">
                  <div className="text-teal-400 font-bold text-[10px]">S2 (Kuchli Tayanch)</div>
                  <div className="text-white font-bold">{calculations.gann.S2}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* O'ng panel: Signal Kartasi & Buyruq generatori */}
        <div className="lg:col-span-6 space-y-4">
          {calculations && (
            <SignalCardGenerator
              assetName={selectedAsset.name}
              assetSymbol={selectedAsset.symbol}
              command={calculations.isBuy ? 'BUY' : 'SELL'}
              entry={calculations.entry}
              sl={calculations.sl}
              tp1={calculations.tp1}
              tp2={calculations.tp2}
              rr={calculations.rr}
            />
          )}
          <MetaTraderCommandGenerator />
        </div>
      </div>

      {/* Lot & Risk Kalkulyatori integratsiyasi */}
      <div className="pt-4">
        <RiskCalculator asset={selectedAsset} />
      </div>
    </div>
  );
}
