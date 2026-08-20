'use client';
import dynamic from 'next/dynamic';

const VolumeDeltaPower = dynamic(() => import('../../components/VolumeDeltaPower'), { ssr: false });

export default function VolumeDeltaPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white tracking-tight">Volume Delta & Order Flow</h1>
        <p className="mt-1 text-sm text-slate-400">Xaridorlar va sotuvchilar kuch balansi (Order Flow tahlili)</p>
      </header>
      <VolumeDeltaPower />
    </div>
  );
}
