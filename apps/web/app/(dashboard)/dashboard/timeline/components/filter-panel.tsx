'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter, X, ChevronDown, Search, Calendar, Eye, Users, Globe,
  CheckCircle, FileText, Clock, AlertCircle, Archive, Pencil,
} from 'lucide-react';
import { EVENT_CATEGORIES, EVENT_TYPE_CONFIG, VISIBILITY_OPTIONS, STATUS_CONFIG } from './constants';

export interface AdvancedFilters {
  search: string;
  category: string;
  eventType: string;
  visibility: string;
  familyId: string;
  dateFrom: string;
  dateTo: string;
  datePreset: string;
  status: string;
  verification: string;
  documents: string;
}

const DEFAULT_FILTERS: AdvancedFilters = {
  search: '', category: '', eventType: '', visibility: '', familyId: '',
  dateFrom: '', dateTo: '', datePreset: '', status: '', verification: '', documents: '',
};

const DATE_PRESETS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'this_year', label: 'This Year' },
  { id: 'custom', label: 'Custom Range' },
];

const STATUS_OPTIONS = [
  { id: '', label: 'All', icon: null },
  { id: 'DRAFT', label: 'Draft', icon: Pencil },
  { id: 'PUBLISHED', label: 'Published', icon: CheckCircle },
  { id: 'COMPLETED', label: 'Completed', icon: CheckCircle },
  { id: 'CANCELLED', label: 'Cancelled', icon: AlertCircle },
  { id: 'ARCHIVED', label: 'Archived', icon: Archive },
];

const VERIFICATION_OPTIONS = [
  { id: '', label: 'All' },
  { id: 'verified', label: 'Verified' },
  { id: 'unverified', label: 'Unverified' },
];

const DOCUMENT_OPTIONS = [
  { id: '', label: 'All' },
  { id: 'with', label: 'With Documents' },
  { id: 'without', label: 'Without Documents' },
];

export default function FilterPanel({ filters, onChange, onClose }: {
  filters: AdvancedFilters;
  onChange: (f: AdvancedFilters) => void;
  onClose?: () => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (section: string) => setExpanded(expanded === section ? null : section);

  const update = (patch: Partial<AdvancedFilters>) => onChange({ ...filters, ...patch });

  const clearAll = () => onChange(DEFAULT_FILTERS);

  const activeCount = Object.values(filters).filter(v => v !== '' && v !== undefined).length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-900 dark:text-white">Filters</span>
          {activeCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button onClick={clearAll} className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium">
              Clear All
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-3 space-y-1">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Search events..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm text-slate-700 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
        </div>

        {/* Date Filters */}
        <FilterSection title="Date" id="date" icon={Calendar} expanded={expanded === 'date'} onToggle={() => toggle('date')}>
          <div className="flex flex-wrap gap-1.5">
            {DATE_PRESETS.map(d => (
              <button
                key={d.id}
                onClick={() => update({ datePreset: filters.datePreset === d.id ? '' : d.id })}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  filters.datePreset === d.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          {filters.datePreset === 'custom' && (
            <div className="mt-2 flex gap-2">
              <div className="flex-1">
                <label className="text-[11px] text-slate-400">From</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => update({ dateFrom: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div className="flex-1">
                <label className="text-[11px] text-slate-400">To</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => update({ dateTo: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          )}
        </FilterSection>

        {/* Status Filters */}
        <FilterSection title="Status" id="status" icon={AlertCircle} expanded={expanded === 'status'} onToggle={() => toggle('status')}>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => update({ status: filters.status === s.id ? '' : s.id })}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  filters.status === s.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Verification */}
        <FilterSection title="Verification" id="verification" icon={CheckCircle} expanded={expanded === 'verification'} onToggle={() => toggle('verification')}>
          <div className="flex flex-wrap gap-1.5">
            {VERIFICATION_OPTIONS.map(v => (
              <button
                key={v.id}
                onClick={() => update({ verification: filters.verification === v.id ? '' : v.id })}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  filters.verification === v.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Documents */}
        <FilterSection title="Documents" id="documents" icon={FileText} expanded={expanded === 'documents'} onToggle={() => toggle('documents')}>
          <div className="flex flex-wrap gap-1.5">
            {DOCUMENT_OPTIONS.map(d => (
              <button
                key={d.id}
                onClick={() => update({ documents: filters.documents === d.id ? '' : d.id })}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  filters.documents === d.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Visibility */}
        <FilterSection title="Visibility" id="visibility" icon={Eye} expanded={expanded === 'visibility'} onToggle={() => toggle('visibility')}>
          <div className="space-y-1">
            {VISIBILITY_OPTIONS.map(v => (
              <button
                key={v.value}
                onClick={() => update({ visibility: filters.visibility === v.value ? '' : v.value })}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors ${
                  filters.visibility === v.value
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <span>{v.icon}</span>
                <span>{v.label}</span>
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Event Type */}
        <FilterSection title="Event Type" id="eventType" icon={Clock} expanded={expanded === 'eventType'} onToggle={() => toggle('eventType')}>
          <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-none">
            {Object.entries(EVENT_TYPE_CONFIG).map(([key, val]) => (
              <button
                key={key}
                onClick={() => update({ eventType: filters.eventType === key ? '' : key })}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors ${
                  filters.eventType === key
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <span>{val.icon}</span>
                <span>{val.label}</span>
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Category */}
        <FilterSection title="Category" id="category" icon={Globe} expanded={expanded === 'category'} onToggle={() => toggle('category')}>
          <div className="flex flex-wrap gap-1.5">
            {EVENT_CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => update({ category: filters.category === c.id ? '' : c.id })}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  filters.category === c.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </FilterSection>
      </div>
    </div>
  );
}

function FilterSection({ title, id, icon: Icon, expanded, onToggle, children }: {
  title: string; id: string; icon?: any; expanded: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <span className="flex items-center gap-2">
          {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" />}
          {title}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden px-2.5"
          >
            <div className="pb-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
