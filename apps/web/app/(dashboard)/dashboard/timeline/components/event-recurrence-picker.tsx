'use client';

import { useState, useMemo } from 'react';
import { Repeat, Calendar } from 'lucide-react';

type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

interface RecurrencePickerProps {
  value?: string;
  ruleValue?: string;
  onChange?: (result: { recurrence: string; recurrenceRule: string }) => void;
  baseDate?: string;
}

const DAYS_OF_WEEK = [
  { key: 'SU', label: 'Sun' },
  { key: 'MO', label: 'Mon' },
  { key: 'TU', label: 'Tue' },
  { key: 'WE', label: 'Wed' },
  { key: 'TH', label: 'Thu' },
  { key: 'FR', label: 'Fri' },
  { key: 'SA', label: 'Sat' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function nthWeekday(dayOfWeek: number, n: number, month: number, year: number): Date {
  const first = new Date(year, month, 1);
  const offset = (dayOfWeek - first.getDay() + 7) % 7;
  const day = 1 + offset + (n - 1) * 7;
  return new Date(year, month, Math.min(day, new Date(year, month + 1, 0).getDate()));
}

function getWeekdayIndex(icalDay: string): number {
  const map: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
  return map[icalDay] ?? 0;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

function addYears(d: Date, n: number): Date {
  const r = new Date(d);
  r.setFullYear(r.getFullYear() + n);
  return r;
}

function formatPreviewDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function EventRecurrencePicker({ value = 'none', ruleValue = '', onChange, baseDate }: RecurrencePickerProps) {
  const [type, setType] = useState<RecurrenceType>(value as RecurrenceType);
  const [weekDays, setWeekDays] = useState<string[]>(() => {
    if (!ruleValue) return [];
    const match = ruleValue.match(/BYDAY=([^;]+)/);
    return match ? match[1].split(',').filter(Boolean) : [];
  });
  const [monthDay, setMonthDay] = useState<number>(() => {
    if (!ruleValue) return new Date(baseDate || Date.now()).getDate();
    const match = ruleValue.match(/BYMONTHDAY=(\d+)/);
    return match ? parseInt(match[1]) : new Date(baseDate || Date.now()).getDate();
  });
  const [monthNth, setMonthNth] = useState<number>(1);
  const [monthNthDay, setMonthNthDay] = useState<string>('MO');
  const [monthMode, setMonthMode] = useState<'day' | 'nth'>('day');
  const [customRule, setCustomRule] = useState(ruleValue);

  const base = useMemo(() => new Date(baseDate || Date.now()), [baseDate]);

  const previewDates = useMemo(() => {
    const dates: Date[] = [];
    if (type === 'none') return dates;
    for (let i = 1; dates.length < 5 && i < 365 * 3; i++) {
      let d: Date;
      if (type === 'daily') {
        d = addDays(base, i);
      } else if (type === 'weekly') {
        d = addDays(base, i);
        if (weekDays.length > 0 && !weekDays.includes(DAYS_OF_WEEK[d.getDay() === 0 ? 6 : d.getDay() - 1]?.key || '')) {
          continue;
        }
      } else if (type === 'monthly') {
        if (monthMode === 'nth') {
          d = nthWeekday(getWeekdayIndex(monthNthDay), monthNth, base.getMonth() + Math.floor(i / 28), base.getFullYear());
          if (d <= base) d = addMonths(d, 1);
          i += 27;
        } else {
          d = addMonths(base, Math.ceil(i / 28));
          d = new Date(d.getFullYear(), d.getMonth(), monthDay);
          if (d <= base) d = addMonths(d, 1);
          i += 27;
        }
      } else if (type === 'yearly') {
        d = addYears(base, Math.ceil(i / 364));
        i += 363;
      } else {
        break;
      }
      if (d > base) dates.push(d);
    }
    return dates;
  }, [type, base, weekDays, monthDay, monthMode, monthNth, monthNthDay]);

  const buildRule = (): string => {
    if (type === 'none') return '';
    if (type === 'custom') return customRule;
    if (type === 'daily') return 'FREQ=DAILY';
    if (type === 'weekly') {
      if (weekDays.length === 0) return 'FREQ=WEEKLY';
      return `FREQ=WEEKLY;BYDAY=${weekDays.join(',')}`;
    }
    if (type === 'monthly') {
      if (monthMode === 'nth') {
        return `FREQ=MONTHLY;BYDAY=${monthNth}${monthNthDay}`;
      }
      return `FREQ=MONTHLY;BYMONTHDAY=${monthDay}`;
    }
    if (type === 'yearly') return 'FREQ=YEARLY';
    return '';
  };

  const handleChange = (newType: RecurrenceType) => {
    setType(newType);
    const recurrence = newType === 'none' ? '' : newType.charAt(0).toUpperCase() + newType.slice(1);
    onChange?.({ recurrence, recurrenceRule: newType === 'custom' ? customRule : buildRule() });
  };

  const handleRuleChange = () => {
    onChange?.({ recurrence: type === 'none' ? '' : type.charAt(0).toUpperCase() + type.slice(1), recurrenceRule: buildRule() });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Repeat className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Recurrence</h4>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {(['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom'] as RecurrenceType[]).map(opt => (
          <button
            key={opt}
            onClick={() => handleChange(opt)}
            className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors capitalize ${
              type === opt
                ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {type === 'weekly' && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Select days of week</p>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map(d => (
              <button
                key={d.key}
                onClick={() => {
                  setWeekDays(prev =>
                    prev.includes(d.key) ? prev.filter(x => x !== d.key) : [...prev, d.key]
                  );
                }}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-medium transition-colors ${
                  weekDays.includes(d.key)
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {type === 'monthly' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setMonthMode('day')}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                monthMode === 'day' ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'border-slate-200 text-slate-500 dark:border-slate-700'
              }`}
            >
              Day of month
            </button>
            <button
              onClick={() => setMonthMode('nth')}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                monthMode === 'nth' ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'border-slate-200 text-slate-500 dark:border-slate-700'
              }`}
            >
              Nth weekday
            </button>
          </div>
          {monthMode === 'day' ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 dark:text-slate-400">Day</span>
              <input
                type="number"
                min={1}
                max={31}
                value={monthDay}
                onChange={e => { setMonthDay(parseInt(e.target.value) || 1); handleRuleChange(); }}
                className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400">of each month</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={monthNth}
                onChange={e => setMonthNth(parseInt(e.target.value))}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value={1}>1st</option>
                <option value={2}>2nd</option>
                <option value={3}>3rd</option>
                <option value={4}>4th</option>
                <option value={-1}>Last</option>
              </select>
              <select
                value={monthNthDay}
                onChange={e => setMonthNthDay(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {DAYS_OF_WEEK.map(d => (
                  <option key={d.key} value={d.key}>{d.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {type === 'custom' && (
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">iCal RRULE</label>
          <input
            type="text"
            value={customRule}
            onChange={e => setCustomRule(e.target.value)}
            placeholder="FREQ=WEEKLY;BYDAY=MO,WE,FR"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      )}

      {type !== 'none' && previewDates.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="flex items-center gap-1.5 mb-2">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Next 5 occurrences</span>
          </div>
          <div className="space-y-1">
            {previewDates.map((d, i) => (
              <p key={i} className="text-xs text-slate-700 dark:text-slate-300">
                {i + 1}. {formatPreviewDate(d)}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
