'use client';

import { useState, useEffect } from 'react';
import TelegramShareModal from './TelegramShareModal';

export interface UserNavSection {
  group: string;
  items: {
    id: string;
    label: string;
    badge?: string;
    icon: React.ReactNode;
  }[];
}

export const USER_NAV_SECTIONS: UserNavSection[] = [
  {
    group: 'Asosiy Savdo',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5"/>
            <rect x="14" y="3" width="7" height="7" rx="1.5"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5"/>
            <rect x="14" y="14" width="7" height="7" rx="1.5"/>
          </svg>
        ),
      },
      {
        id: 'calc',
        label: 'Kalkulyator & Signal',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2"/>
            <line x1="8" y1="6" x2="16" y2="6"/>
            <line x1="8" y1="10" x2="8" y2="10"/>
            <line x1="12" y1="10" x2="12" y2="10"/>
            <line x1="16" y1="10" x2="16" y2="10"/>
            <line x1="8" y1="14" x2="8" y2="14"/>
            <line x1="12" y1="14" x2="12" y2="14"/>
            <line x1="16" y1="14" x2="16" y2="14"/>
          </svg>
        ),
      },
      {
        id: 'chart',
        label: 'Live Grafik',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        ),
      },
      {
        id: 'multichart',
        label: 'Multi-Grid',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="8" height="8" rx="1"/>
            <rect x="13" y="3" width="8" height="8" rx="1"/>
            <rect x="3" y="13" width="8" height="8" rx="1"/>
            <rect x="13" y="13" width="8" height="8" rx="1"/>
          </svg>
        ),
      },
      {
        id: 'journal',
        label: 'Savdo Jurnali',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        ),
      },
    ],
  },
  {
    group: 'AI & SMC Tahlil',
    items: [
      {
        id: 'trap',
        label: 'Trap Hunter',
        badge: 'HOT',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        ),
      },
      {
        id: 'radar',
        label: '18-Radar',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="6"/>
            <circle cx="12" cy="12" r="2"/>
            <line x1="12" y1="2" x2="12" y2="12"/>
          </svg>
        ),
      },
      {
        id: 'delta',
        label: 'Vol Delta',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        ),
      },
      {
        id: 'autopsy',
        label: 'Trade Autopsy',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        ),
      },
    ],
  },
  {
    group: 'Bozor & Risk Boshqaruvi',
    items: [
      {
        id: 'checklist',
        label: 'Checklist',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 11 12 14 22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        ),
      },
      {
        id: 'risk',
        label: 'Risk & Lot',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        ),
      },
      {
        id: 'proprisk',
        label: 'Prop Guardian',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        ),
      },
      {
        id: 'heatmap',
        label: 'Heatmap',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
          </svg>
        ),
      },
      {
        id: 'backtest',
        label: 'Backtest',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
        ),
      },
      {
        id: 'killzones',
        label: 'Killzones',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 14 14"/>
          </svg>
        ),
      },
      {
        id: 'calendar',
        label: 'Taqvim (News)',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        ),
      },
      {
        id: 'encyclopedia',
        label: 'Lug\'at & Ensiklopediya',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        ),
      },
    ],
  },
];

interface UserTerminalLayoutProps {
  currentUsername: string;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function UserTerminalLayout({
  currentUsername,
  activeTab,
  onSelectTab,
  onLogout,
  children,
}: UserTerminalLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [time, setTime] = useState<Date | null>(null);
  const [isTelegramOpen, setIsTelegramOpen] = useState(false);
  const [balance, setBalance] = useState('1000');
  const [prices, setPrices] = useState({
    gold: '4506.39',
    btc: '72298',
    eur: '1.0852',
    dxy: '104.25',
  });

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('trading_calc_balance');
      if (saved) setBalance(saved);
    } catch {}
  }, []);

  const refreshLivePrices = async () => {
    try {
      const resGold = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT');
      if (resGold.ok) {
        const j = await resGold.json();
        if (j.price) setPrices((p) => ({ ...p, gold: parseFloat(j.price).toFixed(2) }));
      }
      const resBtc = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
      if (resBtc.ok) {
        const j = await resBtc.json();
        if (j.price) setPrices((p) => ({ ...p, btc: parseFloat(j.price).toFixed(0) }));
      }
    } catch {}
  };

  useEffect(() => {
    refreshLivePrices();
    const intv = setInterval(refreshLivePrices, 25000);
    return () => clearInterval(intv);
  }, []);

  let londonOpen = false;
  let nyOpen = false;
  let uzbTimeStr = '--:--:--';

  if (time) {
    const nyDateStr = time.toLocaleString('en-US', { timeZone: 'America/New_York' });
    const nyDate = new Date(nyDateStr);
    const nyH = nyDate.getHours();
    londonOpen = nyH >= 3 && nyH < 12;
    nyOpen = nyH >= 8 && nyH < 17;
    uzbTimeStr = time.toLocaleTimeString('uz-UZ', { timeZone: 'Asia/Tashkent', hour12: false });
  }

  const renderSidebarContent = (closeDrawer?: () => void) => (
    <aside
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #090912 0%, #06060c 100%)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Brand Header */}
      <div
        className="flex items-center justify-between px-5 h-16 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          onClick={() => { onSelectTab('dashboard'); if (closeDrawer) closeDrawer(); }}
          className="flex items-center gap-3 group text-left"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              boxShadow: '0 0 20px rgba(59,130,246,0.35)',
            }}
          >
            <span className="text-base font-black text-white">⚡</span>
          </div>
          <div>
            <div className="text-white text-sm font-black tracking-tight leading-none flex items-center gap-1.5">
              <span>ELIF TRADING</span>
            </div>
            <div className="text-[10px] mt-1 font-bold tracking-wider uppercase text-sky-400">
              Trader Terminal
            </div>
          </div>
        </button>
        {closeDrawer && (
          <button
            onClick={closeDrawer}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/5 text-slate-400"
            aria-label="Close sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto" style={{ scrollbarWidth: 'none' }} aria-label="Trader navigation">
        {USER_NAV_SECTIONS.map((section) => (
          <div key={section.group} className="mb-5">
            <p
              className="px-3 mb-1.5 text-[10px] font-black uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              {section.group}
            </p>
            <ul className="space-y-0.5" role="list">
              {section.items.map((item) => {
                const active = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        onSelectTab(item.id);
                        if (closeDrawer) closeDrawer();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 relative group text-left"
                      style={
                        active
                          ? {
                              color: 'white',
                              background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(37,99,235,0.12) 100%)',
                              boxShadow: 'inset 0 0 0 1px rgba(59,130,246,0.35)',
                            }
                          : { color: 'rgba(255,255,255,0.45)' }
                      }
                      aria-current={active ? 'page' : undefined}
                    >
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full"
                          style={{ background: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }}
                          aria-hidden="true"
                        />
                      )}
                      <span
                        className="transition-colors duration-200"
                        style={{ color: active ? '#38bdf8' : 'rgba(255,255,255,0.4)' }}
                      >
                        {item.icon}
                      </span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider"
                          style={{
                            background: item.badge === 'AI' ? 'rgba(99,102,241,0.2)' : 'rgba(239,68,68,0.2)',
                            color: item.badge === 'AI' ? '#a5b4fc' : '#fca5a5',
                            border: `1px solid ${item.badge === 'AI' ? 'rgba(99,102,241,0.3)' : 'rgba(239,68,68,0.3)'}`,
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer Profile & Exit */}
      <footer
        className="p-3 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div
          className="flex items-center gap-3 p-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
            aria-hidden="true"
          >
            {currentUsername.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate">{currentUsername}</div>
            <div className="text-[10px] text-emerald-400 font-mono font-bold">● Trader (Faol)</div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-all text-xs"
            title="Tizimdan chiqish"
          >
            🚪
          </button>
        </div>
      </footer>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden text-slate-100" style={{ background: '#07070e' }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-64 flex-shrink-0 h-full">
        {renderSidebarContent()}
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 h-full z-10">
            {renderSidebarContent(() => setMobileOpen(false))}
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header with Live Ticker Bar */}
        <header
          className="flex-shrink-0 px-4 py-2.5 space-y-2 border-b"
          style={{
            background: 'rgba(10,10,18,0.9)',
            borderColor: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Row 1: Live Tickers & World Clock */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5 text-xs">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white"
              aria-label="Open navigation menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>

            {/* Live Tickers */}
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar font-mono text-[11px]">
              <div className="flex items-center gap-1">
                <span className="text-amber-400 font-bold">🥇 XAU:</span>
                <span className="text-white font-bold">${prices.gold}</span>
                <span className="text-[9px] text-emerald-400">▲</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-orange-400 font-bold">₿ BTC:</span>
                <span className="text-white font-bold">${prices.btc}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sky-400 font-bold">💶 EUR:</span>
                <span className="text-white font-bold">${prices.eur}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-emerald-400 font-bold">💵 DXY:</span>
                <span className="text-white font-bold">{prices.dxy}</span>
              </div>
            </div>

            {/* Sessions & Tashkent Time */}
            <div className="flex items-center gap-3 ml-auto text-[11px]">
              <div className="hidden sm:flex items-center gap-2 border-r border-white/10 pr-3">
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${londonOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  <span className={londonOpen ? 'text-emerald-300 font-bold' : 'text-slate-500'}>🇬🇧 London</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${nyOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  <span className={nyOpen ? 'text-emerald-300 font-bold' : 'text-slate-500'}>🇺🇸 NY</span>
                </span>
              </div>

              <div className="font-mono text-slate-300 flex items-center gap-1">
                <span>🇺🇿</span>
                <span className="font-bold text-white">{uzbTimeStr}</span>
              </div>

              <button
                onClick={refreshLivePrices}
                title="Narxlarni yangilash"
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-all text-xs"
              >
                🔄
              </button>
            </div>
          </div>

          {/* Row 2: User profile, Balance & Quick action buttons */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-black text-white shadow-md">
                {currentUsername.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-white text-xs font-bold">{currentUsername}</span>
                  <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded-full font-bold border border-blue-500/40">
                    👤 Trader
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span>💰 Balans:</span>
                  <span className="text-emerald-400 font-mono font-bold">${balance}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTelegramOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <span>✈️</span>
                <span>Telegram</span>
              </button>

              <a
                href="https://t.me/+U5pPkneGmM1mMjYy"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-xl text-xs border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-all"
                title="Kanalga ulanish"
              >
                📡
              </a>

              <button
                type="button"
                onClick={onLogout}
                className="px-2.5 py-1.5 text-slate-400 hover:text-red-300 hover:bg-red-950/30 rounded-xl text-xs transition-all flex items-center gap-1 border border-transparent hover:border-red-500/30 active:scale-95"
                title="Chiqish"
              >
                <span>🚪</span>
                <span className="hidden sm:inline">Chiqish</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.08) transparent',
          }}
        >
          {children}
        </main>
      </div>

      {/* Telegram Share Modal */}
      <TelegramShareModal
        isOpen={isTelegramOpen}
        onClose={() => setIsTelegramOpen(false)}
        tradeData={null}
      />
    </div>
  );
}
