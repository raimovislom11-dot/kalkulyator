import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '../../lib/api';

export const dynamic = 'force-dynamic';

const BACKEND_URL = (API_BASE_URL || 'https://calc.213.199.51.43.sslip.io').replace(/\/+$/, '');

// In-memory fallback if backend is momentarily unreachable
let inMemorySignals: any[] = [];

// GET: /api/signals
export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/signals`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        inMemorySignals = data;
        return NextResponse.json(data);
      }
    }
  } catch (err) {
    console.error('[signals route] GET proxy error:', err);
  }

  return NextResponse.json(inMemorySignals);
}

// POST: /api/signals
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.entry) {
      return NextResponse.json({ error: 'Invalid signal data' }, { status: 400 });
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/signals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data, { status: 201 });
      }
    } catch (err) {
      console.error('[signals route] POST proxy error:', err);
    }

    // Fallback: return created object locally
    const fallback = {
      ...body,
      id: body.id || `sig_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      outcome: body.outcome || 'PENDING',
    };
    inMemorySignals.unshift(fallback);
    return NextResponse.json(fallback, { status: 201 });
  } catch (err) {
    console.error('[signals route] POST error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: /api/signals
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.id) {
      return NextResponse.json({ error: 'Signal ID is required' }, { status: 400 });
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/signals`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (err) {
      console.error('[signals route] PUT proxy error:', err);
    }

    return NextResponse.json({ ...body, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[signals route] PUT error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: /api/signals?id=... or /api/signals?clear=true
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const clear = searchParams.get('clear');

    const query = clear === 'true' ? '?clear=true' : `?id=${encodeURIComponent(id || '')}`;

    try {
      const res = await fetch(`${BACKEND_URL}/api/signals${query}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (err) {
      console.error('[signals route] DELETE proxy error:', err);
    }

    if (clear === 'true') {
      inMemorySignals = [];
      return NextResponse.json({ success: true, message: 'All signals cleared' });
    }

    if (!id) {
      return NextResponse.json({ error: 'Signal ID is required' }, { status: 400 });
    }

    inMemorySignals = inMemorySignals.filter(s => s.id !== id);
    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error('[signals route] DELETE error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
