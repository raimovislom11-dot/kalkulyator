'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';

type Preset = 'Elif trading' | 'AB TRADE' | '2.6 STRATEGY' | 'ORDER BLOCK' | 'IFVG' | 'SNR_ICT' | 'SMT';
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

const getTimeBasedPassword = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
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

function AIAnalysisPanel({ calcContext }: { calcContext: string }) {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  const addImages = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    arr.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages(prev => {
          // Dublikat oldini olish (fayl nomi + hajm bo'yicha)
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

  const analyze = async () => {
    if (!message.trim() && images.length === 0) return;
    setIsLoading(true);
    setResponse('');
    setErrorMsg(null);

    const form = new FormData();
    form.append('message', message || 'Bu rasimlarni tahlil qilib bering.');
    form.append('context', calcContext);
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
    <div className="mb-4">
      {/* Toggle tugma */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-3 ${isOpen
            ? 'bg-gradient-to-r from-violet-700 to-indigo-700 text-white shadow-lg shadow-violet-500/30'
            : 'bg-slate-900/85 border border-violet-700/60 text-violet-300 hover:bg-violet-900/40 backdrop-blur'
          }`}
      >
        <span className="text-xl">{isOpen ? '🔮' : '🤖'}</span>
        {isOpen ? 'AI Tahlilni yopish' : 'AI Tahlil — Claude bilan tahlil qil'}
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${isOpen ? 'bg-violet-900/50 text-violet-300' : 'bg-violet-900/40 text-violet-400'
          }`}>BETA</span>
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="mt-3 bg-slate-900/90 border border-violet-700/40 rounded-2xl p-5 backdrop-blur space-y-4"
          style={{ boxShadow: '0 0 40px rgba(139,92,246,0.15)' }}>

          {/* Sarlavha */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-xl">🔮</div>
            <div>
              <div className="text-violet-300 font-bold text-sm">Claude AI Tahlilchi</div>
              <div className="text-slate-500 text-xs">XAU/USD savdo grafiglarini tahlil qiladi</div>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-green-400 text-xs font-bold">Tayyor</span>
            </div>
          </div>

          {/* Kontekst */}
          {calcContext && (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
              <div className="text-slate-500 text-xs font-bold mb-1">📊 Kalkulyator natijalari avtomatik qo&apos;shiladi</div>
              <div className="text-slate-400 text-xs font-mono leading-relaxed line-clamp-3">{calcContext}</div>
            </div>
          )}

          {/* Rasm yuklash zonasi */}
          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer p-4 ${isDragging
                ? 'border-violet-400 bg-violet-900/30'
                : 'border-slate-600 bg-slate-800/30 hover:border-violet-600/60 hover:bg-violet-900/10'
              }`}
          >
            <div className="text-center">
              <div className="text-3xl mb-1">{isDragging ? '📥' : '📸'}</div>
              <div className="text-slate-400 text-sm font-bold">
                {isDragging ? 'Qo&apos;yib yuboring...' : 'Rasmlarni tashlang yoki bosing'}
              </div>
              <div className="text-slate-600 text-xs mt-0.5">
                Istalgancha rasm qo&apos;shishingiz mumkin · PNG, JPG, WebP
              </div>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg, image/png, image/webp, image/gif"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && addImages(e.target.files)}
          />

          {/* Rasmlar grid preview */}
          {images.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-bold">
                  📎 {images.length} ta rasm yuklandi
                </span>
                <button
                  onClick={() => setImages([])}
                  className="text-xs text-red-400 hover:text-red-300 font-bold transition-colors"
                >
                  Hammasini o&apos;chirish
                </button>
              </div>
              <div className={`grid gap-2 ${images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {images.map((im, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-700/50 bg-slate-800/40">
                    <img
                      src={im.preview}
                      alt={`rasm-${idx + 1}`}
                      className="w-full h-24 object-cover"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white text-sm font-bold transition-all"
                      >✕</button>
                    </div>
                    {/* Rasm nomeri */}
                    <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded font-bold">
                      {idx + 1}
                    </div>
                  </div>
                ))}
                {/* "Yana qo'shish" tile */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="h-24 rounded-xl border-2 border-dashed border-slate-600 bg-slate-800/20 hover:border-violet-500/60 hover:bg-violet-900/10 flex items-center justify-center cursor-pointer transition-all"
                >
                  <div className="text-center">
                    <div className="text-slate-500 text-xl">+</div>
                    <div className="text-slate-600 text-xs">Qo&apos;shish</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Matn kiritish */}
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) analyze();
              }}
              placeholder="Savol yoki tahlil so&apos;rovi kiriting... (Ctrl+Enter — yuborish)"
              rows={3}
              className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:border-violet-500 focus:outline-none resize-none transition-colors"
            />
          </div>

          {/* Yuborish tugma */}
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
              <>🔮 Tahlil qil {images.length > 0 && `(${images.length} rasm)`} {message.trim() ? '' : images.length === 0 ? '' : ''}</>
            )}
          </button>

          {/* Xatolik */}
          {errorMsg && (
            <div className="bg-red-900/30 border border-red-600/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">❌</span>
                <span className="text-red-300 font-bold text-sm">Xatolik yuz berdi</span>
              </div>
              <div className="text-red-200 text-sm font-mono leading-relaxed whitespace-pre-wrap break-all">
                {errorMsg}
              </div>
            </div>
          )}

          {/* Javob */}
          {response && (
            <div className="bg-slate-800/60 border border-violet-700/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🔮</span>
                <span className="text-violet-300 font-bold text-sm">Claude javobi</span>
                {isLoading && (
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse ml-1"></span>
                )}
              </div>
              <div
                ref={responseRef}
                className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto pr-2"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#4c1d95 transparent' }}
              >
                {response}
                {isLoading && <span className="inline-block w-1.5 h-4 bg-violet-400 animate-pulse ml-0.5 align-middle" />}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
function PasswordScreen({ onAuthenticate }: { onAuthenticate: () => void }) {
  const [passwordInput, setPasswordInput] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  // FIX #5 — real-time soat yangilanadi
  useEffect(() => {
    setCurrentTime(getTimeBasedPassword());
    const id = setInterval(() => setCurrentTime(getTimeBasedPassword()), 10000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === getTimeBasedPassword()) { onAuthenticate(); }
    else { setPasswordInput(''); alert("Parol noto'g'ri!"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundImage: "url('/image.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="w-full max-w-md">
        <div className="bg-slate-900/85 border border-slate-700 rounded-2xl p-8 backdrop-blur">
          <h1 className="text-3xl font-bold text-white text-center mb-2">XAU Calculator</h1>
          <p className="text-slate-400 text-center mb-8">Kirish uchun parol kiriting</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-slate-400 text-sm font-bold tracking-widest mb-2 block">PAROL</label>
              <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)}
                className="w-full px-4 py-4 bg-slate-700/80 border border-slate-600 rounded-xl text-white text-2xl font-bold text-center focus:border-orange-500 focus:outline-none tracking-widest"
                placeholder="0000" maxLength={4} autoFocus />
              <p className="text-slate-500 text-xs mt-2 text-center">Hozirgi soat: {currentTime}</p>
            </div>
            <button type="submit"
              className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold rounded-xl transition-all active:scale-95">
              KIRISH
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
function CalculatorContent() {
  const [dailyHigh, setDailyHigh] = useState('');
  const [dailyLow, setDailyLow] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [preset, setPreset] = useState<Preset>('Elif trading');
  const [timeframe, setTimeframe] = useState<Timeframe>('1h');

  // Input mode: qo'lda yoki shamoldan
  const [inputMode, setInputMode] = useState<'manual' | 'candle'>('manual');

  // Shamol (Candle) OHLC
  const [candleOpen, setCandleOpen] = useState('');
  const [candleHigh, setCandleHigh] = useState('');
  const [candleLow, setCandleLow] = useState('');
  const [candleClose, setCandleClose] = useState('');

  // Shamoldan HIGH/LOW/Current avtomatik to'ldirish
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
    return { o, h, l, c, bodySize: bodySize.toFixed(2), upperWick: upperWick.toFixed(2), lowerWick: lowerWick.toFixed(2), bodyPct, type, isBullish, isDoji, totalRange: totalRange.toFixed(2) };
  }, [candleOpen, candleHigh, candleLow, candleClose]);

  // 2.6
  const [hhPrice, setHhPrice] = useState('');
  const [llPrice, setLlPrice] = useState('');
  // OB — FIX #2: Bullish/Bearish tanlash
  const [obHigh, setObHigh] = useState('');
  const [obLow, setObLow] = useState('');
  const [obType, setObType] = useState<OBType>('bullish');
  // IFVG — FIX #3: Bullish/Bearish tanlash
  const [fvgHigh, setFvgHigh] = useState('');
  const [fvgLow, setFvgLow] = useState('');
  const [fvgType, setFvgType] = useState<OBType>('bullish');

  // SNR + ICT + Yolg'iz Sham — soddalashtirilgan
  const [snrEntry, setSnrEntry] = useState(''); // Entry narx
  const [snrSL, setSnrSL] = useState(''); // Stop Loss narx
  const [snrType, setSnrType] = useState<OBType>('bullish');
  const [candleType, setCandleType] = useState<CandleType>('bullish_engulfing');

  // SMT — soddalashtirilgan
  const [smtEntry, setSmtEntry] = useState(''); // Entry narx
  const [smtSL, setSmtSL] = useState(''); // Stop Loss narx
  const [smtType, setSmtType] = useState<OBType>('bullish');

  const calculations = useMemo(() => {
    const high = parseFloat(effectiveHigh) || 0;
    const low = parseFloat(effectiveLow) || 0;
    const current = parseFloat(effectiveCurrent) || 0;
    const rangeVal = high - low;

    // FIX #3: dependency array dan tf olib tashlandi — faqat timeframe
    const tf = timeframeConfig[timeframe];
    const buf = tf.pipBuffer;
    const con = tf.consolOffset;

    if (current === 0) return null;

    // ── Gann helpers ───────────────────────────────────────────
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
        return c ? { text: `Gann ${c.l} (${c.v.toFixed(2)}) ${tag}bilan mos keldi!`, strong: true }
          : { text: "Gann bilan sinergiya yo'q", strong: false };
      } else {
        const r = [{ l: 'R1', v: gann.R1 }, { l: 'R2', v: gann.R2 }, { l: 'R3', v: gann.R3 }, { l: 'R4', v: gann.R4 }];
        const c = r.find(x => x.v >= min && x.v <= max);
        return c ? { text: `Gann ${c.l} (${c.v.toFixed(2)}) ${tag}bilan mos keldi!`, strong: true }
          : { text: "Gann bilan sinergiya yo'q", strong: false };
      }
    };

    const pct = (a: number, b: number) => ((Math.abs(a - b) / b) * 100).toFixed(2);
    const fmt = (n: number) => n.toFixed(2);
    const gFmt = {
      S1: gann.S1.toFixed(2), S2: gann.S2.toFixed(2), S3: gann.S3.toFixed(2), S4: gann.S4.toFixed(2),
      R1: gann.R1.toFixed(2), R2: gann.R2.toFixed(2), R3: gann.R3.toFixed(2), R4: gann.R4.toFixed(2),
    };

    // ── ORDER BLOCK ────────────────────────────────────────────
    if (preset === 'ORDER BLOCK') {
      const obH = parseFloat(obHigh);
      const obL = parseFloat(obLow);
      if (isNaN(obH) || isNaN(obL) || obH <= obL) return null;

      // FIX #1: isBuy — foydalanuvchi tanlagan OB turi
      const isBuy = obType === 'bullish';
      const obMid = (obH + obL) / 2;
      const obSize = obH - obL;

      // Entry: narx OB ga qaytib kelganida
      // Bullish OB → narx OB dan yuqoriga ketadi → entry = OB yuqori qismi (obH)
      // Bearish OB → narx OB dan pastga ketadi   → entry = OB pastki qismi (obL)
      const entry = isBuy ? obH : obL;

      // SL: OB ning qarama-qarshi tomonidan buf pip narida
      const sl = isBuy ? obL - buf : obH + buf;

      // TP: entry + OB hajmi × 1,2,3
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

    // ── IFVG ──────────────────────────────────────────────────
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

    // ── SNR + ICT + YOLG'IZ SHAM ──────────────────────────────
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

    // ── SMT (Smart Money Technique) ────────────────────────────
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

    // ── Elif trading / AB TRADE / 2.6 ──────────────────────────────
    if (rangeVal <= 0) return null;
    const config = presetConfigs[preset];

    let isBuy: boolean;
    if (preset === '2.6 STRATEGY') {
      const hh = parseFloat(hhPrice);
      const ll = parseFloat(llPrice);
      // HH/LL faqat current narx bilan bir xil oralikda bo'lsagina ishlatiladi.
      // Agar HH/LL boshqa scale da bo'lsa (masalan HH=4275, current=64) —
      // fallback: (HIGH+LOW)/2 o'rta nuqtasi ishlatiladi.
      const scaleTolerance = Math.max(rangeVal * 20, 100);
      const hhllValid = !isNaN(hh) && !isNaN(ll)
        && Math.abs(hh - current) < scaleTolerance
        && Math.abs(ll - current) < scaleTolerance;

      if (hhllValid) {
        // Narx LL ga yaqin → BUY, HH ga yaqin → SELL
        isBuy = Math.abs(current - ll) < Math.abs(current - hh);
      } else {
        // HH/LL kiritilmagan yoki noto'g'ri scale → midpoint
        isBuy = current < (high + low) / 2;
      }
    } else {
      isBuy = current < (high + low) / 2;
    }

    const reversal = isBuy ? low - rangeVal * config.rRev : high + rangeVal * config.rRev;
    const correction = isBuy ? low + rangeVal * config.rCor : high - rangeVal * config.rCor;
    const consolidation = isBuy ? correction + con : correction - con;

    // FIX #4: SL entry dan hisoblanadi (correction/reversal)
    let sl: number;
    let entry: number;
    if (preset === '2.6 STRATEGY') {
      entry = reversal;
      sl = isBuy ? reversal - buf : reversal + buf;
    } else {
      entry = isBuy ? Math.max(correction, consolidation) : Math.min(correction, consolidation);
      sl = isBuy ? Math.min(correction, consolidation) - buf : Math.max(correction, consolidation) + buf;
    }

    // FIX #4: TP entry nuqtasidan emas, current dan hisoblash (narx hali entry ga yetmagan)
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
  }, [effectiveHigh, effectiveLow, effectiveCurrent, preset, timeframe, hhPrice, llPrice, obHigh, obLow, obType, fvgHigh, fvgLow, fvgType, snrEntry, snrSL, snrType, candleType, smtEntry, smtSL, smtType]);

  const isBuy = calculations?.isBuy ?? false;
  const rangeVal = parseFloat(effectiveHigh) - parseFloat(effectiveLow);
  const tf = timeframeConfig[timeframe];
  const rangeOk = rangeVal > 0 && rangeVal <= tf.maxRange;
  const rangeWarning = rangeVal > tf.maxRange;
  const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

  // ─── UI helpers ───────────────────────────────────────────
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

  const RRBadge = ({ rr }: { rr: string }) => (
    <span className="ml-2 px-2 py-0.5 bg-yellow-900/40 text-yellow-400 text-xs font-bold rounded">
      R:R {rr}
    </span>
  );

  // AI uchun kontekst matni
  const aiContext = useMemo(() => {
    if (!calculations) return '';
    const lines: string[] = [
      `Strategiya: ${calculations.preset}`,
      `Yo'nalish: ${calculations.isBuy ? 'BUY (Sotib olish)' : 'SELL (Sotish)'}`,
      `Vaqt oralig'i: ${timeframe} (${tf.label})`,
      `Entry: ${calculations.entry}`,
      `Stop Loss: ${calculations.stopLoss}`,
      `TP1: ${calculations.tp1} (R:R ${calculations.rr1})`,
      `TP2: ${calculations.tp2} (R:R ${calculations.rr2})`,
      `TP3: ${calculations.tp3} (R:R ${calculations.rr3})`,
      `Gann R1: ${calculations.gann.R1}, R2: ${calculations.gann.R2}`,
      `Gann S1: ${calculations.gann.S1}, S2: ${calculations.gann.S2}`,
      `Signal: ${calculations.isStrongSignal ? 'KUCHLI' : 'ODDIY'}`,
      `Gann: ${calculations.gannConfluence}`,
    ];
    if (effectiveHigh && effectiveLow) {
      lines.push(`Range: HIGH=${effectiveHigh}, LOW=${effectiveLow}`);
    }
    return lines.join('\n');
  }, [calculations, timeframe, tf, effectiveHigh, effectiveLow]);

  return (
    <div className="min-h-screen p-4 md:p-8"
      style={{ backgroundImage: "url('/image.png')", backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      <div className="max-w-2xl mx-auto">

        {/* AI TAHLIL PANELI */}
        <AIAnalysisPanel calcContext={aiContext} />

        {/* TIMEFRAME */}
        <div className="bg-slate-900/85 border border-slate-700 rounded-2xl p-4 mb-4 backdrop-blur">
          <div className="text-slate-400 text-xs font-bold tracking-widest mb-3">VAQT ORALIG&apos;I</div>
          <div className="grid grid-cols-6 gap-2">
            {TIMEFRAMES.map(t => (
              <button key={t} onClick={() => setTimeframe(t)}
                className={`py-2 rounded-xl font-bold text-sm transition-all ${timeframe === t ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105' : 'bg-slate-700/80 text-slate-400 hover:bg-slate-600/80'}`}>
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
            <div className={`p-4 rounded-2xl border-2 text-center font-bold text-2xl flex items-center justify-center transition-all duration-300 ${isBuy
                ? 'bg-green-500/20 border-green-400 text-green-300 shadow-lg shadow-green-500/30 scale-105'
                : 'bg-black/50 border-slate-800 text-slate-700 opacity-40'
              }`}>
              <span className="text-3xl mr-2">&#9650;</span>BUY
            </div>
            <div className={`p-4 rounded-2xl border-2 text-center font-bold text-2xl flex items-center justify-center transition-all duration-300 ${!isBuy
                ? 'bg-red-500/20 border-red-400 text-red-300 shadow-lg shadow-red-500/30 scale-105'
                : 'bg-black/50 border-slate-800 text-slate-700 opacity-40'
              }`}>
              <span className="text-3xl mr-2">&#9660;</span>SELL
            </div>
          </div>
        )}

        {/* INPUT MODE TOGGLE */}
        <div className="bg-slate-900/85 border border-slate-700 rounded-2xl p-3 mb-4 backdrop-blur">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setInputMode('manual')}
              className={`py-2.5 rounded-xl font-bold text-sm transition-all ${inputMode === 'manual'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-slate-700/80 text-slate-400 hover:bg-slate-600'
                }`}>
              ✏️ Qo&apos;lda kiritish
            </button>
            <button onClick={() => setInputMode('candle')}
              className={`py-2.5 rounded-xl font-bold text-sm transition-all ${inputMode === 'candle'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-700/80 text-slate-400 hover:bg-slate-600'
                }`}>
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
                <div className="text-emerald-400 text-xs font-bold tracking-widest">TRADINGVIEW SHAMOL (CANDLE)</div>
                <div className="text-slate-500 text-xs mt-0.5">Grafigingizdan shamolning O, H, L, C ni kiriting</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mb-4">
              <div>
                <label className="text-slate-400 text-xs font-bold mb-1 block">OPEN</label>
                <input type="number" value={candleOpen} onChange={e => setCandleOpen(e.target.value)}
                  className="w-full px-3 py-3 bg-slate-700/80 border border-emerald-700/50 rounded-xl text-white text-lg font-bold focus:border-emerald-400 focus:outline-none" step="0.01" placeholder="O" />
              </div>
              <div>
                <label className="text-red-400 text-xs font-bold mb-1 block">HIGH ↑</label>
                <input type="number" value={candleHigh} onChange={e => setCandleHigh(e.target.value)}
                  className="w-full px-3 py-3 bg-slate-700/80 border border-red-700/50 rounded-xl text-white text-lg font-bold focus:border-red-400 focus:outline-none" step="0.01" placeholder="H" />
              </div>
              <div>
                <label className="text-green-400 text-xs font-bold mb-1 block">LOW ↓</label>
                <input type="number" value={candleLow} onChange={e => setCandleLow(e.target.value)}
                  className="w-full px-3 py-3 bg-slate-700/80 border border-green-700/50 rounded-xl text-white text-lg font-bold focus:border-green-400 focus:outline-none" step="0.01" placeholder="L" />
              </div>
              <div>
                <label className="text-blue-400 text-xs font-bold mb-1 block">CLOSE</label>
                <input type="number" value={candleClose} onChange={e => setCandleClose(e.target.value)}
                  className="w-full px-3 py-3 bg-slate-700/80 border border-blue-700/50 rounded-xl text-white text-lg font-bold focus:border-blue-400 focus:outline-none" step="0.01" placeholder="C" />
              </div>
            </div>

            {/* Shamol tahlil natijasi */}
            {candleAnalysis && (
              <div className={`rounded-xl p-4 border ${candleAnalysis.isDoji ? 'bg-yellow-900/20 border-yellow-600/40' :
                  candleAnalysis.isBullish ? 'bg-green-900/20 border-green-600/40' :
                    'bg-red-900/20 border-red-600/40'
                }`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">
                    {candleAnalysis.isDoji ? '⚡' : candleAnalysis.isBullish ? '🟢' : '🔴'}
                  </span>
                  <span className={`font-bold text-lg ${candleAnalysis.isDoji ? 'text-yellow-400' :
                      candleAnalysis.isBullish ? 'text-green-400' : 'text-red-400'
                    }`}>
                    {candleAnalysis.type} Shamol
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="bg-slate-800/60 rounded-lg p-2">
                    <div className="text-slate-400 mb-1">Yuqori Soya ↑</div>
                    <div className="text-red-300 font-bold">{candleAnalysis.upperWick}</div>
                  </div>
                  <div className={`rounded-lg p-2 ${candleAnalysis.isBullish ? 'bg-green-900/40' : 'bg-red-900/40'
                    }`}>
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
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-center">
                  <div className="text-slate-500">HIGH → <span className="text-white font-bold">{candleAnalysis.h.toFixed(2)}</span></div>
                  <div className="text-slate-500">Range: <span className="text-white font-bold">{candleAnalysis.totalRange}</span></div>
                  <div className="text-slate-500">LOW → <span className="text-white font-bold">{candleAnalysis.l.toFixed(2)}</span></div>
                </div>
                <div className="mt-2 text-center text-xs text-emerald-400 font-bold">
                  ✓ HIGH={candleAnalysis.h.toFixed(2)}, LOW={candleAnalysis.l.toFixed(2)}, Current={candleAnalysis.c.toFixed(2)} kalkulyatorga ulandi
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-slate-900/85 border border-slate-700 rounded-2xl p-6 mb-6 backdrop-blur">
          <h3 className="text-slate-400 text-xs font-bold tracking-widest mb-4">{tf.label.toUpperCase()} DIAPAZONI</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-slate-400 text-xs font-bold tracking-widest mb-2 block">HIGH (Liquidity)</label>
              <input type="number" value={dailyHigh} onChange={e => setDailyHigh(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600 rounded-xl text-white text-2xl font-bold focus:border-orange-500 focus:outline-none" step="0.01" />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-bold tracking-widest mb-2 block">LOW (Liquidity)</label>
              <input type="number" value={dailyLow} onChange={e => setDailyLow(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600 rounded-xl text-white text-2xl font-bold focus:border-orange-500 focus:outline-none" step="0.01" />
            </div>
          </div>

          {rangeVal > 0 && (
            <div className={`rounded-xl px-4 py-3 flex justify-between items-center text-sm mb-4 ${rangeWarning ? 'bg-red-900/40 border border-red-600/50' : rangeOk ? 'bg-green-900/20 border border-green-600/30' : 'bg-slate-700/80'}`}>
              <span className={`font-bold ${rangeWarning ? 'text-red-400' : rangeOk ? 'text-green-400' : 'text-slate-400'}`}>
                Range: {rangeVal.toFixed(2)} pip
              </span>
              <span className={`font-bold text-xs ${rangeWarning ? 'text-red-400' : rangeOk ? 'text-green-400' : 'text-slate-400'}`}>
                {rangeWarning ? `⚠ Katta! Max: ${tf.maxRange}` : `✓ ${timeframe} uchun mos`}
              </span>
            </div>
          )}

          <div className="mb-4">
            <label className="text-slate-400 text-xs font-bold tracking-widest mb-2 block">HOZIRGI NARX</label>
            <input type="number" value={currentPrice} onChange={e => setCurrentPrice(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600 rounded-xl text-white text-2xl font-bold focus:border-orange-500 focus:outline-none" step="0.01" />
          </div>

          <div>
            <label className="text-slate-400 text-xs font-bold tracking-widest mb-2 block">STRATEGIYA</label>
            <select value={preset} onChange={e => setPreset(e.target.value as Preset)}
              className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600 rounded-xl text-white font-bold focus:border-orange-500 focus:outline-none">
              <option value="Elif trading">Elif trading</option>
              <option value="AB TRADE">AB TRADE</option>
              <option value="2.6 STRATEGY">2.6 STRATEGY</option>
              <option value="ORDER BLOCK">ORDER BLOCK</option>
              <option value="IFVG">IFVG (Inverse FVG)</option>
              <option value="SNR_ICT">SNR + ICT + Yolg&apos;iz Sham</option>
              <option value="SMT">SMT (Smart Money Technique)</option>
            </select>
          </div>

          {/* 2.6 HH/LL */}
          {preset === '2.6 STRATEGY' && (
            <div className="mt-4 p-4 bg-amber-900/30 border border-amber-600/40 rounded-xl">
              <p className="text-amber-400 text-xs font-bold tracking-widest mb-3">HH / LL</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs font-bold mb-1 block">HH (Higher High)</label>
                  <input type="number" value={hhPrice} onChange={e => setHhPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/80 border border-amber-600/50 rounded-lg text-white text-lg font-bold focus:border-amber-400 focus:outline-none" step="0.01" placeholder="HH" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-bold mb-1 block">LL (Lower Low)</label>
                  <input type="number" value={llPrice} onChange={e => setLlPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/80 border border-amber-600/50 rounded-lg text-white text-lg font-bold focus:border-amber-400 focus:outline-none" step="0.01" placeholder="LL" />
                </div>
              </div>
            </div>
          )}

          {/* ORDER BLOCK */}
          {preset === 'ORDER BLOCK' && (
            <div className="mt-4 p-4 bg-blue-900/30 border border-blue-600/40 rounded-xl">
              <p className="text-blue-400 text-xs font-bold tracking-widest mb-1">ORDER BLOCK ZONE</p>
              <p className="text-slate-500 text-xs mb-1">Oxirgi qarama-qarshi svechaning High va Low</p>
              {/* FIX #7: OB turi tanlash */}
              <TypeToggle value={obType} onChange={setObType} isBuyLabel="Bullish OB" isSellLabel="Bearish OB" />
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-slate-400 text-xs font-bold mb-1 block">OB HIGH</label>
                  <input type="number" value={obHigh} onChange={e => setObHigh(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/80 border border-blue-600/50 rounded-lg text-white text-lg font-bold focus:border-blue-400 focus:outline-none" step="0.01" placeholder="Yuqori" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-bold mb-1 block">OB LOW</label>
                  <input type="number" value={obLow} onChange={e => setObLow(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/80 border border-blue-600/50 rounded-lg text-white text-lg font-bold focus:border-blue-400 focus:outline-none" step="0.01" placeholder="Pastki" />
                </div>
              </div>
            </div>
          )}

          {/* IFVG */}
          {preset === 'IFVG' && (
            <div className="mt-4 p-4 bg-purple-900/30 border border-purple-600/40 rounded-xl">
              <p className="text-purple-400 text-xs font-bold tracking-widest mb-1">IFVG ZONE</p>
              <p className="text-slate-500 text-xs mb-1">Fair Value Gap ning tepa va pastki chegarasi</p>
              <TypeToggle value={fvgType} onChange={setFvgType} isBuyLabel="Bullish IFVG" isSellLabel="Bearish IFVG" />
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-slate-400 text-xs font-bold mb-1 block">FVG HIGH</label>
                  <input type="number" value={fvgHigh} onChange={e => setFvgHigh(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/80 border border-purple-600/50 rounded-lg text-white text-lg font-bold focus:border-purple-400 focus:outline-none" step="0.01" placeholder="Yuqori" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-bold mb-1 block">FVG LOW</label>
                  <input type="number" value={fvgLow} onChange={e => setFvgLow(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700/80 border border-purple-600/50 rounded-lg text-white text-lg font-bold focus:border-purple-400 focus:outline-none" step="0.01" placeholder="Pastki" />
                </div>
              </div>
            </div>
          )}

          {/* SNR + ICT + Yolg'iz Sham */}
          {preset === 'SNR_ICT' && (
            <div className="mt-4 p-4 bg-teal-900/30 border border-teal-600/40 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🕯️</span>
                <div>
                  <p className="text-teal-400 text-xs font-bold tracking-widest">SNR + ICT + YOLG&apos;IZ SHAM</p>
                  <p className="text-slate-500 text-xs mt-0.5">Grafigdan Entry va Stop Loss ni kiritasiz → TP avtomatik</p>
                </div>
              </div>
              <TypeToggle value={snrType} onChange={setSnrType} isBuyLabel="BUY Setup" isSellLabel="SELL Setup" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-cyan-400 text-xs font-bold mb-1 block">ENTRY NARX</label>
                  <input type="number" value={snrEntry} onChange={e => setSnrEntry(e.target.value)}
                    className="w-full px-3 py-3 bg-slate-700/80 border border-cyan-600/50 rounded-lg text-white text-xl font-bold focus:border-cyan-400 focus:outline-none" step="0.01" placeholder="Entry" />
                </div>
                <div>
                  <label className="text-red-400 text-xs font-bold mb-1 block">STOP LOSS NARX</label>
                  <input type="number" value={snrSL} onChange={e => setSnrSL(e.target.value)}
                    className="w-full px-3 py-3 bg-slate-700/80 border border-red-700/50 rounded-lg text-white text-xl font-bold focus:border-red-400 focus:outline-none" step="0.01" placeholder="SL" />
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs font-bold mb-1 block">YOLG&apos;IZ SHAM TURI (ma&apos;lumot uchun)</label>
                <select value={candleType} onChange={e => setCandleType(e.target.value as CandleType)}
                  className="w-full px-3 py-2 bg-slate-700/80 border border-teal-600/50 rounded-lg text-white font-bold focus:border-teal-400 focus:outline-none">
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
              <div className="flex items-center gap-2">
                <span className="text-lg">🧲</span>
                <div>
                  <p className="text-rose-400 text-xs font-bold tracking-widest">SMT (Smart Money Technique)</p>
                  <p className="text-slate-500 text-xs mt-0.5">Grafigdan Entry va Stop Loss ni kiritasiz → TP avtomatik</p>
                </div>
              </div>
              <TypeToggle value={smtType} onChange={setSmtType} isBuyLabel="Bullish SMT" isSellLabel="Bearish SMT" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-cyan-400 text-xs font-bold mb-1 block">ENTRY NARX</label>
                  <input type="number" value={smtEntry} onChange={e => setSmtEntry(e.target.value)}
                    className="w-full px-3 py-3 bg-slate-700/80 border border-cyan-600/50 rounded-lg text-white text-xl font-bold focus:border-cyan-400 focus:outline-none" step="0.01" placeholder="Entry" />
                </div>
                <div>
                  <label className="text-red-400 text-xs font-bold mb-1 block">STOP LOSS NARX</label>
                  <input type="number" value={smtSL} onChange={e => setSmtSL(e.target.value)}
                    className="w-full px-3 py-3 bg-slate-700/80 border border-red-700/50 rounded-lg text-white text-xl font-bold focus:border-red-400 focus:outline-none" step="0.01" placeholder="SL" />
                </div>
              </div>
            </div>
          )}
        </div>


        {/* ─────── NATIJALAR ─────── */}
        {calculations && (
          <div className="space-y-4">

            {/* SNR + ICT + Yolg'iz Sham natijalari */}
            {calculations.preset === 'SNR_ICT' && (
              <>
                <h3 className="text-teal-400 text-xs font-bold tracking-widest mb-2">🕯️ SNR + ICT + YOLG&apos;IZ SHAM — {timeframe} | {snrType.toUpperCase()}</h3>
                {/* Sham belgisi */}
                <div className="bg-teal-900/20 border border-teal-600/50 rounded-2xl p-4 backdrop-blur flex items-center gap-4">
                  <div className="text-4xl">{snrType === 'bullish' ? '🟢' : '🔴'}</div>
                  <div>
                    <div className="text-teal-300 font-bold text-sm">{calculations.candleLabel}</div>
                    <div className="text-slate-400 text-xs mt-1">
                      {isBuy ? 'SNR Support → Sweep → BoS → Bullish sham → BUY' : 'SNR Resistance → Sweep → BoS → Bearish sham → SELL'}
                    </div>
                    <div className="text-slate-500 text-xs mt-1">Risk: <span className="text-white font-bold">{calculations.risk} pip</span></div>
                  </div>
                </div>
                {/* Entry */}
                <div className="bg-slate-900/85 border-2 border-cyan-600/50 rounded-2xl p-5 backdrop-blur">
                  <div className="text-slate-400 text-xs font-bold tracking-widest mb-2">ENTRY</div>
                  <div className="text-3xl font-bold text-cyan-400">{calculations.entry}</div>
                  <div className="text-xs text-slate-500 mt-1">Yolg&apos;iz sham yopilishidan keyin kirish</div>
                </div>
                {/* SL */}
                <div className="bg-slate-900/85 border-2 border-red-600/50 rounded-2xl p-5 backdrop-blur">
                  <div className="text-red-400 text-xs font-bold tracking-widest mb-2">STOP LOSS</div>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-red-500">{calculations.stopLoss}</div>
                    <div className="text-sm font-bold text-slate-400">({calculations.slPct}%)</div>
                  </div>
                </div>
              </>
            )}

            {/* SMT natijalari */}
            {calculations.preset === 'SMT' && (
              <>
                <h3 className="text-rose-400 text-xs font-bold tracking-widest mb-2">🧲 SMT — {timeframe} | {smtType.toUpperCase()}</h3>
                {/* SMT belgisi */}
                <div className="bg-rose-900/20 border border-rose-600/50 rounded-2xl p-4 backdrop-blur flex items-center gap-4">
                  <div className="text-4xl">{isBuy ? '🟢' : '🔴'}</div>
                  <div>
                    <div className="text-rose-300 font-bold text-sm">{isBuy ? 'Bullish SMT Divergence' : 'Bearish SMT Divergence'}</div>
                    <div className="text-slate-400 text-xs mt-1">
                      {isBuy ? 'Korrelyatsion juftlar mos kelmadi → BUY signal' : 'Korrelyatsion juftlar mos kelmadi → SELL signal'}
                    </div>
                    <div className="text-slate-500 text-xs mt-1">Risk: <span className="text-white font-bold">{calculations.risk} pip</span></div>
                  </div>
                </div>
                {/* Entry */}
                <div className="bg-slate-900/85 border-2 border-cyan-600/50 rounded-2xl p-5 backdrop-blur">
                  <div className="text-slate-400 text-xs font-bold tracking-widest mb-2">ENTRY</div>
                  <div className="text-3xl font-bold text-cyan-400">{calculations.entry}</div>
                </div>
                {/* SL */}
                <div className="bg-slate-900/85 border-2 border-red-600/50 rounded-2xl p-5 backdrop-blur">
                  <div className="text-red-400 text-xs font-bold tracking-widest mb-2">STOP LOSS</div>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-red-500">{calculations.stopLoss}</div>
                    <div className="text-sm font-bold text-slate-400">({calculations.slPct}%)</div>
                  </div>
                </div>
              </>
            )}

            {/* ORDER BLOCK natijalar */}
            {calculations.preset === 'ORDER BLOCK' && (
              <>
                <h3 className="text-blue-400 text-xs font-bold tracking-widest mb-2">&#9632; ORDER BLOCK — {timeframe} | {obType.toUpperCase()}</h3>
                <div className="bg-blue-900/20 border border-blue-600/50 rounded-2xl p-5 backdrop-blur">
                  <div className="text-blue-400 text-xs font-bold tracking-widest mb-3">OB ZONE</div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div><div className="text-slate-400 text-xs mb-1">OB HIGH</div><div className="text-xl font-bold text-red-400">{calculations.obHigh}</div></div>
                    <div><div className="text-slate-400 text-xs mb-1">OB MID</div><div className="text-xl font-bold text-blue-400">{calculations.obMid}</div><div className="text-xs text-slate-500">{calculations.obMidPct}%</div></div>
                    <div><div className="text-slate-400 text-xs mb-1">OB LOW</div><div className="text-xl font-bold text-green-400">{calculations.obLow}</div></div>
                  </div>
                  <div className="mt-3 text-center text-xs text-slate-500">OB hajmi: <span className="text-blue-300 font-bold">{calculations.obSize} pip</span></div>
                </div>
                <div className="bg-slate-900/85 border-2 border-cyan-600/50 rounded-2xl p-5 backdrop-blur">
                  <div className="text-slate-400 text-xs font-bold tracking-widest mb-2">ENTRY</div>
                  <div className="text-3xl font-bold text-cyan-400">{calculations.entry}</div>
                  <div className="text-xs text-slate-500 mt-1">{isBuy ? 'Bullish OB — BUY (OB yuqori chegarasidan)' : 'Bearish OB — SELL (OB pastki chegarasidan)'} | {calculations.entryPct}%</div>
                </div>
                <div className="bg-slate-900/85 border-2 border-red-600/50 rounded-2xl p-5 backdrop-blur">
                  <div className="text-red-400 text-xs font-bold tracking-widest mb-2">STOP LOSS</div>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-red-500">{calculations.stopLoss}</div>
                    <div className="text-sm font-bold text-slate-400">({calculations.slPct}%)</div>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">OB {isBuy ? 'LOW dan' : 'HIGH dan'} {calculations.pipBuffer} pip narida</div>
                </div>
              </>
            )}

            {/* IFVG natijalar */}
            {calculations.preset === 'IFVG' && (
              <>
                <h3 className="text-purple-400 text-xs font-bold tracking-widest mb-2">&#9670; IFVG — {timeframe} | {fvgType.toUpperCase()}</h3>
                <div className="bg-purple-900/20 border border-purple-600/50 rounded-2xl p-5 backdrop-blur">
                  <div className="text-purple-400 text-xs font-bold tracking-widest mb-3">FVG ZONE</div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div><div className="text-slate-400 text-xs mb-1">FVG HIGH</div><div className="text-xl font-bold text-red-400">{calculations.fvgHigh}</div></div>
                    <div><div className="text-slate-400 text-xs mb-1">FVG MID</div><div className="text-xl font-bold text-purple-400">{calculations.fvgMid}</div><div className="text-xs text-slate-500">{calculations.fvgMidPct}%</div></div>
                    <div><div className="text-slate-400 text-xs mb-1">FVG LOW</div><div className="text-xl font-bold text-green-400">{calculations.fvgLow}</div></div>
                  </div>
                  <div className="mt-3 text-center text-xs text-slate-500">Gap: <span className="text-purple-300 font-bold">{calculations.fvgSize} pip</span></div>
                </div>
                <div className="bg-slate-900/85 border-2 border-cyan-600/50 rounded-2xl p-5 backdrop-blur">
                  <div className="text-slate-400 text-xs font-bold tracking-widest mb-2">ENTRY</div>
                  <div className="text-3xl font-bold text-cyan-400">{calculations.entry}</div>
                  <div className="text-xs text-slate-500 mt-1">{isBuy ? 'FVG LOW — BUY' : 'FVG HIGH — SELL'} | {calculations.entryPct}%</div>
                </div>
                <div className="bg-slate-900/85 border-2 border-red-600/50 rounded-2xl p-5 backdrop-blur">
                  <div className="text-red-400 text-xs font-bold tracking-widest mb-2">STOP LOSS</div>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-red-500">{calculations.stopLoss}</div>
                    <div className="text-sm font-bold text-slate-400">({calculations.slPct}%)</div>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">FVG {isBuy ? 'LOW dan' : 'HIGH dan'} {calculations.pipBuffer} pip narida</div>
                </div>
              </>
            )}

            {/* 778 / AB / 2.6 */}
            {(calculations.preset === 'Elif trading' || calculations.preset === 'AB TRADE' || calculations.preset === '2.6 STRATEGY') && (
              <>
                <h3 className="text-slate-400 text-xs font-bold tracking-widest mb-2">KIRISH NUQTALARI — {timeframe}</h3>
                <div className="bg-slate-900/85 border border-red-600/30 rounded-2xl p-5 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="px-4 py-2 rounded-lg text-sm font-bold bg-red-900/30 text-red-400">
                        {calculations.preset === '2.6 STRATEGY' ? 'Liquidity' : 'Qaytish'}
                      </div>
                      <div className="text-3xl font-bold text-red-400">{calculations.reversal}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-400">{calculations.reversalPct}%</div>
                      <div className={`text-xs font-bold px-2 py-1 rounded ${isBuy ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{isBuy ? 'BUY' : 'SELL'}</div>
                    </div>
                  </div>
                </div>

                {calculations.preset !== '2.6 STRATEGY' && (
                  <>
                    <div className="bg-slate-900/85 border border-blue-600/30 rounded-2xl p-5 backdrop-blur">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="px-4 py-2 rounded-lg text-sm font-bold text-blue-400 border border-blue-600">Korreksiya</div>
                          <div className="text-3xl font-bold text-cyan-400">{calculations.correction}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-400">{calculations.correctionPct}%</div>
                          <div className="text-xs font-bold px-2 py-1 rounded bg-red-900/30 text-red-400">SELL</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-900/85 border border-purple-600/30 rounded-2xl p-5 backdrop-blur">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="px-4 py-2 rounded-lg text-sm font-bold text-purple-400 border border-purple-600">Konsolidatsiya</div>
                          <div className="text-3xl font-bold text-purple-300">{calculations.consolidation}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-400">{calculations.consolidationPct}%</div>
                          <div className="text-xs font-bold px-2 py-1 rounded bg-red-900/30 text-red-400">SELL</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <h3 className="text-slate-400 text-xs font-bold tracking-widest mt-4 mb-3">SAVDO REJASI</h3>
                {calculations.preset === '2.6 STRATEGY' && calculations.liquidityInfo && (
                  <div className="bg-amber-900/20 border border-amber-600/30 rounded-2xl p-4 backdrop-blur mb-3">
                    <div className="text-amber-400 text-xs font-bold tracking-widest mb-1">LIQUIDITY ANALIZI</div>
                    <div className="text-sm text-amber-200 font-mono">{calculations.liquidityInfo}</div>
                  </div>
                )}
                <div className="bg-slate-900/85 border-2 border-cyan-600/50 rounded-2xl p-5 backdrop-blur mb-3">
                  <div className="text-slate-400 text-xs font-bold tracking-widest mb-2">ENTRY PRICE</div>
                  <div className="text-3xl font-bold text-cyan-400">
                    {calculations.preset === '2.6 STRATEGY' ? calculations.reversal : `${calculations.correction} — ${calculations.consolidation}`}
                  </div>
                  <div className={`text-xs font-bold mt-1 ${tf.color}`}>Buffer: {tf.pipBuffer} pip</div>
                </div>
                <div className="bg-slate-900/85 border-2 border-red-600/50 rounded-2xl p-5 backdrop-blur">
                  <div className="text-red-400 text-xs font-bold tracking-widest mb-2">STOP LOSS</div>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-red-500">{calculations.stopLoss}</div>
                    <div className="text-sm font-bold text-slate-400">({calculations.slPct}%)</div>
                  </div>
                </div>
              </>
            )}

            {/* TP1 / TP2 / TP3 — R:R bilan */}
            <h3 className="text-slate-400 text-xs font-bold tracking-widest mt-6 mb-3">MAQSAD NARXLAR (TP)</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'TP1', val: calculations.tp1, pct: calculations.tp1Pct, rr: calculations.rr1 },
                { label: 'TP2', val: calculations.tp2, pct: calculations.tp2Pct, rr: calculations.rr2 },
                { label: 'TP3', val: calculations.tp3, pct: calculations.tp3Pct, rr: calculations.rr3 },
              ].map(tp => (
                <div key={tp.label} className="bg-slate-900/85 border border-green-600/50 rounded-2xl p-4 backdrop-blur">
                  <div className="text-green-400 font-bold text-sm mb-1">{tp.label}</div>
                  <div className="text-xl font-bold text-green-400">{tp.val}</div>
                  <div className="text-xs text-slate-400 mt-1">{tp.pct}%</div>
                  {/* FIX #6: R:R badge */}
                  <div className="text-xs font-bold text-yellow-400 mt-1">{tp.rr}</div>
                </div>
              ))}
            </div>

            {/* UMUMIY ANALIZ */}
            <h3 className="text-slate-400 text-xs font-bold tracking-widest mt-6 mb-3">UMUMIY ANALIZ</h3>
            <div className={`border-2 rounded-2xl p-5 backdrop-blur ${calculations.isStrongSignal ? 'bg-green-900/30 border-green-500/50' : 'bg-slate-900/85 border-slate-700/50'}`}>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <div className={`px-3 py-1 rounded text-xs font-bold ${calculations.isStrongSignal ? 'bg-green-500/20 text-green-400' : 'bg-slate-700/80 text-slate-400'}`}>
                  {calculations.isStrongSignal ? 'KUCHLI SIGNAL' : 'ODDIY SIGNAL'}
                </div>
                <div className="px-3 py-1 rounded text-xs font-bold bg-slate-700/80 text-slate-400">{calculations.preset}</div>
                <div className={`px-3 py-1 rounded text-xs font-bold bg-slate-700/80 ${tf.color}`}>{timeframe}</div>
              </div>
              <p className="text-lg font-bold text-white mb-1">
                Yo&apos;nalish: <span className={isBuy ? 'text-green-400' : 'text-red-400'}>{isBuy ? '▲ BUY' : '▼ SELL'}</span>
              </p>
              <p className="text-sm text-slate-400">{calculations.gannConfluence}</p>
            </div>

            {/* GANN */}
            <h3 className="text-slate-400 text-xs font-bold tracking-widest mt-6 mb-3">GANN DARAJALARI</h3>
            <div className="grid grid-cols-2 gap-4 pb-8">
              <div className="bg-slate-900/85 border border-red-900/30 rounded-2xl p-4 backdrop-blur">
                <div className="text-red-400 text-xs font-bold tracking-widest mb-3 text-center">RESISTANCE</div>
                <div className="space-y-2">
                  {(['R4', 'R3', 'R2', 'R1'] as const).map(k => (
                    <div key={k} className="flex justify-between text-sm">
                      <span className="text-slate-400">{k}:</span>
                      <span className="text-red-300 font-bold">{calculations.gann[k]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-900/85 border border-green-900/30 rounded-2xl p-4 backdrop-blur">
                <div className="text-green-400 text-xs font-bold tracking-widest mb-3 text-center">SUPPORT</div>
                <div className="space-y-2">
                  {(['S1', 'S2', 'S3', 'S4'] as const).map(k => (
                    <div key={k} className="flex justify-between text-sm">
                      <span className="text-slate-400">{k}:</span>
                      <span className="text-green-300 font-bold">{calculations.gann[k]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function XAUCalculator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  if (!isAuthenticated) return <PasswordScreen onAuthenticate={() => setIsAuthenticated(true)} />;
  return <CalculatorContent />;
}
