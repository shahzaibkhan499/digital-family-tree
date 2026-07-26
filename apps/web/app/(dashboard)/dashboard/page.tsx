'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import DashboardHeader from './components/dashboard-header';
import QuickActions from './components/quick-actions';
import MyFamilies from './components/my-families';
import MyCommunities from './components/my-communities';
import MyClans from './components/my-clans';
import ActivityFeed from './components/activity-feed';
import PendingActions from './components/pending-actions';
import UpcomingEvents from './components/upcoming-events';
import LatestMemories from './components/latest-memories';
import DiscoveryPanel from './components/discovery-panel';
import AiInsights from './components/ai-insights';
import NotificationsList from './components/notifications-list';
import RecentDocuments from './components/recent-documents';
import BookmarksList from './components/bookmarks-list';
import RecentlyViewed from './components/recently-viewed';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const [statsRes, unreadRes, timelineRes] = await Promise.allSettled([
          api.families.stats(),
          api.notifications.unreadCount(),
          api.timeline.widget(),
        ]);

        const s = statsRes.status === 'fulfilled' ? statsRes.value : null;
        const u = unreadRes.status === 'fulfilled' ? unreadRes.value : null;
        const t = timelineRes.status === 'fulfilled' ? timelineRes.value : null;

        setStats({
          totalFamilies: s?.totalFamilies || 0,
          totalMembers: s?.totalMembers || 0,
          totalRelationships: s?.totalRelationships || 0,
          upcomingEvents: t?.upcoming?.length || 0,
        });
        setUnreadCount(typeof u === 'number' ? u : u?.count || 0);
      } catch {
        setStats({ totalFamilies: 0, totalMembers: 0, totalRelationships: 0, upcomingEvents: 0 });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-6">
      {/* Top Area */}
      <DashboardHeader stats={stats} unreadCount={unreadCount} loading={loading} />

      {/* Quick Actions */}
      <QuickActions />

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN */}
        <aside className="space-y-6 lg:col-span-3">
          <MyFamilies />
          <MyCommunities />
          <MyClans />
          <BookmarksList />
        </aside>

        {/* CENTER COLUMN */}
        <main className="space-y-6 lg:col-span-5">
          <PendingActions />
          <ActivityFeed />
          <UpcomingEvents />
          <LatestMemories />
        </main>

        {/* RIGHT COLUMN */}
        <aside className="space-y-6 lg:col-span-4">
          <AiInsights />
          <DiscoveryPanel />
          <NotificationsList />
          <RecentDocuments />
          <RecentlyViewed />
        </aside>
      </div>
    </div>
  );
}
