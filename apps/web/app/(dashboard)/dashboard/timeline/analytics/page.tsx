'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, Users, FileText, Image as ImageIcon,
  Calendar, Globe, Award, GraduationCap, Briefcase, Home,
  ArrowUp, ArrowDown, Download, RefreshCw, Clock
} from 'lucide-react';
import { api } from '@/lib/api-client';

interface AnalyticsData {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByStatus: Record<string, number>;
  eventsByMonth: { month: string; count: number }[];
  totalDocuments: number;
  totalMedia: number;
  totalParticipants: number;
  totalFamilies: number;
  totalCountries: number;
  totalCities: number;
  mostActiveMembers: { name: string; count: number; avatar?: string }[];
  recentActivity: { action: string; count: number; date: string }[];
  participationRate: number;
  averageEventsPerFamily: number;
}

export default function TimelineAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year' | 'all'>('all');

  useEffect(() => { loadAnalytics(); }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const stats = await api.timeline.stats();
      setData(stats);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="skeleton h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton-card h-32" />)}
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton-card h-64" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const maxMonthly = Math.max(...(data.eventsByMonth || []).map(m => m.count), 1);

  // Primary stat cards
  const primaryStats = [
    { label: 'Total Events', value: data.totalEvents, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Documents', value: data.totalDocuments, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Media Files', value: data.totalMedia, icon: ImageIcon, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Participants', value: data.totalParticipants, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Families', value: data.totalFamilies, icon: Users, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { label: 'Countries', value: data.totalCountries, icon: Globe, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
    { label: 'Cities', value: data.totalCities, icon: Globe, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20' },
    { label: 'Avg Events/Family', value: data.averageEventsPerFamily?.toFixed(1) || '0', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  ];

  // Event type icons
  const typeIcons: Record<string, any> = {
    BIRTH: 'ðŸ‘¶', DEATH: 'ðŸ•Šï¸', MARRIAGE: 'ðŸ’’', EDUCATION: 'ðŸŽ“', JOB: 'ðŸ’¼',
    BUSINESS: 'ðŸ¢', MIGRATION: 'âœˆï¸', MILITARY_SERVICE: 'ðŸŽ–ï¸', AWARD: 'ðŸ†',
    RETIREMENT: 'ðŸ–ï¸', TRAVEL: 'ðŸŒ', MEDICAL: 'ðŸ¥', RELIGIOUS_EVENT: 'ðŸ•Œ',
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Timeline Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Insights and trends across your family timeline</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={dateRange} onChange={e => setDateRange(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
          <button onClick={loadAnalytics}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Primary stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {primaryStats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-4">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Events by Type chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Events by Type</h3>
          <div className="space-y-3">
            {Object.entries(data.eventsByType || {}).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
              <div key={type} className="flex items-center gap-3">
                <span className="w-6 text-center text-lg">{typeIcons[type] || 'ðŸ“‹'}</span>
                <span className="w-24 text-xs text-slate-600 dark:text-slate-400">{type.replace(/_/g, ' ').toLowerCase()}</span>
                <div className="flex-1">
                  <div className="h-5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(count / data.totalEvents) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full bg-emerald-500" />
                  </div>
                </div>
                <span className="w-8 text-right text-xs font-medium text-slate-700 dark:text-slate-300">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Monthly trend chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass-card p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Monthly Trend</h3>
          <div className="flex items-end gap-1" style={{ height: 160 }}>
            {(data.eventsByMonth || []).slice(-12).map((month, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] text-slate-400">{month.count}</span>
                <motion.div initial={{ height: 0 }} animate={{ height: `${(month.count / maxMonthly) * 120}px` }}
                  transition={{ duration: 0.5, delay: i * 0.03 }}
                  className="w-full rounded-t bg-emerald-500/80 hover:bg-emerald-500 transition-colors" />
                <span className="text-[9px] text-slate-400">{month.month?.slice(0, 3)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Most Active Members */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="glass-card p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Most Active Members</h3>
          <div className="space-y-3">
            {(data.mostActiveMembers || []).slice(0, 8).map((member, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-400 w-5">{i + 1}</span>
                <div className="h-8 w-8 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  {member.avatar ? <img src={member.avatar} alt="" className="h-full w-full object-cover" /> :
                    <div className="flex h-full items-center justify-center text-xs font-medium text-slate-500">{member.name?.[0]}</div>}
                </div>
                <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{member.name}</span>
                <span className="text-xs font-medium text-slate-500">{member.count} events</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Status breakdown */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="glass-card p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Event Status</h3>
          <div className="space-y-3">
            {Object.entries(data.eventsByStatus || {}).map(([status, count]) => {
              const colors: Record<string, string> = {
                PUBLISHED: 'bg-emerald-500', DRAFT: 'bg-slate-400', COMPLETED: 'bg-blue-500',
                CANCELLED: 'bg-red-400', UPCOMING: 'bg-amber-500',
              };
              return (
                <div key={status} className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${colors[status] || 'bg-slate-300'}`} />
                  <span className="flex-1 text-sm text-slate-600 dark:text-slate-400">{status}</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{count as number}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
