'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  loadUsers,
  fetchUsersFromBackend,
  addUser,
  removeUser,
  formatActiveTime,
  formatDate,
  AppUser,
} from '../../lib/users';

// ─── Add User Modal ───────────────────────────────────────────────────────────
function AddUserModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAdd = async () => {
    setError('');
    setSuccess('');
    if (!login.trim() || !password.trim()) {
      setError("Login va parol bo'sh bo'lmasligi kerak!");
      return;
    }
    if (login.trim().length < 3) {
      setError('Login kamida 3 ta belgi bo\'lishi kerak!');
      return;
    }
    if (password.trim().length < 3) {
      setError('Parol kamida 3 ta belgi bo\'lishi kerak!');
      return;
    }
    const result = await addUser(login.trim(), password.trim());
    if (!result.ok) {
      setError(result.error || 'Xatolik yuz berdi');
      return;
    }
    setSuccess(`✓ "${login.trim()}" muvaffaqiyatli yaratildi!`);
    setLogin('');
    setPassword('');
    onSuccess();
    setTimeout(() => {
      setSuccess('');
      onClose();
    }, 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Add new user"
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{
          background: 'linear-gradient(145deg, #0e0e1a 0%, #0a0a14 100%)',
          border: '1px solid rgba(99,102,241,0.3)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 40px rgba(99,102,241,0.08)',
        }}
      >
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
          }}
          aria-hidden="true"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
            <line x1="12" y1="14" x2="12" y2="20"/>
            <line x1="9" y1="17" x2="15" y2="17"/>
          </svg>
        </div>

        <h2 className="text-white text-lg font-bold text-center mb-1">Yangi foydalanuvchi</h2>
        <p className="text-center text-xs mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Login va parol kiriting. Foydalanuvchi saytga kirish imkoniga ega bo'ladi.
        </p>

        <div className="space-y-3">
          <div>
            <label
              htmlFor="new-user-login"
              className="text-[10px] font-semibold uppercase tracking-widest mb-1.5 block"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              Login
            </label>
            <input
              id="new-user-login"
              type="text"
              value={login}
              onChange={e => { setLogin(e.target.value); setError(''); }}
              placeholder="masalan: trader01"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
              className="w-full px-4 py-3 rounded-xl text-white text-sm font-semibold focus:outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="new-user-password"
              className="text-[10px] font-semibold uppercase tracking-widest mb-1.5 block"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              Parol
            </label>
            <input
              id="new-user-password"
              type="text"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="masalan: pass123"
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
              className="w-full px-4 py-3 rounded-xl text-white text-sm font-semibold focus:outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
          </div>

          {error && (
            <div
              className="px-4 py-3 rounded-xl text-xs font-semibold"
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}
              role="alert"
            >
              ⚠ {error}
            </div>
          )}
          {success && (
            <div
              className="px-4 py-3 rounded-xl text-xs font-semibold"
              style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399' }}
              role="status"
            >
              {success}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                color: 'white',
              }}
            >
              Yaratish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── User Row ─────────────────────────────────────────────────────────────────
function UserRow({
  user,
  deleteConfirm,
  visiblePassword,
  onTogglePassword,
  onDelete,
}: {
  user: AppUser;
  deleteConfirm: boolean;
  visiblePassword: boolean;
  onTogglePassword: () => void;
  onDelete: () => void;
}) {
  const isAdmin = user.role === 'admin';
  return (
    <tr
      className="group transition-colors duration-150 hover:bg-white/[0.02]"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
    >
      {/* Avatar + login */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={
              isAdmin
                ? { background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }
                : { background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }
            }
            aria-hidden="true"
          >
            {user.username.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-semibold text-white">{user.username}</span>
        </div>
      </td>

      {/* Password */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {visiblePassword ? user.password : '••••••'}
          </span>
          <button
            type="button"
            onClick={onTogglePassword}
            className="text-sm transition-colors hover:opacity-80"
            title={visiblePassword ? "Yashirish" : "Ko'rsatish"}
            aria-label={visiblePassword ? "Hide password" : "Show password"}
          >
            {visiblePassword ? '🙈' : '👁️'}
          </button>
        </div>
      </td>

      {/* Role */}
      <td className="px-5 py-3.5">
        <span
          className="text-[10px] font-bold px-2.5 py-1 rounded-full"
          style={
            isAdmin
              ? { background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }
              : { background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }
          }
        >
          {isAdmin ? '👑 Admin' : '👤 User'}
        </span>
      </td>

      {/* Created */}
      <td className="px-5 py-3.5 text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
        {formatDate(user.createdAt)}
      </td>

      {/* Last login */}
      <td className="px-5 py-3.5 text-[11px] font-mono">
        {user.lastLoginAt ? (
          <span style={{ color: '#34d399' }}>{formatDate(user.lastLoginAt)}</span>
        ) : (
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>Hali kirmagan</span>
        )}
      </td>

      {/* Active time */}
      <td className="px-5 py-3.5">
        <span className="text-xs font-bold font-mono" style={{ color: '#fbbf24' }}>
          {formatActiveTime(user.totalActiveMinutes)}
        </span>
      </td>

      {/* Tokens */}
      <td className="px-5 py-3.5">
        <span className="text-xs font-bold font-mono" style={{ color: '#a78bfa' }}>
          {user.tokensUsed.toLocaleString()}
        </span>
      </td>

      {/* Actions */}
      <td className="px-5 py-3.5">
        {!isAdmin ? (
          <button
            type="button"
            onClick={onDelete}
            className="text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
            title={deleteConfirm ? "Tasdiqlash uchun yana bosing" : "O'chirish"}
            style={
              deleteConfirm
                ? { background: 'rgba(248,113,113,0.25)', color: '#f87171', border: '1px solid rgba(248,113,113,0.4)', animation: 'pulse 1s infinite' }
                : { background: 'rgba(248,113,113,0.07)', color: '#f87171', border: '1px solid rgba(248,113,113,0.15)' }
            }
            aria-label={deleteConfirm ? "Confirm delete" : `Delete ${user.username}`}
          >
            {deleteConfirm ? '⚠ Tasdiq?' : '🗑 O\'chir'}
          </button>
        ) : (
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>
        )}
      </td>
    </tr>
  );
}

// ─── Users Page ───────────────────────────────────────────────────────────────
export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const refresh = useCallback(() => {
    fetchUsersFromBackend().then(setUsers);
  }, []);

  useEffect(() => {
    setMounted(true);
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  const handleDelete = async (username: string) => {
    if (deleteConfirm === username) {
      await removeUser(username);
      setDeleteConfirm(null);
      refresh();
    } else {
      setDeleteConfirm(username);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const togglePassword = (username: string) => {
    setVisiblePasswords(prev => ({ ...prev, [username]: !prev[username] }));
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

  const totalTokens = users.reduce((s, u) => s + u.tokensUsed, 0);
  const totalMinutes = users.reduce((s, u) => s + u.totalActiveMinutes, 0);
  const activeUsers = users.filter(u => u.lastLoginAt).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Foydalanuvchilar</h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {users.length} ta ro'yxatda · Har 5 soniyada yangilanadi
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setShowModal(true); }}
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
          Yangi user
        </button>
      </header>

      {/* Stats */}
      <section aria-label="User statistics">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: 'Jami foydalanuvchilar',
              value: users.length.toString(),
              accent: '#818cf8',
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              ),
            },
            {
              label: 'Faol foydalanuvchilar',
              value: activeUsers.toString(),
              accent: '#34d399',
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              ),
            },
            {
              label: 'Jami faol vaqt',
              value: formatActiveTime(totalMinutes),
              accent: '#fbbf24',
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              ),
            },
            {
              label: 'Jami tokenlar',
              value: totalTokens.toLocaleString(),
              accent: '#a78bfa',
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2"/>
                  <path d="M8 21h8M12 17v4"/>
                </svg>
              ),
            },
          ].map(card => (
            <article
              key={card.label}
              className="rounded-2xl p-5 relative overflow-hidden group transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
              }}
            >
              <div
                className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-15 group-hover:opacity-25 transition-opacity"
                style={{ background: card.accent }}
                aria-hidden="true"
              />
              <div className="flex items-start justify-between mb-3">
                <span style={{ color: card.accent, opacity: 0.6 }} aria-hidden="true">
                  {card.icon}
                </span>
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">{card.value}</div>
              <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{card.label}</div>
            </article>
          ))}
        </div>
      </section>

      {/* Users table */}
      <section
        aria-label="Users table"
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <header
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.2)' }}
              aria-hidden="true"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Ro'yxat</h2>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{users.length} ta foydalanuvchi</p>
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 text-[10px]"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#22c55e' }}
              aria-hidden="true"
            />
            Jonli yangilanish
          </div>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Login', 'Parol', 'Rol', 'Yaratilgan', 'So\'nggi kirish', 'Faol vaqt', 'Tokenlar', 'Amal'].map(h => (
                  <th
                    key={h}
                    className="px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: 'rgba(255,255,255,0.25)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <UserRow
                  key={user.username}
                  user={user}
                  deleteConfirm={deleteConfirm === user.username}
                  visiblePassword={!!visiblePasswords[user.username]}
                  onTogglePassword={() => togglePassword(user.username)}
                  onDelete={() => handleDelete(user.username)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showModal && (
        <AddUserModal
          onClose={() => setShowModal(false)}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
