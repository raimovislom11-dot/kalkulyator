import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const DEFAULT_BOT_TOKEN = '8878704201:AAEosMGZHutCiAppEISJI4ciQ2wLwXIusUY';
const DEFAULT_CHAT_ID = '1833182771';
const SUBSCRIBERS_FILE = path.join(process.cwd(), 'data', 'subscribers.json');

// Read subscribers file
function getStoredSubscribers(): string[] {
  try {
    if (fs.existsSync(SUBSCRIBERS_FILE)) {
      const data = fs.readFileSync(SUBSCRIBERS_FILE, 'utf8');
      const list = JSON.parse(data);
      if (Array.isArray(list)) return list;
    }
  } catch (err) {
    console.error('Error reading subscribers file:', err);
  }
  return [DEFAULT_CHAT_ID];
}

// Save subscribers to file
function saveStoredSubscribers(list: string[]) {
  try {
    const unique = Array.from(new Set(list.filter(Boolean)));
    const dir = path.dirname(SUBSCRIBERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(unique, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving subscribers file:', err);
  }
}

// Fetch any new users who interacted with the bot via getUpdates
async function fetchBotUpdates(token: string): Promise<string[]> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=-100`, {
      cache: 'no-store',
    });
    const data = await res.json();
    if (!data.ok || !Array.isArray(data.result)) return [];

    const discoveredIds: string[] = [];
    for (const item of data.result) {
      const chatId =
        item.message?.chat?.id ||
        item.channel_post?.chat?.id ||
        item.my_chat_member?.chat?.id ||
        item.callback_query?.message?.chat?.id;
      if (chatId != null) {
        discoveredIds.push(String(chatId));
      }
    }
    return discoveredIds;
  } catch (err) {
    console.error('Error in getUpdates:', err);
    return [];
  }
}

// GET: Returns list of subscribers & stats
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') || DEFAULT_BOT_TOKEN;

  const stored = getStoredSubscribers();
  const discovered = await fetchBotUpdates(token);
  const all = Array.from(new Set([...stored, ...discovered, DEFAULT_CHAT_ID]));

  // Save merged
  saveStoredSubscribers(all);

  return NextResponse.json({
    ok: true,
    total: all.length,
    subscribers: all,
  });
}

// POST: Broadcast message to ALL subscribers
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = (body.botToken || DEFAULT_BOT_TOKEN).trim();
    const text = body.text || '';
    const extraChatIds: string[] = Array.isArray(body.chatIds) ? body.chatIds : [];

    if (!text.trim()) {
      return NextResponse.json({ error: 'Xabar matni kiritilmagan' }, { status: 400 });
    }

    // 1. Fetch latest updates from bot to discover all active users
    const discovered = await fetchBotUpdates(token);
    const stored = getStoredSubscribers();
    const allRecipients = Array.from(
      new Set([
        ...stored,
        ...discovered,
        ...extraChatIds,
        DEFAULT_CHAT_ID,
      ].map(id => String(id).trim()).filter(Boolean))
    );

    // Persist new list
    saveStoredSubscribers(allRecipients);

    // 2. Broadcast to all recipients
    let sentCount = 0;
    let failedCount = 0;
    const errors: { chatId: string; error: string }[] = [];

    for (const chatId of allRecipients) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'Markdown',
          }),
        });

        const data = await res.json();
        if (data.ok) {
          sentCount++;
        } else {
          failedCount++;
          errors.push({ chatId, error: data.description || 'Noma\'lum xatolik' });
        }
      } catch (err) {
        failedCount++;
        errors.push({
          chatId,
          error: err instanceof Error ? err.message : 'Ulanish xatosi',
        });
      }

      // Small delay to avoid hitting Telegram API rate limits (30 msgs/sec max)
      await new Promise((r) => setTimeout(r, 60));
    }

    return NextResponse.json({
      ok: true,
      sentCount,
      failedCount,
      totalSubscribers: allRecipients.length,
      errors: errors.slice(0, 5),
    });
  } catch (err) {
    console.error('Broadcast xatolik:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Broadcast xatoligi' },
      { status: 500 }
    );
  }
}
