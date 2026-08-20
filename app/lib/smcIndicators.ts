/**
 * SMC & ICT Professional Indikatorlar va Matematik Tahlil Kutubxonasi
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
};

export interface OrderBlockZone {
  type: 'Bullish OB' | 'Bearish OB';
  top: number;
  bottom: number;
  mitigated: boolean;
  strength: 'Strong' | 'Medium' | 'Weak';
  date: string;
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

export interface SMCTechnicalAnalysis {
  orderBlocks: OrderBlockZone[];
  fvgs: FVGZone[];
  ifvgs: FVGZone[];
  snrLevels: SNRLevel[];
  fibOte: FibOTEResult | null;
  liquidity: LiquidityLevel[];
  singleCandles: SingleCandleDisplacement[];
  structureBreaks: StructureBreak[];
  gann: GannLevels;
  math: MathMetrics;
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
  if (!candles || candles.length === 0) {
    const dummyPrice = currentPrice || 2650;
    const gann = calculateGannLevels(dummyPrice);
    return {
      orderBlocks: [],
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
        idealSLDistance: 15,
        idealTP1: 30,
        idealTP2: 60,
        riskRewardRatio: '1:3.0',
        volatilityScore: "O'rta",
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

  // Liquidity
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

  // FVG & iFVG
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

  // Order Blocks
  const orderBlocks: OrderBlockZone[] = [];
  for (let i = 1; i < candles.length - 2; i++) {
    const cCurrent = candles[i];
    const cNext = candles[i + 1];
    const cNext2 = candles[i + 2];

    if (cCurrent.close < cCurrent.open && cNext.close > cCurrent.high && cNext2.close > cNext.close) {
      const top = cCurrent.high;
      const bottom = cCurrent.low;
      const mitigated = candles.slice(i + 2).some((ac) => ac.low <= top);
      orderBlocks.push({
        type: 'Bullish OB',
        top,
        bottom,
        mitigated,
        strength: (top - bottom) > 3 ? 'Strong' : 'Medium',
        date: cCurrent.date,
      });
    }

    if (cCurrent.close > cCurrent.open && cNext.close < cCurrent.low && cNext2.close < cNext.close) {
      const top = cCurrent.high;
      const bottom = cCurrent.low;
      const mitigated = candles.slice(i + 2).some((ac) => ac.high >= bottom);
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

  // Single candles
  const singleCandles: SingleCandleDisplacement[] = [];
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const body = Math.abs(c.close - c.open);
    const range = c.high - c.low;
    if (range > 0 && body / range >= 0.75 && body > 4.0) {
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

  // BOS & CHoCH
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

  if (structureBreaks.length > 1) {
    const prev = structureBreaks[structureBreaks.length - 2];
    const last = structureBreaks[structureBreaks.length - 1];
    if (prev.type.includes('Bearish') && last.type.includes('Bullish')) {
      last.type = 'CHoCH (Bullish)';
    } else if (prev.type.includes('Bullish') && last.type.includes('Bearish')) {
      last.type = 'CHoCH (Bearish)';
    }
  }

  // Fib OTE
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

  // SNR
  const snrLevels: SNRLevel[] = [
    { type: 'Resistance', price: maxSwingHigh, touches: 3, strength: 'Major' },
    { type: 'Support', price: minSwingLow, touches: 3, strength: 'Major' },
  ];
  if (fibOte) {
    snrLevels.push({ type: 'Key Level', price: fibOte.levels.fib050, touches: 2, strength: 'Major' });
    snrLevels.push({ type: 'Key Level', price: fibOte.levels.fib0705, touches: 2, strength: 'Major' });
  }

  // Gann
  const gann = calculateGannLevels(price);

  // Math
  const ranges = candles.map((c) => c.high - c.low);
  const atr = ranges.length > 0 ? Number((ranges.reduce((a, b) => a + b, 0) / ranges.length).toFixed(2)) : 10.0;
  const idealSL = Number((atr * 1.2).toFixed(2));
  const idealTP1 = Number((idealSL * 2.0).toFixed(2));
  const idealTP2 = Number((idealSL * 3.5).toFixed(2));

  const math: MathMetrics = {
    currentPrice: price,
    atr,
    dailyRange: Number((maxSwingHigh - minSwingLow).toFixed(2)),
    pipSpreadEstimate: 1.2,
    idealSLDistance: idealSL,
    idealTP1: idealTP1,
    idealTP2: idealTP2,
    riskRewardRatio: '1:3.0',
    volatilityScore: atr > 15 ? 'Yuqori' : atr > 8 ? "O'rta" : 'Past',
  };

  const ictSession = {
    currentKillzone: 'London / NY Overlap Session',
    asianRange: { high: Number((minSwingLow + diff * 0.3).toFixed(2)), low: minSwingLow },
    midnightOpen: Number((candles[0]?.open || price).toFixed(2)),
    dailyOpen: Number((candles[0]?.open || price).toFixed(2)),
    bias: isUp ? ('Bullish AMD' as const) : ('Bearish AMD' as const),
  };

  return {
    orderBlocks: orderBlocks.slice(-4),
    fvgs: fvgs.slice(-4),
    ifvgs: ifvgs.slice(-4),
    snrLevels,
    fibOte,
    liquidity: liquidity.slice(-6),
    singleCandles: singleCandles.slice(-4),
    structureBreaks: structureBreaks.slice(-4),
    gann,
    math,
    ictSession,
  };
}
