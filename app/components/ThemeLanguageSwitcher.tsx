'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useThemeLanguage, LANGUAGES, Language } from '../context/ThemeLanguageContext';

interface ThemeLanguageSwitcherProps {
  compact?: boolean;
  showLabels?: boolean;
}

export default function ThemeLanguageSwitcher({
  compact = false,
  showLabels = true,
}: ThemeLanguageSwitcherProps) {
  const { theme, toggleTheme, language, setLanguage, t } = useThemeLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  // Tashqariga bosilganda dropdownni yopish
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {/* 🌐 Til tanlash (Language Switcher) */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsLangOpen(!isLangOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/80 hover:border-slate-500/80 transition-all duration-200 shadow-sm active:scale-95"
          title={t('language')}
          aria-expanded={isLangOpen}
          aria-haspopup="true"
        >
          <span className="text-sm leading-none">{currentLangObj.flag}</span>
          {!compact && (
            <span className="hidden md:inline font-semibold">{currentLangObj.label}</span>
          )}
          <svg
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isLangOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isLangOpen && (
          <div
            className="absolute right-0 mt-1.5 w-36 rounded-xl bg-slate-900 border border-slate-700/90 shadow-2xl p-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-xl"
            style={{
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800/80 mb-1">
              {t('language')}
            </div>
            {LANGUAGES.map((item) => {
              const isSelected = item.code === language;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setLanguage(item.code);
                    setIsLangOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 font-bold border border-amber-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.flag}</span>
                    <span>{item.label}</span>
                  </div>
                  {isSelected && <span className="text-amber-400 text-[10px]">✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 🌓 Dark / Light Mode Switcher */}
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 shadow-sm active:scale-95 ${
          theme === 'light'
            ? 'bg-amber-500/10 text-amber-600 border-amber-400/40 hover:bg-amber-500/20'
            : 'bg-slate-800/80 text-slate-200 border-slate-700/80 hover:border-slate-500/80 hover:bg-slate-700/80'
        }`}
        title={theme === 'dark' ? t('lightMode') : t('darkMode')}
        aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {theme === 'dark' ? (
          <>
            <span className="text-sm">🌙</span>
            {showLabels && !compact && (
              <span className="hidden lg:inline text-[11px] font-semibold text-slate-300">Dark</span>
            )}
          </>
        ) : (
          <>
            <span className="text-sm text-amber-500">☀️</span>
            {showLabels && !compact && (
              <span className="hidden lg:inline text-[11px] font-semibold text-amber-700">Light</span>
            )}
          </>
        )}
      </button>
    </div>
  );
}
