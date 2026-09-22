'use client';

import { useState } from 'react';
import Link from 'next/link';
import DemoControls from './DemoControls';
import SidebarNav from './SidebarNav';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar Navigation (Desktop + Mobile Drawer) */}
      <SidebarNav
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto max-w-full">
        {/* Executive Sticky Header Bar */}
        <header className="bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200/80 px-3 sm:px-4 md:px-8 py-3 flex items-center justify-between gap-2 sm:gap-4 select-none w-full max-w-full">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition border border-slate-200 shrink-0"
              aria-label="Open Navigation Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </button>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 min-w-0">
              <Link href="/" className="hover:text-slate-700 font-extrabold text-slate-900 md:text-slate-700 truncate text-sm sm:text-xs tracking-tight">
                RecallRadar
              </Link>
              <svg className="hidden sm:block w-3.5 h-3.5 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              <span className="hidden sm:inline-block text-brand-800 font-semibold bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100 whitespace-nowrap">
                Safety Intelligence Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
            {/* Live Surveillance Indicator Badge */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span>Surveillance Active</span>
            </div>

            <DemoControls />

            <Link
              href="/risk-queue"
              className="inline-flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-brand-700 to-brand-600 hover:from-brand-800 hover:to-brand-700 text-white text-xs font-bold px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-sm shadow-brand-700/30 transition transform active:scale-95 whitespace-nowrap"
            >
              <span>Risk Queue</span>
              <svg className="w-3.5 h-3.5 hidden sm:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </Link>
          </div>
        </header>

        {/* Main Content Dashboard Container */}
        <div className="p-3.5 sm:p-5 md:p-8 max-w-7xl w-full mx-auto flex-1 min-w-0 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
