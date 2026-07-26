'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Globe, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Widget, SectionHeader, EmptyState, Badge, SkeletonWidget } from './dashboard-widgets';

export default function MyCommunities() {
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.communities.user().catch(() => []),
      api.clans.user().catch(() => []),
    ])
      .then(([c, cl]) => {
        setCommunities((Array.isArray(c) ? c : []).slice(0, 3));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonWidget rows={2} />;

  return (
    <Widget>
      <SectionHeader title="Communities" action="Discover" actionHref="/dashboard/communities" />
      {communities.length === 0 ? (
        <EmptyState
          icon={<Globe className="h-8 w-8" />}
          title="No communities"
          description="Join a community to connect with your heritage."
          action="Discover"
          actionHref="/dashboard/communities"
        />
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {communities.map((c: any, i: number) => (
            <Link
              key={c.id || i}
              href={`/dashboard/communities/${c.slug || c.id}`}
              className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
                {c.name?.charAt(0)?.toUpperCase() || 'C'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{c.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {c._count?.members ?? c.memberCount ?? 0} members
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
          ))}
        </div>
      )}
    </Widget>
  );
}
