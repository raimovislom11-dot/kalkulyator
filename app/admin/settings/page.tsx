'use client';

import { useState, useEffect } from 'react';
import { settingsStore, tradesStore } from '../../lib/store';
import type { AdminSettings } from '../../lib/types';
import Link from 'next/link';

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <header className="px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 className="text-sm font-bold text-white">{title}</h2>
        {desc && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{desc}</p>}
      </header>
      <div className="p-6 space-y-5">{children}</div>
    </section>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────
function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0">
        <div className="text-sm font-medium text-white">{label}</div>
        {desc && <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{desc}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none"
      style={{
        background: checked
          ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
          : 'rgba(255,255,255,0.08)',
        boxShadow: checked ? '0 0 12px rgba(99,102,241,0.4)' : 'none',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all duration-300"
        style={{
          background: 'white',
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }}
        aria-hidden="true"
      />
    </button>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
function StyledSelect({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  ariaLabel?: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-all"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'white',
      }}
      aria-label={ariaLabel}
    >
      {options.map(o => (
        <option key={o.value} value={o.value} style={{ background: '#0e0e1a' }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

const inputCls = 'px-3 py-2.5 rounded-xl text-white text-sm focus:outline-none transition-all duration-200 font-mono text-right';
const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };

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

  if (!mounted || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-8 h-8 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: '#818cf8', borderRightColor: '#818cf8' }}
          role="status"
          aria-label="Loading..."
        />
      </div>
    );
  }

  const riskUSD = settings.deposit * settings.riskPercentage / 100;

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Admin panel konfiguratsiyasi
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105"
          style={
            saved
              ? { background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }
              : { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)', color: 'white' }
          }
          aria-label="Save settings"
        >
          {saved ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Saqlandi
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              Saqlash
            </>
          )}
        </button>
      </header>

      {/* ─── Trading ─── */}
      <Section title="Trading" desc="Risk boshqaruvi va standart sozlamalar">
        <Row label="Depozit" desc="Boshlang'ich savdo depoziti ($)">
          <input
            type="number"
            value={settings.deposit}
            onChange={e => update('deposit', parseFloat(e.target.value) || 0)}
            className={`${inputCls} w-32`}
            style={inputStyle}
            aria-label="Depozit miqdori"
          />
        </Row>
        <Row label="Savdoga risk" desc="Har bir savdoga depozitning %">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={settings.riskPercentage}
              step="0.1" min="0.1" max="10"
              onChange={e => update('riskPercentage', parseFloat(e.target.value) || 1)}
              className={`${inputCls} w-20`}
              style={inputStyle}
              aria-label="Risk foizi"
            />
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>%</span>
          </div>
        </Row>
        <Row label="Standart instrument">
          <input
            value={settings.defaultInstrument}
            onChange={e => update('defaultInstrument', e.target.value)}
            className={`${inputCls} w-32 text-left`}
            style={inputStyle}
            aria-label="Standart savdo instrument"
          />
        </Row>
        <Row label="Valyuta" desc="Foyda/zarar ko'rsatish valyutasi">
          <StyledSelect
            value={settings.currency}
            onChange={v => update('currency', v as AdminSettings['currency'])}
            ariaLabel="Valyuta tanlash"
            options={[
              { value: 'USD', label: '🇺🇸 USD' },
              { value: 'EUR', label: '🇪🇺 EUR' },
              { value: 'UZS', label: '🇺🇿 UZS' },
            ]}
          />
        </Row>
      </Section>

      {/* ─── Risk Calculator Preview ─── */}
      <section
        className="rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 100%)',
          border: '1px solid rgba(99,102,241,0.15)',
        }}
        aria-label="Risk kalkulyator ko'rinishi"
      >
        <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(129,140,248,0.7)' }}>
          Risk kalkulyator
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Savdoga risk',        value: `$${riskUSD.toFixed(2)}`,                       accent: '#818cf8' },
            { label: 'Depozit',             value: `$${settings.deposit.toLocaleString()}`,          accent: '#a5b4fc' },
            { label: '5× ketma-ket zarar',  value: `-$${(riskUSD * 5).toFixed(2)}`,                accent: '#f87171' },
            { label: 'Drawdown (5×)',        value: `${((riskUSD * 5) / settings.deposit * 100).toFixed(1)}%`, accent: '#f87171' },
          ].map(r => (
            <div
              key={r.label}
              className="rounded-xl p-4"
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {r.label}
              </div>
              <div className="text-base font-bold font-mono" style={{ color: r.accent }}>{r.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Appearance ─── */}
      <Section title="Ko'rinish" desc="Interfeys va til sozlamalari">
        <Row label="Mavzu" desc="Interfeys rangini tanlang">
          <StyledSelect
            value={settings.theme}
            onChange={v => update('theme', v as AdminSettings['theme'])}
            ariaLabel="Mavzu tanlash"
            options={[
              { value: 'dark',   label: '🌙 Dark' },
              { value: 'darker', label: '⬛ Darker' },
            ]}
          />
        </Row>
        <Row label="Til" desc="Interfeys tili">
          <StyledSelect
            value={settings.language}
            onChange={v => update('language', v as AdminSettings['language'])}
            ariaLabel="Til tanlash"
            options={[
              { value: 'uz', label: "🇺🇿 O'zbek" },
              { value: 'ru', label: '🇷🇺 Русский' },
              { value: 'en', label: '🇬🇧 English' },
            ]}
          />
        </Row>
        <Row label="Bildirishnomalar" desc="Savdo signallari va ogohlantirishlar">
          <Toggle
            checked={settings.notifications}
            onChange={v => update('notifications', v)}
          />
        </Row>
      </Section>

      {/* ─── Connections ─── */}
      <Section title="Ulanishlar" desc="API va kutubxona holati">
        <Row label="Anthropic Claude API" desc="AI chat va tahlil uchun ishlatiladi">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono"
            style={
              apiStatus === 'ok'
                ? { background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' }
                : apiStatus === 'checking'
                ? { background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }
                : { background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }
            }
            role="status"
            aria-label={`API holati: ${apiStatus}`}
          >
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${apiStatus === 'checking' ? 'animate-pulse' : ''}`}
              style={{ background: apiStatus === 'ok' ? '#34d399' : apiStatus === 'checking' ? '#fbbf24' : '#f87171' }}
              aria-hidden="true"
            />
            {apiStatus === 'ok' ? 'Ulangan' : apiStatus === 'checking' ? 'Tekshirilmoqda...' : 'Sozlanmagan'}
          </div>
        </Row>

        {apiStatus === 'error' && (
          <div
            className="rounded-xl px-4 py-3 text-xs"
            style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', color: 'rgba(255,255,255,0.5)' }}
            role="alert"
          >
            {' '}
            <code className="px-1.5 py-0.5 rounded font-mono text-[#f87171]" style={{ background: 'rgba(248,113,113,0.1)' }}>
              ANTHROPIC_API_KEY
            </code>
            {' '}ni{' '}
            <code className="px-1.5 py-0.5 rounded font-mono text-[#818cf8]" style={{ background: 'rgba(99,102,241,0.1)' }}>
              .env.local
            </code>
            {' '}fayliga qo'shing
          </div>
        )}

        <Row label="Lightweight Charts" desc="TradingView grafik kutubxonasi">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono"
            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" aria-hidden="true" />
            O'rnatilgan
          </div>
        </Row>
      </Section>

      {/* ─── Data ─── */}
      <Section title="Ma'lumotlar" desc="Savdo jurnali va ma'lumotlarni boshqarish">
        <Row label="Savdo jurnali" desc={`${tradeCount} ta savdo localStorage da`}>
          <Link
            href="/admin/trades"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}
          >
            Ochish →
          </Link>
        </Row>
        <Row label="Foydalanuvchilar" desc="Ro'yxatdagi foydalanuvchilar">
          <Link
            href="/admin/users"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }}
          >
            Boshqarish →
          </Link>
        </Row>

        <div className="pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            type="button"
            onClick={() => {
              if (confirm('Barcha ma\'lumotlarni o\'chirasizmi? Bu amalni qaytarib bo\'lmaydi.')) {
                localStorage.clear();
                setTradeCount(0);
                setSettings(settingsStore.get());
              }
            }}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', color: '#f87171' }}
          >
            Barcha ma'lumotlarni o'chirish
          </button>
          <p className="text-[11px] text-center mt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
            localStorage dagi barcha savdolar, chatlar va eslatmalar o'chiriladi
          </p>
        </div>
      </Section>

      {/* ─── System Info ─── */}
      <section
        className="rounded-2xl p-6"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        aria-label="Tizim ma'lumotlari"
      >
        <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Tizim
        </h2>
        <dl className="space-y-2.5">
          {[
            ['Versiya', '1.0.0'],
            ['Framework', 'Next.js 16'],
            ['AI modeli', 'claude-sonnet-5'],
            ['Grafiklar', 'lightweight-charts v5'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between items-center text-xs">
              <dt style={{ color: 'rgba(255,255,255,0.3)' }}>{k}</dt>
              <dd className="font-mono font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{v}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
