'use client';
import dynamic from 'next/dynamic';
const StrategyEncyclopedia = dynamic(() => import('../../components/StrategyEncyclopedia'), { ssr: false });
export default function LugatPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white tracking-tight">Lug'at</h1>
        <p className="mt-1 text-sm" style={{color:'rgba(255,255,255,0.4)'}}>Trading terminlari va strategiyalar ensiklopediyasi</p>
      </header>
      <StrategyEncyclopedia />
    </div>
  );
}
