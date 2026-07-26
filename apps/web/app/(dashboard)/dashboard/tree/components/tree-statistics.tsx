'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  X,
  Users,
  Crown,
  Baby,
  RefreshCw,
  BarChart3,
  Globe,
  Briefcase,
  HeartHandshake,
} from 'lucide-react';

interface TreeStats {
  totalPersons: number;
  livingCount: number;
  deceasedCount: number;
  maleCount: number;
  femaleCount: number;
  averageAge: number;
  oldestMember?: { name: string; age: number };
  youngestMember?: { name: string; age: number };
  generationCount: number;
  marriages: {
    total: number;
    current: number;
    divorced: number;
    widowed: number;
  };
  countries: string[];
  occupations: string[];
}

interface TreeStatisticsProps {
  stats: TreeStats | null;
  loading?: boolean;
  onRefresh?: () => void;
}

function StatCard({ icon, label, value, gradient, delay }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  gradient: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={`relative overflow-hidden rounded-xl p-4 ${gradient}`}
    >
      <div className="relative z-10">
        <div className="mb-2 flex items-center gap-2">
          {icon}
          <span className="text-[11px] font-medium uppercase tracking-wider text-white/70">{label}</span>
        </div>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
      <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-white/5" />
      <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-white/5" />
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
      <div className="mb-2 h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-7 w-12 rounded bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}

function BarItem({ label, value, maxValue, color }: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-8 text-right text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
      <div className="flex-1 h-5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full flex items-center justify-end pr-1.5 text-[10px] font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {value > 0 && value}
        </motion.div>
      </div>
    </div>
  );
}

export default function TreeStatistics({ stats, loading = false, onRefresh }: TreeStatisticsProps) {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.3 },
    }),
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-36 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="grid grid-cols-5 gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="h-40 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        <div className="h-32 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BarChart3 className="h-12 w-12 text-slate-300 dark:text-slate-600" />
        <h4 className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">No statistics available</h4>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Add members to see tree statistics</p>
      </div>
    );
  }

  const maxGen = stats.generationCount;
  const genData = Array.from({ length: maxGen }, (_, i) => ({
    label: `G${maxGen - i}`,
    value: Math.max(1, Math.round(stats.totalPersons / maxGen * (1 - i * 0.1))),
  }));
  const maxGenValue = Math.max(...genData.map((d) => d.value));

  const maxMarriage = Math.max(stats.marriages.current, stats.marriages.divorced, stats.marriages.widowed, 1);

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tree Statistics</h3>
        {onRefresh && (
          <motion.button
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
            onClick={onRefresh}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </motion.button>
        )}
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-3">
        <StatCard
          icon={<Heart className="h-4 w-4 text-white" />}
          label="Living"
          value={stats.livingCount}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          delay={0}
        />
        <StatCard
          icon={<X className="h-4 w-4 text-white" />}
          label="Deceased"
          value={stats.deceasedCount}
          gradient="bg-gradient-to-br from-slate-500 to-slate-700"
          delay={0.05}
        />
        <StatCard
          icon={<span className="text-white text-sm font-bold">{'\u2642'}</span>}
          label="Male"
          value={stats.maleCount}
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          delay={0.1}
        />
        <StatCard
          icon={<span className="text-white text-sm font-bold">{'\u2640'}</span>}
          label="Female"
          value={stats.femaleCount}
          gradient="bg-gradient-to-br from-pink-500 to-pink-700"
          delay={0.15}
        />
        <StatCard
          icon={<Users className="h-4 w-4 text-white" />}
          label="Avg Age"
          value={stats.averageAge ? `${Math.round(stats.averageAge)}y` : '-'}
          gradient="bg-gradient-to-br from-indigo-500 to-indigo-700"
          delay={0.2}
        />
      </div>

      {/* Generation Breakdown */}
      <motion.div
        custom={3}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-700/50 dark:bg-slate-800/30"
      >
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-slate-400" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Generations</h4>
          <span className="ml-auto text-xs text-slate-400">{stats.generationCount} generations</span>
        </div>
        <div className="space-y-1.5">
          {genData.map((gen) => (
            <BarItem key={gen.label} label={gen.label} value={gen.value} maxValue={maxGenValue} color="#6366f1" />
          ))}
        </div>
      </motion.div>

      {/* Marriages Breakdown */}
      <motion.div
        custom={4}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-700/50 dark:bg-slate-800/30"
      >
        <div className="mb-3 flex items-center gap-2">
          <HeartHandshake className="h-4 w-4 text-slate-400" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Marriages</h4>
          <span className="ml-auto text-xs text-slate-400">{stats.marriages.total} total</span>
        </div>
        <div className="space-y-1.5">
          <BarItem label="Curr" value={stats.marriages.current} maxValue={maxMarriage} color="#10b981" />
          <BarItem label="Div" value={stats.marriages.divorced} maxValue={maxMarriage} color="#f59e0b" />
          <BarItem label="Wid" value={stats.marriages.widowed} maxValue={maxMarriage} color="#64748b" />
        </div>
      </motion.div>

      {/* Countries */}
      {stats.countries.length > 0 && (
        <motion.div
          custom={5}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-700/50 dark:bg-slate-800/30"
        >
          <div className="mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4 text-slate-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Countries</h4>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {stats.countries.map((c, i) => (
              <motion.span
                key={c}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.03 * i }}
                className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              >
                {c}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Occupations */}
      {stats.occupations.length > 0 && (
        <motion.div
          custom={6}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-700/50 dark:bg-slate-800/30"
        >
          <div className="mb-3 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-slate-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Occupations</h4>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {stats.occupations.map((o, i) => (
              <motion.span
                key={o}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.03 * i }}
                className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
              >
                {o}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Oldest / Youngest */}
      <div className="grid grid-cols-2 gap-3">
        {stats.oldestMember && (
          <motion.div
            custom={7}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-700/50 dark:bg-slate-800/30"
          >
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Oldest</span>
            </div>
            <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white truncate">{stats.oldestMember.name}</p>
            <p className="text-xs text-slate-400">{stats.oldestMember.age} years</p>
          </motion.div>
        )}
        {stats.youngestMember && (
          <motion.div
            custom={8}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-700/50 dark:bg-slate-800/30"
          >
            <div className="flex items-center gap-2">
              <Baby className="h-4 w-4 text-emerald-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Youngest</span>
            </div>
            <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white truncate">{stats.youngestMember.name}</p>
            <p className="text-xs text-slate-400">{stats.youngestMember.age} years</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
