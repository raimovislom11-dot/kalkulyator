'use client';
import dynamic from 'next/dynamic';

const ConfluenceRadar = dynamic(() => import('../../components/ConfluenceRadar'), { ssr: false });

export default function RadarPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white tracking-tight">18-Confluence Radar</h1>
        <p className="mt-1 text-sm text-slate-400">18 ta texnik va fundamental omillar bo'yicha savdo tahlili</p>
      </header>
      <ConfluenceRadar />
    </div>
  );
}
