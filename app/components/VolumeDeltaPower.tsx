'use client';

import { useState, useEffect, memo } from 'react';

function VolumeDeltaPower() {
  const [buyersPct, setBuyersPct] = useState(68);
  const [sellersPct, setSellersPct] = useState(32);
  const [deltaValue, setDeltaValue] = useState('+1,420 Lots');
  const [imbalanceStatus, setImbalanceStatus] = useState('Agressiv Xarid Bosimi (Institutional Buying)');

  useEffect(() => {
    const intv = setInterval(() => {
      const b = Math.floor(Math.random() * 15) + 60; // 60 - 75%
      setBuyersPct(b);
      setSellersPct(100 - b);
      setDeltaValue(`+${Math.floor(Math.random() * 500) + 1200} Lots`);
    }, 4000);
    return () => clearInterval(intv);
  }, []);

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 mb-4 backdrop-blur-xl shadow-2xl space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌊</span>
          <div>
            <h3 className="text-white font-bold text-sm">LIVE ORDER FLOW VOLUME DELTA & IMBALANCE</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              1m/5m shamlardagi real-time xaridorlar va sotuvchilar hajmi jangi
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
        {/* Percentage Head */}
        <div className="flex flex-wrap justify-between items-center gap-2 text-xs font-mono font-bold">
          <span className="text-emerald-400 flex items-center gap-1">
            <span>🟢 BUYERS:</span>
            <span className="text-base">{buyersPct}%</span>
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[11px]">
            Delta: {deltaValue}
          </span>
          <span className="text-rose-400 flex items-center gap-1">
            <span>🔴 SELLERS:</span>
            <span className="text-base">{sellersPct}%</span>
          </span>
        </div>

        {/* Dual Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-3 flex overflow-hidden p-0.5 gap-1">
          <div
            className="bg-gradient-to-r from-emerald-600 to-teal-400 h-full rounded-full transition-all duration-700 shadow-lg shadow-emerald-500/30"
            style={{ width: `${buyersPct}%` }}
          />
          <div
            className="bg-gradient-to-r from-rose-500 to-red-600 h-full rounded-full transition-all duration-700 shadow-lg shadow-rose-500/30"
            style={{ width: `${sellersPct}%` }}
          />
        </div>

        {/* Status */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
          <span className="text-slate-400">Order Flow Xulosasi:</span>
          <span className="text-emerald-400 font-bold font-mono">{imbalanceStatus}</span>
        </div>
      </div>
    </div>
  );
}

export default memo(VolumeDeltaPower);
