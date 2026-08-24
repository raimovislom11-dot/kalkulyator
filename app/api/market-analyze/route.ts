import { NextRequest } from 'next/server';
import { API_BASE_URL } from '../../lib/api';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const backendRes = await fetch(`${API_BASE_URL}/api/market-analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!backendRes.ok && !backendRes.body) {
      return new Response(JSON.stringify({ error: 'Backend tahlil serveri javob bermadi' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(backendRes.body, {
      status: backendRes.status,
      headers: {
        'Content-Type': backendRes.headers.get('Content-Type') || 'text/event-stream',
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
