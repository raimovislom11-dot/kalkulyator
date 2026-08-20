'use client';
import dynamic from 'next/dynamic';
const BacktestSimulator = dynamic(() => import('../../components/BacktestSimulator'), { ssr: false });
export default function BacktestPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white tracking-tight">Backtest</h1>
        <p className="mt-1 text-sm" style={{color:'rgba(255,255,255,0.4)'}}>Strategiya backtesting simulyatori</p>
      </header>
      <BacktestSimulator />
    </div>
  );
}
