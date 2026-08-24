import { NextRequest } from 'next/server';
import { API_BASE_URL } from '../../../lib/api';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const backendRes = await fetch(`${API_BASE_URL}/api/admin/api/chat`, {
      method: 'POST',
      body: formData,
    });

    if (!backendRes.ok && !backendRes.body) {
      return new Response(JSON.stringify({ error: 'Backend chat serveri javob bermadi' }), {
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
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
