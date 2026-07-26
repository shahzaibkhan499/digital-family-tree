'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

function formatRelative(d: string | null | undefined): string {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ClanDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params.slug as string;

  const [clan, setClan] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [clanData, dashData] = await Promise.allSettled([
          api.clans.get(slug),
          api.clans.dashboard(slug),
        ]);
        if (clanData.status === 'fulfilled') setClan(clanData.value);
        else router.push('/dashboard/clans');
        if (dashData.status === 'fulfilled') setDashboard(dashData.value);
      } catch {
        router.push('/dashboard/clans');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, router]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!clan || !dashboard) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/dashboard/clans/${slug}`} className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
            â† Back to {clan.name}
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Clan Dashboard</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Families', value: dashboard.totalFamilies ?? 0, color: 'emerald' },
          { label: 'Members', value: dashboard.totalMembers ?? 0, color: 'blue' },
          { label: 'Events', value: dashboard.totalEvents ?? 0, color: 'purple' },
          { label: 'Photos', value: dashboard.totalPhotos ?? 0, color: 'pink' },
          { label: 'Documents', value: dashboard.totalDocuments ?? 0, color: 'amber' },
          { label: 'Timeline', value: dashboard.totalTimelineEvents ?? 0, color: 'teal' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{item.value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
          </div>
        ))}
      </div>

      {dashboard.yearsActive != null && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Years Active</h3>
          <p className="mt-2 text-4xl font-bold text-emerald-600 dark:text-emerald-400">{dashboard.yearsActive} years</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Since the oldest family was created</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {dashboard.mostActiveFamilies?.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Most Active Families</h3>
            <div className="space-y-2">
              {dashboard.mostActiveFamilies.slice(0, 5).map((f: any, i: number) => (
                <Link key={f.id || i} href={`/dashboard/families/${f.id || f.familyId}`} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{i + 1}</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{f.name}</span>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{f.memberCount ?? f._count?.members ?? 0} members</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {dashboard.newestFamilies?.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Newest Families</h3>
            <div className="space-y-2">
              {dashboard.newestFamilies.slice(0, 5).map((f: any) => (
                <Link key={f.id || f.familyId} href={`/dashboard/families/${f.id || f.familyId}`} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{f.name}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{formatRelative(f.createdAt)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {dashboard.oldestFamilies?.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Oldest Families</h3>
            <div className="space-y-2">
              {dashboard.oldestFamilies.slice(0, 5).map((f: any) => (
                <Link key={f.id || f.familyId} href={`/dashboard/families/${f.id || f.familyId}`} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{f.name}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{formatRelative(f.createdAt)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {dashboard.subClans?.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">SubClans</h3>
            <div className="space-y-2">
              {dashboard.subClans.map((sc: any) => (
                <Link key={sc.id || sc.slug} href={`/dashboard/subclans/${sc.slug || sc.id}`} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{sc.name}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{sc._count?.families ?? sc.familyCount ?? 0} families</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {dashboard.recentActivity?.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
          <div className="space-y-3">
            {dashboard.recentActivity.map((act: any, i: number) => (
              <div key={act.id || i} className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shrink-0 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700 dark:text-slate-300">{act.title || act.description || 'Activity'}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">{formatRelative(act.createdAt || act.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {dashboard.pendingRequests != null && dashboard.pendingRequests > 0 && (
        <Link href={`/dashboard/clans/${slug}/requests`} className="block rounded-xl border border-amber-200 bg-amber-50 p-4 hover:bg-amber-100/50 dark:border-amber-800/50 dark:bg-amber-900/10 dark:hover:bg-amber-900/20 transition-colors">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">{dashboard.pendingRequests} pending join request(s) â€” Click to review</span>
          </div>
        </Link>
      )}
    </div>
  );
}
