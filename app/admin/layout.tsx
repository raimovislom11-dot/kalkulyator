'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import TelegramShareModal from '../components/TelegramShareModal';
import ThemeLanguageSwitcher from '../components/ThemeLanguageSwitcher';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { clearSession, loadSession } from '../lib/users';

export interface NavItem {
  href: string;
  label: string;
  badge?: string;
  exact?: boolean;
  icon: React.ReactNode;
}

export interface NavSection {
  group: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    group: 'Asosiy Savdo',
    items: [
      {
        href: '/admin',
        label: 'Dashboard',
        exact: true,
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
        href: '/admin/ai-analysis',
        label: 'AI Tahlil Paneli',
        badge: 'AI',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
            <path d="M12 6a6 6 0 0 0-6 6 1 1 0 0 0 2 0 4 4 0 0 1 4-4 1 1 0 0 0 0-2z"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
        ),
      },
      {
        href: '/admin/kalkulyator',
        label: 'Kalkulyator',
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
            <line x1="8" y1="18" x2="8" y2="18"/>
            <line x1="12" y1="18" x2="12" y2="18"/>
            <line x1="16" y1="18" x2="16" y2="18"/>
          </svg>
        ),
      },
      {
        href: '/admin/grafik',
        label: 'Live Grafik',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        ),
      },
      {
        href: '/admin/multi',
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
        href: '/admin/journal',
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
      {
        href: '/admin/trades',
        label: 'Trades & P&L',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
        ),
      },
    ],
  },
  {
    group: 'AI & SMC Tahlil',
    items: [
      {
        href: '/admin/chat',
        label: 'AI Chat (Claude)',
        badge: 'AI',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        ),
      },
      {
        href: '/admin/trap',
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
        href: '/admin/radar',
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
        href: '/admin/delta',
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
        href: '/admin/autopsy',
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
        href: '/admin/checklist',
        label: 'Checklist',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 11 12 14 22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        ),
      },
      {
        href: '/admin/risk',
        label: 'Risk & Lot',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        ),
      },
      {
        href: '/admin/prop',
        label: 'Prop Guardian',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        ),
      },
      {
        href: '/admin/heatmap',
        label: 'Heatmap',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
          </svg>
        ),
      },
      {
        href: '/admin/backtest',
        label: 'Backtest',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
        ),
      },
      {
        href: '/admin/killzones',
        label: 'Killzones',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 14 14"/>
          </svg>
        ),
      },
      {
        href: '/admin/taqvim',
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
        href: '/admin/lugat',
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
  {
    group: 'Boshqaruv & Tizim',
    items: [
      {
        href: '/admin/users',
        label: 'Foydalanuvchilar',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        ),
      },
      {
        href: '/admin/settings',
        label: 'Sozlamalar',
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        ),
      },
    ],
  },
];

function Sidebar({ onClose, onLogout }: { onClose?: () => void; onLogout?: () => void }) {
  const pathname = usePathname();
  const { theme, t } = useThemeLanguage();
  const isLight = theme === 'light';

  return (
    <aside
      className="flex flex-col h-full overflow-hidden transition-colors duration-300"
      style={{
        background: isLight
          ? 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)'
          : 'linear-gradient(180deg, #090912 0%, #06060c 100%)',
        borderRight: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Brand Header */}
      <div
        className="flex items-center justify-between px-5 h-16 flex-shrink-0"
        style={{
          borderBottom: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Link href="/admin" className="flex items-center gap-3 group">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              boxShadow: '0 0 20px rgba(245,158,11,0.35)',
            }}
          >
            <span className="text-base font-black text-slate-950">👑</span>
          </div>
          <div>
            <div
              className="text-sm font-black tracking-tight leading-none flex items-center gap-1.5"
              style={{ color: isLight ? '#0f172a' : '#ffffff' }}
            >
              <span>ELIF TRADING</span>
            </div>
            <div
              className="text-[10px] mt-1 font-bold tracking-wider uppercase"
              style={{ color: isLight ? '#d97706' : 'rgba(245,158,11,0.9)' }}
            >
              Pro Admin Panel
            </div>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style={{ color: isLight ? '#64748b' : 'rgba(255,255,255,0.4)' }}
            aria-label="Close sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto" style={{ scrollbarWidth: 'none' }} aria-label="Admin navigation">
        {NAV_SECTIONS.map((section) => (
          <div key={section.group} className="mb-5">
            <p
              className="px-3 mb-1.5 text-[10px] font-black uppercase tracking-widest"
              style={{ color: isLight ? '#64748b' : 'rgba(255,255,255,0.3)' }}
            >
              {section.group}
            </p>
            <ul className="space-y-0.5" role="list">
              {section.items.map((item) => {
                const active = ('exact' in item && item.exact) ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 relative group"
                      style={
                        active
                          ? {
                              color: isLight ? '#b45309' : '#ffffff',
                              background: isLight
                                ? 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(217,119,6,0.12) 100%)'
                                : 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(217,119,6,0.12) 100%)',
                              boxShadow: isLight
                                ? 'inset 0 0 0 1px rgba(245,158,11,0.4)'
                                : 'inset 0 0 0 1px rgba(245,158,11,0.3)',
                            }
                          : {
                              color: isLight ? '#475569' : 'rgba(255,255,255,0.45)',
                            }
                      }
                      aria-current={active ? ('page' as const) : undefined}
                    >
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full"
                          style={{ background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }}
                          aria-hidden="true"
                        />
                      )}
                      <span
                        className="transition-colors duration-200"
                        style={{
                          color: active ? '#f59e0b' : isLight ? '#64748b' : 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {item.icon}
                      </span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider"
                          style={{
                            background: item.badge === 'AI' ? 'rgba(99,102,241,0.2)' : 'rgba(239,68,68,0.2)',
                            color: item.badge === 'AI' ? '#6366f1' : '#ef4444',
                            border: `1px solid ${item.badge === 'AI' ? 'rgba(99,102,241,0.3)' : 'rgba(239,68,68,0.3)'}`,
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
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
        style={{
          borderTop: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          className="flex items-center gap-3 p-2 rounded-xl transition-colors duration-300"
          style={{
            background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.03)',
            border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#000',
            }}
            aria-hidden="true"
          >
            A
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-xs font-bold truncate"
              style={{ color: isLight ? '#0f172a' : '#ffffff' }}
            >
              Admin
            </div>
            <div className="text-[10px] text-emerald-500 font-mono font-bold">● Online</div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs"
            title="Tizimdan chiqish (Login sahifasiga)"
          >
            🚪
          </button>
        </div>
      </footer>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { theme, t } = useThemeLanguage();
  const isLight = theme === 'light';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [time, setTime] = useState<Date | null>(null);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [balance, setBalance] = useState('1000');
  const [prices, setPrices] = useState({
    gold: '4506.39',
    btc: '72298',
    eur: '1.0852',
    dxy: '104.25',
  });
  const router = useRouter();

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const s = loadSession();
    if (!s || s.role !== 'admin') {
      window.location.href = '/';
    }
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
    } catch (e) {}
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

  const handleLogout = () => {
    clearSession();
    try {
      sessionStorage.clear();
      localStorage.removeItem('trading_app_session');
    } catch {}
    window.location.href = '/';
  };

  return (
    <div
      className="flex h-screen overflow-hidden transition-colors duration-300"
      style={{
        background: isLight ? '#f1f5f9' : '#07070e',
        color: isLight ? '#0f172a' : '#f8fafc',
      }}
    >
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-64 flex-shrink-0 h-full">
        <Sidebar onLogout={handleLogout} />
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
            <Sidebar onClose={() => setMobileOpen(false)} onLogout={handleLogout} />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header with Live Ticker Bar */}
        <header
          className="flex-shrink-0 px-4 py-2.5 space-y-2 border-b transition-colors duration-300"
          style={{
            background: isLight ? 'rgba(255,255,255,0.92)' : 'rgba(10,10,18,0.9)',
            borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Row 1: Live Tickers & World Clock */}
          <div
            className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl text-xs transition-colors duration-300"
            style={{
              background: isLight ? '#f8fafc' : 'rgba(0,0,0,0.4)',
              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-slate-950 dark:hover:text-white"
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
                <span className="text-amber-500 font-bold">🥇 XAU:</span>
                <span className="font-bold" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                  ${prices.gold}
                </span>
                <span className="text-[9px] text-emerald-500">▲</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-orange-500 font-bold">₿ BTC:</span>
                <span className="font-bold" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                  ${prices.btc}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sky-500 font-bold">💶 EUR:</span>
                <span className="font-bold" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                  ${prices.eur}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-emerald-500 font-bold">💵 DXY:</span>
                <span className="font-bold" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                  {prices.dxy}
                </span>
              </div>
            </div>

            {/* Sessions & Tashkent Time */}
            <div className="flex items-center gap-3 ml-auto text-[11px]">
              <div
                className="hidden sm:flex items-center gap-2 pr-3"
                style={{ borderRight: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)' }}
              >
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${londonOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  <span className={londonOpen ? 'text-emerald-600 dark:text-emerald-300 font-bold' : 'text-slate-500'}>
                    🇬🇧 {t('london')}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${nyOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  <span className={nyOpen ? 'text-emerald-600 dark:text-emerald-300 font-bold' : 'text-slate-500'}>
                    🇺🇸 {t('newyork')}
                  </span>
                </span>
              </div>

              <div className="font-mono flex items-center gap-1" style={{ color: isLight ? '#475569' : '#cbd5e1' }}>
                <span>🇺🇿</span>
                <span className="font-bold" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                  {uzbTimeStr}
                </span>
              </div>

              <button
                onClick={refreshLivePrices}
                title={t('refresh')}
                className="p-1 text-slate-400 hover:text-slate-950 dark:hover:text-white rounded hover:bg-black/5 dark:hover:bg-white/5 transition-all text-xs"
              >
                🔄
              </button>
            </div>
          </div>

          {/* Row 2: User profile, Balance & Quick action buttons */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-xs font-black text-slate-950 shadow-md">
                A
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                    admin
                  </span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-300 px-1.5 py-0.2 rounded-full font-bold border border-amber-500/40">
                    👑 {t('adminBadge')}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span>💰 {t('balance')}:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">${balance}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* 🌐 Til & 🌓 Dark/Light Mode Switcher */}
              <ThemeLanguageSwitcher />

              <button
                onClick={() => setIsTelegramModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500/20 hover:bg-sky-500/30 text-sky-600 dark:text-sky-300 border border-sky-500/40 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <span>✈️</span>
                <span className="hidden sm:inline">Telegram</span>
              </button>

              <a
                href="https://t.me/+U5pPkneGmM1mMjYy"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-all"
                title="Kanalga ulanish"
              >
                📡
              </a>

              <button
                type="button"
                onClick={handleLogout}
                className="px-2.5 py-1.5 text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl text-xs transition-all flex items-center gap-1 border border-transparent hover:border-red-500/30 active:scale-95"
                title={t('logout')}
              >
                <span>🚪</span>
                <span className="hidden sm:inline">{t('logout')}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-colors duration-300"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: isLight ? 'rgba(0,0,0,0.15) transparent' : 'rgba(255,255,255,0.08) transparent',
          }}
        >
          {children}
        </main>
      </div>

      {/* Telegram Share Modal */}
      <TelegramShareModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
        tradeData={null}
      />
    </div>
  );
}
