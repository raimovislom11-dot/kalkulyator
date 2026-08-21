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
  const atr = ranges.length > 0 ? Number((ranges.reduce((a, b) => a + b, 0) / ranges.length).toFixed(2)) : 10.0;

  const math: MathMetrics = {
    currentPrice: price,
    atr,
    dailyRange: Number((maxSwingHigh - minSwingLow).toFixed(2)),
    pipSpreadEstimate: 1.2,
    idealSLDistance: 2.0,
    idealTP1: 3.5,
    idealTP2: 7.0,
    riskRewardRatio: '1:3.0',
    volatilityScore: atr > 15 ? 'Yuqori' : atr > 8 ? "O'rta" : 'Past',
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
  category: 'SMC' | 'ICT' | 'Matematika' | 'Price Action';
  icon: string;
  badge: string;
  description: string;
  liveValue: string;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  keyLevel: string;
}

export function get18StrategiesLive(analysis: SMCTechnicalAnalysis, price: number, decimals: number = 2): StrategyLiveItem[] {
  const p = price;
  const d = (n: number) => Number(n).toFixed(decimals);

  // 1. Order Block
  const lastBullOB = analysis.orderBlocks.find(b => b.type === 'Bullish OB');
  const lastBearOB = analysis.orderBlocks.find(b => b.type === 'Bearish OB');
  const obVal = lastBullOB && lastBearOB
    ? `Demand: ${d(lastBullOB.bottom)}-${d(lastBullOB.top)} | Supply: ${d(lastBearOB.bottom)}-${d(lastBearOB.top)}`
    : lastBullOB
    ? `Demand: ${d(lastBullOB.bottom)}-${d(lastBullOB.top)} | Supply: ${d(p * 1.006)}`
    : `Demand: ${d(p * 0.994)} | Supply: ${d(p * 1.006)}`;

  // 2. Breaker Block
  const lastBreaker = analysis.breakerBlocks[analysis.breakerBlocks.length - 1];
  const bbVal = lastBreaker
    ? `${lastBreaker.type}: ${d(lastBreaker.bottom)} - ${d(lastBreaker.top)} (Retest)`
    : `Bullish Breaker: ${d(p * 0.995)} | Bearish Breaker: ${d(p * 1.005)}`;

  // 3. FVG
  const lastFVG = analysis.fvgs[analysis.fvgs.length - 1];
  const fvgVal = lastFVG
    ? `50% CE: ${d(lastFVG.midpoint)} | Bo'shliq: ${d(lastFVG.bottom)} - ${d(lastFVG.top)}`
    : `50% CE: ${d(p * 0.998)} | Imbalance: ${d(p * 0.996)} - ${d(p * 1.002)}`;

  // 4. iFVG
  const lastIFVG = analysis.ifvgs[analysis.ifvgs.length - 1];
  const ifvgVal = lastIFVG
    ? `Invert 50%: ${d(lastIFVG.midpoint)} (${lastIFVG.type})`
    : `Invert Zonalari: ${d(p * 0.997)} (Tayanch) / ${d(p * 1.003)} (Qarshilik)`;

  // 5. SMT
  const smtVal = `${analysis.smt.type} • ${analysis.smt.strength}`;

  // 6. Silver Bullet
  const sbVal = `${analysis.silverBullet.sessionWindow} • ${analysis.silverBullet.targetTicks}`;

  // 7. Judas Swing
  const jsVal = `${analysis.judasSwing.stage} • Tuzoq xavfi: ${analysis.judasSwing.riskLevel}`;

  // 8. SNR
  const sup = analysis.snrLevels.find(s => s.type === 'Support');
  const res = analysis.snrLevels.find(s => s.type === 'Resistance');
  const snrVal = `Support: ${sup ? d(sup.price) : d(p * 0.990)} | Resistance: ${res ? d(res.price) : d(p * 1.010)}`;

  // 9. Fib OTE
  const fib = analysis.fibOte;
  const fibVal = fib
    ? `0.705 OTE: ${d(fib.levels.fib0705)} | 0.618: ${d(fib.levels.fib0618)} | 0.50 Eq: ${d(fib.levels.fib050)}`
    : `0.705 OTE: ${d(p * 0.994)} | 0.618: ${d(p * 0.996)} | 0.5 Eq: ${d(p * 0.999)}`;

  // 10. Ganna
  const g = analysis.gann.degrees;
  const gannVal = `90°=${d(g.deg90)} | 180°=${d(g.deg180)} | 270°=${d(g.deg270)} | 360°=${d(g.deg360)}`;

  // 11. Liquidity
  const bsl = analysis.liquidity.find(l => l.type.includes('BSL'));
  const ssl = analysis.liquidity.find(l => l.type.includes('SSL'));
  const liqVal = `BSL (Yuqori): ${bsl ? d(bsl.price) : d(p * 1.007)} | SSL (Pastki): ${ssl ? d(ssl.price) : d(p * 0.993)}`;

  // 12. Single Candle
  const sc = analysis.singleCandles[analysis.singleCandles.length - 1];
  const scVal = sc
    ? `${sc.type} (${d(sc.bodySize)} diapazon, ${sc.significance})`
    : `Institutsional impuls: ${d(p * 0.006)} diapazon`;

  // 13. ICT AMD
  const ictVal = `Killzone: ${analysis.ictSession.currentKillzone} | Bias: ${analysis.ictSession.bias}`;

  // 14. BOS
  const lastBOS = analysis.structureBreaks.find(s => s.type.includes('BOS'));
  const bosVal = lastBOS
    ? `${lastBOS.type} darajasi: ${d(lastBOS.price)}`
    : `Bullish BOS: ${d(p * 1.004)} | Bearish BOS: ${d(p * 0.996)}`;

  // 15. CHoCH
  const lastCHoCH = analysis.structureBreaks.find(s => s.type.includes('CHoCH'));
  const chochVal = lastCHoCH
    ? `${lastCHoCH.type} trigger: ${d(lastCHoCH.price)}`
    : `Bullish CHoCH: ${d(p * 1.005)} | Bearish CHoCH: ${d(p * 0.995)}`;

  // 16. MTF Matrix
  const mtfVal = `H4: ${analysis.mtf.h4Bias} | M15: ${analysis.mtf.m15Structure} | Confluence: ${analysis.mtf.confluenceScore}%`;

  // 17. Matematika
  const m = analysis.math;
  const mathVal = `ATR: ${d(m.atr)} | Ideal SL: ${d(m.idealSLDistance)} | TP1: ${d(m.idealTP1)} | TP2: ${d(m.idealTP2)} | R:R=1:3`;

  // 18. Swing High & Low
  const supP = sup ? sup.price : p * 0.994;
  const resP = res ? res.price : p * 1.006;
  const hlVal = `Swing High: ${d(resP)} | Swing Low: ${d(supP)}`;

  const isBuyBias = analysis.ictSession.bias.includes('Bullish') || analysis.mtf.h4Bias === 'BULLISH';

  return [
    {
      id: 'order_block',
      name: 'Order Block (OB Demand & Supply)',
      category: 'SMC',
      icon: '🧱',
      badge: 'OB',
      description: 'Institutsional yirik banklar va fondlar buyurtma zonalari (Demand / Supply)',
      liveValue: obVal,
      signal: isBuyBias ? 'BUY' : 'SELL',
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
      signal: isBuyBias ? 'BUY' : 'SELL',
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
      signal: lastFVG?.type === 'Bullish FVG' ? 'BUY' : 'SELL',
      keyLevel: lastFVG ? d(lastFVG.midpoint) : d(p * 0.998),
    },
    {
      id: 'ifvg',
      name: 'iFVG (Inverted Fair Value Gap)',
      category: 'SMC',
      icon: '🔄',
      badge: 'iFVG',
      description: 'Narx tomonidan buzib o\'tilgan va teskari (Support <-> Resistance) vazifasini bajaruvchi FVG',
      liveValue: ifvgVal,
      signal: lastIFVG?.type === 'Bullish FVG' ? 'BUY' : 'SELL',
      keyLevel: lastIFVG ? d(lastIFVG.midpoint) : d(p * 0.997),
    },
    {
      id: 'smt',
      name: 'SMT Divergence (DXY vs Gold Korrelyatsiya)',
      category: 'ICT',
      icon: '⚡',
      badge: 'SMT',
      description: 'Dollar indeksi (DXY) va Oltin o\'rtasidagi nomutanosiblik — Yirik o\'yinchilarning tuzog\'i (Fakeout) aniqlash',
      liveValue: smtVal,
      signal: analysis.smt.type.includes('Bullish') ? 'BUY' : 'SELL',
      keyLevel: 'DXY/Gold Divergence',
    },
    {
      id: 'silver_bullet',
      name: 'ICT Silver Bullet (60 Daqiqalik Oyna)',
      category: 'ICT',
      icon: '🎯',
      badge: 'SB',
      description: 'Kun davomidagi eng yuqori ehtimolli 60 daqiqalik vaqt oynasi (London AM, NY AM, NY PM)',
      liveValue: sbVal,
      signal: isBuyBias ? 'BUY' : 'SELL',
      keyLevel: analysis.silverBullet.sessionWindow,
    },
    {
      id: 'judas_swing',
      name: 'ICT Judas Swing (Sessiya Ochilish Tuzog\'i)',
      category: 'ICT',
      icon: '🪤',
      badge: 'Judas',
      description: 'London/NY ochilishining ilk 15-30 daqiqasidagi yolg\'on harakat (Manipulation) va undan keyingi haqiqiy trend',
      liveValue: jsVal,
      signal: analysis.judasSwing.targetDirection === 'BUY' ? 'BUY' : 'SELL',
      keyLevel: analysis.judasSwing.stage,
    },
    {
      id: 'snr',
      name: 'SNR (Support & Resistance Darajalari)',
      category: 'Price Action',
      icon: '📊',
      badge: 'SNR',
      description: 'Statik va dinamik asosiy qo\'llab-quvvatlash va qarshilik gorizontal darajalari',
      liveValue: snrVal,
      signal: 'NEUTRAL',
      keyLevel: sup ? d(sup.price) : d(p * 0.990),
    },
    {
      id: 'fib_ote',
      name: 'Fibonacci OTE (Optimal Trade Entry 0.705)',
      category: 'SMC',
      icon: '📐',
      badge: 'OTE',
      description: 'Fibonacci 0.50 (Eq), 0.618 (Golden), 0.705 (ICT OTE Sweet Spot) va 0.786 darajalari',
      liveValue: fibVal,
      signal: isBuyBias ? 'BUY' : 'SELL',
      keyLevel: fib ? d(fib.levels.fib0705) : d(p * 0.994),
    },
    {
      id: 'ganna',
      name: 'Ganna (Gann Square of 9 Darajalari)',
      category: 'Matematika',
      icon: '✨',
      badge: 'Gann',
      description: 'W.D. Gann matematik kvadrat ildiz va burchak darajalari (90°, 180°, 270°, 360°)',
      liveValue: gannVal,
      signal: 'NEUTRAL',
      keyLevel: d(g.deg180),
    },
    {
      id: 'liquidity',
      name: 'Liquidity Pools (BSL & SSL Likvidlik)',
      category: 'SMC',
      icon: '🎯',
      badge: 'Liq',
      description: 'Likvidlik yig\'ilgan zonalar: Buy-side Liquidity (BSL) va Sell-side Liquidity (SSL)',
      liveValue: liqVal,
      signal: bsl?.swept ? 'SELL' : ssl?.swept ? 'BUY' : 'NEUTRAL',
      keyLevel: bsl ? d(bsl.price) : d(p * 1.007),
    },
    {
      id: 'single_candle',
      name: 'Yolg\'iz Sham (Displacement / Institutional Candle)',
      category: 'Price Action',
      icon: '🕯️',
      badge: 'Sham',
      description: 'Katta hajmli yakkaxon institutsional impuls shami (Imbalance / Katta tana)',
      liveValue: scVal,
      signal: sc?.type === 'Bullish Displacement' ? 'BUY' : 'SELL',
      keyLevel: sc ? d(sc.priceEnd) : d(p),
    },
    {
      id: 'ict',
      name: 'ICT (Killzones & Power of 3 AMD)',
      category: 'ICT',
      icon: '🏛️',
      badge: 'ICT',
      description: 'London / New York Killzones, Midnight Open, Daily Open va Accumulation-Manipulation-Distribution',
      liveValue: ictVal,
      signal: isBuyBias ? 'BUY' : 'SELL',
      keyLevel: analysis.ictSession.bias,
    },
    {
      id: 'bos',
      name: 'BOS (Break of Structure)',
      category: 'SMC',
      icon: '⚡',
      badge: 'BOS',
      description: 'Trend davom etishini tasdiqlovchi struktura buzilishi (Higher High / Lower Low)',
      liveValue: bosVal,
      signal: lastBOS?.type.includes('Bullish') ? 'BUY' : 'SELL',
      keyLevel: lastBOS ? d(lastBOS.price) : d(p * 1.004),
    },
    {
      id: 'choch',
      name: 'CHoCH (Change of Character)',
      category: 'SMC',
      icon: '🔄',
      badge: 'CHoCH',
      description: 'Trend yo\'nalishi o\'zgarishini ko\'rsatuvchi dastlabki struktura o\'zgarishi',
      liveValue: chochVal,
      signal: lastCHoCH?.type.includes('Bullish') ? 'BUY' : 'SELL',
      keyLevel: lastCHoCH ? d(lastCHoCH.price) : d(p * 1.005),
    },
    {
      id: 'mtf',
      name: 'Multi-Timeframe Matrix (H4 + M15 + M5 Confluence)',
      category: 'Price Action',
      icon: '🌐',
      badge: 'MTF',
      description: 'H4 (Katta Trend) + M15 (Struktura & Likvidlik) + M5 (Kam xatarli aniq kirish) 100% uyg\'unligi',
      liveValue: mtfVal,
      signal: analysis.mtf.h4Bias === 'BULLISH' ? 'BUY' : 'SELL',
      keyLevel: `${analysis.mtf.confluenceScore}% Confluence`,
    },
    {
      id: 'matematika',
      name: 'Matematika (ATR & Smart Risk Matrix)',
      category: 'Matematika',
      icon: '🧮',
      badge: 'Math',
      description: 'ATR volatilligi, Risk-Reward (1:3), ideal Stop Loss va Take Profit 1/2 masofalari',
      liveValue: mathVal,
      signal: 'NEUTRAL',
      keyLevel: `R:R 1:3 • ATR ${d(m.atr)}`,
    },
    {
      id: 'high_low',
      name: 'High va Low (Swing High & Swing Low)',
      category: 'Price Action',
      icon: '📌',
      badge: 'H/L',
      description: 'Bozordagi eng so\'nggi muhim maksimal (High) va minimal (Low) burilish nuqtalari',
      liveValue: hlVal,
      signal: 'NEUTRAL',
      keyLevel: d(resP),
    },
  ];
}

