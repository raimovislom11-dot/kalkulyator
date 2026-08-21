import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY не настроен' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const anthropic = new Anthropic({ apiKey });
    const formData = await req.formData();

    const messagesRaw = formData.get('messages') as string;
    const context = formData.get('context') as string | null;
    const imageCount = parseInt(formData.get('imageCount') as string || '0', 10);

    // Parse conversation history
    const history: { role: 'user' | 'assistant'; content: string }[] =
      messagesRaw ? JSON.parse(messagesRaw) : [];

    // Build last user message content
    const lastUserContent: Anthropic.MessageParam['content'] = [];

    // Attach images to last user message
    for (let i = 0; i < imageCount; i++) {
      const imgFile = formData.get(`image_${i}`) as File | null;
      if (!imgFile) continue;
      const buf = await imgFile.arrayBuffer();
      const base64 = Buffer.from(buf).toString('base64');
      let mt = (imgFile.type || 'image/jpeg') as string;
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mt)) mt = 'image/jpeg';
      if (imageCount > 1) lastUserContent.push({ type: 'text', text: `📸 Рисунок ${i + 1}:` });
      lastUserContent.push({
        type: 'image',
        source: { type: 'base64', media_type: mt as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: base64 },
      });
    }

    // Last user text
    const lastText = formData.get('lastMessage') as string;
    let finalText = '';
    if (context) finalText += `📊 **Торговый контекст:**\n${context}\n\n`;
    finalText += lastText || 'Анализируй пожалуйста.';
    lastUserContent.push({ type: 'text', text: finalText });

    // Build full message array for Claude (history + new)
    const messages: Anthropic.MessageParam[] = [
      ...history.slice(0, -1).map(m => ({
        role: m.role,
        content: m.content,
      })),
      {
        role: 'user' as const,
        content: lastUserContent,
      },
    ];

    // Streaming
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const claudeStream = await anthropic.messages.stream({
            model: 'claude-fable-5',
            max_tokens: 4096,
            system: `Вы — эксперт-трейдер XAU/USD (золото) и аналитик торговых стратегий.
Вы работаете в Admin Panel торгового калькулятора.
Вы умеете анализировать:
- Торговые стратегии (Order Block, IFVG, SMT, SNR/ICT, Elif Trading, AB Trade)
- Технический анализ XAU/USD
- Журналы сделок и статистику (Win Rate, Profit Factor, R:R)
- Графики и паттерны (если пользователь прикрепляет изображения)
- Управление рисками и психологию трейдинга

Отвечайте на языке пользователя (русский/узбекский).
Используйте структурированные ответы с форматированием markdown.
Будьте конкретны, давайте практические рекомендации.`,
            messages,
            thinking: { type: 'disabled' },
          });

          for await (const chunk of claudeStream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : JSON.stringify(err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
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
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
