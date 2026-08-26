import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { AISignal } from '../../lib/types';
import { API_BASE_URL } from '../../lib/api';

export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), 'data');
const SIGNALS_FILE = path.join(DATA_DIR, 'signals.json');

function ensureDataFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SIGNALS_FILE)) {
    fs.writeFileSync(SIGNALS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function readSignals(): AISignal[] {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(SIGNALS_FILE, 'utf-8');
    return JSON.parse(raw) as AISignal[];
  } catch {
    return [];
  }
}

function writeSignals(signals: AISignal[]): void {
  ensureDataFile();
  fs.writeFileSync(SIGNALS_FILE, JSON.stringify(signals, null, 2), 'utf-8');
}

// GET: Return all signals from backend (or fallback to local file)
export async function GET() {
  try {
    const backendRes = await fetch(`${API_BASE_URL}/api/signals`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
    if (backendRes.ok) {
      const data = await backendRes.json();
      if (Array.isArray(data)) {
        writeSignals(data);
        return NextResponse.json(data);
      }
    }
  } catch {}

  const signals = readSignals();
  signals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json(signals);
}

// POST: Add new signal
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.entry) {
      return NextResponse.json({ error: 'Invalid signal data' }, { status: 400 });
    }

    // Try backend
    try {
      const backendRes = await fetch(`${API_BASE_URL}/api/signals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(4000),
      });
      if (backendRes.ok) {
        const data = await backendRes.json();
        // save locally
        const signals = readSignals();
        const existingIdx = signals.findIndex(s => s.id === data.id);
        if (existingIdx >= 0) signals[existingIdx] = data;
        else signals.unshift(data);
        writeSignals(signals);
        return NextResponse.json(data, { status: 201 });
      }
    } catch {}

    // Fallback local save
    const signals = readSignals();
    const newSignal: AISignal = {
      ...body,
      id: body.id || `sig_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: body.updatedAt || new Date().toISOString(),
      outcome: body.outcome || 'PENDING',
    };

    const existingIdx = signals.findIndex(s => s.id === newSignal.id);
    if (existingIdx >= 0) {
      signals[existingIdx] = newSignal;
    } else {
      signals.unshift(newSignal);
    }

    writeSignals(signals);
    return NextResponse.json(newSignal, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create signal' }, { status: 500 });
  }
}

// PUT: Update signal (outcome, mistakes, note)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.id) {
      return NextResponse.json({ error: 'Signal ID required' }, { status: 400 });
    }

    // Try backend
    try {
      const backendRes = await fetch(`${API_BASE_URL}/api/signals`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(4000),
      });
      if (backendRes.ok) {
        const data = await backendRes.json();
        const signals = readSignals();
        const idx = signals.findIndex(s => s.id === data.id);
        if (idx >= 0) signals[idx] = data;
        else signals.unshift(data);
        writeSignals(signals);
        return NextResponse.json(data);
      }
    } catch {}

    // Local fallback
    const signals = readSignals();
    const idx = signals.findIndex(s => s.id === body.id);
    if (idx === -1) {
      signals.unshift({
        ...body,
        createdAt: body.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      writeSignals(signals);
      return NextResponse.json(signals[0]);
    }

    signals[idx] = {
      ...signals[idx],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    writeSignals(signals);
    return NextResponse.json(signals[idx]);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update signal' }, { status: 500 });
  }
}

// DELETE: Remove signal by ?id=... or ?clear=true
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const clear = searchParams.get('clear');

    // Try backend
    try {
      const url = clear === 'true'
        ? `${API_BASE_URL}/api/signals?clear=true`
        : `${API_BASE_URL}/api/signals?id=${encodeURIComponent(id || '')}`;
      await fetch(url, { method: 'DELETE', signal: AbortSignal.timeout(4000) });
    } catch {}

    if (clear === 'true') {
      writeSignals([]);
      return NextResponse.json({ success: true, message: 'All signals cleared' });
    }

    if (!id) {
      return NextResponse.json({ error: 'Signal ID is required' }, { status: 400 });
    }

    let signals = readSignals();
    signals = signals.filter(s => s.id !== id);
    writeSignals(signals);

    return NextResponse.json({ success: true, id });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete signal' }, { status: 500 });
  }
}
