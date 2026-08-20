'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import MultiAssetSelector, { ASSET_LIST, AssetConfig } from '../../components/MultiAssetSelector';

const RiskCalculator = dynamic(() => import('../../components/RiskCalculator'), { ssr: false });

export default function RiskPage() {
  const [selectedAsset, setSelectedAsset] = useState<AssetConfig>(ASSET_LIST[0]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white tracking-tight">Risk & Lot Kalkulyatori</h1>
        <p className="mt-1 text-sm text-slate-400">Depozit, stop-loss va risk foiziga qarab aniq lot hajmini hisoblash</p>
      </header>

      {/* Asset Switcher */}
      <MultiAssetSelector selectedAsset={selectedAsset} onSelectAsset={setSelectedAsset} />

      <RiskCalculator asset={selectedAsset} />
    </div>
  );
}
