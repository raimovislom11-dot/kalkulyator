import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import type { AISignal } from '../../lib/types';
import { API_BASE_URL } from '../../lib/api';

export const dynamic = 'force-dynamic';

// In Serverless/Vercel environments, only /tmp is writable.
const LOCAL_DATA_DIR = path.join(process.cwd(), 'data');
const TMP_DATA_DIR = path.join(os.tmpdir(), 'kalkulyator-data');
const LOCAL_SIGNALS_FILE = path.join(LOCAL_DATA_DIR, 'signals.json');
const TMP_SIGNALS_FILE = path.join(TMP_DATA_DIR, 'signals.json');

const CANDIDATE_BACKEND_URLS = Array.from(new Set([
  'https://calc.213.199.51.43.sslip.io',
  API_BASE_URL,
  process.env.BACKEND_API_URL,
  process.env.NEXT_PUBLIC_API_URL,
  'http://127.0.0.1:8090',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
].filter(Boolean) as string[]));

// In-memory fallback
let memorySignals: AISignal[] = [];

function readSignals(): AISignal[] {
  // 1. Try local data dir
  try {
    if (fs.existsSync(LOCAL_SIGNALS_FILE)) {
      const raw = fs.readFileSync(LOCAL_SIGNALS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  // 2. Try /tmp
  try {
    if (fs.existsSync(TMP_SIGNALS_FILE)) {
      const raw = fs.readFileSync(TMP_SIGNALS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}

  return memorySignals;
}

function writeSignals(signals: AISignal[]): void {
  memorySignals = signals;

  // Try writing to local data dir (works locally, may fail on Vercel)
  try {
    if (!fs.existsSync(LOCAL_DATA_DIR)) {
      fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_SIGNALS_FILE, JSON.stringify(signals, null, 2), 'utf-8');
    return;
  } catch {}

  // If local fails (e.g. Vercel read-only filesystem), write to /tmp
  try {
    if (!fs.existsSync(TMP_DATA_DIR)) {
      fs.mkdirSync(TMP_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(TMP_SIGNALS_FILE, JSON.stringify(signals, null, 2), 'utf-8');
  } catch {}
}

function normalizeSignal(sig: Partial<AISignal>): AISignal {
  const now = new Date().toISOString();
  return {
    id: sig.id || `sig_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: sig.createdAt || now,
    updatedAt: sig.updatedAt || now,
    asset: sig.asset || 'XAUUSD',
    symbol: sig.symbol || 'XAUUSD',
    timeframe: sig.timeframe || '1h',
    termMode: sig.termMode || 'short',
    strategy: sig.strategy || 'SMC/ICT',
    direction: (sig.direction as any) || 'BUY',
    entry: String(sig.entry || '0'),
    sl: String(sig.sl || '0'),
    tp1: String(sig.tp1 || '—'),
    tp2: sig.tp2 ? String(sig.tp2) : undefined,
    tp3: sig.tp3 ? String(sig.tp3) : undefined,
    rr: sig.rr ? String(sig.rr) : undefined,
    outcome: sig.outcome || 'PENDING',
    outcomeDate: sig.outcomeDate,
    mistakeReason: sig.mistakeReason,
    mistakeNote: sig.mistakeNote,
    aiLearnedLesson: sig.aiLearnedLesson,
    fullAnalysisText: sig.fullAnalysisText,
    createdBy: sig.createdBy,
    source: sig.source || 'ai-analysis',
  };
}

function mergeSignals(listA: AISignal[], listB: AISignal[]): AISignal[] {
  const map = new Map<string, AISignal>();
  listA.forEach(s => {
    if (s && s.id) map.set(s.id, normalizeSignal(s));
  });
  listB.forEach(s => {
    if (s && s.id) {
      const existing = map.get(s.id);
      map.set(s.id, normalizeSignal({ ...existing, ...s }));
    }
  });
  return Array.from(map.values()).sort((a, b) => {
    const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
  });
}

// GET: Return all signals from backend + local cache
export async function GET() {
  try {
    for (const base of CANDIDATE_BACKEND_URLS) {
      try {
        const res = await fetch(`${base}/api/signals`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(3500),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const local = readSignals();
            const merged = mergeSignals(local, data);
            writeSignals(merged);
            return NextResponse.json(merged);
          }
        }
      } catch {}
    }

    const fallback = readSignals();
    return NextResponse.json(fallback);
  } catch (err) {
    console.error('Signals GET route error:', err);
    return NextResponse.json(readSignals());
  }
}

// POST: Add new signal
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.entry) {
      return NextResponse.json({ error: 'Invalid signal data' }, { status: 400 });
    }

    const newSignal = normalizeSignal(body);

    // Save locally/memory first
    const local = readSignals();
    const existingIdx = local.findIndex(s => s.id === newSignal.id);
    if (existingIdx >= 0) {
      local[existingIdx] = newSignal;
    } else {
      local.unshift(newSignal);
    }
    writeSignals(local);

    // Sync with backend
    for (const base of CANDIDATE_BACKEND_URLS) {
      try {
        const backendRes = await fetch(`${base}/api/signals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSignal),
          signal: AbortSignal.timeout(3500),
        });
        if (backendRes.ok) {
          const data = await backendRes.json();
          if (data && data.id) {
            const current = readSignals();
            const idx = current.findIndex(s => s.id === data.id || s.id === newSignal.id);
            if (idx >= 0) current[idx] = normalizeSignal(data);
            else current.unshift(normalizeSignal(data));
            writeSignals(current);
            return NextResponse.json(normalizeSignal(data), { status: 201 });
          }
        }
      } catch {}
    }

    return NextResponse.json(newSignal, { status: 201 });
  } catch (err) {
    console.error('Signals POST error:', err);
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

    const local = readSignals();
    const idx = local.findIndex(s => s.id === body.id);
    const updated = normalizeSignal({
      ...(idx >= 0 ? local[idx] : {}),
      ...body,
      updatedAt: new Date().toISOString(),
    });

    if (idx >= 0) {
      local[idx] = updated;
    } else {
      local.unshift(updated);
    }
    writeSignals(local);

    for (const base of CANDIDATE_BACKEND_URLS) {
      try {
        const backendRes = await fetch(`${base}/api/signals`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
          signal: AbortSignal.timeout(3500),
        });
        if (backendRes.ok) {
          const data = await backendRes.json();
          return NextResponse.json(normalizeSignal(data));
        }
      } catch {}
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('Signals PUT error:', err);
    return NextResponse.json({ error: 'Failed to update signal' }, { status: 500 });
  }
}

// DELETE: Remove signal by ?id=... or ?clear=true
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const clear = searchParams.get('clear');

    for (const base of CANDIDATE_BACKEND_URLS) {
      try {
        const url = clear === 'true'
          ? `${base}/api/signals?clear=true`
          : `${base}/api/signals?id=${encodeURIComponent(id || '')}`;
        await fetch(url, { method: 'DELETE', signal: AbortSignal.timeout(3500) });
      } catch {}
    }

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
    console.error('Signals DELETE error:', err);
    return NextResponse.json({ error: 'Failed to delete signal' }, { status: 500 });
  }
}
