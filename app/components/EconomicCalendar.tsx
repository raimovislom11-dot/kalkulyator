'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

export interface ForexFactoryEvent {
  id: string;
  title: string;
  country: string;
  date: string;
  impact: 'High' | 'Medium' | 'Low' | 'Holiday' | string;
  forecast: string;
  previous: string;
}

const COUNTRY_FLAGS: Record<string, { flag: string; name: string; goldImpact?: boolean }> = {
  USD: { flag: '🇺🇸', name: 'AQSH Dollari', goldImpact: true },
  EUR: { flag: '🇪🇺', name: 'Yevro', goldImpact: true },
  GBP: { flag: '🇬🇧', name: 'Britaniya Funti', goldImpact: true },
  JPY: { flag: '🇯🇵', name: 'Yaponiya Ienasi' },
  AUD: { flag: '🇦🇺', name: 'Avstraliya Dollari' },
  CAD: { flag: '🇨🇦', name: 'Kanada Dollari' },
  CHF: { flag: '🇨🇭', name: 'Shveysariya Franki' },
  NZD: { flag: '🇳🇿', name: 'Yangi Zelandiya Dollari' },
  CNY: { flag: '🇨🇳', name: 'Xitoy Yuani' },
  ALL: { flag: '🌐', name: 'Global / Barcha' },
};

function getGoldImpactNote(title: string, country: string, impact: string): string | null {
  const t = title.toLowerCase();
  if (country === 'USD') {
    if (t.includes('cpi') || t.includes('inflation') || t.includes('pce')) {
      return "AQSH Inflyatsiyasi: Kutilgandan yuqori chiqsa USD kuchayadi va Oltin (XAUUSD) tushishi mumkin; past chiqsa Oltin keskin o'sadi.";
    }
    if (t.includes('non-farm') || t.includes('payroll') || t.includes('unemployment')) {
      return "AQSH Mehnat Bozori: NFP kuchli chiqsa Oltin bosim ostida qoladi, ishsizlik ko'paysa Oltin yuqoriga otiladi.";
    }
    if (t.includes('fomc') || t.includes('fed') || t.includes('powell') || t.includes('rate')) {
      return "Federal Zaxira stavkasi va bayonoti: Bozorda eng yuqori volatillik va spred kengayishiga sabab bo'ladi.";
    }
    if (t.includes('gdp') || t.includes('yalpi')) {
      return "AQSH YaIM ko'rsatkichi: Iqtisodiy o'sish kutilgandan yuqori bo'lsa Oltin korreksiya berishi mumkin.";
    }
    if (t.includes('pmi') || t.includes('ism') || t.includes('manufacturing') || t.includes('services')) {
      return "Sanoat va xizmat PMI: 50 dan yuqori bo'lsa iqtisodiy o'sish, past bo'lsa retsessiya xavfi.";
    }
    if (t.includes('retail sales')) {
      return "Chakana savdo: Iste'molchilar xarid qobiliyati indeksi.";
    }
    if (impact === 'High') {
      return "High Impact USD yangiligi: XAU/USD da kuchli likvidlik to'lqinini keltirib chiqaradi.";
    }
  } else if (country === 'EUR' && impact === 'High') {
    return "Yevro hududi muhim yangiligi: EUR/USD va bilvosita DXY/Oltin harakatiga ta'sir qiladi.";
  } else if (country === 'GBP' && impact === 'High') {
    return "Angliya banki / CPI yangiligi: GBP juftliklarida kuchli tebranish beradi.";
  }
  return null;
}

export default function EconomicCalendar() {
  const [events, setEvents] = useState<ForexFactoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<'live' | 'cache'>('live');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Date-based & other Filters
  const [selectedDate, setSelectedDate] = useState<string>('ALL'); // 'ALL' or 'YYYY-MM-DD'
  const [impactFilter, setImpactFilter] = useState<'ALL' | 'HIGH' | 'MED_HIGH'>('ALL'); // Default ALL so all news are visible
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [timezoneMode, setTimezoneMode] = useState<'TASHKENT' | 'UTC'>('TASHKENT');

  // Helper: Get timezone-correct YYYY-MM-DD day key from an ISO date string
  const getLocalDayKey = useCallback((isoStr: string): string => {
    try {
      const date = new Date(isoStr);
      if (isNaN(date.getTime())) return '';
      const tz = timezoneMode === 'TASHKENT' ? 'Asia/Tashkent' : 'UTC';
      // Use en-CA locale which formats as YYYY-MM-DD
      return date.toLocaleDateString('en-CA', { timeZone: tz });
    } catch {
      return '';
    }
  }, [timezoneMode]);

  // Helper: Get today's YYYY-MM-DD in the selected timezone
  const getTodayKey = useCallback((): string => {
    const tz = timezoneMode === 'TASHKENT' ? 'Asia/Tashkent' : 'UTC';
    return new Date().toLocaleDateString('en-CA', { timeZone: tz });
  }, [timezoneMode]);

  // Helper: Get tomorrow's YYYY-MM-DD in the selected timezone
  const getTomorrowKey = useCallback((): string => {
    const tz = timezoneMode === 'TASHKENT' ? 'Asia/Tashkent' : 'UTC';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString('en-CA', { timeZone: tz });
  }, [timezoneMode]);

  const fetchEvents = useCallback(async (showLoading = true) => {
    if (showLoading) setIsRefreshing(true);
    try {
      const res = await fetch('/api/forexfactory', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.events && Array.isArray(data.events)) {
          setEvents(data.events);
          setLastUpdated(new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          setSourceType(data.source === 'forexfactory_live' ? 'live' : 'cache');
        }
      }
    } catch (err) {
      console.warn('Failed to fetch ForexFactory data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(false);
    const interval = setInterval(() => fetchEvents(false), 60000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  // Extract all available unique dates from the weekly events (timezone-aware)
  const availableDays = useMemo(() => {
    const todayStr = getTodayKey();
    const tomorrowStr = getTomorrowKey();
    const tz = timezoneMode === 'TASHKENT' ? 'Asia/Tashkent' : 'UTC';

    const map = new Map<string, { count: number; highCount: number; sampleIso: string }>();

    events.forEach((evt) => {
      const dayKey = getLocalDayKey(evt.date);
      if (!dayKey) return;
      const cur = map.get(dayKey) || { count: 0, highCount: 0, sampleIso: evt.date };
      cur.count += 1;
      if ((evt.impact || '').toLowerCase() === 'high') {
        cur.highCount += 1;
      }
      map.set(dayKey, cur);
    });

    const sortedKeys = Array.from(map.keys()).sort();

    return sortedKeys.map((key) => {
      const data = map.get(key)!;
      const d = new Date(data.sampleIso);
      const isToday = key === todayStr;
      const isTomorrow = key === tomorrowStr;

      const shortLabel = d.toLocaleDateString('uz-UZ', {
        timeZone: tz,
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });

      const label = d.toLocaleDateString('uz-UZ', {
        timeZone: tz,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });

      return {
        dateKey: key,
        label,
        shortLabel,
        isToday,
        isTomorrow,
        count: data.count,
        highCount: data.highCount,
      };
    });
  }, [events, timezoneMode, getLocalDayKey, getTodayKey, getTomorrowKey]);

  // Format date for display with chosen timezone
  const formatEventTime = useCallback((isoStr: string) => {
    try {
      const date = new Date(isoStr);
      if (isNaN(date.getTime())) return { timeStr: '—', dateStr: '—', dayKey: '', dateObj: new Date() };

      const dayKey = getLocalDayKey(isoStr);

      if (timezoneMode === 'TASHKENT') {
        const timeStr = date.toLocaleTimeString('uz-UZ', {
          timeZone: 'Asia/Tashkent',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        const dateStr = date.toLocaleDateString('uz-UZ', {
          timeZone: 'Asia/Tashkent',
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        });
        return { timeStr, dateStr, dayKey, dateObj: date };
      } else {
        const timeStr = date.toLocaleTimeString('en-GB', {
          timeZone: 'UTC',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        const dateStr = date.toLocaleDateString('en-GB', {
          timeZone: 'UTC',
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        });
        return { timeStr, dateStr, dayKey, dateObj: date };
      }
    } catch {
      return { timeStr: '—', dateStr: '—', dayKey: '', dateObj: new Date() };
    }
  }, [timezoneMode, getLocalDayKey]);

  // Time remaining helper
  const getEventTimingStatus = useCallback((isoStr: string) => {
    try {
      const eventTime = new Date(isoStr).getTime();
      const now = Date.now();
      const diffMs = eventTime - now;
      const diffMin = Math.round(diffMs / 60000);

      if (diffMin < -120) {
        return { label: '✓ O\'tib ketdi', color: 'bg-slate-800 text-slate-400 border-slate-700', isImminent: false, isPassed: true };
      }
      if (diffMin < 0 && diffMin >= -120) {
        return { label: `⚡ ${Math.abs(diffMin)} daq oldin e'lon qilindi`, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', isImminent: false, isPassed: true };
      }
      if (diffMin >= 0 && diffMin <= 15) {
        return { label: `🔥 AYNAN HOZIR (${diffMin} daq qoldi)`, color: 'bg-rose-500 text-white font-black animate-pulse shadow-lg shadow-rose-500/50', isImminent: true, isPassed: false };
      }
      if (diffMin > 15 && diffMin <= 60) {
        return { label: `⏳ ${diffMin} daqiqa qoldi`, color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', isImminent: true, isPassed: false };
      }
      if (diffMin > 60 && diffMin <= 1440) {
        const hours = Math.floor(diffMin / 60);
        const mins = diffMin % 60;
        return { label: `⏰ ${hours} soat ${mins > 0 ? `${mins} daq` : ''}dan keyin`, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', isImminent: false, isPassed: false };
      }
      const days = Math.round(diffMin / 1440);
      return { label: `📅 ${days} kundan keyin`, color: 'bg-slate-800/80 text-slate-300 border-slate-700', isImminent: false, isPassed: false };
    } catch {
      return { label: '—', color: 'bg-slate-800 text-slate-400 border-slate-700', isImminent: false, isPassed: false };
    }
  }, []);

  // Filtered Events (using timezone-aware day keys)
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // 1. Date filter (Specific date vs ALL) — timezone-aware
      if (selectedDate !== 'ALL') {
        const evtDay = getLocalDayKey(evt.date);
        if (evtDay !== selectedDate) return false;
      }

      // 2. Currency filter
      if (currencyFilter !== 'ALL') {
        if (evt.country.toUpperCase() !== currencyFilter.toUpperCase()) return false;
      }

      // 3. Impact filter
      const imp = (evt.impact || '').toLowerCase();
      if (impactFilter === 'HIGH') {
        if (imp !== 'high') return false;
      } else if (impactFilter === 'MED_HIGH') {
        if (imp !== 'high' && imp !== 'medium') return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const str = `${evt.title} ${evt.country} ${evt.forecast} ${evt.previous}`.toLowerCase();
        if (!str.includes(q)) return false;
      }

      return true;
    });
  }, [events, selectedDate, impactFilter, currencyFilter, searchQuery, getLocalDayKey]);

  // Group events by date (timezone-aware)
  const groupedEvents = useMemo(() => {
    const map = new Map<string, { title: string; dayKey: string; items: ForexFactoryEvent[] }>();

    filteredEvents.forEach((evt) => {
      const { dateStr, dayKey } = formatEventTime(evt.date);
      const groupKey = dayKey || dateStr;
      const cur = map.get(groupKey) || { title: dateStr, dayKey, items: [] };
      cur.items.push(evt);
      map.set(groupKey, cur);
    });

    return Array.from(map.values());
  }, [filteredEvents, formatEventTime]);

  // Check if there is an imminent High-Impact event
  const imminentHighEvent = useMemo(() => {
    return events.find((evt) => {
      if ((evt.impact || '').toLowerCase() !== 'high') return false;
      const diffMs = new Date(evt.date).getTime() - Date.now();
      return diffMs >= -15 * 60 * 1000 && diffMs <= 45 * 60 * 1000;
    });
  }, [events]);

  const stats = useMemo(() => {
    const todayStr = getTodayKey();
    const todayList = events.filter((e) => getLocalDayKey(e.date) === todayStr);
    const highList = events.filter((e) => (e.impact || '').toLowerCase() === 'high');
    const usdList = events.filter((e) => e.country === 'USD');

    return {
      total: events.length,
      today: todayList.length,
      high: highList.length,
      usd: usdList.length,
    };
  }, [events, getLocalDayKey, getTodayKey]);

  return (
    <div className="space-y-6">
      {/* ─── FOREX FACTORY HEADER BANNER ─── */}
      <div className="rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-950 border border-slate-700/80 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                FOREX FACTORY • JONLI IQTISODIY TAQVIM
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                {sourceType === 'live' ? '● 1:1 Live Data' : '● Kesh Yangilandi'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Iqtisodiy Taqvim &amp; Yangiliklar</span>
              <span className="text-xl">📰</span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              ForexFactory.com ning rasmiy ma&apos;lumotlari asosida barcha haftalik xabarlar, kutilmalar va oldingi ko&apos;rsatkichlar sana bo&apos;yicha qulay tizimlangan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
            {/* Forex Factory Direct Link */}
            <a
              href="https://www.forexfactory.com/calendar"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-600/80 transition-all flex items-center gap-2 shadow-lg"
            >
              <span>ForexFactory.com</span>
              <span>↗</span>
            </a>

            {/* Refresh button */}
            <button
              onClick={() => fetchEvents(true)}
              disabled={isRefreshing}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
              <span>{isRefreshing ? 'Yuklanmoqda...' : 'Yangilash'}</span>
            </button>
          </div>
        </div>

        {/* Status Sub-row */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>Oxirgi yangilanish: <strong className="text-slate-200 font-mono">{lastUpdated || 'Hozirgina'}</strong></span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">Har 60 soniyada avtomatik yangilanadi</span>
          </div>

          {/* Timezone Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 px-2 font-semibold">Vaqt zonasi:</span>
            <button
              onClick={() => setTimezoneMode('TASHKENT')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                timezoneMode === 'TASHKENT'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🇺🇿 Toshkent (UTC+5)
            </button>
            <button
              onClick={() => setTimezoneMode('UTC')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                timezoneMode === 'UTC'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🌐 UTC
            </button>
          </div>
        </div>
      </div>

      {/* ─── IMMINENT HIGH-IMPACT WARNING BANNER ─── */}
      {imminentHighEvent && (
        <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-rose-950/90 via-red-900/80 to-slate-900 border-2 border-rose-500 shadow-2xl shadow-rose-900/40 animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="text-3xl animate-bounce">🚨</span>
            <div>
              <div className="text-rose-200 text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <span>DIQQAT: HIGH IMPACT YANGILIK YAQINLASHMOQDA!</span>
                <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
                  {formatEventTime(imminentHighEvent.date).timeStr}
                </span>
              </div>
              <div className="text-white font-black text-sm sm:text-base mt-0.5">
                {COUNTRY_FLAGS[imminentHighEvent.country]?.flag} {imminentHighEvent.country} • {imminentHighEvent.title}
              </div>
              <p className="text-rose-200/90 text-xs mt-1">
                Kutilma: <strong>{imminentHighEvent.forecast || '—'}</strong> | Oldingi: <strong>{imminentHighEvent.previous || '—'}</strong>. Yangilik vaqtida spred kengayishi va kuchli tebranish bo&apos;lishi mumkin!
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <span className="px-3.5 py-2 rounded-xl bg-rose-600 text-white font-black text-xs shadow-lg uppercase tracking-wider block text-center">
              Savdodan saqlaning ⚠️
            </span>
          </div>
        </div>
      )}

      {/* ─── 4 STAT CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 backdrop-blur-xl shadow-xl space-y-1">
          <div className="text-slate-400 text-xs font-bold flex items-center justify-between">
            <span>📅 Jami Yangiliklar</span>
            <span className="text-slate-500 text-[10px]">Haftalik</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">{stats.total}</div>
          <div className="text-[10px] text-slate-400">ForexFactory haftalik rejasi</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 backdrop-blur-xl shadow-xl space-y-1">
          <div className="text-slate-400 text-xs font-bold flex items-center justify-between">
            <span>⚡ Bugungi Xabarlar</span>
            <span className="text-emerald-400 text-[10px]">Bugun</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{stats.today}</div>
          <div className="text-[10px] text-slate-400">Kun davomida e&apos;lon qilinadi</div>
        </div>

        <div className="bg-slate-900/80 border border-rose-500/30 rounded-2xl p-4 backdrop-blur-xl shadow-xl space-y-1">
          <div className="text-slate-400 text-xs font-bold flex items-center justify-between">
            <span>🔴 High Impact (Qizil)</span>
            <span className="text-rose-400 text-[10px]">Eng muhim</span>
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">{stats.high}</div>
          <div className="text-[10px] text-slate-400">Katta tebranish keltiruvchi</div>
        </div>

        <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-4 backdrop-blur-xl shadow-xl space-y-1">
          <div className="text-slate-400 text-xs font-bold flex items-center justify-between">
            <span>🇺🇸 USD / XAU Ta&apos;sirli</span>
            <span className="text-amber-400 text-[10px]">Oltin</span>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">{stats.usd}</div>
          <div className="text-[10px] text-slate-400">AQSH dollari hodisalari</div>
        </div>
      </div>

      {/* ─── SANA BO'YICHA ASOSIY FILTR PANELI ─── */}
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-xl space-y-4">
        {/* Row 1: Date Pills (Barcha Yangiliklar + Har bir sana) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>📅</span>
              <span>Sana bo&apos;yicha filtrlash:</span>
            </span>

            {/* Direct Date Picker input */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 hidden sm:inline">Aniq sanani tanlash:</span>
              <input
                type="date"
                value={selectedDate !== 'ALL' ? selectedDate : ''}
                onChange={(e) => setSelectedDate(e.target.value || 'ALL')}
                className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              {selectedDate !== 'ALL' && (
                <button
                  onClick={() => setSelectedDate('ALL')}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold underline"
                >
                  Barchasini ko&apos;rish
                </button>
              )}
            </div>
          </div>

          {/* Date Buttons Grid */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* All dates button */}
            <button
              onClick={() => setSelectedDate('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                selectedDate === 'ALL'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105 border border-blue-400/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              <span>🌐</span>
              <span>Barcha Yangiliklar</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                selectedDate === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
              }`}>
                {events.length}
              </span>
            </button>

            {/* Individual Day Buttons */}
            {availableDays.map((day) => {
              const isSelected = selectedDate === day.dateKey;
              return (
                <button
                  key={day.dateKey}
                  onClick={() => setSelectedDate(day.dateKey)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105 border border-indigo-400/50'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/80'
                  }`}
                >
                  {day.isToday && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                  <span>{day.shortLabel}</span>
                  {day.isToday && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      Bugun
                    </span>
                  )}
                  {day.isTomorrow && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                      Ertaga
                    </span>
                  )}
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {day.count}
                  </span>
                  {day.highCount > 0 && (
                    <span className="text-[10px] text-rose-400 font-black" title={`${day.highCount} ta High Impact`}>
                      🔴{day.highCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Valyutalar, Muhimlik (Impact) va Qidiruv */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          {/* Currency Pills */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">Valyuta:</span>
            {[
              { symbol: 'ALL', label: 'Barchasi' },
              { symbol: 'USD', label: '🇺🇸 USD' },
              { symbol: 'EUR', label: '🇪🇺 EUR' },
              { symbol: 'GBP', label: '🇬🇧 GBP' },
              { symbol: 'JPY', label: '🇯🇵 JPY' },
              { symbol: 'AUD', label: '🇦🇺 AUD' },
              { symbol: 'CAD', label: '🇨🇦 CAD' },
              { symbol: 'CHF', label: '🇨🇭 CHF' },
              { symbol: 'NZD', label: '🇳🇿 NZD' },
              { symbol: 'CNY', label: '🇨🇳 CNY' },
            ].map((curr) => (
              <button
                key={curr.symbol}
                onClick={() => setCurrencyFilter(curr.symbol)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  currencyFilter === curr.symbol
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 scale-105'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {curr.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Impact Filter */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[
                { key: 'ALL', label: 'Barchasi' },
                { key: 'HIGH', label: '🔴 High', color: 'text-rose-400' },
                { key: 'MED_HIGH', label: '🟠 Med+', color: 'text-amber-400' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setImpactFilter(tab.key as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    impactFilter === tab.key
                      ? 'bg-rose-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
              <input
                type="text"
                placeholder="Yangilik nomi (CPI, NFP...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── SMC/ICT RISK MANAGEMENT ADVICE BOX ─── */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30 rounded-2xl p-4 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <span className="text-amber-300 font-bold">SMC &amp; ICT Xatar Boshqaruvi Qoidasi: </span>
            <span className="text-slate-300">
              Qizil (High Impact) yangiliklar bozorga yuqori likvidlik kiritadi. Yangilikdan 15 daqiqa oldin Stop Lossni Breakeven (0) ga o&apos;tkazing yoki pozitsiyani yopib, yangilikdan keyingi struktura tasdig&apos;ini (CHoCH + FVG) kuting.
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 text-slate-400 font-mono text-[11px]">
          ForexFactory API • {filteredEvents.length} ta ko&apos;rsatilmoqda
        </div>
      </div>

      {/* ─── EVENTS LIST ACCORDION / GROUPS ─── */}
      {loading ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-300 text-sm font-bold">ForexFactory serveridan ma&apos;lumotlar yuklanmoqda...</p>
          <p className="text-slate-500 text-xs">Jonli iqtisodiy taqvim jadvallari tayyorlanmoqda</p>
        </div>
      ) : groupedEvents.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <span className="text-4xl">📭</span>
          <h3 className="text-white font-bold text-base">Tanlangan sana yoki filtrlar bo&apos;yicha yangiliklar topilmadi</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            Boshqa sanani tanlang yoki &quot;Barcha Yangiliklar&quot; tugmasini bosing.
          </p>
          <button
            onClick={() => {
              setSelectedDate('ALL');
              setImpactFilter('ALL');
              setCurrencyFilter('ALL');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            Barcha yangiliklarni ko&apos;rsatish
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedEvents.map((group) => {
            const isTodayGroup = group.dayKey === getTodayKey();
            return (
              <div
                key={group.dayKey || group.title}
                className="bg-slate-900/90 border border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl"
              >
                {/* Day Header */}
                <div className={`px-5 py-3.5 border-b border-slate-700/80 flex items-center justify-between ${
                  isTodayGroup
                    ? 'bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border-l-4 border-l-indigo-500'
                    : 'bg-gradient-to-r from-slate-800 via-slate-850 to-slate-900'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🗓️</span>
                    <h3 className="text-white font-black text-sm tracking-wide capitalize">{group.title}</h3>
                    {isTodayGroup && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold font-mono border border-emerald-500/30">
                        Bugun
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-bold font-mono">
                      {group.items.length} ta hodisa
                    </span>
                  </div>
                  <div className="text-slate-400 text-xs font-mono">
                    {timezoneMode === 'TASHKENT' ? 'Toshkent vaqti (UTC+5)' : 'UTC vaqti'}
                  </div>
                </div>

                {/* Day Events Table / Items */}
                <div className="divide-y divide-slate-800/80">
                  {group.items.map((evt) => {
                    const { timeStr } = formatEventTime(evt.date);
                    const timing = getEventTimingStatus(evt.date);
                    const imp = (evt.impact || '').toLowerCase();
                    const isHigh = imp === 'high';
                    const isMed = imp === 'medium';
                    const impactNote = getGoldImpactNote(evt.title, evt.country, evt.impact);

                    return (
                      <div
                        key={evt.id}
                        className={`p-4 sm:p-5 transition-colors hover:bg-slate-800/40 ${
                          isHigh ? 'bg-rose-950/10' : ''
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          {/* Left: Time + Impact + Currency + Title */}
                          <div className="flex items-start gap-3.5 flex-1">
                            {/* Time Box */}
                            <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-center min-w-[70px] flex-shrink-0 shadow-inner">
                              <div className="text-white font-mono font-black text-sm leading-none">{timeStr}</div>
                              <div className="text-[9px] text-slate-500 font-mono mt-1">{timezoneMode === 'TASHKENT' ? 'UZT' : 'UTC'}</div>
                            </div>

                            <div className="space-y-1.5 flex-1">
                              {/* Tags Row */}
                              <div className="flex flex-wrap items-center gap-2">
                                {/* Impact Badge */}
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                                    isHigh
                                      ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-sm shadow-red-500/20'
                                      : isMed
                                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                      : 'bg-yellow-500/10 text-yellow-300/80 border-yellow-500/30'
                                  }`}
                                >
                                  {isHigh ? '🔴 HIGH' : isMed ? '🟠 MEDIUM' : '🟡 LOW'}
                                </span>

                                {/* Currency Badge */}
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-800 text-white border border-slate-700 flex items-center gap-1.5">
                                  <span>{COUNTRY_FLAGS[evt.country]?.flag || '🌐'}</span>
                                  <span>{evt.country}</span>
                                </span>

                                {/* Timing / Countdown status */}
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${timing.color}`}>
                                  {timing.label}
                                </span>

                                {/* Gold Impact Tag */}
                                {COUNTRY_FLAGS[evt.country]?.goldImpact && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                    🥇 Gold XAU/USD
                                  </span>
                                )}
                              </div>

                              {/* Event Title */}
                              <h4 className="text-white font-bold text-sm sm:text-base leading-snug">
                                {evt.title}
                              </h4>

                              {/* Analysis/Impact note */}
                              {impactNote && (
                                <p className="text-[11px] text-slate-400 leading-relaxed italic bg-slate-950/50 p-2 rounded-lg border border-slate-800/80 max-w-3xl">
                                  <span className="text-amber-400 font-bold not-italic">Tahlil: </span>
                                  {impactNote}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right: Forecast vs Previous metrics */}
                          <div className="flex items-center gap-3 lg:gap-4 flex-shrink-0 self-start lg:self-center bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                            {/* Forecast Box */}
                            <div className="text-center min-w-[75px]">
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kutilma</div>
                              <div className="text-sm font-black font-mono text-cyan-300 mt-0.5">
                                {evt.forecast || '—'}
                              </div>
                              <div className="text-[9px] text-slate-500">Forecast</div>
                            </div>

                            <div className="w-px h-8 bg-slate-800" />

                            {/* Previous Box */}
                            <div className="text-center min-w-[75px]">
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Oldingi</div>
                              <div className="text-sm font-black font-mono text-slate-300 mt-0.5">
                                {evt.previous || '—'}
                              </div>
                              <div className="text-[9px] text-slate-500">Previous</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer disclaimer */}
      <div className="text-center text-xs text-slate-500 pt-3 pb-6">
        Ma&apos;lumotlar real vaqt rejimida <a href="https://www.forexfactory.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">ForexFactory.com</a> rasmiy tarmog&apos;idan yuklab olinadi. Barcha huquqlar himoyalangan.
      </div>
    </div>
  );
}
