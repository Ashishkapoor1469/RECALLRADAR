import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Customer Review Portal — EarlyEcho DB Pipeline',
  description: 'Write positive or negative product reviews that transmit directly to database and update frontend safety telemetry in real-time.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        <header className="bg-slate-900 border-b border-slate-800 text-white py-4 px-6 sticky top-0 z-50 backdrop-blur-md bg-opacity-95 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-black text-white text-lg shadow-sm">
                ✍️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-tight text-white text-lg">EarlyEcho Review Portal</span>
                  <span className="text-[10px] font-extrabold tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">WEB 2</span>
                </div>
                <p className="text-xs text-slate-400">Direct Database Ingestion & Real-Time Telemetry Engine</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live DB Connection</span>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
