import type {
  AISignal,
  AISignalOutcome,
  AISignalMistakeReason,
  AISignalsStats,
} from './types';

const STORAGE_KEY = 'xau_ai_signals_store';

export const MISTAKE_REASON_LABELS: Record<AISignalMistakeReason, string> = {
  NO_SWEEP: "Likvidlik supurilmadi (Soxta buzilish)",
  NEWS_VOLATILITY: "Yangiliklar vaqtidagi kuchli tebranish / Spred",
  COUNTER_TREND: "Katta vaqt oralig'i (HTF) trendiga qarshi kirildi",
  MISSED_FVG: "FVG / Order Block darajasiga yetmasdan qaytdi",
  EARLY_ENTRY: "Tasdiq (CHoCH / MSS) olmasdan erta kirildi",
  SL_TOO_TIGHT: "Stop Loss xavfsiz zonadan tashqarida (juda qisqa)",
  CHOPPY_MARKET: "Sessiya yopilishi yoki yo'nalishsiz konsolidatsiya",
  OTHER: "Boshqa texnik / bozor sababi",
};

export const MISTAKE_AI_LESSONS: Record<AISignalMistakeReason, string> = {
  NO_SWEEP: "Likvidlik (High/Low) to'liq olinmaguncha va rad etish (rejection) shamchasi ko'rinmaguncha kirish tavsiya qilinmaydi. Shoshilmang.",
  NEWS_VOLATILITY: "Muhim iqtisodiy yangiliklar (CPI, NFP, FOMC) vaqtida yoki unga 15 daqiqa qolganda kirishdan saqlaning yoki SL masofasini kengaytiring.",
  COUNTER_TREND: "1H va 4H vaqt oraliqlaridagi asosiy bozor strukturasiga (Order Flow) qarshi signal bermang.",
  MISSED_FVG: "Limit buyurtma narxini FVG ning 50% muvozanat darajasiga (Consequent Encroachment) yaqinroq qo'ying.",
  EARLY_ENTRY: "Kichik vaqt oralig'ida (1m/5m) struktura sinishi (CHoCH) va FVG hosil bo'lishini kuting.",
  SL_TOO_TIGHT: "Stop Loss ni eng so'nggi struktura nuqtasi (Swing High/Low) ortiga, spred buferini hisobga olgan holda xavfsiz joylashtiring.",
  CHOPPY_MARKET: "Konsolidatsiya zonasining o'rtasida emas, faqat uning chegaralaridagi likvidlik olingandan keyin pozitsiya oching.",
  OTHER: "Kirish va Stop Loss nuqtalarini yuqori ehtimolli SMC/ICT qoidalariga qat'iy muvofiqlashtiring.",
};

function loadSignals(): AISignal[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSignals(signals: AISignal[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(signals));
    window.dispatchEvent(new CustomEvent('signals_updated', { detail: signals }));
  } catch (err) {
    console.warn('AISignals localStorage save failed:', err);
  }
}

function genSignalId(): string {
  return `sig_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export const signalsStore = {
  getAll(): AISignal[] {
    return loadSignals();
  },

  async fetchRemote(): Promise<AISignal[]> {
    try {
      const res = await fetch('/api/signals');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Merge local and remote
          const local = loadSignals();
          const map = new Map<string, AISignal>();
          local.forEach(s => map.set(s.id, s));
          data.forEach(s => map.set(s.id, s));
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          saveSignals(merged);
          return merged;
        }
      }
    } catch {
      // ignore
    }
    return loadSignals();
  },

  add(signal: Omit<AISignal, 'id' | 'createdAt' | 'updatedAt'>): AISignal {
    const now = new Date().toISOString();
    const newSignal: AISignal = {
      ...signal,
      id: genSignalId(),
      createdAt: now,
      updatedAt: now,
    };
    const list = loadSignals();
    const updated = [newSignal, ...list];
    saveSignals(updated);

    // Sync to backend asynchronously
    fetch('/api/signals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSignal),
    }).catch(() => {});

    return newSignal;
  },

  updateOutcome(
    id: string,
    outcome: AISignalOutcome,
    mistakeReason?: AISignalMistakeReason,
    mistakeNote?: string
  ): AISignal | null {
    const list = loadSignals();
    const idx = list.findIndex(s => s.id === id);
    if (idx === -1) return null;

    const now = new Date().toISOString();
    const aiLesson = mistakeReason ? MISTAKE_AI_LESSONS[mistakeReason] : undefined;

    list[idx] = {
      ...list[idx],
      outcome,
      outcomeDate: now,
      updatedAt: now,
      mistakeReason: mistakeReason || list[idx].mistakeReason,
      mistakeNote: mistakeNote !== undefined ? mistakeNote : list[idx].mistakeNote,
      aiLearnedLesson: aiLesson || list[idx].aiLearnedLesson,
    };

    saveSignals(list);

    // Sync to backend
    fetch('/api/signals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(list[idx]),
    }).catch(() => {});

    return list[idx];
  },

  remove(id: string): void {
    const list = loadSignals().filter(s => s.id !== id);
    saveSignals(list);

    fetch(`/api/signals?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch(() => {});
  },

  clear(): void {
    saveSignals([]);
    fetch('/api/signals?clear=true', { method: 'DELETE' }).catch(() => {});
  },

  computeStats(signals: AISignal[]): AISignalsStats {
    const total = signals.length;
    const pending = signals.filter(s => s.outcome === 'PENDING').length;
    const tpHit = signals.filter(s => s.outcome === 'TP_HIT').length;
    const slHit = signals.filter(s => s.outcome === 'SL_HIT').length;
    const missed = signals.filter(s => s.outcome === 'MISSED_LIMIT').length;
    const cancelled = signals.filter(s => s.outcome === 'CANCELLED').length;

    const decisive = tpHit + slHit;
    const winRate = decisive > 0 ? Math.round((tpHit / decisive) * 100) : 0;
    const closed = total - pending;
    const accuracyRate = closed > 0 ? Math.round((tpHit / closed) * 100) : 0;

    return {
      total,
      pending,
      tpHit,
      slHit,
      missed,
      cancelled,
      winRate,
      accuracyRate,
    };
  },

  /**
   * Generates a context block to inject into AI prompt so Claude learns from past mistakes!
   */
  buildAILearningPrompt(signals: AISignal[], targetSymbol?: string): string {
    if (!signals || signals.length === 0) {
      return '';
    }

    const stats = this.computeStats(signals);
    const relevant = targetSymbol
      ? signals.filter(s => !s.symbol || s.symbol.toUpperCase() === targetSymbol.toUpperCase())
      : signals;

    const losses = relevant
      .filter(s => s.outcome === 'SL_HIT' || s.outcome === 'MISSED_LIMIT')
      .slice(0, 5);

    const wins = relevant.filter(s => s.outcome === 'TP_HIT').slice(0, 3);

    let prompt = `\n═══════════════════════════════════════════════════════════\n`;
    prompt += `🧠 AI XOTIRASI VA OLDINGI SIGNALLARDAN SABOQLAR (SELF-LEARNING):\n`;
    prompt += `Statistika: Jami ${stats.total} ta signal saqlangan (TP: ${stats.tpHit}, SL: ${stats.slHit}, Limitga bormagan: ${stats.missed}, Win Rate: ${stats.winRate}%).\n`;

    if (losses.length > 0) {
      prompt += `\n⚠️ OLDINGI XATOLAR VA SL SABABLARI (BULARNI TAKRORLAMANG!):\n`;
      losses.forEach((sig, i) => {
        const reasonText = sig.mistakeReason ? MISTAKE_REASON_LABELS[sig.mistakeReason] : (sig.mistakeNote || 'Noma\'lum xato');
        const lesson = sig.aiLearnedLesson ? ` | Xulosa: ${sig.aiLearnedLesson}` : '';
        const outcomeLabel = sig.outcome === 'SL_HIT' ? 'SL Bo\'lgan' : 'Limitga Bormagan';
        prompt += `${i + 1}. [${sig.asset || sig.symbol} ${sig.direction} @ ${sig.entry} (${outcomeLabel})] -> Xato sababi: ${reasonText}${lesson}\n`;
      });
      prompt += `\n🎯 AI UCHUN QAT'IY KO'RSATMA:
1. Yuqoridagi xatolardan saboq oling: agar bozor likvidligi (Asian/London High/Low) to'liq supurilmagan bo'lsa yoki tasdiqlovchi rad etish shamchasi (Rejection Candle) bo'lmasa, erta kirish bermang!
2. Agar narx noaniq bo'lsa yoki konsolidatsiya bo'lsa, xavfli signal o'rniga "KUTISH (NO TRADE)" buyrug'ini bering.
3. Stop Loss darajasini likvidlik zonasi ortiga xavfsiz qo'ying va Entry darajasini aniq FVG/OB ga moslang.\n`;
    }

    if (wins.length > 0) {
      prompt += `\n✅ MUVAFFAQIYATLI O'XSHAGAN MODEL VA PATTERNLAR:\n`;
      wins.forEach((sig, i) => {
        prompt += `• [${sig.asset || sig.symbol} ${sig.direction} @ ${sig.entry} -> TP Oldi]: ${sig.strategy || 'SMC/ICT'}\n`;
      });
    }

    prompt += `═══════════════════════════════════════════════════════════\n`;
    return prompt;
  },
};
