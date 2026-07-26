'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bell, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Widget, SectionHeader, EmptyState, Avatar, Badge, SkeletonWidget } from './dashboard-widgets';

const PRIORITY_ICONS: Record<string, { icon: any; color: string }> = {
  critical: { icon: AlertCircle, color: 'text-rose-500' },
  normal: { icon: Bell, color: 'text-slate-500' },
  information: { icon: Info, color: 'text-blue-500' },
  low: { icon: CheckCircle, color: 'text-slate-400' },
};

function formatRelative(d: string) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsList() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.notifications.list({ limit: 6 })
      .then((res: any) => setNotifications(res?.notifications || (Array.isArray(res) ? res : [])))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonWidget rows={3} />;

  return (
    <Widget>
      <SectionHeader title="Notifications" action="View All" actionHref="/dashboard/notifications" />
      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-8 w-8" />}
          title="All caught up"
          description="No new notifications."
        />
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {notifications.slice(0, 5).map((n: any, i: number) => {
            const config = PRIORITY_ICONS[n.priority] || PRIORITY_ICONS.normal;
            const Icon = config.icon;
            return (
              <Link
                key={n.id || i}
                href={n.actionUrl || '/dashboard/notifications'}
                className={`flex items-start gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                  !n.read ? 'bg-emerald-50/30 dark:bg-emerald-900/5' : ''
                }`}
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${config.color}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{n.title || 'Notification'}</p>
                  {n.message && (
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">{n.message}</p>
                  )}
                  <span className="text-[11px] text-slate-400">{formatRelative(n.createdAt)}</span>
                </div>
                {!n.read && (
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </Widget>
  );
}
