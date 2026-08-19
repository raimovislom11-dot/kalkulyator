import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

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

// Yahoo Finance'dan tanlangan instrument va interval bo'yicha ma'lumotlarni olish
async function fetchMarketData(symbolKey: string = 'XAUUSD', termMode: string = 'short') {
  try {
    const yahooSymbol = YAHOO_SYMBOL_MAP[symbolKey.toUpperCase()] || 'GC=F';
    const isShort = termMode === 'short';
    const interval = isShort ? '5m' : '1h';
    const range = isShort ? '1d' : '5d';

    const quoteUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      yahooSymbol
    )}?interval=${interval}&range=${range}`;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
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
    const candleCount = isShort ? 24 : 24; // 24 ta 5m (oxirgi 2 soat) yoki 24 ta 1h (oxirgi 24 soat)

    const recentCandles: { date: string; open: string; high: string; low: string; close: string }[] = [];
    for (let i = Math.max(0, len - candleCount); i < len; i++) {
      if (quotes.close[i] == null) continue;
      const dt = new Date(timestamps[i] * 1000);
      const dateStr = dt.toISOString().replace('T', ' ').slice(11, 16) + ' UTC';
      recentCandles.push({
        date: dateStr,
        open: Number(quotes.open[i] ?? 0).toFixed(meta.priceHint || 2),
        high: Number(quotes.high[i] ?? 0).toFixed(meta.priceHint || 2),
        low: Number(quotes.low[i] ?? 0).toFixed(meta.priceHint || 2),
        close: Number(quotes.close[i] ?? 0).toFixed(meta.priceHint || 2),
      });
    }

    const closes = (quotes.close as (number | null)[]).filter((c) => c !== null) as number[];
    const highs = (quotes.high as (number | null)[]).filter((h) => h !== null) as number[];
    const lows = (quotes.low as (number | null)[]).filter((l) => l !== null) as number[];

    const maxHigh = highs.length ? Math.max(...highs).toFixed(meta.priceHint || 2) : 'N/A';
    const minLow = lows.length ? Math.min(...lows).toFixed(meta.priceHint || 2) : 'N/A';

    // SMA20
    const last20 = closes.slice(-20);
    const sma20 =
      last20.length > 0
        ? (last20.reduce((a, b) => a + b, 0) / last20.length).toFixed(meta.priceHint || 2)
        : null;

    // SMA50
    const last50 = closes.slice(-50);
    const sma50 =
      last50.length >= 20
        ? (last50.reduce((a, b) => a + b, 0) / last50.length).toFixed(meta.priceHint || 2)
        : null;

    // RSI14
    let rsi14: string | null = null;
    if (closes.length >= 15) {
      const changes = closes.slice(-15).map((c, i, arr) => (i === 0 ? 0 : c - arr[i - 1]));
      const gains = changes.filter((c) => c > 0);
      const losses = changes.filter((c) => c < 0).map((c) => Math.abs(c));
      const avgGain = gains.reduce((a, b) => a + b, 0) / 14;
      const avgLoss = losses.reduce((a, b) => a + b, 0) / 14;
      if (avgLoss === 0) {
        rsi14 = '100';
      } else {
        rsi14 = (100 - 100 / (1 + avgGain / avgLoss)).toFixed(1);
      }
    }

    return {
      symbol: meta.symbol,
      interval,
      currentPrice: meta.regularMarketPrice != null ? Number(meta.regularMarketPrice).toFixed(meta.priceHint || 2) : 'N/A',
      previousClose: meta.previousClose != null ? Number(meta.previousClose).toFixed(meta.priceHint || 2) : 'N/A',
      currency: meta.currency ?? 'USD',
      regularMarketDayHigh: meta.regularMarketDayHigh != null ? Number(meta.regularMarketDayHigh).toFixed(meta.priceHint || 2) : 'N/A',
      regularMarketDayLow: meta.regularMarketDayLow != null ? Number(meta.regularMarketDayLow).toFixed(meta.priceHint || 2) : 'N/A',
      periodHigh: maxHigh,
      periodLow: minLow,
      sma20,
      sma50,
      rsi14,
      recentCandles,
    };
  } catch (err) {
    console.error('Yahoo Finance xatolik:', err);
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
    const termMode = (formData.get('termMode') as string) || 'short'; // 'short' | 'long' | 'both'
    const assetSymbol = (formData.get('assetSymbol') as string) || 'XAUUSD';
    const assetName = (formData.get('assetName') as string) || 'Gold';
    const timeframe = (formData.get('timeframe') as string) || (termMode === 'short' ? '5m' : '1h');

    const marketData = await fetchMarketData(assetSymbol, termMode);

    let marketDataText = '';
    if (marketData) {
      const recentTable = marketData.recentCandles
        .map((d) => '  ' + d.date + ': O=' + d.open + ' H=' + d.high + ' L=' + d.low + ' C=' + d.close)
        .join('\n');

      const intervalLabel = marketData.interval === '5m' ? '5 DAQIQALIK (5M)' : '1 SOATLIK (1H)';

      marketDataText =
        `📊 ${assetName.toUpperCase()} (${assetSymbol}) - REAL BAZAR MA'LUMOTLARI (${intervalLabel})\n` +
        '===========================================================\n' +
        'Joriy narx          : ' + marketData.currentPrice + ' ' + marketData.currency + '\n' +
        'Oldingi yopilish    : ' + marketData.previousClose + '\n' +
        'Kunlik HIGH         : ' + marketData.regularMarketDayHigh + '\n' +
        'Kunlik LOW          : ' + marketData.regularMarketDayLow + '\n' +
        `Oraliq MAX (${marketData.interval}) : ` + marketData.periodHigh + '\n' +
        `Oraliq MIN (${marketData.interval}) : ` + marketData.periodLow + '\n' +
        `SMA 20 (${marketData.interval})    : ` + (marketData.sma20 ?? 'N/A') + '\n' +
        `SMA 50 (${marketData.interval})    : ` + (marketData.sma50 ?? 'N/A') + '\n' +
        `RSI 14 (${marketData.interval})    : ` + (marketData.rsi14 ?? 'N/A') + '\n\n' +
        `So'nggi ${marketData.recentCandles.length} ta (${marketData.interval}) OHLC shamollari:\n` +
        recentTable;
    } else {
      marketDataText = `⚠️ Real bozor ma'lumotlari to'liq olinmadi. Instrument: ${assetName} (${assetSymbol}), Vaqt oralig'i: ${timeframe}.`;
    }

    if (calcContext) {
      marketDataText += '\n\n📋 FOYDALANUVCHI SOZLAMALARI VA KALKULYATOR KONTEKSTI:\n' + calcContext;
    }

    let systemPrompt = '';
    let userMessage = '';

    if (termMode === 'short') {
      systemPrompt =
        `Siz professional ULTRA-QISQA MUDDATLI SCALPER treydersiz (SMC, ICT, Liquidity Sweep, 1m-5m-15m Price Action mutaxassisi).\n` +
        `Sizning vazifangiz — FAQAT QISQA MUDDATLI SCALPING (1 — 15 DAQIQA oralig'idagi tezkor kirish) bo'yicha signal berish.\n\n` +
        `⚠️ O'TA MUHIM SCALPING QOIDALARI:\n` +
        `1. STOP LOSS (SL) O'TA QISQA VA QAT'IY BO'LISHI SHART:\n` +
        `   - Oltin (XAU/USD) uchun: SL maksimal 1.5$ - 3.5$ masofada bo'lsin (masalan: Entry 2650.00 bo'lsa, SL 2647.50 dan oshmasin). Hech qachon 10-30 dollarlik ulkan stop loss bermang!\n` +
        `   - Valyutalar (EUR/USD, GBP/USD) uchun: SL maksimal 6 - 12 pip bo'lsin.\n` +
        `   - Kripto (BTC, ETH) uchun: SL 0.3% - 0.7% dan oshmasin.\n` +
        `   - Indekslar (US100, US30) uchun: SL 15 - 35 punkt bo'lsin.\n` +
        `2. TAKE PROFIT (TP) TEZKOR MAQSADLAR:\n` +
        `   - TP1: 1-5 daqiqalik tezkor birinchi scalp nishon (R:R 1:1 yoki 1:1.5)\n` +
        `   - TP2: 5-15 daqiqalik asosiy scalp nishon (R:R 1:2 yoki 1:2.5)\n` +
        `   - TP3: Mikro-likvidlik zonasigacha kengaytirilgan nishon (R:R 1:3)\n` +
        `3. ENTRY (KIRISH):\n` +
        `   - Joriy narx atrofida yoki eng yaqin 1m/5m FVG / Order Block / Sweep darajasida bo'lsin. Uzoq kutishni talab qiladigan daraja bo'lmasin!\n` +
        `4. SIGNAL FORMATI (Qat'iy quyidagi formatda ko'rsatilsin):\n` +
        `   Instrument: ${assetName} (${assetSymbol})\n` +
        `   Yo'nalish: BUY yoki SELL\n` +
        `   Entry: [aniq narx, masalan: 2650.20]\n` +
        `   Stop Loss: [qisqa scalp SL, masalan: 2647.70]\n` +
        `   TP1: [tezkor nishon]\n` +
        `   TP2: [asosiy nishon]\n` +
        `   TP3: [maksimal nishon]\n\n` +
        `Tahlilni o'zbek tilida, qisqa, professional va tezkor harakatga yo'naltirilgan tarzda bering.`;

      userMessage =
        marketDataText +
        `\n\nIltimos, ushbu 5m ma'lumotlar va joriy mikro-struktura asosida FAQAT QISQA MUDDATLI (1 — 15 daqiqa: 1m/5m/15m) SCALPING signali va tezkor tahlilini bering. Stop Loss va TP larni scalping qoidalariga mos ravishda qisqa bering.`;
    } else if (termMode === 'long') {
      systemPrompt =
        `Siz professional INTRADAY va SWING treydersiz (1 — 4 soatlik oraliqlar tahlilchisi).\n` +
        `Sizning vazifangiz — UZOQ MUDDATLI (1 — 4 SOAT: 1h, 4h oraliqlari) bo'yicha mustahkam oraliq tahlili va kunlik maqsadlarni aniqlash.\n\n` +
        `UZOQ MUDDATLI (1-4 SOAT) TAHLIL TALABLARI:\n` +
        `1. 📈 1H va 4H asosiy trend yo'nalishi va struktura\n` +
        `2. 🏛️ Katta H1/H4 Support va Resistance, Daily Liquidity zonalari\n` +
        `3. 🎯 ANIQ 1-4 SOATLIK REJA:\n` +
        `   - Yo'nalish: BUY yoki SELL\n` +
        `   - Entry: [aniq narx]\n` +
        `   - Stop Loss: [H1/H4 himoyalangan SL]\n` +
        `   - TP1: [1-4 soatlik 1-maqsad]\n` +
        `   - TP2: [kunlik asosiy maqsad]\n` +
        `   - TP3: [kengaytirilgan 4h maqsad]\n` +
        `4. London / New York sessiyalari ta'siri.\n\n` +
        `Javobni O'ZBEK TILIDA, aniq narx darajalari bilan bering!`;

      userMessage =
        marketDataText +
        `\n\nIltimos, ushbu 1H ma'lumotlar asosida FAQAT UZOQ MUDDATLI (1 — 4 soat: 1h-4h) strategiya va signallarni bering.`;
    } else {
      systemPrompt =
        `Siz moliyaviy bozorlar bo'yicha professional tahlilchisiz.\n` +
        `Qisqa (1-15m) va Uzoq (1-4 soat) muddatli tahlilni O'ZBEK TILIDA bering. Aniq Entry, Stop Loss, TP1, TP2, TP3 darajalarini ko'rsating.`;
      userMessage = marketDataText + `\n\nQisqa (1-15m) va uzoq (1-4 soat) muddatli bozor tahlilini bering.`;
    }

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

