import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Yahoo Finance'dan COMEX Gold (GC=F) soatlik ma'lumotlarini olish
async function fetchGoldData() {
  try {
    // Yahoo Finance v8 API — 1 soatlik interval, so'nggi 5 kun
    const quoteUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1h&range=5d';
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'application/json',
    };

    const res = await fetch(quoteUrl, { headers, next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Yahoo Finance HTTP ' + res.status);

    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) throw new Error('Yahoo Finance: natija topilmadi');

    const meta = result.meta;
    const quotes = result.indicators?.quote?.[0];
    const timestamps = result.timestamp;

    if (!quotes || !timestamps) throw new Error("Narx ma'lumotlari topilmadi");

    const len = timestamps.length;

    // So'nggi 24 soatlik (1h) shamollar
    const recentDays: { date: string; open: string; high: string; low: string; close: string }[] = [];
    for (let i = Math.max(0, len - 24); i < len; i++) {
      if (quotes.close[i] == null) continue;
      const dt = new Date(timestamps[i] * 1000);
      const dateStr = dt.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      recentDays.push({
        date: dateStr,
        open: (quotes.open[i] ?? 0).toFixed(2),
        high: (quotes.high[i] ?? 0).toFixed(2),
        low: (quotes.low[i] ?? 0).toFixed(2),
        close: (quotes.close[i] ?? 0).toFixed(2),
      });
    }

    const closes = (quotes.close as (number | null)[]).filter((c) => c !== null) as number[];
    const highs = (quotes.high as (number | null)[]).filter((h) => h !== null) as number[];
    const lows = (quotes.low as (number | null)[]).filter((l) => l !== null) as number[];

    const maxHigh = Math.max(...highs).toFixed(2);
    const minLow = Math.min(...lows).toFixed(2);

    // SMA20 — so'nggi 20 soatlik shamol
    const last20 = closes.slice(-20);
    const sma20 = last20.length > 0
      ? (last20.reduce((a, b) => a + b, 0) / last20.length).toFixed(2)
      : null;

    // SMA50 — so'nggi 50 soatlik shamol
    const last50 = closes.slice(-50);
    const sma50 = last50.length >= 20
      ? (last50.reduce((a, b) => a + b, 0) / last50.length).toFixed(2)
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
      currentPrice: meta.regularMarketPrice != null ? (meta.regularMarketPrice as number).toFixed(2) : 'N/A',
      previousClose: meta.previousClose != null ? (meta.previousClose as number).toFixed(2) : 'N/A',
      currency: meta.currency ?? 'USD',
      regularMarketDayHigh: meta.regularMarketDayHigh != null ? (meta.regularMarketDayHigh as number).toFixed(2) : 'N/A',
      regularMarketDayLow: meta.regularMarketDayLow != null ? (meta.regularMarketDayLow as number).toFixed(2) : 'N/A',
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh != null ? (meta.fiftyTwoWeekHigh as number).toFixed(2) : maxHigh,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow != null ? (meta.fiftyTwoWeekLow as number).toFixed(2) : minLow,
      sma20,
      sma50,
      rsi14,
      recentDays,
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

    const goldData = await fetchGoldData();

    let marketDataText = '';
    if (goldData) {
      const recentTable = goldData.recentDays
        .map((d) => '  ' + d.date + ': O=' + d.open + ' H=' + d.high + ' L=' + d.low + ' C=' + d.close)
        .join('\n');

      marketDataText =
        "📊 COMEX OLTIN (GC=F / XAU/USD) - REAL SOATLIK MA'LUMOTLAR\n" +
        'TradingView: https://www.tradingview.com/chart/mmKqMW9C/?symbol=COMEX%3AGC1%21\n' +
        '===========================================================\n' +
        'Joriy narx      : ' + goldData.currentPrice + ' ' + goldData.currency + '\n' +
        'Oldingi yopish  : ' + goldData.previousClose + '\n' +
        'Kunlik HIGH     : ' + goldData.regularMarketDayHigh + '\n' +
        'Kunlik LOW      : ' + goldData.regularMarketDayLow + '\n' +
        '52h MAX         : ' + goldData.fiftyTwoWeekHigh + '\n' +
        '52h MIN         : ' + goldData.fiftyTwoWeekLow + '\n' +
        'SMA 20 (soatlik): ' + (goldData.sma20 ?? 'N/A') + '\n' +
        'SMA 50 (soatlik): ' + (goldData.sma50 ?? 'N/A') + '\n' +
        'RSI 14 (soatlik): ' + (goldData.rsi14 ?? 'N/A') + '\n\n' +
        "So'nggi 24 soat (1H) OHLC shamollari:\n" +
        recentTable;
    } else {
      marketDataText = "⚠️ Real bozor ma'lumotlari olinmadi. Umumiy tahlil amalga oshiriladi.";
    }

    if (calcContext) {
      marketDataText += '\n\n📋 JORIY INSTRUMENT VA KALKULYATOR NATIJALARI:\n' + calcContext;
    }

    let systemPrompt = '';
    let userMessage = '';

    if (termMode === 'short') {
      systemPrompt =
        "Siz professional SCALPER treydersiz (SMC, ICT, Price Action mutaxassisi).\n" +
        "Sizning vazifangiz — FAQAT QISQA MUDDATLI (1 — 15 DAQIQA: 1m, 5m, 15m oraliqlari) bo'yicha aniq, o'ta tezkor va yuqori ehtimolli SCALP savdo signalini berish.\n\n" +
        "QISQA MUDDATLI (1-15m) TAHLIL TALABLARI:\n" +
        "1. ⚡ 1m, 5m va 15m oraliqlaridagi joriy momentum, mikro-trend va narx reaksiyasi\n" +
        "2. 🧲 Eng yaqin likvidlik olinishi (Liquidity Sweep) va 1-15m FVG / Order Block zonalari\n" +
        "3. 🎯 ANIQ TEZKOR KIRISH REJASI (O'zbek tilida):\n" +
        "   - Yo'nalish: BUY yoki SELL\n" +
        "   - Entry (Kirish narxi): aniq raqam (masalan: Entry: 2652.40)\n" +
        "   - Stop Loss (SL): qisqa va qat'iy scalping SL (masalan: Stop Loss: 2647.50)\n" +
        "   - Take Profit 1 (TP1): 1-15 daqiqalik tezkor birinchi maqsad\n" +
        "   - Take Profit 2 (TP2): asosiy qisqa muddatli maqsad\n" +
        "   - Take Profit 3 (TP3): kengaytirilgan scalp maqsad\n" +
        "   - R:R nisbati va 1-15m bo'yicha kirish sababi\n" +
        "4. ⚠️ 1-15 daqiqalik tezkor risklar va spread e'tibori\n\n" +
        "Javobni aniq, qisqa va tushunarli qilib O'ZBEK TILIDA bering. Aniq narxlarni ko'rsating!";

      userMessage =
        marketDataText +
        "\n\nIltimos, ushbu ma'lumotlar asosida FAQAT QISQA MUDDATLI (1 — 15 daqiqa: 1m-15m) scalping signali va tahlilini bering.";
    } else if (termMode === 'long') {
      systemPrompt =
        "Siz professional INTRADAY va DAY TRADING treydersiz (1 — 4 soatlik oraliqlar tahlilchisi).\n" +
        "Sizning vazifangiz — FAQAT UZOQ MUDDATLI (1 — 4 SOAT: 1h, 4h oraliqlari) bo'yicha mustahkam oraliq tahlili va kunlik maqsadlarni aniqlash.\n\n" +
        "UZOQ MUDDATLI (1-4 SOAT) TAHLIL TALABLARI:\n" +
        "1. 📈 1 Soatlik (1H) va 4 Soatlik (4H) asosiy trend yo'nalishi (Bullish / Bearish)\n" +
        "2. 🏛️ 1-4 soatlik kuchli Support va Resistance zonalari, Psixologik narx darajalari\n" +
        "3. 🎯 ANIQ 1-4 SOATLIK REJA (O'zbek tilida):\n" +
        "   - Yo'nalish: BUY yoki SELL\n" +
        "   - Entry (Kirish zonasi): aniq narx (masalan: Entry: 2642.00)\n" +
        "   - Stop Loss (SL): 1-4 soatlik himoyalangan SL (masalan: Stop Loss: 2628.00)\n" +
        "   - Take Profit 1 (TP1): 1-4 soatlik 1-asosiy maqsad\n" +
        "   - Take Profit 2 (TP2): kengaytirilgan kunlik maqsad\n" +
        "   - Take Profit 3 (TP3): 4 soatlik maksimal maqsad\n" +
        "4. 🌍 1-4 soatlik sessiyalar (London/NY) va iqtisodiy yangiliklar ta'siri\n\n" +
        "Javobni O'ZBEK TILIDA, aniq narx darajalari va batafsil tushuntirish bilan bering!";

      userMessage =
        marketDataText +
        "\n\nIltimos, ushbu ma'lumotlar asosida FAQAT UZOQ MUDDATLI (1 — 4 soat: 1h-4h) strategiya va maqsadli signallarni bering.";
    } else {
      systemPrompt =
        "Siz COMEX oltini va moliyaviy bozorlar bo'yicha professional tahlilchisiz.\n" +
        "Qisqa (1-15m) va Uzoq (1-4 soat) muddatli tahlilni O'ZBEK TILIDA bering. Aniq Entry, Stop Loss, TP1, TP2, TP3 darajalarini ko'rsating.";
      userMessage = marketDataText + "\n\nQisqa (1-15m) va uzoq (1-4 soat) muddatli bozor tahlilini bering.";
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const claudeStream = await anthropic.messages.stream({
            model: 'claude-opus-4-5',
            max_tokens: 4096,
            temperature: 1,
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
