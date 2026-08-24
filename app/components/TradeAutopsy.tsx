'use client';

import { useState, memo } from 'react';

interface AutopsyReport {
  mainMistake: string;
  mistakeCategory: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  score: number;
  explanation: string;
  radarSolution: string;
  correctiveAction: string;
}

function TradeAutopsy() {
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [entryPrice, setEntryPrice] = useState('4495.00');
  const [slPrice, setSlPrice] = useState('4493.00');
  const [timeEntered, setTimeEntered] = useState('19:15');
  const [mistakeType, setMistakeType] = useState<'NEWS' | 'HTF_COUNTER' | 'LATE_CHASE' | 'EQUAL_WEIGHT'>('NEWS');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<AutopsyReport | null>({
    mainMistake: 'High-Impact Yangilik (CPI) oldidan xavfli kirish',
    mistakeCategory: 'Iqtisodiy Taqvim & Spred Kengayishi',
    severity: 'CRITICAL',
    score: 88,
    explanation: 'Siz 19:15 da kirdingiz, lekin 19:30 da AQSH muhim CPI yangiligi bor edi. Spred 5x ga oshib, bozor DXY likvidligini olmasdan SL ni urib ketdi.',
    radarSolution: 'Confluence Radar "News Blackout Gatekeeper" qizil yangilikdan 15-30 daqiqa oldin barcha signallarni avtomatik bloklaydi.',
    correctiveAction: 'Qat\'iy qoida: Qizil yangilik vaqtida yangi pozitsiya ochmang!',
  });

  const runAutopsy = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      if (mistakeType === 'NEWS') {
        setReport({
          mainMistake: 'High-Impact Yangilik (CPI / NFP) oldidan xavfli kirish',
          mistakeCategory: 'Iqtisodiy Taqvim & Spred Kengayishi',
          severity: 'CRITICAL',
          score: 94,
          explanation: `Siz ${timeEntered} da ${tradeType} ochdingiz. Shu vaqtda e'lon qilingan yuqori ta'sirli makroiqtisodiy xabar narxning sun'iy tebranishiga va stop ovlanishiga olib kelgan.`,
          radarSolution: 'Confluence Radar "News Blackout Zone" orqali signal ishlab chiqarish avtomatik ravishda 0% ga tushiriladi.',
          correctiveAction: 'Yangiliklar taqvimida qizil hodisa belgilangan bo\'lsa, uning e\'lon qilinishidan kamida 20 daqiqa keyingina grafikni oching.',
        });
      } else if (mistakeType === 'HTF_COUNTER') {
        setReport({
          mainMistake: 'Katta Vaqt Oralig\'i (H4/H1 Trend)ga qarshi M1/M5 da kirish',
          mistakeCategory: 'HTF Market Structure & Order Flow',
          severity: 'HIGH',
          score: 91,
          explanation: `Siz ${entryPrice} da ${tradeType} ochgansiz, biroq H4 da umumiy Order Flow qarama-qarshi tomonda davom etayotgan edi. Kichik timeframelar faqat katta trendga tuzatish (retracement) bo'lgan.`,
          radarSolution: 'Confluence Radar "HTF Gatekeeper" H4 ga zid signallarni "Soxta shovqin" deb filtrlaydi.',
          correctiveAction: 'Faqat H4 va H1 dagi BOS/CHoCH yo\'nalishida kirishni rejalashtiring.',
        });
      } else if (mistakeType === 'LATE_CHASE') {
        setReport({
          mainMistake: 'Signal kechikishi (Lagging Candle Close) va FOMO bilan quvish',
          mistakeCategory: 'Latency & Kirish Nuqtasi Xatosi',
          severity: 'HIGH',
          score: 87,
          explanation: 'Sham yopilishini uzoq kutish oqibatida harakatning 60% qismi o\'tib ketganidan so\'ng pozitsiyaga kirilgan va yomon Risk/Reward hosil bo\'lgan.',
          radarSolution: 'Confluence Radar "⚡ Early Stream (0ms)" rejimi likvidlik olingan paytning o\'zidayoq erta ogohlantirish beradi.',
          correctiveAction: 'Kechikkan signallarni quvmang, doim FVG yoki Retest zonalaridan Limit order bilan kiring.',
        });
      } else {
        setReport({
          mainMistake: 'Past sifatli indikatorlar ko\'pchiligi tufayli soxta ishonch (Equal Vote Fallacy)',
          mistakeCategory: 'Vaznsiz Ensemble Xatosi',
          severity: 'HIGH',
          score: 89,
          explanation: 'Oddiy indikatorlar ko\'pchilik bo\'lib BUY ko\'rsatgani bilan, Smart Money (OB, SMT, Liquidity Sweep) qarshi turgan edi.',
          radarSolution: 'Confluence Radar "Weighted Ensemble" har bir strategiyaning tarixiy Win-Rate va Profit Factor ko\'rsatkichlarini inobatga oladi.',
          correctiveAction: 'Faqat A+ Smart Money strategiyalari tasdiqlagan vaznli signallarga ishoning.',
        });
      }
    }, 800);
  };

  return (
    <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-5 mb-4 backdrop-blur-2xl shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-rose-600 flex items-center justify-center text-xl shadow-lg shadow-orange-500/20">
          🧠
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-white font-black text-sm tracking-wide">
              AI POST-TRADE AUTOPSY (XATOLARNI RENTGEN QILISH)
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30">
              SMART DIAGNOSTICS
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-0.5">
            Zararga (SL) uchragan bitim tafsilotlarini kiriting va Confluence Radar filtrlari bilan xatolarni solishtiring
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Form Inputs */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2.5 text-xs font-mono">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTradeType('BUY')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                tradeType === 'BUY'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              🟢 BUY Bitimi
            </button>
            <button
              onClick={() => setTradeType('SELL')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                tradeType === 'SELL'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              🔴 SELL Bitimi
            </button>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Ehtimoliy Xato Turi (Scenario):</label>
            <select
              value={mistakeType}
              onChange={(e) => setMistakeType(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-bold"
            >
              <option value="NEWS">📰 CPI / NFP Yangilik oldidan kirish</option>
              <option value="HTF_COUNTER">🧭 H4/H1 Trendga qarshi pastki TF</option>
              <option value="LATE_CHASE">⏳ Signal kechikishi va FOMO quvish</option>
              <option value="EQUAL_WEIGHT">⚖️ Past sifatli indikatorlarga ishonish</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 block mb-1">Entry Narxi:</label>
              <input
                type="number"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Urgan SL:</label>
              <input
                type="number"
                value={slPrice}
                onChange={(e) => setSlPrice(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-rose-400 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Kirilgan Vaqt (Masalan 19:15):</label>
            <input
              type="text"
              value={timeEntered}
              onChange={(e) => setTimeEntered(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white"
            />
          </div>

          <button
            onClick={runAutopsy}
            disabled={isAnalyzing}
            className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition-all active:scale-95 text-xs font-mono"
          >
            {isAnalyzing ? 'Rentgen qilinmoqda...' : '🔍 Xatoni Rentgen Qilish'}
          </button>
        </div>

        {/* Diagnostic Report */}
        {report && (
          <div className="md:col-span-2 bg-slate-950/90 border border-slate-800 p-4 rounded-xl space-y-3 flex flex-col justify-between font-mono">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <span>🚨</span> ANIQLANGAN ASOSIY XATO:
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-500/30 font-bold">
                  {report.mistakeCategory}
                </span>
              </div>
              <h4 className="text-white font-black text-sm mb-1.5">{report.mainMistake}</h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                {report.explanation}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-cyan-950/40 border border-cyan-500/30 p-2.5 rounded-xl">
                <span className="text-cyan-400 font-bold block mb-0.5 flex items-center gap-1.5">
                  <span>🛡️</span> Radar Qanday Himoya Qilar Edi:
                </span>
                <span className="text-cyan-200 text-[11px]">{report.radarSolution}</span>
              </div>

              <div className="bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-xl">
                <span className="text-emerald-400 font-bold block mb-0.5 flex items-center gap-1.5">
                  <span>💡</span> Kelgusi Qat'iy Tavsiya:
                </span>
                <span className="text-emerald-200 text-[11px]">{report.correctiveAction}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(TradeAutopsy);
