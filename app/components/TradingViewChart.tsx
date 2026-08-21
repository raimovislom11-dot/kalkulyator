'use client';

import { useEffect, useRef, useState, memo, useMemo, useCallback } from 'react';
import { AssetConfig } from './MultiAssetSelector';
import { StrategyLiveItem, calculateGannLevels } from '../lib/smcIndicators';

interface TradingViewChartProps {
  asset: AssetConfig;
  timeframe: string;
  defaultOpen?: boolean;
  hideHeader?: boolean;
  height?: number;
  currentPrice?: number;
  onAnalysisReady?: (data: { price: number; analysis: any; strategies: StrategyLiveItem[] }) => void;
}

const DEFAULT_STRATEGIES: StrategyLiveItem[] = [
  {
    id: 'order_block',
    name: 'Order Block (OB Demand & Supply)',
    category: 'SMC',
    icon: '🧱',
    badge: 'OB',
    description: 'Institutsional yirik banklar va fondlar buyurtma zonalari (Demand / Supply)',
    liveValue: 'Yuklanmoqda...',
    signal: 'BUY',
    keyLevel: 'Demand / Supply Zone',
  },
  {
    id: 'breaker_block',
    name: 'Breaker Block (BB & Mitigation)',
    category: 'SMC',
    icon: '🧱',
    badge: 'Breaker',
    description: 'Buzib o\'tilgan Order Block qaytishida (Retest) juda kuchli qarama-qarshi kirish tayanchi bo\'ladi',
    liveValue: 'Yuklanmoqda...',
    signal: 'BUY',
    keyLevel: 'Breaker Retest',
  },
  {
    id: 'fvg',
    name: 'Fair Value Gap (FVG 50% CE)',
    category: 'SMC',
    icon: '⚡',
    badge: 'FVG',
    description: '3 ta sham oralig\'idagi narx nomutanosibligi (50% Consequent Encroachment)',
    liveValue: 'Yuklanmoqda...',
    signal: 'BUY',
    keyLevel: '50% CE Midpoint',
  },
  {
    id: 'ifvg',
    name: 'iFVG (Inverted Fair Value Gap)',
    category: 'SMC',
    icon: '🔄',
    badge: 'iFVG',
    description: 'Narx tomonidan buzib o\'tilgan va teskari (Support <-> Resistance) vazifasini bajaruvchi FVG',
    liveValue: 'Yuklanmoqda...',
    signal: 'BUY',
    keyLevel: 'Invert S/R',
  },
  {
    id: 'smt',
    name: 'SMT Divergence (DXY vs Gold Korrelyatsiya)',
    category: 'ICT',
    icon: '⚡',
    badge: 'SMT',
    description: 'Dollar indeksi (DXY) va Oltin o\'rtasidagi nomutanosiblik — Yirik o\'yinchilarning tuzog\'i (Fakeout) aniqlash',
    liveValue: 'Yuklanmoqda...',
    signal: 'BUY',
    keyLevel: 'DXY/Gold Divergence',
  },
  {
    id: 'silver_bullet',
    name: 'ICT Silver Bullet (60 Daqiqalik Oyna)',
    category: 'ICT',
    icon: '🎯',
    badge: 'SB',
    description: 'Kun davomidagi eng yuqori ehtimolli 60 daqiqalik vaqt oynasi (London AM, NY AM, NY PM)',
    liveValue: 'Yuklanmoqda...',
    signal: 'BUY',
    keyLevel: 'Session Window',
  },
  {
    id: 'judas_swing',
    name: 'ICT Judas Swing (Sessiya Ochilish Tuzog\'i)',
    category: 'ICT',
    icon: '🪤',
    badge: 'Judas',
    description: 'London/NY ochilishining ilk 15-30 daqiqasidagi yolg\'on harakat (Manipulation) va undan keyingi haqiqiy trend',
    liveValue: 'Yuklanmoqda...',
    signal: 'BUY',
    keyLevel: 'Session Manipulation',
  },
  {
    id: 'snr',
    name: 'SNR (Support & Resistance Darajalari)',
    category: 'Price Action',
    icon: '📊',
    badge: 'SNR',
    description: 'Statik va dinamik asosiy qo\'llab-quvvatlash va qarshilik gorizontal darajalari',
    liveValue: 'Yuklanmoqda...',
    signal: 'NEUTRAL',
    keyLevel: 'Key S/R',
  },
  {
    id: 'fib_ote',
    name: 'Fibonacci OTE (Optimal Trade Entry 0.705)',
    category: 'SMC',
    icon: '📐',
    badge: 'OTE',
    description: 'Fibonacci 0.50 (Eq), 0.618 (Golden), 0.705 (ICT OTE Sweet Spot) va 0.786 darajalari',
    liveValue: 'Yuklanmoqda...',
    signal: 'BUY',
    keyLevel: '0.705 OTE',
  },
  {
    id: 'ganna',
    name: 'Ganna (Gann Square of 9 Darajalari)',
    category: 'Matematika',
    icon: '✨',
    badge: 'Gann',
    description: 'W.D. Gann matematik kvadrat ildiz va burchak darajalari (90°, 180°, 270°, 360°)',
    liveValue: 'Yuklanmoqda...',
    signal: 'NEUTRAL',
    keyLevel: '180° Angle',
  },
  {
    id: 'liquidity',
    name: 'Liquidity Pools (BSL & SSL Likvidlik)',
    category: 'SMC',
    icon: '🎯',
    badge: 'Liq',
    description: 'Likvidlik yig\'ilgan zonalar: Buy-side Liquidity (BSL) va Sell-side Liquidity (SSL)',
    liveValue: 'Yuklanmoqda...',
    signal: 'NEUTRAL',
    keyLevel: 'BSL / SSL',
  },
  {
    id: 'single_candle',
    name: 'Yolg\'iz Sham (Displacement / Institutional Candle)',
    category: 'Price Action',
    icon: '🕯️',
    badge: 'Sham',
    description: 'Katta hajmli yakkaxon institutsional impuls shami (Imbalance / Katta tana)',
    liveValue: 'Yuklanmoqda...',
    signal: 'BUY',
    keyLevel: 'Displacement',
  },
  {
    id: 'ict',
    name: 'ICT (Killzones & Power of 3 AMD)',
    category: 'ICT',
    icon: '🏛️',
    badge: 'ICT',
    description: 'London / New York Killzones, Midnight Open, Daily Open va Accumulation-Manipulation-Distribution',
    liveValue: 'Yuklanmoqda...',
    signal: 'BUY',
    keyLevel: 'Killzones',
  },
  {
    id: 'bos',
    name: 'BOS (Break of Structure)',
    category: 'SMC',
    icon: '⚡',
    badge: 'BOS',
    description: 'Trend davom etishini tasdiqlovchi struktura buzilishi (Higher High / Lower Low)',
    liveValue: 'Yuklanmoqda...',
    signal: 'BUY',
    keyLevel: 'BOS',
  },
  {
    id: 'choch',
    name: 'CHoCH (Change of Character)',
    category: 'SMC',
    icon: '🔄',
    badge: 'CHoCH',
    description: 'Trend yo\'nalishi o\'zgarishini ko\'rsatuvchi dastlabki struktura o\'zgarishi',
    liveValue: 'Yuklanmoqda...',
    signal: 'BUY',
    keyLevel: 'CHoCH',
  },
  {
    id: 'mtf',
    name: 'Multi-Timeframe Matrix (H4 + M15 + M5 Confluence)',
    category: 'Price Action',
    icon: '🌐',
    badge: 'MTF',
    description: 'H4 (Katta Trend) + M15 (Struktura & Likvidlik) + M5 (Kam xatarli aniq kirish) 100% uyg\'unligi',
    liveValue: 'Yuklanmoqda...',
    signal: 'BUY',
    keyLevel: 'MTF Matrix',
  },
  {
    id: 'matematika',
    name: 'Matematika (ATR & Smart Risk Matrix)',
    category: 'Matematika',
    icon: '🧮',
    badge: 'Math',
    description: 'ATR volatilligi, Risk-Reward (1:3), ideal Stop Loss va Take Profit 1/2 masofalari',
    liveValue: 'Yuklanmoqda...',
    signal: 'NEUTRAL',
    keyLevel: 'R:R 1:3',
  },
  {
    id: 'high_low',
    name: 'High va Low (Swing High & Swing Low)',
    category: 'Price Action',
    icon: '📌',
    badge: 'H/L',
    description: 'Bozordagi eng so\'nggi muhim maksimal (High) va minimal (Low) burilish nuqtalari',
    liveValue: 'Yuklanmoqda...',
    signal: 'NEUTRAL',
    keyLevel: 'Swing H/L',
  },
];

const tfToTvInterval: Record<string, string> = {
  '1m': '1',
  '5m': '5',
  '15m': '15',
  '1h': '60',
  '4h': '240',
  '1d': 'D',
};

function TradingViewWidget({
  asset,
  timeframe,
  defaultOpen = true,
  hideHeader = false,
  height = 450,
  currentPrice,
  onAnalysisReady,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showIndicatorsModal, setShowIndicatorsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [livePrice, setLivePrice] = useState<number | null>(currentPrice || null);
  const [liveStrategies, setLiveStrategies] = useState<StrategyLiveItem[]>(DEFAULT_STRATEGIES);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  const [activeStrategies, setActiveStrategies] = useState<string[]>([
    'order_block',
    'breaker_block',
    'fvg',
    'ifvg',
    'smt',
    'silver_bullet',
    'judas_swing',
    'snr',
    'fib_ote',
    'ganna',
    'liquidity',
    'single_candle',
    'ict',
    'bos',
    'choch',
    'mtf',
    'matematika',
    'high_low',
  ]);

  const interval = tfToTvInterval[timeframe] || '60';

  // 18 ta strategiyani jonli grafik ma'lumotlari bilan hisoblash
  const fetchMarketData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/market-candles?symbol=${encodeURIComponent(asset.symbol)}&timeframe=${encodeURIComponent(timeframe)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.strategies) {
          setLivePrice(data.price);
          setLiveStrategies(data.strategies);
          setLastSyncTime(new Date().toLocaleTimeString());
          onAnalysisReady?.({
            price: data.price,
            analysis: data.analysis,
            strategies: data.strategies,
          });
        }
      }
    } catch (err) {
      console.warn('Live strategy fetch error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [asset.symbol, timeframe, onAnalysisReady]);

  // Asset yoki Timeframe o'zgarganda avtomatik hisoblash
  useEffect(() => {
    fetchMarketData();
    const timer = setInterval(fetchMarketData, 12000); // har 12 soniyada yangilash
    return () => clearInterval(timer);
  }, [fetchMarketData]);

  const toggleStrategy = (id: string) => {
    setActiveStrategies((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllStrategies = (select: boolean) => {
    if (select) {
      setActiveStrategies(liveStrategies.map((s) => s.id));
    } else {
      setActiveStrategies([]);
    }
  };

  const filteredStrategies = useMemo(() => {
    if (!searchQuery.trim()) return liveStrategies;
    const q = searchQuery.toLowerCase();
    return liveStrategies.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.badge.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    );
  }, [searchQuery, liveStrategies]);

  // TradingView Chart Widget
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => {
      if (typeof (window as any).TradingView !== 'undefined' && containerRef.current) {
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: asset.tvSymbol,
          interval: interval,
          timezone: 'Asia/Tashkent',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#0f172a',
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: containerRef.current.id,
          hide_side_toolbar: false,
          studies: [
            'MASimple@tv-basicstudies',
            'RSI@tv-basicstudies',
            'PivotPointsHighLow@tv-basicstudies',
            'Volume@tv-basicstudies',
          ],
        });
      }
    };

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [isOpen, asset.tvSymbol, interval]);

  const widgetId = `tv_chart_container_${asset.id}_${Math.random().toString(36).substring(2, 6)}`;
  const displayPrice = livePrice || currentPrice || (asset.id.toLowerCase().includes('xau') || asset.id === 'gold' ? 4589.5 : 1.085);
  const formattedPrice = typeof displayPrice === 'number' ? (displayPrice > 10 ? displayPrice.toFixed(2) : displayPrice.toFixed(5)) : displayPrice;

  return (
    <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3 sm:p-4 mb-4 backdrop-blur-xl shadow-2xl space-y-3">
      {/* Top Header & Strategy Button */}
      {!hideHeader && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <div>
              <div className="text-white font-bold text-sm flex items-center gap-2 flex-wrap">
                <span>TRADINGVIEW JONLI GRAFIK</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-mono font-bold border border-orange-500/30">
                  {asset.symbol} • {timeframe}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-black border border-emerald-500/30 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full bg-emerald-400 ${isSyncing ? 'animate-ping' : ''}`} />
                  {formattedPrice} USD
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5 flex items-center gap-2">
                <span>18 ta SMC / ICT / Ganna / Matematika strategiyalari grafikdan hisoblanmoqda</span>
                {lastSyncTime && <span className="text-slate-500 font-mono text-[10px]">({lastSyncTime})</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Yangilash tugmasi */}
            <button
              onClick={fetchMarketData}
              disabled={isSyncing}
              title="Jonli grafik va 18 ta strategiyani qayta hisoblash"
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1"
            >
              <span className={isSyncing ? 'animate-spin' : ''}>🔄</span>
              <span className="hidden sm:inline">Yangilash</span>
            </button>

            {/* Indicators Modal Trigger */}
            <button
              onClick={() => setShowIndicatorsModal(true)}
              className="px-3 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition-all active:scale-95 border border-blue-400/30"
            >
              <span>fx</span>
              <span>18 Ta Strategiya ({activeStrategies.length}/18)</span>
            </button>

            {isOpen && (
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all border border-slate-700"
                title="Kattalashtirish"
              >
                {isFullScreen ? '↙ Kichraytirish' : '↗ To\'liq ekran'}
              </button>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                isOpen
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20'
              }`}
            >
              {isOpen ? '✕ Yopish' : '📈 Grafikni ochish'}
            </button>
          </div>
        </div>
      )}

      {/* Active Strategy Pills Bar */}
      {activeStrategies.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
          <span className="text-[11px] font-bold text-amber-400 mr-1 flex items-center gap-1">
            <span>⚡</span>
            <span>Grafikdan hisoblangan faol strategiyalar:</span>
          </span>
          {liveStrategies.filter((s) => activeStrategies.includes(s.id)).map((strat) => (
            <span
              key={strat.id}
              onClick={() => toggleStrategy(strat.id)}
              className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 cursor-pointer transition-colors ${
                strat.signal === 'BUY'
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60 hover:bg-red-950/50'
                  : strat.signal === 'SELL'
                  ? 'bg-red-950/60 text-red-300 border-red-700/60 hover:bg-red-950/50'
                  : 'bg-slate-800/90 text-slate-300 border-slate-700/80'
              }`}
              title="O'chirish uchun bosing"
            >
              <span>{strat.icon}</span>
              <span className="font-bold">{strat.badge}</span>
              <span className="text-[9px] opacity-70">({strat.signal})</span>
              <span className="text-[9px] text-slate-500 hover:text-red-400">×</span>
            </span>
          ))}
          <button
            onClick={() => setShowIndicatorsModal(true)}
            className="text-[10px] text-blue-400 hover:underline font-bold ml-auto"
          >
            + Barchasi (18 ta)
          </button>
        </div>
      )}

      {/* TradingView Chart Container */}
      {isOpen && (
        <div
          className={`transition-all duration-300 ${
            isFullScreen
              ? 'fixed inset-4 z-50 bg-slate-950/98 border-2 border-blue-500 rounded-2xl p-4 flex flex-col shadow-2xl backdrop-blur-2xl'
              : 'relative rounded-xl overflow-hidden border border-slate-700/80 shadow-2xl'
          }`}
        >
          {isFullScreen && (
            <div className="flex justify-between items-center mb-3">
              <span className="text-white font-bold text-sm">
                {asset.name} ({asset.symbol}) — {timeframe} Jonli Grafik • {formattedPrice} USD
              </span>
              <button
                onClick={() => setIsFullScreen(false)}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg"
              >
                ✕ Chiqish
              </button>
            </div>
          )}
          <div
            id={widgetId}
            ref={containerRef}
            className={`w-full ${isFullScreen ? 'flex-1 min-h-[500px]' : ''}`}
            style={{ height: isFullScreen ? undefined : `${height}px` }}
          />
        </div>
      )}

      {/* 🚀 18 TA JONLI STRATEGIYALAR GRIDI (Grafikdan to'liq hisoblangan real darajalar) */}
      {activeStrategies.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span>🎯</span>
              <span>18 TA STRATEGIYANING JONLI GRAFIK DARAJALARI:</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Real OHLCV & SMC hisob-kitobi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {liveStrategies.filter((s) => activeStrategies.includes(s.id)).map((strat) => (
              <div
                key={strat.id}
                className="bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 space-y-1.5 transition-all shadow-sm group"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5 truncate">
                    <span>{strat.icon}</span>
                    <span className="truncate">{strat.name}</span>
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    strat.signal === 'BUY'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : strat.signal === 'SELL'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {strat.badge}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-emerald-400 bg-slate-900/90 px-2 py-1 rounded border border-slate-800/80 truncate select-all group-hover:border-emerald-500/30 transition-colors">
                  {strat.liveValue}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                  <span className="truncate">{strat.category}</span>
                  <span className="font-bold text-slate-400">{strat.signal}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🚀 INDICATORS & STRATEGIES MODAL (Xuddi TradingView uslubida) */}
      {showIndicatorsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#131722] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl">📊</span>
                <span className="text-white font-bold text-sm sm:text-base">18 Ta SMC, ICT, Ganna & Matematik Strategiyalar</span>
              </div>
              <button
                onClick={() => setShowIndicatorsModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="p-4 border-b border-slate-800 bg-[#0c101a]">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Strategiyani qidiring (Order Block, FVG, SMT, Ganna, Fib, Breaker...)"
                  className="w-full bg-[#1e222d] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                <span>Mavjud: {filteredStrategies.length} ta strategiya</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => selectAllStrategies(true)}
                    className="text-emerald-400 hover:underline font-bold"
                  >
                    ✓ Barchasini yoqish (18 ta)
                  </button>
                  <span>|</span>
                  <button
                    onClick={() => selectAllStrategies(false)}
                    className="text-rose-400 hover:underline font-bold"
                  >
                    ✕ Barchasini o'chirish
                  </button>
                </div>
              </div>
            </div>

            {/* Strategies List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-slate-800/60">
              {filteredStrategies.map((strat) => {
                const isSelected = activeStrategies.includes(strat.id);
                return (
                  <div
                    key={strat.id}
                    onClick={() => toggleStrategy(strat.id)}
                    className={`pt-2.5 first:pt-0 p-3 rounded-xl cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-950/30 border border-blue-500/40 text-white'
                        : 'hover:bg-slate-800/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">{strat.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{strat.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold">
                            {strat.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{strat.description}</p>
                        <div className="mt-1.5 text-[11px] font-mono text-emerald-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800 inline-block">
                          {strat.liveValue}
                        </div>
                      </div>
                    </div>

                    <div className="mt-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-slate-800 bg-[#0c101a] flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Tanlangan: <b className="text-white">{activeStrategies.length} ta</b>
              </span>
              <button
                onClick={() => setShowIndicatorsModal(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
              >
                Tayyor (Saqlash)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(TradingViewWidget);
