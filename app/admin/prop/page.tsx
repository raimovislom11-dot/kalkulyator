'use client';
import dynamic from 'next/dynamic';
const PropRiskCalculator = dynamic(() => import('../../components/PropRiskCalculator'), { ssr: false });
const ConfluenceRadar = dynamic(() => import('../../components/ConfluenceRadar'), { ssr: false });
export default function PropPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white tracking-tight">Prop Game</h1>
        <p className="mt-1 text-sm" style={{color:'rgba(255,255,255,0.4)'}}>Prop firma strategiyasi</p>
      </header>
      <PropRiskCalculator />
      <ConfluenceRadar />
    </div>
  );
}
