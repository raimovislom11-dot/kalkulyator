'use client';
import dynamic from 'next/dynamic';

const AITrapHunter = dynamic(() => import('../../components/AITrapHunter'), { ssr: false });

export default function TrapHunterPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white tracking-tight">AI Trap Hunter</h1>
        <p className="mt-1 text-sm text-slate-400">Institutsional tuzoqlar, likvidlik supurish va soxta buzilishlar detektori</p>
      </header>
      <AITrapHunter />
    </div>
  );
}
