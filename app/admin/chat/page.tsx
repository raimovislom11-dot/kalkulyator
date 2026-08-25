'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { chatStore, tradesStore, computeAnalytics, settingsStore } from '../../lib/store';
import type { ChatSession, ChatMessage, Trade } from '../../lib/types';

// ─── Markdown renderer ────────────────────────────────────────────────────────
function MdText({ content }: { content: string }) {
  const html = content
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:white;font-weight:600">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="color:rgba(255,255,255,0.7)">$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:rgba(99,102,241,0.12);color:#a5b4fc;padding:1px 6px;border-radius:4px;font-size:12px;font-family:monospace;border:1px solid rgba(99,102,241,0.2)">$1</code>')
    .replace(/^### (.+)$/gm, '<div style="color:white;font-weight:600;font-size:13px;margin-top:12px;margin-bottom:4px">$1</div>')
    .replace(/^## (.+)$/gm, '<div style="color:white;font-weight:700;margin-top:12px;margin-bottom:4px">$1</div>')
    .replace(/^# (.+)$/gm, '<div style="color:white;font-weight:700;font-size:15px;margin-top:16px;margin-bottom:6px">$1</div>')
    .replace(/^- (.+)$/gm, '<div style="margin-left:12px;color:rgba(255,255,255,0.6);font-size:13px;line-height:1.6">· $1</div>')
    .replace(/\n\n/g, '<div style="height:10px"></div>')
    .replace(/\n/g, '<br/>');
  return (
    <div
      className="text-sm leading-relaxed"
      style={{ color: 'rgba(255,255,255,0.6)' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function Msg({ msg, streaming }: { msg: ChatMessage; streaming?: boolean }) {
  const isUser = msg.role === 'user';
  return (
    <article className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
        style={
          isUser
            ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }
            : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }
        }
        aria-hidden="true"
      >
        {isUser ? 'U' : 'AI'}
      </div>
      <div
        className="max-w-[80%] rounded-2xl px-4 py-3"
        style={
          isUser
            ? {
                background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))',
                border: '1px solid rgba(99,102,241,0.25)',
              }
            : {
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
              }
        }
      >
        {isUser
          ? <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          : <MdText content={msg.content} />
        }
        {streaming && (
          <span
            className="inline-block w-1 h-3.5 rounded-full animate-pulse ml-0.5 align-middle"
            style={{ background: '#818cf8' }}
          />
        )}
        <time
          className="block text-[10px] mt-2 font-mono"
          style={{ color: 'rgba(255,255,255,0.2)' }}
          dateTime={msg.timestamp}
        >
          {new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
        </time>
      </div>
    </article>
  );
}

// ─── Session item ─────────────────────────────────────────────────────────────
function SessionItem({ s, active, onSelect, onDelete }: {
  s: ChatSession; active: boolean; onSelect: () => void; onDelete: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 text-left group"
        style={
          active
            ? {
                background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
                border: '1px solid rgba(99,102,241,0.2)',
                color: 'white',
              }
            : {
                background: 'transparent',
                border: '1px solid transparent',
                color: 'rgba(255,255,255,0.4)',
              }
        }
        aria-pressed={active}
      >
        <div className="flex-1 min-w-0 text-left">
          <div className="text-xs font-semibold truncate" style={{ color: active ? 'white' : 'rgba(255,255,255,0.6)' }}>
            {s.title}
          </div>
          <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {s.messages.length} messages
          </div>
        </div>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all hover:bg-white/5"
          style={{ color: 'rgba(255,255,255,0.3)' }}
          aria-label="Delete session"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </button>
    </li>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [dragging, setDragging] = useState(false);
  const [sidebar, setSidebar] = useState(true);
  const [mounted, setMounted] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const loadSessions = () => {
    const s = chatStore.getSessions();
    const aid = chatStore.getActiveSessionId();
    setSessions(s);
    setActiveId(prev => prev ?? aid ?? s[0]?.id ?? null);
  };

  useEffect(() => { setMounted(true); loadSessions(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [streaming, activeId]);

  const active = sessions.find(s => s.id === activeId) ?? null;

  const newSession = () => {
    const s = chatStore.createSession();
    loadSessions();
    setActiveId(s.id);
  };

  const addImages = useCallback((files: FileList | File[]) => {
    Array.from(files).filter(f => f.type.startsWith('image/')).forEach(file => {
      const r = new FileReader();
      r.onload = e => setImages(prev => {
        if (prev.some(im => im.file.name === file.name && im.file.size === file.size)) return prev;
        return [...prev, { file, preview: e.target?.result as string }];
      });
      r.readAsDataURL(file);
    });
  }, []);

  const send = async () => {
    if ((!input.trim() && images.length === 0) || loading) return;
    let sid = activeId;
    if (!sid) { const s = chatStore.createSession(); sid = s.id; loadSessions(); setActiveId(sid); }
    const text = input.trim() || 'Analyze these images.';
    chatStore.addMessage(sid, { role: 'user', content: text });
    loadSessions();
    setInput('');
    setLoading(true);
    setStreaming('');
    setError(null);

    const trades: Trade[] = tradesStore.getAll();
    const s = settingsStore.get();
    const a = computeAnalytics(trades, s.deposit);
    const context = trades.length > 0
      ? `Deposit: ${s.deposit}$, Risk: ${s.riskPercentage}%\nWin Rate: ${a.winRate.toFixed(1)}%, Trades: ${a.totalTrades}, P&L: ${a.totalProfitUSD}$`
      : '';

    const history = (sessions.find(ses => ses.id === sid)?.messages ?? [])
      .concat([{ id: '', role: 'user' as const, content: text, timestamp: new Date().toISOString() }])
      .map(m => ({ role: m.role, content: m.content }));

    const form = new FormData();
    form.append('messages', JSON.stringify(history));
    form.append('lastMessage', text);
    form.append('context', context);
    form.append('imageCount', String(images.length));
    images.forEach((im, i) => form.append(`image_${i}`, im.file));
    setImages([]);

    let content = '';
    try {
      const res = await fetch('/admin/api/chat', { method: 'POST', body: form });
      if (!res.ok) throw new Error(await res.text());
      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let buf = '', done = false;
      while (!done) {
        const { done: sd, value } = await reader.read();
        if (sd) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n'); buf = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const p = trimmed.replace(/^data:\s*/, '').trim();
          if (p === '[DONE]') { done = true; break; }
          try {
            const parsed = JSON.parse(p);
            if (parsed.text) { content += parsed.text; setStreaming(content); }
            if (parsed.error) { setError(parsed.error); done = true; }
          } catch { /* skip */ }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection error');
    } finally {
      if (content && sid) { chatStore.addMessage(sid, { role: 'assistant', content }); loadSessions(); }
      setLoading(false); setStreaming('');
    }
  };

  if (!mounted) {
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

  const msgs = active?.messages ?? [];

  return (
    <div className="h-[calc(100vh-9rem)] flex gap-4">
      {/* Sessions sidebar */}
      <aside
        className={`${sidebar ? 'w-56 flex-shrink-0' : 'w-0 overflow-hidden'} transition-all duration-300 flex flex-col`}
        aria-label="Chat sessions"
      >
        <div
          className="flex flex-col h-full rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="p-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              type="button"
              onClick={newSession}
              className="w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                color: 'white',
              }}
            >
              + New chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: 'none' }}>
            {sessions.length === 0 && (
              <p className="text-center py-6 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                No sessions yet
              </p>
            )}
            <ul className="space-y-0.5">
              {sessions.map(s => (
                <SessionItem
                  key={s.id}
                  s={s}
                  active={s.id === activeId}
                  onSelect={() => { setActiveId(s.id); chatStore.setActiveSession(s.id); }}
                  onDelete={() => { chatStore.deleteSession(s.id); loadSessions(); }}
                />
              ))}
            </ul>
          </div>
          {sessions.length > 0 && (
            <div className="p-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button
                type="button"
                onClick={() => { if (confirm('Clear all?')) { chatStore.clearAll(); loadSessions(); setActiveId(null); } }}
                className="w-full py-2 rounded-xl text-xs font-medium transition-all duration-200"
                style={{ color: 'rgba(248,113,113,0.5)' }}
              >
                Clear all sessions
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Chat area */}
      <div
        className="flex-1 flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Chat header */}
        <header
          className="flex items-center gap-3 px-4 h-14 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button
            type="button"
            onClick={() => setSidebar(v => !v)}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            aria-label={sidebar ? 'Collapse session sidebar' : 'Expand session sidebar'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {sidebar ? <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/> : <path d="M13 17l5-5-5-5M6 17l5-5-5-5"/>}
            </svg>
          </button>

          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.2)' }}
            aria-hidden="true"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>

          <div>
            <div className="text-sm font-bold text-white">Claude AI</div>
            <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {active ? `${msgs.length} messages` : 'No active session'}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.7)' }}
              aria-hidden="true"
            />
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>online</span>
          </div>
        </header>

        {/* Messages area */}
        <div
          className="flex-1 overflow-y-auto p-5 space-y-5"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
        >
          {!active ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
                  border: '1px solid rgba(99,102,241,0.2)',
                }}
                aria-hidden="true"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <h2 className="text-white text-base font-bold mb-2">AI Chat with history</h2>
              <p className="text-sm mb-8 max-w-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Ask questions about XAU/USD trading, analyze strategies, attach chart screenshots
              </p>
              <button
                type="button"
                onClick={newSession}
                className="px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                  color: 'white',
                }}
              >
                Start chat
              </button>
            </div>
          ) : msgs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <h2 className="text-white text-sm font-bold mb-2">New conversation</h2>
              <p className="text-xs mb-6" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Ask a question or attach a chart screenshot
              </p>
              <div className="space-y-2 w-full max-w-xs">
                {['Analyze my Win Rate', 'Explain Order Block strategy', 'How to improve risk management?'].map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setInput(q)}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:border-indigo-400/40"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      color: 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {msgs.map((m, i) => (
                <Msg
                  key={m.id}
                  msg={m}
                  streaming={loading && i === msgs.length - 1 && m.role === 'user' && !streaming}
                />
              ))}
              {loading && streaming && (
                <Msg msg={{ id: 's', role: 'assistant', content: streaming, timestamp: new Date().toISOString() }} streaming />
              )}
              {loading && !streaming && (
                <div className="flex gap-3">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
                    aria-hidden="true"
                  >
                    AI
                  </div>
                  <div
                    className="rounded-2xl px-4 py-3 flex gap-1.5 items-center"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                    role="status"
                    aria-label="AI is typing..."
                  >
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ background: '#818cf8', animationDelay: `${i * 0.15}s` }}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                </div>
              )}
              {error && (
                <div
                  className="rounded-xl px-4 py-3 text-sm"
                  style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}
                  role="alert"
                >
                  Error: {error}
                </div>
              )}
            </>
          )}
          <div ref={endRef} />
        </div>

        {/* Image previews */}
        {images.length > 0 && (
          <div
            className="px-4 pt-3 flex gap-2 flex-wrap"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            {images.map((im, i) => (
              <div key={i} className="relative group">
                <img src={im.preview} alt="" className="w-14 h-14 rounded-lg object-cover" style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
                <button
                  type="button"
                  onClick={() => setImages(p => p.filter((_, idx) => idx !== i))}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  style={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.15)', color: '#f87171' }}
                  aria-label="Remove image"
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input area */}
        <div
          className="px-4 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) addImages(e.dataTransfer.files); }}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
        >
          <div
            className="flex gap-3 rounded-xl px-4 py-3 transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${dragging ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
              boxShadow: dragging ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
            }}
          >
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex-shrink-0 self-end mb-0.5 p-1.5 rounded-lg transition-all duration-200 hover:bg-white/5"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              aria-label="Attach image"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </button>

            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(); }}
              disabled={loading}
              placeholder="Message Claude... (Ctrl+Enter to send)"
              rows={2}
              className="flex-1 bg-transparent text-white text-sm placeholder:text-white/20 focus:outline-none resize-none py-0.5"
              style={{ scrollbarWidth: 'none' }}
              aria-label="Message input"
            />

            <button
              type="button"
              onClick={send}
              disabled={loading || (!input.trim() && images.length === 0)}
              className="flex-shrink-0 self-end mb-0.5 p-2 rounded-xl transition-all duration-200"
              style={
                loading || (!input.trim() && images.length === 0)
                  ? { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)', cursor: 'not-allowed' }
                  : { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', boxShadow: '0 2px 8px rgba(99,102,241,0.35)' }
              }
              aria-label="Send message"
            >
              {loading
                ? (
                  <div
                    className="w-4 h-4 rounded-full border-2 border-transparent animate-spin"
                    style={{ borderTopColor: 'rgba(255,255,255,0.5)', borderRightColor: 'rgba(255,255,255,0.5)' }}
                    aria-hidden="true"
                  />
                )
                : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="19" x2="12" y2="5"/>
                    <polyline points="5 12 12 5 19 12"/>
                  </svg>
                )
              }
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => e.target.files && addImages(e.target.files)}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
