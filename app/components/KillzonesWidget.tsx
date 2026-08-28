'use client';

import { useState, useEffect } from 'react';

interface SessionInfo {
  id: string;
  name: string;
  shortDesc: string;
  nyStartHour: number;
  nyStartMin: number;
  nyEndHour: number;
  nyEndMin: number;
  icon: string;
  isKillzone?: boolean;
}

const SESSIONS: SessionInfo[] = [
  {
    id: 'london_open',
    name: 'London Open Killzone',
    shortDesc: 'Eng yuqori likvidlik va Judash Swing harakati',
    nyStartHour: 2,
    nyStartMin: 0,
    nyEndHour: 5,
    nyEndMin: 0,
    icon: '🇬🇧',
    isKillzone: true,
  },
  {
    id: 'ny_open',
    name: 'New York Open Killzone',
    shortDesc: 'AQSH bozori ochilishi va muhim yangiliklar',
    nyStartHour: 7,
    nyStartMin: 0,
    nyEndHour: 10,
    nyEndMin: 0,
    icon: '🇺🇸',
    isKillzone: true,
  },
  {
    id: 'silver_bullet_ny',
    name: 'ICT Silver Bullet (NY AM)',
    shortDesc: '10:00 - 11:00 NY: FVG va Yuqori ehtimolli setup',
    nyStartHour: 10,
    nyStartMin: 0,
    nyEndHour: 11,
    nyEndMin: 0,
    icon: '⚡',
    isKillzone: true,
  },
  {
    id: 'london_close',
    name: 'London Close Killzone',
    shortDesc: 'Kunning qaytish (reversal) yoki trend davomi',
    nyStartHour: 10,
    nyStartMin: 0,
    nyEndHour: 12,
    nyEndMin: 0,
    icon: '🌆',
    isKillzone: true,
  },
  {
    id: 'asian_session',
    name: 'Asian Session (Tokyo)',
    shortDesc: 'Konsolidatsiya va kunlik oraliq shakllanishi',
    nyStartHour: 19, // 7 PM NY = 00:00 UTC
    nyStartMin: 0,
    nyEndHour: 27, // 3 AM NY (next day)
    nyEndMin: 0,
    icon: '🌏',
  },
];

export default function KillzonesWidget() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!currentTime) return null;

  // New York vaqtini aniqlash (EDT/EST auto)
  const nyDateStr = currentTime.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const nyDate = new Date(nyDateStr);
  const nyHours = nyDate.getHours();
  const nyMinutes = nyDate.getMinutes();
  const nySeconds = nyDate.getSeconds();
  const nyCurrentMins = nyHours * 60 + nyMinutes;

  // Tashkent vaqti
  const uzbDateStr = currentTime.toLocaleString('en-US', { timeZone: 'Asia/Tashkent' });
  const uzbDate = new Date(uzbDateStr);
  const uzbHours = String(uzbDate.getHours()).padStart(2, '0');
  const uzbMinutes = String(uzbDate.getMinutes()).padStart(2, '0');
  const uzbSeconds = String(uzbDate.getSeconds()).padStart(2, '0');

  const formatNYTime = `${String(nyHours).padStart(2, '0')}:${String(nyMinutes).padStart(2, '0')}:${String(nySeconds).padStart(2, '0')}`;

  const getSessionState = (session: SessionInfo) => {
    let startMins = session.nyStartHour * 60 + session.nyStartMin;
    let endMins = session.nyEndHour * 60 + session.nyEndMin;

    let cur = nyCurrentMins;

    let isActive = false;
    let minsLeft = 0;
    let minsUntilStart = 0;

    if (endMins > 24 * 60) {
      // Over midnight
      if (cur >= startMins || cur < endMins - 24 * 60) {
        isActive = true;
        const adjustedCur = cur < startMins ? cur + 24 * 60 : cur;
        minsLeft = endMins - adjustedCur;
      } else {
        minsUntilStart = (startMins - cur + 24 * 60) % (24 * 60);
      }
    } else {
      if (cur >= startMins && cur < endMins) {
        isActive = true;
        minsLeft = endMins - cur;
      } else {
        minsUntilStart = (startMins - cur + 24 * 60) % (24 * 60);
      }
    }

    return { isActive, minsLeft, minsUntilStart, startMins, endMins };
  };

  const activeSessionsCount = SESSIONS.filter(s => getSessionState(s).isActive).length;

  return (
    <div className="bg-slate-900/85 border border-indigo-600/50 rounded-2xl p-4 mb-4 backdrop-blur shadow-xl">
      {/* Header with clocks */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700/80">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⏰</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-indigo-400 text-sm font-bold tracking-wider">ICT KILLZONES & SEANSLAR</h3>
              {activeSessionsCount > 0 ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40 animate-pulse">
                  ● {activeSessionsCount} ta Faol
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                  Off-Session
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs">New York & London vaqtlari bo&apos;yicha real-time</p>
          </div>
        </div>

        {/* Clocks */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded-xl text-center">
            <div className="text-[10px] text-slate-400 font-bold">🇺🇸 NEW YORK</div>
            <div className="text-sm font-black text-amber-400 font-mono">{formatNYTime}</div>
          </div>
          <div className="bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded-xl text-center">
            <div className="text-[10px] text-slate-400 font-bold">🇺🇿 TOSHKENT</div>
            <div className="text-sm font-black text-sky-400 font-mono">{uzbHours}:{uzbMinutes}:{uzbSeconds}</div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
            title="Barchasini ko'rish"
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Session list */}
      <div className="mt-3 space-y-2">
        {SESSIONS.map((session) => {
          const { isActive, minsLeft, minsUntilStart } = getSessionState(session);
          if (!isExpanded && !isActive && minsUntilStart > 120) return null; // Show only active/upcoming when collapsed

          const startStr = `${String(session.nyStartHour % 24).padStart(2, '0')}:${String(session.nyStartMin).padStart(2, '0')}`;
          const endStr = `${String(session.nyEndHour % 24).padStart(2, '0')}:${String(session.nyEndMin).padStart(2, '0')}`;

          const hoursLeft = Math.floor(minsLeft / 60);
          const remainMins = minsLeft % 60;
          const untilHours = Math.floor(minsUntilStart / 60);
          const untilMins = minsUntilStart % 60;

          return (
            <div
              key={session.id}
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                isActive
                  ? 'bg-emerald-950/40 border-emerald-500/60 shadow-md shadow-emerald-950/40'
                  : minsUntilStart <= 60
                  ? 'bg-amber-950/30 border-amber-500/40'
                  : 'bg-slate-800/40 border-slate-700/50 opacity-75'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-lg flex-shrink-0">{session.icon}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                      {session.name}
                    </span>
                    {session.isKillzone && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-900/40 text-purple-300 border border-purple-700/40">
                        KZ
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    NY: {startStr} - {endStr} | {session.shortDesc}
                  </div>
                </div>
              </div>

              {/* Status pill */}
              <div className="text-right flex-shrink-0">
                {isActive ? (
                  <div className="flex flex-col items-end">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/40 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      FAOL
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {hoursLeft > 0 ? `${hoursLeft}s ` : ''}{remainMins}d qoldi
                    </span>
                  </div>
                ) : minsUntilStart <= 60 ? (
                  <div className="flex flex-col items-end">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
                      ⚡ {untilMins} daqiqadan so&apos;ng
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Yaqinlashmoqda</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-end">
                    <span className="text-slate-500 text-[11px] font-mono">
                      {untilHours}s {untilMins}d so&apos;ng
                    </span>
                    <span className="text-[10px] text-slate-600">Kutilmoqda</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
