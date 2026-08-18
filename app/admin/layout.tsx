'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '⊞', exact: true },
  { href: '/admin/charts', label: 'Charts', icon: '⌇' },
  { href: '/admin/trades', label: 'Trades', icon: '≡' },
  { href: '/admin/chat', label: 'AI Chat', icon: '◎' },
  { href: '/admin/notes', label: 'Notes', icon: '◻' },
  { href: '/admin/settings', label: 'Settings', icon: '◈' },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  return (
    <aside className="flex flex-col h-full bg-black border-r border-[#1f1f1f]">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-14 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 bg-white rounded-sm flex items-center justify-center">
            <span className="text-black text-xs font-black leading-none">X</span>
          </div>
          <span className="text-white text-sm font-semibold tracking-tight">XAU Admin</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors text-sm">✕</button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? 'bg-white text-black font-medium'
                  : 'text-[#888] hover:text-white hover:bg-[#111]'
              }`}
            >
              <span className="text-base leading-none font-mono">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-[#1f1f1f]">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-[#555] hover:text-white hover:bg-[#111] transition-colors"
        >
          <span className="text-base leading-none">←</span>
          <span>Calculator</span>
        </Link>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-52 md:flex-shrink-0 md:flex-col">
        <div className="fixed top-0 left-0 w-52 h-screen">
          <Sidebar />
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-52 flex flex-col">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
          <div className="flex-1 bg-black/80" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-52">
        {/* Mobile topbar */}
        <div className="md:hidden sticky top-0 z-40 flex items-center gap-3 px-4 h-14 bg-black border-b border-[#1f1f1f]">
          <button onClick={() => setSidebarOpen(true)} className="text-[#555] hover:text-white transition-colors">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white rounded-sm flex items-center justify-center">
              <span className="text-black text-xs font-black leading-none" style={{fontSize:9}}>X</span>
            </div>
            <span className="text-white text-sm font-semibold">XAU Admin</span>
          </div>
        </div>

        <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
