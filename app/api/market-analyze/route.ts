import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { calculateSMCAnalysis, Candle } from '../../lib/smcIndicators';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const YAHOO_SYMBOL_MAP: Record<string, string> = {
  XAUUSD: 'GC=F',
  EURUSD: 'EURUSD=X',
  GBPUSD: 'GBPUSD=X',
  BTCUSD: 'BTC-USD',
  ETHUSD: 'ETH-USD',
  US100: 'NQ=F',
  US30: 'YM=F',
};

// Yahoo Finance'dan ma'lumotlarni olish
async function fetchMarketData(symbolKey: string = 'XAUUSD', termMode: string = 'short', baseUserPrice?: number) {
  try {
    const yahooSymbol = YAHOO_SYMBOL_MAP[symbolKey.toUpperCase()] || 'GC=F';
    const isShort = termMode === 'short';
    const interval = isShort ? '5m' : '1h';
    const range = isShort ? '1d' : '5d';

    const quoteUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      yahooSymbol
    )}?interval=${interval}&range=${range}`;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      Accept: 'application/json',
    };

    const res = await fetch(quoteUrl, { headers, next: { revalidate: isShort ? 10 : 60 } });
    if (!res.ok) throw new Error('Yahoo Finance HTTP ' + res.status);

    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) throw new Error('Yahoo Finance: natija topilmadi');

    const meta = result.meta;
    const quotes = result.indicators?.quote?.[0];
    const timestamps = result.timestamp;

    if (!quotes || !timestamps) throw new Error("Narx ma'lumotlari topilmadi");

    const len = timestamps.length;
    const candleCount = isShort ? 25 : 25;

    const recentCandles: { date: string; open: string; high: string; low: string; close: string }[] = [];
    const parsedCandles: Candle[] = [];

    // Agar foydalanuvchi spot narxi berilgan bo'lsa va yahoo futures narxi bilan farq qilsa, offsetni moslash
    const rawYahooLastPrice = quotes.close[quotes.close.length - 1] ?? meta.regularMarketPrice ?? baseUserPrice;
    const priceOffset = baseUserPrice && rawYahooLastPrice ? baseUserPrice - rawYahooLastPrice : 0;

    for (let i = Math.max(0, len - candleCount); i < len; i++) {
      if (quotes.close[i] == null) continue;
      const dt = new Date(timestamps[i] * 1000);
      const dateStr = dt.toISOString().replace('T', ' ').slice(11, 16) + ' UTC';

      const o = Number((quotes.open[i] + priceOffset).toFixed(meta.priceHint || 2));
      const h = Number((quotes.high[i] + priceOffset).toFixed(meta.priceHint || 2));
      const l = Number((quotes.low[i] + priceOffset).toFixed(meta.priceHint || 2));
      const c = Number((quotes.close[i] + priceOffset).toFixed(meta.priceHint || 2));

      recentCandles.push({
        date: dateStr,
        open: o.toFixed(meta.priceHint || 2),
        high: h.toFixed(meta.priceHint || 2),
        low: l.toFixed(meta.priceHint || 2),
        close: c.toFixed(meta.priceHint || 2),
      });

      parsedCandles.push({
        date: dateStr,
        open: o,
        high: h,
        low: l,
        close: c,
      });
    }

    const currentCalculatedPrice = baseUserPrice || (meta.regularMarketPrice != null ? Number(meta.regularMarketPrice) + priceOffset : parsedCandles[parsedCandles.length - 1]?.close);
    const smcAnalysis = calculateSMCAnalysis(parsedCandles, currentCalculatedPrice);

    return {
      symbol: meta.symbol,
      interval,
      currentPrice: currentCalculatedPrice.toFixed(meta.priceHint || 2),
      previousClose: (meta.previousClose ? meta.previousClose + priceOffset : currentCalculatedPrice).toFixed(meta.priceHint || 2),
      currency: meta.currency ?? 'USD',
      recentCandles,
      smcAnalysis,
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
    const calcContext = (formData.get('calcContext') as string) || '';
    const termMode = (formData.get('termMode') as string) || 'short';
    const assetSymbol = (formData.get('assetSymbol') as string) || 'XAUUSD';
    const assetName = (formData.get('assetName') as string) || 'Gold';
    const timeframe = (formData.get('timeframe') as string) || (termMode === 'short' ? '5m' : '1h');
    const userPriceRaw = formData.get('userCurrentPrice') as string;

    // Entry yoki foydalanuvchi joriy narxini kontekstdan ajratib olish
    const entryMatch = calcContext?.match(/(?:Kirish|Entry|Narx)\s*[:=]\s*([0-9.]+)/i);
    const baseUserPrice = userPriceRaw ? parseFloat(userPriceRaw) : entryMatch ? parseFloat(entryMatch[1]) : undefined;

    const marketData = await fetchMarketData(assetSymbol, termMode, baseUserPrice);

    const actualEffectivePrice = baseUserPrice || (marketData ? parseFloat(marketData.currentPrice) : 2915.5);

    let marketDataText = '';
    marketDataText += `🎯 TREYDER GRAFIK VA ASOSIY NARXI: ${actualEffectivePrice} USD\n`;
    marketDataText += `===========================================================\n`;
    marketDataText += `⚠️ QAT'IY TALAB: Barcha Entry, Stop Loss, Take Profit, Order Block va FVG zonalari\n`;
    marketDataText += `FAQAT VA FAQAT ${actualEffectivePrice} USD narxiga 100% mos bo'lishi SHART!\n`;
    marketDataText += `Grafikdagi narxdan boshqa narx berish qat'iyan man etiladi.\n\n`;

    if (calcContext) {
      marketDataText += '📊 Kalkulyator Sozlamalari:\n' + calcContext + '\n\n';
    }

    if (marketData && marketData.smcAnalysis) {
      const smc = marketData.smcAnalysis;
      marketDataText +=
        `📈 SMC & ICT STRATEGIYA DARAJALARI (Joriy Narx: ${actualEffectivePrice}):\n` +
        `- Order Block: ${smc.orderBlocks.map((b) => `${b.type}: ${b.bottom} - ${b.top}`).join(' | ') || 'Neytral'}\n` +
        `- FVG 50% CE: ${smc.fvgs.map((f) => `${f.midpoint}`).join(' | ') || 'N/A'}\n` +
        `- Fibonacci OTE (0.705): ${smc.fibOte ? `0.705 Sweet Spot: ${smc.fibOte.levels.fib0705}, 0.5 Eq: ${smc.fibOte.levels.fib050}` : 'N/A'}\n` +
        `- Ganna Kvadrat 90°/180°: ${smc.gann ? `90°=${smc.gann.degrees.deg90}, 180°=${smc.gann.degrees.deg180}` : 'N/A'}\n` +
        `- Liquidity: BSL=${(actualEffectivePrice * 1.006).toFixed(2)}, SSL=${(actualEffectivePrice * 0.994).toFixed(2)}\n` +
        `- Matematik Tavsiya SL: ${(actualEffectivePrice - smc.math.idealSLDistance).toFixed(2)}, TP1: ${(actualEffectivePrice + smc.math.idealTP1).toFixed(2)}, TP2: ${(actualEffectivePrice + smc.math.idealTP2).toFixed(2)}\n\n`;
    }

    const systemPrompt =
      `Siz professional SMC/ICT treyder va aniq tahlilchisiz.\n` +
      `🎯 ENG ASOSIY QOIDA: Treyderning grafikdagi joriy narxi: ${actualEffectivePrice} USD.\n` +
      `Siz beradigan barcha kirish nuqtalari (Entry), Stop Loss, TP1, TP2, TP3, Order Block va FVG narxlari\n` +
      `grafikdagi ayni shu ${actualEffectivePrice} USD narxi atrofida 100% aniq mos bo'lishi SHART!\n` +
      `Hech qanday boshqa futures yoki chetdagi narxlarni aralashtirmang, bu treyderni chalg'itadi.\n\n` +
      `Reja formati (O'zbek tilida):\n` +
      `1. 🎯 SIGNAL:\n` +
      `   - Instrument: ${assetName} (${assetSymbol})\n` +
      `   - Buyruq: BUY yoki SELL\n` +
      `   - Entry: ${actualEffectivePrice} atrofida\n` +
      `   - Stop Loss: [aniq qisqa SL]\n` +
      `   - TP1 / TP2 / TP3: [aniq darajalar]\n` +
      `   - Risk/Reward: [1:2 yoki 1:3]\n\n` +
      `2. 🔍 13 TA STRATEGIYALAR XULOSASI (Order Block, FVG, Ganna, Fib OTE 0.705, Liquidity, Matematika)\n` +
      `3. 💡 TREYDERGA TAVSIYA`;

    const userMessage =
      marketDataText +
      `\n\nIltimos, grafikdagi haqiqiy ${actualEffectivePrice} narxiga 100% mos keladigan, treyderni chalg'itmaydigan aniq tahlil va signallarni bering.`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const claudeStream = await anthropic.messages.stream({
            model: 'claude-opus-4-5',
            max_tokens: 4096,
            temperature: 0.7,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }],
            thinking: { type: 'disabled' },
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
