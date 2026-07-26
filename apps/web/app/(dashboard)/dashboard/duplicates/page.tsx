'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';

interface DuplicatePair {
  id: string;
  leftMember: any;
  rightMember: any;
  confidence: number;
  status: string;
  matchIndicators: Record<string, boolean>;
  createdAt: string;
}

interface DuplicateStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

const TABS = ['all', 'pending', 'approved', 'rejected'] as const;

function MatchIndicator({ label, matched }: { label: string; matched: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${matched ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500'}`}>
      {label} {matched ? 'âœ“' : 'âœ—'}
    </span>
  );
}

function ProgressBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{score}%</span>
    </div>
  );
}

function ScanAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        <svg className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">Scanning for duplicates...</p>
    </div>
  );
}

function EmptyState({ tab }: { tab: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
      <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">No {tab} duplicates</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {tab === 'all' ? 'No duplicate members detected yet. Run a scan to get started.' : `No ${tab} duplicates found.`}
      </p>
    </div>
  );
}

function DuplicateCard({ pair }: { pair: DuplicatePair }) {
  const indicators = pair.matchIndicators || {};
  const indicatorEntries = Object.entries(indicators);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
            {pair.leftMember?.firstName?.charAt(0) || '?'}{pair.leftMember?.lastName?.charAt(0) || '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900 dark:text-white">
              {pair.leftMember?.firstName} {pair.leftMember?.lastName}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {pair.leftMember?.family?.name || 'Unknown family'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>

        <div className="flex flex-1 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            {pair.rightMember?.firstName?.charAt(0) || '?'}{pair.rightMember?.lastName?.charAt(0) || '?'}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900 dark:text-white">
              {pair.rightMember?.firstName} {pair.rightMember?.lastName}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {pair.rightMember?.family?.name || 'Unknown family'}
            </p>
          </div>
        </div>
      </div>

      {indicatorEntries.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {indicatorEntries.map(([key, matched]) => (
            <MatchIndicator key={key} label={key} matched={matched as boolean} />
          ))}
        </div>
      )}

      <div className="mt-3">
        <ProgressBar score={pair.confidence} />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          pair.status === 'PENDING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
          pair.status === 'APPROVED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
        }`}>
          {pair.status}
        </span>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/duplicates/${pair.id}`}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            View Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

export default function DuplicatesPage() {
  const [duplicates, setDuplicates] = useState<DuplicatePair[]>([]);
  const [stats, setStats] = useState<DuplicateStats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadDuplicates = useCallback(async (status?: string, p?: number) => {
    setLoading(true);
    try {
      const params: any = { page: p || page, limit: 12 };
      if (status && status !== 'all') params.status = status.toUpperCase();
      const result = await api.duplicates.list(params);
      const items = Array.isArray(result) ? result : result?.items || result?.duplicates || [];
      setDuplicates(items);
      setTotalPages(result?.totalPages || 1);

      const all = await api.duplicates.list({ limit: 1000 }).catch(() => ({ items: [] }));
      const allItems = Array.isArray(all) ? all : all?.items || all?.duplicates || [];
      setStats({
        total: allItems.length,
        pending: allItems.filter((d: any) => d.status === 'PENDING').length,
        approved: allItems.filter((d: any) => d.status === 'APPROVED').length,
        rejected: allItems.filter((d: any) => d.status === 'REJECTED').length,
      });
    } catch {
      setDuplicates([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadDuplicates(activeTab); }, [activeTab, loadDuplicates]);

  const handleScan = async () => {
    setScanning(true);
    try {
      await api.duplicates.detect();
      await loadDuplicates(activeTab, 1);
      setPage(1);
    } catch {
      /* empty */
    } finally {
      setScanning(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Duplicate Detection</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Find and merge duplicate members across your families.</p>
        </div>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <svg className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {scanning ? 'Scanning...' : 'Scan Now'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Duplicates" value={stats.total} color="text-slate-900 dark:text-white" />
        <StatCard label="Pending Review" value={stats.pending} color="text-amber-600" />
        <StatCard label="Approved" value={stats.approved} color="text-green-600" />
        <StatCard label="Rejected" value={stats.rejected} color="text-red-600" />
      </div>

      <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${
              activeTab === tab
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {scanning ? (
        <ScanAnimation />
      ) : loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      ) : duplicates.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <>
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {duplicates.map((pair) => (
                <DuplicateCard key={pair.id} pair={pair} />
              ))}
            </AnimatePresence>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
