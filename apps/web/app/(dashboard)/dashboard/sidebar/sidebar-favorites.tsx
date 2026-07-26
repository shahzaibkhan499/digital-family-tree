'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Star } from 'lucide-react';
import SidebarItem from './sidebar-item';
import type { NavItem } from './nav-config';

interface SidebarFavoritesProps {
  favoriteIds: string[];
  items: NavItem[];
  onToggleFavorite: (id: string) => void;
  collapsed?: boolean;
  onClick?: () => void;
}

export default function SidebarFavorites({
  favoriteIds,
  items,
  onToggleFavorite,
  collapsed = false,
  onClick,
}: SidebarFavoritesProps) {
  if (favoriteIds.length === 0) return null;

  const favoriteItems = items.filter((item) => favoriteIds.includes(item.id));

  return (
    <div role="group" aria-label="Favorites">
      {!collapsed && (
        <div className="flex items-center gap-2 px-3 py-1.5">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Favorites
          </span>
        </div>
      )}
      {collapsed && <div className="my-1 border-t border-slate-200 dark:border-slate-700" />}
      <div className="space-y-0.5">
        <AnimatePresence>
          {favoriteItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
            >
              <SidebarItem
                item={item}
                collapsed={collapsed}
                isFavorite={true}
                onToggleFavorite={onToggleFavorite}
                onClick={onClick}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
