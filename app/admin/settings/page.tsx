'use client';

import { useState, useEffect } from 'react';
import { settingsStore, tradesStore } from '../../lib/store';
import type { AdminSettings } from '../../lib/types';
import Link from 'next/link';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-[#1f1f1f] rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-[#1f1f1f]">
        <div className="text-sm font-medium text-white">{title}</div>
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm text-white">{label}</div>
        {desc && <div className="text-[#444] text-xs mt-0.5">{desc}</div>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tradeCount, setTradeCount] = useState(0);
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  useEffect(() => {
    setMounted(true);
    setSettings(settingsStore.get());
    setTradeCount(tradesStore.getAll().length);
    fetch('/api/analyze', { method: 'POST', body: new FormData() })
      .then(r => setApiStatus(r.status !== 200 && r.status !== 400 ? 'error' : 'ok'))
      .catch(() => setApiStatus('error'));
  }, []);

  const update = <K extends keyof AdminSettings>(k: K, v: AdminSettings[K]) =>
    setSettings(p => p ? { ...p, [k]: v } : p);

  const save = () => {
    if (!settings) return;
    settingsStore.update(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inp = 'px-3 py-2 bg-black border border-[#1f1f1f] rounded-md text-white text-sm focus:border-[#333] focus:outline-none transition-colors';

  if (!mounted || !settings) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border border-[#333] border-t-white rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 max-w-xl">
      <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-6">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Settings</h1>
          <p className="text-[#555] text-sm mt-0.5">Admin panel configuration</p>
        </div>
        <button onClick={save}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            saved
              ? 'border border-[#2a2a2a] text-[#555]'
              : 'bg-white text-black hover:bg-[#e0e0e0]'
          }`}>
          {saved ? '✓ Saved' : 'Save'}
        </button>
      </div>

      <Section title="Trading">
        <Row label="Deposit" desc="Starting trading deposit ($)">
          <input type="number" value={settings.deposit}
            onChange={e => update('deposit', parseFloat(e.target.value) || 0)}
            className={`${inp} w-28 text-right font-mono`} />
        </Row>
        <Row label="Risk per trade" desc="% of deposit per trade">
          <input type="number" value={settings.riskPercentage} step="0.1" min="0.1" max="10"
            onChange={e => update('riskPercentage', parseFloat(e.target.value) || 1)}
            className={`${inp} w-20 text-right font-mono`} />
        </Row>
        <Row label="Default instrument">
          <input value={settings.defaultInstrument}
            onChange={e => update('defaultInstrument', e.target.value)}
            className={`${inp} w-32`} />
        </Row>
      </Section>

      {/* Risk preview */}
      <div className="border border-[#1f1f1f] rounded-lg p-5">
        <div className="text-[10px] text-[#444] uppercase tracking-widest mb-4">Risk calculator</div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Risk per trade', value: `${(settings.deposit * settings.riskPercentage / 100).toFixed(2)}$` },
            { label: 'Deposit', value: `${settings.deposit.toLocaleString()}$` },
            { label: '5× LOSS', value: `-${(settings.deposit * settings.riskPercentage / 100 * 5).toFixed(2)}$` },
            { label: 'Drawdown 5×', value: `${((settings.deposit * settings.riskPercentage / 100 * 5) / settings.deposit * 100).toFixed(1)}%` },
          ].map(r => (
            <div key={r.label} className="border border-[#111] rounded-md p-3">
              <div className="text-[10px] text-[#333] uppercase tracking-widest mb-1">{r.label}</div>
              <div className="text-white text-sm font-mono">{r.value}</div>
            </div>
          ))}
        </div>
      </div>

      <Section title="Connections">
        <Row label="Anthropic Claude API" desc="Used for AI chat and analysis">
          <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-md text-xs font-mono ${
            apiStatus === 'ok' ? 'border-[#2a2a2a] text-[#888]' :
            apiStatus === 'checking' ? 'border-[#1f1f1f] text-[#444]' : 'border-[#2a2a2a] text-[#444]'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              apiStatus === 'ok' ? 'bg-white' : apiStatus === 'checking' ? 'bg-[#333] animate-pulse' : 'bg-[#2a2a2a]'
            }`} />
            {apiStatus === 'ok' ? 'connected' : apiStatus === 'checking' ? 'checking...' : 'not configured'}
          </div>
        </Row>
        {apiStatus === 'error' && (
          <div className="border border-[#1f1f1f] rounded-md p-4 text-xs text-[#555]">
            Add <code className="bg-[#0f0f0f] border border-[#1f1f1f] px-1 rounded font-mono">ANTHROPIC_API_KEY</code> to{' '}
            <code className="bg-[#0f0f0f] border border-[#1f1f1f] px-1 rounded font-mono">.env.local</code>
          </div>
        )}
        <Row label="Lightweight Charts" desc="TradingView charts library">
          <div className="flex items-center gap-2 px-3 py-1.5 border border-[#2a2a2a] rounded-md text-xs font-mono text-[#888]">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            installed
          </div>
        </Row>
      </Section>

      <Section title="Data">
        <Row label="Trade journal" desc={`${tradeCount} trades in localStorage`}>
          <Link href="/admin/trades"
            className="px-3 py-1.5 border border-[#1f1f1f] text-[#555] hover:text-white hover:border-[#333] rounded-md text-xs transition-colors">
            Open →
          </Link>
        </Row>
        <div className="pt-2 border-t border-[#111]">
          <button
            onClick={() => { if (confirm('Delete all data? This cannot be undone.')) { localStorage.clear(); setTradeCount(0); setSettings(settingsStore.get()); } }}
            className="w-full py-2.5 border border-[#1f1f1f] text-[#333] hover:text-[#666] hover:border-[#2a2a2a] rounded-md text-sm transition-colors">
            Delete all data
          </button>
          <p className="text-[#2a2a2a] text-[11px] text-center mt-2">Clears all trades, chats and notes from localStorage</p>
        </div>
      </Section>

      <div className="border border-[#111] rounded-lg p-5">
        <div className="text-[10px] text-[#333] uppercase tracking-widest mb-4">System</div>
        <div className="space-y-2">
          {[
            ['Version', '1.0.0'],
            ['Framework', 'Next.js 16'],
            ['Model', 'claude-sonnet-5'],
            ['Charts', 'lightweight-charts v4'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-xs">
              <span className="text-[#333]">{k}</span>
              <span className="text-[#555] font-mono">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
