'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, FileText, Users, GitBranch, BookOpen, Eye } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Widget, SectionHeader, EmptyState, SkeletonWidget } from './dashboard-widgets';

export default function RecentlyViewed() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.tree.viewHistory.list(5).catch(() => []),
      api.documentVault.recent(3).catch(() => []),
    ])
      .then(([tv, dv]) => {
        const treeItems = tv.status === 'fulfilled' ? (Array.isArray(tv.value) ? tv.value : []) : [];
        const docs = dv.status === 'fulfilled' ? (Array.isArray(dv.value) ? dv.value : (dv.value?.documents || [])) : [];
        const combined = [
          ...treeItems.slice(0, 3).map((t: any) => ({
            name: t.name || t.entityName || 'Tree View',
            type: 'tree',
            href: '/dashboard/tree',
          })),
          ...docs.slice(0, 3).map((d: any) => ({
            name: d.title || 'Document',
            type: 'document',
            href: `/dashboard/documents`,
          })),
        ].slice(0, 5);
        setItems(combined);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonWidget rows={2} />;

  const typeIcons: Record<string, any> = {
    tree: GitBranch,
    document: FileText,
    family: Users,
    member: Users,
    memory: BookOpen,
  };

  return (
    <Widget>
      <SectionHeader title="Recently Viewed" />
      {items.length === 0 ? (
        <EmptyState
          icon={<Eye className="h-8 w-8" />}
          title="Nothing viewed yet"
          description="Items you view will appear here for quick access."
        />
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((item: any, i: number) => {
            const Icon = typeIcons[item.type] || Clock;
            return (
              <Link
                key={i}
                href={item.href || '#'}
                className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                <p className="truncate text-sm text-slate-700 dark:text-slate-300">{item.name}</p>
              </Link>
            );
          })}
        </div>
      )}
    </Widget>
  );
}
