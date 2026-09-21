import type { Metadata } from 'next';
import ClientLayout from '../components/ClientLayout';
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
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
