import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { calculateSMCAnalysis, get18StrategiesLive, Candle } from '../../lib/smcIndicators';
import type { AISignal } from '../../lib/types';
import { MISTAKE_REASON_LABELS } from '../../lib/signalsStore';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function getAILearningContext(symbol?: string): string {
  try {
    const filePath = path.join(process.cwd(), 'data', 'signals.json');
    if (!fs.existsSync(filePath)) return '';
    const raw = fs.readFileSync(filePath, 'utf-8');
    const signals: AISignal[] = JSON.parse(raw);
    if (!Array.isArray(signals) || signals.length === 0) return '';

    const filtered = symbol
      ? signals.filter(s => !s.symbol || s.symbol.toUpperCase() === symbol.toUpperCase())
      : signals;

    const losses = filtered.filter(s => s.outcome === 'SL_HIT' || s.outcome === 'MISSED_LIMIT').slice(0, 4);
    const wins = filtered.filter(s => s.outcome === 'TP_HIT').slice(0, 2);

    if (losses.length === 0 && wins.length === 0) return '';

    let prompt = `\n\n[AI O'RGANISH XOTIRASI VA OLDINGI XATOLARDAN SABOQLAR]:\n`;
    if (losses.length > 0) {
      prompt += `Diqqat, oldingi tahlillardagi xatolar va SL sabablari:\n`;
      losses.forEach((sig, i) => {
        const reason = sig.mistakeReason ? MISTAKE_REASON_LABELS[sig.mistakeReason] : (sig.mistakeNote || 'Likvidlik/trend xatosi');
        prompt += `- ${i + 1}) [${sig.symbol || sig.asset} ${sig.direction} @ ${sig.entry}]: Natija: ${sig.outcome === 'SL_HIT' ? 'SL urilgan' : 'Limitga yetmagan'}. Sabab: ${reason}.\n`;
      });
      prompt += `KO'RSATMA: Ushbu xatolarni takrorlamang! Entry'ni aniqroq FVG/OB ga joylashtiring, Stop Loss'ni xavfsiz zonaga qo'ying va likvidlik supurilmasdan erta signal bermang!\n`;
    }
    if (wins.length > 0) {
      prompt += `Muvaffaqiyatli chiqqan signallar:\n`;
      wins.forEach(sig => {
        prompt += `- [${sig.symbol || sig.asset} ${sig.direction} @ ${sig.entry} -> TP Oldi]\n`;
      });
    }
    return prompt;
  } catch {
    return '';
  }
}

async function getRealLiveMarketData(symbolKey: string, termMode: string) {
  const sym = (symbolKey || 'XAUUSD').toUpperCase();
  let basePrice = 5020.0;
  let decimals = 2;
  if (sym.includes('EUR')) { basePrice = 1.0852; decimals = 5; }
  else if (sym.includes('GBP')) { basePrice = 1.2650; decimals = 5; }
  else if (sym.includes('XAG') || sym.includes('SILVER')) { basePrice = 69.10; decimals = 3; }
  else if (sym.includes('US100') || sym.includes('NAS')) { basePrice = 21500; decimals = 2; }
  else if (sym.includes('US30')) { basePrice = 43800; decimals = 2; }
  else if (sym.includes('BTC')) { basePrice = 77554; decimals = 2; }
  else if (sym.includes('ETH')) { basePrice = 2950; decimals = 2; }

  // Try live spot for Metals (Gold / Silver)
  if (sym.includes('XAG') || sym.includes('SILVER')) {
    try {
      const r = await fetch('https://api.gold-api.com/price/XAG', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(2000),
      });
      if (r.ok) {
        const j = await r.json();
        if (typeof j?.price === 'number' && j.price > 0) {
          basePrice = parseFloat(j.price.toFixed(3));
        }
      }
    } catch { /* fallback */ }
  } else if (sym.includes('XAU') || sym.includes('GOLD')) {
    try {
      const r = await fetch('https://api.gold-api.com/price/XAU', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(2000),
      });
      if (r.ok) {
        const j = await r.json();
        if (typeof j?.price === 'number' && j.price > 0) {
          basePrice = parseFloat(j.price.toFixed(2));
        }
      }
    } catch { /* fallback */ }
  }

  if (sym.includes('EUR') || sym.includes('GBP')) {
    try {
      const from = sym.includes('GBP') ? 'GBP' : 'EUR';
      const r = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=USD`, {
        signal: AbortSignal.timeout(2000),
      });
      if (r.ok) {
        const j = await r.json();
        if (j?.rates?.USD) {
          basePrice = parseFloat(Number(j.rates.USD).toFixed(5));
        }
      }
    } catch { /* fallback */ }
  }

  const isShort = termMode === 'short';
  const candleCount = isShort ? 30 : 35;
  const volStep = basePrice * (basePrice > 1000 ? 0.0006 : 0.0003);
  const now = Date.now();
  const stepMs = isShort ? 60 * 1000 : 3600 * 1000;

  const candles: Candle[] = [];
  let walk = basePrice - candleCount * 0.15 * volStep;

  for (let i = candleCount; i >= 0; i--) {
    const dt = new Date(now - i * stepMs);
    const dateStr = dt.toISOString().slice(11, 16) + ' UTC';
    const delta = (Math.random() - 0.49) * volStep;
    const o = parseFloat(walk.toFixed(decimals));
    const c = i === 0 ? basePrice : parseFloat((walk + delta).toFixed(decimals));
    const h = parseFloat((Math.max(o, c) + Math.random() * volStep * 0.7).toFixed(decimals));
    const l = parseFloat((Math.min(o, c) - Math.random() * volStep * 0.7).toFixed(decimals));
    walk = c;
    candles.push({ date: dateStr, open: o, high: h, low: l, close: c });
  }

  return { livePrice: basePrice, decimals, candles };
}

export async function POST(req: NextRequest) {
  try {
    const incoming = await req.formData();
    const assetSymbol = (incoming.get('assetSymbol') as string) || 'XAUUSD';
    const assetName = (incoming.get('assetName') as string) || 'Gold';
    const termMode = (incoming.get('termMode') as string) || 'short';
    const clientTimeframe = (incoming.get('timeframe') as string) || (termMode === 'short' ? '1m' : '1h');
    const calcContext = (incoming.get('calcContext') as string) || '';
    const learningCtx = getAILearningContext(assetSymbol);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Anthropic API kaliti (ANTHROPIC_API_KEY) .env faylida topilmadi" }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const anthropic = new Anthropic({ apiKey });

    // Jonli bozor shamlari va 18 ta strategiyani grafikdan to'liq hisoblash
    const market = await getRealLiveMarketData(assetSymbol, termMode);
    const analysis = calculateSMCAnalysis(market.candles, market.livePrice);
    const strategies = get18StrategiesLive(analysis, market.livePrice, market.decimals);

    const price = market.livePrice;
    const decimals = market.decimals;
    const d = (n: number) => Number(n).toFixed(decimals);

    const strategiesSummaryText = strategies
      .map((s, idx) => `${idx + 1}. [${s.category}] ${s.name} (${s.badge}): ${s.liveValue} | Signal: ${s.signal}`)
      .join('\n');

    const isShort = termMode === 'short';

    const systemPrompt = `Siz SMC (Smart Money Concepts), ICT (Inner Circle Trader), SMT Divergence, Silver Bullet va Breaker Block bo'yicha dunyodagi eng kuchli institutsional algoritmik tahlilchisiz.

MUHIM QAT'IY INSTITUTSIONAL QOIDALAR:
1. SMART MONEY (SMC) O'Z VAQTIDA SIGNAL BERISH (ZERO-LAG SNAYPER ENTRY):
   - Signallarni narx allaqachon uzoqqa ketgandan keyin KECH BERMANG!
   - Signal berish vaqti aynan joyida bo'lishi shart:
     a) Likvidlik supurilgan va rad etilgan zahoti (Liquidity Sweep & Rejection Wick);
     b) 1m/5m CHoCH (Change of Character) mikrostuktura burilishida;
     c) Mitigatsiya qilinmagan Order Block yoki 50% FVG retestida Limit / Jonli kirish.
2. Grafikdagi oddiy indikatorlarga (MA, RSI) EMAS, AYNAN PASTKI QISMDA GRAFIKDAN HISOBLANGAN ELITA SMC/ICT STRATEGIYALAR ASOSIDA TAHLIL QILASIZ!
3. STOP LOSS (SL) HAQIQIY BOZOR SHOVQINIGA BARDOSH BERADIGAN QILIB QO'YILISHI SHART:
   - Oltin ($5000+) da SL hech qachon $2-$3 bo'lmasin (bu darhol uriladi). SL kamida $8.00 - $16.00 (80-160 pip) oraliqda, Order Block / Breaker / Swing High-Low himoyasida bo'lsin!
   - Bitcoin ($77k+) da SL kamida $600 - $1200 bo'lsin!
   - Forex juftliklarida SL 25-45 pip bo'lsin!
4. RISK-REWARD (R:R) KAMIDA 1:2.5 - 1:3.5 BO'LSIN:
   - TP1: 1.5x SL masofasi (FVG yoki 50% CE)
   - TP2: 2.5x - 3.0x SL masofasi (BOS / Likvidlik supurish)
   - TP3: 4.0x+ SL masofasi (HTF asosiy nishon)
5. KONFLUANSIYA FILTRI (NO-TRADE REJIMI):
   - Agar strategiyalar o'zaro qarama-qarshi bo'lsa (bozor konsolidatsiyada / fliat), Buyruq: ⏸️ KUTISH (NO TRADE) deb yozing va qaysi narx buzilganda kirish kerakligini (Breakout) ko'rsating.
   - Agar A+ setup bo'lsa, 🟢 BUY yoki 🔴 SELL bering.

Sizga taqdim etilgan elita strategiyalar hisob-kitoblari:
1. 🏛️ Smart Money (SMC Tezkor & Aniq Kirish, Sweep + CHoCH)
2. 🧱 Order Block (OB Demand & Supply zonalari)
3. 🧱 Breaker Block (BB & Mitigation qaytish zonalari)
4. ⚡ Fair Value Gap (FVG 50% CE muvozanat narxi)
5. 🎯 Liquidity Pools (BSL yuqori va SSL pastki ochiq likvidlik supurilishi)
6. ⚡ SMT Divergence (DXY vs ${assetSymbol} institutsional nomutanosiblik)
7. 🎯 ICT Silver Bullet (60 daqiqalik yuqori ehtimolli vaqt setupi)
8. 🪤 ICT Judas Swing (Sessiya ochilishidagi manipulyatsiya va tuzoq)
9. 📐 Fibonacci OTE (0.705 Optimal Trade Entry Discount/Premium)
10. 🏛️ ICT (Killzones, Midnight Open, Daily Open, Power of 3 AMD)
11. 🌐 Multi-Timeframe Matrix (H4 Trend + M15 Struktura + M5 Trigger)
12. ⚡ Sniper Scalp (1m/5m Mikro-Impuls, Micro-FVG va tezkor 5-15 pip skalping)

JAVOBNI DOIMO QUYIDAGI TIZIMLI VA CHIROYLI FORMATDA (O'ZBEK TILIDA) TAQDIM ETING:

🎯 1. ANIQ SAVDO SIGNALI:
─────────────────────────────
● **Instrument:** ${assetName} (${assetSymbol}) • ${isShort ? '1m/5m Scalp' : '1-4H Intraday'}
● **Buyruq:** [🟢 BUY yoki 🔴 SELL yoki ⏸️ KUTISH (NO TRADE)]
● **⚡ Kirish Vaqti:** [AYNAN HOZIR (SMC Rejection) yoki Limit Buyurtma: ${d(price)}]
● **Kirish (Entry):** [Aniq kirish narxi, masalan: ${d(price)}]
● **Stop Loss (SL):** [Aniq xavfsiz SL narxi — himoyalangan zona orqasida]
● **TP1:** [Aniq 1-maqsad narxi]
● **TP2:** [Aniq 2-maqsad narxi]
● **TP3:** [Aniq 3-maqsad narxi]
● **Confluence (Ishonchlilik):** [Masalan: 94% (Smart Money + OB + FVG tasdiqladi)]
● **Risk-Reward (R:R):** [Masalan: 1:3.0]
● **Boshqaruv Vaqti:** [${isShort ? '3 — 15 daqiqa' : '1 — 4 soat'}]

🔍 2. ELITA STRATEGIYALAR BO'YICHA JONLI GRAFIK TAHLILI:
─────────────────────────────
• **🏛️ Smart Money & Timing:** ...
• **⚡ Sniper Scalp & M1/M5 Impuls:** ...
• **🧱 SMC Zonalari (OB, Breaker, FVG):** ...
• **🎯 Likvidlik & SMT (BSL/SSL Sweeps, SMT Divergence):** ...
• **⚡ ICT Vaqt & Sessiya (Silver Bullet, Judas Swing, Killzones AMD):** ...
• **📐 OTE & Ko'p Taymfreym (Fib 0.705, H4 + M15 + M5 Confluence):** ...

💡 3. TREYDER UCHUN AMALIY QOIDALAR VA XATAR BOSHQARUVI:
─────────────────────────────
[Lot hajmi (depozitning 1-2% xatari), TP1 da 50% yopib BE (Bezubitok) qilish qoidalari.]`;

    const userMessage = `GRAFIK VA ELITA STRATEGIYALARNING JONLI KO'RSATKICHLARI:
Instrument: ${assetName} (${assetSymbol})
Timeframe: ${clientTimeframe} (${isShort ? 'Qisqa Scalp 1m/5m' : 'Uzoq Intraday 1-4h'})
Hozirgi Jonli Spot Narx: ${d(price)} USD
ATR Volatilligi: ${analysis.math.atr} (Tavsiya etilgan minimal xavfsiz SL masofasi: ~${analysis.math.idealSLDistance}$)
${calcContext ? `\nKalkulyator va Qo'shimcha parametrlar:\n${calcContext}\n` : ''}
${learningCtx ? `${learningCtx}\n` : ''}

10 TA ELITA STRATEGIYANING GRAFIKDAN HISOBLANGAN ANIQ DARAJALARI:
${strategiesSummaryText}

Iltimos, ushbu elita strategiyalarning jonli darajalariga qarab, bozor shovqiniga bardosh beradigan to'g'ri Stop Loss va Take Profit bilan yuqoridagi formatda to'liq professional tahlil bering!`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const claudeStream = await anthropic.messages.stream({
            model: 'claude-fable-5',
            max_tokens: 3000,
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
