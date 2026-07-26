'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, TrendingUp, Users, AlertTriangle, Calendar, FileText, TreePine } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Widget, SectionHeader, SkeletonWidget } from './dashboard-widgets';

interface Insight {
  text: string;
  type: 'growth' | 'action' | 'info' | 'warning';
  icon: any;
}

export default function AiInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [stats, families, discovery, duplicates, timeline] = await Promise.allSettled([
          api.families.stats(),
          api.families.list(),
          api.discovery.stats().catch(() => null),
          api.duplicates.list({ limit: 5 }).catch(() => null),
          api.timeline.widget().catch(() => null),
        ]);

        const results: Insight[] = [];
        const s = stats.status === 'fulfilled' ? stats.value : null;
        const f = families.status === 'fulfilled' ? families.value : null;
        const d = discovery.status === 'fulfilled' ? discovery.value : null;
        const dup = duplicates.status === 'fulfilled' ? duplicates.value : null;
        const t = timeline.status === 'fulfilled' ? timeline.value : null;

        if (s && s.totalMembers > 0) {
          results.push({ text: `Your family tree has ${s.totalMembers} members across ${s.totalFamilies || 0} families.`, type: 'growth', icon: TreePine });
        }
        if (dup && Array.isArray(dup) && dup.length > 0) {
          results.push({ text: `${dup.length} potential duplicate${dup.length > 1 ? 's' : ''} may need review.`, type: 'warning', icon: AlertTriangle });
        }
        if (t?.birthdays && t.birthdays.length > 0) {
          results.push({ text: `${t.birthdays.length} upcoming birthday${t.birthdays.length > 1 ? 's' : ''} to celebrate.`, type: 'info', icon: Calendar });
        }
        if (t?.upcoming && t.upcoming.length > 0) {
          results.push({ text: `You have ${t.upcoming.length} upcoming event${t.upcoming.length > 1 ? 's' : ''} on your calendar.`, type: 'info', icon: Calendar });
        }
        if (Array.isArray(f) && f.length === 0) {
          results.push({ text: 'Create your first family to start building your genealogy.', type: 'action', icon: Users });
        }

        setInsights(results.slice(0, 5));
      } catch {
        setInsights([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <SkeletonWidget rows={3} />;

  if (insights.length === 0) return null;

  const typeColors: Record<string, string> = {
    growth: 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10',
    action: 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10',
    info: 'border-l-slate-400 bg-slate-50/50 dark:bg-slate-800/50',
    warning: 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-900/10',
  };

  return (
    <Widget>
      <SectionHeader title="Insights" />
      <div className="p-4 space-y-2">
        {insights.map((insight, i) => {
          const Icon = insight.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-start gap-3 rounded-lg border-l-4 p-3 ${typeColors[insight.type]}`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
              <p className="text-sm text-slate-700 dark:text-slate-300">{insight.text}</p>
            </motion.div>
          );
        })}
      </div>
    </Widget>
  );
}
