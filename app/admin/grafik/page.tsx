'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import MultiAssetSelector, { ASSET_LIST, AssetConfig } from '../../components/MultiAssetSelector';

const TradingViewChart = dynamic(() => import('../../components/TradingViewChart'), { ssr: false });

export default function GrafikPage() {
  const [selectedAsset, setSelectedAsset] = useState<AssetConfig>(ASSET_LIST[0]);
  const [timeframe, setTimeframe] = useState<string>('1h');

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Live Grafik & SMC Tahlili</h1>
          <p className="mt-1 text-sm text-slate-400">TradingView real-time grafik va SMC indikatorlari</p>
        </div>
      </header>

      {/* Asset Switcher */}
      <MultiAssetSelector selectedAsset={selectedAsset} onSelectAsset={setSelectedAsset} />

      {/* TradingView Chart Component */}
      <TradingViewChart
        asset={selectedAsset}
        timeframe={timeframe}
        defaultOpen={true}
        height={650}
      />
    </div>
  );
}
