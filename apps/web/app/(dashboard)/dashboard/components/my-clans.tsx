'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Globe, ArrowRight, Users, Layers } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Widget, SectionHeader, EmptyState, Badge, SkeletonWidget } from './dashboard-widgets';

export default function MyClans() {
  const [clans, setClans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.clans.user()
      .then((res: any) => setClans(Array.isArray(res) ? res : res?.clans || []))
      .catch(() => setClans([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonWidget rows={2} />;

  return (
    <Widget>
      <SectionHeader title="My Clans" action="Discover" actionHref="/dashboard/discover" />
      {clans.length === 0 ? (
        <EmptyState
          icon={<Globe className="h-8 w-8" />}
          title="No clans yet"
          description="Join a clan to connect with your broader community."
          action="Discover Clans"
          actionHref="/dashboard/discover"
        />
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {clans.slice(0, 4).map((clan: any, i: number) => (
            <Link
              key={clan.id || i}
              href={`/dashboard/clans/${clan.slug || clan.id}`}
              className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
                {clan.name?.charAt(0)?.toUpperCase() || 'C'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{clan.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {clan._count?.families ?? clan.familyCount ?? 0} families Â· {clan._count?.members ?? clan.memberCount ?? 0} members
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
