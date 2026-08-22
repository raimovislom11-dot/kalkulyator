'use client';

export interface AssetConfig {
  id: string;
  name: string;
  symbol: string;
  tvSymbol: string;
  icon: string;
  pipSize: number;
  pipMultiplier: number;
  digits: number;
  contractSize: number;
  defaultMaxRange: number;
  category: 'Metals' | 'Forex' | 'Crypto' | 'Indices';
}

export const ASSET_LIST: AssetConfig[] = [
  {
    id: 'XAUUSD',
    name: 'Gold (XAU/USD)',
    symbol: 'XAUUSD',
    tvSymbol: 'OANDA:XAUUSD',
    icon: '🥇',
    pipSize: 0.10,
    pipMultiplier: 10,
    digits: 2,
    contractSize: 100,
    defaultMaxRange: 50,
    category: 'Metals',
  },
  {
    id: 'XAGUSD',
    name: 'Kumush (XAG/USD)',
    symbol: 'XAGUSD',
    tvSymbol: 'OANDA:XAGUSD',
    icon: '🥈',
    pipSize: 0.01,
    pipMultiplier: 100,
    digits: 3,
    contractSize: 5000,
    defaultMaxRange: 2.0,
    category: 'Metals',
  },
  {
    id: 'EURUSD',
    name: 'EUR / USD',
    symbol: 'EURUSD',
    tvSymbol: 'FX:EURUSD',
    icon: '💶',
    pipSize: 0.0001,
    pipMultiplier: 10000,
    digits: 5,
    contractSize: 100000,
    defaultMaxRange: 0.0080,
    category: 'Forex',
  },
  {
    id: 'GBPUSD',
    name: 'GBP / USD',
    symbol: 'GBPUSD',
    tvSymbol: 'FX:GBPUSD',
    icon: '💷',
    pipSize: 0.0001,
    pipMultiplier: 10000,
    digits: 5,
    contractSize: 100000,
    defaultMaxRange: 0.0100,
    category: 'Forex',
  },
  {
    id: 'BTCUSD',
    name: 'Bitcoin (BTC)',
    symbol: 'BTCUSD',
    tvSymbol: 'BINANCE:BTCUSDT',
    icon: '₿',
    pipSize: 1.0,
    pipMultiplier: 1,
    digits: 2,
    contractSize: 1,
    defaultMaxRange: 2000,
    category: 'Crypto',
  },
  {
    id: 'ETHUSD',
    name: 'Ethereum (ETH)',
    symbol: 'ETHUSD',
    tvSymbol: 'BINANCE:ETHUSDT',
    icon: '⟠',
    pipSize: 0.1,
    pipMultiplier: 10,
    digits: 2,
    contractSize: 1,
    defaultMaxRange: 150,
    category: 'Crypto',
  },
  {
    id: 'US100',
    name: 'Nasdaq (US100)',
    symbol: 'US100',
    tvSymbol: 'CAPITALCOM:US100',
    icon: '📈',
    pipSize: 1.0,
    pipMultiplier: 1,
    digits: 2,
    contractSize: 1,
    defaultMaxRange: 250,
    category: 'Indices',
  },
  {
    id: 'US30',
    name: 'Dow Jones (US30)',
    symbol: 'US30',
    tvSymbol: 'CAPITALCOM:US30',
    icon: '🏛️',
    pipSize: 1.0,
    pipMultiplier: 1,
    digits: 2,
    contractSize: 1,
    defaultMaxRange: 350,
    category: 'Indices',
  },
];

interface MultiAssetSelectorProps {
  selectedAsset: AssetConfig;
  onSelectAsset: (asset: AssetConfig) => void;
}

export default function MultiAssetSelector({ selectedAsset, onSelectAsset }: MultiAssetSelectorProps) {
  return (
    <div className="bg-slate-900/85 border border-slate-700/80 rounded-2xl p-2.5 sm:p-3 mb-4 backdrop-blur shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-[11px] sm:text-xs font-bold tracking-wider flex items-center gap-1.5">
          <span>🌐</span> INSTRUMENT TANLASH
        </span>
        <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded-full bg-slate-800 text-orange-400 font-mono font-bold">
          {selectedAsset.symbol}
        </span>
      </div>

      {/* Responsive Grid / Flex on Mobile */}
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-1 sm:gap-1.5">
        {ASSET_LIST.map((asset) => {
          const isSelected = asset.id === selectedAsset.id;
          return (
            <button
              key={asset.id}
              onClick={() => onSelectAsset(asset)}
              className={`flex flex-col items-center justify-center py-1.5 sm:py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-gradient-to-b from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25 scale-[1.02] ring-1 ring-orange-400'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white'
              }`}
            >
              <span className="text-sm sm:text-base mb-0.5">{asset.icon}</span>
              <span className="truncate w-full text-center text-[10px] sm:text-[11px] font-mono">{asset.symbol}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
