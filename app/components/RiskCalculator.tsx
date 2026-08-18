'use client';

import { useState, useMemo, useEffect } from 'react';
import { AssetConfig } from './MultiAssetSelector';

interface RiskCalculatorProps {
  entryPrice?: string | number;
  stopLossPrice?: string | number;
  tp1Price?: string | number;
  tp2Price?: string | number;
  tp3Price?: string | number;
  isBuy?: boolean;
  asset: AssetConfig;
}

export default function RiskCalculator({
  entryPrice = '',
  stopLossPrice = '',
  tp1Price = '',
  tp2Price = '',
  tp3Price = '',
  isBuy = true,
  asset,
}: RiskCalculatorProps) {
  const [balance, setBalance] = useState<string>('1000');
  const [riskType, setRiskType] = useState<'percent' | 'fixed'>('percent');
  const [riskPercent, setRiskPercent] = useState<string>('1');
  const [fixedRisk, setFixedRisk] = useState<string>('10');
  const [customSLPips, setCustomSLPips] = useState<string>('');
  const [copiedLot, setCopiedLot] = useState(false);

  // Load balance from localStorage if available
  useEffect(() => {
    try {
      const savedBalance = localStorage.getItem('trading_calc_balance');
      if (savedBalance) setBalance(savedBalance);
      const savedRiskPct = localStorage.getItem('trading_calc_risk_pct');
      if (savedRiskPct) setRiskPercent(savedRiskPct);
    } catch {
      // ignore
    }
  }, []);

  const handleBalanceChange = (val: string) => {
    setBalance(val);
    try {
      localStorage.setItem('trading_calc_balance', val);
    } catch {}
  };

  const handleRiskPercentChange = (val: string) => {
    setRiskPercent(val);
    try {
      localStorage.setItem('trading_calc_risk_pct', val);
    } catch {}
  };

  const entry = parseFloat(String(entryPrice)) || 0;
  const sl = parseFloat(String(stopLossPrice)) || 0;
  const tp1 = parseFloat(String(tp1Price)) || 0;
  const tp2 = parseFloat(String(tp2Price)) || 0;
  const tp3 = parseFloat(String(tp3Price)) || 0;
  const acctBalance = parseFloat(balance) || 0;

  const result = useMemo(() => {
    if (acctBalance <= 0) return null;

    // Calculate dollar amount at risk
    let riskDollar = 0;
    if (riskType === 'percent') {
      const pct = parseFloat(riskPercent) || 0;
      riskDollar = acctBalance * (pct / 100);
    } else {
      riskDollar = parseFloat(fixedRisk) || 0;
    }

    if (riskDollar <= 0) return null;

    // Calculate SL pips
    let slDistance = 0;
    if (customSLPips) {
      slDistance = parseFloat(customSLPips) * asset.pipSize;
    } else if (entry > 0 && sl > 0) {
      slDistance = Math.abs(entry - sl);
    }

    if (slDistance <= 0) return null;

    const slPips = slDistance / asset.pipSize;

    // Standard pip value calculation per 1.00 lot:
    // Gold: 1 lot = 100 oz. 1 pip (0.10) = $10.00
    // Forex: 1 lot = 100k units. 1 pip (0.0001) = $10.00
    // Crypto: 1 lot = 1 unit. 1 pip (1.00) = $1.00
    // Indices: 1 lot = 1 contract. 1 point (1.00) = $1.00
    const oneLotPipDollarValue = asset.pipSize * asset.contractSize;

    // Total dollar loss for 1 full lot = slPips * oneLotPipDollarValue
    const lossForOneLot = (slDistance / asset.pipSize) * oneLotPipDollarValue;

    if (lossForOneLot <= 0) return null;

    const rawLot = riskDollar / lossForOneLot;
    const lotSize = Math.max(0.01, parseFloat(rawLot.toFixed(2)));

    // Actual Risk Dollar based on rounded lot
    const actualRiskDollar = rawLot >= 0.01 ? (lotSize * lossForOneLot) : riskDollar;

    // TP Profits
    const calcProfit = (tpVal: number) => {
      if (tpVal <= 0 || entry <= 0) return null;
      const dist = Math.abs(tpVal - entry);
      const profitDollar = (dist / asset.pipSize) * oneLotPipDollarValue * lotSize;
      const profitPct = (profitDollar / acctBalance) * 100;
      const rr = actualRiskDollar > 0 ? (profitDollar / actualRiskDollar).toFixed(2) : '0';
      return {
        dollar: profitDollar.toFixed(2),
        pct: profitPct.toFixed(1),
        rr: `1:${rr}`,
      };
    };

    return {
      riskDollar: riskDollar.toFixed(2),
      actualRiskDollar: actualRiskDollar.toFixed(2),
      riskPct: ((actualRiskDollar / acctBalance) * 100).toFixed(1),
      slPips: slPips.toFixed(1),
      lotSize: lotSize.toFixed(2),
      tp1: calcProfit(tp1),
      tp2: calcProfit(tp2),
      tp3: calcProfit(tp3),
    };
  }, [acctBalance, riskType, riskPercent, fixedRisk, customSLPips, entry, sl, tp1, tp2, tp3, asset]);

  const copyLot = () => {
    if (!result?.lotSize) return;
    navigator.clipboard.writeText(result.lotSize).then(() => {
      setCopiedLot(true);
      setTimeout(() => setCopiedLot(false), 2000);
    });
  };

  return (
    <div className="bg-slate-900/85 border border-amber-600/50 rounded-2xl p-5 mb-4 backdrop-blur shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <div>
            <h3 className="text-amber-400 text-sm font-bold tracking-wider">RISK & LOT MENEJMENT</h3>
            <p className="text-slate-500 text-xs">Depozit va Stop Loss ga mos optimal lot hajmi</p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 bg-amber-950/60 border border-amber-500/30 text-amber-300 font-bold rounded-lg">
          {asset.name}
        </span>
      </div>

      {/* Inputs grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* Balans */}
        <div>
          <label className="text-slate-400 text-xs font-bold mb-1.5 block">DEPOZIT / BALANS ($)</label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-slate-500 font-bold">$</span>
            <input
              type="number"
              value={balance}
              onChange={(e) => handleBalanceChange(e.target.value)}
              placeholder="1000"
              className="w-full pl-8 pr-3 py-2.5 bg-slate-800/90 border border-slate-600 rounded-xl text-white font-bold text-lg focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Risk Tanlash */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-slate-400 text-xs font-bold block">RISK MIQDORI</label>
            <div className="flex gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => setRiskType('percent')}
                className={`px-2 py-0.5 rounded font-bold ${
                  riskType === 'percent' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                % Foiz
              </button>
              <button
                type="button"
                onClick={() => setRiskType('fixed')}
                className={`px-2 py-0.5 rounded font-bold ${
                  riskType === 'fixed' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                $ Dollar
              </button>
            </div>
          </div>

          {riskType === 'percent' ? (
            <div className="flex gap-1.5">
              {['0.5', '1', '2', '3'].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleRiskPercentChange(pct)}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    riskPercent === pct
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {pct}%
                </button>
              ))}
              <input
                type="number"
                value={riskPercent}
                onChange={(e) => handleRiskPercentChange(e.target.value)}
                placeholder="%"
                step="0.1"
                className="w-16 px-2 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white font-bold text-center text-sm focus:border-amber-400 focus:outline-none"
              />
            </div>
          ) : (
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-500 font-bold">$</span>
              <input
                type="number"
                value={fixedRisk}
                onChange={(e) => setFixedRisk(e.target.value)}
                placeholder="20"
                className="w-full pl-8 pr-3 py-2.5 bg-slate-800/90 border border-slate-600 rounded-xl text-white font-bold text-lg focus:border-amber-400 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Stop Loss Info / Override */}
      <div className="bg-slate-800/60 rounded-xl p-3 mb-4 flex items-center justify-between text-xs">
        <div>
          <span className="text-slate-400">Joriy SL masofasi: </span>
          <span className="text-red-400 font-bold font-mono">
            {result ? `${result.slPips} pip` : 'Entry va SL kiritilmagan'}
          </span>
          {entry > 0 && sl > 0 && (
            <span className="text-slate-500 ml-2">
              (Entry: {entry}, SL: {sl})
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Qo&apos;lda pip:</span>
          <input
            type="number"
            value={customSLPips}
            onChange={(e) => setCustomSLPips(e.target.value)}
            placeholder="masalan 25"
            className="w-20 px-2 py-1 bg-slate-900 border border-slate-600 rounded-lg text-white font-mono text-center focus:border-amber-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Lot Size Result Card */}
      {result ? (
        <div className="bg-gradient-to-br from-amber-950/60 via-slate-900 to-orange-950/50 border-2 border-amber-500/60 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
            <div>
              <div className="text-amber-400 text-xs font-bold tracking-widest">TAVSIYA ETILGAN LOT HAJMI</div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-black text-white font-mono tracking-tight">{result.lotSize}</span>
                <span className="text-amber-400 font-bold text-sm">LOT</span>
              </div>
            </div>
            <button
              onClick={copyLot}
              className="px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              {copiedLot ? <span>✓ Nusxalandi!</span> : <span>📋 Lotni nusxalash</span>}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 pt-1 text-center text-xs">
            <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-700/60">
              <div className="text-slate-400 mb-1">Maksimal Risk ($)</div>
              <div className="text-red-400 font-bold text-base font-mono">${result.actualRiskDollar}</div>
              <div className="text-slate-500 text-[10px]">({result.riskPct}% depozit)</div>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-700/60">
              <div className="text-slate-400 mb-1">SL Masofasi</div>
              <div className="text-amber-300 font-bold text-base font-mono">{result.slPips}</div>
              <div className="text-slate-500 text-[10px]">pip</div>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-700/60">
              <div className="text-slate-400 mb-1">1 Pip Qiymati</div>
              <div className="text-emerald-400 font-bold text-base font-mono">
                ${((parseFloat(result.lotSize) || 0) * asset.pipSize * asset.contractSize).toFixed(2)}
              </div>
              <div className="text-slate-500 text-[10px]">ushbu lot bilan</div>
            </div>
          </div>

          {/* Projected Target Profits */}
          {(result.tp1 || result.tp2 || result.tp3) && (
            <div className="mt-3 pt-3 border-t border-amber-500/20">
              <div className="text-slate-400 text-[11px] font-bold tracking-wider mb-2">KUTILAYOTGAN FOYDALAR ($)</div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {result.tp1 && (
                  <div className="bg-green-950/40 border border-green-700/40 rounded-xl p-2">
                    <div className="text-green-400 font-bold">TP1 (+{result.tp1.pct}%)</div>
                    <div className="text-white font-bold text-sm font-mono">+${result.tp1.dollar}</div>
                    <div className="text-yellow-400 text-[10px] font-bold">{result.tp1.rr}</div>
                  </div>
                )}
                {result.tp2 && (
                  <div className="bg-green-950/40 border border-green-700/40 rounded-xl p-2">
                    <div className="text-green-400 font-bold">TP2 (+{result.tp2.pct}%)</div>
                    <div className="text-white font-bold text-sm font-mono">+${result.tp2.dollar}</div>
                    <div className="text-yellow-400 text-[10px] font-bold">{result.tp2.rr}</div>
                  </div>
                )}
                {result.tp3 && (
                  <div className="bg-green-950/40 border border-green-700/40 rounded-xl p-2">
                    <div className="text-green-400 font-bold">TP3 (+{result.tp3.pct}%)</div>
                    <div className="text-white font-bold text-sm font-mono">+${result.tp3.dollar}</div>
                    <div className="text-yellow-400 text-[10px] font-bold">{result.tp3.rr}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 text-center text-xs text-slate-400">
          💡 Lot hajmini hisoblash uchun yuqorida <strong className="text-white">Entry</strong> va <strong className="text-white">Stop Loss</strong> narxini kiriting yoki o&apos;ng tomondan pip masofasini yozing.
        </div>
      )}
    </div>
  );
}
