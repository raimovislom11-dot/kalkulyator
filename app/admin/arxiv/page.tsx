'use client';
import dynamic from 'next/dynamic';

const AISignalsSection = dynamic(() => import('../../components/AISignalsSection'), { ssr: false });

export default function ArxivPage() {
  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-white tracking-tight">Arxiv (AI Signallar &amp; Natijalar)</h1>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono font-bold">
            AI SELF-LEARNING
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          AI tavsiya qilgan barcha signallar arxivi, natijalarni (TP, SL, Limitga bormadi) belgilash va AI ning o&apos;z xatolaridan xulosa chiqarish paneli
        </p>
      </header>
      <AISignalsSection isAdmin={true} />
    </div>
  );
}
