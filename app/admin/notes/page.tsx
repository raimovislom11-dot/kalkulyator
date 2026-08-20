'use client';

import { useState, useEffect } from 'react';
import { notesStore } from '../../lib/store';
import type { Note } from '../../lib/types';

const MOODS = [
  { key: 'great',   emoji: '🚀', label: 'Great',   color: '#34d399' },
  { key: 'good',    emoji: '📈', label: 'Good',    color: '#34d399' },
  { key: 'neutral', emoji: '➡️', label: 'Neutral', color: '#fbbf24' },
  { key: 'bad',     emoji: '📉', label: 'Bad',     color: '#f87171' },
  { key: 'terrible',emoji: '💥', label: 'Terrible',color: '#f87171' },
] as const;

const SESSIONS = [
  { key: 'london',   label: 'London' },
  { key: 'new-york', label: 'New York' },
  { key: 'asian',    label: 'Asian' },
  { key: 'other',    label: 'Other' },
] as const;

const PRESET_TAGS = ['XAU/USD', 'BUY', 'SELL', 'WIN', 'LOSS', 'Order Block', 'IFVG', 'SMT', 'Psychology', 'Risk'];

const inputCls = 'w-full px-3 py-2.5 rounded-xl text-white text-sm focus:outline-none transition-all duration-200 placeholder:text-white/20';
const inputStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' };
const labelCls = 'text-[10px] font-semibold uppercase tracking-widest mb-1.5 block';

// ─── Note Modal ───────────────────────────────────────────────────────────────
function NoteModal({ note, onSave, onClose }: {
  note?: Note | null;
  onSave: (d: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: note?.title ?? '',
    content: note?.content ?? '',
    tags: note?.tags ?? [] as string[],
    mood: note?.mood as Note['mood'],
    session: note?.session as Note['session'],
  });
  const [tagInput, setTagInput] = useState('');

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !form.tags.includes(t)) setForm(p => ({ ...p, tags: [...p.tags, t] }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      role="dialog"
      aria-modal="true"
      aria-label={note ? 'Edit note' : 'New note'}
    >
      <div
        className="w-full max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(145deg, #0e0e1a 0%, #0a0a14 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Modal header */}
        <div
          className="sticky top-0 flex items-center justify-between px-6 py-4 z-10"
          style={{
            background: 'rgba(14,14,26,0.95)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <h2 className="text-base font-bold text-white">{note ? 'Edit note' : 'New journal entry'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className={labelCls} style={{ color: 'rgba(255,255,255,0.35)' }} htmlFor="note-title">Title</label>
            <input
              id="note-title"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className={inputCls}
              style={inputStyle}
              placeholder="Trading day, pattern, observation..."
            />
          </div>

          {/* Mood */}
          <div>
            <p className={labelCls} style={{ color: 'rgba(255,255,255,0.35)' }}>Mood</p>
            <div className="flex gap-2">
              {MOODS.map(m => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, mood: p.mood === m.key ? undefined : m.key }))}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-200"
                  style={
                    form.mood === m.key
                      ? { background: `${m.color}18`, border: `1px solid ${m.color}40`, color: m.color }
                      : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)' }
                  }
                  aria-pressed={form.mood === m.key}
                >
                  <span className="text-base">{m.emoji}</span>
                  <span className="text-[10px] font-semibold">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Session */}
          <div>
            <p className={labelCls} style={{ color: 'rgba(255,255,255,0.35)' }}>Trading session</p>
            <div className="grid grid-cols-4 gap-2">
              {SESSIONS.map(s => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, session: p.session === s.key ? undefined : s.key }))}
                  className="py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                  style={
                    form.session === s.key
                      ? {
                          background: 'rgba(99,102,241,0.15)',
                          border: '1px solid rgba(99,102,241,0.3)',
                          color: '#818cf8',
                        }
                      : {
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.07)',
                          color: 'rgba(255,255,255,0.4)',
                        }
                  }
                  aria-pressed={form.session === s.key}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className={labelCls} style={{ color: 'rgba(255,255,255,0.35)' }} htmlFor="note-content">Content</label>
            <textarea
              id="note-content"
              value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              rows={7}
              className={`${inputCls} resize-none font-mono text-sm leading-relaxed`}
              style={inputStyle}
              placeholder="Market observations, patterns, what worked, what didn't..."
            />
          </div>

          {/* Tags */}
          <div>
            <p className={labelCls} style={{ color: 'rgba(255,255,255,0.35)' }}>Tags</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {PRESET_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200"
                  style={
                    form.tags.includes(tag)
                      ? { background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }
                      : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.35)' }
                  }
                  aria-pressed={form.tags.includes(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { addTag(tagInput); setTagInput(''); } }}
                className={`${inputCls} flex-1`}
                style={inputStyle}
                placeholder="Custom tag..."
                aria-label="Add custom tag"
              />
              <button
                type="button"
                onClick={() => { addTag(tagInput); setTagInput(''); }}
                className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.5)',
                }}
                aria-label="Add tag"
              >
                +
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map(tag => (
                  <span
                    key={tag}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-medium"
                    style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }))}
                      className="transition-colors hover:text-white"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(form)}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                color: 'white',
              }}
            >
              {note ? 'Save changes' : 'Create note'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Note Card ────────────────────────────────────────────────────────────────
function NoteCard({ note, onEdit, onDelete }: { note: Note; onEdit: () => void; onDelete: () => void }) {
  const mood = MOODS.find(m => m.key === note.mood);
  const session = SESSIONS.find(s => s.key === note.session);

  return (
    <article
      className="rounded-2xl p-5 group transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
      }}
    >
      <header className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {mood && (
              <span className="text-base" aria-label={`Mood: ${mood.label}`}>{mood.emoji}</span>
            )}
            <h3 className="text-sm font-semibold text-white truncate">{note.title || 'Untitled'}</h3>
          </div>
          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {new Date(note.createdAt).toLocaleDateString('ru-RU')}
            {session && <span> · {session.label}</span>}
          </p>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-3 flex-shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="text-xs font-medium px-2.5 py-1 rounded-lg transition-all"
            style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}
            aria-label="Edit note"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-xs font-medium px-2.5 py-1 rounded-lg transition-all"
            style={{ background: 'rgba(248,113,113,0.07)', color: '#f87171', border: '1px solid rgba(248,113,113,0.15)' }}
            aria-label="Delete note"
          >
            Del
          </button>
        </div>
      </header>

      {note.content && (
        <p
          className="text-xs leading-relaxed font-mono whitespace-pre-wrap line-clamp-4"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          {note.content}
        </p>
      )}

      {note.tags.length > 0 && (
        <footer className="flex flex-wrap gap-1.5 mt-3">
          {note.tags.map(tag => (
            <span
              key={tag}
              className="px-2.5 py-0.5 rounded-md text-[10px] font-medium"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', color: '#a5b4fc' }}
            >
              {tag}
            </span>
          ))}
        </footer>
      )}
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('');

  const load = () => setNotes(notesStore.getAll());
  useEffect(() => { setMounted(true); load(); }, []);

  const allTags = [...new Set(notes.flatMap(n => n.tags))];
  const filtered = notes.filter(n => {
    const ms = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
    const mt = !filterTag || n.tags.includes(filterTag);
    return ms && mt;
  });

  const handleSave = (data: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editNote) notesStore.update(editNote.id, data);
    else notesStore.add(data);
    load();
    setShowModal(false);
    setEditNote(null);
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Journal</h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {notes.length} entries · Trading diary
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditNote(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
            color: 'white',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12l7-7 7 7"/>
          </svg>
          New note
        </button>
      </header>

      {/* Search & filter */}
      <section aria-label="Search and filter" className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-40 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
            style={{ color: 'rgba(255,255,255,0.2)' }}
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-white text-sm focus:outline-none transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            aria-label="Search notes"
          />
        </div>
        {allTags.length > 0 && (
          <select
            value={filterTag}
            onChange={e => setFilterTag(e.target.value)}
            className="px-3 py-2.5 rounded-xl text-sm focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
            aria-label="Filter by tag"
          >
            <option value="">All tags</option>
            {allTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </section>

      {/* Notes grid / Empty */}
      {filtered.length === 0 ? (
        <section
          className="rounded-2xl p-16 text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
            aria-hidden="true"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <h2 className="text-white text-base font-bold mb-2">No notes</h2>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Keep a trading diary to track patterns and psychology
          </p>
          <button
            type="button"
            onClick={() => { setEditNote(null); setShowModal(true); }}
            className="px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              color: 'white',
            }}
          >
            Create first note
          </button>
        </section>
      ) : (
        <section aria-label="Notes grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={() => { setEditNote(note); setShowModal(true); }}
                onDelete={() => { if (confirm('Delete?')) { notesStore.remove(note.id); load(); } }}
              />
            ))}
          </div>
        </section>
      )}

      {showModal && (
        <NoteModal
          note={editNote}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditNote(null); }}
        />
      )}
    </div>
  );
}
