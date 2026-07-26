'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, FileText, Clock, Trash2, Send, Edit3, ChevronRight,
  AlertTriangle, Loader2, Eye,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import {
  getEventConfig, formatDate, formatRelative, STATUS_CONFIG,
} from '../components/constants';

function SkeletonDraft() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="animate-pulse space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DraftsPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await api.timeline.getDrafts();
      setDrafts(Array.isArray(data) ? data : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this draft? This action cannot be undone.')) return;
    setDeletingId(id);
    try {
      await api.timeline.delete(id);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    } catch {
      /* empty */
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublish = async (id: string) => {
    setPublishingId(id);
    try {
      await api.timeline.publish(id);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    } catch {
      /* empty */
    } finally {
      setPublishingId(null);
    }
  };

  const handleContinueEditing = (id: string) => {
    router.push(`/dashboard/timeline/${id}/edit`);
  };

  const getCompletionPercent = (draft: any) => {
    let score = 0;
    if (draft.title) score += 15;
    if (draft.date) score += 10;
    if (draft.category) score += 5;
    if (draft.familyId) score += 10;
    if ((draft.participantIds || []).length > 0) score += 5;
    if (draft.coverImage || (draft.media || []).length > 0) score += 10;
    if ((draft.media || []).length > 0) score += 5;
    if ((draft.documents || []).length > 0) score += 10;
    if (draft.visibility) score += 5;
    if ((draft.notificationChannels || []).length > 0) score += 10;
    if (draft.tags && draft.tags.length > 0) score += 5;
    if (draft.status) score += 10;
    return Math.min(100, score);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <a
        href="#drafts-content"
        className="skip-link"
      >
        Skip to drafts content
      </a>
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/dashboard" className="hover:text-emerald-600 transition-colors">Dashboard</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/dashboard/timeline" className="hover:text-emerald-600 transition-colors">Timeline</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-900 dark:text-white font-medium">Drafts</span>
      </nav>

      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/timeline"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Drafts
              {!loading && drafts.length > 0 && (
                <span className="ml-3 inline-flex items-center justify-center rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {drafts.length}
                </span>
              )}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Continue editing your unpublished events
            </p>
          </div>
        </div>
      </div>

      {loading && <SkeletonDraft />}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-12 text-center dark:border-red-900/40 dark:bg-red-900/10">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-400 mb-4">Failed to load drafts</p>
          <button
            onClick={loadDrafts}
            className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && drafts.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FileText className="h-8 w-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="empty-state-title">No drafts yet</h3>
          <p className="empty-state-description">
            When you save an event as a draft, it will appear here so you can continue editing later.
          </p>
          <Link
            href="/dashboard/timeline/new"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            <Edit3 className="h-4 w-4" /> Create New Event
          </Link>
        </div>
      )}

      {!loading && !error && drafts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {drafts.map((draft, i) => {
              const config = getEventConfig(draft.eventType);
              const completion = getCompletionPercent(draft);
              const isDeleting = deletingId === draft.id;
              const isPublishing = publishingId === draft.id;

              return (
                <motion.div
                  key={draft.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${config.color}`}>
                        {config.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {draft.title || 'Untitled Draft'}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color}`}>
                            {config.label}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {draft.createdAt ? formatRelative(draft.createdAt) : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Completion</span>
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{completion}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <motion.div
                        className={`h-full rounded-full ${
                          completion < 25 ? 'bg-gradient-to-r from-red-500 to-rose-500' :
                          completion < 50 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                          completion < 75 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                          'bg-gradient-to-r from-emerald-500 to-green-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${completion}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                  </div>

                  {draft.updatedAt && (
                    <p className="mb-4 text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last saved {formatRelative(draft.updatedAt)}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleContinueEditing(draft.id)}
                      disabled={isDeleting || isPublishing}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </button>

                    <button
                      onClick={() => handlePublish(draft.id)}
                      disabled={isDeleting || isPublishing}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-colors"
                    >
                      {isPublishing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      {isPublishing ? 'Publishing...' : 'Publish'}
                    </button>

                    <button
                      onClick={() => handleDelete(draft.id)}
                      disabled={isDeleting || isPublishing}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:border-red-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:border-slate-700 dark:hover:border-red-800 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
