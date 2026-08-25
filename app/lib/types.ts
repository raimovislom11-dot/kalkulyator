// ─── Trade Types ───────────────────────────────────────────────────────────
export type TradeDirection = 'BUY' | 'SELL';
export type TradeResult = 'WIN' | 'LOSS' | 'BREAKEVEN' | 'OPEN';
export type TradeStrategy =
  | 'Elif trading'
  | 'AB TRADE'
  | '2.6 STRATEGY'
  | 'SMART MONEY'
  | 'ORDER BLOCK'
  | 'IFVG'
  | 'SNR_ICT'
  | 'SMT'
  | 'OTHER';

export interface Trade {
  id: string;
  date: string;            // ISO string
  instrument: string;      // XAU/USD default
  strategy: TradeStrategy;
  timeframe: string;       // 1m, 5m, 15m, 1h, 4h, 1d
  direction: TradeDirection;
  entry: number;
  stopLoss: number;
  tp1: number;
  tp2?: number;
  tp3?: number;
  exitPrice?: number;
  result: TradeResult;
  pips?: number;           // actual pips gained/lost
  rrActual?: number;       // actual R:R achieved
  rrPlanned: number;       // planned R:R
  notes?: string;
  imageUrl?: string;
  tags?: string[];
  deposit?: number;        // deposit at time of trade
  riskPercent?: number;    // % risked
  profitUSD?: number;      // actual USD profit/loss
}

// ─── Analytics Types ────────────────────────────────────────────────────────
export interface AnalyticsData {
  totalTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  openTrades: number;
  winRate: number;
  averageRR: number;
  profitFactor: number;
  bestTrade: Trade | null;
  worstTrade: Trade | null;
  totalPips: number;
  totalProfitUSD: number;
  equityCurve: { time: string; value: number }[];
  byStrategy: Record<string, { wins: number; losses: number; total: number }>;
  byTimeframe: Record<string, { wins: number; losses: number; total: number }>;
  winStreak: number;
  lossStreak: number;
  currentStreak: number;
  currentStreakType: 'WIN' | 'LOSS' | 'NONE';
}

// ─── Chat Types ─────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  images?: string[];     // base64 for display
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// ─── Note Types ─────────────────────────────────────────────────────────────
export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  mood?: 'great' | 'good' | 'neutral' | 'bad' | 'terrible';
  session?: 'london' | 'new-york' | 'asian' | 'other';
}

// ─── Settings Types ──────────────────────────────────────────────────────────
export interface AdminSettings {
  deposit: number;
  riskPercentage: number;
  defaultInstrument: string;
  currency: 'USD' | 'EUR' | 'UZS';
  theme: 'dark' | 'darker';
  notifications: boolean;
  language: 'uz' | 'ru' | 'en';
}

export const DEFAULT_SETTINGS: AdminSettings = {
  deposit: 10000,
  riskPercentage: 1,
  defaultInstrument: 'XAU/USD',
  currency: 'USD',
  theme: 'dark',
  notifications: true,
  language: 'ru',
};

// ─── AI Signals & Learning Types ─────────────────────────────────────────────
export type AISignalOutcome = 'PENDING' | 'TP_HIT' | 'SL_HIT' | 'MISSED_LIMIT' | 'CANCELLED';

export type AISignalMistakeReason =
  | 'NO_SWEEP'          // Likvidlik olinmadi / supurilmadi
  | 'NEWS_VOLATILITY'   // Yangiliklar payti / Spred kengaydi
  | 'COUNTER_TREND'     // Katta TF trendiga qarshi kirildi
  | 'MISSED_FVG'        // FVG yoki Order Block ga yetmasdan qaytdi
  | 'EARLY_ENTRY'       // Tasdiq (Confirmation / CHoCH) olmasdan erta kirildi
  | 'SL_TOO_TIGHT'      // SL juda qisqa qo'yilgan
  | 'CHOPPY_MARKET'     // Sessiya yopilishida yoki noaniq konsolidatsiyada
  | 'OTHER';            // Boshqa sabab

export interface AISignal {
  id: string;
  createdAt: string;       // ISO string
  updatedAt: string;       // ISO string
  asset: string;           // e.g. "XAUUSD" or "Gold (XAUUSD)"
  symbol: string;          // e.g. "XAUUSD"
  timeframe: string;       // "1m", "5m", "15m", "1h", "4h"
  termMode: 'short' | 'long' | 'trap';
  strategy: string;        // "10 ta Elita SMC/ICT", "Judas Swing", "Scalp", etc.
  direction: 'BUY' | 'SELL' | 'WAIT';
  entry: string;
  sl: string;
  tp1: string;
  tp2?: string;
  tp3?: string;
  rr?: string;
  outcome: AISignalOutcome;
  outcomeDate?: string;
  mistakeReason?: AISignalMistakeReason;
  mistakeNote?: string;    // Foydalanuvchi yoki AI xulosa izohi
  aiLearnedLesson?: string; // AI ning keyingi tahlil uchun xulosasi
  fullAnalysisText?: string; // AI bergan to'liq tahlil matni
  createdBy?: string;
  source?: 'ai-analysis' | 'trap-hunter' | 'market-analysis' | 'manual';
}

export interface AISignalsStats {
  total: number;
  pending: number;
  tpHit: number;
  slHit: number;
  missed: number;
  cancelled: number;
  winRate: number; // percentage of closed decisive trades (TP / (TP + SL))
  accuracyRate: number; // percentage of all closed signals
}

