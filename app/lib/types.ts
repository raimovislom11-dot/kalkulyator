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
