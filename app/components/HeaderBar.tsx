'use client';

import { useState, useEffect, memo } from 'react';

interface HeaderBarProps {
  currentUsername: string;
  isAdmin: boolean;
  activeMainTab: string;
  setActiveMainTab: (tab: any) => void;
  onLogout: () => void;
  onOpenTelegram: () => void;
  onRefreshPrices?: () => void;
}

function HeaderBar({
  currentUsername,
  isAdmin,
  activeMainTab,
  setActiveMainTab,
  onLogout,
  onOpenTelegram,
  onRefreshPrices,
}: HeaderBarProps) {
  const [time, setTime] = useState<Date | null>(null);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [prices, setPrices] = useState({
    gold: '4492.50',
    btc: '71950',
    eur: '1.0852',
    dxy: '104.25',
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [balance, setBalance] = useState('1000');

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Balansni localStorage dan olish
  useEffect(() => {
    try {
      const saved = localStorage.getItem('trading_calc_balance');
      if (saved) setBalance(saved);
    } catch {}
  }, []);

  // Real-time narxlarni yangilash
  const refreshLivePrices = async () => {
    setIsRefreshing(true);
    try {
      // Binance Gold (PAXG)
      const resGold = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT');
      if (resGold.ok) {
        const j = await resGold.json();
        if (j.price) setPrices((p) => ({ ...p, gold: parseFloat(j.price).toFixed(2) }));
      }
      // BTC
      const resBtc = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
      if (resBtc.ok) {
        const j = await resBtc.json();
        if (j.price) setPrices((p) => ({ ...p, btc: parseFloat(j.price).toFixed(0) }));
      }
    } catch (e) {
      console.warn('Header ticker fetch error:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
      if (onRefreshPrices) onRefreshPrices();
    }
  };

  useEffect(() => {
    refreshLivePrices();
    const intv = setInterval(refreshLivePrices, 20000); // har 20 soniyada avto-yangilash
    return () => clearInterval(intv);
  }, []);

  // Sessiyalar holatini hisoblash (New York vaqti bo'yicha)
  let londonOpen = false;
  let nyOpen = false;
  let uzbTimeStr = '--:--:--';

  if (time) {
    const nyDateStr = time.toLocaleString('en-US', { timeZone: 'America/New_York' });
    const nyDate = new Date(nyDateStr);
    const nyH = nyDate.getHours();

    // London: 03:00 - 12:00 NY
    londonOpen = nyH >= 3 && nyH < 12;
    // New York: 08:00 - 17:00 NY
    nyOpen = nyH >= 8 && nyH < 17;

    uzbTimeStr = time.toLocaleTimeString('uz-UZ', { timeZone: 'Asia/Tashkent', hour12: false });
  }

  return (
    <header className="bg-slate-900/90 border border-slate-700/90 rounded-2xl p-2.5 sm:p-3 mb-4 backdrop-blur-xl shadow-2xl space-y-2.5">
      {/* 🔴 1. JONLI TIKERLAR VA BOZOR SESSIYALARI TASMASI */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800/80 text-xs">
        {/* Jonli Narxlar */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5">
          <div className="flex items-center gap-1 font-mono">
            <span className="text-amber-400 font-bold">🥇 XAU:</span>
            <span className="text-white font-bold">${prices.gold}</span>
            <span className="text-[10px] text-emerald-400">▲</span>
          </div>

          <div className="flex items-center gap-1 font-mono">
            <span className="text-orange-400 font-bold">₿ BTC:</span>
            <span className="text-white font-bold">${prices.btc}</span>
          </div>

          <div className="flex items-center gap-1 font-mono">
            <span className="text-blue-400 font-bold">💶 EUR:</span>
            <span className="text-white font-bold">${prices.eur}</span>
          </div>

          <div className="flex items-center gap-1 font-mono">
            <span className="text-emerald-400 font-bold">💵 DXY:</span>
            <span className="text-white font-bold">{prices.dxy}</span>
          </div>
        </div>

        {/* Jonli Dunyo Soati & Sessiyalar */}
        <div className="flex items-center gap-2.5 ml-auto text-[11px]">
          {/* Sessiya indikatorlari */}
          <div className="hidden sm:flex items-center gap-2 border-r border-slate-800 pr-2.5">
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${londonOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className={londonOpen ? 'text-emerald-300 font-bold' : 'text-slate-500'}>🇬🇧 London</span>
            </span>
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${nyOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className={nyOpen ? 'text-emerald-300 font-bold' : 'text-slate-500'}>🇺🇸 NY</span>
            </span>
          </div>

          {/* Toshkent vaqti */}
          <div className="font-mono text-slate-300 flex items-center gap-1">
            <span>🇺🇿</span>
            <span className="font-bold text-white">{uzbTimeStr}</span>
          </div>

          {/* Tezkor yangilash */}
          <button
            onClick={refreshLivePrices}
            disabled={isRefreshing}
            title="Narxlarni yangilash"
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all active:scale-95"
          >
            <span className={`inline-block ${isRefreshing ? 'animate-spin text-orange-400' : ''}`}>🔄</span>
          </button>
        </div>
      </div>

      {/* 👤 2. USER PROFILE, BALANS VA TEZKOR BOSHQARUV TUGMALARI */}
      <div className="flex items-center justify-between px-1">
        {/* User & Balans */}
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shadow-md ${
            isAdmin ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-slate-950 font-black' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
          }`}>
            {currentUsername.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-white text-xs font-bold">{currentUsername}</span>
              {isAdmin && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-full font-bold border border-amber-500/40">
                  👑 Admin
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <span>💰 Balans:</span>
              <span className="text-emerald-400 font-mono font-bold">${balance}</span>
            </div>
          </div>
        </div>

        {/* Tezkor Tugmalar (Telegram, Sound, Logout) */}
        <div className="flex items-center gap-1.5">
          {/* Telegram Havolasi */}
          <a
            href="https://t.me/+U5pPkneGmM1mMjYy"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-xl text-xs font-bold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 transition-all flex items-center gap-1 active:scale-95 shadow-sm"
            title="Telegram kanaliga o'tish"
          >
            <span>✈️</span>
            <span className="hidden sm:inline">Telegram</span>
          </a>

          {/* Ovoz rejimi */}
          <button
            onClick={() => setIsSoundOn(!isSoundOn)}
            className={`p-1.5 rounded-xl text-xs border transition-all ${
              isSoundOn ? 'bg-slate-800 text-emerald-400 border-slate-700' : 'bg-slate-800/60 text-slate-500 border-slate-800'
            }`}
            title={isSoundOn ? 'Ovoz yoqilgan' : "Ovoz o'chirilgan"}
          >
            {isSoundOn ? '🔊' : '🔇'}
          </button>

          {/* Chiqish */}
          <button
            onClick={onLogout}
            className="px-2.5 py-1 text-slate-400 hover:text-red-300 hover:bg-red-950/30 rounded-xl text-xs transition-all flex items-center gap-1 border border-transparent hover:border-red-500/30"
            title="Tizimdan chiqish"
          >
            <span>🚪</span>
            <span className="hidden sm:inline">Chiqish</span>
          </button>
        </div>
      </div>

      {/* 🗂️ 3. ASOSIY NAVIGATSIYA TABLARI */}
      <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-7 gap-1 sm:gap-1.5 text-xs font-bold pt-1 border-t border-slate-800/80">
        {[
          { id: 'calc', icon: '🧮', label: 'Kalkulyator' },
          { id: 'chart', icon: '📊', label: 'Jonli Grafik' },
          { id: 'risk', icon: '🎯', label: 'Risk & Lot' },
          { id: 'killzones', icon: '⏰', label: 'Killzones' },
          { id: 'journal', icon: '📓', label: 'Jurnal' },
          { id: 'calendar', icon: '📰', label: 'Taqvim' },
          ...(isAdmin ? [{ id: 'admin', icon: '🛡️', label: 'Admin' }] : []),
        ].map((tab) => {
          const isActive = activeMainTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id as any)}
              className={`py-2 px-1 rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 text-center ${
                isActive
                  ? tab.id === 'admin'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/25 font-black scale-[1.02]'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-lg shadow-orange-500/25 font-black scale-[1.02]'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span className="text-[11px] font-bold truncate w-full">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}

export default memo(HeaderBar);
