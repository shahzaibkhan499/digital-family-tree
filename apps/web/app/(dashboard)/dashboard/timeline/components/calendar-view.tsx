'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api-client';
import { getEventConfig } from './constants';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarView({ onDateSelect }: { onDateSelect?: (d: string) => void }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.timeline.calendar(year, month + 1)
      .then((res: any) => setEvents(res?.events || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [year, month]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const eventsByDay: Record<number, any[]> = {};
  events.forEach((e: any) => {
    if (!e.date) return;
    const d = new Date(e.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push(e);
    }
  });

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const selectDate = (day: number) => {
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(d);
    onDateSelect?.(d);
  };

  const selectedDayEvents = selectedDate ? events.filter((e: any) => e.date?.startsWith(selectedDate)) : [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-slate-800">
        <button onClick={prevMonth} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
          <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </button>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          {new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={nextMonth} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
          <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </button>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-center text-[11px] font-medium text-slate-400 dark:text-slate-500 py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isToday = isCurrentMonth && day === today.getDate();
            const isSelected = selectedDate === `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = eventsByDay[day] || [];

            return (
              <button
                key={day}
                onClick={() => selectDate(day)}
                className={`relative flex flex-col items-center rounded-lg p-1.5 text-sm transition-colors ${
                  isSelected
                    ? 'bg-emerald-600 text-white'
                    : isToday
                    ? 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-900/20 dark:text-emerald-400'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <span>{day}</span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((e: any, j: number) => (
                      <div
                        key={j}
                        className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white/60' : 'bg-emerald-500'}`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDayEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border-t border-slate-100 px-5 py-3 dark:border-slate-800"
        >
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
            {selectedDayEvents.length} event{selectedDayEvents.length > 1 ? 's' : ''}
          </p>
          <div className="space-y-1.5">
            {selectedDayEvents.map((e: any, i: number) => {
              const config = getEventConfig(e.eventType);
              return (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                  <span className="text-sm">{config.icon}</span>
                  <span className="text-xs font-medium text-slate-900 dark:text-white truncate">{e.title}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
