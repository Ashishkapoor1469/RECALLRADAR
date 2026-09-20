import type { Metadata } from 'next';
import Link from 'next/link';
import DemoControls from '../components/DemoControls';
import SidebarNav from '../components/SidebarNav';
import './globals.css';

export const metadata: Metadata = {
  title: 'RecallRadar — Safety Intelligence & Early Recall Warning',
  description: 'Continuous AI defect surveillance across verified consumer reports, warranty claim logs, and early recall risk indicators.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className="min-h-screen bg-[#f5f7f9] text-slate-800 antialiased font-sans selection:bg-brand-500 selection:text-white">
        <div className="flex min-h-screen w-full">
          {/* Stitch Sidebar Navigation */}
          <SidebarNav />

          {/* Main View Area */}
          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
            {/* Executive Sticky Header Bar */}
            <header className="bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200/80 px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 select-none">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <Link href="/" className="hover:text-slate-700">RecallRadar</Link>
                <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
                <span className="text-brand-800 font-semibold bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100">
                  Safety Intelligence Engine
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Live Surveillance Indicator Badge */}
                <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                  </span>
                  <span>Surveillance Active</span>
                </div>

                <DemoControls />

                <Link
                  href="/risk-queue"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-700 to-brand-600 hover:from-brand-800 hover:to-brand-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm shadow-brand-700/30 transition transform active:scale-95"
                >
                  <span>Open Risk Queue</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </Link>
              </div>
            </header>

            {/* Main Content Dashboard Container */}
            <div className="p-6 md:p-8 max-w-7xl w-full mx-auto flex-1">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
