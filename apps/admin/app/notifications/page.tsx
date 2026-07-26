'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '@/lib/admin-api';

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'notifications' | 'analytics' | 'broadcast'>('notifications');

  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    type: 'ADMIN_ANNOUNCEMENT',
    priority: 'HIGH',
    target: 'everyone',
  });
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<any>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      if (categoryFilter) params.set('category', categoryFilter);
      if (userIdFilter) params.set('userId', userIdFilter);

      const data = await adminFetch<{ notifications: any[]; total: number; totalPages: number }>(`/notifications/all?${params.toString()}`);
      setNotifications(data.notifications || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, search, typeFilter, categoryFilter, userIdFilter]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const data = await adminFetch<any>('/notifications/analytics');
      setAnalytics(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);
  useEffect(() => { if (activeTab === 'analytics') fetchAnalytics(); }, [activeTab, fetchAnalytics]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this notification?')) return;
    try {
      await adminFetch(`/notifications/${id}`, { method: 'DELETE' });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch { /* ignore */ }
  };

  const handleBroadcast = async () => {
    if (!broadcastForm.title || !broadcastForm.message) return;
    setBroadcastSending(true);
    setBroadcastResult(null);
    try {
      const result = await adminFetch<any>('/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify(broadcastForm),
      });
      setBroadcastResult(result);
      setBroadcastForm({ title: '', message: '', type: 'ADMIN_ANNOUNCEMENT', priority: 'HIGH', target: 'everyone' });
    } catch (err: any) {
      setBroadcastResult({ error: err.message });
    }
    setBroadcastSending(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">Manage and broadcast notifications to users</p>
      </div>

      <div className="flex gap-1 rounded-lg border border-border/60 bg-card p-1">
        {(['notifications', 'analytics', 'broadcast'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <input type="text" placeholder="Search notifications..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm">
              <option value="">All Types</option>
              <option value="WELCOME">Welcome</option>
              <option value="FAMILY_CREATED">Family Created</option>
              <option value="MEMBER_ADDED">Member Added</option>
              <option value="FAMILY_INVITATION">Invitation</option>
              <option value="LOGIN_ALERT">Login Alert</option>
              <option value="ADMIN_ANNOUNCEMENT">Admin Announcement</option>
            </select>
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm">
              <option value="">All Categories</option>
              <option value="ACCOUNT">Account</option>
              <option value="FAMILY">Family</option>
              <option value="INVITATION">Invitation</option>
              <option value="SECURITY">Security</option>
              <option value="ADMIN">Admin</option>
              <option value="BILLING">Billing</option>
            </select>
            <input type="text" placeholder="Filter by user ID..." value={userIdFilter} onChange={(e) => { setUserIdFilter(e.target.value); setPage(1); }} className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-muted-foreground">
                    <th className="px-6 py-3 font-medium">Title</th>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium">User</th>
                    <th className="px-6 py-3 font-medium">Priority</th>
                    <th className="px-6 py-3 font-medium">Read</th>
                    <th className="px-6 py-3 font-medium">Created</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">No notifications found</td></tr>
                  ) : (
                    notifications.map((n: any) => (
                      <tr key={n.id} className="border-b border-border/30 last:border-0">
                        <td className="px-6 py-3 font-medium max-w-[200px] truncate">{n.title}</td>
                        <td className="px-6 py-3"><span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">{n.type}</span></td>
                        <td className="px-6 py-3 text-muted-foreground">{n.user?.name || 'Unknown'}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            n.priority === 'URGENT' ? 'bg-red-100 text-red-700' : n.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-secondary text-secondary-foreground'
                          }`}>{n.priority}</span>
                        </td>
                        <td className="px-6 py-3">
                          {n.isRead ? <span className="text-green-600">✓</span> : <span className="text-muted-foreground">○</span>}
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">{formatDate(n.createdAt)}</td>
                        <td className="px-6 py-3">
                          <button onClick={() => handleDelete(n.id)} className="text-destructive hover:underline text-xs">Delete</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/60 px-6 py-3">
                  <span className="text-xs text-muted-foreground">Page {page} of {totalPages} ({total} total)</span>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="rounded border border-border/60 px-3 py-1 text-xs font-medium disabled:opacity-50">Prev</button>
                    <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="rounded border border-border/60 px-3 py-1 text-xs font-medium disabled:opacity-50">Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-border/60 bg-card p-6"><p className="text-sm text-muted-foreground">Total</p><p className="mt-2 text-3xl font-bold">{analytics.total}</p></div>
            <div className="rounded-xl border border-border/60 bg-card p-6"><p className="text-sm text-muted-foreground">Unread</p><p className="mt-2 text-3xl font-bold">{analytics.unread}</p></div>
            <div className="rounded-xl border border-border/60 bg-card p-6"><p className="text-sm text-muted-foreground">Archived</p><p className="mt-2 text-3xl font-bold">{analytics.archived}</p></div>
            <div className="rounded-xl border border-border/60 bg-card p-6"><p className="text-sm text-muted-foreground">Today</p><p className="mt-2 text-3xl font-bold">{analytics.todayCount}</p></div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <h3 className="font-semibold mb-3">By Type</h3>
              <div className="space-y-2">
                {analytics.byType?.map((t: any) => (
                  <div key={t.type} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t.type}</span>
                    <span className="font-medium">{t.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-6">
              <h3 className="font-semibold mb-3">By Category</h3>
              <div className="space-y-2">
                {analytics.byCategory?.map((c: any) => (
                  <div key={c.category} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{c.category}</span>
                    <span className="font-medium">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-6">
            <h3 className="font-semibold mb-3">Recent Audit Logs</h3>
            <div className="space-y-2">
              {analytics.recentActivity?.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between text-sm border-b border-border/30 py-2 last:border-0">
                  <div><span className="font-medium">{a.action}</span> on <span className="text-muted-foreground">{a.notification?.title}</span></div>
                  <div className="text-xs text-muted-foreground">{a.performer?.name} · {formatDate(a.createdAt)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'broadcast' && (
        <div className="max-w-xl space-y-4">
          <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <input type="text" value={broadcastForm.title} onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })} className="mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Notification title" />
            </div>
            <div>
              <label className="text-sm font-medium">Message *</label>
              <textarea value={broadcastForm.message} onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })} className="mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" rows={3} placeholder="Notification message" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Priority</label>
                <select value={broadcastForm.priority} onChange={(e) => setBroadcastForm({ ...broadcastForm, priority: e.target.value })} className="mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm">
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Target Audience</label>
                <select value={broadcastForm.target} onChange={(e) => setBroadcastForm({ ...broadcastForm, target: e.target.value })} className="mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm">
                  <option value="everyone">Everyone</option>
                  <option value="premium">Premium Users</option>
                  <option value="free">Free Users</option>
                  <option value="admins">Admins</option>
                </select>
              </div>
            </div>
            <button onClick={handleBroadcast} disabled={broadcastSending || !broadcastForm.title || !broadcastForm.message} className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {broadcastSending ? 'Sending...' : 'Broadcast Notification'}
            </button>
          </div>

          {broadcastResult && (
            <div className={`rounded-lg p-4 text-sm ${broadcastResult.error ? 'border border-destructive/20 bg-destructive/5 text-destructive' : 'border border-green-200 bg-green-50 text-green-700'}`}>
              {broadcastResult.error ? `Error: ${broadcastResult.error}` : `Broadcast sent to ${broadcastResult.sent} users (${broadcastResult.target})`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
