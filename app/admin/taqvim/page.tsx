'use client';
import dynamic from 'next/dynamic';
const EconomicCalendar = dynamic(() => import('../../components/EconomicCalendar'), { ssr: false });
export default function TaqvimPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white tracking-tight">Taqvim</h1>
        <p className="mt-1 text-sm" style={{color:'rgba(255,255,255,0.4)'}}>Iqtisodiy tadbirlar kalendari</p>
      </header>
      <EconomicCalendar />
    </div>
  );
}
