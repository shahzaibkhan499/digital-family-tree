'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Clock, Gift, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Widget, SectionHeader, EmptyState, Badge, SkeletonWidget } from './dashboard-widgets';

const EVENT_ICONS: Record<string, string> = {
  BIRTH: 'ðŸ‘¶', MARRIAGE: 'ðŸ’’', DEATH: 'ðŸ•Šï¸', GRADUATION: 'ðŸŽ“',
  ANNIVERSARY: 'ðŸ’', HOLIDAY: 'ðŸŽ‰', REUNION: 'ðŸ‘¨â€ðŸ‘©â€ðŸ‘§â€ðŸ‘¦', OTHER: 'ðŸ“…',
};

function formatEventDate(d: string) {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return `In ${diffDays} days`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function UpcomingEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.timeline.widget()
      .then((res: any) => {
        setEvents(res?.upcoming || res?.events || []);
        setBirthdays(res?.birthdays || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonWidget rows={3} />;

  const allEvents = [...events.slice(0, 4)];
  if (birthdays.length > 0) {
    allEvents.push({ isBirthday: true, name: `${birthdays.length} upcoming birthday${birthdays.length > 1 ? 's' : ''}`, date: birthdays[0]?.date });
  }

  return (
    <Widget>
      <SectionHeader title="Upcoming Events" action="View Calendar" actionHref="/dashboard/timeline" />
      {allEvents.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-8 w-8" />}
          title="No upcoming events"
          description="Create a timeline event to keep track of family occasions."
          action="Create Event"
          actionHref="/dashboard/timeline/new"
        />
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {allEvents.map((e: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-start gap-3 px-5 py-3.5"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
                e.isBirthday ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'
              }`}>
                {e.isBirthday ? 'ðŸŽ‚' : (EVENT_ICONS[e.eventType] || 'ðŸ“…')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {e.isBirthday ? e.name : (e.title || e.name || 'Event')}
                </p>
                {!e.isBirthday && e.description && (
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">{e.description}</p>
                )}
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant={formatEventDate(e.date) === 'Today' ? 'warning' : 'default'}>
                    {formatEventDate(e.date)}
                  </Badge>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Widget>
  );
}
