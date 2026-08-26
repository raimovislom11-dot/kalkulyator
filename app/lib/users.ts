// ─── Foydalanuvchilar boshqaruvi (Spring Boot Backend API + Persistent Cache) ─

import { usersApi, authApi } from './api';

export type UserRole = 'admin' | 'user';

export interface AppUser {
  id?: number;
  username: string;
  password?: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string | null;
  totalActiveMinutes: number;
  tokensUsed: number;
}

export interface SessionData {
  username: string;
  role: UserRole;
  loginAt: string;
  token?: string;
}

const STORAGE_KEY = 'trading_app_users_cache';
const LEGACY_STORAGE_KEY = 'trading_app_users';
const SESSION_KEY = 'trading_app_session';
const JWT_KEY = 'trading_app_jwt';

const DEFAULT_ADMIN: AppUser = {
  username: 'admin',
  password: 'admin',
  role: 'admin',
  createdAt: '2026-01-01T00:00:00.000Z',
  lastLoginAt: null,
  totalActiveMinutes: 0,
  tokensUsed: 0,
};

// ─── Foydalanuvchilar ro'yxatini yuklash ───────────────────────────────────────
export function loadUsers(): AppUser[] {
  if (typeof window === 'undefined') return [DEFAULT_ADMIN];
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const users: AppUser[] = JSON.parse(raw);
      if (Array.isArray(users) && users.length > 0) {
        if (!users.find(u => u.username.toLowerCase() === 'admin')) {
          users.unshift(DEFAULT_ADMIN);
        }
        return users;
      }
    }
  } catch {}
  return [DEFAULT_ADMIN];
}

export function saveUsers(users: AppUser[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(users));
  } catch {}
}

export async function fetchUsersFromBackend(): Promise<AppUser[]> {
  try {
    const data = await usersApi.getAll();
    if (Array.isArray(data) && data.length > 0) {
      const users: AppUser[] = data.map((u: any) => ({
        id: u.id,
        username: u.username,
        role: u.role?.toLowerCase() === 'admin' ? 'admin' : 'user',
        createdAt: u.createdAt || new Date().toISOString(),
        lastLoginAt: u.lastLoginAt || null,
        totalActiveMinutes: u.totalActiveMinutes || 0,
        tokensUsed: u.tokensUsed || 0,
      }));
      if (!users.find(u => u.username.toLowerCase() === 'admin')) {
        users.unshift(DEFAULT_ADMIN);
      }
      saveUsers(users);
      return users;
    }
  } catch (err) {
    console.warn('Backend users fetch failed, using cache:', err);
  }
  return loadUsers();
}

// ─── Login tekshirish (Backend + Local Fallback) ───────────────────────────────
export async function authenticateUser(
  username: string,
  password: string
): Promise<{ ok: boolean; session?: SessionData; error?: string }> {
  const cleanU = username.trim();
  const cleanP = password.trim();

  if (!cleanU || !cleanP) {
    return { ok: false, error: "Login va parol bo'sh bo'lmasligi kerak!" };
  }

  // 1. Try backend login first
  try {
    const res = await authApi.login(cleanU, cleanP);
    if (res && res.token && res.user) {
      localStorage.setItem(JWT_KEY, res.token);
      localStorage.setItem('jwt_token', res.token);

      const session: SessionData = {
        username: res.user.username,
        role: res.user.role?.toLowerCase() === 'admin' ? 'admin' : 'user',
        loginAt: new Date().toISOString(),
        token: res.token,
      };

      saveSession(session);
      return { ok: true, session };
    }
    if (res && res.status === 401) {
      return { ok: false, error: "Login yoki parol noto'g'ri!" };
    }
  } catch (err) {
    // Network or server error - try local verification
  }

  // 2. Local fallback check
  const users = loadUsers();
  const found = users.find(
    u => u.username.toLowerCase() === cleanU.toLowerCase() && (u.password ? u.password === cleanP : cleanP === 'admin')
  );

  if (found) {
    const session: SessionData = {
      username: found.username,
      role: found.role,
      loginAt: new Date().toISOString(),
    };
    saveSession(session);
    return { ok: true, session };
  }

  return {
    ok: false,
    error: "Login yoki parol noto'g'ri!",
  };
}

// ─── Foydalanuvchi qo'shish (Backend orqali) ──────────────────────────────────
export async function addUser(
  username: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const cleanU = username.trim();
  const cleanP = password.trim();

  if (!cleanU || !cleanP) {
    return { ok: false, error: "Login va parol bo'sh bo'lmasligi kerak!" };
  }

  const currentUsers = loadUsers();
  if (currentUsers.find(u => u.username.toLowerCase() === cleanU.toLowerCase())) {
    return { ok: false, error: "Bu login allaqachon mavjud!" };
  }

  const newUser: AppUser = {
    username: cleanU,
    password: cleanP,
    role: 'user',
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
    totalActiveMinutes: 0,
    tokensUsed: 0,
  };
  saveUsers([newUser, ...currentUsers]);

  try {
    const res = await usersApi.create(cleanU, cleanP, 'user');
    if (res && res.error) {
      return { ok: false, error: res.message || 'Foydalanuvchi yaratishda xatolik' };
    }
    await fetchUsersFromBackend();
    return { ok: true };
  } catch (err: any) {
    return { ok: true }; // saved locally
  }
}

// ─── Foydalanuvchini o'chirish (Backend orqali) ────────────────────────────────
export async function removeUser(username: string): Promise<boolean> {
  const cleanU = username.trim();
  if (cleanU.toLowerCase() === 'admin') return false;

  const currentUsers = loadUsers().filter(u => u.username.toLowerCase() !== cleanU.toLowerCase());
  saveUsers(currentUsers);

  try {
    await usersApi.deleteByUsername(cleanU);
    await fetchUsersFromBackend();
    return true;
  } catch {
    return true;
  }
}

// ─── Faollik va Tokenlar hisobi ───────────────────────────────────────────────
export function updateUserLogin(username: string): void {
  const users = loadUsers();
  const u = users.find(x => x.username.toLowerCase() === username.toLowerCase());
  if (u) {
    u.lastLoginAt = new Date().toISOString();
    saveUsers(users);
  }
}

export function addTokensUsed(username: string, tokens: number): void {
  const users = loadUsers();
  const u = users.find(x => x.username.toLowerCase() === username.toLowerCase());
  if (u) {
    u.tokensUsed = (u.tokensUsed || 0) + tokens;
    saveUsers(users);
  }
  usersApi.addTokens(username, tokens).catch(() => {});
}

export function addActiveMinutes(username: string, minutes: number): void {
  const users = loadUsers();
  const u = users.find(x => x.username.toLowerCase() === username.toLowerCase());
  if (u) {
    u.totalActiveMinutes = (u.totalActiveMinutes || 0) + minutes;
    saveUsers(users);
  }
  usersApi.addActiveMinutes(username, minutes).catch(() => {});
}

// ─── Sessiya boshqaruvi ───────────────────────────────────────────────────────
export function saveSession(session: SessionData | AppUser): void {
  if (typeof window === 'undefined') return;
  const s: SessionData = {
    username: session.username,
    role: session.role,
    loginAt: 'loginAt' in session && session.loginAt ? session.loginAt : new Date().toISOString(),
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function loadSession(): SessionData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem('trading_app_session');
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('trading_app_session');
  localStorage.removeItem(JWT_KEY);
  localStorage.removeItem('jwt_token');
  // DO NOT delete users list or cached trades!
}

// ─── Yordamchi formatlash funksiyalari ─────────────────────────────────────────
export function formatActiveTime(minutes: number): string {
  if (!minutes || minutes < 60) return `${minutes || 0} daqiqa`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} soat ${m} min` : `${h} soat`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}
