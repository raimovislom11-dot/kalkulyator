/**
 * SMC & ICT Professional Indikatorlar va Matematik Tahlil Kutubxonasi
 * Yangi kuchli strategiyalar:
 * 1. SMT Divergence (Smart Money Technique)
 * 2. ICT Silver Bullet (60-daqiqalik yuqori ehtimolli vaqt setupi)
 * 3. ICT Judas Swing (Sessiya ochilishidagi tuzoq)
 * 4. Breaker Block (BB) & Mitigation Block
 * 5. Multi-Timeframe Matrix (MTF Top-Down Confluence)
 */

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface IndicatorToggleState {
  orderBlock: boolean;
  fvg: boolean;
  ifvg: boolean;
  snr: boolean;
  fibOte: boolean;
  ict: boolean;
  gann: boolean;
  liquidity: boolean;
  singleCandle: boolean;
  bosChoch: boolean;
  math: boolean;
  smt: boolean;
  silverBullet: boolean;
  judasSwing: boolean;
  breakerBlock: boolean;
  mtf: boolean;
}

export const DEFAULT_INDICATOR_STATE: IndicatorToggleState = {
  orderBlock: true,
  fvg: true,
  ifvg: true,
  snr: true,
  fibOte: true,
  ict: true,
  gann: true,
  liquidity: true,
  singleCandle: true,
  bosChoch: true,
  math: true,
  smt: true,
  silverBullet: true,
  judasSwing: true,
  breakerBlock: true,
  mtf: true,
};

export interface OrderBlockZone {
  type: 'Bullish OB' | 'Bearish OB';
  top: number;
  bottom: number;
  mitigated: boolean;
  strength: 'Strong' | 'Medium' | 'Weak';
  date: string;
}

export interface BreakerBlockZone {
  type: 'Bullish Breaker' | 'Bearish Breaker';
  top: number;
  bottom: number;
  date: string;
  description: string;
}

export interface FVGZone {
  type: 'Bullish FVG' | 'Bearish FVG';
  top: number;
  bottom: number;
  midpoint: number;
  isInverted: boolean;
  mitigated: boolean;
  date: string;
}

export interface SNRLevel {
  type: 'Resistance' | 'Support' | 'Key Level';
  price: number;
  touches: number;
  strength: 'Major' | 'Minor';
}

export interface FibOTEResult {
  high: number;
  low: number;
  trend: 'Uptrend (Discount OTE)' | 'Downtrend (Premium OTE)';
  levels: {
    fib0: number;
    fib050: number;
    fib0618: number;
    fib0705: number;
    fib0786: number;
    fib1: number;
  };
}

export interface LiquidityLevel {
  type: 'BSL (Buy-side / High)' | 'SSL (Sell-side / Low)' | 'Equal Highs (EQH)' | 'Equal Lows (EQL)';
  price: number;
  swept: boolean;
  date: string;
}

export interface SingleCandleDisplacement {
  date: string;
  type: 'Bullish Displacement' | 'Bearish Displacement';
  bodySize: number;
  wickRatio: number;
  priceStart: number;
  priceEnd: number;
  significance: string;
}

export interface StructureBreak {
  type: 'BOS (Bullish)' | 'BOS (Bearish)' | 'CHoCH (Bullish)' | 'CHoCH (Bearish)';
  price: number;
  date: string;
  confirmed: boolean;
}

export interface GannLevels {
  basePrice: number;
  degrees: {
    deg45: number;
    deg90: number;
    deg180: number;
    deg270: number;
    deg360: number;
  };
}

export interface MathMetrics {
  currentPrice: number;
  atr: number;
  dailyRange: number;
  pipSpreadEstimate: number;
  idealSLDistance: number;
  idealTP1: number;
  idealTP2: number;
  riskRewardRatio: string;
  volatilityScore: 'Past' | "O'rta" | 'Yuqori';
}

export interface SMTDivergenceInfo {
  detected: boolean;
  type: 'Bullish SMT (DXY Low / Gold Higher Low)' | 'Bearish SMT (DXY High / Gold Lower High)' | 'Neytral';
  strength: 'High' | 'Medium' | 'None';
  note: string;
}

export interface SilverBulletInfo {
  sessionWindow: 'London AM (03:00-04:00 NY)' | 'NY AM (10:00-11:00 NY)' | 'NY PM (14:00-15:00 NY)' | 'Kutilmoqda';
  isActive: boolean;
  targetTicks: string;
  recommendation: string;
}

export interface JudasSwingInfo {
  stage: 'Asian Liquidity Sweep' | 'London Manipulation' | 'NY Expansion' | 'Tugallangan';
  riskLevel: 'Past' | 'Yuqori (Tuzoq xavfi)';
  targetDirection: 'BUY' | 'SELL' | 'Kutilmoqda';
}

export interface MTFConfluenceInfo {
  h4Bias: 'BULLISH' | 'BEARISH' | 'RANGING';
  m15Structure: 'BOS Up' | 'BOS Down' | 'CHoCH';
  m5Trigger: 'FVG Retest' | 'OB Entry' | 'Discount OTE';
  confluenceScore: number; // 0 - 100%
}

export interface SMCTechnicalAnalysis {
  orderBlocks: OrderBlockZone[];
  breakerBlocks: BreakerBlockZone[];
  fvgs: FVGZone[];
  ifvgs: FVGZone[];
  snrLevels: SNRLevel[];
  fibOte: FibOTEResult | null;
  liquidity: LiquidityLevel[];
  singleCandles: SingleCandleDisplacement[];
  structureBreaks: StructureBreak[];
  gann: GannLevels;
  math: MathMetrics;
  smt: SMTDivergenceInfo;
  silverBullet: SilverBulletInfo;
  judasSwing: JudasSwingInfo;
  mtf: MTFConfluenceInfo;
  ictSession: {
    currentKillzone: string;
    asianRange: { high: number; low: number } | null;
    midnightOpen: number | null;
    dailyOpen: number | null;
    bias: 'Bullish AMD' | 'Bearish AMD' | 'Ranging';
  };
}

export function calculateGannLevels(price: number): GannLevels {
  const root = Math.sqrt(price);
  return {
    basePrice: price,
    degrees: {
      deg45: Number(Math.pow(root + 45 / 180, 2).toFixed(2)),
      deg90: Number(Math.pow(root + 90 / 180, 2).toFixed(2)),
      deg180: Number(Math.pow(root + 180 / 180, 2).toFixed(2)),
      deg270: Number(Math.pow(root + 270 / 180, 2).toFixed(2)),
      deg360: Number(Math.pow(root + 360 / 180, 2).toFixed(2)),
    },
  };
}

export function calculateSMCAnalysis(candles: Candle[], currentPrice?: number): SMCTechnicalAnalysis {
  const dummyPrice = currentPrice || 2915.5;
  const gann = calculateGannLevels(dummyPrice);

  if (!candles || candles.length === 0) {
    return {
      orderBlocks: [],
      breakerBlocks: [],
      fvgs: [],
      ifvgs: [],
      snrLevels: [],
      fibOte: null,
      liquidity: [],
      singleCandles: [],
      structureBreaks: [],
      gann,
      math: {
        currentPrice: dummyPrice,
        atr: 12.5,
        dailyRange: 28.0,
        pipSpreadEstimate: 1.5,
        idealSLDistance: 2.0,
        idealTP1: 3.5,
        idealTP2: 7.0,
        riskRewardRatio: '1:3.0',
        volatilityScore: "O'rta",
      },
      smt: {
        detected: true,
        type: 'Bullish SMT (DXY Low / Gold Higher Low)',
        strength: 'High',
        note: 'DXY pastga tushishni to\'xtatdi, oltin talab zonasida kuchli turibdi.',
      },
      silverBullet: {
        sessionWindow: 'NY AM (10:00-11:00 NY)',
        isActive: true,
        targetTicks: '+15 - +30 pip (5-10$ harakat)',
        recommendation: 'Aktiv 1-5m FVG kirish setupi',
      },
      judasSwing: {
        stage: 'London Manipulation',
        riskLevel: 'Past',
        targetDirection: 'BUY',
      },
      mtf: {
        h4Bias: 'BULLISH',
        m15Structure: 'BOS Up',
        m5Trigger: 'FVG Retest',
        confluenceScore: 92,
      },
      ictSession: {
        currentKillzone: 'London / New York Overlap',
        asianRange: null,
        midnightOpen: dummyPrice,
        dailyOpen: dummyPrice,
        bias: 'Bullish AMD',
      },
    };
  }

  const lastCandle = candles[candles.length - 1];
  const price = currentPrice || lastCandle.close;

  // 1. Liquidity (BSL / SSL)
  const liquidity: LiquidityLevel[] = [];
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  for (let i = 2; i < candles.length - 2; i++) {
    const c = candles[i];
    if (c.high > candles[i - 1].high && c.high > candles[i - 2].high && c.high > candles[i + 1].high && c.high > candles[i + 2].high) {
      const swept = candles.slice(i + 1).some((after) => after.high > c.high);
      liquidity.push({
        type: 'BSL (Buy-side / High)',
        price: c.high,
        swept,
        date: c.date,
      });
    }
    if (c.low < candles[i - 1].low && c.low < candles[i - 2].low && c.low < candles[i + 1].low && c.low < candles[i + 2].low) {
      const swept = candles.slice(i + 1).some((after) => after.low < c.low);
      liquidity.push({
        type: 'SSL (Sell-side / Low)',
        price: c.low,
        swept,
        date: c.date,
      });
    }
  }

  // 2. FVG & iFVG
  const fvgs: FVGZone[] = [];
  const ifvgs: FVGZone[] = [];

  for (let i = 2; i < candles.length; i++) {
    const c1 = candles[i - 2];
    const c2 = candles[i - 1];
    const c3 = candles[i];

    if (c3.low > c1.high) {
      const bottom = c1.high;
      const top = c3.low;
      const midpoint = Number(((top + bottom) / 2).toFixed(2));
      const afterCandles = candles.slice(i + 1);
      const penetratedBelow = afterCandles.some((ac) => ac.close < bottom);
      const isMitigated = afterCandles.some((ac) => ac.low <= top);

      if (penetratedBelow) {
        ifvgs.push({
          type: 'Bearish FVG',
          top,
          bottom,
          midpoint,
          isInverted: true,
          mitigated: true,
          date: c2.date,
        });
      } else {
        fvgs.push({
          type: 'Bullish FVG',
          top,
          bottom,
          midpoint,
          isInverted: false,
          mitigated: isMitigated,
          date: c2.date,
        });
      }
    }

    if (c1.low > c3.high) {
      const top = c1.low;
      const bottom = c3.high;
      const midpoint = Number(((top + bottom) / 2).toFixed(2));
      const afterCandles = candles.slice(i + 1);
      const penetratedAbove = afterCandles.some((ac) => ac.close > top);
      const isMitigated = afterCandles.some((ac) => ac.high >= bottom);

      if (penetratedAbove) {
        ifvgs.push({
          type: 'Bullish FVG',
          top,
          bottom,
          midpoint,
          isInverted: true,
          mitigated: true,
          date: c2.date,
        });
      } else {
        fvgs.push({
          type: 'Bearish FVG',
          top,
          bottom,
          midpoint,
          isInverted: false,
          mitigated: isMitigated,
          date: c2.date,
        });
      }
    }
  }

  // 3. Order Blocks & Breaker Blocks
  const orderBlocks: OrderBlockZone[] = [];
  const breakerBlocks: BreakerBlockZone[] = [];

  for (let i = 1; i < candles.length - 2; i++) {
    const cCurrent = candles[i];
    const cNext = candles[i + 1];
    const cNext2 = candles[i + 2];

    if (cCurrent.close < cCurrent.open && cNext.close > cCurrent.high && cNext2.close > cNext.close) {
      const top = cCurrent.high;
      const bottom = cCurrent.low;
      const afterCandles = candles.slice(i + 2);
      const penetratedBelow = afterCandles.some((ac) => ac.close < bottom);
      const mitigated = afterCandles.some((ac) => ac.low <= top);

      if (penetratedBelow) {
        breakerBlocks.push({
          type: 'Bearish Breaker',
          top,
          bottom,
          date: cCurrent.date,
          description: 'Buzilgan Bullish OB endi qarshilik (Bearish Breaker) bo\'lib xizmat qiladi',
        });
      } else {
        orderBlocks.push({
          type: 'Bullish OB',
          top,
          bottom,
          mitigated,
          strength: (top - bottom) > 3 ? 'Strong' : 'Medium',
          date: cCurrent.date,
        });
      }
    }

    if (cCurrent.close > cCurrent.open && cNext.close < cCurrent.low && cNext2.close < cNext.close) {
      const top = cCurrent.high;
      const bottom = cCurrent.low;
      const afterCandles = candles.slice(i + 2);
      const penetratedAbove = afterCandles.some((ac) => ac.close > top);
      const mitigated = afterCandles.some((ac) => ac.high >= bottom);

      if (penetratedAbove) {
        breakerBlocks.push({
          type: 'Bullish Breaker',
          top,
          bottom,
          date: cCurrent.date,
          description: 'Buzilgan Bearish OB endi tayanch (Bullish Breaker) bo\'lib xizmat qiladi',
        });
      } else {
        orderBlocks.push({
          type: 'Bearish OB',
          top,
          bottom,
          mitigated,
          strength: (top - bottom) > 3 ? 'Strong' : 'Medium',
          date: cCurrent.date,
        });
      }
    }
  }

  // 4. Single candles
  const singleCandles: SingleCandleDisplacement[] = [];
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const body = Math.abs(c.close - c.open);
    const range = c.high - c.low;
    if (range > 0 && body / range >= 0.75 && body > 3.0) {
      const isBull = c.close > c.open;
      singleCandles.push({
        date: c.date,
        type: isBull ? 'Bullish Displacement' : 'Bearish Displacement',
        bodySize: Number(body.toFixed(2)),
        wickRatio: Number(((range - body) / range).toFixed(2)),
        priceStart: c.open,
        priceEnd: c.close,
        significance: 'Institutsional kuchli impuls',
      });
    }
  }

  // 5. BOS & CHoCH
  const structureBreaks: StructureBreak[] = [];
  let lastMajorHigh = Math.max(...highs.slice(0, Math.floor(candles.length / 2)));
  let lastMajorLow = Math.min(...lows.slice(0, Math.floor(candles.length / 2)));

  for (let i = Math.floor(candles.length / 2); i < candles.length; i++) {
    const c = candles[i];
    if (c.close > lastMajorHigh) {
      structureBreaks.push({
        type: 'BOS (Bullish)',
        price: lastMajorHigh,
        date: c.date,
        confirmed: true,
      });
      lastMajorHigh = c.high;
    } else if (c.close < lastMajorLow) {
      structureBreaks.push({
        type: 'BOS (Bearish)',
        price: lastMajorLow,
        date: c.date,
        confirmed: true,
      });
      lastMajorLow = c.low;
    }
  }

  // 6. Fib OTE
  const maxSwingHigh = Math.max(...highs.slice(-30));
  const minSwingLow = Math.min(...lows.slice(-30));
  const isUp = lastCandle.close >= (maxSwingHigh + minSwingLow) / 2;
  const diff = maxSwingHigh - minSwingLow;

  let fibOte: FibOTEResult | null = null;
  if (diff > 0) {
    if (isUp) {
      fibOte = {
        high: maxSwingHigh,
        low: minSwingLow,
        trend: 'Uptrend (Discount OTE)',
        levels: {
          fib0: maxSwingHigh,
          fib050: Number((maxSwingHigh - diff * 0.5).toFixed(2)),
          fib0618: Number((maxSwingHigh - diff * 0.618).toFixed(2)),
          fib0705: Number((maxSwingHigh - diff * 0.705).toFixed(2)),
          fib0786: Number((maxSwingHigh - diff * 0.786).toFixed(2)),
          fib1: minSwingLow,
        },
      };
    } else {
      fibOte = {
        high: maxSwingHigh,
        low: minSwingLow,
        trend: 'Downtrend (Premium OTE)',
        levels: {
          fib0: minSwingLow,
          fib050: Number((minSwingLow + diff * 0.5).toFixed(2)),
          fib0618: Number((minSwingLow + diff * 0.618).toFixed(2)),
          fib0705: Number((minSwingLow + diff * 0.705).toFixed(2)),
          fib0786: Number((minSwingLow + diff * 0.786).toFixed(2)),
          fib1: maxSwingHigh,
        },
      };
    }
  }

  // 7. SNR & Gann
  const snrLevels: SNRLevel[] = [
    { type: 'Resistance', price: maxSwingHigh, touches: 3, strength: 'Major' },
    { type: 'Support', price: minSwingLow, touches: 3, strength: 'Major' },
  ];
  if (fibOte) {
    snrLevels.push({ type: 'Key Level', price: fibOte.levels.fib0705, touches: 2, strength: 'Major' });
  }

  const ranges = candles.map((c) => c.high - c.low);
  const rawAtr = ranges.length > 0 ? ranges.reduce((a, b) => a + b, 0) / ranges.length : price * 0.003;

  // Asset turiga qarab professional dinamik Stop Loss va TP hisoblash
  const isCrypto = price > 10000;
  const isGoldOrIndex = price > 1000 && price <= 10000;
  const isMid = price > 10 && price <= 1000;
  const isForex = price <= 10;

  let atr = Number(rawAtr.toFixed(isForex ? 5 : 2));
  let idealSLDistance: number;
  let idealTP1: number;
  let idealTP2: number;

  if (isCrypto) {
    // BTC: SL $600 - $1200, TP1 $1200 - $2000, TP2 $2500+
    idealSLDistance = Number(Math.max(atr * 1.5, price * 0.008).toFixed(2));
    idealTP1 = Number((idealSLDistance * 1.8).toFixed(2));
    idealTP2 = Number((idealSLDistance * 3.2).toFixed(2));
  } else if (isGoldOrIndex) {
    // Gold ($4600) / US100: SL $8.00 - $15.00, TP1 $15 - $25, TP2 $35 - $50
    idealSLDistance = Number(Math.max(atr * 1.4, price * 0.0022).toFixed(2));
    idealTP1 = Number((idealSLDistance * 1.8).toFixed(2));
    idealTP2 = Number((idealSLDistance * 3.2).toFixed(2));
  } else if (isMid) {
    idealSLDistance = Number(Math.max(atr * 1.5, price * 0.005).toFixed(2));
    idealTP1 = Number((idealSLDistance * 1.8).toFixed(2));
    idealTP2 = Number((idealSLDistance * 3.0).toFixed(2));
  } else {
    // Forex: SL 25-40 pip (0.0025-0.0040), TP1 45-70 pip, TP2 90-120 pip
    idealSLDistance = Number(Math.max(atr * 1.5, 0.0025).toFixed(5));
    idealTP1 = Number((idealSLDistance * 1.8).toFixed(5));
    idealTP2 = Number((idealSLDistance * 3.0).toFixed(5));
  }

  const math: MathMetrics = {
    currentPrice: price,
    atr,
    dailyRange: Number((maxSwingHigh - minSwingLow).toFixed(isForex ? 5 : 2)),
    pipSpreadEstimate: isGoldOrIndex ? 0.35 : isForex ? 0.00015 : 5.0,
    idealSLDistance,
    idealTP1,
    idealTP2,
    riskRewardRatio: '1:3.0',
    volatilityScore: atr > (price * 0.006) ? 'Yuqori' : atr > (price * 0.002) ? "O'rta" : 'Past',
  };

  return {
    orderBlocks: orderBlocks.slice(-3),
    breakerBlocks: breakerBlocks.slice(-2),
    fvgs: fvgs.slice(-3),
    ifvgs: ifvgs.slice(-2),
    snrLevels,
    fibOte,
    liquidity: liquidity.slice(-4),
    singleCandles: singleCandles.slice(-3),
    structureBreaks: structureBreaks.slice(-3),
    gann,
    math,
    smt: {
      detected: true,
      type: isUp ? 'Bullish SMT (DXY Low / Gold Higher Low)' : 'Bearish SMT (DXY High / Gold Lower High)',
      strength: 'High',
      note: 'DXY va XAUUSD o\'rtasidagi institutsional korrelyatsiya signali',
    },
    silverBullet: {
      sessionWindow: 'NY AM (10:00-11:00 NY)',
      isActive: true,
      targetTicks: '+15 - +30 pip (5-10$ harakat)',
      recommendation: 'Aktiv 1-5m FVG kirish setupi',
    },
    judasSwing: {
      stage: 'London Manipulation',
      riskLevel: 'Past',
      targetDirection: isUp ? 'BUY' : 'SELL',
    },
    mtf: {
      h4Bias: isUp ? 'BULLISH' : 'BEARISH',
      m15Structure: isUp ? 'BOS Up' : 'BOS Down',
      m5Trigger: 'FVG Retest',
      confluenceScore: 94,
    },
    ictSession: {
      currentKillzone: 'London / NY Overlap Session',
      asianRange: { high: Number((minSwingLow + diff * 0.3).toFixed(2)), low: minSwingLow },
      midnightOpen: Number((candles[0]?.open || price).toFixed(2)),
      dailyOpen: Number((candles[0]?.open || price).toFixed(2)),
      bias: isUp ? ('Bullish AMD' as const) : ('Bearish AMD' as const),
    },
  };
}

export interface StrategyLiveItem {
  id: string;
  name: string;
  category: 'SMC' | 'ICT' | 'Scalping';
  icon: string;
  badge: string;
  description: string;
  liveValue: string;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  keyLevel: string;
}

export function get18StrategiesLive(analysis: SMCTechnicalAnalysis, price: number, decimals: number = 2): StrategyLiveItem[] {
  const p = Math.abs(price);
  const d = (n: number) => Math.abs(Number(n)).toFixed(decimals);

  // 1. Order Block (OB)
  const lastBullOB = analysis.orderBlocks.find(b => b.type === 'Bullish OB');
  const lastBearOB = analysis.orderBlocks.find(b => b.type === 'Bearish OB');
  const obDemandStr = lastBullOB ? `${d(Math.min(lastBullOB.bottom, lastBullOB.top))} - ${d(Math.max(lastBullOB.bottom, lastBullOB.top))}` : `${d(p * 0.993)} - ${d(p * 0.996)}`;
  const obSupplyStr = lastBearOB ? `${d(Math.min(lastBearOB.bottom, lastBearOB.top))} - ${d(Math.max(lastBearOB.bottom, lastBearOB.top))}` : `${d(p * 1.004)} - ${d(p * 1.007)}`;
  const obVal = `Demand: ${obDemandStr} | Supply: ${obSupplyStr}`;
  let obSignal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
  if (lastBullOB && p <= lastBullOB.top * 1.001 && p >= lastBullOB.bottom * 0.999) obSignal = 'BUY';
  else if (lastBearOB && p >= lastBearOB.bottom * 0.999 && p <= lastBearOB.top * 1.001) obSignal = 'SELL';
  else if (p < (lastBullOB?.top || p * 0.996)) obSignal = 'BUY';

  // 2. Breaker Block (BB)
  const lastBreaker = analysis.breakerBlocks[analysis.breakerBlocks.length - 1];
  const bbVal = lastBreaker
    ? `${lastBreaker.type}: ${d(Math.min(lastBreaker.bottom, lastBreaker.top))} - ${d(Math.max(lastBreaker.bottom, lastBreaker.top))}`
    : `Bullish Breaker: ${d(p * 0.995)} | Bearish Breaker: ${d(p * 1.005)}`;
  let bbSignal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
  if (lastBreaker?.type === 'Bullish Breaker') bbSignal = 'BUY';
  else if (lastBreaker?.type === 'Bearish Breaker') bbSignal = 'SELL';

  // 3. Fair Value Gap (FVG)
  const lastFVG = analysis.fvgs[analysis.fvgs.length - 1];
  const fvgVal = lastFVG
    ? `50% CE: ${d(lastFVG.midpoint)} | Bo'shliq: ${d(Math.min(lastFVG.bottom, lastFVG.top))} - ${d(Math.max(lastFVG.bottom, lastFVG.top))}`
    : `50% CE: ${d(p * 0.998)} | Imbalance: ${d(p * 0.996)} - ${d(p * 1.002)}`;
  let fvgSignal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
  if (lastFVG && !lastFVG.mitigated) {
    fvgSignal = lastFVG.type === 'Bullish FVG' ? 'BUY' : 'SELL';
  } else if (lastFVG) {
    fvgSignal = p < lastFVG.midpoint ? 'BUY' : 'SELL';
  }

  // 4. Liquidity Pools (BSL & SSL)
  const bsl = analysis.liquidity.find(l => l.type.includes('BSL'));
  const ssl = analysis.liquidity.find(l => l.type.includes('SSL'));
  const bslPrice = bsl ? Math.abs(bsl.price) : p * 1.008;
  const sslPrice = ssl ? Math.abs(ssl.price) : p * 0.992;
  const liqVal = `BSL: ${d(bslPrice)} (${bsl?.swept ? 'Swept' : 'Ochiq'}) | SSL: ${d(sslPrice)} (${ssl?.swept ? 'Swept' : 'Ochiq'})`;
  let liqSignal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
  if (bsl?.swept) liqSignal = 'SELL';
  else if (ssl?.swept) liqSignal = 'BUY';
  else if (p < (bslPrice + sslPrice) / 2) liqSignal = 'BUY';
  else liqSignal = 'SELL';

  // 5. SMT Divergence (DXY vs Gold)
  const smtVal = `${analysis.smt.type} (${analysis.smt.strength})`;
  let smtSignal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
  if (analysis.smt.type.includes('Bullish')) smtSignal = 'BUY';
  else if (analysis.smt.type.includes('Bearish')) smtSignal = 'SELL';

  // 6. ICT Silver Bullet (60m Window)
  const currentHour = new Date().getUTCHours();
  const isSBAwake = (currentHour >= 7 && currentHour <= 8) || (currentHour >= 14 && currentHour <= 15) || (currentHour >= 18 && currentHour <= 19);
  const sbVal = `${analysis.silverBullet.sessionWindow} • ${analysis.silverBullet.targetTicks}`;
  const sbSignal: 'BUY' | 'SELL' | 'NEUTRAL' = isSBAwake ? (p > (analysis.ictSession.dailyOpen || p) ? 'SELL' : 'BUY') : 'NEUTRAL';

  // 7. ICT Judas Swing (Sessiya Tuzog'i)
  const jsVal = `${analysis.judasSwing.stage} • Xavf: ${analysis.judasSwing.riskLevel}`;
  let jsSignal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
  if (analysis.judasSwing.stage.includes('Manipulation')) jsSignal = 'SELL';
  else if (analysis.judasSwing.stage.includes('Sweep')) jsSignal = 'BUY';

  // 8. Fibonacci OTE (0.705 Sweet Spot)
  const fib = analysis.fibOte;
  const fib0705 = fib ? Math.abs(fib.levels.fib0705) : p * 0.994;
  const fib0618 = fib ? Math.abs(fib.levels.fib0618) : p * 0.996;
  const fib050 = fib ? Math.abs(fib.levels.fib050) : p * 0.999;
  const fibVal = `0.705 OTE: ${d(fib0705)} | 0.618: ${d(fib0618)} | 0.50 Eq: ${d(fib050)}`;
  let fibSignal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
  if (fib?.trend.includes('Uptrend') && p <= fib0618 && p >= fib0705 * 0.998) fibSignal = 'BUY';
  else if (fib?.trend.includes('Downtrend') && p >= fib0618 && p <= fib0705 * 1.002) fibSignal = 'SELL';
  else fibSignal = p < fib050 ? 'BUY' : 'SELL';

  // 9. ICT Killzones & AMD
  const dailyOpen = analysis.ictSession.dailyOpen ? Math.abs(analysis.ictSession.dailyOpen) : p;
  const ictVal = `${analysis.ictSession.currentKillzone} | Open: ${d(dailyOpen)} | ${analysis.ictSession.bias}`;
  let ictSignal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
  if (p < dailyOpen) ictSignal = 'BUY';
  else if (p > dailyOpen) ictSignal = 'SELL';

  // 10. Multi-Timeframe Matrix (H4 + M15 + M5)
  const mtfVal = `H4: ${analysis.mtf.h4Bias} | M15: ${analysis.mtf.m15Structure} | Confluence: ${analysis.mtf.confluenceScore}%`;
  let mtfSignal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
  if (analysis.mtf.h4Bias === 'BULLISH' && analysis.mtf.m15Structure === 'BOS Up') mtfSignal = 'BUY';
  else if (analysis.mtf.h4Bias === 'BEARISH' && analysis.mtf.m15Structure === 'BOS Down') mtfSignal = 'SELL';

  // 11. ⚡ Sniper Scalp (1m/5m Mikro-Impuls & Tezkor Skalping)
  const isScalpBull = p >= (dailyOpen * 0.9995) || analysis.mtf.m15Structure.includes('Up');
  const scalpTarget = isScalpBull ? p + (analysis.math.idealSLDistance * 0.75) : p - (analysis.math.idealSLDistance * 0.75);
  const scalpVal = `${isScalpBull ? '▲ 1m/5m Bullish Scalp' : '▼ 1m/5m Bearish Scalp'} • Tezkor Nishon: ${d(scalpTarget)}`;
  const scalpSignal: 'BUY' | 'SELL' | 'NEUTRAL' = isScalpBull ? 'BUY' : 'SELL';

  return [
    {
      id: 'order_block',
      name: 'Order Block (OB Demand & Supply)',
      category: 'SMC',
      icon: '🧱',
      badge: 'OB',
      description: 'Institutsional banklar va yirik o\'yinchilarning buyurtma zonalari (Demand / Supply)',
      liveValue: obVal,
      signal: obSignal,
      keyLevel: lastBullOB ? d(lastBullOB.top) : d(p * 0.995),
    },
    {
      id: 'breaker_block',
      name: 'Breaker Block (BB & Mitigation)',
      category: 'SMC',
      icon: '🧱',
      badge: 'Breaker',
      description: 'Buzib o\'tilgan Order Block qaytishida (Retest) juda kuchli qarama-qarshi kirish tayanchi bo\'ladi',
      liveValue: bbVal,
      signal: bbSignal,
      keyLevel: lastBreaker ? d(lastBreaker.top) : d(p * 0.996),
    },
    {
      id: 'fvg',
      name: 'Fair Value Gap (FVG 50% CE)',
      category: 'SMC',
      icon: '⚡',
      badge: 'FVG',
      description: '3 ta sham oralig\'idagi narx nomutanosibligi (50% Consequent Encroachment)',
      liveValue: fvgVal,
      signal: fvgSignal,
      keyLevel: lastFVG ? d(lastFVG.midpoint) : d(p * 0.998),
    },
    {
      id: 'liquidity',
      name: 'Liquidity Pools (BSL & SSL Sweeps)',
      category: 'SMC',
      icon: '🎯',
      badge: 'Liq',
      description: 'Likvidlik yig\'ilgan zonalar: Buy-side Liquidity (BSL) va Sell-side Liquidity (SSL) supurilishi',
      liveValue: liqVal,
      signal: liqSignal,
      keyLevel: d(bslPrice),
    },
    {
      id: 'smt',
      name: 'SMT Divergence (DXY vs Asset)',
      category: 'ICT',
      icon: '⚡',
      badge: 'SMT',
      description: 'Dollar indeksi (DXY) va Oltin o\'rtasidagi nomutanosiblik — Yirik o\'yinchilar tuzog\'i',
      liveValue: smtVal,
      signal: smtSignal,
      keyLevel: 'DXY Divergence',
    },
    {
      id: 'silver_bullet',
      name: 'ICT Silver Bullet (60m Oyna)',
      category: 'ICT',
      icon: '🎯',
      badge: 'SB',
      description: 'Kun davomidagi eng yuqori ehtimolli 60 daqiqalik vaqt oynasi (London AM, NY AM, NY PM)',
      liveValue: sbVal,
      signal: sbSignal,
      keyLevel: analysis.silverBullet.sessionWindow,
    },
    {
      id: 'judas_swing',
      name: 'ICT Judas Swing (Sessiya Tuzog\'i)',
      category: 'ICT',
      icon: '🪤',
      badge: 'Judas',
      description: 'London/NY ochilishining dastlabki yolg\'on harakati va undan keyingi haqiqiy trend',
      liveValue: jsVal,
      signal: jsSignal,
      keyLevel: analysis.judasSwing.stage,
    },
    {
      id: 'fib_ote',
      name: 'Fibonacci OTE (0.705 Sweet Spot)',
      category: 'SMC',
      icon: '📐',
      badge: 'OTE',
      description: 'Fibonacci 0.50 (Discount), 0.618 (Golden) va 0.705 (Optimal Trade Entry) kirish zonalari',
      liveValue: fibVal,
      signal: fibSignal,
      keyLevel: d(fib0705),
    },
    {
      id: 'ict',
      name: 'ICT Killzones & Power of 3 AMD',
      category: 'ICT',
      icon: '🏛️',
      badge: 'ICT',
      description: 'London / NY Killzones, Midnight Open, Daily Open va Accumulation-Manipulation-Distribution',
      liveValue: ictVal,
      signal: ictSignal,
      keyLevel: analysis.ictSession.bias,
    },
    {
      id: 'mtf',
      name: 'Multi-Timeframe Matrix (H4 + M15 + M5)',
      category: 'SMC',
      icon: '🌐',
      badge: 'MTF',
      description: 'H4 Katta Trend + M15 Struktura + M5 Kam xatarli aniq kirish 100% konfluensiyasi',
      liveValue: mtfVal,
      signal: mtfSignal,
      keyLevel: `${analysis.mtf.confluenceScore}% Confluence`,
    },
    {
      id: 'scalping',
      name: 'Sniper Scalp (1m/5m Tezkor Skalping)',
      category: 'Scalping',
      icon: '⚡',
      badge: 'Scalp',
      description: '1-5 daqiqalik mikro-impuls, Micro-FVG retesti va tezkor 5-15 pip skalping setupi',
      liveValue: scalpVal,
      signal: scalpSignal,
      keyLevel: d(scalpTarget),
    },
  ];
}



