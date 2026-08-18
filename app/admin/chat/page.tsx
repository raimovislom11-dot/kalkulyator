'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { chatStore, tradesStore, computeAnalytics, settingsStore } from '../../lib/store';
import type { ChatSession, ChatMessage, Trade } from '../../lib/types';

// ─── Minimal markdown ─────────────────────────────────────────────────────────
function MdText({ content }: { content: string }) {
  const html = content
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-[#aaa]">$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-[#111] text-[#ccc] px-1 py-0.5 rounded text-xs font-mono border border-[#1f1f1f]">$1</code>')
    .replace(/^### (.+)$/gm, '<div class="text-white font-semibold text-sm mt-3 mb-1">$1</div>')
    .replace(/^## (.+)$/gm, '<div class="text-white font-semibold mt-3 mb-1">$1</div>')
    .replace(/^# (.+)$/gm, '<div class="text-white font-semibold text-base mt-3 mb-2">$1</div>')
    .replace(/^- (.+)$/gm, '<div class="ml-3 text-[#888] text-sm">· $1</div>')
    .replace(/\n\n/g, '<div class="h-3"></div>')
    .replace(/\n/g, '<br/>');
  return <div className="text-[#888] text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
}

// ─── Message ──────────────────────────────────────────────────────────────────
function Msg({ msg, streaming }: { msg: ChatMessage; streaming?: boolean }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-6 h-6 rounded flex-shrink-0 flex items-center justify-center text-[10px] font-mono border ${
        isUser ? 'border-[#2a2a2a] text-[#555] bg-[#0f0f0f]' : 'border-[#1f1f1f] text-[#444] bg-black'
      }`}>
        {isUser ? 'U' : 'AI'}
      </div>
      <div className={`max-w-[80%] rounded-lg px-4 py-3 border text-sm ${
        isUser ? 'bg-[#0f0f0f] border-[#1f1f1f] text-white ml-auto' : 'bg-black border-[#1a1a1a]'
      }`}>
        {isUser
          ? <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          : <MdText content={msg.content} />
        }
        {streaming && <span className="inline-block w-1 h-3.5 bg-[#444] animate-pulse ml-0.5 align-middle" />}
        <div className="text-[#2a2a2a] text-[10px] mt-2 font-mono">
          {new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

// ─── Session item ─────────────────────────────────────────────────────────────
function SessionItem({ s, active, onSelect, onDelete }: {
  s: ChatSession; active: boolean; onSelect: () => void; onDelete: () => void;
}) {
  return (
    <div onClick={onSelect}
      className={`group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
        active ? 'bg-white text-black' : 'hover:bg-[#0f0f0f] text-[#666]'
      }`}>
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-medium truncate ${active ? 'text-black' : 'text-[#888]'}`}>{s.title}</div>
        <div className={`text-[10px] mt-0.5 ${active ? 'text-[#555]' : 'text-[#333]'}`}>
          {s.messages.length} msgs
        </div>
      </div>
      <button onClick={e => { e.stopPropagation(); onDelete(); }}
        className={`opacity-0 group-hover:opacity-100 text-[10px] transition-all ${active ? 'text-[#555] hover:text-black' : 'text-[#333] hover:text-[#666]'}`}>
        ✕
      </button>
    </div>
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
    const context = trades.length > 0 ? `Deposit: ${s.deposit}$, Risk: ${s.riskPercentage}%\nWin Rate: ${a.winRate.toFixed(1)}%, Trades: ${a.totalTrades}, P&L: ${a.totalProfitUSD}$` : '';

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
          if (!line.startsWith('data: ')) continue;
          const p = line.slice(6).trim();
          if (p === '[DONE]') { done = true; break; }
          try { const parsed = JSON.parse(p); if (parsed.text) { content += parsed.text; setStreaming(content); } if (parsed.error) { setError(parsed.error); done = true; } } catch { /* skip */ }
        }
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Connection error'); }
    finally {
      if (content && sid) { chatStore.addMessage(sid, { role: 'assistant', content }); loadSessions(); }
      setLoading(false); setStreaming('');
    }
  };

  if (!mounted) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border border-[#333] border-t-white rounded-full animate-spin" />
    </div>
  );

  const msgs = active?.messages ?? [];

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-3">
      {/* Sidebar */}
      <div className={`${sidebar ? 'w-56 flex-shrink-0' : 'w-0 overflow-hidden'} transition-all duration-200 flex flex-col`}>
        <div className="flex flex-col h-full border border-[#1f1f1f] rounded-lg overflow-hidden">
          <div className="p-2 border-b border-[#1f1f1f]">
            <button onClick={newSession}
              className="w-full py-2 bg-white text-black text-xs font-medium rounded-md hover:bg-[#e0e0e0] transition-colors">
              + New chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {sessions.length === 0 && <div className="text-[#333] text-xs text-center py-6">No sessions</div>}
            {sessions.map(s => (
              <SessionItem key={s.id} s={s} active={s.id === activeId}
                onSelect={() => { setActiveId(s.id); chatStore.setActiveSession(s.id); }}
                onDelete={() => { chatStore.deleteSession(s.id); loadSessions(); }} />
            ))}
          </div>
          {sessions.length > 0 && (
            <div className="p-2 border-t border-[#111]">
              <button onClick={() => { if (confirm('Clear all?')) { chatStore.clearAll(); loadSessions(); setActiveId(null); } }}
                className="w-full py-1.5 text-[#333] hover:text-[#666] text-xs transition-colors">
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col border border-[#1f1f1f] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-12 border-b border-[#1f1f1f] flex-shrink-0">
          <button onClick={() => setSidebar(v => !v)} className="text-[#333] hover:text-white transition-colors text-xs">
            {sidebar ? '◀' : '▶'}
          </button>
          <div className="w-5 h-5 border border-[#2a2a2a] rounded flex items-center justify-center">
            <span className="text-[#555] text-[9px] font-mono">AI</span>
          </div>
          <div className="text-sm font-medium text-white">Claude</div>
          <div className="text-[#333] text-xs">{active ? `${msgs.length} messages` : 'No session'}</div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#333] bg-white" />
            <span className="text-[#444] text-[10px]">online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#1f1f1f transparent' }}>
          {!active ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 border border-[#1f1f1f] rounded-lg flex items-center justify-center mb-4">
                <span className="text-[#333] text-sm font-mono">AI</span>
              </div>
              <div className="text-white text-sm font-medium mb-1">AI Chat with history</div>
              <div className="text-[#444] text-xs max-w-xs">Ask questions about XAU/USD trading, analyze strategies, attach chart screenshots</div>
              <button onClick={newSession}
                className="mt-6 px-5 py-2.5 bg-white text-black text-sm font-medium rounded-md hover:bg-[#e0e0e0] transition-colors">
                Start chat
              </button>
            </div>
          ) : msgs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="text-white text-sm font-medium mb-1">New conversation</div>
              <div className="text-[#444] text-xs mb-6">Ask a question or attach a chart</div>
              <div className="space-y-2 w-full max-w-xs">
                {['Analyze my Win Rate', 'Explain Order Block strategy', 'How to improve risk management?'].map(q => (
                  <button key={q} onClick={() => setInput(q)}
                    className="w-full text-left px-4 py-2.5 border border-[#1f1f1f] rounded-md text-[#555] text-xs hover:text-white hover:border-[#333] transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {msgs.map((m, i) => (
                <Msg key={m.id} msg={m}
                  streaming={loading && i === msgs.length - 1 && m.role === 'user' && !streaming} />
              ))}
              {loading && streaming && (
                <Msg msg={{ id: 's', role: 'assistant', content: streaming, timestamp: new Date().toISOString() }} streaming />
              )}
              {loading && !streaming && (
                <div className="flex gap-3">
                  <div className="w-6 h-6 border border-[#1f1f1f] rounded flex items-center justify-center text-[10px] font-mono text-[#444]">AI</div>
                  <div className="border border-[#1a1a1a] rounded-lg px-4 py-3 flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1 h-1 rounded-full bg-[#333] animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              {error && (
                <div className="border border-[#2a2a2a] rounded-md px-4 py-3 text-[#555] text-xs">Error: {error}</div>
              )}
            </>
          )}
          <div ref={endRef} />
        </div>

        {/* Image previews */}
        {images.length > 0 && (
          <div className="px-4 pt-2 flex gap-2 flex-wrap border-t border-[#111]">
            {images.map((im, i) => (
              <div key={i} className="relative group">
                <img src={im.preview} alt="" className="w-12 h-12 rounded object-cover border border-[#1f1f1f]" />
                <button onClick={() => setImages(p => p.filter((_, idx) => idx !== i))}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-[#1f1f1f] border border-[#333] rounded-full text-[#555] text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 hover:text-white transition-all">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t border-[#1f1f1f]"
          onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files.length) addImages(e.dataTransfer.files); }}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}>
          <div className={`flex gap-2 border rounded-md px-3 py-2 transition-colors ${dragging ? 'border-[#333]' : 'border-[#1f1f1f] focus-within:border-[#2a2a2a]'}`}>
            <button onClick={() => fileRef.current?.click()}
              className="text-[#333] hover:text-[#666] transition-colors text-sm flex-shrink-0 self-end mb-0.5">
              ⊕
            </button>
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(); }}
              disabled={loading} placeholder="Message... (Ctrl+Enter to send)"
              rows={2} className="flex-1 bg-transparent text-white text-sm placeholder-[#333] focus:outline-none resize-none py-0.5"
              style={{ scrollbarWidth: 'none' }} />
            <button onClick={send} disabled={loading || (!input.trim() && images.length === 0)}
              className={`flex-shrink-0 self-end mb-0.5 px-3 py-1 rounded text-sm font-medium transition-colors ${
                loading || (!input.trim() && images.length === 0)
                  ? 'text-[#222] cursor-not-allowed'
                  : 'text-white hover:text-[#aaa]'
              }`}>
              {loading
                ? <span className="inline-block w-3 h-3 border border-[#333] border-t-[#666] rounded-full animate-spin" />
                : '↑'}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => e.target.files && addImages(e.target.files)} />
        </div>
      </div>
    </div>
  );
}
