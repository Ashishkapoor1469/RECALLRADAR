'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { API_BASE_URL, getApiUrl } from '../lib/api';

import { motion, AnimatePresence } from 'framer-motion';

interface SidebarNavProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function SidebarNav({ isOpenMobile = false, onCloseMobile }: SidebarNavProps) {
  const pathname = usePathname();
  const [systemStatus, setSystemStatus] = useState<{
    dataset_name: string;
    total_reviews: number;
    total_products: number;
    database_engine: string;
    last_ingest_time: string;
    classifier_type: string;
  } | null>(null);
  const [highRiskCount, setHighRiskCount] = useState<number | null>(null);

  useEffect(() => {
    fetchSystemStatus();
    fetchRiskStats();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const res = await fetch(getApiUrl('/api/v1/system/status'));
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data);
      }
    } catch (e) {
      console.error('Error loading system status:', e);
    }
  };

  const fetchRiskStats = async () => {
    try {
      const res = await fetch(getApiUrl('/api/v1/risk-queue/stats'));
      if (res.ok) {
        const data = await res.json();
        setHighRiskCount(data.high_risk_count ?? 14);
      }
    } catch (e) {
      console.error('Error loading risk stats:', e);
    }
  };

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
      badge: highRiskCount !== null ? String(highRiskCount) : undefined,
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
      aiBadge: 'RAG AI',
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

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full py-6 px-5 select-none">
      <div>
        {/* App Logo & Identity */}
        <div className="flex items-center justify-between px-2 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-900 via-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-700/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 4a6 6 0 0 1 6 6m-6-3a3 3 0 0 1 3 3m-3-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2"></path>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-slate-900 text-lg">RecallRadar</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200">LIVE</span>
              </div>
              <p className="text-xs font-medium text-slate-400">Safety Intelligence</p>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="space-y-6">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">Core Navigation</span>
            <nav className="mt-2 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => onCloseMobile?.()}
                    className={`relative flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition group ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-sidebar-pill"
                        className="absolute inset-0 bg-brand-700 rounded-xl shadow-sm shadow-brand-700/20 z-0"
                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                      />
                    )}

                    <div className="relative z-10 flex items-center gap-3">
                      <span className={isActive ? 'text-brand-200' : 'text-slate-400 group-hover:text-brand-600 transition'}>
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </div>

                    {item.badge && (
                      <span className={`relative z-10 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full ${
                        isActive
                          ? 'bg-rose-500 text-white'
                          : 'bg-rose-50 text-rose-600 border border-rose-200'
                      }`}>
                        {item.badge}
                      </span>
                    )}

                    {item.aiBadge && (
                      <span className={`relative z-10 text-[9px] font-bold tracking-tight px-1.5 py-0.5 rounded-full ${
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

      {/* Data Source Card Footer */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <div className="bg-slate-900 rounded-2xl p-3.5 text-white shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Data Source</span>
            </div>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {systemStatus?.database_engine || 'PostgreSQL'}
            </span>
          </div>

          <div className="text-xs font-bold text-slate-100 truncate mb-2">
            {systemStatus?.dataset_name || 'Amazon Musical Instruments'}
          </div>

          <div className="grid grid-cols-2 gap-1.5 py-2 border-t border-b border-slate-800 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[9px] font-medium uppercase">Reviews</span>
              <span className="font-extrabold text-white">
                {systemStatus ? systemStatus.total_reviews.toLocaleString() : '10,334'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] font-medium uppercase">Products</span>
              <span className="font-extrabold text-white">
                {systemStatus ? systemStatus.total_products.toLocaleString() : '906'}
              </span>
            </div>
          </div>

          <div className="mt-2 text-[10px] text-slate-400 leading-tight">
            <div className="truncate"><span className="text-slate-500">Classifier:</span> {systemStatus?.classifier_type || 'Lexicon Safety Engine'}</div>
            <div className="text-[9px] text-slate-500 mt-1 truncate">{systemStatus?.last_ingest_time}</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 z-30 bg-white border-r border-slate-200/80 overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-out Drawer Overlay */}
      <AnimatePresence>
        {isOpenMobile && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
              onClick={onCloseMobile}
            />
            {/* Drawer Content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl z-10 overflow-y-auto"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
