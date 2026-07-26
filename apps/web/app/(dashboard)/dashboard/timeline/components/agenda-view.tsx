'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, MapPin } from 'lucide-react';
import { getEventConfig, formatDate, formatTime, calcCountdown } from './constants';

interface AgendaEvent {
  id: string;
  title: string;
  eventType: string;
  date?: string;
  time?: string;
  location?: string;
  description?: string;
  [key: string]: unknown;
}

function groupByDate(events: AgendaEvent[]) {
  const groups: Record<string, AgendaEvent[]> = {};
  events.forEach((e) => {
    if (!e.date) {
      const key = 'Undated';
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
      return;
    }
    const d = new Date(e.date);
    const now = new Date();
    let label = '';
    if (d.toDateString() === now.toDateString()) label = 'Today';
    else if (d.toDateString() === new Date(now.getTime() + 86400000).toDateString()) label = 'Tomorrow';
    else {
      const diffDays = Math.ceil((d.getTime() - now.getTime()) / 86400000);
      if (diffDays > 0 && diffDays <= 7) label = `This Week`;
      else if (diffDays > 7 && diffDays <= 30) label = `This Month`;
      else if (diffDays < 0 && diffDays >= -7) label = `Last Week`;
      else label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    if (!groups[label]) groups[label] = [];
    groups[label].push(e);
  });
  return groups;
}

export default function AgendaView({ events }: { events: AgendaEvent[] }) {
  const groups = groupByDate(events);

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([label, items], gi) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: gi * 0.05 }}
        >
          <div className="sticky top-16 z-10 mb-3 flex items-center gap-2">
            <div className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
              {label}
            </div>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs text-slate-400">{items.length}</span>
          </div>

          <div className="space-y-2 ml-2 border-l-2 border-slate-200 dark:border-slate-700 pl-4">
            {items.map((event, i: number) => {
              const config = getEventConfig(event.eventType);
              return (
                <Link
                  key={event.id || i}
                  href={`/dashboard/timeline/${event.id}`}
                  className="group flex items-start gap-3 rounded-xl bg-white p-3 border border-slate-200 shadow-sm transition-all hover:shadow-md dark:bg-slate-900 dark:border-slate-800"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${config.color}`}>
                    {config.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      {event.title}
                    </h4>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      {event.date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(event.date)}
                          {event.time && ` Â· ${formatTime(event.time)}`}
                        </span>
                      )}
                      {event.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{event.description}</p>
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-400">{event.date ? calcCountdown(event.date) : ''}</span>
                </Link>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
