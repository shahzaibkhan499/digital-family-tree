'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Eye } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Widget, SectionHeader, EmptyState, Badge, SkeletonWidget } from './dashboard-widgets';

export default function LatestMemories() {
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.memories.list({ limit: 4 })
      .then((res: any) => setMemories(res?.memories || (Array.isArray(res) ? res : [])))
      .catch(() => setMemories([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonWidget rows={3} />;

  return (
    <Widget>
      <SectionHeader title="Latest Memories" action="View All" actionHref="/dashboard/memories" />
      {memories.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-8 w-8" />}
          title="No memories yet"
          description="Share a family memory to start building your story."
          action="Create Memory"
          actionHref="/dashboard/memories/new"
        />
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {memories.map((m: any, i: number) => (
            <Link
              key={m.id || i}
              href={`/dashboard/memories/${m.id}`}
              className="flex gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              {m.media?.[0]?.url ? (
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                  <img src={m.media[0].url} alt="" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-lg dark:bg-rose-900/20">
                  ðŸ“¸
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{m.title}</p>
                {m.description && (
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">{m.description}</p>
                )}
                <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
                  {m._count?.reactions > 0 && (
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" /> {m._count.reactions}
                    </span>
                  )}
                  {m._count?.comments > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" /> {m._count.comments}
                    </span>
                  )}
                  <Badge>{m.visibility}</Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Widget>
  );
}
