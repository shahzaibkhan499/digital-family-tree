'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, ChevronDown, ChevronRight, ArrowRight, Clock } from 'lucide-react';
import { api } from '@/lib/api-client';
import { formatRelative, formatDate } from './constants';

interface HistoryEntry {
  id: string;
  action: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  timestamp: string;
  changes?: { field: string; oldValue: any; newValue: any }[];
  details?: any;
}

function HistorySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="animate-pulse rounded-lg border border-slate-200 p-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="mt-2 h-3 w-full rounded bg-slate-100 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  );
}

function HistoryEntryItem({ entry, index }: { entry: HistoryEntry; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const hasChanges = entry.changes && entry.changes.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
    >
      <button
        onClick={() => hasChanges && setExpanded(!expanded)}
        className={`flex w-full items-center gap-3 p-3 text-left ${hasChanges ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50' : ''} transition-colors rounded-lg`}
      >
        {hasChanges && (
          <motion.div
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          </motion.div>
        )}
        {!hasChanges && <div className="w-3.5" />}

        <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          {entry.userAvatar ? (
            <img src={entry.userAvatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
              {(entry.userName || 'U')[0].toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-700 dark:text-slate-300">
            <span className="font-medium">{entry.userName || 'Unknown'}</span>
            {' '}
            <span className="text-slate-500 dark:text-slate-400">{entry.action?.replace(/_/g, ' ').toLowerCase()}</span>
          </p>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {formatRelative(entry.timestamp)}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {expanded && hasChanges && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden border-t border-slate-100 dark:border-slate-800"
          >
            <div className="space-y-2 p-3">
              {entry.changes!.map((change, ci) => (
                <div key={ci} className="flex items-start gap-2">
                  <div className="mt-0.5 flex-1">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      {change.field}
                    </span>
                    <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className="inline-block rounded bg-rose-50 px-2 py-0.5 text-[11px] text-rose-600 line-through dark:bg-rose-900/20 dark:text-rose-400">
                        {change.oldValue != null ? String(change.oldValue) : 'â€”'}
                      </span>
                      <ArrowRight className="h-3 w-3 shrink-0 text-slate-400" />
                      <span className="inline-block rounded bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                        {change.newValue != null ? String(change.newValue) : 'â€”'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function EventHistory({ eventId }: { eventId: string }) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = useCallback(async (p: number, append = false) => {
    try {
      const res = await api.timeline.getHistory(eventId, p, 20);
      const items = Array.isArray(res?.history) ? res.history : [];
      setHistory(prev => append ? [...prev, ...items] : items);
      setTotalPages(res?.totalPages || 1);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { fetchHistory(1); }, [fetchHistory]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchHistory(nextPage, true);
  };

  // Group by date
  const grouped = history.reduce<Record<string, HistoryEntry[]>>((acc, entry) => {
    const dateKey = new Date(entry.timestamp).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(entry);
    return acc;
  }, {});

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <History className="h-4 w-4 text-slate-500" />
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">History</span>
      </div>

      <div className="p-4">
        {loading ? (
          <HistorySkeleton />
        ) : history.length === 0 ? (
          <div className="py-8 text-center">
            <History className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
              No history yet. Changes will be tracked when the event is updated.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([date, entries]) => (
              <div key={date}>
                <div className="mb-2 flex items-center gap-2">
                  <Clock className="h-3 w-3 text-slate-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {date}
                  </span>
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                </div>
                <div className="space-y-2">
                  {entries.map((entry, i) => (
                    <HistoryEntryItem key={entry.id} entry={entry} index={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load more */}
        {!loading && page < totalPages && (
          <div className="mt-4 text-center">
            <button
              onClick={loadMore}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              Load more history
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
