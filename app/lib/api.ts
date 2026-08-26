// ─── API Client Configuration for Spring Boot Backend ──────────────────────────

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://calc.213.199.51.43.sslip.io';

export function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem('trading_app_session') || localStorage.getItem('trading_app_jwt');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.token || parsed.jwt || (typeof raw === 'string' && raw.startsWith('eyJ') ? raw : null);
    }
  } catch {}
  return localStorage.getItem('jwt_token');
}

export function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ─── Authentication API ───────────────────────────────────────────────────────
export const authApi = {
  async login(username: string, password: string) {
    const res = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return res.json();
  },

  async register(username: string, password: string, role = 'user') {
    const res = await fetch(apiUrl('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role }),
    });
    return res.json();
  },

  async getMe() {
    const res = await fetch(apiUrl('/api/auth/me'), {
      headers: authHeaders(),
    });
    return res.json();
  },
};

// ─── Trades API ───────────────────────────────────────────────────────────────
export const tradesApi = {
  async getAll() {
    const res = await fetch(apiUrl('/api/trades'), {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch trades');
    return res.json();
  },

  async create(trade: any) {
    const res = await fetch(apiUrl('/api/trades'), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(trade),
    });
    return res.json();
  },

  async update(id: string | number, trade: any) {
    const res = await fetch(apiUrl(`/api/trades/${id}`), {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(trade),
    });
    return res.json();
  },

  async delete(id: string | number) {
    const res = await fetch(apiUrl(`/api/trades/${id}`), {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return res.json();
  },

  async clearAll() {
    const res = await fetch(apiUrl('/api/trades'), {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return res.json();
  },

  async getAnalytics(deposit = 10000) {
    const res = await fetch(apiUrl(`/api/trades/analytics?deposit=${deposit}`), {
      headers: authHeaders(),
    });
    return res.json();
  },
};

// ─── Notes API ────────────────────────────────────────────────────────────────
export const notesApi = {
  async getAll() {
    const res = await fetch(apiUrl('/api/notes'), {
      headers: authHeaders(),
    });
    return res.json();
  },

  async create(note: any) {
    const res = await fetch(apiUrl('/api/notes'), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(note),
    });
    return res.json();
  },

  async update(id: string | number, note: any) {
    const res = await fetch(apiUrl(`/api/notes/${id}`), {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(note),
    });
    return res.json();
  },

  async delete(id: string | number) {
    const res = await fetch(apiUrl(`/api/notes/${id}`), {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return res.json();
  },
};

// ─── Settings API ─────────────────────────────────────────────────────────────
export const settingsApi = {
  async get() {
    const res = await fetch(apiUrl('/api/settings'), {
      headers: authHeaders(),
    });
    return res.json();
  },

  async update(settings: any) {
    const res = await fetch(apiUrl('/api/settings'), {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  async reset() {
    const res = await fetch(apiUrl('/api/settings/reset'), {
      method: 'POST',
      headers: authHeaders(),
    });
    return res.json();
  },
};

// ─── Users API (Admin) ────────────────────────────────────────────────────────
export const usersApi = {
  async getAll() {
    const res = await fetch(apiUrl('/api/admin/users'), {
      headers: authHeaders(),
    });
    return res.json();
  },

  async create(username: string, password: string, role = 'user') {
    const res = await fetch(apiUrl('/api/admin/users'), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ username, password, role }),
    });
    return res.json();
  },

  async deleteByUsername(username: string) {
    const res = await fetch(apiUrl(`/api/admin/users/by-username/${encodeURIComponent(username)}`), {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return res.json();
  },

  async addActiveMinutes(username: string, minutes: number) {
    const res = await fetch(apiUrl(`/api/admin/users/${encodeURIComponent(username)}/active-minutes`), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ minutes }),
    });
    return res.json();
  },

  async addTokens(username: string, tokens: number) {
    const res = await fetch(apiUrl(`/api/admin/users/${encodeURIComponent(username)}/tokens`), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ tokens }),
    });
    return res.json();
  },
};

// ─── Market API ───────────────────────────────────────────────────────────────
export const marketApi = {
  async getCandles(symbol = 'XAUUSD', timeframe = '1h') {
    const res = await fetch(
      apiUrl(`/api/market-candles?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}`)
    );
    return res.json();
  },
};

// ─── Telegram API ─────────────────────────────────────────────────────────────
export const telegramApi = {
  async getSubscribers(token?: string) {
    const url = token
      ? apiUrl(`/api/telegram-broadcast?token=${encodeURIComponent(token)}`)
      : apiUrl('/api/telegram-broadcast');
    const res = await fetch(url);
    return res.json();
  },

  async broadcast(botToken: string, text: string, chatIds?: string[]) {
    const res = await fetch(apiUrl('/api/telegram-broadcast'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ botToken, text, chatIds }),
    });
    return res.json();
  },
};

// ─── Signals & AI Learning API ────────────────────────────────────────────────
export const signalsApi = {
  async getAll() {
    const res = await fetch(apiUrl('/api/signals'), {
      headers: authHeaders(),
    });
    return res.json();
  },

  async create(signal: any) {
    const res = await fetch(apiUrl('/api/signals'), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(signal),
    });
    return res.json();
  },

  async update(signal: any) {
    const res = await fetch(apiUrl('/api/signals'), {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(signal),
    });
    return res.json();
  },

  async delete(id: string) {
    const res = await fetch(apiUrl(`/api/signals?id=${encodeURIComponent(id)}`), {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return res.json();
  },

  async clearAll() {
    const res = await fetch(apiUrl('/api/signals?clear=true'), {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return res.json();
  },

  async getStats() {
    const res = await fetch(apiUrl('/api/signals/stats'), {
      headers: authHeaders(),
    });
    return res.json();
  },

  async getLearningPrompt(symbol?: string) {
    const url = symbol
      ? apiUrl(`/api/signals/learning-prompt?symbol=${encodeURIComponent(symbol)}`)
      : apiUrl('/api/signals/learning-prompt');
    const res = await fetch(url, { headers: authHeaders() });
    return res.json();
  },
};

