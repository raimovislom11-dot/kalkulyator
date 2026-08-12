import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

export const maxDuration = 60; // 1-minute timeout for Vercel
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

    // Xabar tuzish
    const contentBlocks: Anthropic.MessageParam['content'] = [];

    // Ko'p rasm qabul qilish
    const imageCount = parseInt(formData.get('imageCount') as string || '0', 10);

    if (imageCount > 0) {
      for (let i = 0; i < imageCount; i++) {
        const imgFile = formData.get(`image_${i}`) as File | null;
        if (!imgFile) continue;
        const imageBuffer = await imgFile.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        let mediaType = (imgFile.type || 'image/jpeg') as string;
        if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mediaType)) {
          mediaType = 'image/jpeg'; // iOS HEIC or other types should be treated as jpeg if accept attribute forces conversion, otherwise API will reject it anyway, but we must send a valid enum value
        }

        // Agar bir nechta rasm bo'lsa — har birining oldiga label qo'shamiz
        if (imageCount > 1) {
          contentBlocks.push({ type: 'text', text: `📸 Rasm ${i + 1}:` });
        }
        contentBlocks.push({
          type: 'image',
          source: { type: 'base64', media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: base64Image },
        });
      }
    } else {
      // Eski mos kelish uchun (bitta rasm — "image" kalit)
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

    // Kontekst va savol
    let fullMessage = '';
    if (context) {
      fullMessage += `📊 **Kalkulyator natijalari (kontekst):**\n${context}\n\n`;
    }
    fullMessage += message || 'Bu grafik/rasmni tahlil qilib bering.';

    contentBlocks.push({
      type: 'text',
      text: fullMessage,
    });

    // Streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const claudeStream = await anthropic.messages.stream({
            model: "claude-sonnet-5", // To'g'ri model nomi
            max_tokens: 4096,
            temperature: 1,
            system: `Siz XAU/USD (oltin) savdo kalkulyatori uchun mutaxassis moliyaviy tahlilchisiz. 
Foydalanuvchi savdo grafiklari, skreenshotlar va narx ma'lumotlarini yuboradi. 
Siz quyidagilarni tahlil qilasiz:
- Narx harakati va trend
- Support/Resistance darajalari  
- Order Block va FVG (Fair Value Gap) zonalari
- Gann kvadrat darajalari bilan moslik
- Entry, Stop Loss va Take Profit tavsiyalari
- Umumiy bozor holati

Javoblaringiz o'zbek tilida bo'lsin. Aniq, qisqa va foydali ma'lumot bering.
Agar rasm yuborilgan bo'lsa, uni diqqat bilan ko'rib tahlil qiling.`,
            messages: [
              {
                role: 'user',
                content: contentBlocks,
              },
            ],
            thinking: { type: "disabled" }
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
            ? `${err.message}${(err as {status?: number}).status ? ` (status: ${(err as {status?: number}).status})` : ''}`
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
