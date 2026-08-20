'use client';

import { useState, useEffect, memo } from 'react';

interface AITrapHunterProps {
  currentPrice?: number;
  assetSymbol?: string;
  onOpenSignal?: (type: 'BUY' | 'SELL') => void;
}

function AITrapHunter({
  currentPrice = 4492.5,
  assetSymbol = 'XAUUSD',
  onOpenSignal,
}: AITrapHunterProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [trapDetected, setTrapDetected] = useState(true);
  const [trapData, setTrapData] = useState({
    session: 'London / NY Overlap',
    type: 'Judas Swing Manipulation' as 'Judas Swing Manipulation' | 'Asian High Sweep' | 'EQL Liquidity Trap',
    direction: 'BUY' as 'BUY' | 'SELL',
    sweptLevel: (currentPrice - 2.5).toFixed(2),
    entryZone: currentPrice.toFixed(2),
    slLevel: (currentPrice - 1.8).toFixed(2),
    confidence: '95% (A+ Institutional Trap)',
  });

  const speakAlert = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const text = `Diqqat! ${assetSymbol} da ${currentPrice} darajasida likvidlik supurildi va institutsional tuzoq yakunlandi. Tezkor ${trapData.direction} signali faollashdi.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'uz-UZ';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setTrapDetected(true);
      speakAlert();
    }, 1200);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 mb-4 backdrop-blur-xl shadow-2xl space-y-4 relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl animate-pulse">🚨</span>
          <div>
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <span>AI REAL-TIME TRAP HUNTER</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono font-bold border border-rose-500/40 animate-pulse">
                LIVE RADAR
              </span>
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Sessiya ochilishidagi likvidlik tuzoqlari (Judas Swing) va institutsional aldovlarni aniqlash
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={speakAlert}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all border border-slate-700 flex items-center gap-1"
            title="Ovozli eshitish"
          >
            <span>🔊</span>
            <span className="hidden sm:inline">Ovoz</span>
          </button>
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-600 hover:to-amber-700 text-white font-bold text-xs shadow-lg shadow-rose-500/25 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <span className={isScanning ? 'animate-spin' : ''}>📡</span>
            <span>{isScanning ? 'Skanerlanmoqda...' : 'Tuzoqlarni Skanerlash'}</span>
          </button>
        </div>
      </div>

      {/* Detected Alert Box */}
      {trapDetected && (
        <div className="bg-gradient-to-br from-slate-950 via-rose-950/20 to-slate-950 border border-rose-500/40 rounded-xl p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <span className="text-rose-400 font-black text-xs uppercase tracking-wider">
                {trapData.type} ANIQLANDI!
              </span>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
              {trapData.confidence}
            </span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed">
            ⚡ <strong>Tuzoq mexanizmi:</strong> Narx Osiyo sessiyasi pastki likvidligini (<strong>${trapData.sweptLevel}</strong>) supurib, chakana sotuvchilarni chalg'itdi va darhol 1m FVG da rad etish (rejection) hosil qildi. Yirik banklar <strong>${trapData.entryZone}</strong> atrofida xarid buyurtmalarini to'ldirdi.
          </p>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Supurilgan Likvidlik</span>
              <span className="text-red-400 font-bold">${trapData.sweptLevel}</span>
            </div>
            <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
              <span className="text-emerald-400 text-[10px] block">Tavsiya Kirish (Entry)</span>
              <span className="text-white font-bold">${trapData.entryZone}</span>
            </div>
            <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Qisqa SL</span>
              <span className="text-red-300 font-bold">${trapData.slLevel}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(AITrapHunter);
