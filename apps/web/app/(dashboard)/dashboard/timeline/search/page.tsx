'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api-client';
import { useDebounce } from '@/hooks/use-debounce';
import {
  Search, X, SlidersHorizontal, Loader2, Grid3X3, List, ArrowUpDown,
  MapPin, Users, ChevronDown, Sparkles, RotateCcw,
  Pin, Clock, Trash2, Command, Bookmark, BookmarkCheck,
} from 'lucide-react';
import EventCard from '../components/event-card';
import { EVENT_TYPE_CONFIG, EVENT_CATEGORIES, VISIBILITY_OPTIONS, STATUS_CONFIG } from '../components/constants';

const SEARCH_HISTORY_KEY = 'timeline-search-history';
const SAVED_SEARCHES_KEY = 'timeline-saved-searches';
const PINNED_FILTERS_KEY = 'timeline-pinned-filters';
const MAX_HISTORY = 10;

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* empty */ }
}

const FILTER_CHIPS = [
  { id: 'all', label: 'All Events' },
  ...EVENT_CATEGORIES.filter(c => c.id !== 'all'),
];

const SORT_OPTIONS = [
  { id: 'relevance', label: 'Most Relevant' },
  { id: 'newest', label: 'Newest First' },
  { id: 'oldest', label: 'Oldest First' },
  { id: 'popular', label: 'Most Popular' },
];

const YEARS = Array.from({ length: 11 }, (_, i) => 2020 + i);

const SEARCH_SUGGESTIONS = [
  { label: 'Birth events', query: 'birth', icon: 'ðŸ‘¶' },
  { label: 'Marriage events', query: 'marriage', icon: 'ðŸ’’' },
  { label: 'Education events', query: 'education', icon: 'ðŸ“š' },
  { label: 'Career milestones', query: 'career', icon: 'ðŸ“ˆ' },
  { label: 'Travel history', query: 'travel', icon: 'ðŸŒ' },
  { label: 'Medical records', query: 'medical', icon: 'ðŸ¥' },
];

interface Filters {
  eventType: string;
  category: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  visibility: string;
  participant: string;
  location: string;
  familyId: string;
  year: string;
  sortBy: string;
}

const DEFAULT_FILTERS: Filters = {
  eventType: '', category: 'all', status: '', dateFrom: '', dateTo: '',
  visibility: '', participant: '', location: '', familyId: '', year: '', sortBy: 'relevance',
};

function filtersToKey(f: Filters): string {
  return JSON.stringify({ ...f, sortBy: 'relevance' });
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="h-32 skeleton-shimmer" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl skeleton-shimmer shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 skeleton-shimmer rounded w-3/4" />
            <div className="h-3 skeleton-shimmer rounded w-1/2" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-3 skeleton-shimmer rounded w-20" />
          <div className="h-3 skeleton-shimmer rounded w-16" />
        </div>
      </div>
    </div>
  );
}

interface SearchResultEvent {
  id: string;
  title: string;
  eventType: string;
  date?: string;
  time?: string;
  status?: string;
  visibility?: string;
  location?: string;
  description?: string;
  likeCount?: number;
  participants?: { name?: string; member?: { name?: string } }[];
  [key: string]: unknown;
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim() || !text) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-emerald-200/70 text-emerald-900 dark:bg-emerald-800/50 dark:text-emerald-200 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function CompactEventCard({ event, index, query }: { event: SearchResultEvent; index: number; query: string }) {
  const config = EVENT_TYPE_CONFIG[event.eventType] || EVENT_TYPE_CONFIG.CUSTOM_EVENT;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
    >
      <a
        href={`/dashboard/timeline/${event.id}`}
        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-all hover:shadow-md hover:border-emerald-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-800 group"
      >
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${config.color}`}>
          {config.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
            {highlightText(event.title, query)}
          </h4>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{config.label}</span>
            {event.date && (
              <>
                <span className="text-slate-300 dark:text-slate-600">Â·</span>
                <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </>
            )}
            {event.location && (
              <>
                <span className="text-slate-300 dark:text-slate-600">Â·</span>
                <span className="flex items-center gap-0.5 truncate max-w-[120px]">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{highlightText(event.location, query)}</span>
                </span>
              </>
            )}
          </div>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 -rotate-90 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>
    </motion.div>
  );
}

export default function TimelineSearchPage() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [events, setEvents] = useState<SearchResultEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [hasSearched, setHasSearched] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => loadJSON(SEARCH_HISTORY_KEY, []));
  const [savedSearches, setSavedSearches] = useState<{ name: string; query: string; filters: Filters }[]>(() => loadJSON(SAVED_SEARCHES_KEY, []));
  const [pinnedFilters, setPinnedFilters] = useState<{ name: string; filters: Filters }[]>(() => loadJSON(PINNED_FILTERS_KEY, []));
  const [saveName, setSaveName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);
  const fetchedRef = useRef(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.eventType) count++;
    if (filters.category && filters.category !== 'all') count++;
    if (filters.status) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.visibility) count++;
    if (filters.participant) count++;
    if (filters.location) count++;
    if (filters.familyId) count++;
    if (filters.year) count++;
    return count;
  }, [filters]);

  const addToHistory = useCallback((term: string) => {
    if (!term.trim()) return;
    setSearchHistory(prev => {
      const next = [term, ...prev.filter(h => h !== term)].slice(0, MAX_HISTORY);
      saveJSON(SEARCH_HISTORY_KEY, next);
      return next;
    });
  }, []);

  const removeFromHistory = useCallback((term: string) => {
    setSearchHistory(prev => {
      const next = prev.filter(h => h !== term);
      saveJSON(SEARCH_HISTORY_KEY, next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    saveJSON(SEARCH_HISTORY_KEY, []);
  }, []);

  const saveCurrentSearch = useCallback(() => {
    if (!saveName.trim()) return;
    const entry = { name: saveName.trim(), query: debouncedQuery, filters: { ...filters } };
    setSavedSearches(prev => {
      const next = [entry, ...prev].slice(0, 20);
      saveJSON(SAVED_SEARCHES_KEY, next);
      return next;
    });
    setSaveName('');
    setShowSaveDialog(false);
  }, [saveName, debouncedQuery, filters]);

  const deleteSavedSearch = useCallback((idx: number) => {
    setSavedSearches(prev => {
      const next = prev.filter((_, i) => i !== idx);
      saveJSON(SAVED_SEARCHES_KEY, next);
      return next;
    });
  }, []);

  const applySavedSearch = useCallback((entry: { query: string; filters: Filters }) => {
    setQuery(entry.query);
    setFilters({ ...entry.filters, sortBy: entry.filters.sortBy || 'relevance' });
    setShowSuggestions(false);
  }, []);

  const pinCurrentFilters = useCallback(() => {
    const name = `Filter #${pinnedFilters.length + 1}`;
    const entry = { name, filters: { ...filters } };
    setPinnedFilters(prev => {
      const next = [...prev, entry].slice(0, 10);
      saveJSON(PINNED_FILTERS_KEY, next);
      return next;
    });
  }, [filters, pinnedFilters.length]);

  const removePinnedFilter = useCallback((idx: number) => {
    setPinnedFilters(prev => {
      const next = prev.filter((_, i) => i !== idx);
      saveJSON(PINNED_FILTERS_KEY, next);
      return next;
    });
  }, []);

  const applyPinnedFilter = useCallback((f: Filters) => {
    setFilters({ ...f, sortBy: f.sortBy || 'relevance' });
  }, []);

  const fetchResults = useCallback(async (q: string, f: Filters, p: number) => {
    setLoading(true);
    setHasSearched(true);
    if (q.trim()) addToHistory(q.trim());
    try {
      if (q.trim()) {
        const res = await api.timeline.search(q, p, 24);
        let filtered = res.events || [];
        if (f.eventType) filtered = filtered.filter((e) => e.eventType === f.eventType);
        if (f.status) filtered = filtered.filter((e) => e.status === f.status);
        if (f.visibility) filtered = filtered.filter((e) => e.visibility === f.visibility);
        if (f.dateFrom) filtered = filtered.filter((e) => new Date(e.date || '') >= new Date(f.dateFrom));
        if (f.dateTo) filtered = filtered.filter((e) => new Date(e.date || '') <= new Date(f.dateTo));
        if (f.year) filtered = filtered.filter((e) => new Date(e.date || '').getFullYear() === Number(f.year));
        if (f.participant) {
          const pl = f.participant.toLowerCase();
          filtered = filtered.filter((e) =>
            e.participants?.some((p: { name?: string; member?: { name?: string } }) => (p.name || p.member?.name || '').toLowerCase().includes(pl))
          );
        }
        if (f.location) {
          const ll = f.location.toLowerCase();
          filtered = filtered.filter((e) => (e.location || '').toLowerCase().includes(ll));
        }
        setEvents(filtered);
        setTotal(filtered.length);
      } else {
        const params: Record<string, string | number> = { page: p, limit: 24 };
        if (f.eventType) params.eventType = f.eventType;
        if (f.dateFrom) params.dateFrom = f.dateFrom;
        if (f.dateTo) params.dateTo = f.dateTo;
        const res = await api.timeline.list(params);
        let filtered = res.events || [];
        if (f.status) filtered = filtered.filter((e) => e.status === f.status);
        if (f.visibility) filtered = filtered.filter((e) => e.visibility === f.visibility);
        if (f.year) filtered = filtered.filter((e) => new Date(e.date || '').getFullYear() === Number(f.year));
        if (f.participant) {
          const pl = f.participant.toLowerCase();
          filtered = filtered.filter((e) =>
            e.participants?.some((p: { name?: string; member?: { name?: string } }) => (p.name || p.member?.name || '').toLowerCase().includes(pl))
          );
        }
        if (f.location) {
          const ll = f.location.toLowerCase();
          filtered = filtered.filter((e) => (e.location || '').toLowerCase().includes(ll));
        }
        setEvents(filtered);
        setTotal(res.total || filtered.length);
        setTotalPages(res.totalPages || 1);
      }
    } catch {
      setEvents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [addToHistory]);

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      return;
    }
    setPage(1);
    fetchResults(debouncedQuery, filters, 1);
  }, [debouncedQuery, filters, fetchResults]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (e.key === 'Escape') {
        if (query) {
          setQuery('');
          setShowSuggestions(false);
        }
        inputRef.current?.blur();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortedEvents = useMemo(() => {
    const arr = [...events];
    switch (filters.sortBy) {
      case 'newest':
        return arr.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      case 'oldest':
        return arr.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
      case 'popular':
        return arr.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
      default:
        return arr;
    }
  }, [events, filters.sortBy]);

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setQuery('');
    setHasSearched(false);
    setEvents([]);
    setTotal(0);
    inputRef.current?.focus();
  };

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const chipTypeMap: Record<string, string> = {
    all: '', Life: 'BIRTH', Education: 'EDUCATION', Career: 'CAREER',
    Location: 'MIGRATION', Health: 'MEDICAL', Service: 'MILITARY_SERVICE',
    Achievement: 'AWARD', Cultural: 'RELIGIOUS_EVENT', Document: 'DOCUMENT_ADDED',
    Memory: 'MEMORY_ADDED', Social: 'FAMILY_REUNION', Other: 'CUSTOM_EVENT',
  };

  const showDropdown = showSuggestions && !debouncedQuery;
  const filteredHistory = searchHistory.filter(h =>
    debouncedQuery ? h.toLowerCase().includes(debouncedQuery.toLowerCase()) : true
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <a
        href="#search-results"
        className="skip-link"
      >
        Skip to search results
      </a>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6">
          <h1 className="text-heading-xl text-slate-900 dark:text-white">Timeline Search</h1>
          <p className="mt-1 text-body text-slate-500 dark:text-slate-400">Find any event in your family history instantly</p>
        </header>

        {/* Search Bar */}
        <div className="relative mb-4" ref={suggestionsRef}>
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search events, people, locations..."
              aria-label="Search timeline events"
              aria-expanded={showDropdown}
              aria-controls="search-suggestions"
              aria-autocomplete="list"
              role="combobox"
              className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-28 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
            />
            <div className="absolute right-3 flex items-center gap-2">
              {query && (
                <button
                  onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {!query && (
                <span className="hidden sm:flex items-center gap-1 text-[10px] font-medium text-slate-400 border border-slate-200 rounded-md px-1.5 py-0.5 dark:border-slate-700">
                  <Command className="h-3 w-3" />K
                </span>
              )}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                  showAdvanced || activeFilterCount > 0
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}
                aria-label={`Filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`}
                aria-expanded={showAdvanced}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white" aria-hidden="true">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                id="search-suggestions"
                role="listbox"
                aria-label="Search suggestions"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
              >
                {/* Recent Searches */}
                {filteredHistory.length > 0 && (
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-caption text-slate-400">Recent Searches</span>
                      <button
                        onClick={clearHistory}
                        className="text-[11px] text-slate-400 hover:text-red-500 transition-colors"
                      >
                        Clear all
                      </button>
                    </div>
                    {filteredHistory.slice(0, 5).map((term, i) => (
                      <div
                        key={`${term}-${i}`}
                        role="option"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 group"
                        onClick={() => { setQuery(term); setShowSuggestions(false); }}
                      >
                        <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{term}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFromHistory(term); }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-500 transition-all"
                          aria-label={`Remove "${term}" from history`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Suggestions */}
                <div className="p-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-caption text-slate-400 mb-2 block">Suggested</span>
                  <div className="grid grid-cols-2 gap-1">
                    {SEARCH_SUGGESTIONS.map((s) => (
                      <div
                        key={s.query}
                        role="option"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                        onClick={() => { setQuery(s.query); setShowSuggestions(false); }}
                      >
                        <span className="text-sm">{s.icon}</span>
                        <span className="text-sm text-slate-700 dark:text-slate-300">{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Saved Searches */}
                {savedSearches.length > 0 && (
                  <div className="p-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-caption text-slate-400 mb-2 block">Saved Searches</span>
                    {savedSearches.slice(0, 3).map((entry, i) => (
                      <div
                        key={i}
                        role="option"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 group"
                        onClick={() => applySavedSearch(entry)}
                      >
                        <Bookmark className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{entry.name}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteSavedSearch(i); }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-500 transition-all"
                          aria-label={`Delete saved search "${entry.name}"`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Keyboard Hint */}
                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-[11px] text-slate-400">
                  <span><kbd className="kbd">â†‘â†“</kbd> Navigate</span>
                  <span><kbd className="kbd">Enter</kbd> Select</span>
                  <span><kbd className="kbd">Esc</kbd> Close</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Filter Chips */}
        <nav aria-label="Event category filters" className="mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {FILTER_CHIPS.map((chip) => {
              const isActive = chip.id === 'all'
                ? filters.category === 'all' && !filters.eventType
                : filters.category === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => {
                    if (chip.id === 'all') {
                      updateFilter('category', 'all');
                      updateFilter('eventType', '');
                    } else {
                      updateFilter('category', chip.id);
                      updateFilter('eventType', chipTypeMap[chip.id] || '');
                    }
                  }}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:text-emerald-600 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700 dark:hover:border-emerald-700'
                  }`}
                  aria-pressed={isActive}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Pinned Filters */}
        {pinnedFilters.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Pin className="h-3 w-3 text-emerald-500" />
              <span className="text-caption text-slate-400">Pinned Filters</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {pinnedFilters.map((pf, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                >
                  <button
                    onClick={() => applyPinnedFilter(pf.filters)}
                    className="hover:underline"
                  >
                    {pf.name}
                  </button>
                  <button
                    onClick={() => removePinnedFilter(i)}
                    className="ml-0.5 text-emerald-400 hover:text-red-500 transition-colors"
                    aria-label={`Remove pinned filter ${pf.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advanced Filters */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden mb-4"
            >
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Date From</label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => updateFilter('dateFrom', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Date To</label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => updateFilter('dateTo', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Visibility</label>
                    <select
                      value={filters.visibility}
                      onChange={(e) => updateFilter('visibility', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="">All Visibility</option>
                      {VISIBILITY_OPTIONS.map((v) => (
                        <option key={v.value} value={v.value}>{v.icon} {v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">People</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={filters.participant}
                        onChange={(e) => updateFilter('participant', e.target.value)}
                        placeholder="Search people..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={filters.location}
                        onChange={(e) => updateFilter('location', e.target.value)}
                        placeholder="Search locations..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Year</label>
                    <select
                      value={filters.year}
                      onChange={(e) => updateFilter('year', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="">All Years</option>
                      {YEARS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => updateFilter('status', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="">All Statuses</option>
                      {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Event Type</label>
                    <select
                      value={filters.eventType}
                      onChange={(e) => {
                        updateFilter('eventType', e.target.value);
                        if (e.target.value) updateFilter('category', 'all');
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="">All Types</option>
                      {Object.entries(EVENT_TYPE_CONFIG).map(([key, val]) => (
                        <option key={key} value={key}>{val.icon} {val.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">Family / Clan</label>
                    <select
                      value={filters.familyId}
                      onChange={(e) => updateFilter('familyId', e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="">All Families</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {activeFilterCount > 0 && (
                      <>
                        <button
                          onClick={pinCurrentFilters}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 transition-colors"
                        >
                          <Pin className="h-3.5 w-3.5" />
                          Pin Filters
                        </button>
                        <button
                          onClick={() => setShowSaveDialog(true)}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                        >
                          <BookmarkCheck className="h-3.5 w-3.5" />
                          Save Search
                        </button>
                      </>
                    )}
                  </div>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={resetFilters}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset All Filters
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save Search Dialog */}
        <AnimatePresence>
          {showSaveDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              onClick={() => setShowSaveDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="mx-4 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
              >
                <h3 className="text-heading-md text-slate-900 dark:text-white mb-4">Save Search</h3>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="e.g. Recent births in 2024"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') saveCurrentSearch(); if (e.key === 'Escape') setShowSaveDialog(false); }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white mb-4"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowSaveDialog(false)}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveCurrentSearch}
                    disabled={!saveName.trim()}
                    className="btn-primary disabled:opacity-40"
                  >
                    Save
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Header */}
        {hasSearched && (
          <div className="mb-4 flex items-center justify-between" role="status" aria-live="polite">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Searching...
                </span>
              ) : (
                <>Found <span className="font-bold text-slate-900 dark:text-white">{total}</span> event{total !== 1 ? 's' : ''}</>
              )}
            </p>
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilter('sortBy', e.target.value as Filters['sortBy'])}
                  aria-label="Sort results"
                  className="appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-6 text-xs font-medium text-slate-700 focus:border-emerald-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
                <ArrowUpDown className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
              </div>
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-700" role="radiogroup" aria-label="View mode">
                <button
                  onClick={() => setViewMode('grid')}
                  role="radio"
                  aria-checked={viewMode === 'grid'}
                  aria-label="Grid view"
                  className={`p-1.5 ${viewMode === 'grid' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  role="radio"
                  aria-checked={viewMode === 'list'}
                  aria-label="List view"
                  className={`p-1.5 ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div
            className={viewMode === 'grid'
              ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
              : 'space-y-2'
            }
            aria-label="Loading search results"
            role="progressbar"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty State - No Search */}
        {!hasSearched && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30">
              <Sparkles className="h-10 w-10 text-emerald-500 dark:text-emerald-400" aria-hidden="true" />
            </div>
            <h2 className="text-heading-lg text-slate-900 dark:text-white">Search your family timeline</h2>
            <p className="mt-2 max-w-sm text-body text-slate-500 dark:text-slate-400">
              Type to instantly search across all events, people, and locations in your family history
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {['Birth', 'Marriage', 'Education', 'Travel'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-emerald-300 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                >
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* No Results */}
        {!loading && hasSearched && sortedEvents.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
            role="status"
          >
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800">
              <Search className="h-10 w-10 text-slate-400" aria-hidden="true" />
            </div>
            <h2 className="text-heading-lg text-slate-900 dark:text-white">
              No events found for &lsquo;{query || 'current filters'}&rsquo;
            </h2>
            <p className="mt-2 max-w-sm text-body text-slate-500 dark:text-slate-400">
              Try adjusting your search or filters to find what you&apos;re looking for
            </p>
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={resetFilters}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/25 transition-all hover:bg-emerald-600"
              >
                Clear All Filters
              </button>
              <button
                onClick={() => { setQuery(''); setHasSearched(false); setEvents([]); setTotal(0); inputRef.current?.focus(); }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                Clear Search
              </button>
            </div>
          </motion.div>
        )}

        {/* Results */}
        <section id="search-results" aria-label="Search results" aria-live="polite">
          {!loading && sortedEvents.length > 0 && (
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
              : 'space-y-2'
            }>
              <AnimatePresence mode="popLayout">
                {sortedEvents.map((event, i) =>
                  viewMode === 'grid' ? (
                    <EventCard key={event.id} event={event} index={i} />
                  ) : (
                    <CompactEventCard key={event.id} event={event} index={i} query={debouncedQuery} />
                  )
                )}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Search results pagination">
            <button
              disabled={page <= 1}
              onClick={() => { setPage(p => p - 1); fetchResults(debouncedQuery, filters, page - 1); }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              Previous
            </button>
            <span className="px-3 text-sm font-medium text-slate-500 dark:text-slate-400">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => { setPage(p => p + 1); fetchResults(debouncedQuery, filters, page + 1); }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              Next
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
