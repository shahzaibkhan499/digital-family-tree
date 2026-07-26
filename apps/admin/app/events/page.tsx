'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { adminFetch } from '@/lib/admin-api';

interface EventStats {
  total: number;
  upcoming: number;
  today: number;
  completed: number;
  cancelled: number;
  byEventType: { eventType: string; count: number }[];
}

interface TimelineEvent {
  id: string;
  displayId: string;
  title: string;
  eventType: string;
  status: string;
  date: string | null;
  time: string | null;
  location: string | null;
  venue: string | null;
  description: string | null;
  family: { id: string; name: string } | null;
  member: { id: string; firstName: string; lastName: string } | null;
  _count: { participants: number; reminders: number; media: number };
  createdAt: string;
}

interface EventsResponse {
  events: TimelineEvent[];
  total: number;
  totalPages: number;
}

function StatCard({ title, value, description, color }: { title: string; value: string | number; description: string; color?: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className={`mt-2 text-3xl font-bold ${color || ''}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
      <p className="text-sm text-destructive">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 text-sm font-medium text-primary hover:underline">Retry</button>
      )}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  UPCOMING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  TODAY: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  LIVE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  COMPLETED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  POSTPONED: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  ARCHIVED: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  BIRTH: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  MARRIAGE: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  DEATH: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  GRADUATION: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  EDUCATION: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  CAREER: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  FAMILY_REUNION: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  CUSTOM_EVENT: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
};

const EVENT_TYPES = [
  'BIRTH', 'MARRIAGE', 'DEATH', 'GRADUATION', 'ANNIVERSARY',
  'EDUCATION', 'CAREER', 'FAMILY_REUNION', 'CUSTOM_EVENT',
];

const STATUS_TYPES = ['UPCOMING', 'TODAY', 'LIVE', 'COMPLETED', 'CANCELLED', 'POSTPONED', 'ARCHIVED'];

export default function AdminEventsPage() {
  const [stats, setStats] = useState<EventStats | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadEvents = useCallback(async (pageNum: number, searchVal: string, typeFilter: string, statFilter: string) => {
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: '20' });
      if (searchVal) params.set('search', searchVal);
      if (typeFilter) params.set('eventType', typeFilter);
      if (statFilter) params.set('status', statFilter);
      const data = await adminFetch<EventsResponse>(`/timeline?${params.toString()}`);
      setEvents(data.events || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch { setEvents([]); }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await adminFetch<EventStats>('/timeline/stats');
      setStats(data);
    } catch { setStats(null); }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadStats(), loadEvents(1, '', '', '')]);
    } catch { setError('Failed to load events. Is the API running?'); }
    finally { setLoading(false); }
  }, [loadStats, loadEvents]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  useEffect(() => {
    loadEvents(page, debouncedSearch, eventTypeFilter, statusFilter);
  }, [page, debouncedSearch, eventTypeFilter, statusFilter, loadEvents]);

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this event?')) return;
    setActionLoading(id);
    try {
      await adminFetch(`/timeline/${id}/cancel`, { method: 'PATCH' });
      setEvents(prev => prev.map(e => e.id === id ? { ...e, status: 'CANCELLED' } : e));
      loadStats();
    } catch { setError('Failed to cancel event.'); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this event?')) return;
    setActionLoading(id);
    try {
      await adminFetch(`/timeline/${id}`, { method: 'DELETE' });
      setEvents(prev => prev.filter(e => e.id !== id));
      setSelectedEvent(null);
      loadStats();
    } catch { setError('Failed to delete event.'); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Events Management</h1>
        <p className="text-muted-foreground">Monitor and manage all family events across the platform. ({total} total)</p>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchAll} />}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard title="Total Events" value={stats?.total ?? 0} description="All events created" />
            <StatCard title="Upcoming" value={stats?.upcoming ?? 0} description="Events to come" color="text-blue-600" />
            <StatCard title="Today" value={stats?.today ?? 0} description="Events today" color="text-green-600" />
            <StatCard title="Completed" value={stats?.completed ?? 0} description="Past events" color="text-gray-600" />
            <StatCard title="Cancelled" value={stats?.cancelled ?? 0} description="Cancelled events" color="text-red-600" />
          </div>

          {stats?.byEventType && stats.byEventType.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Events by Type</h3>
              <div className="flex flex-wrap gap-2">
                {stats.byEventType.map(t => (
                  <span key={t.eventType} className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${EVENT_TYPE_COLORS[t.eventType] || 'bg-gray-100 text-gray-800'}`}>
                    {t.eventType.replace(/_/g, ' ')}: {t.count}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-semibold">All Events</h3>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <select
                  value={eventTypeFilter}
                  onChange={(e) => { setEventTypeFilter(e.target.value); setPage(1); }}
                  className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All Types</option>
                  {EVENT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All Status</option>
                  {STATUS_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-muted-foreground">
                    <th className="px-6 py-3 font-medium">Event</th>
                    <th className="px-6 py-3 font-medium">Type</th>
                    <th className="px-6 py-3 font-medium">Family</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Venue</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Participants</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">No events found</td>
                    </tr>
                  ) : (
                    events.map((ev) => (
                      <tr key={ev.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-3">
                          <button onClick={() => setSelectedEvent(ev)} className="font-medium text-primary hover:underline text-left">
                            {ev.title}
                          </button>
                          <p className="text-xs text-muted-foreground font-mono">{ev.displayId}</p>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${EVENT_TYPE_COLORS[ev.eventType] || 'bg-gray-100 text-gray-800'}`}>
                            {ev.eventType.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">{ev.family?.name ?? '—'}</td>
                        <td className="px-6 py-3 text-muted-foreground">{ev.date ? new Date(ev.date).toLocaleDateString() : '—'}</td>
                        <td className="px-6 py-3 text-muted-foreground">{ev.venue || ev.location || '—'}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[ev.status] || 'bg-gray-100 text-gray-800'}`}>
                            {ev.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">{ev._count.participants}</td>
                        <td className="px-6 py-3">
                          <div className="flex gap-1">
                            {ev.status !== 'CANCELLED' && ev.status !== 'COMPLETED' && (
                              <button
                                onClick={() => handleCancel(ev.id)}
                                disabled={actionLoading === ev.id}
                                className="rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(ev.id)}
                              disabled={actionLoading === ev.id}
                              className="rounded bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive hover:text-white disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border/60 px-6 py-3">
                <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="rounded border border-border/60 px-3 py-1 text-xs font-medium disabled:opacity-50">Prev</button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded border border-border/60 px-3 py-1 text-xs font-medium disabled:opacity-50">Next</button>
                </div>
              </div>
            )}
          </div>

          {selectedEvent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedEvent(null)}>
              <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card p-6 shadow-xl border border-border/60" onClick={e => e.stopPropagation()}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold">{selectedEvent.title}</h2>
                    <p className="text-xs text-muted-foreground font-mono">{selectedEvent.displayId}</p>
                  </div>
                  <button onClick={() => setSelectedEvent(null)} className="rounded p-1 text-muted-foreground hover:text-foreground">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className={`font-medium px-2 py-0.5 rounded-full text-xs ${EVENT_TYPE_COLORS[selectedEvent.eventType] || ''}`}>{selectedEvent.eventType.replace(/_/g, ' ')}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={`font-medium px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[selectedEvent.status] || ''}`}>{selectedEvent.status}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Family</span><span className="font-medium">{selectedEvent.family?.name ?? '—'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString() : '—'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium">{selectedEvent.time ?? '—'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Venue</span><span className="font-medium">{selectedEvent.venue ?? '—'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span className="font-medium">{selectedEvent.location ?? '—'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Participants</span><span className="font-medium">{selectedEvent._count.participants}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Media</span><span className="font-medium">{selectedEvent._count.media}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span className="font-medium">{new Date(selectedEvent.createdAt).toLocaleString()}</span></div>
                  {selectedEvent.description && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-muted-foreground mb-1">Description</p>
                      <p>{selectedEvent.description}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-6 pt-4 border-t">
                  {selectedEvent.status !== 'CANCELLED' && selectedEvent.status !== 'COMPLETED' && (
                    <button onClick={() => { handleCancel(selectedEvent.id); setSelectedEvent(null); }} className="rounded bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100">Cancel Event</button>
                  )}
                  <button onClick={() => { handleDelete(selectedEvent.id); }} className="rounded bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive hover:text-white">Delete</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
