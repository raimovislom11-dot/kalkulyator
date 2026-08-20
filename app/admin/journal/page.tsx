'use client';
import dynamic from 'next/dynamic';

const TradingJournal = dynamic(() => import('../../components/TradingJournal'), { ssr: false });

export default function JournalPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white tracking-tight">Savdo Jurnali</h1>
        <p className="mt-1 text-sm text-slate-400">Barcha ochiq va yopilgan savdolarni batafsil qayd etish va statistik tahlil</p>
      </header>
      <TradingJournal />
    </div>
  );
}
