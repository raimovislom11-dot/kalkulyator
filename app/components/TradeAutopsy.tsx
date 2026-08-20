'use client';

import { useState, memo } from 'react';

function TradeAutopsy() {
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [entryPrice, setEntryPrice] = useState('4495.00');
  const [slPrice, setSlPrice] = useState('4493.00');
  const [timeEntered, setTimeEntered] = useState('19:15');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<{
    mainMistake: string;
    mistakeCategory: string;
    score: number;
    explanation: string;
    correctiveAction: string;
  } | null>({
    mainMistake: 'Yangilik (High Impact News) oldidan ertaroq kirish',
    mistakeCategory: 'Vaqt & Iqtisodiy Taqvim Xatosi',
    score: 85,
    explanation: 'Siz 19:15 da kirdingiz, lekin 19:30 da AQSH muhim CPI yangiligi bor edi. Bozor yangilik oldidan DXY likvidligini to\'liq olmagan edi va katta spred bilan SL urib ketdi.',
    correctiveAction: 'Qat\'iy qoida: Qizil yangilikdan 15 daqiqa oldin va keyin savdoga kirmang!',
  });

  const runAutopsy = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setReport({
        mainMistake: 'HTF Trendga qarshi va Likvidlik olinmasdan kirilgan',
        mistakeCategory: 'SMC Struktura Xatosi',
        score: 92,
        explanation: `Siz ${entryPrice} da ${tradeType} ochdingiz. Lekin H4 va H1 da asosiy oqim qarama-qarshi tomonda edi va Osiyo likvidligi hali olinmagan edi. Narx faqat sizning SL (${slPrice}) ni yig'ish uchun pastga tushdi.`,
        correctiveAction: 'Keyingi safar faqat H4 bilan bir tomonda va kamida 1 ta likvidlik supurilgandan so\'ng 1m FVG ga kiring!',
      });
    }, 1000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 mb-4 backdrop-blur-xl shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <span className="text-2xl">🧠</span>
        <div>
          <h3 className="text-white font-bold text-sm">AI POST-TRADE AUTOPSY (XATOLARNI RENTGEN QILISH)</h3>
          <p className="text-slate-400 text-xs mt-0.5">
            Zararga (SL) uchragan bitim tafsilotlarini kiriting va AI xatolaringizni aniqlab bersin
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Form Inputs */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2.5 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTradeType('BUY')}
              className={`flex-1 py-1.5 rounded-lg font-bold ${
                tradeType === 'BUY' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              BUY Bitimi
            </button>
            <button
              onClick={() => setTradeType('SELL')}
              className={`flex-1 py-1.5 rounded-lg font-bold ${
                tradeType === 'SELL' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              SELL Bitimi
            </button>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Kirish Narxi (Entry):</label>
            <input
              type="number"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Urgan Stop Loss (SL):</label>
            <input
              type="number"
              value={slPrice}
              onChange={(e) => setSlPrice(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-red-400 font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Kirilgan Vaqt (Masalan 19:15):</label>
            <input
              type="text"
              value={timeEntered}
              onChange={(e) => setTimeEntered(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-mono"
            />
          </div>

          <button
            onClick={runAutopsy}
            disabled={isAnalyzing}
            className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition-all active:scale-95"
          >
            {isAnalyzing ? 'Rentgen qilinmoqda...' : '🔍 Xatoni Rentgen Qilish'}
          </button>
        </div>

        {/* Diagnostic Report */}
        {report && (
          <div className="md:col-span-2 bg-slate-950/90 border border-slate-800 p-4 rounded-xl space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <span>🚨</span> ASOSIY ANIQLANGAN XATO:
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 font-mono border border-rose-500/30 font-bold">
                  {report.mistakeCategory}
                </span>
              </div>
              <h4 className="text-white font-bold text-sm mb-1.5">{report.mainMistake}</h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                {report.explanation}
              </p>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-xl text-xs">
              <span className="text-emerald-400 font-bold block mb-0.5">💡 Kelgusi Qat'iy Tavsiya:</span>
              <span className="text-emerald-200">{report.correctiveAction}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(TradeAutopsy);
