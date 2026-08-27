import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export interface ForexFactoryEvent {
  id: string;
  title: string;
  country: string;
  date: string;
  impact: 'High' | 'Medium' | 'Low' | 'Holiday' | string;
  forecast: string;
  previous: string;
}

const FF_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
const CACHE_FILE = path.join(process.cwd(), 'data', 'ff_calendar.json');

function ensureDataDir(): void {
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readCached(): ForexFactoryEvent[] {
  try {
    ensureDataDir();
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

function writeCached(events: ForexFactoryEvent[]): void {
  try {
    ensureDataDir();
    fs.writeFileSync(CACHE_FILE, JSON.stringify(events, null, 2), 'utf-8');
  } catch {}
}

export async function GET() {
  try {
    const res = await fetch(FF_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const rawData = await res.json();
      if (Array.isArray(rawData)) {
        const events: ForexFactoryEvent[] = rawData.map((item, idx) => ({
          id: `ff_${new Date(item.date).getTime()}_${idx}_${(item.country || '').toLowerCase()}`,
          title: item.title || 'Noma\'lum hodisa',
          country: (item.country || 'ALL').toUpperCase(),
          date: item.date,
          impact: item.impact || 'Low',
          forecast: item.forecast || '',
          previous: item.previous || '',
        }));

        writeCached(events);
        return NextResponse.json({
          success: true,
          source: 'forexfactory_live',
          updatedAt: new Date().toISOString(),
          total: events.length,
          events,
        });
      }
    }
  } catch (err) {
    console.warn('ForexFactory live fetch failed, using cached file:', err);
  }

  const cached = readCached();
  return NextResponse.json({
    success: true,
    source: 'forexfactory_cache',
    updatedAt: new Date().toISOString(),
    total: cached.length,
    events: cached,
  });
}
