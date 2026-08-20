'use client';

import { useState, memo } from 'react';

function MetaTraderCommandGenerator() {
  const [symbol, setSymbol] = useState('XAUUSD');
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [lot, setLot] = useState('0.10');
  const [entry, setEntry] = useState('4492.50');
  const [sl, setSl] = useState('4490.50');
  const [tp, setTp] = useState('4497.50');
  const [copied, setCopied] = useState(false);

  const commandString = `/${orderType.toLowerCase()} ${symbol} lot=${lot} entry=${entry} sl=${sl} tp=${tp}`;
  const webhookJson = JSON.stringify(
    {
      action: orderType,
      symbol,
      volume: parseFloat(lot),
      price: parseFloat(entry),
      stoploss: parseFloat(sl),
      takeprofit: parseFloat(tp),
      comment: 'ElifTrading AI Signal',
    },
    null,
    2
  );

  const copyCommand = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 mb-4 backdrop-blur-xl shadow-2xl space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <div>
            <h3 className="text-white font-bold text-sm">METATRADER (MT4/MT5) & TELEGRAM BUYRUQLAR</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              1 bosishda MT4/MT5 EA botlar va Telegram botlar uchun tayyor buyruq sintaksisi
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Telegram Bot Command */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-sky-400 font-bold mb-2">
              <span>✈️ TELEGRAM BOT SINTAKSISI</span>
              <span className="text-[10px] text-slate-500 font-mono">Instant Command</span>
            </div>
            <p className="text-slate-400 text-[11px] mb-2">
              Telegram trading botlariga (masalan Cornix, Maestro, Unibot) to'g'ridan-to'g'ri yuborish uchun:
            </p>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-emerald-400 text-xs break-all">
              {commandString}
            </div>
          </div>

          <button
            onClick={() => copyCommand(commandString)}
            className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition-all active:scale-95"
          >
            {copied ? '✓ Nusxalandi!' : '📋 Telegram Buyrug\'ini Nusxalash'}
          </button>
        </div>

        {/* WebHook JSON */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-amber-400 font-bold mb-2">
              <span>🤖 MT4 / MT5 WEBHOOK JSON</span>
              <span className="text-[10px] text-slate-500 font-mono">Expert Advisor</span>
            </div>
            <pre className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-slate-300 text-[11px] overflow-x-auto">
              {webhookJson}
            </pre>
          </div>

          <button
            onClick={() => copyCommand(webhookJson)}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-all active:scale-95 border border-slate-700"
          >
            {copied ? '✓ Nusxalandi!' : '📋 JSON WebHook Nusxalash'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(MetaTraderCommandGenerator);
