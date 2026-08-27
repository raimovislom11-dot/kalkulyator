'use client';

import { useState, memo } from 'react';
import { signalsStore } from '../lib/signalsStore';

interface SignalCardProps {
  assetSymbol?: string;
  assetName?: string;
  command?: 'BUY' | 'SELL';
  entry?: string;
  sl?: string;
  tp1?: string;
  tp2?: string;
  rr?: string;
}

function SignalCardGenerator({
  assetSymbol = 'XAUUSD',
  assetName = 'Gold',
  command = 'BUY',
  entry = '4492.50',
  sl = '4490.50',
  tp1 = '4495.00',
  tp2 = '4497.50',
  rr = '1:2.8',
}: SignalCardProps) {
  const [copied, setCopied] = useState(false);
  const [savedArchive, setSavedArchive] = useState(false);

  const copyText = () => {
    const text =
      `⚡ PROFESSIONAL SIGNAL • ${assetName} (${assetSymbol})\n` +
      `● Buyruq: ${command === 'BUY' ? '🟢 BUY' : '🔴 SELL'}\n` +
      `● Entry: ${entry} USD\n` +
      `● Stop Loss: ${sl}\n` +
      `● TP1: ${tp1}\n` +
      `● TP2: ${tp2}\n` +
      `● Risk/Reward: ${rr}\n` +
      `\n🔗 https://t.me/+U5pPkneGmM1mMjYy`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToArchive = () => {
    signalsStore.add({
      asset: assetName,
      symbol: assetSymbol,
      timeframe: '1m/5m',
      termMode: 'short',
      strategy: "Qo'lda hisoblangan signal",
      direction: command,
      entry,
      sl,
      tp1,
      tp2,
      rr,
      outcome: 'PENDING',
      source: 'manual',
    });
    setSavedArchive(true);
    setTimeout(() => setSavedArchive(false), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 mb-4 backdrop-blur-xl shadow-2xl space-y-4">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📸</span>
          <div>
            <h3 className="text-white font-bold text-sm">TELEGRAM / INSTAGRAM SIGNAL KARTASI</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Kanal va do&apos;stlarga yuborish uchun estetik signal kartochkasi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveToArchive}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 border ${
              savedArchive
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-500/30'
                : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400/30 text-white shadow-indigo-500/20'
            }`}
          >
            <span>{savedArchive ? '✓' : '📥'}</span>
            <span>{savedArchive ? "Arxivga qo'shildi!" : "Arxivga saqlash"}</span>
          </button>
          <button
            onClick={copyText}
            className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5"
          >
            <span>{copied ? '✓ Nusxalandi!' : '📋 Signalni nusxalash'}</span>
          </button>
        </div>
      </div>

      {/* Visual Card Mockup */}
      <div className="max-w-md mx-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-700/80 rounded-2xl p-5 shadow-2xl space-y-3.5 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🥇</span>
            <div>
              <div className="text-white font-black text-base">{assetName} ({assetSymbol})</div>
              <div className="text-[10px] text-slate-400 font-mono">1m/5m SMC Scalp</div>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-xl text-xs font-black tracking-wider uppercase shadow-md ${
            command === 'BUY'
              ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
              : 'bg-rose-500 text-white shadow-rose-500/30'
          }`}>
            {command === 'BUY' ? '▲ BUY' : '▼ SELL'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] block">KIRISH (ENTRY)</span>
            <span className="text-white font-bold text-sm">${entry}</span>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
            <span className="text-red-400 text-[10px] block">STOP LOSS</span>
            <span className="text-red-300 font-bold text-sm">${sl}</span>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
            <span className="text-emerald-400 text-[10px] block">TAKE PROFIT 1</span>
            <span className="text-emerald-300 font-bold text-sm">${tp1}</span>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
            <span className="text-teal-400 text-[10px] block">TAKE PROFIT 2</span>
            <span className="text-teal-300 font-bold text-sm">${tp2}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
          <span>🎯 R:R = <strong className="text-white">{rr}</strong></span>
          <span className="text-sky-400 font-bold">✈️ @ElifTrading</span>
        </div>
      </div>
    </div>
  );
}

export default memo(SignalCardGenerator);
