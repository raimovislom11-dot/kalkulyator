'use client';
import dynamic from 'next/dynamic';
const MultiChartGrid = dynamic(() => import('../../components/MultiChartGrid'), { ssr: false });
export default function MultiPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white tracking-tight">Multi Chart</h1>
        <p className="mt-1 text-sm" style={{color:'rgba(255,255,255,0.4)'}}>Ko'p timeframe tahlili</p>
      </header>
      <MultiChartGrid />
    </div>
  );
}
