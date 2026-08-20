'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import MultiAssetSelector, { ASSET_LIST, AssetConfig } from './components/MultiAssetSelector';
import RiskCalculator from './components/RiskCalculator';
import TradingViewWidget from './components/TradingViewChart';
import KillzonesWidget from './components/KillzonesWidget';
import TradingJournal, { saveTradeToJournalStorage } from './components/TradingJournal';
import EconomicCalendar from './components/EconomicCalendar';
import TelegramShareModal, { sendDirectTelegramMessage } from './components/TelegramShareModal';
import AdminPanel from './components/AdminPanel';
import { findUser, saveSession, loadSession, clearSession, updateUserLogin, addTokensUsed, addActiveMinutes, SessionData } from './lib/users';

type Preset = 'Elif trading' | 'AB TRADE' | '2.6 STRATEGY' | 'ORDER BLOCK' | 'IFVG' | 'SNR_ICT' | 'SMT' | 'FIBONACCI';
type CandleType = 'bullish_engulfing' | 'hammer' | 'bullish_pinbar' | 'bearish_engulfing' | 'shooting_star' | 'bearish_pinbar';
type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
type OBType = 'bullish' | 'bearish';

interface RatioConfig { rRev: number; rCor: number; rCons: number; }

const timeframeConfig: Record<Timeframe, { label: string; maxRange: number; pipBuffer: number; consolOffset: number; color: string; }> = {
  '1m': { label: '1 Daqiqa', maxRange: 10, pipBuffer: 1.0, consolOffset: 0.5, color: 'text-sky-400' },
  '5m': { label: '5 Daqiqa', maxRange: 25, pipBuffer: 1.5, consolOffset: 1.0, color: 'text-blue-400' },
  '15m': { label: '15 Daqiqa', maxRange: 100, pipBuffer: 2.0, consolOffset: 2.0, color: 'text-indigo-400' },
  '1h': { label: '1 Soat', maxRange: 100, pipBuffer: 3.0, consolOffset: 3.0, color: 'text-violet-400' },
  '4h': { label: '4 Soat', maxRange: 250, pipBuffer: 5.0, consolOffset: 5.0, color: 'text-purple-400' },
  '1d': { label: '1 Kun', maxRange: 600, pipBuffer: 10.0, consolOffset: 10.0, color: 'text-orange-400' },
};

const presetConfigs: Record<string, RatioConfig> = {
  'Elif trading': { rRev: 1.0, rCor: 0.166, rCons: 0.5 },
  'AB TRADE': { rRev: 0.3846, rCor: 0.0, rCons: 0.225 },
  '2.6 STRATEGY': { rRev: 1 / 2.6, rCor: 0.0, rCons: 0.0 },
};



// RR hisobi
const calcRR = (entry: number, sl: number, tp: number): string => {
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  if (risk === 0) return '—';
  return `1 : ${(reward / risk).toFixed(2)}`;
};

// ─────────────────────────────────────────────
// AI TAHLIL PANELI
interface ImageItem { file: File; preview: string; }

// --- Signal parser ---
function parseSignal(text: string) {
  const cleaned = text.replace(/(\d{1,3}),(\d{3})(?!\d)/g, '$1$2');
  const NUM = '(\\d{1,7}(?:\\.\\d{1,5})?)';

  const find = (patterns: RegExp[]): string => {
    for (const re of patterns) {
      const m = cleaned.match(re);
      if (m?.[1]) return m[1].split(/[-\u2013]/)[0].trim();
    }
    return '';
  };

  const entry = find([
    new RegExp('\\*?[Ee]ntry\\*?[\\s\\*\\:]*' + NUM, 'i'),
    new RegExp('Kirish(?:\\s*narxi?)?[\\s\\*\\:]*' + NUM, 'i'),
  ]);
  const sl = find([
    new RegExp('\\*?Stop[\\s\\-]*Loss\\*?[\\s\\*\\:]*' + NUM, 'i'),
    new RegExp('\\bSL\\b[\\s\\*\\:]*' + NUM),
    new RegExp("To\'xtatish[\\s\\*\\:]*" + NUM, 'i'),
  ]);
  const tp1 = find([
    new RegExp('\\*?TP[\\s\\-]?1\\*?[\\s\\*\\:]*' + NUM, 'i'),
    new RegExp('\\*?TP1\\*?[\\s\\*\\:]*' + NUM, 'i'),
    new RegExp('Take\\s*Profit\\s*1[\\s\\*\\:]*' + NUM, 'i'),
    new RegExp('Foyda\\s*1[\\s\\*\\:]*' + NUM, 'i'),
  ]);
  const tp2 = find([
    new RegExp('\\*?TP[\\s\\-]?2\\*?[\\s\\*\\:]*' + NUM, 'i'),
    new RegExp('\\*?TP2\\*?[\\s\\*\\:]*' + NUM, 'i'),
    new RegExp('Take\\s*Profit\\s*2[\\s\\*\\:]*' + NUM, 'i'),
    new RegExp('Foyda\\s*2[\\s\\*\\:]*' + NUM, 'i'),
  ]);
  const tp3 = find([
    new RegExp('\\*?TP[\\s\\-]?3\\*?[\\s\\*\\:]*' + NUM, 'i'),
    new RegExp('\\*?TP3\\*?[\\s\\*\\:]*' + NUM, 'i'),
    new RegExp('Take\\s*Profit\\s*3[\\s\\*\\:]*' + NUM, 'i'),
    new RegExp('Foyda\\s*3[\\s\\*\\:]*' + NUM, 'i'),
  ]);

  return { entry, sl, tp1, tp2, tp3 };
}

function SignalCard({
  text,
  accentColor = 'amber',
  asset,
  onOpenTelegram,
  onSaveToJournal,
  isAdmin = false,
}: {
  text: string;
  accentColor?: 'amber' | 'violet';
  asset: AssetConfig;
  onOpenTelegram?: (data: any) => void;
  onSaveToJournal?: (data: any) => void;
  isAdmin?: boolean;
}) {
  const parsed = parseSignal(text);
  const [vals, setVals] = useState({ entry: '', sl: '', tp1: '', tp2: '', tp3: '' });
  const [copied, setCopied] = useState(false);
  const [savedJournal, setSavedJournal] = useState(false);
  const [sendingDirectTg, setSendingDirectTg] = useState(false);
  const [sentDirectTg, setSentDirectTg] = useState(false);

  useEffect(() => {
    if (text) {
      const p = parseSignal(text);
      setVals(prev => ({
        entry: p.entry || prev.entry,
        sl: p.sl || prev.sl,
        tp1: p.tp1 || prev.tp1,
        tp2: p.tp2 || prev.tp2,
        tp3: p.tp3 || prev.tp3,
      }));
    }
  }, [text]);

  const copyText =
    `Instrument: ${asset.name}\n` +
    'Entry: ' + (vals.entry || '—') + '\n' +
    'Stop Loss: ' + (vals.sl || '—') + '\n' +
    'TP1: ' + (vals.tp1 || '—') + '\n' +
    'TP2: ' + (vals.tp2 || '—') + '\n' +
    'TP3: ' + (vals.tp3 || '—');

  const handleCopy = () => {
    navigator.clipboard.writeText(copyText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSave = () => {
    if (!vals.entry || !vals.sl) {
      alert("Entry va Stop Loss bo'sh bo'lmasligi kerak");
      return;
    }
    const isBuy = parseFloat(vals.tp1) > parseFloat(vals.entry) || parseFloat(vals.entry) > parseFloat(vals.sl);
    const ok = saveTradeToJournalStorage({
      asset: asset.symbol,
      strategy: 'AI Claude Tahlili',
      direction: isBuy ? 'BUY' : 'SELL',
      entry: vals.entry,
      sl: vals.sl,
      tp1: vals.tp1 || '—',
      tp2: vals.tp2 || '—',
      tp3: vals.tp3 || '—',
      notes: 'AI tahlilidan saqlangan',
    });
    if (ok) {
      setSavedJournal(true);
      setTimeout(() => setSavedJournal(false), 2500);
    }
  };

  const handleSendDirectTg = async () => {
    if (!vals.entry || !vals.sl) {
      alert("Entry va Stop Loss bo'sh bo'lmasligi kerak");
      return;
    }
    const isBuy = parseFloat(vals.tp1) > parseFloat(vals.entry) || parseFloat(vals.entry) > parseFloat(vals.sl);
    setSendingDirectTg(true);
    const res = await sendDirectTelegramMessage({
      asset: asset.symbol,
      strategy: 'AI Claude Tahlili',
      direction: isBuy ? 'BUY' : 'SELL',
      entry: vals.entry,
      sl: vals.sl,
      tp1: vals.tp1 || '—',
      tp2: vals.tp2 || '—',
      tp3: vals.tp3 || '—',
    });
    setSendingDirectTg(false);
    if (res.ok) {
      setSentDirectTg(true);
      setTimeout(() => setSentDirectTg(false), 3000);
    } else {
      alert("Telegram bot orqali xabar yuborishda xatolik yuz berdi");
    }
  };

  const handleTg = () => {
    if (!vals.entry || !vals.sl) {
      alert("Entry va Stop Loss bo'sh bo'lmasligi kerak");
      return;
    }
    const isBuy = parseFloat(vals.tp1) > parseFloat(vals.entry) || parseFloat(vals.entry) > parseFloat(vals.sl);
    onOpenTelegram?.({
      asset: asset.symbol,
      strategy: 'AI Claude Tahlili',
      direction: isBuy ? 'BUY' : 'SELL',
      entry: vals.entry,
      sl: vals.sl,
      tp1: vals.tp1 || '—',
      tp2: vals.tp2 || '—',
      tp3: vals.tp3 || '—',
    });
  };

  const isAmber = accentColor === 'amber';
  const border = isAmber ? 'border-amber-500/50' : 'border-violet-500/50';
  const bg = isAmber ? 'from-amber-950/60 to-orange-950/40' : 'from-violet-950/60 to-indigo-950/40';
  const titleColor = isAmber ? 'text-amber-300' : 'text-violet-300';
  const btnBg = isAmber
    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
    : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700';

  const autoFilled = parsed.entry || parsed.sl || parsed.tp1;

  const fields = [
    { key: 'entry' as const, label: 'Entry', placeholder: '3245.50', color: 'text-green-300', border: 'border-green-700/50 focus:border-green-400' },
    { key: 'sl' as const, label: 'Stop Loss', placeholder: '3220.00', color: 'text-red-300', border: 'border-red-700/50 focus:border-red-400' },
    { key: 'tp1' as const, label: 'TP1', placeholder: '3270.00', color: 'text-blue-300', border: 'border-blue-700/50 focus:border-blue-400' },
    { key: 'tp2' as const, label: 'TP2', placeholder: '3295.00', color: 'text-blue-200', border: 'border-blue-700/40 focus:border-blue-300' },
    { key: 'tp3' as const, label: 'TP3', placeholder: '3320.00', color: 'text-sky-200', border: 'border-sky-700/40 focus:border-sky-300' },
  ];

  return (
    <div className={`mt-3 bg-gradient-to-br ${bg} border ${border} rounded-xl p-4`}
      style={{ boxShadow: isAmber ? '0 0 20px rgba(245,158,11,0.1)' : '0 0 20px rgba(139,92,246,0.1)' }}>
      {/* Sarlavha */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📍</span>
          <span className={`${titleColor} font-bold text-sm`}>Signal Natijalari</span>
          {autoFilled && (
            <span className="text-xs px-1.5 py-0.5 bg-green-900/40 text-green-400 rounded-full font-bold">✓ auto</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {isAdmin && (
            <button
              onClick={handleSendDirectTg}
              disabled={sendingDirectTg}
              className={`flex items-center gap-1 px-3 py-1.5 text-white text-xs font-bold rounded-lg transition-all active:scale-95 shadow-md ${sentDirectTg
                ? 'bg-emerald-600'
                : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700'
                }`}
            >
              {sendingDirectTg ? (
                <span>Yuborilmoqda...</span>
              ) : sentDirectTg ? (
                <><span>✓</span><span>Botga yuborildi!</span></>
              ) : (
                <><span>🚀</span><span>Botga yuborish</span></>
              )}
            </button>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all active:scale-95 shadow"
          >
            <span>{savedJournal ? '✓' : '📓'}</span>
            <span>{savedJournal ? 'Saqlandi!' : 'Jurnalga'}</span>
          </button>
          {isAdmin && (
            <button
              onClick={handleTg}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-sky-500/40 text-sky-300 text-xs font-bold rounded-lg transition-all active:scale-95 shadow"
            >
              <span>📱</span>
              <span>Sozlama</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 px-2.5 py-1.5 ${btnBg} text-white text-xs font-bold rounded-lg transition-all active:scale-95 shadow-md`}
          >
            {copied ? (
              <><span className="text-green-200">✓</span><span>Nusxalandi!</span></>
            ) : (
              <><span>📋</span><span>Nusxalash</span></>
            )}
          </button>
        </div>
      </div>

      {/* Maydonlar */}
      <div className="space-y-2">
        {fields.map(({ key, label, placeholder, color, border: fBorder }) => (
          <div key={key} className="flex items-center gap-3 bg-slate-900/60 rounded-lg px-3 py-2">
            <span className="text-slate-400 text-xs font-bold w-20 flex-shrink-0">{label}:</span>
            <input
              type="text"
              value={vals[key]}
              onChange={(e) => setVals(prev => ({ ...prev, [key]: e.target.value }))}
              placeholder={placeholder}
              className={`flex-1 bg-transparent border-b ${fBorder} ${color} text-sm font-bold font-mono focus:outline-none placeholder-slate-700 transition-colors`}
            />
          </div>
        ))}
      </div>

      <p className="text-slate-600 text-xs mt-2 text-center">
        {autoFilled ? 'Qiymatlar avtomatik aniqlandi — oʼgartirish mumkin' : 'Qiymatlarni qoʼlda kiriting yoki tahlildan koʼchiring'}
      </p>
    </div>
  );
}

function AIAnalysisPanel({
  calcContext,
  asset,
  timeframe,
  onOpenTelegram,
  isAdmin = false,
  currentUsername = '',
}: {
  calcContext: string;
  asset: AssetConfig;
  timeframe: string;
  onOpenTelegram?: (data: any) => void;
  isAdmin?: boolean;
  currentUsername?: string;
}) {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [marketResponse, setMarketResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMarketLoading, setIsMarketLoading] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'live_chart' | 'market' | 'chat'>('live_chart');
  const [showTermModal, setShowTermModal] = useState(false);
  const [currentTermMode, setCurrentTermMode] = useState<'short' | 'long'>('short');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);
  const marketResponseRef = useRef<HTMLDivElement>(null);

  const addImages = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    arr.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages(prev => {
          const exists = prev.some(im => im.file.name === file.name && im.file.size === file.size);
          if (exists) return prev;
          return [...prev, { file, preview: e.target?.result as string }];
        });
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const removeImage = (idx: number) =>
    setImages(prev => prev.filter((_, i) => i !== idx));

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) addImages(e.dataTransfer.files);
  }, [addImages]);

  const marketAnalyze = async (term: 'short' | 'long' = 'short') => {
    setShowTermModal(false);
    setCurrentTermMode(term);
    setIsMarketLoading(true);
    setMarketResponse('');
    setMarketError(null);

    const entryMatch = calcContext?.match(/(?:Kirish|Entry|Narx)\s*[:=]\s*([0-9.]+)/i);
    const userPrice = entryMatch ? entryMatch[1] : '';

    const form = new FormData();
    form.append('assetSymbol', asset.symbol || 'XAUUSD');
    form.append('assetName', asset.name || 'Gold');
    form.append('timeframe', timeframe || '5m');
    form.append('termMode', term);
    if (userPrice) {
      form.append('userCurrentPrice', userPrice);
    }
    form.append(
      'calcContext',
      `Instrument: ${asset.name} (${asset.symbol})\nVaqt oralig'i: ${timeframe}\n` +
      (userPrice ? `Grafikdagi Kirish Narxi: ${userPrice} USD\n` : '') +
      `Tahlil turi: ${term === 'short' ? 'Qisqa muddatli (Scalp: 1-15 daqiqa)' : 'Uzoq muddatli (Intraday: 1-4 soat)'}\n` +
      calcContext
    );

    try {
      const res = await fetch('/api/market-analyze', { method: 'POST', body: form });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server ${res.status}: ${text}`);
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let done = false;

      while (!done) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') { done = true; break; }
          try {
            const parsed = JSON.parse(payload);
            if (parsed.text) {
              setMarketResponse(prev => prev + parsed.text);
              setTimeout(() => {
                marketResponseRef.current?.scrollTo({ top: marketResponseRef.current.scrollHeight, behavior: 'smooth' });
              }, 10);
            }
            if (parsed.error) { setMarketError(parsed.error); done = true; break; }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      setMarketError(err instanceof Error ? err.message : 'Ulanishda xatolik yuz berdi');
    } finally {
      setIsMarketLoading(false);
    }
  };

  const analyze = async () => {
    if (!message.trim() && images.length === 0) return;
    setIsLoading(true);
    setResponse('');
    setErrorMsg(null);

    const form = new FormData();
    form.append('message', message || 'Ushbu rasmlarni tahlil qilib bering.');
    form.append('context', `Instrument: ${asset.name} (${asset.symbol})\nVaqt oralig'i: ${timeframe}\n` + calcContext);
    images.forEach((im, i) => form.append(`image_${i}`, im.file));
    form.append('imageCount', String(images.length));

    try {
      const res = await fetch('/api/analyze', { method: 'POST', body: form });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server ${res.status}: ${text}`);
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let done = false;

      while (!done) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') { done = true; break; }
          try {
            const parsed = JSON.parse(payload);
            if (parsed.text) {
              setResponse(prev => prev + parsed.text);
              setTimeout(() => {
                responseRef.current?.scrollTo({ top: responseRef.current.scrollHeight, behavior: 'smooth' });
              }, 10);
            }
            if (parsed.error) { setErrorMsg(parsed.error); done = true; break; }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Ulanishda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/85 border border-violet-700/50 rounded-2xl p-4 sm:p-5 mb-4 backdrop-blur shadow-xl relative">
      {/* Term Selection Modal (Qisqa yoki Uzoq muddatli tanlash) */}
      {showTermModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border-2 border-indigo-500/60 rounded-3xl p-6 shadow-2xl relative text-center">
            <button
              onClick={() => setShowTermModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg p-1"
            >
              ✕
            </button>

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg shadow-indigo-500/30">
              🤖
            </div>

            <h3 className="text-white text-lg font-black tracking-wide mb-1">TAHLIL TURINI TANLANG</h3>
            <p className="text-slate-400 text-xs mb-5">
              <strong className="text-amber-400">{asset.name}</strong> bo&apos;yicha qaysi oraliqda signal olmoqchisiz?
            </p>

            <div className="space-y-3">
              {/* Qisqa Muddatli */}
              <button
                onClick={() => marketAnalyze('short')}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/10 border-2 border-amber-500/60 hover:border-amber-400 hover:scale-[1.02] text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <div className="text-amber-300 font-black text-sm group-hover:text-amber-200">
                        QISQA MUDDATLI (Scalp / 1-15m)
                      </div>
                      <div className="text-slate-400 text-xs mt-0.5">
                        1m, 5m, 15m • Tezkor kirish, qisqa SL, yaqin TP
                      </div>
                    </div>
                  </div>
                  <span className="text-amber-400 font-bold text-lg">➔</span>
                </div>
              </button>

              {/* Uzoq Muddatli */}
              <button
                onClick={() => marketAnalyze('long')}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-violet-500/10 border-2 border-indigo-500/60 hover:border-indigo-400 hover:scale-[1.02] text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📈</span>
                    <div>
                      <div className="text-indigo-300 font-black text-sm group-hover:text-indigo-200">
                        UZOQ MUDDATLI (Intraday / 1-4 Soat)
                      </div>
                      <div className="text-slate-400 text-xs mt-0.5">
                        1h, 4h • Kuchli trend, mustahkam zonalar, katta TP maqsadlar
                      </div>
                    </div>
                  </div>
                  <span className="text-indigo-400 font-bold text-lg">➔</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sarlavha / Ochish tugmasi */}
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-lg shadow-lg shadow-violet-500/30">
            🤖
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm">SUN&apos;IY INTELLEKT TAHLIL PANELI</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-900/60 text-violet-300 border border-violet-600/40 font-mono font-bold">
                Claude Opus 4.5
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">Qisqa (1-15m Scalp) & Uzoq (1-4h Intraday) muddatli jonli tahlil</p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          {isOpen ? '▲' : '▼'}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-slate-700/60 space-y-4">
          {/* Tab almashtirish */}
          <div className="grid grid-cols-3 gap-1.5 bg-slate-800/80 p-1.5 rounded-xl">
            <button
              onClick={() => setActiveTab('live_chart')}
              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'live_chart'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              <span>📈</span>
              <span className="truncate">Jonli Grafik & AI</span>
            </button>
            <button
              onClick={() => setActiveTab('market')}
              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'market'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              <span>📊</span>
              <span className="truncate">Bozor Tahlili</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'chat'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              <span>🖼️</span>
              <span className="truncate">Skrinshot Tahlil</span>
            </button>
          </div>

          {/* 1-TAB: JONLI GRAFIK & AVTO AI TAHLIL */}
          {activeTab === 'live_chart' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-700/60 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">● Jonli Grafik:</span>
                  <span className="text-white font-bold font-mono">{asset.name} ({asset.symbol})</span>
                  <span className="text-orange-400 font-bold font-mono">• {timeframe}</span>
                </div>
                <span className="text-slate-400 text-[11px]">Real-Time TradingView</span>
              </div>

              {/* Directly Embedded TradingView Widget */}
              <div className="rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
                <TradingViewWidget
                  asset={asset}
                  timeframe={timeframe}
                  hideHeader={true}
                  height={450}
                  currentPrice={(() => {
                    const match = calcContext?.match(/(?:Kirish|Entry|Narx)\s*[:=]\s*([0-9.]+)/i);
                    return match ? parseFloat(match[1]) : undefined;
                  })()}
                />
              </div>

              {/* Tahlil Tugmalari (Qisqa va Uzoq muddatli) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => marketAnalyze('short')}
                  disabled={isMarketLoading}
                  className={`py-3.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${isMarketLoading
                    ? 'bg-amber-950/60 text-amber-500 cursor-wait'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 shadow-amber-500/20 active:scale-95'
                    }`}
                >
                  {isMarketLoading && currentTermMode === 'short' ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                      1-15m tahlil qilinmoqda...
                    </>
                  ) : (
                    <>⚡ Qisqa Muddatli (1-15m Scalp)</>
                  )}
                </button>

                <button
                  onClick={() => marketAnalyze('long')}
                  disabled={isMarketLoading}
                  className={`py-3.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${isMarketLoading
                    ? 'bg-indigo-950/60 text-indigo-400 cursor-wait'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-indigo-500/20 active:scale-95'
                    }`}
                >
                  {isMarketLoading && currentTermMode === 'long' ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      1-4 soat tahlil qilinmoqda...
                    </>
                  ) : (
                    <>📈 Uzoq Muddatli (1-4 Soat)</>
                  )}
                </button>
              </div>

              {marketError && (
                <div className="bg-red-900/30 border border-red-600/50 rounded-xl p-4 text-xs text-red-200">
                  {marketError}
                </div>
              )}

              {/* Streaming AI Analysis & Signal Card under chart */}
              {marketResponse && (
                <div className="bg-slate-800/60 border border-indigo-500/40 rounded-xl p-4 mt-3">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔮</span>
                      <span className="text-indigo-300 font-bold text-sm">
                        {currentTermMode === 'short' ? '⚡ Qisqa Muddatli (1-15m) Natijasi' : '📈 Uzoq Muddatli (1-4 Soat) Natijasi'}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentTermMode === 'short'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
                      }`}>
                      {currentTermMode === 'short' ? 'Scalping / 1-15m' : 'Intraday / 1-4 Soat'}
                    </span>
                  </div>
                  <div
                    ref={marketResponseRef}
                    className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto pr-2 font-sans"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#6366f1 transparent' }}
                  >
                    {marketResponse}
                  </div>
                  {!isMarketLoading && (
                    <SignalCard
                      text={marketResponse}
                      accentColor={currentTermMode === 'short' ? 'amber' : 'violet'}
                      asset={asset}
                      onOpenTelegram={onOpenTelegram}
                      isAdmin={isAdmin}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2-TAB: BOZOR TAHLILI */}
          {activeTab === 'market' && (
            <div className="space-y-3">
              <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/60 text-xs text-slate-300">
                <span className="text-amber-400 font-bold">💡 Tahlil turini tanlang: </span>
                Tezkor operatsiyalar uchun <strong>1-15m Scalp</strong> yoki mustahkam reja uchun <strong>1-4 Soat</strong> tahlilni tanlang.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => marketAnalyze('short')}
                  disabled={isMarketLoading}
                  className={`py-3.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${isMarketLoading
                    ? 'bg-amber-950/60 text-amber-500 cursor-wait'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 shadow-amber-500/20 active:scale-95'
                    }`}
                >
                  {isMarketLoading && currentTermMode === 'short' ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                      1-15m tahlil qilinmoqda...
                    </>
                  ) : (
                    <>⚡ Qisqa Muddatli (1-15m Scalp)</>
                  )}
                </button>

                <button
                  onClick={() => marketAnalyze('long')}
                  disabled={isMarketLoading}
                  className={`py-3.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${isMarketLoading
                    ? 'bg-indigo-950/60 text-indigo-400 cursor-wait'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-indigo-500/20 active:scale-95'
                    }`}
                >
                  {isMarketLoading && currentTermMode === 'long' ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      1-4 soat tahlil qilinmoqda...
                    </>
                  ) : (
                    <>📈 Uzoq Muddatli (1-4 Soat)</>
                  )}
                </button>
              </div>

              {marketError && (
                <div className="bg-red-900/30 border border-red-600/50 rounded-xl p-4 text-xs text-red-200">
                  {marketError}
                </div>
              )}

              {marketResponse && (
                <div className="bg-slate-800/60 border border-amber-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📊</span>
                      <span className="text-amber-300 font-bold text-sm">
                        {currentTermMode === 'short' ? '⚡ Qisqa Muddatli (1-15m) Natijasi' : '📈 Uzoq Muddatli (1-4 Soat) Natijasi'}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentTermMode === 'short'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
                      }`}>
                      {currentTermMode === 'short' ? 'Scalping / 1-15m' : 'Intraday / 1-4 Soat'}
                    </span>
                  </div>
                  <div
                    ref={marketResponseRef}
                    className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto pr-2"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#b45309 transparent' }}
                  >
                    {marketResponse}
                  </div>
                  {!isMarketLoading && (
                    <SignalCard
                      text={marketResponse}
                      accentColor={currentTermMode === 'short' ? 'amber' : 'violet'}
                      asset={asset}
                      onOpenTelegram={onOpenTelegram}
                      isAdmin={isAdmin}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3-TAB: SKRINSHOT TAHLILI */}
          {activeTab === 'chat' && (
            <div className="space-y-3">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${isDragging
                  ? 'border-violet-400 bg-violet-950/30'
                  : 'border-slate-600 hover:border-violet-500 bg-slate-800/40 hover:bg-slate-800/70'
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.length) addImages(e.target.files); }}
                />
                <span className="text-3xl block mb-2">📸</span>
                <p className="text-slate-300 text-sm font-semibold">Grafik rasmlarini tashlang yoki bosing</p>
                <p className="text-slate-500 text-xs mt-1">PNG, JPG, WEBP • Bir nechta rasm mumkin</p>
              </div>

              {/* Rasm prevyulari */}
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {images.map((im, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-600 w-20 h-20 bg-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={im.preview} alt={`upload-${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-600/90 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) analyze(); }}
                placeholder="Savol yoki tahlil so'rovi kiriting... (Ctrl+Enter — yuborish)"
                rows={3}
                className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:border-violet-500 focus:outline-none resize-none transition-colors"
              />

              <button
                onClick={analyze}
                disabled={isLoading || (!message.trim() && images.length === 0)}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${isLoading
                  ? 'bg-violet-900/50 text-violet-400 cursor-wait'
                  : (!message.trim() && images.length === 0)
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20 active:scale-95'
                  }`}
              >
                {isLoading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></span>
                    Claude tahlil qilmoqda...
                  </>
                ) : (
                  <>🔮 Tahlil qil {images.length > 0 && `(${images.length} rasm)`}</>
                )}
              </button>

              {errorMsg && (
                <div className="bg-red-900/30 border border-red-600/50 rounded-xl p-4 text-xs text-red-200">
                  {errorMsg}
                </div>
              )}

              {response && (
                <div className="bg-slate-800/60 border border-violet-700/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🔮</span>
                    <span className="text-violet-300 font-bold text-sm">Claude javobi</span>
                  </div>
                  <div
                    ref={responseRef}
                    className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto pr-2"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#4c1d95 transparent' }}
                  >
                    {response}
                  </div>
                  {!isLoading && (
                    <SignalCard
                      text={response}
                      accentColor="violet"
                      asset={asset}
                      onOpenTelegram={onOpenTelegram}
                      isAdmin={isAdmin}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
function LoginScreen({ onAuthenticate }: { onAuthenticate: (session: SessionData) => void }) {
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!loginInput.trim() || !passwordInput.trim()) {
      setError("Login va parol bo'sh bo'lmasligi kerak!");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      const user = findUser(loginInput.trim(), passwordInput.trim());
      if (user) {
        updateUserLogin(user.username);
        saveSession(user);
        onAuthenticate({ username: user.username, role: user.role, loginAt: new Date().toISOString() });
      } else {
        setError("Login yoki parol noto'g'ri!");
        setPasswordInput('');
      }
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover -z-10 pointer-events-none"
        src="/back.MP4"
      />
      <div className="fixed inset-0 bg-black/45 -z-10 pointer-events-none" />
      <div className="w-full max-w-md relative z-10">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-4xl mx-auto mb-4 shadow-2xl shadow-orange-500/40">
            📊
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Trading Terminal</h1>
          <p className="text-slate-400 mt-2 text-sm">Professional savdo platformasi</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-8 backdrop-blur shadow-2xl shadow-black/50">
          <div className="text-center mb-6">
            <h2 className="text-xl font-black text-white">Tizimga kirish</h2>
            <p className="text-slate-500 text-xs mt-1">Login va parolingizni kiriting</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-slate-400 text-xs font-bold tracking-widest mb-2 block">LOGIN</label>
              <input
                type="text"
                value={loginInput}
                onChange={(e) => { setLoginInput(e.target.value); setError(''); }}
                className="w-full px-4 py-3.5 bg-slate-800/80 border border-slate-600 rounded-xl text-white text-base font-bold focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-all placeholder-slate-600"
                placeholder="loginni kiriting"
                autoFocus
                autoComplete="username"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold tracking-widest mb-2 block">PAROL</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setError(''); }}
                className="w-full px-4 py-3.5 bg-slate-800/80 border border-slate-600 rounded-xl text-white text-base font-bold focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-all placeholder-slate-600"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-600/50 rounded-xl px-4 py-3 text-red-300 text-sm font-bold text-center">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-60 text-white font-black rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-500/30 text-sm tracking-wide mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span><span>Tekshirilmoqda...</span></>
              ) : (
                <>🔐 KIRISH</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
function CalculatorContent({ isAdmin, currentUsername, onLogout }: { isAdmin: boolean; currentUsername: string; onLogout: () => void }) {
  const [selectedAsset, setSelectedAsset] = useState<AssetConfig>(ASSET_LIST[0]);
  const [activeMainTab, setActiveMainTab] = useState<'calc' | 'chart' | 'risk' | 'killzones' | 'journal' | 'calendar' | 'admin'>('calc');

  // Input states
  const [dailyHigh, setDailyHigh] = useState('');
  const [dailyLow, setDailyLow] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [preset, setPreset] = useState<Preset>('Elif trading');
  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const [inputMode, setInputMode] = useState<'manual' | 'candle'>('manual');

  // Candle OHLC
  const [candleOpen, setCandleOpen] = useState('');
  const [candleHigh, setCandleHigh] = useState('');
  const [candleLow, setCandleLow] = useState('');
  const [candleClose, setCandleClose] = useState('');

  // Strategy specific
  const [hhPrice, setHhPrice] = useState('');
  const [llPrice, setLlPrice] = useState('');
  const [obHigh, setObHigh] = useState('');
  const [obLow, setObLow] = useState('');
  const [obType, setObType] = useState<OBType>('bullish');
  const [fvgHigh, setFvgHigh] = useState('');
  const [fvgLow, setFvgLow] = useState('');
  const [fvgType, setFvgType] = useState<OBType>('bullish');
  const [snrEntry, setSnrEntry] = useState('');
  const [snrSL, setSnrSL] = useState('');
  const [snrType, setSnrType] = useState<OBType>('bullish');
  const [candleType, setCandleType] = useState<CandleType>('bullish_engulfing');
  const [smtEntry, setSmtEntry] = useState('');
  const [smtSL, setSmtSL] = useState('');
  const [smtType, setSmtType] = useState<OBType>('bullish');
  const [fibHigh, setFibHigh] = useState('');
  const [fibLow, setFibLow] = useState('');
  const [fibDirection, setFibDirection] = useState<'auto' | 'bullish' | 'bearish'>('auto');
  const [fibEntryLevel, setFibEntryLevel] = useState<'0.5' | '0.618' | '0.705' | '0.786'>('0.618');

  // Modals & notifications
  const [telegramModalData, setTelegramModalData] = useState<any | null>(null);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const effectiveHigh = inputMode === 'candle' && candleHigh ? candleHigh : dailyHigh;
  const effectiveLow = inputMode === 'candle' && candleLow ? candleLow : dailyLow;
  const effectiveCurrent = inputMode === 'candle' && candleClose ? candleClose : currentPrice;

  // Shamol tahlili
  const candleAnalysis = useMemo(() => {
    const o = parseFloat(candleOpen);
    const h = parseFloat(candleHigh);
    const l = parseFloat(candleLow);
    const c = parseFloat(candleClose);
    if (isNaN(o) || isNaN(h) || isNaN(l) || isNaN(c)) return null;
    if (h <= l) return null;
    const bodyTop = Math.max(o, c);
    const bodyBot = Math.min(o, c);
    const bodySize = bodyTop - bodyBot;
    const totalRange = h - l;
    const upperWick = h - bodyTop;
    const lowerWick = bodyBot - l;
    const bodyPct = totalRange > 0 ? ((bodySize / totalRange) * 100).toFixed(1) : '0';
    const isBullish = c > o;
    const isDoji = bodySize < totalRange * 0.05;
    const type = isDoji ? 'Doji' : isBullish ? 'Bullish' : 'Bearish';
    return { o, h, l, c, bodySize: bodySize.toFixed(selectedAsset.digits), upperWick: upperWick.toFixed(selectedAsset.digits), lowerWick: lowerWick.toFixed(selectedAsset.digits), bodyPct, type, isBullish, isDoji, totalRange: totalRange.toFixed(selectedAsset.digits) };
  }, [candleOpen, candleHigh, candleLow, candleClose, selectedAsset.digits]);

  const calculations = useMemo(() => {
    const high = parseFloat(effectiveHigh) || 0;
    const low = parseFloat(effectiveLow) || 0;
    const current = parseFloat(effectiveCurrent) || 0;
    const rangeVal = high - low;

    const tf = timeframeConfig[timeframe];
    // Dynamic buffer according to asset pip size
    const buf = tf.pipBuffer * selectedAsset.pipSize;
    const con = tf.consolOffset * selectedAsset.pipSize;

    if (current === 0) return null;

    const sq = Math.sqrt(current);
    const gann = {
      S1: Math.pow(sq - 0.25, 2), S2: Math.pow(sq - 0.50, 2),
      S3: Math.pow(sq - 0.75, 2), S4: Math.pow(sq - 1.00, 2),
      R1: Math.pow(sq + 0.25, 2), R2: Math.pow(sq + 0.50, 2),
      R3: Math.pow(sq + 0.75, 2), R4: Math.pow(sq + 1.00, 2),
    };

    const checkGann = (isBuy: boolean, min: number, max: number, tag = '') => {
      if (isBuy) {
        const s = [{ l: 'S1', v: gann.S1 }, { l: 'S2', v: gann.S2 }, { l: 'S3', v: gann.S3 }, { l: 'S4', v: gann.S4 }];
        const c = s.find(x => x.v >= min && x.v <= max);
        return c ? { text: `Gann ${c.l} (${c.v.toFixed(selectedAsset.digits)}) ${tag}bilan mos keldi!`, strong: true }
          : { text: "Gann bilan sinergiya yo'q", strong: false };
      } else {
        const r = [{ l: 'R1', v: gann.R1 }, { l: 'R2', v: gann.R2 }, { l: 'R3', v: gann.R3 }, { l: 'R4', v: gann.R4 }];
        const c = r.find(x => x.v >= min && x.v <= max);
        return c ? { text: `Gann ${c.l} (${c.v.toFixed(selectedAsset.digits)}) ${tag}bilan mos keldi!`, strong: true }
          : { text: "Gann bilan sinergiya yo'q", strong: false };
      }
    };

    const pct = (a: number, b: number) => ((Math.abs(a - b) / b) * 100).toFixed(2);
    const fmt = (n: number) => n.toFixed(selectedAsset.digits);
    const gFmt = {
      S1: gann.S1.toFixed(selectedAsset.digits), S2: gann.S2.toFixed(selectedAsset.digits), S3: gann.S3.toFixed(selectedAsset.digits), S4: gann.S4.toFixed(selectedAsset.digits),
      R1: gann.R1.toFixed(selectedAsset.digits), R2: gann.R2.toFixed(selectedAsset.digits), R3: gann.R3.toFixed(selectedAsset.digits), R4: gann.R4.toFixed(selectedAsset.digits),
    };

    // ── ORDER BLOCK ──
    if (preset === 'ORDER BLOCK') {
      const obH = parseFloat(obHigh);
      const obL = parseFloat(obLow);
      if (isNaN(obH) || isNaN(obL) || obH <= obL) return null;

      const isBuy = obType === 'bullish';
      const obMid = (obH + obL) / 2;
      const obSize = obH - obL;
      const entry = isBuy ? obH : obL;
      const sl = isBuy ? obL - buf : obH + buf;
      const tp1 = isBuy ? entry + obSize * 1.0 : entry - obSize * 1.0;
      const tp2 = isBuy ? entry + obSize * 2.0 : entry - obSize * 2.0;
      const tp3 = isBuy ? entry + (rangeVal > 0 ? rangeVal : obSize * 3) : entry - (rangeVal > 0 ? rangeVal : obSize * 3);

      const gRes = checkGann(isBuy, obL - buf, obH + buf, 'OB ');

      return {
        preset: 'ORDER BLOCK' as const, isBuy,
        obHigh: fmt(obH), obLow: fmt(obL),
        obMid: fmt(obMid), obMidPct: pct(obMid, current),
        obSize: fmt(obSize),
        entry: fmt(entry), entryPct: pct(entry, current),
        stopLoss: fmt(sl), slPct: pct(sl, current),
        tp1: fmt(tp1), tp1Pct: pct(tp1, current), rr1: calcRR(entry, sl, tp1),
        tp2: fmt(tp2), tp2Pct: pct(tp2, current), rr2: calcRR(entry, sl, tp2),
        tp3: fmt(tp3), tp3Pct: pct(tp3, current), rr3: calcRR(entry, sl, tp3),
        rangeVal: fmt(rangeVal), gann: gFmt,
        gannConfluence: gRes.text, isStrongSignal: gRes.strong,
        pipBuffer: buf,
      };
    }

    // ── IFVG ──
    if (preset === 'IFVG') {
      const fvgH = parseFloat(fvgHigh);
      const fvgL = parseFloat(fvgLow);
      if (isNaN(fvgH) || isNaN(fvgL) || fvgH <= fvgL) return null;

      const isBuy = fvgType === 'bullish';
      const fvgMid = (fvgH + fvgL) / 2;
      const fvgSize = fvgH - fvgL;
      const entry = isBuy ? fvgL : fvgH;
      const sl = isBuy ? fvgL - buf : fvgH + buf;
      const tp1 = isBuy ? fvgH + fvgSize * 0.618 : fvgL - fvgSize * 0.618;
      const tp2 = isBuy ? fvgH + fvgSize * 1.0 : fvgL - fvgSize * 1.0;
      const tp3 = isBuy ? fvgH + fvgSize * 1.618 : fvgL - fvgSize * 1.618;
      const gRes = checkGann(isBuy, fvgL - buf, fvgH + buf, 'IFVG ');
      return {
        preset: 'IFVG' as const, isBuy,
        fvgHigh: fmt(fvgH), fvgLow: fmt(fvgL),
        fvgMid: fmt(fvgMid), fvgMidPct: pct(fvgMid, current),
        fvgSize: fmt(fvgSize),
        entry: fmt(entry), entryPct: pct(entry, current),
        stopLoss: fmt(sl), slPct: pct(sl, current),
        tp1: fmt(tp1), tp1Pct: pct(tp1, current), rr1: calcRR(entry, sl, tp1),
        tp2: fmt(tp2), tp2Pct: pct(tp2, current), rr2: calcRR(entry, sl, tp2),
        tp3: fmt(tp3), tp3Pct: pct(tp3, current), rr3: calcRR(entry, sl, tp3),
        rangeVal: fmt(rangeVal), gann: gFmt,
        gannConfluence: gRes.text, isStrongSignal: gRes.strong,
        pipBuffer: buf,
      };
    }

    // ── SNR + ICT ──
    if (preset === 'SNR_ICT') {
      const entry = parseFloat(snrEntry);
      const sl = parseFloat(snrSL);
      if (isNaN(entry) || isNaN(sl) || entry === sl) return null;

      const isBuy = snrType === 'bullish';
      const risk = Math.abs(entry - sl);
      const tp1 = isBuy ? entry + risk * 1.0 : entry - risk * 1.0;
      const tp2 = isBuy ? entry + risk * 2.0 : entry - risk * 2.0;
      const tp3 = isBuy ? entry + risk * 3.0 : entry - risk * 3.0;

      const candleLabels: Record<CandleType, string> = {
        bullish_engulfing: '🟢 Bullish Engulfing',
        hammer: '🔨 Hammer',
        bullish_pinbar: '📌 Bullish Pin Bar',
        bearish_engulfing: '🔴 Bearish Engulfing',
        shooting_star: '⭐ Shooting Star',
        bearish_pinbar: '📌 Bearish Pin Bar',
      };
      const ref = current || entry;
      const gRes = checkGann(isBuy, Math.min(sl, entry) - buf, Math.max(sl, entry) + buf, 'SNR ');
      return {
        preset: 'SNR_ICT' as const, isBuy,
        candleLabel: candleLabels[candleType],
        entry: fmt(entry), entryPct: pct(entry, ref),
        stopLoss: fmt(sl), slPct: pct(sl, ref),
        tp1: fmt(tp1), tp1Pct: pct(tp1, ref), rr1: calcRR(entry, sl, tp1),
        tp2: fmt(tp2), tp2Pct: pct(tp2, ref), rr2: calcRR(entry, sl, tp2),
        tp3: fmt(tp3), tp3Pct: pct(tp3, ref), rr3: calcRR(entry, sl, tp3),
        risk: fmt(risk), rangeVal: fmt(rangeVal), gann: gFmt,
        gannConfluence: gRes.text, isStrongSignal: gRes.strong, pipBuffer: buf,
      };
    }

    // ── SMT ──
    if (preset === 'SMT') {
      const entry = parseFloat(smtEntry);
      const sl = parseFloat(smtSL);
      if (isNaN(entry) || isNaN(sl) || entry === sl) return null;

      const isBuy = smtType === 'bullish';
      const risk = Math.abs(entry - sl);
      const tp1 = isBuy ? entry + risk * 1.0 : entry - risk * 1.0;
      const tp2 = isBuy ? entry + risk * 2.0 : entry - risk * 2.0;
      const tp3 = isBuy ? entry + risk * 3.0 : entry - risk * 3.0;

      const ref = current || entry;
      const gRes = checkGann(isBuy, Math.min(sl, entry) - buf, Math.max(sl, entry) + buf, 'SMT ');
      return {
        preset: 'SMT' as const, isBuy,
        entry: fmt(entry), entryPct: pct(entry, ref),
        stopLoss: fmt(sl), slPct: pct(sl, ref),
        tp1: fmt(tp1), tp1Pct: pct(tp1, ref), rr1: calcRR(entry, sl, tp1),
        tp2: fmt(tp2), tp2Pct: pct(tp2, ref), rr2: calcRR(entry, sl, tp2),
        tp3: fmt(tp3), tp3Pct: pct(tp3, ref), rr3: calcRR(entry, sl, tp3),
        risk: fmt(risk), rangeVal: fmt(rangeVal), gann: gFmt,
        gannConfluence: gRes.text, isStrongSignal: gRes.strong, pipBuffer: buf,
      };
    }

    // ── FIBONACCI ──
    if (preset === 'FIBONACCI') {
      const sH = parseFloat(fibHigh) || high;
      const sL = parseFloat(fibLow) || low;
      if (isNaN(sH) || isNaN(sL) || sH <= sL) return null;

      const diff = sH - sL;
      const midpoint = (sH + sL) / 2;

      let isBuy: boolean;
      let directionReason = '';

      if (fibDirection === 'bullish') {
        isBuy = true;
        directionReason = "Qo'lda tanlangan: Bullish (BUY Setup)";
      } else if (fibDirection === 'bearish') {
        isBuy = false;
        directionReason = "Qo'lda tanlangan: Bearish (SELL Setup)";
      } else {
        if (current > 0) {
          isBuy = current < midpoint;
          directionReason = isBuy
            ? `Avtomatik: Narx (${fmt(current)}) 50% muvozanatdan (${fmt(midpoint)}) pastda (Discount) → BUY`
            : `Avtomatik: Narx (${fmt(current)}) 50% muvozanatdan (${fmt(midpoint)}) yuqorida (Premium) → SELL`;
        } else if (candleAnalysis) {
          isBuy = candleAnalysis.isBullish;
          directionReason = isBuy ? "Avtomatik: Shamol Bullish → BUY" : "Avtomatik: Shamol Bearish → SELL";
        } else {
          isBuy = true;
          directionReason = "Avtomatik: Standart BUY";
        }
      }

      const f0 = isBuy ? sH : sL;
      const f236 = isBuy ? sH - diff * 0.236 : sL + diff * 0.236;
      const f382 = isBuy ? sH - diff * 0.382 : sL + diff * 0.382;
      const f500 = isBuy ? sH - diff * 0.500 : sL + diff * 0.500;
      const f618 = isBuy ? sH - diff * 0.618 : sL + diff * 0.618;
      const f705 = isBuy ? sH - diff * 0.705 : sL + diff * 0.705;
      const f786 = isBuy ? sH - diff * 0.786 : sL + diff * 0.786;
      const f886 = isBuy ? sH - diff * 0.886 : sL + diff * 0.886;
      const f100 = isBuy ? sL : sH;

      const entryRatio = parseFloat(fibEntryLevel);
      const entry = isBuy ? sH - diff * entryRatio : sL + diff * entryRatio;
      const sl = isBuy ? sL - buf : sH + buf;

      const tp1 = isBuy ? sH : sL;
      const tp2 = isBuy ? sH + diff * 0.272 : sL - diff * 0.272;
      const tp3 = isBuy ? sH + diff * 0.618 : sL - diff * 0.618;

      const ref = current || entry;
      const gRes = checkGann(isBuy, Math.min(sl, entry) - buf, Math.max(sl, entry) + buf, 'FIB ');

      return {
        preset: 'FIBONACCI' as const, isBuy,
        directionReason, fibDirection,
        swingHigh: fmt(sH), swingLow: fmt(sL), diff: fmt(diff),
        f0: fmt(f0), f236: fmt(f236), f382: fmt(f382), f500: fmt(f500),
        f618: fmt(f618), f705: fmt(f705), f786: fmt(f786), f886: fmt(f886), f100: fmt(f100),
        entryLevel: fibEntryLevel,
        entry: fmt(entry), entryPct: pct(entry, ref),
        stopLoss: fmt(sl), slPct: pct(sl, ref),
        tp1: fmt(tp1), tp1Pct: pct(tp1, ref), rr1: calcRR(entry, sl, tp1),
        tp2: fmt(tp2), tp2Pct: pct(tp2, ref), rr2: calcRR(entry, sl, tp2),
        tp3: fmt(tp3), tp3Pct: pct(tp3, ref), rr3: calcRR(entry, sl, tp3),
        rangeVal: fmt(diff), gann: gFmt,
        gannConfluence: gRes.text, isStrongSignal: gRes.strong, pipBuffer: buf,
      };
    }

    // ── Elif trading / AB TRADE / 2.6 ──
    if (rangeVal <= 0) return null;
    const config = presetConfigs[preset];

    let isBuy: boolean;
    if (preset === '2.6 STRATEGY') {
      const hh = parseFloat(hhPrice);
      const ll = parseFloat(llPrice);
      const scaleTolerance = Math.max(rangeVal * 20, 100);
      const hhllValid = !isNaN(hh) && !isNaN(ll)
        && Math.abs(hh - current) < scaleTolerance
        && Math.abs(ll - current) < scaleTolerance;

      if (hhllValid) {
        isBuy = Math.abs(current - ll) < Math.abs(current - hh);
      } else {
        isBuy = current < (high + low) / 2;
      }
    } else {
      isBuy = current < (high + low) / 2;
    }

    const reversal = isBuy ? low - rangeVal * config.rRev : high + rangeVal * config.rRev;
    const correction = isBuy ? low + rangeVal * config.rCor : high - rangeVal * config.rCor;
    const consolidation = isBuy ? correction + con : correction - con;

    let sl: number;
    let entry: number;
    if (preset === '2.6 STRATEGY') {
      entry = reversal;
      sl = isBuy ? reversal - buf : reversal + buf;
    } else {
      entry = isBuy ? Math.max(correction, consolidation) : Math.min(correction, consolidation);
      sl = isBuy ? Math.min(correction, consolidation) - buf : Math.max(correction, consolidation) + buf;
    }

    const tp1 = isBuy ? current + rangeVal * 0.5 : current - rangeVal * 0.5;
    const tp2 = isBuy ? current + rangeVal : current - rangeVal;
    const tp3 = isBuy ? current + rangeVal * 1.5 : current - rangeVal * 1.5;

    let gannCenter: number, gannTol: number;
    if (preset === '2.6 STRATEGY') { gannCenter = reversal; gannTol = buf + 2; }
    else { gannCenter = (correction + consolidation) / 2; gannTol = buf; }

    const gRes = checkGann(isBuy, gannCenter - gannTol, gannCenter + gannTol);

    let liquidityInfo = '';
    if (preset === '2.6 STRATEGY') {
      const hh = parseFloat(hhPrice); const ll = parseFloat(llPrice);
      if (!isNaN(hh) && !isNaN(ll)) {
        const offset = rangeVal / 2.6;
        liquidityInfo = isBuy
          ? `LL: ${fmt(ll)} | Offset: ${offset.toFixed(3)} | Maqsad: ${fmt(ll + offset)}`
          : `HH: ${fmt(hh)} | Offset: ${offset.toFixed(3)} | Maqsad: ${fmt(hh - offset)}`;
      }
    }

    return {
      preset: preset as 'Elif trading' | 'AB TRADE' | '2.6 STRATEGY', isBuy,
      reversal: fmt(reversal), reversalPct: pct(reversal, current),
      correction: fmt(correction), correctionPct: pct(correction, current),
      consolidation: fmt(consolidation), consolidationPct: pct(consolidation, current),
      rangeVal: fmt(rangeVal),
      entry: fmt(entry),
      tp1: fmt(tp1), tp1Pct: pct(tp1, current), rr1: calcRR(entry, sl, tp1),
      tp2: fmt(tp2), tp2Pct: pct(tp2, current), rr2: calcRR(entry, sl, tp2),
      tp3: fmt(tp3), tp3Pct: pct(tp3, current), rr3: calcRR(entry, sl, tp3),
      stopLoss: fmt(sl), slPct: pct(sl, current),
      gann: gFmt,
      gannConfluence: gRes.text, isStrongSignal: gRes.strong,
      liquidityInfo, pipBuffer: buf,
    };
  }, [effectiveHigh, effectiveLow, effectiveCurrent, preset, timeframe, hhPrice, llPrice, obHigh, obLow, obType, fvgHigh, fvgLow, fvgType, snrEntry, snrSL, snrType, candleType, smtEntry, smtSL, smtType, fibHigh, fibLow, fibDirection, fibEntryLevel, selectedAsset]);

  const isBuy = calculations?.isBuy ?? false;
  const rangeVal = parseFloat(effectiveHigh) - parseFloat(effectiveLow);
  const tf = timeframeConfig[timeframe];
  const rangeOk = rangeVal > 0 && rangeVal <= tf.maxRange;
  const rangeWarning = rangeVal > tf.maxRange;
  const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

  const TypeToggle = ({ value, onChange, isBuyLabel = 'Bullish', isSellLabel = 'Bearish' }:
    { value: OBType; onChange: (v: OBType) => void; isBuyLabel?: string; isSellLabel?: string }) => (
    <div className="grid grid-cols-2 gap-2 mt-3">
      <button onClick={() => onChange('bullish')}
        className={`py-2 rounded-lg text-sm font-bold transition-all ${value === 'bullish' ? 'bg-green-600 text-white' : 'bg-slate-700/80 text-slate-400 hover:bg-slate-600'}`}>
        ▲ {isBuyLabel}
      </button>
      <button onClick={() => onChange('bearish')}
        className={`py-2 rounded-lg text-sm font-bold transition-all ${value === 'bearish' ? 'bg-red-600 text-white' : 'bg-slate-700/80 text-slate-400 hover:bg-slate-600'}`}>
        ▼ {isSellLabel}
      </button>
    </div>
  );

  const aiContext = useMemo(() => {
    if (!calculations) return '';
    const lines: string[] = [
      `Instrument: ${selectedAsset.name} (${selectedAsset.symbol})`,
      `Strategiya: ${calculations.preset}`,
      `Yo'nalish: ${calculations.isBuy ? 'BUY (Sotib olish)' : 'SELL (Sotish)'}`,
      `Vaqt oralig'i: ${timeframe} (${tf.label})`,
      `Entry: ${calculations.entry}`,
      `Stop Loss: ${calculations.stopLoss}`,
      `TP1: ${calculations.tp1} (R:R ${calculations.rr1})`,
      `TP2: ${calculations.tp2} (R:R ${calculations.rr2})`,
      `TP3: ${calculations.tp3} (R:R ${calculations.rr3})`,
      `Signal: ${calculations.isStrongSignal ? 'KUCHLI' : 'ODDIY'}`,
      `Gann: ${calculations.gannConfluence}`,
    ];
    if (effectiveHigh && effectiveLow) {
      lines.push(`Range: HIGH=${effectiveHigh}, LOW=${effectiveLow}`);
    }
    return lines.join('\n');
  }, [calculations, timeframe, tf, effectiveHigh, effectiveLow, selectedAsset]);

  // Quick Action handlers for current strategy calculations
  const handleSaveCalculationToJournal = () => {
    if (!calculations) return;
    const ok = saveTradeToJournalStorage({
      asset: selectedAsset.symbol,
      strategy: calculations.preset,
      direction: calculations.isBuy ? 'BUY' : 'SELL',
      entry: calculations.entry,
      sl: calculations.stopLoss,
      tp1: calculations.tp1,
      tp2: calculations.tp2,
      tp3: calculations.tp3,
      notes: `${timeframe} timeframe, ${calculations.isStrongSignal ? 'Kuchli' : 'Oddiy'} signal`,
    });
    if (ok) showToast('✓ Savdo jurnali xotirasiga muvaffaqiyatli saqlandi!');
  };

  const handleOpenCalculationInTelegram = () => {
    if (!calculations) return;
    setTelegramModalData({
      asset: selectedAsset.symbol,
      strategy: calculations.preset,
      direction: calculations.isBuy ? 'BUY' : 'SELL',
      entry: calculations.entry,
      sl: calculations.stopLoss,
      tp1: calculations.tp1,
      tp2: calculations.tp2,
      tp3: calculations.tp3,
      rr1: calculations.rr1,
      rr2: calculations.rr2,
      rr3: calculations.rr3,
    });
    setIsTelegramModalOpen(true);
  };

  return (
    <div className="relative min-h-screen p-3 sm:p-5 md:p-8">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover -z-10 pointer-events-none"
        src="/back.MP4"
      />
      <div className="fixed inset-0 bg-slate-950/45 -z-10 pointer-events-none" />

      <div className="max-w-3xl mx-auto pb-12 relative z-10">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-2xl animate-bounce">
            {toastMessage}
          </div>
        )}

        {/* Telegram Share Modal */}
        <TelegramShareModal
          isOpen={isTelegramModalOpen}
          onClose={() => setIsTelegramModalOpen(false)}
          tradeData={telegramModalData}
        />

        {/* TOP NAVIGATION TABS */}
        <div className="bg-slate-900/90 border border-slate-700/90 rounded-2xl p-2 mb-4 backdrop-blur shadow-2xl">
          {/* User info bar */}
          <div className="flex items-center justify-between px-2 pb-2 mb-1 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${isAdmin ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                {currentUsername.charAt(0).toUpperCase()}
              </div>
              <span className="text-slate-400 text-xs">
                <span className="text-white font-bold">{currentUsername}</span>
                {isAdmin && <span className="ml-1.5 text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-bold border border-amber-500/30">👑 Admin</span>}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="text-slate-500 hover:text-red-400 text-xs transition-colors flex items-center gap-1"
            >
              <span>🚪</span><span>Chiqish</span>
            </button>
          </div>

          <div className="grid gap-1.5 text-xs font-bold" style={{ gridTemplateColumns: isAdmin ? 'repeat(7, 1fr)' : 'repeat(6, 1fr)' }}>
            {[
              { id: 'calc', icon: '🧮', label: 'Kalkulyator' },
              { id: 'chart', icon: '📊', label: 'Jonli Grafik' },
              { id: 'risk', icon: '🎯', label: 'Risk & Lot' },
              { id: 'killzones', icon: '⏰', label: 'Killzones' },
              { id: 'journal', icon: '📓', label: 'Jurnal' },
              { id: 'calendar', icon: '📰', label: 'Taqvim' },
              ...(isAdmin ? [{ id: 'admin', icon: '🛡️', label: 'Admin' }] : []),
            ].map((tab) => {
              const isActive = activeMainTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveMainTab(tab.id as any)}
                  className={`py-2.5 px-1 rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 text-center ${isActive
                    ? tab.id === 'admin'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/25 font-black scale-[1.02]'
                      : 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-lg shadow-orange-500/25 font-black scale-[1.02]'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white'
                    }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span className="truncate text-[10px]">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MULTI ASSET SELECTOR */}
        <MultiAssetSelector selectedAsset={selectedAsset} onSelectAsset={setSelectedAsset} />

        {/* ── TAB 1: KALKULYATOR & SIGNALLAR ── */}
        {activeMainTab === 'calc' && (
          <>
            {/* AI TAHLIL PANELI */}
            <AIAnalysisPanel
              calcContext={aiContext}
              asset={selectedAsset}
              timeframe={timeframe}
              isAdmin={isAdmin}
              currentUsername={currentUsername}
              onOpenTelegram={(data) => {
                setTelegramModalData(data);
                setIsTelegramModalOpen(true);
              }}
            />

            {/* TIMEFRAME */}
            <div className="bg-slate-900/85 border border-slate-700 rounded-2xl p-4 mb-4 backdrop-blur">
              <div className="text-slate-400 text-xs font-bold tracking-widest mb-3">VAQT ORALIG&apos;I</div>
              <div className="grid grid-cols-6 gap-2">
                {TIMEFRAMES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    className={`py-2 rounded-xl font-bold text-sm transition-all ${timeframe === t
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105'
                      : 'bg-slate-700/80 text-slate-400 hover:bg-slate-600/80'
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className={`mt-3 text-xs font-bold text-center ${tf.color}`}>
                {tf.label} &nbsp;|&nbsp; Max Range: {tf.maxRange} pip &nbsp;|&nbsp; SL Buffer: {tf.pipBuffer} pip
              </div>
            </div>

            {/* BUY / SELL */}
            {calculations && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div
                  className={`p-4 rounded-2xl border-2 text-center font-bold text-2xl flex items-center justify-center transition-all duration-300 ${isBuy
                    ? 'bg-green-500/20 border-green-400 text-green-300 shadow-lg shadow-green-500/30 scale-105'
                    : 'bg-black/50 border-slate-800 text-slate-700 opacity-40'
                    }`}
                >
                  <span className="text-3xl mr-2">&#9650;</span>BUY
                </div>
                <div
                  className={`p-4 rounded-2xl border-2 text-center font-bold text-2xl flex items-center justify-center transition-all duration-300 ${!isBuy
                    ? 'bg-red-500/20 border-red-400 text-red-300 shadow-lg shadow-red-500/30 scale-105'
                    : 'bg-black/50 border-slate-800 text-slate-700 opacity-40'
                    }`}
                >
                  <span className="text-3xl mr-2">&#9660;</span>SELL
                </div>
              </div>
            )}

            {/* INPUT MODE TOGGLE */}
            <div className="bg-slate-900/85 border border-slate-700 rounded-2xl p-3 mb-4 backdrop-blur">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setInputMode('manual')}
                  className={`py-2.5 rounded-xl font-bold text-sm transition-all ${inputMode === 'manual'
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-slate-700/80 text-slate-400 hover:bg-slate-600'
                    }`}
                >
                  ✏️ Qo&apos;lda kiritish
                </button>
                <button
                  onClick={() => setInputMode('candle')}
                  className={`py-2.5 rounded-xl font-bold text-sm transition-all ${inputMode === 'candle'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-slate-700/80 text-slate-400 hover:bg-slate-600'
                    }`}
                >
                  🕯️ Shamoldan (OHLC)
                </button>
              </div>
            </div>

            {/* OHLC CANDLE INPUT */}
            {inputMode === 'candle' && (
              <div className="bg-slate-900/85 border border-emerald-700/50 rounded-2xl p-5 mb-4 backdrop-blur">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🕯️</span>
                  <div>
                    <div className="text-emerald-400 text-xs font-bold tracking-widest">
                      TRADINGVIEW SHAMOL (CANDLE) — {selectedAsset.symbol}
                    </div>
                    <div className="text-slate-500 text-xs mt-0.5">Grafigingizdan shamolning O, H, L, C ni kiriting</div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div>
                    <label className="text-slate-400 text-xs font-bold mb-1 block">OPEN</label>
                    <input
                      type="number"
                      value={candleOpen}
                      onChange={(e) => setCandleOpen(e.target.value)}
                      className="w-full px-3 py-3 bg-slate-700/80 border border-emerald-700/50 rounded-xl text-white text-lg font-bold focus:border-emerald-400 focus:outline-none"
                      step={selectedAsset.pipSize}
                      placeholder="O"
                    />
                  </div>
                  <div>
                    <label className="text-red-400 text-xs font-bold mb-1 block">HIGH ↑</label>
                    <input
                      type="number"
                      value={candleHigh}
                      onChange={(e) => setCandleHigh(e.target.value)}
                      className="w-full px-3 py-3 bg-slate-700/80 border border-red-700/50 rounded-xl text-white text-lg font-bold focus:border-red-400 focus:outline-none"
                      step={selectedAsset.pipSize}
                      placeholder="H"
                    />
                  </div>
                  <div>
                    <label className="text-green-400 text-xs font-bold mb-1 block">LOW ↓</label>
                    <input
                      type="number"
                      value={candleLow}
                      onChange={(e) => setCandleLow(e.target.value)}
                      className="w-full px-3 py-3 bg-slate-700/80 border border-green-700/50 rounded-xl text-white text-lg font-bold focus:border-green-400 focus:outline-none"
                      step={selectedAsset.pipSize}
                      placeholder="L"
                    />
                  </div>
                  <div>
                    <label className="text-blue-400 text-xs font-bold mb-1 block">CLOSE</label>
                    <input
                      type="number"
                      value={candleClose}
                      onChange={(e) => setCandleClose(e.target.value)}
                      className="w-full px-3 py-3 bg-slate-700/80 border border-blue-700/50 rounded-xl text-white text-lg font-bold focus:border-blue-400 focus:outline-none"
                      step={selectedAsset.pipSize}
                      placeholder="C"
                    />
                  </div>
                </div>

                {candleAnalysis && (
                  <div
                    className={`rounded-xl p-4 border ${candleAnalysis.isDoji
                      ? 'bg-yellow-900/20 border-yellow-600/40'
                      : candleAnalysis.isBullish
                        ? 'bg-green-900/20 border-green-600/40'
                        : 'bg-red-900/20 border-red-600/40'
                      }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">
                        {candleAnalysis.isDoji ? '⚡' : candleAnalysis.isBullish ? '🟢' : '🔴'}
                      </span>
                      <span
                        className={`font-bold text-lg ${candleAnalysis.isDoji
                          ? 'text-yellow-400'
                          : candleAnalysis.isBullish
                            ? 'text-green-400'
                            : 'text-red-400'
                          }`}
                      >
                        {candleAnalysis.type} Shamol
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center text-xs">
                      <div className="bg-slate-800/60 rounded-lg p-2">
                        <div className="text-slate-400 mb-1">Yuqori Soya ↑</div>
                        <div className="text-red-300 font-bold">{candleAnalysis.upperWick}</div>
                      </div>
                      <div
                        className={`rounded-lg p-2 ${candleAnalysis.isBullish ? 'bg-green-900/40' : 'bg-red-900/40'
                          }`}
                      >
                        <div className="text-slate-400 mb-1">Tana ({candleAnalysis.bodyPct}%)</div>
                        <div className={`font-bold ${candleAnalysis.isBullish ? 'text-green-300' : 'text-red-300'}`}>
                          {candleAnalysis.bodySize}
                        </div>
                      </div>
                      <div className="bg-slate-800/60 rounded-lg p-2">
                        <div className="text-slate-400 mb-1">Pastki Soya ↓</div>
                        <div className="text-green-300 font-bold">{candleAnalysis.lowerWick}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MANUAL DIAPAZON */}
            <div className="bg-slate-900/85 border border-slate-700 rounded-2xl p-6 mb-6 backdrop-blur">
              <h3 className="text-slate-400 text-xs font-bold tracking-widest mb-4">
                {selectedAsset.symbol} — {tf.label.toUpperCase()} DIAPAZONI
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-slate-400 text-xs font-bold tracking-widest mb-2 block">HIGH (Liquidity)</label>
                  <input
                    type="number"
                    value={dailyHigh}
                    onChange={(e) => setDailyHigh(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600 rounded-xl text-white text-2xl font-bold focus:border-orange-500 focus:outline-none"
                    step={selectedAsset.pipSize}
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-bold tracking-widest mb-2 block">LOW (Liquidity)</label>
                  <input
                    type="number"
                    value={dailyLow}
                    onChange={(e) => setDailyLow(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600 rounded-xl text-white text-2xl font-bold focus:border-orange-500 focus:outline-none"
                    step={selectedAsset.pipSize}
                  />
                </div>
              </div>

              {rangeVal > 0 && (
                <div
                  className={`rounded-xl px-4 py-3 flex justify-between items-center text-sm mb-4 ${rangeWarning
                    ? 'bg-red-900/40 border border-red-600/50'
                    : rangeOk
                      ? 'bg-green-900/20 border border-green-600/30'
                      : 'bg-slate-700/80'
                    }`}
                >
                  <span
                    className={`font-bold ${rangeWarning ? 'text-red-400' : rangeOk ? 'text-green-400' : 'text-slate-400'
                      }`}
                  >
                    Range: {rangeVal.toFixed(selectedAsset.digits)} pip
                  </span>
                  <span
                    className={`font-bold text-xs ${rangeWarning ? 'text-red-400' : rangeOk ? 'text-green-400' : 'text-slate-400'
                      }`}
                  >
                    {rangeWarning ? `⚠ Katta! Max: ${tf.maxRange}` : `✓ ${timeframe} uchun mos`}
                  </span>
                </div>
              )}

              <div className="mb-4">
                <label className="text-slate-400 text-xs font-bold tracking-widest mb-2 block">HOZIRGI NARX</label>
                <input
                  type="number"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600 rounded-xl text-white text-2xl font-bold focus:border-orange-500 focus:outline-none"
                  step={selectedAsset.pipSize}
                />
              </div>

              <div>
                <label className="text-slate-400 text-xs font-bold tracking-widest mb-2 block">STRATEGIYA</label>
                <select
                  value={preset}
                  onChange={(e) => setPreset(e.target.value as Preset)}
                  className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600 rounded-xl text-white font-bold focus:border-orange-500 focus:outline-none"
                >
                  <option value="Elif trading">Elif trading</option>
                  <option value="AB TRADE">AB TRADE</option>
                  <option value="2.6 STRATEGY">2.6 STRATEGY</option>
                  <option value="ORDER BLOCK">ORDER BLOCK</option>
                  <option value="IFVG">IFVG (Inverse FVG)</option>
                  <option value="SNR_ICT">SNR + ICT + Yolg&apos;iz Sham</option>
                  <option value="SMT">SMT (Smart Money Technique)</option>
                  <option value="FIBONACCI">FIBONACCI (Retracement & OTE)</option>
                </select>
              </div>

              {/* 2.6 HH/LL */}
              {preset === '2.6 STRATEGY' && (
                <div className="mt-4 p-4 bg-amber-900/30 border border-amber-600/40 rounded-xl">
                  <p className="text-amber-400 text-xs font-bold tracking-widest mb-3">HH / LL</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 text-xs font-bold mb-1 block">HH (Higher High)</label>
                      <input
                        type="number"
                        value={hhPrice}
                        onChange={(e) => setHhPrice(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700/80 border border-amber-600/50 rounded-lg text-white text-lg font-bold focus:border-amber-400 focus:outline-none"
                        step={selectedAsset.pipSize}
                        placeholder="HH"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-xs font-bold mb-1 block">LL (Lower Low)</label>
                      <input
                        type="number"
                        value={llPrice}
                        onChange={(e) => setLlPrice(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700/80 border border-amber-600/50 rounded-lg text-white text-lg font-bold focus:border-amber-400 focus:outline-none"
                        step={selectedAsset.pipSize}
                        placeholder="LL"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ORDER BLOCK */}
              {preset === 'ORDER BLOCK' && (
                <div className="mt-4 p-4 bg-blue-900/30 border border-blue-600/40 rounded-xl">
                  <p className="text-blue-400 text-xs font-bold tracking-widest mb-1">ORDER BLOCK ZONE</p>
                  <TypeToggle value={obType} onChange={setObType} isBuyLabel="Bullish OB" isSellLabel="Bearish OB" />
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="text-slate-400 text-xs font-bold mb-1 block">OB HIGH</label>
                      <input
                        type="number"
                        value={obHigh}
                        onChange={(e) => setObHigh(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700/80 border border-blue-600/50 rounded-lg text-white text-lg font-bold focus:border-blue-400 focus:outline-none"
                        step={selectedAsset.pipSize}
                        placeholder="Yuqori"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-xs font-bold mb-1 block">OB LOW</label>
                      <input
                        type="number"
                        value={obLow}
                        onChange={(e) => setObLow(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700/80 border border-blue-600/50 rounded-lg text-white text-lg font-bold focus:border-blue-400 focus:outline-none"
                        step={selectedAsset.pipSize}
                        placeholder="Pastki"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* IFVG */}
              {preset === 'IFVG' && (
                <div className="mt-4 p-4 bg-purple-900/30 border border-purple-600/40 rounded-xl">
                  <p className="text-purple-400 text-xs font-bold tracking-widest mb-1">IFVG ZONE</p>
                  <TypeToggle value={fvgType} onChange={setFvgType} isBuyLabel="Bullish IFVG" isSellLabel="Bearish IFVG" />
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="text-slate-400 text-xs font-bold mb-1 block">FVG HIGH</label>
                      <input
                        type="number"
                        value={fvgHigh}
                        onChange={(e) => setFvgHigh(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700/80 border border-purple-600/50 rounded-lg text-white text-lg font-bold focus:border-purple-400 focus:outline-none"
                        step={selectedAsset.pipSize}
                        placeholder="Yuqori"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-xs font-bold mb-1 block">FVG LOW</label>
                      <input
                        type="number"
                        value={fvgLow}
                        onChange={(e) => setFvgLow(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700/80 border border-purple-600/50 rounded-lg text-white text-lg font-bold focus:border-purple-400 focus:outline-none"
                        step={selectedAsset.pipSize}
                        placeholder="Pastki"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SNR + ICT */}
              {preset === 'SNR_ICT' && (
                <div className="mt-4 p-4 bg-teal-900/30 border border-teal-600/40 rounded-xl space-y-3">
                  <TypeToggle value={snrType} onChange={setSnrType} isBuyLabel="BUY Setup" isSellLabel="SELL Setup" />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-cyan-400 text-xs font-bold mb-1 block">ENTRY NARX</label>
                      <input
                        type="number"
                        value={snrEntry}
                        onChange={(e) => setSnrEntry(e.target.value)}
                        className="w-full px-3 py-3 bg-slate-700/80 border border-cyan-600/50 rounded-lg text-white text-xl font-bold focus:border-cyan-400 focus:outline-none"
                        step={selectedAsset.pipSize}
                        placeholder="Entry"
                      />
                    </div>
                    <div>
                      <label className="text-red-400 text-xs font-bold mb-1 block">STOP LOSS NARX</label>
                      <input
                        type="number"
                        value={snrSL}
                        onChange={(e) => setSnrSL(e.target.value)}
                        className="w-full px-3 py-3 bg-slate-700/80 border border-red-700/50 rounded-lg text-white text-xl font-bold focus:border-red-400 focus:outline-none"
                        step={selectedAsset.pipSize}
                        placeholder="SL"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs font-bold mb-1 block">YOLG&apos;IZ SHAM TURI</label>
                    <select
                      value={candleType}
                      onChange={(e) => setCandleType(e.target.value as CandleType)}
                      className="w-full px-3 py-2 bg-slate-700/80 border border-teal-600/50 rounded-lg text-white font-bold focus:border-teal-400 focus:outline-none"
                    >
                      <option value="bullish_engulfing">🟢 Bullish Engulfing</option>
                      <option value="hammer">🔨 Hammer</option>
                      <option value="bullish_pinbar">📌 Bullish Pin Bar</option>
                      <option value="bearish_engulfing">🔴 Bearish Engulfing</option>
                      <option value="shooting_star">⭐ Shooting Star</option>
                      <option value="bearish_pinbar">📌 Bearish Pin Bar</option>
                    </select>
                  </div>
                </div>
              )}

              {/* SMT */}
              {preset === 'SMT' && (
                <div className="mt-4 p-4 bg-rose-900/30 border border-rose-600/40 rounded-xl space-y-3">
                  <TypeToggle value={smtType} onChange={setSmtType} isBuyLabel="Bullish SMT" isSellLabel="Bearish SMT" />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-cyan-400 text-xs font-bold mb-1 block">ENTRY NARX</label>
                      <input
                        type="number"
                        value={smtEntry}
                        onChange={(e) => setSmtEntry(e.target.value)}
                        className="w-full px-3 py-3 bg-slate-700/80 border border-cyan-600/50 rounded-lg text-white text-xl font-bold focus:border-cyan-400 focus:outline-none"
                        step={selectedAsset.pipSize}
                        placeholder="Entry"
                      />
                    </div>
                    <div>
                      <label className="text-red-400 text-xs font-bold mb-1 block">STOP LOSS NARX</label>
                      <input
                        type="number"
                        value={smtSL}
                        onChange={(e) => setSmtSL(e.target.value)}
                        className="w-full px-3 py-3 bg-slate-700/80 border border-red-700/50 rounded-lg text-white text-xl font-bold focus:border-red-400 focus:outline-none"
                        step={selectedAsset.pipSize}
                        placeholder="SL"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* FIBONACCI */}
              {preset === 'FIBONACCI' && (
                <div className="mt-4 p-4 bg-amber-950/40 border border-amber-500/40 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📐</span>
                      <p className="text-amber-400 text-xs font-bold tracking-widest">FIBONACCI RETRACEMENT & OTE</p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${isBuy ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-red-500/20 border-red-500/40 text-red-400'}`}>
                      {isBuy ? '▲ BUY' : '▼ SELL'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => setFibDirection('auto')}
                      className={`py-2 px-2 rounded-lg text-xs font-bold transition-all ${fibDirection === 'auto' ? 'bg-amber-500 text-slate-950' : 'bg-slate-700/80 text-slate-400'}`}>
                      ⚡ Avto ({isBuy ? 'BUY' : 'SELL'})
                    </button>
                    <button type="button" onClick={() => setFibDirection('bullish')}
                      className={`py-2 px-2 rounded-lg text-xs font-bold transition-all ${fibDirection === 'bullish' ? 'bg-green-600 text-white' : 'bg-slate-700/80 text-slate-400'}`}>
                      ▲ BUY Setup
                    </button>
                    <button type="button" onClick={() => setFibDirection('bearish')}
                      className={`py-2 px-2 rounded-lg text-xs font-bold transition-all ${fibDirection === 'bearish' ? 'bg-red-600 text-white' : 'bg-slate-700/80 text-slate-400'}`}>
                      ▼ SELL Setup
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-amber-300 text-xs font-bold mb-1 block">SWING HIGH</label>
                      <input type="number" value={fibHigh} onChange={e => setFibHigh(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700/80 border border-amber-600/50 rounded-lg text-white text-lg font-bold focus:border-amber-400 focus:outline-none" step={selectedAsset.pipSize} placeholder={effectiveHigh || "High narx"} />
                    </div>
                    <div>
                      <label className="text-amber-300 text-xs font-bold mb-1 block">SWING LOW</label>
                      <input type="number" value={fibLow} onChange={e => setFibLow(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700/80 border border-amber-600/50 rounded-lg text-white text-lg font-bold focus:border-amber-400 focus:outline-none" step={selectedAsset.pipSize} placeholder={effectiveLow || "Low narx"} />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: '0.5', label: '50.0%', desc: 'Equilibrium' },
                      { key: '0.618', label: '61.8%', desc: 'Golden Ratio' },
                      { key: '0.705', label: '70.5%', desc: 'ICT OTE' },
                      { key: '0.786', label: '78.6%', desc: 'Deep' },
                    ].map(item => (
                      <button key={item.key} type="button" onClick={() => setFibEntryLevel(item.key as any)}
                        className={`py-2 px-1 rounded-lg text-center transition-all ${fibEntryLevel === item.key ? 'bg-amber-500 text-slate-950 font-black shadow-lg' : 'bg-slate-800 text-slate-400'}`}>
                        <div className="text-xs font-bold">{item.label}</div>
                        <div className="text-[10px] opacity-75">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ─────── NATIJALAR & QUICK ACTIONS ─────── */}
            {calculations && (
              <div className="space-y-4">
                {/* QUICK ACTIONS BAR */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-amber-500/40 rounded-2xl p-3 backdrop-blur shadow-xl flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    <span className="text-xs font-bold text-slate-300">Tezkor amallar:</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isAdmin && (
                      <button
                        onClick={async () => {
                          if (!calculations) return;
                          const res = await sendDirectTelegramMessage({
                            asset: selectedAsset.symbol,
                            strategy: calculations.preset,
                            direction: calculations.isBuy ? 'BUY' : 'SELL',
                            entry: calculations.entry,
                            sl: calculations.stopLoss,
                            tp1: calculations.tp1,
                            tp2: calculations.tp2,
                            tp3: calculations.tp3,
                            rr1: calculations.rr1,
                            rr2: calculations.rr2,
                            rr3: calculations.rr3,
                          });
                          if (res.ok) {
                            showToast(`✓ Barcha (${res.sentCount || 1} ta) bot foydalanuvchilariga yuborildi!`);
                          } else {
                            showToast('❌ Telegramga yuborishda xatolik');
                          }
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <span>📢</span>
                        <span>Barchaga yuborish</span>
                      </button>
                    )}
                    <button
                      onClick={() => setActiveMainTab('risk')}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <span>🎯</span>
                      <span>Lotni hisoblash</span>
                    </button>
                    <button
                      onClick={handleSaveCalculationToJournal}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <span>📓</span>
                      <span>Jurnalga saqlash</span>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={handleOpenCalculationInTelegram}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-sky-500/40 text-sky-300 font-bold text-xs rounded-xl shadow transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <span>📱</span>
                        <span>Sozlama</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Main Results Container */}
                <div className="bg-slate-900/85 border border-slate-700/80 rounded-2xl p-5 backdrop-blur shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                    <div>
                      <div className="text-slate-400 text-xs font-bold tracking-widest">{calculations.preset}</div>
                      <div className="text-xl font-bold text-white mt-0.5">{selectedAsset.name} ({timeframe})</div>
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-base font-black border ${isBuy ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-red-500/20 text-red-400 border-red-500/50'}`}>
                      {isBuy ? '▲ BUY SETUP' : '▼ SELL SETUP'}
                    </div>
                  </div>

                  {/* Entry & SL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-800/80 border-2 border-cyan-500/50 rounded-xl p-4">
                      <div className="text-cyan-400 text-xs font-bold tracking-wider mb-1">ENTRY (KIRISH)</div>
                      <div className="text-3xl font-black text-cyan-300 font-mono">{calculations.entry}</div>
                    </div>

                    <div className="bg-slate-800/80 border-2 border-red-500/50 rounded-xl p-4">
                      <div className="text-red-400 text-xs font-bold tracking-wider mb-1">STOP LOSS (TO&apos;XTATISH)</div>
                      <div className="flex items-baseline gap-2">
                        <div className="text-3xl font-black text-red-400 font-mono">{calculations.stopLoss}</div>
                        <div className="text-xs text-slate-400 font-bold">({calculations.slPct}%)</div>
                      </div>
                    </div>
                  </div>

                  {/* Targets TP1, TP2, TP3 */}
                  <div>
                    <div className="text-slate-400 text-xs font-bold tracking-widest mb-2">MAQSAD NARXLAR (TAKE PROFIT)</div>
                    <div className="grid grid-cols-3 gap-2 text-center font-mono">
                      {[
                        { label: 'TP1', val: calculations.tp1, pct: calculations.tp1Pct, rr: calculations.rr1 },
                        { label: 'TP2', val: calculations.tp2, pct: calculations.tp2Pct, rr: calculations.rr2 },
                        { label: 'TP3', val: calculations.tp3, pct: calculations.tp3Pct, rr: calculations.rr3 },
                      ].map(tp => (
                        <div key={tp.label} className="bg-green-950/30 border border-green-700/40 rounded-xl p-3">
                          <div className="text-green-400 font-bold text-xs mb-1">{tp.label}</div>
                          <div className="text-lg sm:text-xl font-bold text-white">{tp.val}</div>
                          <div className="text-xs font-bold text-yellow-400 mt-1">{tp.rr}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Gann Confluence Box */}
                  <div className={`p-4 rounded-xl border ${calculations.isStrongSignal ? 'bg-green-950/40 border-green-500/50' : 'bg-slate-800/60 border-slate-700'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{calculations.isStrongSignal ? '⚡' : '📌'}</span>
                      <span className="text-white font-bold text-xs">
                        {calculations.isStrongSignal ? 'KUCHLI GANN SINERGIYASI' : 'UMUMIY TAHLIL'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{calculations.gannConfluence}</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── TAB 2: TRADINGVIEW GRAFIK ── */}
        {activeMainTab === 'chart' && (
          <div>
            <TradingViewWidget asset={selectedAsset} timeframe={timeframe} />
          </div>
        )}

        {/* ── TAB 3: RISK & LOT SIZE KALKULYATORI ── */}
        {activeMainTab === 'risk' && (
          <div>
            <RiskCalculator
              entryPrice={calculations?.entry || ''}
              stopLossPrice={calculations?.stopLoss || ''}
              tp1Price={calculations?.tp1 || ''}
              tp2Price={calculations?.tp2 || ''}
              tp3Price={calculations?.tp3 || ''}
              isBuy={isBuy}
              asset={selectedAsset}
            />
          </div>
        )}

        {/* ── TAB 4: ICT KILLZONES ── */}
        {activeMainTab === 'killzones' && (
          <div>
            <KillzonesWidget />
          </div>
        )}

        {/* ── TAB 5: TREYDING JURNALI ── */}
        {activeMainTab === 'journal' && (
          <div>
            <TradingJournal />
          </div>
        )}

        {/* ── TAB 6: IQTISODIY TAQVIM ── */}
        {activeMainTab === 'calendar' && (
          <div>
            <EconomicCalendar />
          </div>
        )}

        {/* ── TAB 7: ADMIN PANEL (faqat admin) ── */}
        {activeMainTab === 'admin' && isAdmin && (
          <div>
            <div className="bg-gradient-to-r from-amber-950/60 to-orange-950/40 border border-amber-500/40 rounded-2xl p-4 mb-4 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xl shadow-lg">
                  🛡️
                </div>
                <div>
                  <div className="text-amber-300 font-black text-base">Admin Panel</div>
                  <div className="text-slate-400 text-xs">Foydalanuvchilar boshqaruvi va statistika</div>
                </div>
              </div>
            </div>
            <AdminPanel />
          </div>
        )}
      </div>
    </div>
  );
}

export default function XAUCalculator() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [checked, setChecked] = useState(false);

  // Active time tracker
  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => {
      addActiveMinutes(session.username, 1);
    }, 60000); // har daqiqada
    return () => clearInterval(id);
  }, [session]);

  // Restore session on mount
  useEffect(() => {
    const saved = loadSession();
    if (saved) setSession(saved);
    setChecked(true);
  }, []);

  const handleLogout = () => {
    clearSession();
    setSession(null);
  };

  if (!checked) return null; // hydration wait

  if (!session) {
    return <LoginScreen onAuthenticate={(s) => setSession(s)} />;
  }

  return (
    <CalculatorContent
      isAdmin={session.role === 'admin'}
      currentUsername={session.username}
      onLogout={handleLogout}
    />
  );
}
