'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { NavGroup as NavGroupType } from './nav-config';
import SidebarItem from './sidebar-item';

interface SidebarGroupProps {
  group: NavGroupType;
  expanded: boolean;
  onToggle: (id: string) => void;
  collapsed?: boolean;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
  activeChildHref?: string;
  onClick?: () => void;
}

export default function SidebarGroup({
  group,
  expanded,
  onToggle,
  collapsed = false,
  isFavorite,
  onToggleFavorite,
  activeChildHref,
  onClick,
}: SidebarGroupProps) {
  const Icon = group.icon;
  const hasActiveChild = group.items.some(
    (item) => activeChildHref && (activeChildHref === item.href || activeChildHref.startsWith(item.href + '/')),
  );

  return (
    <div role="none">
      <button
        onClick={() => onToggle(group.id)}
        aria-expanded={expanded}
        aria-controls={`sidebar-group-${group.id}`}
        role="menuitem"
        className={`flex w-full items-center gap-3 rounded-lg py-2 text-sm font-semibold transition-colors duration-150 ${
          collapsed ? 'justify-center px-2' : 'px-3'
        } ${
          hasActiveChild && !expanded
            ? 'text-emerald-700 dark:text-emerald-400'
            : 'text-slate-500 dark:text-slate-400'
        } hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900`}
        title={collapsed ? group.label : undefined}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left truncate">{group.label}</span>
            <motion.div
              animate={{ rotate: expanded ? 90 : 0 }}
              transition={{ duration: 0.15 }}
            >
              <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
            </motion.div>
          </>
        )}
      </button>
      <AnimatePresence initial={false}>
        {expanded && !collapsed && (
          <motion.div
            id={`sidebar-group-${group.id}`}
            role="group"
            aria-label={group.label}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-200 pl-3 dark:border-slate-700">
              {group.items.map((item) => (
                <SidebarItem
                  key={item.id}
                  item={item}
                  collapsed={collapsed}
                  isFavorite={isFavorite(item.id)}
                  onToggleFavorite={onToggleFavorite}
                  onClick={onClick}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
