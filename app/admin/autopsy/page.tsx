'use client';
import dynamic from 'next/dynamic';

const TradeAutopsy = dynamic(() => import('../../components/TradeAutopsy'), { ssr: false });

export default function AutopsyPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white tracking-tight">Trade Autopsy (Xatolar Tahlili)</h1>
        <p className="mt-1 text-sm text-slate-400">Zararli savdolarni chuqur tahlil qilish va psixologik tuzatishlar</p>
      </header>
      <TradeAutopsy />
    </div>
  );
}
