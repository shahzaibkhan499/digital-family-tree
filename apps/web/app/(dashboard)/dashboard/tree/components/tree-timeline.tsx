'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Baby,
  X,
  Diamond,
  BookOpen,
  Briefcase,
  Plane,
  Trophy,
  Star,
  Plus,
  Clock,
} from 'lucide-react';

export interface TimelineEvent {
  id: string;
  type: 'BIRTH' | 'DEATH' | 'MARRIAGE' | 'EDUCATION' | 'CAREER' | 'MIGRATION' | 'AWARD' | 'CUSTOM';
  title: string;
  description?: string;
  date: string;
  location?: string;
  icon?: string;
}

interface TreeTimelineProps {
  memberId: string;
  events: TimelineEvent[];
  onAddEvent?: () => void;
}

const EVENT_CONFIG: Record<string, { icon: React.ElementType; color: string; bgClass: string; dotClass: string }> = {
  BIRTH: { icon: Baby, color: '#10b981', bgClass: 'bg-emerald-50 dark:bg-emerald-900/20', dotClass: 'bg-emerald-500' },
  DEATH: { icon: X, color: '#64748b', bgClass: 'bg-slate-50 dark:bg-slate-800/30', dotClass: 'bg-slate-500' },
  MARRIAGE: { icon: Diamond, color: '#ec4899', bgClass: 'bg-pink-50 dark:bg-pink-900/20', dotClass: 'bg-pink-500' },
  EDUCATION: { icon: BookOpen, color: '#3b82f6', bgClass: 'bg-blue-50 dark:bg-blue-900/20', dotClass: 'bg-blue-500' },
  CAREER: { icon: Briefcase, color: '#f59e0b', bgClass: 'bg-amber-50 dark:bg-amber-900/20', dotClass: 'bg-amber-500' },
  MIGRATION: { icon: Plane, color: '#06b6d4', bgClass: 'bg-teal-50 dark:bg-teal-900/20', dotClass: 'bg-teal-500' },
  AWARD: { icon: Trophy, color: '#eab308', bgClass: 'bg-yellow-50 dark:bg-yellow-900/20', dotClass: 'bg-yellow-500' },
  CUSTOM: { icon: Star, color: '#64748b', bgClass: 'bg-slate-50 dark:bg-slate-800/30', dotClass: 'bg-slate-500' },
};

function formatDisplayDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function TimelineDot({ type, index }: { type: string; index: number }) {
  const config = EVENT_CONFIG[type] || EVENT_CONFIG.CUSTOM;
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.05 * index, type: 'spring', stiffness: 300 }}
      className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 ${config.dotClass}`}
    >
      {React.createElement(config.icon, { size: 14, className: 'text-white' })}
    </motion.div>
  );
}

export default function TreeTimeline({ memberId: _memberId, events, onAddEvent }: TreeTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
        >
          <Clock className="h-8 w-8 text-slate-400 dark:text-slate-500" />
        </motion.div>
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No timeline events yet</h4>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Start recording important life events</p>
        {onAddEvent && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAddEvent}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add first event
          </motion.button>
        )}
      </div>
    );
  }

  return (
    <div className="relative px-4">
      {/* Vertical line */}
      <div className="absolute left-[23px] top-0 h-full w-0.5 bg-slate-200 dark:bg-slate-700" />

      <div className="space-y-6">
        {events.map((event, index) => {
          const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.CUSTOM;
          const IconComponent = config.icon;
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * index, duration: 0.3 }}
              className="relative flex items-start gap-4"
            >
              {/* Date on left */}
              <div className="min-w-[80px] pt-1 text-right">
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  {formatDisplayDate(event.date)}
                </span>
              </div>

              {/* Dot */}
              <TimelineDot type={event.type} index={index} />

              {/* Event card */}
              <motion.div
                whileHover={{ y: -1 }}
                className={`flex-1 rounded-lg border border-slate-100 p-3 ${config.bgClass} dark:border-slate-700/50`}
              >
                <div className="flex items-start gap-2">
                  <div
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${config.color}18` }}
                  >
                    <IconComponent size={12} style={{ color: config.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-sm font-semibold text-slate-900 dark:text-white">{event.title}</h5>
                    {event.description && (
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {event.description}
                      </p>
                    )}
                    {event.location && (
                      <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                        {'\uD83D\uDCCD'} {event.location}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {onAddEvent && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAddEvent}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Event
        </motion.button>
      )}
    </div>
  );
}
