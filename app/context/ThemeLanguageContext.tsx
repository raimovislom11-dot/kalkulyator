'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'uz' | 'ru' | 'tr';
export type Theme = 'dark' | 'light';

export interface Translations {
  [key: string]: {
    uz: string;
    ru: string;
    tr: string;
  };
}

export const translations: Translations = {
  // Brand & General
  brandTitle: { uz: 'ELIF TRADING', ru: 'ELIF TRADING', tr: 'ELIF TRADING' },
  proAdminPanel: { uz: 'Pro Admin Panel', ru: 'Pro Панель Администратора', tr: 'Pro Yönetici Paneli' },
  dashboard: { uz: 'Dashboard', ru: 'Главная панель', tr: 'Kontrol Paneli' },
  online: { uz: 'Online', ru: 'Онлайн', tr: 'Çevrimiçi' },
  balance: { uz: 'Balans', ru: 'Баланс', tr: 'Bakiye' },
  refresh: { uz: 'Yangilash', ru: 'Обновить', tr: 'Yenile' },
  logout: { uz: 'Chiqish', ru: 'Выход', tr: 'Çıkış' },
  telegram: { uz: 'Telegram', ru: 'Telegram', tr: 'Telegram' },
  soundOn: { uz: 'Ovoz yoqilgan', ru: 'Звук включен', tr: 'Ses açık' },
  soundOff: { uz: "Ovoz o'chirilgan", ru: 'Звук выключен', tr: 'Ses kapalı' },
  adminBadge: { uz: 'Admin', ru: 'Админ', tr: 'Yönetici' },

  // Navigation Tabs / Modules
  calc: { uz: 'Kalkulyator', ru: 'Калькулятор', tr: 'Hesaplayıcı' },
  trap: { uz: 'Trap Hunter', ru: 'Охотник за ловушками', tr: 'Tuzak Avcısı' },
  radar: { uz: '18-Radar', ru: '18-Радар', tr: '18-Radar' },
  delta: { uz: 'Vol Delta', ru: 'Дельта объёма', tr: 'Hacim Deltası' },
  chart: { uz: 'Grafik', ru: 'График', tr: 'Grafik' },
  multichart: { uz: 'Multi-Grid', ru: 'Мульти-сетка', tr: 'Çoklu Izgara' },
  autopsy: { uz: 'Xatolar', ru: 'Анализ ошибок', tr: 'Hata Analizi' },
  checklist: { uz: 'Checklist', ru: 'Чек-лист', tr: 'Kontrol Listesi' },
  risk: { uz: 'Risk & Lot', ru: 'Риск и Лот', tr: 'Risk ve Lot' },
  proprisk: { uz: 'Prop Guard', ru: 'Защита Проп', tr: 'Prop Koruma' },
  heatmap: { uz: 'Heatmap', ru: 'Тепловая карта', tr: 'Isı Haritası' },
  backtest: { uz: 'Backtest', ru: 'Бэктест', tr: 'Geri Test' },
  encyclopedia: { uz: "Lug'at", ru: 'Словарь', tr: 'Sözlük' },
  killzones: { uz: 'Killzones', ru: 'Киллзоны', tr: 'Killzones' },
  journal: { uz: 'Jurnal', ru: 'Журнал', tr: 'Günlük' },
  calendar: { uz: 'Taqvim', ru: 'Календарь', tr: 'Takvim' },
  aiAnalysis: { uz: 'AI Tahlil', ru: 'AI Анализ', tr: 'AI Analizi' },
  aiChat: { uz: 'AI Chat', ru: 'AI Чат', tr: 'AI Sohbet' },
  users: { uz: 'Foydalanuvchilar', ru: 'Пользователи', tr: 'Kullanıcılar' },
  settings: { uz: 'Sozlamalar', ru: 'Настройки', tr: 'Ayarlar' },

  // Sessions
  london: { uz: 'London', ru: 'Лондон', tr: 'Londra' },
  newyork: { uz: 'NY', ru: 'Нью-Йорк', tr: 'New York' },
  tashkentTime: { uz: 'Toshkent', ru: 'Ташкент', tr: 'Taşkent' },

  // Themes
  darkMode: { uz: 'Tungi rejim', ru: 'Тёмная тема', tr: 'Karanlık Mod' },
  lightMode: { uz: 'Kunduzgi rejim', ru: 'Светлая тема', tr: 'Aydınlık Mod' },
  theme: { uz: 'Mavzu', ru: 'Тема', tr: 'Tema' },
  language: { uz: 'Til', ru: 'Язык', tr: 'Dil' },
};

interface ThemeLanguageContextType {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const ThemeLanguageContext = createContext<ThemeLanguageContextType | undefined>(undefined);

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
];

export function ThemeLanguageProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [language, setLanguageState] = useState<Language>('uz');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('app_theme') as Theme;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeState(savedTheme);
        applyThemeClass(savedTheme);
      } else {
        applyThemeClass('dark');
      }

      const savedLang = localStorage.getItem('app_lang') as Language;
      if (savedLang === 'uz' || savedLang === 'ru' || savedLang === 'tr') {
        setLanguageState(savedLang);
      }
    } catch {}
    setMounted(true);
  }, []);

  const applyThemeClass = (t: Theme) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (t === 'light') {
        root.classList.add('light');
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
      } else {
        root.classList.add('dark');
        root.classList.remove('light');
        root.setAttribute('data-theme', 'dark');
      }
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyThemeClass(newTheme);
    try {
      localStorage.setItem('app_theme', newTheme);
    } catch {}
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('app_lang', lang);
    } catch {}
  };

  const t = (key: string): string => {
    const item = translations[key];
    if (!item) return key;
    return item[language] || item['uz'] || key;
  };

  return (
    <ThemeLanguageContext.Provider
      value={{
        theme,
        language,
        toggleTheme,
        setTheme,
        setLanguage,
        t,
      }}
    >
      {children}
    </ThemeLanguageContext.Provider>
  );
}

export function useThemeLanguage() {
  const context = useContext(ThemeLanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      theme: 'dark' as Theme,
      language: 'uz' as Language,
      toggleTheme: () => {},
      setTheme: () => {},
      setLanguage: () => {},
      t: (key: string) => translations[key]?.['uz'] || key,
    };
  }
  return context;
}
