'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  LayoutGrid, List, Clock, CalendarDays,
} from 'lucide-react';
import { EVENT_TYPE_CONFIG } from './constants';

interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  eventType: string;
  status?: string;
  location?: string;
  description?: string;
  [key: string]: any;
}

interface TimelineCalendarProps {
  events: TimelineEvent[];
  onEventClick: (event: TimelineEvent) => void;
  onDateClick: (date: Date) => void;
  onMonthChange?: (year: number, month: number) => void;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const EVENT_DOT_COLORS: Record<string, string> = {};
Object.entries(EVENT_TYPE_CONFIG).forEach(([key, cfg]) => {
  const gradient = cfg.gradient;
  const firstColor = gradient.replace('from-', '').split(' ')[0];
  EVENT_DOT_COLORS[key] = firstColor;
});

function getEventDotColor(eventType: string): string {
  const map: Record<string, string> = {
    BIRTH: 'bg-pink-500',
    DEATH: 'bg-slate-500',
    MARRIAGE: 'bg-red-500',
    ENGAGEMENT: 'bg-rose-400',
    DIVORCE: 'bg-gray-500',
    GRADUATION: 'bg-blue-500',
    EDUCATION: 'bg-indigo-500',
    JOB: 'bg-emerald-500',
    PROMOTION: 'bg-amber-500',
    CAREER: 'bg-teal-500',
    BUSINESS: 'bg-violet-500',
    MIGRATION: 'bg-cyan-500',
    HOUSE_PURCHASE: 'bg-orange-500',
    AWARD: 'bg-yellow-500',
    MILITARY_SERVICE: 'bg-green-600',
    RELIGIOUS_EVENT: 'bg-purple-500',
    TRAVEL: 'bg-sky-500',
    ACCIDENT: 'bg-red-400',
    MEDICAL: 'bg-teal-400',
    RETIREMENT: 'bg-lime-500',
    DOCUMENT_ADDED: 'bg-slate-400',
    MEMORY_ADDED: 'bg-pink-400',
    ANNIVERSARY: 'bg-fuchsia-500',
    BIRTHDAY: 'bg-amber-400',
    FAMILY_REUNION: 'bg-emerald-500',
    CLAN_GATHERING: 'bg-stone-500',
    COMMUNITY_EVENT: 'bg-indigo-600',
    ACHIEVEMENT: 'bg-yellow-500',
    HAJJ: 'bg-emerald-600',
    UMRAH: 'bg-teal-500',
    MILITARY_ACHIEVEMENT: 'bg-green-500',
    CUSTOM_EVENT: 'bg-slate-400',
  };
  return map[eventType] || 'bg-slate-400';
}

function getEventBlockColor(eventType: string): { bg: string; text: string; border: string } {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    BIRTH: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-300 dark:border-pink-700' },
    DEATH: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-600' },
    MARRIAGE: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-300 dark:border-red-700' },
    ENGAGEMENT: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-300 dark:border-rose-700' },
    DIVORCE: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-300 dark:border-gray-600' },
    GRADUATION: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-700' },
    EDUCATION: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-300 dark:border-indigo-700' },
    JOB: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-700' },
    PROMOTION: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-700' },
    CAREER: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-300 dark:border-teal-700' },
    BUSINESS: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-300 dark:border-violet-700' },
    MIGRATION: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-300 dark:border-cyan-700' },
    HOUSE_PURCHASE: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-700' },
    AWARD: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-700' },
    TRAVEL: { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-300 dark:border-sky-700' },
    RELIGIOUS_EVENT: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-700' },
    BIRTHDAY: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-700' },
    ANNIVERSARY: { bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30', text: 'text-fuchsia-700 dark:text-fuchsia-300', border: 'border-fuchsia-300 dark:border-fuchsia-700' },
    FAMILY_REUNION: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-700' },
    MEDICAL: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-300 dark:border-teal-700' },
    ACHIEVEMENT: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-700' },
    COMMUNITY_EVENT: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-300 dark:border-indigo-700' },
    CLAN_GATHERING: { bg: 'bg-stone-100 dark:bg-stone-800', text: 'text-stone-700 dark:text-stone-300', border: 'border-stone-300 dark:border-stone-600' },
    HAJJ: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-700' },
    UMRAH: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-300 dark:border-teal-700' },
    RETIREMENT: { bg: 'bg-lime-100 dark:bg-lime-900/30', text: 'text-lime-700 dark:text-lime-300', border: 'border-lime-300 dark:border-lime-700' },
    MILITARY_SERVICE: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-300 dark:border-green-700' },
    MILITARY_ACHIEVEMENT: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-300 dark:border-green-700' },
    ACCIDENT: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-300', border: 'border-red-300 dark:border-red-700' },
    DOCUMENT_ADDED: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-600' },
    MEMORY_ADDED: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-300', border: 'border-pink-300 dark:border-pink-700' },
    CUSTOM_EVENT: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-600' },
  };
  return map[eventType] || map.CUSTOM_EVENT;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseEventDate(dateStr: string): Date {
  return new Date(dateStr);
}

function formatEventTime(time?: string): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hr = parseInt(h);
  if (isNaN(hr)) return time;
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

type ViewMode = 'month' | 'week' | 'day' | 'agenda';

const VIEW_TABS: { key: ViewMode; label: string; icon: React.ReactNode }[] = [
  { key: 'month', label: 'Month', icon: <LayoutGrid className="h-3.5 w-3.5" /> },
  { key: 'week', label: 'Week', icon: <CalendarDays className="h-3.5 w-3.5" /> },
  { key: 'day', label: 'Day', icon: <Clock className="h-3.5 w-3.5" /> },
  { key: 'agenda', label: 'Agenda', icon: <List className="h-3.5 w-3.5" /> },
];

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -60 : 60, opacity: 0 }),
};

export function TimelineCalendar({
  events,
  onEventClick,
  onDateClick,
  onMonthChange,
}: TimelineCalendarProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [direction, setDirection] = useState(0);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    events.forEach((evt) => {
      const d = parseEventDate(evt.date);
      const key = formatDateKey(d);
      const existing = map.get(key) || [];
      existing.push(evt);
      map.set(key, existing);
    });
    return map;
  }, [events]);

  const navigateMonth = useCallback((dir: number) => {
    setDirection(dir);
    setCurrentMonth((prev) => {
      let next = prev + dir;
      let year = currentYear;
      if (next > 11) { next = 0; year++; }
      if (next < 0) { next = 11; year--; }
      setCurrentYear(year);
      onMonthChange?.(year, next);
      return next;
    });
  }, [currentYear, onMonthChange]);

  const goToToday = useCallback(() => {
    const now = new Date();
    setDirection(0);
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(now);
    onMonthChange?.(now.getFullYear(), now.getMonth());
  }, [onMonthChange]);

  const handleDayClick = useCallback((date: Date) => {
    setSelectedDate(date);
    onDateClick(date);
  }, [onDateClick]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') navigateMonth(-1);
      if (e.key === 'ArrowRight') navigateMonth(1);
      if (e.key === 't') goToToday();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [navigateMonth, goToToday]);

  const monthKey = `${currentYear}-${currentMonth}`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
            <CalendarIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {events.length} event{events.length !== 1 ? 's' : ''} total
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800 sm:flex">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  viewMode === tab.key
                    ? 'bg-white text-emerald-600 shadow-sm dark:bg-slate-700 dark:text-emerald-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={() => navigateMonth(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goToToday}
              className="hidden rounded-md px-3 py-1 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 sm:block"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-1 sm:hidden">
            {VIEW_TABS.slice(0, 2).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setViewMode(tab.key)}
                className={`flex h-8 w-8 items-center justify-center rounded-md transition-all ${
                  viewMode === tab.key
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                    : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                title={tab.label}
              >
                {tab.icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait" custom={direction}>
          {viewMode === 'month' && (
            <motion.div
              key={monthKey}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <MonthView
                year={currentYear}
                month={currentMonth}
                eventsByDate={eventsByDate}
                selectedDate={selectedDate}
                onDayClick={handleDayClick}
                onEventClick={onEventClick}
              />
            </motion.div>
          )}
          {viewMode === 'week' && (
            <motion.div
              key={`week-${monthKey}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <WeekView
                referenceDate={selectedDate}
                eventsByDate={eventsByDate}
                onEventClick={onEventClick}
                onDayClick={handleDayClick}
              />
            </motion.div>
          )}
          {viewMode === 'day' && (
            <motion.div
              key={`day-${formatDateKey(selectedDate)}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <DayView
                date={selectedDate}
                events={eventsByDate.get(formatDateKey(selectedDate)) || []}
                onEventClick={onEventClick}
              />
            </motion.div>
          )}
          {viewMode === 'agenda' && (
            <motion.div
              key="agenda"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <AgendaView
                events={events}
                onEventClick={onEventClick}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MonthView({
  year,
  month,
  eventsByDate,
  selectedDate,
  onDayClick,
  onEventClick,
}: {
  year: number;
  month: number;
  eventsByDate: Map<string, TimelineEvent[]>;
  selectedDate: Date;
  onDayClick: (date: Date) => void;
  onEventClick: (event: TimelineEvent) => void;
}) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-px">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px rounded-xl bg-slate-100 dark:bg-slate-800">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="min-h-[80px] bg-slate-50/50 dark:bg-slate-900/50 sm:min-h-[100px]" />;
          }
          const date = new Date(year, month, day);
          const key = formatDateKey(date);
          const dayEvents = eventsByDate.get(key) || [];
          const isToday = isSameDay(date, today);
          const isSelected = isSameDay(date, selectedDate);
          const visibleDots = dayEvents.slice(0, 3);
          const extraCount = dayEvents.length - 3;

          return (
            <button
              key={key}
              onClick={() => onDayClick(date)}
              className={`relative min-h-[80px] bg-white p-1.5 text-left transition-all hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 sm:min-h-[100px] sm:p-2 ${
                isToday ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''
              }`}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  isToday
                    ? 'bg-emerald-500 text-white ring-2 ring-emerald-500 ring-offset-1 dark:ring-emerald-400 dark:ring-offset-slate-900'
                    : isSelected
                      ? 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white'
                      : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {day}
              </span>
              <div className="mt-1 flex flex-wrap gap-1">
                {visibleDots.map((evt, i) => (
                  <div
                    key={`${evt.id}-${i}`}
                    className="group relative"
                    onClick={(e) => { e.stopPropagation(); onEventClick(evt); }}
                  >
                    <div className={`h-1.5 w-1.5 rounded-full ${getEventDotColor(evt.eventType)}`} />
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-lg group-hover:block dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                      {EVENT_TYPE_CONFIG[evt.eventType]?.icon} {evt.title}
                      {evt.startTime && (
                        <span className="ml-1 text-slate-400">{formatEventTime(evt.startTime)}</span>
                      )}
                    </div>
                  </div>
                ))}
                {extraCount > 0 && (
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    +{extraCount}
                  </span>
                )}
              </div>
              {dayEvents.length > 0 && (
                <div className="mt-1 hidden space-y-0.5 sm:block">
                  {dayEvents.slice(0, 2).map((evt) => (
                    <button
                      key={evt.id}
                      onClick={(e) => { e.stopPropagation(); onEventClick(evt); }}
                      className={`w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] font-medium leading-tight border ${
                        getEventBlockColor(evt.eventType).bg
                      } ${getEventBlockColor(evt.eventType).text} ${getEventBlockColor(evt.eventType).border}`}
                    >
                      {evt.title}
                    </button>
                  ))}
                  {dayEvents.length > 2 && (
                    <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 px-1">
                      +{dayEvents.length - 2} more
                    </p>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  referenceDate,
  eventsByDate,
  onEventClick,
  onDayClick,
}: {
  referenceDate: Date;
  eventsByDate: Map<string, TimelineEvent[]>;
  onEventClick: (event: TimelineEvent) => void;
  onDayClick: (date: Date) => void;
}) {
  const today = new Date();
  const weekStart = useMemo(() => {
    const d = new Date(referenceDate);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [referenceDate]);

  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekStart]);

  const hours = useMemo(() => {
    const h: number[] = [];
    for (let i = 6; i <= 22; i++) h.push(i);
    return h;
  }, []);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-200 dark:border-slate-700">
          <div className="py-2" />
          {weekDays.map((d) => {
            const isToday = isSameDay(d, today);
            return (
              <button
                key={formatDateKey(d)}
                onClick={() => onDayClick(d)}
                className={`border-l border-slate-100 py-2 text-center dark:border-slate-800 ${
                  isToday ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''
                }`}
              >
                <p className="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500">
                  {WEEKDAYS[weekDays.indexOf(d)]}
                </p>
                <p className={`mt-0.5 text-lg font-semibold ${
                  isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {d.getDate()}
                </p>
              </button>
            );
          })}
        </div>
        <div className="relative grid grid-cols-[60px_repeat(7,1fr)]">
          {hours.map((hour) => (
            <React.Fragment key={hour}>
              <div className="border-b border-slate-100 py-3 pr-2 text-right dark:border-slate-800">
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  {hour === 0 ? '12 AM' : hour <= 12 ? `${hour} ${hour === 12 ? 'PM' : 'AM'}` : `${hour - 12} PM`}
                </span>
              </div>
              {weekDays.map((d) => {
                const key = formatDateKey(d);
                const dayEvents = eventsByDate.get(key) || [];
                const hourEvents = dayEvents.filter((evt) => {
                  if (!evt.startTime) return hour === 9;
                  const [h] = evt.startTime.split(':').map(Number);
                  return h === hour;
                });
                return (
                  <div
                    key={`${key}-${hour}`}
                    className="relative min-h-[36px] border-b border-l border-slate-100 dark:border-slate-800"
                  >
                    {hourEvents.map((evt) => (
                      <button
                        key={evt.id}
                        onClick={() => onEventClick(evt)}
                        className={`absolute inset-x-0.5 top-0.5 z-10 truncate rounded border px-1.5 py-0.5 text-left text-[10px] font-medium leading-tight ${
                          getEventBlockColor(evt.eventType).bg
                        } ${getEventBlockColor(evt.eventType).text} ${getEventBlockColor(evt.eventType).border}`}
                        title={evt.title}
                      >
                        {evt.title}
                      </button>
                    ))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function DayView({
  date,
  events,
  onEventClick,
}: {
  date: Date;
  events: TimelineEvent[];
  onEventClick: (event: TimelineEvent) => void;
}) {
  const today = new Date();
  const isToday = isSameDay(date, today);

  const hours = useMemo(() => {
    const h: number[] = [];
    for (let i = 6; i <= 22; i++) h.push(i);
    return h;
  }, []);

  const dayLabel = `${WEEKDAYS[date.getDay() === 0 ? 6 : date.getDay() - 1]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold ${
          isToday ? 'bg-emerald-500 text-white ring-2 ring-emerald-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
        }`}>
          {date.getDate()}
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{dayLabel}</p>
          <p className="text-xs text-slate-400">{events.length} event{events.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
        {hours.map((hour) => {
          const hourEvents = events.filter((evt) => {
            if (!evt.startTime) return hour === 9;
            const [h] = evt.startTime.split(':').map(Number);
            return h === hour;
          });
          return (
            <div key={hour} className="grid grid-cols-[60px_1fr] border-b border-slate-100 last:border-b-0 dark:border-slate-800">
              <div className="border-r border-slate-100 py-3 pr-2 text-right dark:border-slate-800">
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  {hour === 0 ? '12 AM' : hour <= 12 ? `${hour} ${hour === 12 ? 'PM' : 'AM'}` : `${hour - 12} PM`}
                </span>
              </div>
              <div className="min-h-[40px] p-1">
                {hourEvents.map((evt) => (
                  <button
                    key={evt.id}
                    onClick={() => onEventClick(evt)}
                    className={`mb-1 w-full rounded-lg border px-3 py-2 text-left transition-all hover:shadow-sm ${
                      getEventBlockColor(evt.eventType).bg
                    } ${getEventBlockColor(evt.eventType).text} ${getEventBlockColor(evt.eventType).border}`}
                  >
                    <span className="text-xs font-semibold">{evt.title}</span>
                    {(evt.startTime || evt.endTime) && (
                      <span className="ml-2 text-[10px] opacity-70">
                        {formatEventTime(evt.startTime)}
                        {evt.endTime ? ` - ${formatEventTime(evt.endTime)}` : ''}
                      </span>
                    )}
                    {evt.location && (
                      <span className="ml-2 text-[10px] opacity-60">| {evt.location}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <CalendarIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">No events on this day</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Click elsewhere to add one</p>
        </div>
      )}
    </div>
  );
}

function AgendaView({
  events,
  onEventClick,
}: {
  events: TimelineEvent[];
  onEventClick: (event: TimelineEvent) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = useMemo(() => {
    const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const future = sorted.filter((e) => {
      const d = new Date(e.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() >= today.getTime();
    });
    return future.slice(0, 50);
  }, [events, today]);

  const past = useMemo(() => {
    const sorted = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted.filter((e) => {
      const d = new Date(e.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() < today.getTime();
    }).slice(0, 20);
  }, [events, today]);

  const grouped = useMemo(() => {
    const groups = new Map<string, TimelineEvent[]>();
    upcoming.forEach((evt) => {
      const key = formatDateKey(parseEventDate(evt.date));
      const existing = groups.get(key) || [];
      existing.push(evt);
      groups.set(key, existing);
    });
    return groups;
  }, [upcoming]);

  return (
    <div className="space-y-6">
      {upcoming.length === 0 && past.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <List className="h-8 w-8 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">No events yet</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Events will appear here once added</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Upcoming
          </h3>
          <div className="space-y-4">
            {Array.from(grouped.entries()).map(([dateKey, evts]) => {
              const date = new Date(dateKey + 'T00:00:00');
              const isToday = isSameDay(date, today);
              const isTomorrow = isSameDay(date, new Date(today.getTime() + 86400000));
              const label = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : `${WEEKDAYS[date.getDay() === 0 ? 6 : date.getDay() - 1]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;

              return (
                <div key={dateKey}>
                  <div className="mb-2 flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${isToday ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    <span className={`text-xs font-semibold ${isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                      {label}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {evts.length} event{evts.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="ml-4 space-y-1.5 border-l-2 border-slate-100 pl-4 dark:border-slate-800">
                    {evts.map((evt) => {
                      const cfg = EVENT_TYPE_CONFIG[evt.eventType] || EVENT_TYPE_CONFIG.CUSTOM_EVENT;
                      return (
                        <button
                          key={evt.id}
                          onClick={() => onEventClick(evt)}
                          className="flex w-full items-center gap-3 rounded-lg border border-slate-100 bg-white p-3 text-left transition-all hover:border-slate-200 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                        >
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm ${cfg.color}`}>
                            {cfg.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{evt.title}</p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                              {evt.startTime && <span>{formatEventTime(evt.startTime)}</span>}
                              {evt.location && (
                                <>
                                  <span className="text-slate-300 dark:text-slate-600">|</span>
                                  <span className="truncate">{evt.location}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Past Events
          </h3>
          <div className="space-y-1.5 border-l-2 border-slate-100 pl-4 dark:border-slate-800">
            {past.map((evt) => {
              const cfg = EVENT_TYPE_CONFIG[evt.eventType] || EVENT_TYPE_CONFIG.CUSTOM_EVENT;
              const d = parseEventDate(evt.date);
              return (
                <button
                  key={evt.id}
                  onClick={() => onEventClick(evt)}
                  className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 opacity-60 hover:opacity-100"
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs ${cfg.color}`}>
                    {cfg.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">{evt.title}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      {MONTHS[d.getMonth()]} {d.getDate()}, {d.getFullYear()}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
