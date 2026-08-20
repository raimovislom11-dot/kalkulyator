'use client';

import { useState, memo } from 'react';

interface StrategyDetail {
  id: string;
  name: string;
  category: 'SMC' | 'ICT' | 'Matematika' | 'Price Action';
  icon: string;
  summary: string;
  rules: string[];
  keyLevel: string;
}

const STRATEGIES_DATA: StrategyDetail[] = [
  {
    id: 'order_block',
    name: 'Order Block (OB Demand & Supply)',
    category: 'SMC',
    icon: '🧱',
    summary: 'Institutsional banklar va yirik o\'yinchilarning katta buyurtmalar qoldirgan oxirgi qarama-qarshi shami.',
    rules: [
      'Bullish OB: Kuchli yuqoriga impulsdan oldingi oxirgi qizil (ayiq) sham.',
      'Bearish OB: Kuchli pastga impulsdan oldingi oxirgi yashil (buqa) sham.',
      'Kirish: Narx ushbu zonaga qaytganda (retest) kam xatar bilan kiriladi.',
    ],
    keyLevel: 'Demand / Supply 50% Mean Threshold',
  },
  {
    id: 'fvg',
    name: 'Fair Value Gap (FVG 50% CE)',
    category: 'SMC',
    icon: '⚡',
    summary: '3 ta ketma-ket sham oralig\'idagi narx bo\'shlig\'i (Imbalance). Bozor ushbu bo\'shliqni to\'ldirish uchun albatta qaytadi.',
    rules: [
      '1-shamning yuqori soyasi va 3-shamning pastki soyasi orasidagi masofa.',
      '50% Consequent Encroachment (CE) — FVG ning o\'rta aniq muvozanat nuqtasi.',
    ],
    keyLevel: '50% CE Muvozanat Narxi',
  },
  {
    id: 'smt',
    name: 'SMT Divergence (DXY vs Gold)',
    category: 'ICT',
    icon: '⚡',
    summary: 'Oltin va Dollar indeksi (DXY) o\'rtasidagi yashirin nomutanosiblik. Institutsional tuzoqlarni (Fakeout) aniqlaydi.',
    rules: [
      'Agar DXY yangi Low qilsa-yu, Gold yangi High qilolmasa — bu soxta harakat va tez orada kuchli burilish bo\'ladi.',
    ],
    keyLevel: 'DXY / XAUUSD Swing High & Low',
  },
  {
    id: 'silver_bullet',
    name: 'ICT Silver Bullet (60m Window)',
    category: 'ICT',
    icon: '🎯',
    summary: 'Kun davomida eng yuqori ehtimolli 60 daqiqalik vaqt oynasi (London AM: 12-13 Uzb, NY AM: 19-20 Uzb).',
    rules: [
      'Aynan shu soat ichida hosil bo\'lgan 1m-5m FVG ga kiriladi.',
      'Nishon: +15 dan +30 pipgacha (5-10$ harakat) tezkor scalp.',
    ],
    keyLevel: 'Time-Based Session Window',
  },
  {
    id: 'judas_swing',
    name: 'ICT Judas Swing (Sessiya Tuzog\'i)',
    category: 'ICT',
    icon: '🪤',
    summary: 'London yoki NY ochilishining dastlabki 15-30 daqiqasida narxning avval yolg\'on tomonga sakrab likvidlik yig\'ishi.',
    rules: [
      'Osiyo likvidligini supuradi -> darhol teskari haqiqiy kunlik trendga uchadi.',
    ],
    keyLevel: 'Asian High/Low Sweeps',
  },
  {
    id: 'breaker_block',
    name: 'Breaker Block (BB & Mitigation)',
    category: 'SMC',
    icon: '🧱',
    summary: 'Buzib o\'tilgan Order Block qaytishida (Retest) juda mustahkam qarama-qarshi yangi kirish vazifasini bajaradi.',
    rules: [
      'Buzilgan Bullish OB -> Bearish Breaker ga aylanadi.',
      'Buzilgan Bearish OB -> Bullish Breaker ga aylanadi.',
    ],
    keyLevel: 'Breaker Retest Level',
  },
  {
    id: 'gann',
    name: 'Ganna Kvadrat 9 (Square of 9)',
    category: 'Matematika',
    icon: '✨',
    summary: 'W.D. Gann matematik kvadrat ildiz va burchak darajalari (90°, 180°, 270°, 360°).',
    rules: [
      'Ildiz narx + (Daraja / 180)^2 formulasi bilan eng aniq matematik tayanchlar hisoblanadi.',
    ],
    keyLevel: '90° / 180° / 360° Burchaklar',
  },
  {
    id: 'fib_ote',
    name: 'Fibonacci OTE (0.705 Sweet Spot)',
    category: 'SMC',
    icon: '📐',
    summary: 'Fibonacci 0.50 (Discount), 0.618 (Golden) va 0.705 (Optimal Trade Entry) kirish zonalari.',
    rules: [
      'Trend yo\'nalishida 0.705 darajaga qaytishda eng kam Stop Loss bilan kirish.',
    ],
    keyLevel: '0.705 OTE Sweet Spot',
  },
];

function StrategyEncyclopedia() {
  const [selectedId, setSelectedId] = useState<string>('order_block');
  const selected = STRATEGIES_DATA.find((s) => s.id === selectedId) || STRATEGIES_DATA[0];

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 mb-4 backdrop-blur-xl shadow-2xl space-y-4">
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <span className="text-2xl">📖</span>
        <div>
          <h3 className="text-white font-bold text-sm">18 TA STRATEGIYA ENSIKLOPEDIYASI & CHEATSHEET</h3>
          <p className="text-slate-400 text-xs mt-0.5">
            SMC, ICT, SMT, Ganna va Matematik strategiyalarning qoidalari va ishlash mexanizmi
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Navigation List */}
        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
          {STRATEGIES_DATA.map((item) => {
            const isAct = item.id === selectedId;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 ${
                  isAct
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20 scale-[1.02]'
                    : 'bg-slate-950/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span>{item.icon}</span>
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="text-[10px] opacity-75 font-mono">{item.category}</span>
              </button>
            );
          })}
        </div>

        {/* Strategy Details Box */}
        <div className="md:col-span-2 bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selected.icon}</span>
              <div>
                <h4 className="text-white font-bold text-sm">{selected.name}</h4>
                <span className="text-[10px] text-orange-400 font-mono font-bold">{selected.category} Strategiyasi</span>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 bg-orange-500/20 text-orange-300 rounded-full font-mono font-bold border border-orange-500/30">
              {selected.keyLevel}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            {selected.summary}
          </p>

          <div className="space-y-1.5">
            <div className="text-xs font-bold text-emerald-400">📋 Asosiy Savdo Qoidalari:</div>
            <ul className="space-y-1">
              {selected.rules.map((r, i) => (
                <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(StrategyEncyclopedia);
