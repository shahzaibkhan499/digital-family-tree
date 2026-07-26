'use client';

import { useState, useEffect, useCallback } from 'react';
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
  URGENT: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  NORMAL: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  LOW: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

const CATEGORY_COLORS: Record<string, string> = {
  ACCOUNT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  FAMILY: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  INVITATION: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  REMINDER: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  SOCIAL: 'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400',
  DOCUMENT: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400',
  SECURITY: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  ADMIN: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
  BILLING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  GENERAL: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

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
  if (diffDay < 30) return `${diffDay}d ago`;
  return formatDate(dateStr);
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const options: any = { page, limit: 20 };
      if (filter === 'unread') options.isRead = false;
      if (filter === 'read') options.isRead = true;
      if (filter === 'archived') options.isArchived = true;
      if (searchQuery) options.search = searchQuery;
      if (typeFilter) options.type = typeFilter;
      if (categoryFilter) options.category = categoryFilter;
      if (dateRange.from) options.dateFrom = dateRange.from;
      if (dateRange.to) options.dateTo = dateRange.to;

      const result = await api.notifications.list(options);
      setNotifications(result.notifications);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch { /* empty */ }
    setLoading(false);
  }, [page, filter, searchQuery, typeFilter, categoryFilter, dateRange]);

  const fetchStats = useCallback(async () => {
    try {
      const s = await api.notifications.stats();
      setStats(s);
    } catch { /* empty */ }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleMarkRead = async (id: string) => {
    await api.notifications.markRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n));
    fetchStats();
  };

  const handleMarkAllRead = async () => {
    await api.notifications.markAllRead();
    fetchNotifications();
    fetchStats();
  };

  const handleArchive = async (id: string) => {
    await api.notifications.archive(id);
    fetchNotifications();
    fetchStats();
  };

  const handleDelete = async (id: string) => {
    await api.notifications.delete(id);
    fetchNotifications();
    fetchStats();
  };

  const handleClearRead = async () => {
    await api.notifications.clearRead();
    fetchNotifications();
    fetchStats();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your notifications and preferences</p>
        </div>
        <div className="flex gap-2">
          {stats && stats.unread > 0 && (
            <button onClick={handleMarkAllRead} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-all">
              Mark all read
            </button>
          )}
          <Link href="/dashboard/notifications/preferences" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-all">
            Preferences
          </Link>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total', value: stats.total, color: 'slate' },
            { label: 'Unread', value: stats.unread, color: 'emerald' },
            { label: 'Today', value: stats.todayCount, color: 'blue' },
            { label: 'This Week', value: stats.weekCount, color: 'amber' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
        </div>
        <div className="flex gap-2">
          <select value={filter} onChange={(e) => { setFilter(e.target.value as any); setPage(1); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
            <option value="archived">Archived</option>
          </select>
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <option value="">All Types</option>
            <option value="WELCOME">Welcome</option>
            <option value="FAMILY_CREATED">Family Created</option>
            <option value="MEMBER_ADDED">Member Added</option>
            <option value="RELATIONSHIP_ADDED">Relationship</option>
            <option value="FAMILY_INVITATION">Invitation</option>
            <option value="LOGIN_ALERT">Login Alert</option>
            <option value="PASSWORD_CHANGED">Password Changed</option>
            <option value="ADMIN_ANNOUNCEMENT">Admin</option>
          </select>
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <option value="">All Categories</option>
            <option value="ACCOUNT">Account</option>
            <option value="FAMILY">Family</option>
            <option value="INVITATION">Invitation</option>
            <option value="SECURITY">Security</option>
            <option value="ADMIN">Admin</option>
            <option value="BILLING">Billing</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">No notifications found</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {filter === 'all' ? "You're all caught up!" : `No ${filter} notifications`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.map((n: any) => (
              <div key={n.id} className={`group flex gap-4 px-6 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!n.isRead ? 'bg-emerald-50/30 dark:bg-emerald-900/5' : ''}`}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl dark:bg-slate-800">
                  {TYPE_ICONS[n.type] || 'ðŸ””'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm leading-snug ${!n.isRead ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                          {n.title}
                        </p>
                        {!n.isRead && <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />}
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{n.message}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-slate-400 dark:text-slate-500">{formatRelativeTime(n.createdAt)}</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_COLORS[n.priority] || PRIORITY_COLORS.NORMAL}`}>
                          {n.priority}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[n.category] || CATEGORY_COLORS.GENERAL}`}>
                          {n.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {n.actionUrl && (
                        <Link href={n.actionUrl} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-700" title="View">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </Link>
                      )}
                      {!n.isRead && (
                        <button onClick={() => handleMarkRead(n.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-700" title="Mark read">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </button>
                      )}
                      {filter !== 'archived' && (
                        <button onClick={() => handleArchive(n.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-700" title="Archive">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                        </button>
                      )}
                      <button onClick={() => handleDelete(n.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-700" title="Delete">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing {((page - 1) * 20) + 1} - {Math.min(page * 20, total)} of {total}
          </p>
          <div className="flex gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page + i - 2;
              if (p < 1 || p > totalPages) return null;
              return (
                <button key={p} onClick={() => setPage(p)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${p === page ? 'bg-emerald-600 text-white' : 'border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
