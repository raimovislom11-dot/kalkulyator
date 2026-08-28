'use client';

import { useState, useEffect } from 'react';

export const DEFAULT_BOT_TOKEN = '8878704201:AAEosMGZHutCiAppEISJI4ciQ2wLwXIusUY';
export const DEFAULT_CHAT_ID = '1833182771';

interface TelegramShareProps {
  isOpen: boolean;
  onClose: () => void;
  tradeData: {
    asset: string;
    strategy: string;
    direction: 'BUY' | 'SELL';
    entry: string;
    sl: string;
    tp1: string;
    tp2: string;
    tp3: string;
    rr1?: string;
    rr2?: string;
    rr3?: string;
    lotSize?: string;
    riskDollar?: string;
    notes?: string;
  } | null;
}

const STORAGE_BOT_TOKEN = 'tg_bot_token_config';
const STORAGE_CHAT_ID = 'tg_chat_id_config';
const STORAGE_CUSTOM_CHATS = 'tg_custom_chats_list';

export const formatTelegramMessage = (tradeData: {
  asset: string;
  strategy: string;
  direction: 'BUY' | 'SELL';
  entry: string;
  sl: string;
  tp1: string;
  tp2: string;
  tp3: string;
  rr1?: string;
  rr2?: string;
  rr3?: string;
  lotSize?: string;
  riskDollar?: string;
  notes?: string;
}) => {
  const isBuy = tradeData.direction === 'BUY';
  const emoji = isBuy ? '🟢 BUY' : '🔴 SELL';

  return `📊 *${tradeData.asset} SIGNAL* | ${emoji}
━━━━━━━━━━━━━━━━━━━━
🎯 *Strategiya:* ${tradeData.strategy}
📍 *Entry:* \`${tradeData.entry}\`
🛑 *Stop Loss:* \`${tradeData.sl}\`
${tradeData.lotSize ? `⚖️ *Lot Hajmi:* \`${tradeData.lotSize} lot\` (${tradeData.riskDollar ? `$${tradeData.riskDollar}` : 'Risk'})\n` : ''}
🎯 *TP1:* \`${tradeData.tp1}\` ${tradeData.rr1 ? `(R:R ${tradeData.rr1})` : ''}
🎯 *TP2:* \`${tradeData.tp2}\` ${tradeData.rr2 ? `(R:R ${tradeData.rr2})` : ''}
🎯 *TP3:* \`${tradeData.tp3}\` ${tradeData.rr3 ? `(R:R ${tradeData.rr3})` : ''}
━━━━━━━━━━━━━━━━━━━━
💡 _Risk menejmentga qat'iy amal qiling!_
🤖 _AI Trading Terminal_`;
};

// Send signal to ALL bot users & subscribers via server broadcast
export const sendDirectTelegramMessage = async (tradeData: any): Promise<{ ok: boolean; sentCount?: number; total?: number }> => {
  try {
    const token = (typeof window !== 'undefined' && localStorage.getItem(STORAGE_BOT_TOKEN)) || DEFAULT_BOT_TOKEN;
    const text = formatTelegramMessage(tradeData);
    let extraChats: string[] = [];
    try {
      const storedExtra = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_CUSTOM_CHATS) : null;
      if (storedExtra) extraChats = JSON.parse(storedExtra);
    } catch {}

    const res = await fetch('/api/telegram-broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botToken: token,
        text,
        chatIds: extraChats,
      }),
    });

    const data = await res.json();
    return { ok: data.ok && data.sentCount > 0, sentCount: data.sentCount, total: data.totalSubscribers };
  } catch (err) {
    console.error('sendDirectTelegramMessage error:', err);
    return { ok: false };
  }
};

export default function TelegramShareModal({ isOpen, onClose, tradeData }: TelegramShareProps) {
  const [botToken, setBotToken] = useState(DEFAULT_BOT_TOKEN);
  const [chatId, setChatId] = useState(DEFAULT_CHAT_ID);
  const [customChats, setCustomChats] = useState<string[]>([]);
  const [newChatInput, setNewChatInput] = useState('');
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem(STORAGE_BOT_TOKEN) || DEFAULT_BOT_TOKEN;
      const c = localStorage.getItem(STORAGE_CHAT_ID) || DEFAULT_CHAT_ID;
      const cc = localStorage.getItem(STORAGE_CUSTOM_CHATS);
      setBotToken(t);
      setChatId(c);
      if (cc) setCustomChats(JSON.parse(cc));
    } catch {}

    // Fetch subscriber stats
    fetch(`/api/telegram-broadcast?token=${DEFAULT_BOT_TOKEN}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && typeof d.total === 'number') {
          setSubscriberCount(d.total);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen || !tradeData) return null;

  const messageText = formatTelegramMessage(tradeData);

  const handleSaveConfig = () => {
    try {
      localStorage.setItem(STORAGE_BOT_TOKEN, botToken.trim());
      localStorage.setItem(STORAGE_CHAT_ID, chatId.trim());
      localStorage.setItem(STORAGE_CUSTOM_CHATS, JSON.stringify(customChats));
      setStatusMsg({ text: 'Sozlamalar saqlandi!', isError: false });
      setTimeout(() => setStatusMsg(null), 2500);
      setShowConfig(false);
    } catch {
      setStatusMsg({ text: 'Saqlashda xatolik', isError: true });
    }
  };

  const handleAddCustomChat = () => {
    const trimmed = newChatInput.trim();
    if (!trimmed) return;
    if (!customChats.includes(trimmed)) {
      const updated = [...customChats, trimmed];
      setCustomChats(updated);
      try {
        localStorage.setItem(STORAGE_CUSTOM_CHATS, JSON.stringify(updated));
      } catch {}
    }
    setNewChatInput('');
  };

  const handleRemoveCustomChat = (item: string) => {
    const updated = customChats.filter((c) => c !== item);
    setCustomChats(updated);
    try {
      localStorage.setItem(STORAGE_CUSTOM_CHATS, JSON.stringify(updated));
    } catch {}
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(messageText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShareLink = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent('https://t.me')}&text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
  };

  const handleBroadcastToAll = async () => {
    setIsSending(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/telegram-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: botToken.trim() || DEFAULT_BOT_TOKEN,
          text: messageText,
          chatIds: [chatId.trim(), ...customChats].filter(Boolean),
        }),
      });

      const data = await res.json();

      if (data.ok) {
        setSubscriberCount(data.totalSubscribers);
        setStatusMsg({
          text: `✓ Barcha (${data.sentCount} ta) bot foydalanuvchilariga xabar muvaffaqiyatli yuborildi!`,
          isError: false,
        });
        setTimeout(() => {
          onClose();
          setStatusMsg(null);
        }, 2200);
      } else {
        throw new Error(data.error || 'Xatolik yuz berdi');
      }
    } catch (err) {
      setStatusMsg({
        text: `Xatolik: ${err instanceof Error ? err.message : "Telegramga ulanib bo'lmadi"}`,
        isError: true,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-sky-500/50 rounded-2xl p-4 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg p-1"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">📢</span>
          <div>
            <h3 className="text-sky-400 text-lg font-bold">TELEGRAM TARQATMA (BROADCAST)</h3>
            <p className="text-slate-400 text-xs">
              Botning barcha faol foydalanuvchilariga, guruh va kanallariga bir vaqtda yuborish
            </p>
          </div>
        </div>

        {/* Subscriber Stats Badge */}
        <div className="flex items-center justify-between bg-sky-950/40 border border-sky-500/30 rounded-xl px-4 py-2.5 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 text-xs font-semibold">Bot foydalanuvchilari bazasi:</span>
          </div>
          <span className="text-emerald-400 font-bold font-mono text-sm">
            {subscriberCount !== null ? `${subscriberCount} ta qabul qiluvchi` : 'Faol'}
          </span>
        </div>

        {/* Message Preview */}
        <div className="bg-slate-950/80 border border-slate-700/80 rounded-xl p-4 mb-4">
          <div className="text-slate-500 text-[10px] font-bold tracking-wider mb-2">SIGNAL MATNI KO&apos;RINISHI:</div>
          <pre className="text-xs text-slate-200 font-mono whitespace-pre-wrap break-words leading-relaxed">
            {messageText}
          </pre>
        </div>

        {/* Status Alert */}
        {statusMsg && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs font-bold ${
              statusMsg.isError
                ? 'bg-red-900/40 text-red-300 border border-red-500/50'
                : 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/50'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        {/* Bot Config Drawer */}
        {showConfig ? (
          <div className="bg-slate-800/80 border border-sky-600/40 rounded-xl p-4 mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sky-300 text-xs font-bold">⚙️ BOT VA KANALLAR SOZLAMASI</span>
              <button
                onClick={() => setShowConfig(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Yashirish
              </button>
            </div>

            <div>
              <label className="text-slate-400 text-[11px] font-bold block mb-1">
                TELEGRAM BOT TOKEN
              </label>
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder={DEFAULT_BOT_TOKEN}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-xs font-mono focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[11px] font-bold block mb-1">
                ASOSIY ADMIN CHAT ID / KANAL
              </label>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder={DEFAULT_CHAT_ID}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-xs font-mono focus:border-sky-400 focus:outline-none"
              />
            </div>

            {/* Qo'shimcha kanallar / guruhlar qo'shish */}
            <div>
              <label className="text-slate-400 text-[11px] font-bold block mb-1">
                QO&apos;SHIMCHA KANALLAR / GURUHLAR (@kanal_nomi yoki ID)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newChatInput}
                  onChange={(e) => setNewChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomChat(); }}
                  placeholder="@mening_kanalim yoki -100123456789"
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-xs font-mono focus:border-sky-400 focus:outline-none"
                />
                <button
                  onClick={handleAddCustomChat}
                  className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg"
                >
                  + Qo&apos;shish
                </button>
              </div>

              {customChats.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {customChats.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-sky-300 font-mono"
                    >
                      {c}
                      <button
                        onClick={() => handleRemoveCustomChat(c)}
                        className="text-red-400 hover:text-red-300 font-bold ml-1"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleSaveConfig}
              className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg transition-all"
            >
              ✓ Sozlamalarni saqlash
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-slate-400 mb-4 px-1">
            <span>
              Tarqatish rejimi:{' '}
              <strong className="text-emerald-400 font-mono">Barcha faol foydalanuvchilar</strong>
            </span>
            <button
              onClick={() => setShowConfig(true)}
              className="text-sky-400 hover:underline text-xs"
            >
              ⚙️ Kanal/Guruh qo&apos;shish
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={handleBroadcastToAll}
            disabled={isSending}
            className="py-3 px-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            {isSending ? (
              <span>Yuborilmoqda...</span>
            ) : (
              <>
                <span>📢</span>
                <span>Barchaga yuborish</span>
              </>
            )}
          </button>

          <button
            onClick={handleShareLink}
            className="py-3 px-3 bg-slate-800 hover:bg-slate-700 border border-sky-500/40 text-sky-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <span>🔗</span>
            <span>Ulashish</span>
          </button>

          <button
            onClick={handleCopyText}
            className="py-3 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <span>{copied ? '✓' : '📋'}</span>
            <span>{copied ? 'Nusxalandi!' : 'Nusxalash'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
