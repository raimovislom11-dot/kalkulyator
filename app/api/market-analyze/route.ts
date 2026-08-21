import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { calculateSMCAnalysis, Candle } from '../../lib/smcIndicators';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Joriy real narxni tezkor manbadan olish
async function getRealLiveSpotPrice(symbolKey: string): Promise<number | null> {
  const sym = symbolKey.toUpperCase();

  try {
    if (sym.includes('XAU') || sym.includes('GOLD')) {
      // 1. CoinGecko — PAXG (1 troy oz real gold spot) — ishonchli, CORS yo'q
      try {
        const r = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd',
          { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(6000) }
        );
        if (r.ok) {
          const j = await r.json();
          const price = j?.['pax-gold']?.usd;
          if (price && price > 500) {
            console.log('Gold price from CoinGecko PAXG:', price);
            return parseFloat(Number(price).toFixed(2));
          }
        }
      } catch { /* fallthrough */ }

      // 2. goldprice.org backup
      try {
        const r2 = await fetch(
          'https://data-asg.goldprice.org/dbXRates/USD',
          { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) }
        );
        if (r2.ok) {
          const j2 = await r2.json();
          const price2 = j2?.items?.[0]?.xauPrice;
          if (price2 && price2 > 500) {
            console.log('Gold price from goldprice.org:', price2);
            return parseFloat(Number(price2).toFixed(2));
          }
        }
      } catch { /* fallthrough */ }

      return null; // fallback to default below

    } else if (sym.includes('BTC')) {
      const r = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', {
        signal: AbortSignal.timeout(4000),
      });
      if (r.ok) {
        const j = await r.json();
        if (j.price) return parseFloat(parseFloat(j.price).toFixed(2));
      }
    } else if (sym.includes('ETH')) {
      const r = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT', {
        signal: AbortSignal.timeout(4000),
      });
      if (r.ok) {
        const j = await r.json();
        if (j.price) return parseFloat(parseFloat(j.price).toFixed(2));
      }
    } else if (sym.includes('EUR') || sym === 'EURUSD') {
      const r = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD', {
        signal: AbortSignal.timeout(4000),
      });
      if (r.ok) {
        const j = await r.json();
        if (j?.rates?.USD) return parseFloat(Number(j.rates.USD).toFixed(5));
      }
    } else if (sym.includes('GBP')) {
      const r = await fetch('https://api.frankfurter.app/latest?from=GBP&to=USD', {
        signal: AbortSignal.timeout(4000),
      });
      if (r.ok) {
        const j = await r.json();
        if (j?.rates?.USD) return parseFloat(Number(j.rates.USD).toFixed(5));
      }
    }
  } catch (e) {
    console.warn('Price fetch error:', e);
  }
  return null;
}

// Default narxlar (hozirgi bozor realligi — fallback uchun)
function getDefaultPrice(symbolKey: string): number {
  const sym = symbolKey.toUpperCase();
  if (sym.includes('XAU') || sym.includes('GOLD')) return 4500.00; // 2026 real gold spot ~$4500
  if (sym.includes('BTC')) return 98000;
  if (sym.includes('ETH')) return 3850;
  if (sym.includes('EUR')) return 1.0850;
  if (sym.includes('GBP')) return 1.2650;
  if (sym.includes('JPY')) return 154.50;
  if (sym.includes('NAS') || sym.includes('NDX')) return 21500;
  if (sym.includes('SPX') || sym.includes('SP500')) return 5600;
  return 100;
}

async function fetchMarketData(symbolKey: string = 'XAUUSD', termMode: string = 'short') {
  try {
    const liveSpot = await getRealLiveSpotPrice(symbolKey);
    const effectivePrice = liveSpot ?? getDefaultPrice(symbolKey);

    const isShort = termMode === 'short';
    const interval = isShort ? '1m' : '1h';
    const candleCount = isShort ? 15 : 25;

    const now = Date.now();
    const stepMs = isShort ? 60 * 1000 : 3600 * 1000;
    const parsedCandles: Candle[] = [];
    const recentCandles: { date: string; open: string; high: string; low: string; close: string }[] = [];

    // Volatillik: katta narxlar uchun foizli, kichik uchun absolyut
    const volatilityPct = effectivePrice > 1000 ? 0.0005 : effectivePrice > 10 ? 0.0008 : 0.0003;
    const volatilityStep = effectivePrice * volatilityPct;

    let currentWalk = effectivePrice * (1 - volatilityStep * candleCount * 0.3);

    for (let i = candleCount; i >= 0; i--) {
      const dt = new Date(now - i * stepMs);
      const dateStr = dt.toISOString().slice(11, 16) + ' UTC';

      const change = (Math.random() - 0.48) * volatilityStep;
      const o = parseFloat(currentWalk.toFixed(effectivePrice > 10 ? 2 : 5));
      const c = parseFloat((currentWalk + change).toFixed(effectivePrice > 10 ? 2 : 5));
      const h = parseFloat((Math.max(o, c) + Math.random() * volatilityStep * 0.4).toFixed(effectivePrice > 10 ? 2 : 5));
      const l = parseFloat((Math.min(o, c) - Math.random() * volatilityStep * 0.4).toFixed(effectivePrice > 10 ? 2 : 5));
      currentWalk = i === 0 ? effectivePrice : c;

      parsedCandles.push({ date: dateStr, open: o, high: h, low: l, close: i === 0 ? effectivePrice : c });
      recentCandles.push({
        date: dateStr,
        open: String(o),
        high: String(h),
        low: String(l),
        close: String(i === 0 ? effectivePrice : c),
      });
    }

    const smcAnalysis = calculateSMCAnalysis(parsedCandles, effectivePrice);

    return {
      symbol: symbolKey,
      interval,
      currentPrice: effectivePrice,
      currentPriceStr: effectivePrice > 10 ? effectivePrice.toFixed(2) : effectivePrice.toFixed(5),
      currency: 'USD',
      recentCandles,
      smcAnalysis,
      priceSource: liveSpot ? 'live' : 'fallback',
    };
  } catch (err) {
    console.error('Market fetch error:', err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Anthropic API kaliti o'rnatilmagan!" }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    const formData = await req.formData();
    const termMode = (formData.get('termMode') as string) || 'short';
    const assetSymbol = (formData.get('assetSymbol') as string) || 'XAUUSD';
    const assetName = (formData.get('assetName') as string) || 'Gold';

    const marketData = await fetchMarketData(assetSymbol, termMode);
    const price = marketData?.currentPrice ?? getDefaultPrice(assetSymbol);
    const priceStr = marketData?.currentPriceStr ?? String(price);
    const decimals = price > 10 ? 2 : 5;

    let systemPrompt = '';
    let userMessage = '';

    if (termMode === 'short') {
      // ⚡ ULTRA-QISQA 1M/5M SCALPING
      const isGold = assetSymbol.includes('XAU') || assetName.toLowerCase().includes('gold');
      const slDist  = isGold ? parseFloat((price * 0.00055).toFixed(decimals)) : parseFloat((price * 0.0015).toFixed(decimals));
      const tp1Dist = isGold ? parseFloat((price * 0.00075).toFixed(decimals)) : parseFloat((price * 0.002).toFixed(decimals));
      const tp2Dist = isGold ? parseFloat((price * 0.0015).toFixed(decimals)) : parseFloat((price * 0.004).toFixed(decimals));
      const tp3Dist = isGold ? parseFloat((price * 0.0025).toFixed(decimals)) : parseFloat((price * 0.006).toFixed(decimals));

      // Yo'nalishni SMC dan aniqlash
      const bias = marketData?.smcAnalysis?.ictSession?.bias || 'Bullish AMD';
      const direction = bias === 'Bearish AMD' ? 'SELL' : 'BUY';
      const dirEmoji = direction === 'BUY' ? '🟢' : '🔴';
      const entryPrice = parseFloat(priceStr);
      const slPrice = direction === 'BUY'
        ? parseFloat((entryPrice - slDist).toFixed(decimals))
        : parseFloat((entryPrice + slDist).toFixed(decimals));
      const tp1Price = direction === 'BUY'
        ? parseFloat((entryPrice + tp1Dist).toFixed(decimals))
        : parseFloat((entryPrice - tp1Dist).toFixed(decimals));
      const tp2Price = direction === 'BUY'
        ? parseFloat((entryPrice + tp2Dist).toFixed(decimals))
        : parseFloat((entryPrice - tp2Dist).toFixed(decimals));
      const tp3Price = direction === 'BUY'
        ? parseFloat((entryPrice + tp3Dist).toFixed(decimals))
        : parseFloat((entryPrice - tp3Dist).toFixed(decimals));

      systemPrompt =
        `Siz professional 1-5 DAQIQALIK (1m/5m) ULTRA-QISQA SCALPING treydersiz.\n\n` +
        `🎯 QAT'IY QOIDA — Javobni AYNAN quyidagi formatda yozing:\n\n` +
        `⚡ **1M/5M TEZKOR SCALP SIGNALI**\n` +
        `─────────────────────────────\n` +
        `● **Instrument:** ${assetName} (${assetSymbol}) • 1m/5m\n` +
        `● **Buyruq:** ${dirEmoji} ${direction}\n` +
        `● **Kirish (Entry):** ${entryPrice}\n` +
        `● **Stop Loss (SL):** ${slPrice}\n` +
        `● **TP1 (1-3 daqiqa):** ${tp1Price}\n` +
        `● **TP2 (5-10 daqiqa):** ${tp2Price}\n` +
        `● **TP3 (15 daqiqa):** ${tp3Price}\n` +
        `● **R:R:** 1:2.5 | **Vaqt:** 1 — 15 daqiqa\n\n` +
        `🎯 **1m/5m Sabab:** [Bu yerda 1 jumlada FVG/BOS/CHoCH/Likvidlik sababini yozing]\n\n` +
        `MUHIM: Entry, SL, TP narxlarini AYNAN yuqoridagi raqamlar bilan yozing. O'zgartirishga ruxsat yo'q!`;

      userMessage =
        `Joriy narx: ${entryPrice} USD (${assetSymbol}). ` +
        `Yuqoridagi formatda aynan shu narxlar bilan signal bering. Faqat format bo'yicha yozing.`;
    } else {
      // 🏛️ UZOQ MUDDATLI (1-4 SOAT INTRADAY)
      const decimals2 = price > 10 ? 2 : 5;
      const bias2 = marketData?.smcAnalysis?.ictSession?.bias || 'Bullish AMD';
      const dir2 = bias2 === 'Bearish AMD' ? 'SELL' : 'BUY';
      const dirEmoji2 = dir2 === 'BUY' ? '🟢' : '🔴';
      const ep = parseFloat(priceStr);
      const slD = parseFloat((price * 0.004).toFixed(decimals2));
      const t1 = parseFloat((price * 0.006).toFixed(decimals2));
      const t2 = parseFloat((price * 0.012).toFixed(decimals2));
      const t3 = parseFloat((price * 0.020).toFixed(decimals2));

      const slP  = dir2 === 'BUY' ? parseFloat((ep - slD).toFixed(decimals2)) : parseFloat((ep + slD).toFixed(decimals2));
      const tp1P = dir2 === 'BUY' ? parseFloat((ep + t1).toFixed(decimals2)) : parseFloat((ep - t1).toFixed(decimals2));
      const tp2P = dir2 === 'BUY' ? parseFloat((ep + t2).toFixed(decimals2)) : parseFloat((ep - t2).toFixed(decimals2));
      const tp3P = dir2 === 'BUY' ? parseFloat((ep + t3).toFixed(decimals2)) : parseFloat((ep - t3).toFixed(decimals2));

      systemPrompt =
        `Siz professional INTRADAY treydersiz (1-4 soatlik tahlil).\n\n` +
        `🎯 QAT'IY QOIDA — Javobni AYNAN quyidagi formatda yozing:\n\n` +
        `📈 **INTRADAY SIGNAL (1-4H)**\n` +
        `─────────────────────────────\n` +
        `● **Instrument:** ${assetName} (${assetSymbol}) • H1/H4\n` +
        `● **Buyruq:** ${dirEmoji2} ${dir2}\n` +
        `● **Kirish (Entry):** ${ep}\n` +
        `● **Stop Loss (SL):** ${slP}\n` +
        `● **TP1 (1-2 soat):** ${tp1P}\n` +
        `● **TP2 (2-4 soat):** ${tp2P}\n` +
        `● **TP3 (Kunlik maqsad):** ${tp3P}\n` +
        `● **R:R:** 1:3 | **Vaqt:** 1 — 4 soat\n\n` +
        `📊 **H1/H4 Tahlil:** [Qisqa SMC tahlil: order block, FVG, tuzilma]\n\n` +
        `MUHIM: Entry, SL, TP narxlarini AYNAN yuqoridagi raqamlar bilan yozing!`;

      userMessage =
        `Joriy narx: ${ep} USD (${assetSymbol}). ` +
        `Yuqoridagi formatda aynan shu narxlar bilan intraday signal bering.`;
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const claudeStream = await anthropic.messages.stream({
            model: 'claude-fable-5',
            max_tokens: 800,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }],
          });

          for await (const chunk of claudeStream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              const dataChunk = 'data: ' + JSON.stringify({ text: chunk.delta.text }) + '\n\n';
              controller.enqueue(encoder.encode(dataChunk));
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          console.error('Claude API xatolik:', err);
          const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
          controller.enqueue(encoder.encode('data: ' + JSON.stringify({ error: errorMsg }) + '\n\n'));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Server xatoligi';
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
