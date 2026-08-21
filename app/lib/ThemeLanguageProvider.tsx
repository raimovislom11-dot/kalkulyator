'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Language = 'uz' | 'ru' | 'tr';
export type Theme = 'dark' | 'light';

interface ThemeLanguageContextType {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const LANG_LABELS: Record<Language, string> = {
  uz: "O'zbek",
  ru: 'Русский',
  tr: 'Türkçe',
};

export const LANG_FLAGS: Record<Language, string> = {
  uz: '🇺🇿',
  ru: '🇷🇺',
  tr: '🇹🇷',
};

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  uz: {
    'nav.calculator': 'Kalkulyator',
    'nav.trap': 'Trap Hunter',
    'nav.radar': '18-Radar',
    'nav.delta': 'Vol Delta',
    'nav.chart': 'Grafik',
    'nav.multichart': 'Multi-Grid',
    'nav.autopsy': 'Xatolar',
    'nav.checklist': 'Checklist',
    'nav.risk': 'Risk & Lot',
    'nav.proprisk': 'Prop Guard',
    'nav.heatmap': 'Heatmap',
    'nav.backtest': 'Backtest',
    'nav.encyclopedia': "Lug'at",
    'nav.killzones': 'Killzones',
    'nav.journal': 'Jurnal',
    'nav.calendar': 'Taqvim',
    'nav.admin': 'Admin',
    'header.balance': 'Balans',
    'header.logout': 'Chiqish',
    'header.dark_mode': "Qorong'u",
    'header.light_mode': "Yorug'",
    'header.language': 'Til',
  },
  ru: {
    'nav.calculator': 'Калькулятор',
    'nav.trap': 'Ловушки',
    'nav.radar': '18-Радар',
    'nav.delta': 'Объём Дельта',
    'nav.chart': 'График',
    'nav.multichart': 'Мульти-Сетка',
    'nav.autopsy': 'Ошибки',
    'nav.checklist': 'Чеклист',
    'nav.risk': 'Риск & Лот',
    'nav.proprisk': 'Проп Защита',
    'nav.heatmap': 'Тепловая Карта',
    'nav.backtest': 'Бэктест',
    'nav.encyclopedia': 'Словарь',
    'nav.killzones': 'Килзоны',
    'nav.journal': 'Журнал',
    'nav.calendar': 'Календарь',
    'nav.admin': 'Админ',
    'header.balance': 'Баланс',
    'header.logout': 'Выход',
    'header.dark_mode': 'Тёмная',
    'header.light_mode': 'Светлая',
    'header.language': 'Язык',
  },
  tr: {
    'nav.calculator': 'Hesaplama',
    'nav.trap': 'Tuzak Avcısı',
    'nav.radar': '18-Radar',
    'nav.delta': 'Vol Delta',
    'nav.chart': 'Grafik',
    'nav.multichart': 'Çoklu Grafik',
    'nav.autopsy': 'Hatalar',
    'nav.checklist': 'Kontrol Listesi',
    'nav.risk': 'Risk & Lot',
    'nav.proprisk': 'Prop Koruma',
    'nav.heatmap': 'Isı Haritası',
    'nav.backtest': 'Backtest',
    'nav.encyclopedia': 'Sözlük',
    'nav.killzones': 'Killzonlar',
    'nav.journal': 'Günlük',
    'nav.calendar': 'Takvim',
    'nav.admin': 'Admin',
    'header.balance': 'Bakiye',
    'header.logout': 'Çıkış',
    'header.dark_mode': 'Karanlık',
    'header.light_mode': 'Aydınlık',
    'header.language': 'Dil',
  },
};

const ThemeLanguageContext = createContext<ThemeLanguageContextType>({
  theme: 'dark',
  language: 'uz',
  toggleTheme: () => {},
  setLanguage: () => {},
  t: (key) => key,
});

export function ThemeLanguageProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [language, setLangState] = useState<Language>('uz');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const savedTheme = localStorage.getItem('app_theme') as Theme | null;
      const savedLang = localStorage.getItem('app_language') as Language | null;
      if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);
      if (savedLang && ['uz', 'ru', 'tr'].includes(savedLang)) setLangState(savedLang as Language);
    } catch {}
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'light') {
      root.style.setProperty('--bg-primary', '#f1f5f9');
      root.style.setProperty('--bg-secondary', '#ffffff');
      root.style.setProperty('--text-primary', '#0f172a');
      root.style.setProperty('--border-color', '#e2e8f0');
    } else {
      root.style.removeProperty('--bg-primary');
      root.style.removeProperty('--bg-secondary');
      root.style.removeProperty('--text-primary');
      root.style.removeProperty('--border-color');
    }
  }, [theme, mounted]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('app_theme', next); } catch {}
      return next;
    });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLangState(lang);
    try { localStorage.setItem('app_language', lang); } catch {}
  }, []);

  const t = useCallback((key: string): string => {
    return TRANSLATIONS[language]?.[key] ?? TRANSLATIONS['uz']?.[key] ?? key;
  }, [language]);

  return (
    <ThemeLanguageContext.Provider value={{ theme, language, toggleTheme, setLanguage, t }}>
      {children}
    </ThemeLanguageContext.Provider>
  );
}

export function useThemeLang() {
  return useContext(ThemeLanguageContext);
}
