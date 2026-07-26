'use client';

import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { EVENT_TYPE_CONFIG } from './constants';

interface TimelineFilterChipsProps {
  selectedTypes: string[];
  onToggleType: (type: string) => void;
  onClearAll: () => void;
  eventCounts?: Record<string, number>;
}

export default function TimelineFilterChips({ selectedTypes, onToggleType, onClearAll, eventCounts }: TimelineFilterChipsProps) {
  const hasActive = selectedTypes.length > 0;

  return (
    <div className="relative">
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
        <motion.button
          layout
          onClick={() => {
            if (selectedTypes.length > 0) onClearAll();
          }}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
            !hasActive
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
              : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600'
          }`}
        >
          All
        </motion.button>

        {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => {
          const active = selectedTypes.includes(key);
          const count = eventCounts?.[key];

          return (
            <motion.button
              key={key}
              layout
              onClick={() => onToggleType(key)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                active
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'border border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <span className="text-[11px] leading-none">{cfg.icon}</span>
              <span>{cfg.label}</span>
              {count !== undefined && count > 0 && (
                <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                }`}>
                  {count}
                </span>
              )}
            </motion.button>
          );
        })}

        {hasActive && (
          <motion.button
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={onClearAll}
            className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-red-300 hover:text-red-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-500 dark:hover:border-red-500/50 dark:hover:text-red-400"
          >
            <X className="h-3 w-3" />
            Clear
          </motion.button>
        )}
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
