'use client';

import { useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import MultiAssetSelector, { ASSET_LIST, AssetConfig } from '../../components/MultiAssetSelector';
import TelegramShareModal from '../../components/TelegramShareModal';

const TradingViewChart = dynamic(() => import('../../components/TradingViewChart'), { ssr: false });

interface ImageItem {
  file: File;
  preview: string;
}

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
}: {
  text: string;
  accentColor?: 'amber' | 'violet';
  asset: AssetConfig;
  onOpenTelegram?: (data: any) => void;
}) {
  const parsed = parseSignal(text);
  const [copied, setCopied] = useState(false);

  const copyText = () => {
    const t =
      `⚡ PROFESSIONAL SIGNAL • ${asset.name} (${asset.symbol})\n` +
      `● Kirish (Entry): ${parsed.entry || '—'} USD\n` +
      `● Stop Loss: ${parsed.sl || '—'}\n` +
      `● TP1: ${parsed.tp1 || '—'}\n` +
      `● TP2: ${parsed.tp2 || '—'}\n` +
      `● TP3: ${parsed.tp3 || '—'}\n` +
      `\n🔗 https://t.me/+U5pPkneGmM1mMjYy`;

    navigator.clipboard.writeText(t);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!parsed.entry && !parsed.sl && !parsed.tp1) return null;

  return (
    <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-amber-500/40 shadow-xl space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <div>
            <div className="text-white text-xs font-black">ANIQLANGAN SIGNAL NARSALARI</div>
            <div className="text-slate-400 text-[10px]">AI model tomonidan generatsiya qilindi</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyText}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
          >
            {copied ? '✓ Nusxalandi' : '📋 Nusxalash'}
          </button>
          {onOpenTelegram && (
            <button
              onClick={() => onOpenTelegram({ asset: asset.name, ...parsed })}
              className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-bold transition-all"
            >
              ✈️ Telegram
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
        <div className="bg-slate-800/80 p-2 rounded-lg text-center border border-slate-700">
          <div className="text-slate-400 text-[10px]">Kirish (Entry)</div>
          <div className="text-white font-bold">{parsed.entry || '—'}</div>
        </div>
        <div className="bg-red-500/10 p-2 rounded-lg text-center border border-red-500/30">
          <div className="text-red-400 text-[10px]">Stop Loss</div>
          <div className="text-red-300 font-bold">{parsed.sl || '—'}</div>
        </div>
        <div className="bg-emerald-500/10 p-2 rounded-lg text-center border border-emerald-500/30">
          <div className="text-emerald-400 text-[10px]">TP 1</div>
          <div className="text-emerald-300 font-bold">{parsed.tp1 || '—'}</div>
        </div>
        <div className="bg-emerald-500/10 p-2 rounded-lg text-center border border-emerald-500/30">
          <div className="text-emerald-400 text-[10px]">TP 2</div>
          <div className="text-emerald-300 font-bold">{parsed.tp2 || '—'}</div>
        </div>
        <div className="bg-emerald-500/10 p-2 rounded-lg text-center border border-emerald-500/30">
          <div className="text-emerald-400 text-[10px]">TP 3</div>
          <div className="text-emerald-300 font-bold">{parsed.tp3 || '—'}</div>
        </div>
      </div>
    </div>
  );
}

export default function AIAnalysisPage() {
  const [selectedAsset, setSelectedAsset] = useState<AssetConfig>(ASSET_LIST[0]);
  const [timeframe, setTimeframe] = useState<string>('1h');
  const [activeTab, setActiveTab] = useState<'live_chart' | 'market' | 'screenshot'>('live_chart');
  const [currentTermMode, setCurrentTermMode] = useState<'short' | 'long'>('short');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [screenshotPrompt, setScreenshotPrompt] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [telegramModalData, setTelegramModalData] = useState<any>(null);
  const [isTelegramOpen, setIsTelegramOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);

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

  // Market Analyze (both live_chart and market tab)
  const runMarketAnalysis = async (term: 'short' | 'long') => {
    setCurrentTermMode(term);
    setIsLoading(true);
    setResponse('');
    setErrorMsg(null);

    const form = new FormData();
    form.append('assetSymbol', selectedAsset.symbol || 'XAUUSD');
    form.append('assetName', selectedAsset.name || 'Gold');
    form.append('timeframe', term === 'short' ? '1m' : (timeframe || '1h'));
    form.append('termMode', term);
    form.append(
      'calcContext',
      `Instrument: ${selectedAsset.name} (${selectedAsset.symbol})\nVaqt oralig'i: ${term === 'short' ? '1m/5m' : timeframe}\n` +
      `Tahlil turi: ${term === 'short' ? 'Qisqa muddatli (1-15m Ultra-Scalp)' : 'Uzoq muddatli (Intraday: 1-4 soat)'}\n`
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
              setResponse(prev => prev + parsed.text);
              setTimeout(() => {
                responseRef.current?.scrollTo({ top: responseRef.current.scrollHeight, behavior: 'smooth' });
              }, 10);
            }
            if (parsed.error) { setErrorMsg(parsed.error); done = true; break; }
          } catch {}
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Ulanishda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  // Screenshot / Image Analysis
  const runScreenshotAnalysis = async (term: 'short' | 'long' = 'short') => {
    if (!screenshotPrompt.trim() && images.length === 0) return;
    setCurrentTermMode(term);
    setIsLoading(true);
    setResponse('');
    setErrorMsg(null);

    const form = new FormData();
    const promptText = screenshotPrompt.trim()
      ? screenshotPrompt
      : `Iltimos, ushbu ${selectedAsset.name} grafik skrinshotini ${term === 'short' ? 'Qisqa muddatli (1-15m Scalp)' : 'Uzoq muddatli (1-4h Intraday)'} SMC/ICT usulida tahlil qiling va aniq Entry, SL, TP darajalarini bering.`;

    form.append('message', promptText);
    form.append('context', `Instrument: ${selectedAsset.name} (${selectedAsset.symbol})\nTimeframe: ${term === 'short' ? '1m/5m' : timeframe}\nTahlil turi: ${term === 'short' ? 'Qisqa muddatli' : 'Uzoq muddatli'}`);
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
          } catch {}
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Ulanishda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">SUN'IY INTELLEKT TAHLIL PANELI</h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40 font-mono font-bold">
              Claude Opus 4.5
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Jonli grafik, avtomatlashgan bozor tahlili va grafik skrinshotlari tahlili
          </p>
        </div>
      </header>

      {/* Asset Switcher */}
      <MultiAssetSelector selectedAsset={selectedAsset} onSelectAsset={setSelectedAsset} />

      {/* Main Analysis Container */}
      <div className="bg-slate-900/90 border border-violet-700/50 rounded-2xl p-4 sm:p-6 backdrop-blur-xl shadow-2xl space-y-5">
        {/* 3 Main Tabs Switcher */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => { setActiveTab('live_chart'); setResponse(''); }}
            className={`py-3 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'live_chart'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-[1.01]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span className="text-base">📈</span>
            <span className="truncate">Jonli Grafik & AI</span>
          </button>
          <button
            onClick={() => { setActiveTab('market'); setResponse(''); }}
            className={`py-3 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'market'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.01]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span className="text-base">📊</span>
            <span className="truncate">Bozor Tahlili</span>
          </button>
          <button
            onClick={() => { setActiveTab('screenshot'); setResponse(''); }}
            className={`py-3 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'screenshot'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 scale-[1.01]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <span className="text-base">🖼️</span>
            <span className="truncate">Skrinshot Tahlil</span>
          </button>
        </div>

        {/* ── TAB 1: JONLI GRAFIK & AI ── */}
        {activeTab === 'live_chart' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-800/60 px-4 py-2.5 rounded-xl border border-slate-700/60 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">● Jonli Grafik:</span>
                <span className="text-white font-bold font-mono">{selectedAsset.name} ({selectedAsset.symbol})</span>
                <span className="text-orange-400 font-bold font-mono">• {timeframe}</span>
              </div>
              <span className="text-slate-400 text-[11px]">Real-Time TradingView + SMC Indikatorlar</span>
            </div>

            {/* TradingView Widget Component */}
            <div className="rounded-xl overflow-hidden border border-slate-700/80 shadow-2xl">
              <TradingViewChart
                asset={selectedAsset}
                timeframe={timeframe}
                hideHeader={false}
                height={520}
              />
            </div>

            {/* Qisqa va Uzoq muddatli tahlil tugmalari */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => runMarketAnalysis('short')}
                disabled={isLoading}
                className={`py-4 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xl ${
                  isLoading && currentTermMode === 'short'
                    ? 'bg-amber-950/60 text-amber-500 cursor-wait'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 shadow-amber-500/20 active:scale-95'
                }`}
              >
                {isLoading && currentTermMode === 'short' ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    1-15m Scalp tahlil qilinmoqda...
                  </>
                ) : (
                  <>⚡ Qisqa Muddatli (1-15m Scalp)</>
                )}
              </button>

              <button
                onClick={() => runMarketAnalysis('long')}
                disabled={isLoading}
                className={`py-4 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xl ${
                  isLoading && currentTermMode === 'long'
                    ? 'bg-indigo-950/60 text-indigo-400 cursor-wait'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-indigo-500/20 active:scale-95'
                }`}
              >
                {isLoading && currentTermMode === 'long' ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    1-4 soat Intraday tahlil qilinmoqda...
                  </>
                ) : (
                  <>📈 Uzoq Muddatli (1-4 Soat)</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 2: BOZOR TAHLILI ── */}
        {activeTab === 'market' && (
          <div className="space-y-4">
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60 text-xs text-slate-300">
              <span className="text-amber-400 font-bold">💡 Tahlil turini tanlang: </span>
              Tezkor harakatlar va skalping uchun <strong className="text-white">1-15m Scalp</strong> yoki mustahkam intraday rejasi uchun <strong className="text-white">1-4 Soat</strong> tahlil tugmasini bosing.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => runMarketAnalysis('short')}
                disabled={isLoading}
                className={`py-4 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xl ${
                  isLoading && currentTermMode === 'short'
                    ? 'bg-amber-950/60 text-amber-500 cursor-wait'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 shadow-amber-500/20 active:scale-95'
                }`}
              >
                {isLoading && currentTermMode === 'short' ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    1-15m tahlil qilinmoqda...
                  </>
                ) : (
                  <>⚡ Qisqa Muddatli (1-15m Scalp)</>
                )}
              </button>

              <button
                onClick={() => runMarketAnalysis('long')}
                disabled={isLoading}
                className={`py-4 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xl ${
                  isLoading && currentTermMode === 'long'
                    ? 'bg-indigo-950/60 text-indigo-400 cursor-wait'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-indigo-500/20 active:scale-95'
                }`}
              >
                {isLoading && currentTermMode === 'long' ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    1-4 soat tahlil qilinmoqda...
                  </>
                ) : (
                  <>📈 Uzoq Muddatli (1-4 Soat)</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 3: SKRINSHOT TAHLIL ── */}
        {activeTab === 'screenshot' && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-violet-400 bg-violet-950/40 shadow-xl'
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
              <span className="text-4xl block mb-2">📸</span>
              <p className="text-slate-200 text-sm font-bold">Grafik skrinshotlarini bu yerga tashlang yoki bosing</p>
              <p className="text-slate-400 text-xs mt-1">PNG, JPG, WEBP • Bir nechta rasm bir vaqtda yuklanishi mumkin</p>
            </div>

            {/* Rasm prevyulari */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2.5">
                {images.map((im, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-600 w-24 h-24 bg-slate-800 shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={im.preview} alt={`upload-${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <textarea
              value={screenshotPrompt}
              onChange={(e) => setScreenshotPrompt(e.target.value)}
              placeholder="Qo'shimcha savol yoki tahlil talabi (ixtiyoriy)..."
              rows={2}
              className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:border-violet-500 focus:outline-none resize-none transition-colors"
            />

            {/* Qisqa va Uzoq muddatli Skrinshot tahlil tugmalari */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => runScreenshotAnalysis('short')}
                disabled={isLoading || (images.length === 0 && !screenshotPrompt.trim())}
                className={`py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xl ${
                  isLoading && currentTermMode === 'short'
                    ? 'bg-amber-950/60 text-amber-500 cursor-wait'
                    : (images.length === 0 && !screenshotPrompt.trim())
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 shadow-amber-500/20 active:scale-95'
                }`}
              >
                {isLoading && currentTermMode === 'short' ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    1-15m tahlil qilinmoqda...
                  </>
                ) : (
                  <>⚡ Skrinshotdan Qisqa (1-15m Scalp)</>
                )}
              </button>

              <button
                onClick={() => runScreenshotAnalysis('long')}
                disabled={isLoading || (images.length === 0 && !screenshotPrompt.trim())}
                className={`py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xl ${
                  isLoading && currentTermMode === 'long'
                    ? 'bg-indigo-950/60 text-indigo-400 cursor-wait'
                    : (images.length === 0 && !screenshotPrompt.trim())
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-indigo-500/20 active:scale-95'
                }`}
              >
                {isLoading && currentTermMode === 'long' ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    1-4 soat tahlil qilinmoqda...
                  </>
                ) : (
                  <>📈 Skrinshotdan Uzoq (1-4 Soat)</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Xatolik */}
        {errorMsg && (
          <div className="bg-red-900/30 border border-red-600/50 rounded-xl p-4 text-xs text-red-200">
            {errorMsg}
          </div>
        )}

        {/* AI Natijasi & Signal Card */}
        {response && (
          <div className="bg-slate-950/90 border border-indigo-500/40 rounded-2xl p-5 mt-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔮</span>
                <span className="text-indigo-300 font-bold text-sm">
                  {currentTermMode === 'short' ? '⚡ QISQA MUDDATLI (1-15m Scalp) TAHLIL NATIJASI' : '📈 UZOQ MUDDATLI (1-4 Soat Intraday) TAHLIL NATIJASI'}
                </span>
              </div>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                currentTermMode === 'short'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
              }`}>
                {currentTermMode === 'short' ? 'Scalping / 1-15m' : 'Intraday / 1-4 Soat'}
              </span>
            </div>

            <div
              ref={responseRef}
              className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto pr-2 font-sans"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#6366f1 transparent' }}
            >
              {response}
            </div>

            {!isLoading && (
              <SignalCard
                text={response}
                accentColor={currentTermMode === 'short' ? 'amber' : 'violet'}
                asset={selectedAsset}
                onOpenTelegram={(data) => {
                  setTelegramModalData(data);
                  setIsTelegramOpen(true);
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Telegram Share Modal */}
      <TelegramShareModal
        isOpen={isTelegramOpen}
        onClose={() => setIsTelegramOpen(false)}
        tradeData={telegramModalData}
      />
    </div>
  );
}
