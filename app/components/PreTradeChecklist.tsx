'use client';

import { useState, memo } from 'react';

interface ChecklistItem {
  id: string;
  label: string;
  category: 'Trend' | 'Likvidlik' | 'Zona' | 'Risk';
  icon: string;
  desc: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'htf_trend',
    label: 'Katta Vaqt Oralig\'i (H4/H1) Trendi Aniqlangan',
    category: 'Trend',
    icon: '📈',
    desc: 'H4 yoki H1 da bozor umumiy qayerga ketayotgani (Bullish/Bearish) aniqlandi.',
  },
  {
    id: 'liquidity_sweep',
    label: 'Likvidlik Supurildi (Liquidity Sweep / Judas)',
    category: 'Likvidlik',
    icon: '🎯',
    desc: 'Osiyo sessiyasi yoki oldingi High/Low likvidligi yig\'ib olindi.',
  },
  {
    id: 'fvg_ob_zone',
    label: 'Aniq Kirish Zonasi (Order Block / 1-5m FVG)',
    category: 'Zona',
    icon: '🧱',
    desc: 'Narx aynan biz kutgan sifatli Demand/Supply yoki FVG ga kirdi.',
  },
  {
    id: 'smt_divergence',
    label: 'SMT yoki Strukturaviy Tasdiq (CHoCH/BOS)',
    category: 'Trend',
    icon: '⚡',
    desc: 'Kichik 1m/5m da struktura o\'zgardi yoki DXY bilan korrelyatsiya tasdiqlandi.',
  },
  {
    id: 'risk_percent',
    label: 'Xatar 1-2% dan Oshmaydi (Qat\'iy Stop Loss)',
    category: 'Risk',
    icon: '🛡️',
    desc: 'Ushbu bitta bitimda depozitning 1-2% dan ortig\'i xatarga qo\'yilmagan.',
  },
  {
    id: 'emotional_calm',
    label: 'Ruhiy Holat Xotirjam (Revenge / FOMO Yo\'q)',
    category: 'Risk',
    icon: '🧘',
    desc: 'Oldingi zararni qoplash (Revenge) yoki kechikib qolish qo\'rquvi (FOMO) yo\'q.',
  },
];

function PreTradeChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const total = CHECKLIST_ITEMS.length;
  const passed = Object.values(checked).filter(Boolean).length;
  const scorePercent = Math.round((passed / total) * 100);
  const isReady = passed === total;

  const resetAll = () => setChecked({});

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 mb-4 backdrop-blur-xl shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📝</span>
          <div>
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <span>PRE-TRADE INTIZOM CHECKLISTI</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                isReady ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {passed}/{total} Tasdiqlandi ({scorePercent}%)
              </span>
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Bitim ochishdan oldin 6 ta qoidani tekshirib, xatolardan saqlaning
            </p>
          </div>
        </div>

        <button
          onClick={resetAll}
          className="text-xs text-slate-400 hover:text-white px-2.5 py-1 bg-slate-800 rounded-lg hover:bg-slate-700 transition-all"
        >
          🔄 Qayta tozalash
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isReady
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
              : scorePercent > 50
              ? 'bg-gradient-to-r from-amber-500 to-orange-500'
              : 'bg-gradient-to-r from-rose-500 to-amber-500'
          }`}
          style={{ width: `${scorePercent}%` }}
        />
      </div>

      {/* Items List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {CHECKLIST_ITEMS.map((item) => {
          const isChecked = !!checked[item.id];
          return (
            <div
              key={item.id}
              onClick={() => toggle(item.id)}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                isChecked
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100 shadow-md shadow-emerald-500/10 scale-[1.01]'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => {}}
                className="mt-1 w-4 h-4 rounded text-emerald-500 focus:ring-0 cursor-pointer accent-emerald-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <span>{item.icon}</span>
                  <span className={isChecked ? 'text-emerald-300' : 'text-slate-200'}>{item.label}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Banner */}
      <div className={`p-3 rounded-xl border text-center transition-all ${
        isReady
          ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/20 animate-pulse'
          : 'bg-slate-950/80 border-slate-800 text-slate-400'
      }`}>
        {isReady ? (
          <div className="font-bold text-sm flex items-center justify-center gap-2">
            <span>✅</span>
            <span>Barcha qoidalar tasdiqlandi! Yuqori ehtimolli xavfsiz savdoga ruxsat berildi.</span>
          </div>
        ) : (
          <div className="text-xs">
            ⚠️ Barcha 6 ta qoidani tasdiqlang. Shoshilmang, sabrli treyder doim yutadi!
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(PreTradeChecklist);
