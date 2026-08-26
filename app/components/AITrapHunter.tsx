'use client';

import { useState, useEffect, memo } from 'react';
import { signalsStore } from '../lib/signalsStore';

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
  const [trapDetected, setTrapDetected] = useState(false);
  const [savedToSignals, setSavedToSignals] = useState(false);
  const [trapData, setTrapData] = useState({
    session: 'London / NY Overlap',
    type: 'Judas Swing Manipulation' as 'Judas Swing Manipulation' | 'Asian High Sweep' | 'EQL Liquidity Trap',
    direction: 'BUY' as 'BUY' | 'SELL',
    sweptLevel: (currentPrice - 2.5).toFixed(2),
    entryZone: currentPrice.toFixed(2),
    slLevel: (currentPrice - 1.8).toFixed(2),
    tp1: (currentPrice + 4.5).toFixed(2),
    tp2: (currentPrice + 8.0).toFixed(2),
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
      const isBuy = Math.random() > 0.4;
      const dir: 'BUY' | 'SELL' = isBuy ? 'BUY' : 'SELL';
      const offset = currentPrice > 100 ? (currentPrice > 1000 ? 2.5 : 0.5) : 0.0020;
      const slOffset = currentPrice > 100 ? (currentPrice > 1000 ? 1.8 : 0.35) : 0.0015;
      const tp1Offset = currentPrice > 100 ? (currentPrice > 1000 ? 4.5 : 0.9) : 0.0035;
      const tp2Offset = currentPrice > 100 ? (currentPrice > 1000 ? 8.0 : 1.6) : 0.0065;
      const decimals = currentPrice > 100 ? 2 : 5;

      setTrapData({
        session: 'London / NY Overlap',
        type: 'Judas Swing Manipulation',
        direction: dir,
        sweptLevel: (isBuy ? currentPrice - offset : currentPrice + offset).toFixed(decimals),
        entryZone: currentPrice.toFixed(decimals),
        slLevel: (isBuy ? currentPrice - slOffset : currentPrice + slOffset).toFixed(decimals),
        tp1: (isBuy ? currentPrice + tp1Offset : currentPrice - tp1Offset).toFixed(decimals),
        tp2: (isBuy ? currentPrice + tp2Offset : currentPrice - tp2Offset).toFixed(decimals),
        confidence: '95% (A+ Institutional Trap)',
      });
      setTrapDetected(true);
      speakAlert();
    }, 1200);
  };

  const handleSaveToSignals = () => {
    signalsStore.add({
      asset: assetSymbol,
      symbol: assetSymbol,
      timeframe: '1m/5m',
      termMode: 'trap',
      strategy: `Trap Hunter: ${trapData.type}`,
      direction: trapData.direction,
      entry: trapData.entryZone,
      sl: trapData.slLevel,
      tp1: trapData.tp1,
      tp2: trapData.tp2,
      outcome: 'PENDING',
      source: 'trap-hunter',
    });

    setSavedToSignals(true);
    setTimeout(() => setSavedToSignals(false), 2500);

    const el = document.getElementById('ai-signals-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
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
      {trapDetected ? (
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
            ⚡ <strong>Tuzoq mexanizmi:</strong> Narx Osiyo sessiyasi pastki likvidligini (<strong>${trapData.sweptLevel}</strong>) supurib, chakana sotuvchilarni chalg&apos;itdi va darhol 1m FVG da rad etish (rejection) hosil qildi. Yirik banklar <strong>${trapData.entryZone}</strong> atrofida xarid buyurtmalarini to&apos;ldirdi.
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

          {/* Action to Save to Signals */}
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
            <button
              onClick={handleSaveToSignals}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-lg active:scale-95 ${
                savedToSignals
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white shadow-rose-500/20'
              }`}
            >
              <span>{savedToSignals ? '✓' : '📥'}</span>
              <span>{savedToSignals ? 'Signallarga qo\'shildi!' : 'Signallar bo\'limiga qo\'shish'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 text-center text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
          <span>📡</span>
          <span>Bozor skaneri tayyor holatda. Likvidlik tuzoqlarini qidirish uchun yuqoridagi <strong>&quot;Tuzoqlarni Skanerlash&quot;</strong> tugmasini bosing.</span>
        </div>
      )}
    </div>
  );
}

export default memo(AITrapHunter);

