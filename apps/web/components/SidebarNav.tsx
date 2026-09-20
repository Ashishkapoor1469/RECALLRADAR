'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SidebarNav() {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Overview',
      href: '/',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
        </svg>
      ),
    },
    {
      name: 'Risk Queue',
      href: '/risk-queue',
      badge: '4',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
        </svg>
      ),
    },
    {
      name: 'Alerts',
      href: '/alerts',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
        </svg>
      ),
    },
    {
      name: 'Backtest Lab',
      href: '/backtest',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
        </svg>
      ),
    },
    {
      name: 'Ask RecallRadar',
      href: '/ask',
      aiBadge: 'AI',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
        </svg>
      ),
    },
    {
      name: 'Data Quality',
      href: '/data-quality',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
        </svg>
      ),
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200/80 flex flex-col justify-between py-6 px-5 select-none sticky top-0 h-screen overflow-y-auto">
      <div>
        {/* App Logo & Identity */}
        <div className="flex items-center gap-3 px-2 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-900 via-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-700/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 4a6 6 0 0 1 6 6m-6-3a3 3 0 0 1 3 3m-3-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2"></path>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-tight text-slate-900 text-lg">RecallRadar</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200">PRO</span>
            </div>
            <p className="text-xs font-medium text-slate-400">Safety Intelligence</p>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative mb-6">
          <input
            className="w-full bg-slate-50 border border-slate-200 text-xs font-medium rounded-xl pl-9 pr-8 py-2.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition"
            placeholder="Search ASIN, defect, batch..."
            type="text"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
          <span className="text-[10px] font-semibold text-slate-400 absolute right-2.5 top-3 border border-slate-200 rounded px-1">⌘K</span>
        </div>

        {/* Navigation Sections */}
        <div className="space-y-6">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">Core Engine</span>
            <nav className="mt-2 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition group ${
                      isActive
                        ? 'bg-brand-700 text-white shadow-sm shadow-brand-700/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-brand-200' : 'text-slate-400 group-hover:text-brand-600 transition'}>
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </div>

                    {item.badge && (
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full ${
                        isActive
                          ? 'bg-rose-500 text-white'
                          : 'bg-rose-50 text-rose-600 border border-rose-200'
                      }`}>
                        {item.badge}
                      </span>
                    )}

                    {item.aiBadge && (
                      <span className={`text-[9px] font-bold tracking-tight px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white text-brand-900'
                          : 'text-emerald-800 bg-emerald-100'
                      }`}>
                        {item.aiBadge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Sidebar Widget & User Profile Footer */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <div className="bg-gradient-to-br from-brand-900 to-brand-700 rounded-2xl p-4 text-white relative overflow-hidden shadow-sm">
          <div className="absolute -right-4 -bottom-6 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
            <span className="text-[11px] uppercase tracking-wider font-bold text-brand-200">Surveillance Mode</span>
          </div>
          <p className="text-xs text-brand-100 mb-2 font-normal leading-relaxed">CPSC & FDA cross-ingestion live. Active stream: 14.8k revs/day.</p>
        </div>

        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-xs shadow-inner">
              DR
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">Dr. Aris Vance</p>
              <p className="text-[11px] text-slate-400">Chief Safety Officer</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
