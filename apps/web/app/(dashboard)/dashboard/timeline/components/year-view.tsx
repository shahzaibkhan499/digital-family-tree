'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api-client';
import { getEventConfig } from './constants';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface YearEvent {
  id: string;
  title: string;
  eventType: string;
  date?: string;
  [key: string]: unknown;
}

export default function YearView() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [events, setEvents] = useState<YearEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        api.timeline.calendar(year, i + 1).catch(() => ({ events: [] }))
      )
    ).then((results) => {
      const all = results.flatMap((r) => (r.events || []) as YearEvent[]);
      setEvents(all);
    }).finally(() => setLoading(false));
  }, [year]);

  const eventsByMonth: Record<number, YearEvent[]> = {};
  events.forEach((e) => {
    if (!e.date) return;
    const m = new Date(e.date).getMonth();
    if (!eventsByMonth[m]) eventsByMonth[m] = [];
    eventsByMonth[m].push(e);
  });

  const currentMonth = new Date().getMonth();
  const isCurrentYear = year === new Date().getFullYear();

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-slate-800">
        <button onClick={() => setYear(y => y - 1)} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
          <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </button>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{year}</h3>
        <button onClick={() => setYear(y => y + 1)} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
          <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-4">
        {MONTHS.map((name, i) => {
          const monthEvents = eventsByMonth[i] || [];
          const isCurrent = isCurrentYear && i === currentMonth;

          return (
            <Link
              key={name}
              href={`/dashboard/timeline?month=${year}-${String(i + 1).padStart(2, '0')}`}
              className={`relative rounded-xl border p-3 transition-all hover:shadow-md ${
                isCurrent
                  ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20'
                  : 'border-slate-200 bg-white hover:border-emerald-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700'
              }`}
            >
              <p className={`text-xs font-semibold ${isCurrent ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                {name}
              </p>
              <p className={`mt-1 text-2xl font-bold ${isCurrent ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                {monthEvents.length}
              </p>
              {monthEvents.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-0.5">
                  {monthEvents.slice(0, 6).map((e, j: number) => {
                    const config = getEventConfig(e.eventType);
                    return <span key={j} className="text-xs">{config.icon}</span>;
                  })}
                  {monthEvents.length > 6 && (
                    <span className="text-[10px] text-slate-400">+{monthEvents.length - 6}</span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
