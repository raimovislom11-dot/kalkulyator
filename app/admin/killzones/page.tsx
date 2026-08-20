'use client';
import dynamic from 'next/dynamic';
const KillzonesWidget = dynamic(() => import('../../components/KillzonesWidget'), { ssr: false });
export default function KillzonesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white tracking-tight">Killzones</h1>
        <p className="mt-1 text-sm" style={{color:'rgba(255,255,255,0.4)'}}>London, NY, Asian sessiyalar vaqti</p>
      </header>
      <KillzonesWidget />
    </div>
  );
}
