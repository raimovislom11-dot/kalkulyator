import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '../../lib/api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const url = token ? `${API_BASE_URL}/api/telegram-broadcast?token=${encodeURIComponent(token)}` : `${API_BASE_URL}/api/telegram-broadcast`;
    const backendRes = await fetch(url);
    const data = await backendRes.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Telegram serveriga ulanish xatosi' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const backendRes = await fetch(`${API_BASE_URL}/api/telegram-broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Telegram xabar yuborishda xatolik' }, { status: 500 });
  }
}
