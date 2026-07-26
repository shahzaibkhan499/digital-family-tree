'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

interface TreeSearchProps {
  onSearch: (query: string) => void;
  results: any[];
  onSelectResult: (node: any) => void;
  totalResults: number;
}

type FilterTab = 'all' | 'MEMBER' | 'FAMILY' | 'CLAN';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'MEMBER', label: 'Members' },
  { key: 'FAMILY', label: 'Families' },
  { key: 'CLAN', label: 'Clans' },
];

const ENTITY_BADGE_COLORS: Record<string, string> = {
  MEMBER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  FAMILY: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  CLAN: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const ENTITY_BADGE_LABELS: Record<string, string> = {
  MEMBER: 'Member',
  FAMILY: 'Family',
  CLAN: 'Clan',
};

export default function TreeSearch({ onSearch, results, onSelectResult, totalResults }: TreeSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const filteredResults = useMemo(() => {
    if (filter === 'all') return results.slice(0, 20);
    return results.filter((r: any) => r.entityType === filter).slice(0, 20);
  }, [results, filter]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [query, filter]);

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearch(value);
        if (value.trim().length > 0) setIsOpen(true);
      }, 250);
    },
    [onSearch]
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || filteredResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const node = filteredResults[selectedIndex];
      if (node) {
        onSelectResult(node);
        setIsOpen(false);
        setQuery('');
      }
    }
  }, [isOpen, filteredResults, selectedIndex, onSelectResult]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const activeCount = filter === 'all' ? totalResults : results.filter((r: any) => r.entityType === filter).length;

  return (
    <div ref={dropdownRef} className="relative w-full max-w-sm">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (query.trim()) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Search members... (Ctrl+K)"
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500 dark:focus:border-emerald-400"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); onSearch(''); setIsOpen(false); setFilter('all'); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-1.5 dark:border-slate-800">
            <div className="flex gap-0.5 rounded-md bg-slate-100 p-0.5 dark:bg-slate-800">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                    filter === tab.key
                      ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-400'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
              {activeCount} result{activeCount !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {filteredResults.length > 0 ? (
              filteredResults.map((node: any, index: number) => {
                const name = node.name || node.displayName || `${node.firstName || ''} ${node.lastName || ''}`.trim() || 'Unknown';
                const dates = [node.birthDate, node.deathDate].filter(Boolean).map((d: string) => {
                  try { return new Date(d).getFullYear().toString(); } catch { return ''; }
                }).join(' \u2013 ');
                const entityType = node.entityType || 'MEMBER';
                const isSelected = index === selectedIndex;

                return (
                  <button
                    key={node.id}
                    onClick={() => {
                      onSelectResult(node);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-900/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{name}</p>
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-semibold uppercase ${ENTITY_BADGE_COLORS[entityType] || ENTITY_BADGE_COLORS.MEMBER}`}>
                          {ENTITY_BADGE_LABELS[entityType] || entityType}
                        </span>
                      </div>
                      {dates && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">{dates}</p>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center">
                <svg className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <p className="text-sm text-slate-500 dark:text-slate-400">No results found</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Try a different search term</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
