'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  fetchUsersFromBackend,
  addUser,
  removeUser,
  formatActiveTime,
  formatDate,
  AppUser,
} from '../lib/users';

export default function AdminPanel() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLogin, setNewLogin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const refresh = useCallback(() => {
    fetchUsersFromBackend().then(setUsers);
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  const totalTokens = users.reduce((s, u) => s + u.tokensUsed, 0);
  const totalMinutes = users.reduce((s, u) => s + u.totalActiveMinutes, 0);

  const handleAddUser = async () => {
    setAddError('');
    setAddSuccess('');
    const loginVal = newLogin.trim();
    const passVal = newPassword.trim();
    if (!loginVal || !passVal) {
      setAddError("Login va parol bo'sh bo'lmasligi kerak!");
      return;
    }
    if (loginVal.length < 3) {
      setAddError('Login kamida 3 ta belgi bolishi kerak!');
      return;
    }
    if (passVal.length < 3) {
      setAddError('Parol kamida 3 ta belgi bolishi kerak!');
      return;
    }
    const result = await addUser(loginVal, passVal);
    if (!result.ok) {
      setAddError(result.error || 'Xatolik yuz berdi');
      return;
    }
    setAddSuccess(`✓ "${loginVal}" foydalanuvchisi muvaffaqiyatli yaratildi!`);
    setNewLogin('');
    setNewPassword('');
    refresh();
    setTimeout(() => {
      setAddSuccess('');
      setShowAddModal(false);
    }, 2000);
  };

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

  return (
    <div className="space-y-4">

      {/* ─── STATISTIKA KARTLAR ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: '👥', label: "Jami foydalanuvchilar", value: users.length.toString(), color: 'from-blue-600 to-indigo-700', border: 'border-blue-500/40' },
          { icon: '🟢', label: "Faol foydalanuvchilar", value: users.filter(u => u.lastLoginAt).length.toString(), color: 'from-emerald-600 to-teal-700', border: 'border-emerald-500/40' },
          { icon: '⏱️', label: "Jami faol vaqt", value: formatActiveTime(totalMinutes), color: 'from-amber-600 to-orange-700', border: 'border-amber-500/40' },
          { icon: '🤖', label: "Jami tokenlar", value: totalTokens.toLocaleString(), color: 'from-violet-600 to-purple-700', border: 'border-violet-500/40' },
        ].map(card => (
          <div key={card.label} className={`bg-slate-900/80 border ${card.border} rounded-2xl p-4 backdrop-blur`}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-xl mb-3 shadow-lg`}>
              {card.icon}
            </div>
            <div className="text-white font-black text-lg leading-tight">{card.value}</div>
            <div className="text-slate-400 text-xs mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* ─── FOYDALANUVCHILAR PANELI ─── */}
      <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl backdrop-blur overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-lg">
              👤
            </div>
            <div>
              <div className="text-white font-black text-sm">Foydalanuvchilar</div>
              <div className="text-slate-500 text-xs">{users.length} ta ro&apos;yxatda</div>
            </div>
          </div>
          <button
            onClick={() => { setShowAddModal(true); setAddError(''); setAddSuccess(''); setNewLogin(''); setNewPassword(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
          >
            <span className="text-base">+</span>
            <span>Yangi user</span>
          </button>
        </div>

        {/* Table wrapper for mobile responsiveness */}
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-800/60 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <div className="col-span-2">Login</div>
              <div className="col-span-2">Parol</div>
              <div className="col-span-1">Rol</div>
              <div className="col-span-2">Yaratilgan</div>
              <div className="col-span-2">So&apos;nggi kirish</div>
              <div className="col-span-1">Faol vaqt</div>
              <div className="col-span-1">Tokenlar</div>
              <div className="col-span-1 text-right">Amal</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-800/60">
              {users.map(user => (
                <div key={user.username} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-slate-800/30 transition-colors">
                  {/* Login */}
                  <div className="col-span-2 flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${user.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white text-xs font-bold truncate">{user.username}</span>
                  </div>

                  {/* Parol */}
                  <div className="col-span-2 flex items-center gap-1">
                    <span className="text-slate-300 text-xs font-mono">
                      {visiblePasswords[user.username] ? user.password : '••••••'}
                    </span>
                    <button
                      onClick={() => togglePassword(user.username)}
                      className="text-slate-500 hover:text-slate-300 text-xs transition-colors flex-shrink-0"
                      title="Ko'rsatish/yashirish"
                    >
                      {visiblePasswords[user.username] ? '🙈' : '👁️'}
                    </button>
                  </div>

                  {/* Rol */}
                  <div className="col-span-1">
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                      {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                    </span>
                  </div>

                  {/* Yaratilgan */}
                  <div className="col-span-2 text-slate-500 text-[10px]">{formatDate(user.createdAt)}</div>

                  {/* So'nggi kirish */}
                  <div className="col-span-2 text-slate-500 text-[10px]">
                    {user.lastLoginAt ? (
                      <span className="text-emerald-400">{formatDate(user.lastLoginAt)}</span>
                    ) : (
                      <span className="text-slate-600">Hali kirmagan</span>
                    )}
                  </div>

                  {/* Faol vaqt */}
                  <div className="col-span-1 text-xs text-amber-400 font-bold">
                    {formatActiveTime(user.totalActiveMinutes)}
                  </div>

                  {/* Tokenlar */}
                  <div className="col-span-1 text-xs text-violet-400 font-bold">
                    {user.tokensUsed.toLocaleString()}
                  </div>

                  {/* O'chirish */}
                  <div className="col-span-1 flex justify-end">
                    {user.role !== 'admin' ? (
                      <button
                        onClick={() => handleDelete(user.username)}
                        className={`text-[10px] font-black px-2 py-1 rounded-lg transition-all ${
                          deleteConfirm === user.username
                            ? 'bg-red-600 text-white animate-pulse'
                            : 'bg-red-900/30 text-red-400 hover:bg-red-800/50 border border-red-700/30'
                        }`}
                        title={deleteConfirm === user.username ? "Tasdiqlash uchun yana bosing" : "O'chirish"}
                      >
                        {deleteConfirm === user.username ? '⚠️ Tasdiq' : '🗑️'}
                      </button>
                    ) : (
                      <span className="text-slate-700 text-[10px]">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── YANGI USER QO'SHISH MODAL ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 shadow-2xl shadow-emerald-500/10 relative">
            {/* Close */}
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl transition-colors"
            >✕</button>

            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-emerald-500/30">
              ➕
            </div>

            <h3 className="text-white text-xl font-black text-center mb-1">Yangi foydalanuvchi</h3>
            <p className="text-slate-400 text-xs text-center mb-5">Login va parol kiriting. Foydalanuvchi saytga kirish imkoniga ega bo&apos;ladi, lekin Telegram signal yuborolmaydi.</p>

            <div className="space-y-3">
              <div>
                <label className="text-slate-400 text-xs font-bold tracking-widest mb-1.5 block">LOGIN</label>
                <input
                  type="text"
                  value={newLogin}
                  onChange={e => { setNewLogin(e.target.value); setAddError(''); }}
                  placeholder="masalan: trader01"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 focus:border-emerald-500 rounded-xl text-white text-sm font-bold focus:outline-none transition-colors placeholder-slate-600"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleAddUser(); }}
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-bold tracking-widest mb-1.5 block">PAROL</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setAddError(''); }}
                  placeholder="masalan: pass123"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 focus:border-emerald-500 rounded-xl text-white text-sm font-bold focus:outline-none transition-colors placeholder-slate-600"
                  onKeyDown={e => { if (e.key === 'Enter') handleAddUser(); }}
                />
              </div>

              {addError && (
                <div className="bg-red-900/30 border border-red-600/50 rounded-xl px-3 py-2 text-red-300 text-xs font-bold">
                  ⚠️ {addError}
                </div>
              )}
              {addSuccess && (
                <div className="bg-emerald-900/30 border border-emerald-600/50 rounded-xl px-3 py-2 text-emerald-300 text-xs font-bold">
                  {addSuccess}
                </div>
              )}

              <button
                onClick={handleAddUser}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20 text-sm"
              >
                ✓ Foydalanuvchi yaratish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
