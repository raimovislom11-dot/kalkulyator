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
    id: 'smart_money',
    name: 'Smart Money (SMC Tezkor & Aniq Kirish)',
    category: 'SMC',
    icon: '🏛️',
    badge: 'SMC',
    description: 'Likvidlik supurilishi (Sweep), CHoCH va unmitigated Order Block orqali kechikmasdan, o\'z vaqtida snayper kirish signali',
    liveValue: 'Yuklanmoqda...',
    signal: 'BUY',
    keyLevel: 'SMC Early Timing',
  },
  {
    id: 'order_block',
    name: 'Order Block (OB Demand & Supply)',
    category: 'SMC',
    icon: '🧱',
    badge: 'OB',
    description: 'Institutsional banklar va yirik o\'yinchilarning buyurtma zonalari (Demand / Supply)',
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
    id: 'liquidity',
    name: 'Liquidity Pools (BSL & SSL Sweeps)',
    category: 'SMC',
    icon: '🎯',
    badge: 'Liq',
    description: 'Likvidlik yig\'ilgan zonalar: Buy-side Liquidity (BSL) va Sell-side Liquidity (SSL) supurilishi',
    liveValue: 'Yuklanmoqda...',
    signal: 'BUY',
    keyLevel: 'BSL / SSL',
  },
  {
    id: 'smt',
    name: 'SMT Divergence (DXY vs Asset)',
    category: 'ICT',
    icon: '⚡',
    badge: 'SMT',
    description: 'Dollar indeksi (DXY) va Oltin o\'rtasidagi nomutanosiblik — Yirik o\'yinchilar tuzog\'i',
    liveValue: 'Yuklanmoqda...',
    signal: 'BUY',
    keyLevel: 'DXY Divergence',
  },
  {
    id: 'silver_bullet',
    name: 'ICT Silver Bullet (60m Oyna)',
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
    name: 'ICT Judas Swing (Sessiya Tuzog\'i)',
    category: 'ICT',
    icon: '🪤',
    badge: 'Judas',
    description: 'London/NY ochilishining dastlabki yolg\'on harakati va undan keyingi haqiqiy trend',
    liveValue: 'Yuklanmoqda...',
    signal: 'BUY',
    keyLevel: 'Session Manipulation',
  },
  {
    id: 'fib_ote',
    name: 'Fibonacci OTE (0.705 Sweet Spot)',
    category: 'SMC',
    icon: '📐',
    badge: 'OTE',
    description: 'Fibonacci 0.50 (Discount), 0.618 (Golden) va 0.705 (Optimal Trade Entry) kirish zonalari',
    liveValue: 'Yuklanmoqda...',
    signal: 'BUY',
    keyLevel: '0.705 OTE',
  },
  {
    id: 'ict',
    name: 'ICT Killzones & Power of 3 AMD',
    category: 'ICT',
    icon: '🏛️',
    badge: 'ICT',
    description: 'London / NY Killzones, Midnight Open, Daily Open va Accumulation-Manipulation-Distribution',
    liveValue: 'Yuklanmoqda...',
    signal: 'BUY',
    keyLevel: 'Killzones',
  },
  {
    id: 'mtf',
    name: 'Multi-Timeframe Matrix (H4 + M15 + M5)',
    category: 'SMC',
    icon: '🌐',
    badge: 'MTF',
    description: 'H4 Katta Trend + M15 Struktura + M5 Kam xatarli aniq kirish 100% konfluensiyasi',
    liveValue: 'Yuklanmoqda...',
    signal: 'BUY',
    keyLevel: 'MTF Matrix',
  },
  {
    id: 'scalping',
    name: 'Sniper Scalp (1m/5m Tezkor Skalping)',
    category: 'Scalping',
    icon: '⚡',
    badge: 'Scalp',
    description: '1-5 daqiqalik mikro-impuls, Micro-FVG retesti va tezkor 5-15 pip skalping setupi',
    liveValue: 'Yuklanmoqda...',
    signal: 'BUY',
    keyLevel: 'Scalp Target',
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
    'smart_money',
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
  const containerId = useMemo(() => `tv_chart_${asset.id}_${timeframe}`.replace(/[^a-zA-Z0-9_]/g, '_'), [asset.id, timeframe]);

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
          container_id: containerId,
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
  }, [isOpen, asset.tvSymbol, interval, containerId]);

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

            <button
              onClick={() => setShowIndicatorsModal(true)}
              className="px-3 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition-all active:scale-95 border border-blue-400/30"
            >
              <span>fx</span>
              <span>10 Ta Elita Strategiya ({activeStrategies.length}/10)</span>
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

      {activeStrategies.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
          <span className="text-[11px] font-bold text-amber-400 mr-1 flex items-center gap-1">
            <span>⚡</span>
            <span>Faol strategiyalar:</span>
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
            + Barchasi (10 ta)
          </button>
        </div>
      )}

      {isOpen && (
        <div
          className={`relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#131722] shadow-2xl transition-all ${
            isFullScreen ? 'fixed inset-4 z-50 h-[90vh]' : 'h-[500px]'
          }`}
        >
          {isFullScreen && (
            <div className="flex justify-between items-center p-3 border-b border-slate-800">
              <span className="text-white font-bold text-sm">
                {asset.name} ({asset.symbol}) — {timeframe} Jonli Grafik
              </span>
              <button
                onClick={() => setIsFullScreen(false)}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg"
              >
                ✕ Chiqish
              </button>
            </div>
          )}
          <div id={containerId} ref={containerRef} className="w-full h-full" />
        </div>
      )}

      {liveStrategies.length > 0 && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <span className="text-amber-400">⚡</span>
              <span>10 TA ELITA SMC/ICT STRATEGIYANING JONLI GRAFIK DARAJALARI:</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              Har 12 soniyada avto-yangilanadi • {asset.symbol}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
            {liveStrategies.map((strat) => (
              <div
                key={strat.id}
                onClick={() => toggleStrategy(strat.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer select-none space-y-1.5 ${
                  activeStrategies.includes(strat.id)
                    ? strat.signal === 'BUY'
                      ? 'bg-emerald-950/25 border-emerald-500/50 shadow-md shadow-emerald-950/30'
                      : strat.signal === 'SELL'
                      ? 'bg-rose-950/25 border-rose-500/50 shadow-md shadow-rose-950/30'
                      : 'bg-slate-900/80 border-slate-700'
                    : 'bg-slate-900/40 border-slate-800/60 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{strat.icon}</span>
                    <span className="text-white text-xs font-bold truncate max-w-[120px]">{strat.name}</span>
                  </div>
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                      strat.signal === 'BUY'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : strat.signal === 'SELL'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {strat.signal}
                  </span>
                </div>

                <div className="font-mono text-[11px] font-bold text-amber-300 bg-black/40 px-2 py-1 rounded border border-amber-500/20 truncate">
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

      {showIndicatorsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#131722] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl">📊</span>
                <span className="text-white font-bold text-sm sm:text-base">10 Ta Elita SMC & ICT Strategiyalar</span>
              </div>
              <button
                onClick={() => setShowIndicatorsModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-b border-slate-800 bg-[#0c101a]">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Strategiyani qidiring (Order Block, FVG, SMT, Breaker, OTE...)"
                  className="w-full bg-[#1e222d] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                <span>Mavjud: {filteredStrategies.length} ta strategiya</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => selectAllStrategies(true)}
                    className="text-emerald-400 hover:underline font-bold"
                  >
                    ✓ Barchasini yoqish (10 ta)
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
