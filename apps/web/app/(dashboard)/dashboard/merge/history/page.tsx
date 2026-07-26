'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';

interface MergeSnapshot {
  id: string;
  sourceMember: any;
  targetMember: any;
  strategy: string;
  undone: boolean;
  createdAt: string;
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
      <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">No merge history</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Merges you perform will appear here. You can undo any merge that hasn&apos;t been undone.
      </p>
    </div>
  );
}

export default function MergeHistoryPage() {
  const [snapshots, setSnapshots] = useState<MergeSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [undoingId, setUndoingId] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.merge.history();
      const items = Array.isArray(data) ? data : (data as any)?.items || (data as any)?.snapshots || [];
      setSnapshots(items);
    } catch {
      setSnapshots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleUndo = async (snapshotId: string) => {
    if (!confirm('Undo this merge? This will restore the original members.')) return;
    setUndoingId(snapshotId);
    try {
      await api.merge.undo(snapshotId);
      setSnapshots((prev) =>
        prev.map((s) => s.id === snapshotId ? { ...s, undone: true } : s)
      );
    } catch {
      /* empty */
    } finally {
      setUndoingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/merge" className="text-sm text-indigo-600 hover:text-indigo-700">
            â† Back to merge
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Merge History</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">View and manage past member merges.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      ) : snapshots.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {snapshots.map((snap) => (
              <motion.div
                key={snap.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                        {snap.sourceMember?.firstName?.charAt(0) || '?'}{snap.sourceMember?.lastName?.charAt(0) || '?'}
                      </div>
                      <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        {snap.targetMember?.firstName?.charAt(0) || '?'}{snap.targetMember?.lastName?.charAt(0) || '?'}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {snap.sourceMember?.firstName} {snap.sourceMember?.lastName} â†’ {snap.targetMember?.firstName} {snap.targetMember?.lastName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(snap.createdAt).toLocaleDateString()} Â· Strategy: {snap.strategy?.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {snap.undone ? (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        Undone
                      </span>
                    ) : (
                      <>
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Merged
                        </span>
                        <button
                          onClick={() => handleUndo(snap.id)}
                          disabled={undoingId === snap.id}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-900/10"
                        >
                          {undoingId === snap.id ? 'Undoing...' : 'Undo'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
