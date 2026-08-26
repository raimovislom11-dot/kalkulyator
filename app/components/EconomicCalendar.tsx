'use client';

import { useState, useEffect, useMemo } from 'react';

export interface EconomicEvent {
  id: string;
  title: string;
  country: 'USD' | 'EUR' | 'GBP';
  impact: 'HIGH' | 'MED' | 'LOW';
  date: string; // ISO format or relative
  timeUTC: string;
  forecast?: string;
  previous?: string;
  description: string;
}

// Dynamic High Impact economic recurring events for Gold & Forex
function getDynamicEvents(): EconomicEvent[] {
  const now = new Date();
  const getOffsetDate = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  return [
    {
      id: 'cpi_usd',
      title: 'CPI (Inflyatsiya ko\'rsatkichi m/m & y/y)',
      country: 'USD',
      impact: 'HIGH',
      date: getOffsetDate(0),
      timeUTC: '12:30',
      forecast: '2.9%',
      previous: '3.0%',
      description: "AQSH inflyatsiyasi. Yuqori chiqsa USD o'sadi, Oltin tushishi mumkin.",
    },
    {
      id: 'unemp_claims',
      title: 'Haftalik Ishsizlik da\'volari (Initial Jobless Claims)',
      country: 'USD',
      impact: 'HIGH',
      date: getOffsetDate(1),
      timeUTC: '12:30',
      forecast: '228K',
      previous: '233K',
      description: "Har payshanba chiqadigan muhim mehnat bozori indikatori.",
    },
    {
      id: 'nfp_usd',
      title: 'Non-Farm Payrolls (NFP) & Unemployment Rate',
      country: 'USD',
      impact: 'HIGH',
      date: getOffsetDate(2),
      timeUTC: '12:30',
      forecast: '185K',
      previous: '175K',
      description: "Oltin (XAU) va USD da eng kuchli narx tebranishini (volatillik) keltirib chiqaradi.",
    },
    {
      id: 'pmi_usd',
      title: 'ISM Manufacturing / Services PMI',
      country: 'USD',
      impact: 'MED',
      date: getOffsetDate(3),
      timeUTC: '14:00',
      forecast: '51.2',
      previous: '50.8',
      description: "Ishlab chiqarish va xizmat ko'rsatish sektori faolligi.",
    },
    {
      id: 'ecb_eur',
      title: 'ECB Monetary Policy Statement & Rate Decision',
      country: 'EUR',
      impact: 'HIGH',
      date: getOffsetDate(4),
      timeUTC: '12:15',
      forecast: '3.75%',
      previous: '4.00%',
      description: "Yevropa Markaziy Banki foiz stavkasi qarori (EURUSD ga ta'siri).",
    },
    {
      id: 'fomc_usd',
      title: 'FOMC Foiz stavkasi & Matbuot Anjumani (Powell)',
      country: 'USD',
      impact: 'HIGH',
      date: getOffsetDate(7),
      timeUTC: '18:00',
      forecast: '5.25%',
      previous: '5.50%',
      description: "Federal Zaxira Tizimi (FED) stavkasi va Powell bayonoti.",
    },
  ];
}

export default function EconomicCalendar() {
  const [filter, setFilter] = useState<'ALL' | 'USD' | 'HIGH'>('ALL');
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const allEvents = useMemo(() => getDynamicEvents(), [now]);

  const filteredEvents = useMemo(() => {
    if (filter === 'USD') return allEvents.filter((e) => e.country === 'USD');
    if (filter === 'HIGH') return allEvents.filter((e) => e.impact === 'HIGH');
    return allEvents;
  }, [filter, allEvents]);

  return (
    <div className="bg-slate-900/85 border border-rose-600/50 rounded-2xl p-5 mb-4 backdrop-blur shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-700/80">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📰</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-rose-400 text-sm font-bold tracking-wider">IQTISODIY TAQVIM & YANGILIKLAR</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30 animate-pulse">
                High Impact
              </span>
            </div>
            <p className="text-slate-500 text-xs">Oltin (XAU) va Valyutalarga kuchli ta&apos;sir qiluvchi hodisalar</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 text-xs font-bold">
          {[
            { key: 'ALL', label: 'Barchasi' },
            { key: 'USD', label: '🇺🇸 Faqat USD (Gold)' },
            { key: 'HIGH', label: '🔴 High Impact' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key as any)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filter === item.key
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Warning Notice */}
      <div className="bg-gradient-to-r from-rose-950/60 to-orange-950/40 border border-rose-600/40 rounded-xl p-3 mb-4 flex items-center gap-3">
        <span className="text-2xl">⚠️</span>
        <div className="text-xs">
          <span className="text-rose-300 font-bold">Qoida: </span>
          <span className="text-slate-300">
            Qizil (High Impact) yangiliklar chiqishidan 15 daqiqa oldin va keyin yangi pozitsiya ochmaslik yoki Stop Lossni Break-Even ga surish tavsiya etiladi.
          </span>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-2.5">
        {filteredEvents.map((evt) => {
          const isHigh = evt.impact === 'HIGH';
          return (
            <div
              key={evt.id}
              className={`p-3 rounded-xl border transition-all ${
                isHigh
                  ? 'bg-rose-950/20 border-rose-700/50 hover:border-rose-500/70'
                  : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      isHigh
                        ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                        : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                    }`}
                  >
                    {isHigh ? '🔴 HIGH' : '🟠 MED'}
                  </span>
                  <span className="text-white font-bold text-xs">{evt.country}</span>
                  <span className="text-slate-200 font-bold text-xs">{evt.title}</span>
                </div>
                <span className="text-slate-400 text-xs font-mono font-bold whitespace-nowrap">
                  {evt.date} • {evt.timeUTC} UTC
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-700/40">
                <p className="text-slate-400 italic text-[11px] flex-1">{evt.description}</p>
                <div className="flex items-center gap-3 font-mono text-xs">
                  {evt.forecast && (
                    <span>
                      Prognoz: <strong className="text-amber-300">{evt.forecast}</strong>
                    </span>
                  )}
                  {evt.previous && (
                    <span>
                      Oldingi: <strong className="text-slate-300">{evt.previous}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
