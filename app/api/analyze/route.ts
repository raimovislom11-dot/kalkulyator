import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Anthropic API kaliti (ANTHROPIC_API_KEY) .env faylida o'rnatilmagan!" }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const formData = await req.formData();
    const message = formData.get('message') as string;
    const context = formData.get('context') as string;

    const contentBlocks: Anthropic.MessageParam['content'] = [];

    const imageCount = parseInt(formData.get('imageCount') as string || '0', 10);

    if (imageCount > 0) {
      for (let i = 0; i < imageCount; i++) {
        const imgFile = formData.get(`image_${i}`) as File | null;
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
      const imageFile = formData.get('image') as File | null;
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
            model: "claude-fable-5",
            max_tokens: 4096,
            system: `Siz SMC (Smart Money Concepts), ICT, SMT Divergence, Silver Bullet, Breaker Block va Ganna Matematikasi bo'yicha eng kuchli xalqaro moliyaviy tahlilchisiz.

Siz quyidagi 18 TA PROFESSIONAL STRATEGIYALAR bo'yicha rasm va grafikni tahlil qilasiz:
1. 🧱 Order Block (OB Demand & Supply)
2. 🧱 Breaker Block (BB) & Mitigation Block
3. ⚡ FVG (Fair Value Gap 50% CE)
4. 🔄 iFVG (Inverted Fair Value Gap)
5. ⚡ SMT Divergence (DXY vs Gold / Yirik o'yinchilar tuzog'i)
6. 🎯 ICT Silver Bullet (60m likvidlik oynasi)
7. 🪤 ICT Judas Swing (Sessiya ochilish manipulyatsiyasi)
8. 📊 SNR (Support & Resistance)
9. 📐 Fibonacci OTE (0.5 Eq, 0.618, 0.705 Sweet Spot, 0.786)
10. ✨ Ganna Kvadrat Darajalari (Square of 9: 90°, 180°, 270°, 360°)
11. 🎯 Liquidity (BSL / SSL High & Low)
12. 🕯️ Yolg'iz Sham (Institutional Displacement)
13. 🏛️ ICT (Killzones, Midnight Open, Power of 3 AMD)
14. ⚡ BOS (Break of Structure)
15. 🔄 CHoCH (Change of Character)
16. 🌐 Multi-Timeframe Matrix (H4 Bias + M15 Struktura + M5 Trigger)
17. 🧮 Matematika & Smart Risk (ATR, R:R 1:3, qisqa SL)
18. 📌 High va Low (Swing High & Low)

JAVOB FORMATI (O'ZBEK TILIDA):
📌 1. ANIQ SAVDO SIGNALI (Buyruq: BUY/SELL, Kirish, Stop Loss, TP1, TP2, TP3, Confluence %)
🔍 2. 18 TA STRATEGIYALAR XULOSASI (Topilgan barcha zonalar, SMT, Silver Bullet, Breaker Block)
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
          const errorMsg = err instanceof Error
            ? `${err.message}${(err as { status?: number }).status ? ` (status: ${(err as { status?: number }).status})` : ''}`
            : JSON.stringify(err);
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
