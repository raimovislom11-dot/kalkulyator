import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { API_BASE_URL } from '../../lib/api';

export const dynamic = 'force-dynamic';

const BACKEND_URL = (API_BASE_URL || 'https://calc.213.199.51.43.sslip.io').replace(/\/+$/, '');

function getLocalSignals(): any[] {
  try {
    const filePath = path.join(process.cwd(), 'data', 'signals.json');
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalSignals(signals: any[]) {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const filePath = path.join(dataDir, 'signals.json');
    fs.writeFileSync(filePath, JSON.stringify(signals, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save local signals:', e);
  }
}

// GET: /api/signals
export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/signals`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(800),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return NextResponse.json(data);
      }
    }
  } catch {
    // remote backend down, use local
  }

  return NextResponse.json(getLocalSignals());
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
        signal: AbortSignal.timeout(800),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data, { status: 201 });
      }
    } catch {
      // fallback to local
    }

    const fallback = {
      ...body,
      id: body.id || `sig_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      outcome: body.outcome || 'PENDING',
    };
    const current = getLocalSignals();
    current.unshift(fallback);
    saveLocalSignals(current);

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
        signal: AbortSignal.timeout(800),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // fallback
    }

    const current = getLocalSignals();
    const idx = current.findIndex(s => s.id === body.id);
    const updated = { ...body, updatedAt: new Date().toISOString() };
    if (idx !== -1) {
      current[idx] = updated;
    } else {
      current.unshift(updated);
    }
    saveLocalSignals(current);

    return NextResponse.json(updated);
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
        signal: AbortSignal.timeout(800),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // fallback
    }

    if (clear === 'true') {
      saveLocalSignals([]);
      return NextResponse.json({ success: true, message: 'All signals cleared' });
    }

    if (!id) {
      return NextResponse.json({ error: 'Signal ID is required' }, { status: 400 });
    }

    const current = getLocalSignals().filter(s => s.id !== id);
    saveLocalSignals(current);
    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error('[signals route] DELETE error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
