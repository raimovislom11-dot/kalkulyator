'use client';
import dynamic from 'next/dynamic';
const MarketHeatmap = dynamic(() => import('../../components/MarketHeatmap'), { ssr: false });
export default function HeatmapPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white tracking-tight">Heatmap</h1>
        <p className="mt-1 text-sm" style={{color:'rgba(255,255,255,0.4)'}}>Bozor issiqlik xaritasi</p>
      </header>
      <MarketHeatmap />
    </div>
  );
}
