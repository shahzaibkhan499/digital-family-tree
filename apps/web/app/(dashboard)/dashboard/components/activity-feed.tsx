'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, ArrowRight, Heart, Star, MessageCircle, UserPlus, FileText, GitBranch, AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Widget, SectionHeader, EmptyState, Avatar, Badge, SkeletonWidget } from './dashboard-widgets';

const ACTIVITY_ICONS: Record<string, { icon: any; color: string }> = {
  MEMBER_CREATED: { icon: UserPlus, color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20' },
  MEMORY_CREATED: { icon: Heart, color: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20' },
  TIMELINE_EVENT: { icon: Star, color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20' },
  DOCUMENT_UPLOADED: { icon: FileText, color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20' },
  TREE_UPDATED: { icon: GitBranch, color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20' },
  DUPLICATE_DETECTED: { icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20' },
  MERGE_COMPLETED: { icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20' },
};

function formatRelative(dateStr: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.activities.mine({ limit: 15 })
      .then((res) => setActivities(Array.isArray(res) ? res : res?.activities || []))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonWidget rows={4} />;

  return (
    <Widget>
      <SectionHeader title="Activity Feed" action="View All" actionHref="/dashboard/timeline" />
      {activities.length === 0 ? (
        <EmptyState
          icon={<Clock className="h-10 w-10" />}
          title="No activity yet"
          description="Start by creating a family or adding members to see activity here."
          action="Create Family"
          actionHref="/dashboard/families/new"
        />
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {activities.slice(0, 10).map((a: any, i: number) => {
            const config = ACTIVITY_ICONS[a.eventType] || ACTIVITY_ICONS.MEMBER_CREATED;
            const Icon = config.icon;
            return (
              <motion.div
                key={a.id || i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <Avatar src={a.user?.avatar} name={a.user?.name || a.createdBy || 'User'} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-semibold text-slate-900 dark:text-white">{a.user?.name || 'Someone'}</span>
                    {' '}
                    <span className="text-slate-500 dark:text-slate-400">{a.description || a.title || a.action || ''}</span>
                  </p>
                  {a.entityName && (
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">{a.entityName}</p>
                  )}
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">{formatRelative(a.createdAt)}</span>
                    {a.visibility && a.visibility !== 'Public' && (
                      <Badge>{a.visibility}</Badge>
                    )}
                  </div>
                </div>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </Widget>
  );
}
