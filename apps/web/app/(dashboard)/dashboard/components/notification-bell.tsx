'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';

const TYPE_ICONS: Record<string, string> = {
  WELCOME: 'ðŸŽ‰', PROFILE_COMPLETED: 'âœ…', PROFILE_APPROVED: 'âœ…',
  FAMILY_CREATED: 'ðŸ ', FAMILY_DELETED: 'ðŸ—‘ï¸',
  FAMILY_INVITATION: 'âœ‰ï¸', INVITATION_ACCEPTED: 'âœ…', INVITATION_DECLINED: 'âŒ',
  MEMBER_ADDED: 'ðŸ‘¤', MEMBER_UPDATED: 'âœï¸', MEMBER_DELETED: 'ðŸ‘¤',
  RELATIONSHIP_ADDED: 'ðŸ”—', RELATIONSHIP_UPDATED: 'ðŸ”„', RELATIONSHIP_REMOVED: 'ðŸ”—',
  MERGE_REQUEST: 'ðŸ”€', MERGE_APPROVED: 'âœ…', MERGE_REJECTED: 'âŒ',
  BIRTHDAY_REMINDER: 'ðŸŽ‚', DEATH_ANNIVERSARY: 'ðŸ•Šï¸', MEMORY_REMINDER: 'â­',
  TIMELINE_MENTION: '@', COMMENT: 'ðŸ’¬', REACTION: 'â¤ï¸',
  DOCUMENT_UPLOADED: 'ðŸ“„', DOCUMENT_APPROVED: 'ðŸ“„', DOCUMENT_REJECTED: 'ðŸ“„',
  LOGIN_ALERT: 'ðŸ”', PASSWORD_CHANGED: 'ðŸ”‘', EMAIL_CHANGED: 'ðŸ“§',
  USERNAME_CHANGED: '@', TWO_FACTOR_ENABLED: 'ðŸ›¡ï¸', SUSPICIOUS_LOGIN: 'âš ï¸',
  ADMIN_ANNOUNCEMENT: 'ðŸ“¢', SYSTEM_MAINTENANCE: 'ðŸ”§',
  SUBSCRIPTION: 'ðŸ’³', PAYMENT: 'ðŸ’°', STORAGE_LIMIT: 'ðŸ’¾',
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10',
  HIGH: 'border-l-orange-500 bg-orange-50/30 dark:bg-orange-900/10',
  NORMAL: 'border-l-transparent',
  LOW: 'border-l-slate-200 dark:border-l-slate-700',
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const badgePulseRef = useRef<boolean>(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await api.notifications.unreadCount();
      setUnreadCount(result.count);
    } catch { /* empty */ }
  }, []);

  const fetchRecentNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.notifications.list({ limit: 10 });
      setNotifications(result.notifications);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (isOpen) {
      fetchRecentNotifications();
    }
  }, [isOpen, fetchRecentNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.notifications.markRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch { /* empty */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch { /* empty */ }
  };

  const handleArchive = async (id: string) => {
    try {
      await api.notifications.archive(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (!notifications.find((n) => n.id === id)?.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch { /* empty */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.notifications.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (!notifications.find((n) => n.id === id)?.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch { /* empty */ }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
        title="Notifications"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[500px] rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 z-50 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && <p className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} unread</p>}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="rounded-lg px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 transition-colors">
                  Mark all read
                </button>
              )}
              <Link href="/dashboard/notifications" onClick={() => setIsOpen(false)} className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
                See all
              </Link>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">No notifications</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {notifications.map((n: any) => (
                  <div
                    key={n.id}
                    className={`group relative flex gap-3 px-4 py-3 border-l-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${PRIORITY_COLORS[n.priority] || PRIORITY_COLORS.NORMAL} ${!n.isRead ? 'bg-emerald-50/30 dark:bg-emerald-900/5' : ''}`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg dark:bg-slate-800">
                      {TYPE_ICONS[n.type] || 'ðŸ””'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug ${!n.isRead ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                          {n.title}
                        </p>
                        {!n.isRead && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{n.message}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">{formatRelativeTime(n.createdAt)}</span>
                        <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          n.priority === 'HIGH' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' :
                          n.priority === 'URGENT' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                          n.priority === 'LOW' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>{n.priority}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.isRead && (
                        <button onClick={() => handleMarkRead(n.id)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-700" title="Mark read">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </button>
                      )}
                      <button onClick={() => handleArchive(n.id)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-700" title="Archive">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                      </button>
                      <button onClick={() => handleDelete(n.id)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-700" title="Delete">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
