'use client';

import { useEffect, useRef, useState, memo } from 'react';
import { AssetConfig } from './MultiAssetSelector';

interface TradingViewChartProps {
  asset: AssetConfig;
  timeframe: string;
  defaultOpen?: boolean;
  hideHeader?: boolean;
  height?: number;
}

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
  height = 420,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const interval = tfToTvInterval[timeframe] || '60';

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
          studies: ['MASimple@tv-basicstudies', 'RSI@tv-basicstudies'],
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

  if (hideHeader) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-slate-700 w-full">
        <div id={widgetId} ref={containerRef} style={{ height: `${height}px` }} className="w-full" />
      </div>
    );
  }

  return (
    <div className="bg-slate-900/85 border border-slate-700/80 rounded-2xl p-4 mb-4 backdrop-blur shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <div>
            <div className="text-white font-bold text-sm flex items-center gap-2">
              <span>TRADINGVIEW JONLI GRAFIK</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 font-mono font-bold">
                {asset.symbol} • {timeframe}
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">Real-time grafik, indikatorlar va tahlil</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOpen && (
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all"
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
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20'
            }`}
          >
            {isOpen ? (
              <>
                <span>✕</span> Yopish
              </>
            ) : (
              <>
                <span>📈</span> Grafikni ochish
              </>
            )}
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          className={`mt-4 transition-all duration-300 ${
            isFullScreen
              ? 'fixed inset-4 z-50 bg-slate-950/95 border-2 border-blue-500 rounded-2xl p-4 flex flex-col shadow-2xl backdrop-blur-xl'
              : 'relative rounded-xl overflow-hidden border border-slate-700'
          }`}
        >
          {isFullScreen && (
            <div className="flex justify-between items-center mb-3">
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
          <div
            id={widgetId}
            ref={containerRef}
            className={`w-full ${isFullScreen ? 'flex-1 min-h-[500px]' : 'h-[420px]'}`}
          />
        </div>
      )}
    </div>
  );
}

export default memo(TradingViewWidget);
