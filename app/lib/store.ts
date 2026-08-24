import type {
  Trade,
  ChatSession,
  Note,
  AdminSettings,
  AnalyticsData,
} from './types';
import { DEFAULT_SETTINGS } from './types';
import { tradesApi, notesApi, settingsApi } from './api';

// ─── Keys ────────────────────────────────────────────────────────────────────
const KEYS = {
  TRADES: 'xau_admin_trades',
  CHAT_SESSIONS: 'xau_admin_chat_sessions',
  ACTIVE_SESSION: 'xau_admin_active_session',
  NOTES: 'xau_admin_notes',
  SETTINGS: 'xau_admin_settings',
} as const;

// ─── Generic helpers ─────────────────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    console.warn('localStorage save failed:', key);
  }
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Trades Store ────────────────────────────────────────────────────────────
export const tradesStore = {
  getAll(): Trade[] {
    return load<Trade[]>(KEYS.TRADES, []);
  },

  add(trade: Omit<Trade, 'id'>): Trade {
    const newTrade: Trade = { ...trade, id: genId() };
    const trades = this.getAll();
    save(KEYS.TRADES, [newTrade, ...trades]);

    // Asynchronously sync with Backend API
    tradesApi.create(trade).then((res) => {
      if (res && res.id) {
        const current = this.getAll();
        const item = current.find(t => t.id === newTrade.id);
        if (item) {
          item.id = String(res.id);
          save(KEYS.TRADES, current);
        }
      }
    }).catch(() => {});

    return newTrade;
  },

  update(id: string, patch: Partial<Trade>): Trade | null {
    const trades = this.getAll();
    const idx = trades.findIndex(t => t.id === id);
    if (idx === -1) return null;
    trades[idx] = { ...trades[idx], ...patch };
    save(KEYS.TRADES, trades);

    // Sync with Backend
    tradesApi.update(id, patch).catch(() => {});

    return trades[idx];
  },

  remove(id: string): void {
    const trades = this.getAll().filter(t => t.id !== id);
    save(KEYS.TRADES, trades);

    // Sync with Backend
    tradesApi.delete(id).catch(() => {});
  },

  clear(): void {
    save(KEYS.TRADES, []);
    tradesApi.clearAll().catch(() => {});
  },
};

// ─── Chat Store ──────────────────────────────────────────────────────────────
export const chatStore = {
  getSessions(): ChatSession[] {
    return load<ChatSession[]>(KEYS.CHAT_SESSIONS, []);
  },

  getSession(id: string): ChatSession | null {
    return this.getSessions().find(s => s.id === id) ?? null;
  },

  getActiveSessionId(): string | null {
    return load<string | null>(KEYS.ACTIVE_SESSION, null);
  },

  setActiveSession(id: string): void {
    save(KEYS.ACTIVE_SESSION, id);
  },

  createSession(title?: string): ChatSession {
    const session: ChatSession = {
      id: genId(),
      title: title ?? `Сессия ${new Date().toLocaleDateString('ru-RU')}`,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const sessions = this.getSessions();
    save(KEYS.CHAT_SESSIONS, [session, ...sessions]);
    save(KEYS.ACTIVE_SESSION, session.id);
    return session;
  },

  addMessage(
    sessionId: string,
    message: Omit<ChatSession['messages'][number], 'id' | 'timestamp'>
  ): void {
    const sessions = this.getSessions();
    const idx = sessions.findIndex(s => s.id === sessionId);
    if (idx === -1) return;
    const msg = {
      ...message,
      id: genId(),
      timestamp: new Date().toISOString(),
    };
    sessions[idx].messages.push(msg);
    sessions[idx].updatedAt = new Date().toISOString();
    if (sessions[idx].messages.length === 2 && sessions[idx].title.startsWith('Сессия')) {
      const firstUser = sessions[idx].messages.find(m => m.role === 'user');
      if (firstUser) {
        sessions[idx].title = firstUser.content.slice(0, 40) + (firstUser.content.length > 40 ? '...' : '');
      }
    }
    save(KEYS.CHAT_SESSIONS, sessions);
  },

  deleteSession(id: string): void {
    const sessions = this.getSessions().filter(s => s.id !== id);
    save(KEYS.CHAT_SESSIONS, sessions);
    if (load<string | null>(KEYS.ACTIVE_SESSION, null) === id) {
      save(KEYS.ACTIVE_SESSION, sessions[0]?.id ?? null);
    }
  },

  clearAll(): void {
    save(KEYS.CHAT_SESSIONS, []);
    save(KEYS.ACTIVE_SESSION, null);
  },
};

// ─── Notes Store ─────────────────────────────────────────────────────────────
export const notesStore = {
  getAll(): Note[] {
    return load<Note[]>(KEYS.NOTES, []);
  },

  add(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note {
    const now = new Date().toISOString();
    const newNote: Note = { ...note, id: genId(), createdAt: now, updatedAt: now };
    const notes = this.getAll();
    save(KEYS.NOTES, [newNote, ...notes]);

    // Sync with backend
    notesApi.create(note).then(res => {
      if (res && res.id) {
        const cur = this.getAll();
        const item = cur.find(n => n.id === newNote.id);
        if (item) {
          item.id = String(res.id);
          save(KEYS.NOTES, cur);
        }
      }
    }).catch(() => {});

    return newNote;
  },

  update(id: string, patch: Partial<Note>): Note | null {
    const notes = this.getAll();
    const idx = notes.findIndex(n => n.id === id);
    if (idx === -1) return null;
    notes[idx] = { ...notes[idx], ...patch, updatedAt: new Date().toISOString() };
    save(KEYS.NOTES, notes);

    notesApi.update(id, patch).catch(() => {});

    return notes[idx];
  },

  remove(id: string): void {
    save(KEYS.NOTES, this.getAll().filter(n => n.id !== id));
    notesApi.delete(id).catch(() => {});
  },
};

// ─── Settings Store ──────────────────────────────────────────────────────────
export const settingsStore = {
  get(): AdminSettings {
    return load<AdminSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
  },

  update(patch: Partial<AdminSettings>): AdminSettings {
    const current = this.get();
    const updated = { ...current, ...patch };
    save(KEYS.SETTINGS, updated);

    settingsApi.update(patch).catch(() => {});

    return updated;
  },

  reset(): AdminSettings {
    save(KEYS.SETTINGS, DEFAULT_SETTINGS);
    settingsApi.reset().catch(() => {});
    return DEFAULT_SETTINGS;
  },
};

// ─── Analytics Calculator ────────────────────────────────────────────────────
export function computeAnalytics(trades: Trade[], initialDeposit = 10000): AnalyticsData {
  const closed = trades.filter(t => t.result !== 'OPEN');
  const wins = closed.filter(t => t.result === 'WIN');
  const losses = closed.filter(t => t.result === 'LOSS');
  const breakevens = closed.filter(t => t.result === 'BREAKEVEN');
  const open = trades.filter(t => t.result === 'OPEN');

  const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;

  const avgRR =
    wins.length > 0
      ? wins.reduce((s, t) => s + (t.rrActual ?? t.rrPlanned), 0) / wins.length
      : 0;

  const grossProfit = wins.reduce((s, t) => s + Math.abs(t.profitUSD ?? 0), 0);
  const grossLoss = losses.reduce((s, t) => s + Math.abs(t.profitUSD ?? 0), 0);
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  const totalPips = closed.reduce((s, t) => s + (t.pips ?? 0), 0);
  const totalProfitUSD = closed.reduce((s, t) => s + (t.profitUSD ?? 0), 0);

  const bestTrade =
    wins.length > 0
      ? wins.reduce((best, t) => ((t.profitUSD ?? 0) > (best.profitUSD ?? 0) ? t : best), wins[0])
      : null;
  const worstTrade =
    losses.length > 0
      ? losses.reduce(
          (worst, t) => ((t.profitUSD ?? 0) < (worst.profitUSD ?? 0) ? t : worst),
          losses[0]
        )
      : null;

  // Equity curve — sorted by date
  const sortedClosed = [...closed].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  let equity = initialDeposit;
  const equityCurve: { time: string; value: number }[] = [
    { time: sortedClosed[0]?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10), value: initialDeposit },
  ];
  for (const t of sortedClosed) {
    equity += t.profitUSD ?? 0;
    equityCurve.push({ time: t.date.slice(0, 10), value: Math.round(equity * 100) / 100 });
  }

  // By strategy
  const byStrategy: AnalyticsData['byStrategy'] = {};
  for (const t of closed) {
    if (!byStrategy[t.strategy]) byStrategy[t.strategy] = { wins: 0, losses: 0, total: 0 };
    byStrategy[t.strategy].total++;
    if (t.result === 'WIN') byStrategy[t.strategy].wins++;
    else if (t.result === 'LOSS') byStrategy[t.strategy].losses++;
  }

  // By timeframe
  const byTimeframe: AnalyticsData['byTimeframe'] = {};
  for (const t of closed) {
    if (!byTimeframe[t.timeframe]) byTimeframe[t.timeframe] = { wins: 0, losses: 0, total: 0 };
    byTimeframe[t.timeframe].total++;
    if (t.result === 'WIN') byTimeframe[t.timeframe].wins++;
    else if (t.result === 'LOSS') byTimeframe[t.timeframe].losses++;
  }

  // Streak
  let winStreak = 0, lossStreak = 0, currentStreak = 0;
  let currentStreakType: AnalyticsData['currentStreakType'] = 'NONE';
  let tempStreak = 0;
  let tempType: TradeResult | null = null;
  for (const t of sortedClosed) {
    if (t.result === tempType) {
      tempStreak++;
    } else {
      tempStreak = 1;
      tempType = t.result;
    }
    if (t.result === 'WIN') winStreak = Math.max(winStreak, tempStreak);
    if (t.result === 'LOSS') lossStreak = Math.max(lossStreak, tempStreak);
  }
  if (sortedClosed.length > 0) {
    const lastResult = sortedClosed[sortedClosed.length - 1].result;
    currentStreakType = lastResult === 'WIN' ? 'WIN' : lastResult === 'LOSS' ? 'LOSS' : 'NONE';
    currentStreak = tempType === lastResult ? tempStreak : 1;
  }

  return {
    totalTrades: trades.length,
    wins: wins.length,
    losses: losses.length,
    breakevens: breakevens.length,
    openTrades: open.length,
    winRate,
    averageRR: Math.round(avgRR * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    bestTrade,
    worstTrade,
    totalPips,
    totalProfitUSD: Math.round(totalProfitUSD * 100) / 100,
    equityCurve,
    byStrategy,
    byTimeframe,
    winStreak,
    lossStreak,
    currentStreak,
    currentStreakType,
  };
}

type TradeResult = 'WIN' | 'LOSS' | 'BREAKEVEN' | 'OPEN';
