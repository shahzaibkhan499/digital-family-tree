'use client';

import { useEffect, useState } from 'react';
import {
  Calendar, Clock, Users, MapPin, Star, TrendingUp, FileText, Globe,
  Home, CheckCircle, AlertCircle, Pencil, Archive,
} from 'lucide-react';

function AnimatedCounter({ value, loading }: { value: number; loading: boolean }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (value === 0) { setDisplay(0); return; }
    const duration = 800;
    const start = performance.now();
    const from = 0;
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, loading]);

  return <>{loading ? '...' : display.toLocaleString()}</>;
}

interface TimelineStatsData {
  total?: number;
  participants?: number;
  totalDocuments?: number;
  countries?: number;
  cities?: number;
  familiesConnected?: number;
  byStatus?: Record<string, number>;
  byType?: Record<string, number>;
  monthlyGrowth?: { count?: number; label?: string }[];
  mostActiveMembers?: { name?: string; avatar?: string; eventCount?: number }[];
  [key: string]: unknown;
}

export default function TimelineStats({ stats, loading }: { stats: TimelineStatsData | null; loading: boolean }) {
  const statCards = [
    { label: 'Total Events', value: stats?.total || 0, icon: <Calendar className="h-4 w-4" />, color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20' },
    { label: 'Participants', value: stats?.participants || 0, icon: <Users className="h-4 w-4" />, color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20' },
    { label: 'Documents', value: stats?.totalDocuments || 0, icon: <FileText className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20' },
    { label: 'Countries', value: stats?.countries || 0, icon: <Globe className="h-4 w-4" />, color: 'text-cyan-600 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-900/20' },
    { label: 'Cities', value: stats?.cities || 0, icon: <MapPin className="h-4 w-4" />, color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20' },
    { label: 'Families', value: stats?.familiesConnected || 0, icon: <Home className="h-4 w-4" />, color: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20' },
  ];

  const statusBreakdown = [
    { label: 'Published', value: stats?.byStatus?.PUBLISHED || 0, color: 'bg-emerald-500' },
    { label: 'Draft', value: stats?.byStatus?.DRAFT || 0, color: 'bg-slate-400' },
    { label: 'Completed', value: stats?.byStatus?.COMPLETED || 0, color: 'bg-blue-500' },
    { label: 'Cancelled', value: stats?.byStatus?.CANCELLED || 0, color: 'bg-rose-400' },
    { label: 'Archived', value: stats?.byStatus?.ARCHIVED || 0, color: 'bg-slate-300' },
  ];

  const typeBreakdown = stats?.byType
    ? Object.entries(stats.byType as Record<string, number>).sort((a, b) => b[1] - a[1]).slice(0, 8)
    : [];

  const monthlyData = stats?.monthlyGrowth || [];
  const monthlyMax = Math.max(...monthlyData.map((m) => m.count || 0), 1);

  const activeMembers = stats?.mostActiveMembers || [];

  return (
    <div className="space-y-4">
      {/* Primary stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map(s => (
          <div key={s.label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                <AnimatedCounter value={s.value} loading={loading} />
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary row: type breakdown + status + chart + active members */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Events by Type */}
        {typeBreakdown.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h4 className="mb-3 text-xs font-semibold text-slate-900 dark:text-white">Events by Type</h4>
            <div className="space-y-2">
              {typeBreakdown.map(([type, count]: [string, number]) => (
                <div key={type} className="flex items-center gap-2">
                  <span className="text-xs">{type}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${(count / (typeBreakdown[0]?.[1] || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Breakdown */}
        {statusBreakdown.some(s => s.value > 0) && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h4 className="mb-3 text-xs font-semibold text-slate-900 dark:text-white">By Status</h4>
            <div className="space-y-2.5">
              {statusBreakdown.map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                    <span className="text-xs text-slate-600 dark:text-slate-400">{s.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Growth Chart */}
        {monthlyData.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h4 className="mb-3 text-xs font-semibold text-slate-900 dark:text-white">Monthly Growth</h4>
            <div className="flex items-end gap-1 h-24">
              {monthlyData.map((m, i: number) => (
                <div key={i} className="flex flex-col items-center flex-1 gap-1">
                  <div
                    className="w-full rounded-t bg-emerald-500/80 transition-all duration-500 min-h-[2px]"
                    style={{ height: `${((m.count || 0) / monthlyMax) * 100}%` }}
                  />
                  <span className="text-[8px] text-slate-400 truncate w-full text-center">{m.label || ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Most Active Members */}
        {activeMembers.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h4 className="mb-3 text-xs font-semibold text-slate-900 dark:text-white">Most Active</h4>
            <div className="space-y-2">
              {activeMembers.slice(0, 5).map((m, i: number) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    {m.avatar ? (
                      <img src={m.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-500">
                        {(m.name || '?')[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{m.name}</p>
                    <p className="text-[10px] text-slate-400">{m.eventCount || 0} events</p>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">#{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
