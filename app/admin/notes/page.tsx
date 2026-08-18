'use client';

import { useState, useEffect } from 'react';
import { notesStore } from '../../lib/store';
import type { Note } from '../../lib/types';

const MOODS = [
  { key: 'great', emoji: '↑↑', label: 'Great' },
  { key: 'good', emoji: '↑', label: 'Good' },
  { key: 'neutral', emoji: '→', label: 'Neutral' },
  { key: 'bad', emoji: '↓', label: 'Bad' },
  { key: 'terrible', emoji: '↓↓', label: 'Terrible' },
] as const;

const SESSIONS = [
  { key: 'london', label: 'London' },
  { key: 'new-york', label: 'New York' },
  { key: 'asian', label: 'Asian' },
  { key: 'other', label: 'Other' },
] as const;

const PRESET_TAGS = ['XAU/USD', 'BUY', 'SELL', 'WIN', 'LOSS', 'Order Block', 'IFVG', 'SMT', 'Psychology', 'Risk'];

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

  const inp = 'w-full px-3 py-2 bg-black border border-[#1f1f1f] rounded-md text-white text-sm focus:border-[#333] focus:outline-none transition-colors placeholder-[#333]';
  const lbl = 'text-[10px] text-[#444] uppercase tracking-widest mb-1.5 block font-medium';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
      <div className="w-full max-w-xl bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-[#1f1f1f] bg-[#0a0a0a]">
          <div className="text-sm font-medium text-white">{note ? 'Edit note' : 'New note'}</div>
          <button onClick={onClose} className="text-[#444] hover:text-white transition-colors text-sm">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className={lbl}>Title</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className={inp} placeholder="Trading day, pattern, observation..." />
          </div>

          <div>
            <label className={lbl}>Mood</label>
            <div className="flex gap-1.5">
              {MOODS.map(m => (
                <button key={m.key} onClick={() => setForm(p => ({ ...p, mood: p.mood === m.key ? undefined : m.key }))}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-md border text-xs transition-colors ${
                    form.mood === m.key ? 'border-[#333] bg-white text-black' : 'border-[#1f1f1f] text-[#444] hover:border-[#2a2a2a] hover:text-[#888]'
                  }`}>
                  <span className="font-mono">{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={lbl}>Session</label>
            <div className="grid grid-cols-4 gap-1.5">
              {SESSIONS.map(s => (
                <button key={s.key} onClick={() => setForm(p => ({ ...p, session: p.session === s.key ? undefined : s.key }))}
                  className={`py-2 rounded-md border text-xs transition-colors ${
                    form.session === s.key ? 'border-[#333] bg-white text-black font-medium' : 'border-[#1f1f1f] text-[#444] hover:border-[#2a2a2a]'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={lbl}>Content</label>
            <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              rows={8} className={`${inp} resize-none font-mono text-sm leading-relaxed`}
              placeholder="Market observations, patterns, what worked, what didn't..." />
          </div>

          <div>
            <label className={lbl}>Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_TAGS.map(tag => (
                <button key={tag} onClick={() => addTag(tag)}
                  className={`px-2.5 py-1 rounded border text-[11px] transition-colors ${
                    form.tags.includes(tag)
                      ? 'border-[#333] bg-white text-black font-medium'
                      : 'border-[#1f1f1f] text-[#444] hover:border-[#2a2a2a] hover:text-[#888]'
                  }`}>
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { addTag(tagInput); setTagInput(''); } }}
                className={`${inp} flex-1`} placeholder="Custom tag..." />
              <button onClick={() => { addTag(tagInput); setTagInput(''); }}
                className="px-3 py-2 border border-[#1f1f1f] text-[#444] hover:text-white hover:border-[#333] rounded-md text-sm transition-colors">
                +
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-[#0f0f0f] border border-[#1f1f1f] text-[#888] rounded text-[11px]">
                    {tag}
                    <button onClick={() => setForm(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }))}
                      className="hover:text-white transition-colors ml-0.5">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 border border-[#1f1f1f] text-[#555] hover:text-white hover:border-[#333] rounded-md text-sm transition-colors">
              Cancel
            </button>
            <button onClick={() => onSave(form)}
              className="flex-1 py-2.5 bg-white text-black font-medium rounded-md text-sm hover:bg-[#e0e0e0] transition-colors">
              {note ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NoteCard({ note, onEdit, onDelete }: { note: Note; onEdit: () => void; onDelete: () => void }) {
  const mood = MOODS.find(m => m.key === note.mood);
  const session = SESSIONS.find(s => s.key === note.session);
  return (
    <div className="group border border-[#1f1f1f] rounded-lg p-5 hover:border-[#2a2a2a] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {mood && <span className="text-[#333] text-[10px] font-mono">{mood.emoji}</span>}
            <div className="text-sm font-medium text-white truncate">{note.title || 'Untitled'}</div>
          </div>
          <div className="text-[10px] text-[#333] mt-1">
            {new Date(note.createdAt).toLocaleDateString('ru-RU')}
            {session && <span> · {session.label}</span>}
          </div>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-3">
          <button onClick={onEdit} className="text-[#333] hover:text-white text-[10px] transition-colors">Edit</button>
          <button onClick={onDelete} className="text-[#222] hover:text-[#555] text-[10px] transition-colors">Del</button>
        </div>
      </div>
      {note.content && (
        <p className="text-[#555] text-xs leading-relaxed line-clamp-4 font-mono whitespace-pre-wrap">{note.content}</p>
      )}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {note.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 border border-[#1a1a1a] text-[#333] text-[10px] rounded">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

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

  if (!mounted) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-5 h-5 border border-[#333] border-t-white rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-6">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Notes</h1>
          <p className="text-[#555] text-sm mt-0.5">{notes.length} entries</p>
        </div>
        <button onClick={() => { setEditNote(null); setShowModal(true); }}
          className="px-4 py-2 bg-white text-black text-sm font-medium rounded-md hover:bg-[#e0e0e0] transition-colors">
          + New note
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
          className="flex-1 min-w-40 px-3 py-2 bg-black border border-[#1f1f1f] rounded-md text-white text-sm focus:border-[#333] focus:outline-none placeholder-[#333]" />
        {allTags.length > 0 && (
          <select value={filterTag} onChange={e => setFilterTag(e.target.value)}
            className="px-3 py-2 bg-black border border-[#1f1f1f] rounded-md text-[#555] text-sm focus:outline-none">
            <option value="">All tags</option>
            {allTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="border border-dashed border-[#1f1f1f] rounded-lg p-16 text-center">
          <div className="text-[#222] text-3xl mb-4 font-mono">∅</div>
          <div className="text-white text-sm mb-1">No notes</div>
          <div className="text-[#444] text-xs mb-6">Keep a trading diary to track patterns and psychology</div>
          <button onClick={() => { setEditNote(null); setShowModal(true); }}
            className="px-5 py-2.5 bg-white text-black text-sm font-medium rounded-md hover:bg-[#e0e0e0] transition-colors">
            Create first note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(note => (
            <NoteCard key={note.id} note={note}
              onEdit={() => { setEditNote(note); setShowModal(true); }}
              onDelete={() => { if (confirm('Delete?')) { notesStore.remove(note.id); load(); } }} />
          ))}
        </div>
      )}

      {showModal && (
        <NoteModal note={editNote} onSave={handleSave}
          onClose={() => { setShowModal(false); setEditNote(null); }} />
      )}
    </div>
  );
}
