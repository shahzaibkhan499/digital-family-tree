'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { adminFetch } from '@/lib/admin-api';

interface ActivityStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

interface ActivityUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface Activity {
  id: string;
  user: ActivityUser;
  eventType: string;
  title: string;
  family?: string;
  description: string;
  createdAt: string;
}

interface ActivitiesResponse {
  activities: Activity[];
  total: number;
  totalPages: number;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  MEMBER_ADDED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  MEMBER_UPDATED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  MEMBER_REMOVED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  FAMILY_CREATED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  FAMILY_UPDATED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  TREE_SHARED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  MEDIA_UPLOADED: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
};

const EVENT_TYPES = [
  'MEMBER_ADDED',
  'MEMBER_UPDATED',
  'MEMBER_REMOVED',
  'FAMILY_CREATED',
  'FAMILY_UPDATED',
  'TREE_SHARED',
  'MEDIA_UPLOADED',
];

function StatCard({ title, value, description }: { title: string; value: string | number; description: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
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
        <button onClick={onRetry} className="mt-2 text-sm font-medium text-primary hover:underline">
          Retry
        </button>
      )}
    </div>
  );
}

function UserAvatar({ user }: { user: ActivityUser }) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        className="h-8 w-8 rounded-full object-cover"
      />
    );
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
      {initials}
    </div>
  );
}

function EventTypeBadge({ eventType }: { eventType: string }) {
  const colorClass = EVENT_TYPE_COLORS[eventType] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
      {eventType.replace(/_/g, ' ')}
    </span>
  );
}

export default function ActivitiesPage() {
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadActivities = useCallback(async (pageNum: number, searchVal: string, typeFilter: string) => {
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: '20',
      });
      if (searchVal) params.set('search', searchVal);
      if (typeFilter) params.set('eventType', typeFilter);

      const data = await adminFetch<ActivitiesResponse>(`/activities?${params.toString()}`);
      setActivities(data.activities || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      setActivities([]);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await adminFetch<ActivityStats>('/activities/stats');
      setStats(data);
    } catch {
      setStats(null);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadStats(), loadActivities(1, '', '')]);
    } catch {
      setError('Failed to load activities. Is the API running?');
    } finally {
      setLoading(false);
    }
  }, [loadStats, loadActivities]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  useEffect(() => {
    loadActivities(page, debouncedSearch, eventTypeFilter);
  }, [page, debouncedSearch, eventTypeFilter, loadActivities]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;
    setDeleting(id);
    try {
      await adminFetch(`/activities/${id}`, { method: 'DELETE' });
      setActivities((prev) => prev.filter((a) => a.id !== id));
      loadStats();
    } catch {
      setError('Failed to delete activity.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity Monitor</h1>
        <p className="text-muted-foreground">Track and manage all user activity across the platform.</p>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchAll} />}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Activities" value={stats?.total ?? 0} description="All recorded events" />
            <StatCard title="Today" value={stats?.today ?? 0} description="Activities in the last 24 hours" />
            <StatCard title="This Week" value={stats?.thisWeek ?? 0} description="Activities in the last 7 days" />
            <StatCard title="This Month" value={stats?.thisMonth ?? 0} description="Activities in the last 30 days" />
          </div>

          <div className="rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-semibold">All Activities</h3>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <select
                  value={eventTypeFilter}
                  onChange={(e) => {
                    setEventTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All Event Types</option>
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-muted-foreground">
                    <th className="px-6 py-3 font-medium">User</th>
                    <th className="px-6 py-3 font-medium">Event Type</th>
                    <th className="px-6 py-3 font-medium">Title</th>
                    <th className="px-6 py-3 font-medium">Family</th>
                    <th className="px-6 py-3 font-medium">Description</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                        No activities found
                      </td>
                    </tr>
                  ) : (
                    activities.map((a) => (
                      <tr key={a.id} className="border-b border-border/30 last:border-0">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <UserAvatar user={a.user} />
                            <div className="min-w-0">
                              <p className="truncate font-medium">{a.user.name}</p>
                              <p className="truncate text-xs text-muted-foreground">{a.user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <EventTypeBadge eventType={a.eventType} />
                        </td>
                        <td className="px-6 py-3 font-medium">{a.title}</td>
                        <td className="px-6 py-3 text-muted-foreground">{a.family ?? '—'}</td>
                        <td className="max-w-xs truncate px-6 py-3 text-muted-foreground">{a.description}</td>
                        <td className="px-6 py-3 text-muted-foreground">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3">
                          <button
                            onClick={() => handleDelete(a.id)}
                            disabled={deleting === a.id}
                            className="rounded bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive hover:text-white disabled:opacity-50"
                          >
                            {deleting === a.id ? '...' : 'Delete'}
                          </button>
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
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded border border-border/60 px-3 py-1 text-xs font-medium disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="rounded border border-border/60 px-3 py-1 text-xs font-medium disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
