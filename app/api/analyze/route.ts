import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { AISignal } from '../../lib/types';
import { MISTAKE_REASON_LABELS } from '../../lib/signalsStore';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function getAILearningContext(): string {
  try {
    const filePath = path.join(process.cwd(), 'data', 'signals.json');
    if (!fs.existsSync(filePath)) return '';
    const raw = fs.readFileSync(filePath, 'utf-8');
    const signals: AISignal[] = JSON.parse(raw);
    if (!Array.isArray(signals) || signals.length === 0) return '';

    const losses = signals.filter(s => s.outcome === 'SL_HIT' || s.outcome === 'MISSED_LIMIT').slice(0, 4);
    const wins = signals.filter(s => s.outcome === 'TP_HIT').slice(0, 2);

    if (losses.length === 0 && wins.length === 0) return '';

    let prompt = `\n\n[AI O'RGANISH XOTIRASI VA OLDINGI XATOLARDAN SABOQLAR]:\n`;
    if (losses.length > 0) {
      prompt += `Oldingi xatolar va SL sabablari:\n`;
      losses.forEach((sig, i) => {
        const reason = sig.mistakeReason ? MISTAKE_REASON_LABELS[sig.mistakeReason] : (sig.mistakeNote || 'Likvidlik/trend xatosi');
        prompt += `- ${i + 1}) [${sig.symbol || sig.asset} ${sig.direction} @ ${sig.entry}]: Natija: ${sig.outcome === 'SL_HIT' ? 'SL urilgan' : 'Limitga yetmagan'}. Sabab: ${reason}.\n`;
      });
      prompt += `KO'RSATMA: Ushbu xatolarni inobatga olgan holda aniqroq FVG, xavfsiz Stop Loss va tasdiqlangan kirish darajasini belgilang!\n`;
    }
    if (wins.length > 0) {
      prompt += `Muvaffaqiyatli signallar:\n`;
      wins.forEach(sig => {
        prompt += `- [${sig.symbol || sig.asset} ${sig.direction} @ ${sig.entry} -> TP Oldi]\n`;
      });
    }
    return prompt;
  } catch {
    return '';
  }
}

export async function POST(req: NextRequest) {
  try {
    const incoming = await req.formData();
    const learningCtx = getAILearningContext();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Anthropic API kaliti (ANTHROPIC_API_KEY) .env faylida topilmadi" }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const anthropic = new Anthropic({ apiKey });
    const message = incoming.get('message') as string;
    const context = incoming.get('context') as string;

    const contentBlocks: Anthropic.MessageParam['content'] = [];
    const imageCount = parseInt((incoming.get('imageCount') as string) || '0', 10);

    if (imageCount > 0) {
      for (let i = 0; i < imageCount; i++) {
        const imgFile = incoming.get(`image_${i}`) as File | null;
        if (!imgFile) continue;
        const imageBuffer = await imgFile.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        let mediaType = (imgFile.type || 'image/jpeg') as string;
        if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mediaType)) {
          mediaType = 'image/jpeg';
        }

        if (imageCount > 1) {
          contentBlocks.push({ type: 'text', text: `📸 Rasm ${i + 1}:` });
        }
        contentBlocks.push({
          type: 'image',
          source: { type: 'base64', media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: base64Image },
        });
      }
    } else {
      const imageFile = incoming.get('image') as File | null;
      if (imageFile) {
        const imageBuffer = await imageFile.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        let mediaType = (imageFile.type || 'image/jpeg') as string;
        if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mediaType)) {
          mediaType = 'image/jpeg';
        }
        contentBlocks.push({
          type: 'image',
          source: { type: 'base64', media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: base64Image },
        });
      }
    }

    let fullMessage = '';
    if (context) {
      fullMessage += `📊 **Kalkulyator natijalari va kontekst:**\n${context}\n\n`;
    }
    if (learningCtx) {
      fullMessage += `${learningCtx}\n\n`;
    }
    fullMessage += message || 'Ushbu grafik/rasmni 18 ta SMC, ICT, SMT, Silver Bullet, Breaker Block va Ganna strategiyalari bo\'yicha to\'liq tahlil qilib bering.';

    contentBlocks.push({
      type: 'text',
      text: fullMessage,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const claudeStream = await anthropic.messages.stream({
            model: 'claude-fable-5',
            max_tokens: 4096,
            system: `Siz SMC (Smart Money Concepts), ICT, SMT Divergence, Silver Bullet, Breaker Block va Ganna Matematikasi bo'yicha eng kuchli xalqaro moliyaviy tahlilchisiz.

QAT'IY QOIDALAR:
1. SMART MONEY (SMC) O'Z VAQTIDA SIGNAL BERISH: Signallarni narx uzoqlashgandan keyin kech bermang! Likvidlik supurilgan nuqtada (Rejection Wick), 1m/5m CHoCH burilishida yoki mitigatsiya qilinmagan Order Block / 50% FVG retestida darhol o'z vaqtida signal bering.
2. STOP LOSS (SL) bozor shovqiniga bardosh beradigan xavfsiz zonaga (OB / Breaker / Swing H-L orqasiga) qo'yilishi shart. Oltinda SL kamida $8-$15 (80-150 pip), Bitcoinda $600-$1200 bo'lsin.
3. RISK-REWARD (R:R) kamida 1:2.5 bo'lsin (TP1 1.5x, TP2 3.0x).
4. Agar rasm/grafikda konfluensiya past yoki bozor konsolidatsiyada bo'lsa, Buyruq: ⏸️ KUTISH (NO TRADE) deb yozing.

Siz quyidagi ELITA SMC/ICT/SCALPING STRATEGIYALARI bo'yicha rasm va grafikni tahlil qilasiz:
1. 🏛️ Smart Money (SMC Tezkor & Aniq Kirish, Sweep + CHoCH)
2. 🧱 Order Block (OB Demand & Supply)
3. 🧱 Breaker Block (BB & Mitigation Block)
4. ⚡ Fair Value Gap (FVG 50% CE)
5. 🎯 Liquidity Pools (BSL / SSL High & Low Sweeps)
6. ⚡ SMT Divergence (DXY vs Asset Smart Money Technique)
7. 🎯 ICT Silver Bullet (60m likvidlik oynasi)
8. 🪤 ICT Judas Swing (Sessiya ochilish manipulyatsiyasi)
9. 📐 Fibonacci OTE (0.5 Eq, 0.618, 0.705 Sweet Spot, 0.786)
10. 🏛️ ICT (Killzones, Midnight Open, Power of 3 AMD)
11. 🌐 Multi-Timeframe Matrix (H4 Bias + M15 Struktura + M5 Trigger)
12. ⚡ Sniper Scalp (1m/5m Mikro-Impuls va tezkor skalping)

JAVOB FORMATI (O'ZBEK TILIDA):
📌 1. ANIQ SAVDO SIGNALI (Buyruq: 🟢 BUY / 🔴 SELL / ⏸️ KUTISH, ⚡ Kirish Vaqti: [Aynan hozir / Limit], Kirish, Xavfsiz Stop Loss, TP1, TP2, TP3, Confluence %)
🔍 2. 10 TA STRATEGIYALAR XULOSASI (Smart Money Timing, Topilgan barcha zonalar, SMT, Silver Bullet, Breaker Block, OTE)
💡 3. TREYDER UCHUN AMALIY MASLAHAT VA XATAR BOSHQARUVI`,
            messages: [
              {
                role: 'user',
                content: contentBlocks,
              },
            ],
          });

          for await (const chunk of claudeStream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              const dataChunk = `data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`;
              controller.enqueue(encoder.encode(dataChunk));
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          console.error('Claude API xatolik:', err);
          const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`)
          );
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
