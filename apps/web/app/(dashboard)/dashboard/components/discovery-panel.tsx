'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, AlertTriangle, UserPlus, Copy } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Widget, SectionHeader, EmptyState, Badge, SkeletonWidget } from './dashboard-widgets';

const DISCOVERY_ICONS: Record<string, { icon: any; color: string }> = {
  POSSIBLE_RELATIVE: { icon: UserPlus, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' },
  DUPLICATE: { icon: Copy, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' },
  SUGGESTED_CLAN: { icon: Sparkles, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' },
  SUGGESTED_COMMUNITY: { icon: Sparkles, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' },
};

export default function DiscoveryPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.discovery.list()
      .then((res: any) => setItems(Array.isArray(res) ? res : res?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonWidget rows={3} />;

  return (
    <Widget>
      <SectionHeader title="Discoveries" action="View All" actionHref="/dashboard/discover" />
      {items.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-8 w-8" />}
          title="No discoveries"
          description="As your tree grows, we'll suggest relatives and connections."
        />
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.slice(0, 4).map((item: any, i: number) => {
            const config = DISCOVERY_ICONS[item.type] || DISCOVERY_ICONS.POSSIBLE_RELATIVE;
            const Icon = config.icon;
            return (
              <motion.div
                key={item.id || i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 px-5 py-3.5"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{item.title || item.name || 'Discovery'}</p>
                  {item.reason && (
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{item.reason}</p>
                  )}
                  {item.confidence && (
                    <Badge variant={item.confidence > 80 ? 'success' : 'default'}>
                      {item.confidence}% match
                    </Badge>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </Widget>
  );
}
