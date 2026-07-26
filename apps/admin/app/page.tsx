'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/admin-api';

interface DashboardStats {
  totalUsers: number;
  totalFamilies: number;
  totalMembers: number;
  totalClans: number;
  totalCommunities: number;
  totalSubClans: number;
  pendingClanRequests: number;
  pendingCommunityRequests: number;
  systemHealth: string;
  dbHealth: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  userName: string;
  createdAt: string;
}

function StatCard({ title, value, description, color, href }: { title: string; value: string | number; description: string; color?: string; href?: string }) {
  const inner = (
    <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm transition-colors hover:bg-accent/50">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className={`mt-2 text-3xl font-bold ${color || ''}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
  if (href) {
    return <a href={href} className="block">{inner}</a>;
  }
  return inner;
}

function HealthIndicator({ label, status }: { label: string; status: string }) {
  const isOk = status === 'ok' || status === 'healthy';
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${isOk ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{status}</span>
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, activitiesData] = await Promise.all([
        adminFetch<DashboardStats>('/users/stats').catch(() => null),
        adminFetch<{ activities: Activity[] }>('/activities?limit=10').catch(() => ({ activities: [] })),
      ]);
      setStats(statsData);
      setActivities(activitiesData.activities || []);
    } catch {
      setError('Failed to load dashboard data. Is the API running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the Digital Family Tree admin panel.</p>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchData} />}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard title="Total Users" value={stats?.totalUsers ?? 0} description="Registered users" href="/users" />
            <StatCard title="Total Families" value={stats?.totalFamilies ?? 0} description="Family trees created" href="/families" />
            <StatCard title="Total Members" value={stats?.totalMembers ?? 0} description="Family members" />
            <StatCard title="Total Clans" value={stats?.totalClans ?? 0} description="Clans across platform" href="/clans" />
            <StatCard title="Total Communities" value={stats?.totalCommunities ?? 0} description="Communities created" href="/communities" />
            <StatCard title="Total SubClans" value={stats?.totalSubClans ?? 0} description="Sub-clans" href="/subclans" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Pending Clan Requests"
              value={stats?.pendingClanRequests ?? 0}
              description="Awaiting approval"
              color="text-amber-600"
              href="/clans"
            />
            <StatCard
              title="Pending Community Requests"
              value={stats?.pendingCommunityRequests ?? 0}
              description="Awaiting approval"
              color="text-amber-600"
              href="/communities"
            />
            <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
              <p className="text-sm font-medium text-muted-foreground mb-3">System Health</p>
              <div className="space-y-2">
                <HealthIndicator label="API" status={stats?.systemHealth ?? 'unknown'} />
                <HealthIndicator label="Database" status={stats?.dbHealth ?? 'unknown'} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/60 px-6 py-4">
              <h3 className="font-semibold">Recent Activity</h3>
            </div>
            <div className="divide-y divide-border/30">
              {activities.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">No recent activity</p>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="flex items-start gap-4 px-6 py-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{act.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {act.userName} &middot; {new Date(act.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                      {act.type}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
