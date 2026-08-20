'use client';
import dynamic from 'next/dynamic';
const PreTradeChecklist = dynamic(() => import('../../components/PreTradeChecklist'), { ssr: false });
export default function ChecklistPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white tracking-tight">Checklist</h1>
        <p className="mt-1 text-sm" style={{color:'rgba(255,255,255,0.4)'}}>Savdogacha tekshiruv ro'yxati</p>
      </header>
      <PreTradeChecklist />
    </div>
  );
}
