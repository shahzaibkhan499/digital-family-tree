'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, FileText, Users, GitBranch, BookOpen } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Widget, SectionHeader, EmptyState, SkeletonWidget } from './dashboard-widgets';

const ENTITY_ICONS: Record<string, { icon: any; color: string }> = {
  FAMILY: { icon: Users, color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20' },
  MEMBER: { icon: Users, color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20' },
  DOCUMENT: { icon: FileText, color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20' },
  TREE_VIEW: { icon: GitBranch, color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20' },
  MEMORY: { icon: BookOpen, color: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20' },
};

export default function BookmarksList() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.bookmarks.list({ limit: 5 })
      .then((res: any) => setBookmarks(Array.isArray(res) ? res : res?.bookmarks || []))
      .catch(() => setBookmarks([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonWidget rows={3} />;

  return (
    <Widget>
      <SectionHeader title="Bookmarks" action="View All" actionHref="/dashboard/bookmarks" />
      {bookmarks.length === 0 ? (
        <EmptyState
          icon={<Star className="h-8 w-8" />}
          title="No bookmarks"
          description="Bookmark families, members, or documents for quick access."
        />
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {bookmarks.map((b: any, i: number) => {
            const config = ENTITY_ICONS[b.entityType] || ENTITY_ICONS.FAMILY;
            const Icon = config.icon;
            return (
              <Link
                key={b.id || i}
                href={b.entityUrl || '#'}
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{b.entityName || b.name || 'Bookmark'}</p>
                  <p className="text-xs text-slate-500">{b.entityType?.replace('_', ' ') || ''}</p>
                </div>
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              </Link>
            );
          })}
        </div>
      )}
    </Widget>
  );
}
