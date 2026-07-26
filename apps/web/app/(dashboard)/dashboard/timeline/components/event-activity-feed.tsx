'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusCircle, Edit, Globe, Trash2, Archive, Pin, Star, MessageCircle,
  Heart, FileText, Users, Activity,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { formatRelative } from './constants';

interface ActivityEntry {
  id: string;
  action: string;
  description?: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  createdAt: string;
  details?: any;
}

const ACTION_CONFIG: Record<string, { icon: any; color: string; dotColor: string }> = {
  EVENT_CREATED:   { icon: PlusCircle,   color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20',  dotColor: 'bg-emerald-500' },
  EVENT_UPDATED:   { icon: Edit,         color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',            dotColor: 'bg-blue-500' },
  EVENT_PUBLISHED: { icon: Globe,        color: 'text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-900/20',           dotColor: 'bg-teal-500' },
  EVENT_DELETED:   { icon: Trash2,       color: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20',            dotColor: 'bg-rose-500' },
  EVENT_ARCHIVED:  { icon: Archive,      color: 'text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800',          dotColor: 'bg-slate-400' },
  EVENT_PINNED:    { icon: Pin,          color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20',        dotColor: 'bg-amber-500' },
  EVENT_FEATURED:  { icon: Star,         color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20',    dotColor: 'bg-purple-500' },
  COMMENT_ADDED:   { icon: MessageCircle,color: 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/20',    dotColor: 'bg-indigo-500' },
  REACTION_ADDED:  { icon: Heart,        color: 'text-pink-600 bg-pink-50 dark:text-pink-400 dark:bg-pink-900/20',           dotColor: 'bg-pink-500' },
  DOCUMENT_ADDED:  { icon: FileText,     color: 'text-cyan-600 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-900/20',           dotColor: 'bg-cyan-500' },
  RSVP_CHANGED:    { icon: Users,        color: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20',    dotColor: 'bg-orange-500' },
};

function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex gap-3">
          <div className="relative flex flex-col items-center">
            <div className="h-3 w-3 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
            {i < 4 && <div className="mt-1 w-px flex-1 animate-pulse bg-slate-200 dark:bg-slate-700" />}
          </div>
          <div className="flex-1 space-y-2 pb-4">
            <div className="h-3 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-2 w-20 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityItem({ entry, isLast }: { entry: ActivityEntry; isLast: boolean }) {
  const config = ACTION_CONFIG[entry.action] || {
    icon: Activity,
    color: 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800',
    dotColor: 'bg-slate-400',
  };
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-3"
    >
      {/* Timeline line and dot */}
      <div className="relative flex flex-col items-center">
        <div className={`h-3 w-3 shrink-0 rounded-full ${config.dotColor} ring-2 ring-white dark:ring-slate-900`} />
        {!isLast && <div className="mt-1 w-px flex-1 bg-slate-200 dark:bg-slate-700" />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="flex items-start gap-2.5">
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${config.color}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {/* User avatar */}
              <div className="h-5 w-5 shrink-0 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                {entry.userAvatar ? (
                  <img src={entry.userAvatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[8px] font-medium text-emerald-700 dark:text-emerald-400">
                    {(entry.userName || 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {entry.userName || 'Unknown'}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {entry.description || entry.action.replace(/_/g, ' ').toLowerCase()}
            </p>
            <span className="mt-0.5 block text-[11px] text-slate-400 dark:text-slate-500">
              {formatRelative(entry.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function EventActivityFeed({ eventId }: { eventId: string }) {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchActivities = useCallback(async (p: number, append = false) => {
    try {
      const res = await api.timeline.getActivity(eventId, p, 20);
      const items = Array.isArray(res?.activities) ? res.activities : [];
      setActivities(prev => append ? [...prev, ...items] : items);
      setTotalPages(res?.totalPages || 1);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [eventId]);

  useEffect(() => { fetchActivities(1); }, [fetchActivities]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setLoadingMore(true);
    fetchActivities(nextPage, true);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <Activity className="h-4 w-4 text-slate-500" />
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Activity</span>
      </div>

      <div className="p-4">
        {loading ? (
          <ActivitySkeleton />
        ) : activities.length === 0 ? (
          <div className="py-8 text-center">
            <Activity className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">No activity yet.</p>
          </div>
        ) : (
          <div className="relative">
            <AnimatePresence>
              {activities.map((entry, i) => (
                <ActivityItem
                  key={entry.id}
                  entry={entry}
                  isLast={i === activities.length - 1}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Load more */}
        {!loading && page < totalPages && (
          <div className="text-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 disabled:opacity-50"
            >
              {loadingMore ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
