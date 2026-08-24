import { NextRequest, NextResponse } from 'next/server';
import { calculateSMCAnalysis, get18StrategiesLive, Candle } from '../../lib/smcIndicators';
import { API_BASE_URL } from '../../lib/api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') || 'XAUUSD';
  const timeframe = searchParams.get('timeframe') || '1h';

  // 1. Try fetching from remote Spring Boot backend
  try {
    const backendUrl = `${API_BASE_URL}/api/market-candles?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}`;
    const backendRes = await fetch(backendUrl, {
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    });
    if (backendRes.ok) {
      const data = await backendRes.json();
      return NextResponse.json(data);
    }
  } catch {
    // fallback to local calculation
  }

  // 2. Local fallback calculation
  try {
    let basePrice = symbol.includes('XAU') || symbol.includes('GOLD') ? 4655.0
      : symbol.includes('BTC') ? 77500.0
      : symbol.includes('ETH') ? 2950.0
      : 1.0850;

    const candleCount = 30;
    const decimals = basePrice > 10 ? 2 : 5;
    const volStep = basePrice * (basePrice > 1000 ? 0.0006 : 0.0003);
    const now = Date.now();
    const stepMs = 3600 * 1000;

    const candles: Candle[] = [];
    let walk = basePrice - candleCount * 0.1 * volStep;

    for (let i = candleCount; i >= 0; i--) {
      const dt = new Date(now - i * stepMs);
      const dateStr = dt.toISOString().slice(11, 16) + ' UTC';
      const delta = (Math.random() - 0.49) * volStep;
      const o = parseFloat(walk.toFixed(decimals));
      const c = i === 0 ? basePrice : parseFloat((walk + delta).toFixed(decimals));
      const h = parseFloat((Math.max(o, c) + Math.random() * volStep * 0.6).toFixed(decimals));
      const l = parseFloat((Math.min(o, c) - Math.random() * volStep * 0.6).toFixed(decimals));
      walk = c;
      candles.push({ date: dateStr, open: o, high: h, low: l, close: c });
    }

    const analysis = calculateSMCAnalysis(candles, basePrice);
    const strategies = get18StrategiesLive(analysis, basePrice, decimals);

    return NextResponse.json({
      success: true,
      symbol,
      timeframe,
      price: basePrice,
      decimals,
      candles,
      analysis,
      strategies,
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Xatolik' }, { status: 500 });
  }
}
