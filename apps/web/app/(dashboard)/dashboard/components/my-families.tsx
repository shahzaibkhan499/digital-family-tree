'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, ArrowRight, TreePine } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Widget, SectionHeader, EmptyState, Avatar, SkeletonWidget } from './dashboard-widgets';

export default function MyFamilies() {
  const [families, setFamilies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.families.list()
      .then((res) => setFamilies(Array.isArray(res) ? res : []))
      .catch(() => setFamilies([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonWidget rows={3} />;

  return (
    <Widget>
      <SectionHeader title="My Families" action="View All" actionHref="/dashboard/families" />
      {families.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No families yet"
          description="Create your first family to start building your tree."
          action="Create Family"
          actionHref="/dashboard/families/new"
        />
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {families.slice(0, 5).map((f: any, i: number) => (
            <Link
              key={f.id || i}
              href={`/dashboard/families/${f.id}`}
              className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white">
                {f.name?.charAt(0)?.toUpperCase() || 'F'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{f.name || 'Unnamed Family'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {f._count?.members ?? f.memberCount ?? 0} members
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
          ))}
        </div>
      )}
      {families.length > 5 && (
        <Link href="/dashboard/families" className="block border-t border-slate-100 px-5 py-2.5 text-center text-xs font-medium text-emerald-600 hover:bg-slate-50 dark:border-slate-800 dark:text-emerald-400 dark:hover:bg-slate-800/50">
          View all {families.length} families
        </Link>
      )}
    </Widget>
  );
}
