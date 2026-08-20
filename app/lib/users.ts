// ─── Foydalanuvchilar boshqaruvi (localStorage) ───────────────────────────────

export type UserRole = 'admin' | 'user';

export interface AppUser {
  username: string;
  password: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string | null;
  totalActiveMinutes: number;
  tokensUsed: number;
}

const STORAGE_KEY = 'trading_app_users';
const SESSION_KEY = 'trading_app_session';

const DEFAULT_ADMIN: AppUser = {
  username: 'admin',
  password: 'admin',
  role: 'admin',
  createdAt: new Date().toISOString(),
  lastLoginAt: null,
  totalActiveMinutes: 0,
  tokensUsed: 0,
};

export function loadUsers(): AppUser[] {
  if (typeof window === 'undefined') return [DEFAULT_ADMIN];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = [DEFAULT_ADMIN];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const users: AppUser[] = JSON.parse(raw);
    if (!users.find(u => u.username === 'admin')) {
      users.unshift({ ...DEFAULT_ADMIN, createdAt: users[0]?.createdAt || new Date().toISOString() });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    }
    return users;
  } catch {
    return [DEFAULT_ADMIN];
  }
}

export function saveUsers(users: AppUser[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function findUser(username: string, password: string): AppUser | null {
  const users = loadUsers();
  const cleanU = username.trim().toLowerCase();
  const cleanP = password.trim();
  return users.find(u => u.username.trim().toLowerCase() === cleanU && u.password.trim() === cleanP) ?? null;
}

export function addUser(username: string, password: string): { ok: boolean; error?: string } {
  const cleanU = username.trim();
  const cleanP = password.trim();
  const users = loadUsers();
  if (users.find(u => u.username.trim().toLowerCase() === cleanU.toLowerCase())) {
    return { ok: false, error: 'Bu login allaqachon mavjud!' };
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
  users.push(newUser);
  saveUsers(users);
  return { ok: true };
}

export function removeUser(username: string): boolean {
  const cleanU = username.trim().toLowerCase();
  if (cleanU === 'admin') return false;
  const users = loadUsers();
  const filtered = users.filter(u => u.username.trim().toLowerCase() !== cleanU);
  if (filtered.length === users.length) return false;
  saveUsers(filtered);
  return true;
}

export function updateUserLogin(username: string): void {
  const cleanU = username.trim().toLowerCase();
  const users = loadUsers();
  const user = users.find(u => u.username.trim().toLowerCase() === cleanU);
  if (user) {
    user.lastLoginAt = new Date().toISOString();
    saveUsers(users);
  }
}

export function addTokensUsed(username: string, tokens: number): void {
  const users = loadUsers();
  const user = users.find(u => u.username === username);
  if (user) {
    user.tokensUsed += tokens;
    saveUsers(users);
  }
}

export function addActiveMinutes(username: string, minutes: number): void {
  const users = loadUsers();
  const user = users.find(u => u.username === username);
  if (user) {
    user.totalActiveMinutes += minutes;
    saveUsers(users);
  }
}

export interface SessionData {
  username: string;
  role: UserRole;
  loginAt: string;
}

export function saveSession(user: AppUser): void {
  if (typeof window === 'undefined') return;
  const session: SessionData = {
    username: user.username,
    role: user.role,
    loginAt: new Date().toISOString(),
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadSession(): SessionData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
}

export function formatActiveTime(minutes: number): string {
  if (minutes < 60) return `${minutes} daqiqa`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} soat ${m} min` : `${h} soat`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
