import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { API_BASE_URL } from '../../lib/api';
import type { AISignal } from '../../lib/types';
import { MISTAKE_REASON_LABELS } from '../../lib/signalsStore';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function getAILearningContext(symbol?: string): string {
  try {
    const filePath = path.join(process.cwd(), 'data', 'signals.json');
    if (!fs.existsSync(filePath)) return '';
    const raw = fs.readFileSync(filePath, 'utf-8');
    const signals: AISignal[] = JSON.parse(raw);
    if (!Array.isArray(signals) || signals.length === 0) return '';

    const filtered = symbol
      ? signals.filter(s => !s.symbol || s.symbol.toUpperCase() === symbol.toUpperCase())
      : signals;

    const losses = filtered.filter(s => s.outcome === 'SL_HIT' || s.outcome === 'MISSED_LIMIT').slice(0, 4);
    const wins = filtered.filter(s => s.outcome === 'TP_HIT').slice(0, 2);

    if (losses.length === 0 && wins.length === 0) return '';

    let prompt = `\n\n[AI O'RGANISH XOTIRASI VA OLDINGI XATOLARDAN SABOQLAR]:\n`;
    if (losses.length > 0) {
      prompt += `Diqqat, oldingi tahlillardagi xatolar va SL sabablari:\n`;
      losses.forEach((sig, i) => {
        const reason = sig.mistakeReason ? MISTAKE_REASON_LABELS[sig.mistakeReason] : (sig.mistakeNote || 'Likvidlik/trend xatosi');
        prompt += `- ${i + 1}) [${sig.symbol || sig.asset} ${sig.direction} @ ${sig.entry}]: Natija: ${sig.outcome === 'SL_HIT' ? 'SL urilgan' : 'Limitga yetmagan'}. Sabab: ${reason}.\n`;
      });
      prompt += `KO'RSATMA: Ushbu xatolarni takrorlamang! Entry'ni aniqroq FVG/OB ga joylashtiring, Stop Loss'ni xavfsiz zonaga qo'ying va likvidlik supurilmasdan erta signal bermang!\n`;
    }
    if (wins.length > 0) {
      prompt += `Muvaffaqiyatli chiqqan signallar:\n`;
      wins.forEach(sig => {
        prompt += `- [${sig.symbol || sig.asset} ${sig.direction} @ ${sig.entry} -> TP Oldi]\n`;
      });
    }
    return prompt;
  } catch {
    return '';
  }
}

export async function POST(req: NextRequest) {
  try {
    const incoming = await req.formData();
    const symbol = (incoming.get('assetSymbol') as string) || '';
    const learningCtx = getAILearningContext(symbol);

    const outgoing = new FormData();
    for (const [key, value] of incoming.entries()) {
      outgoing.append(key, value);
    }

    if (learningCtx) {
      const existingCalcCtx = (incoming.get('calcContext') as string) || '';
      outgoing.set('calcContext', existingCalcCtx + learningCtx);
    }

    const backendRes = await fetch(`${API_BASE_URL}/api/market-analyze`, {
      method: 'POST',
      body: outgoing,
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

