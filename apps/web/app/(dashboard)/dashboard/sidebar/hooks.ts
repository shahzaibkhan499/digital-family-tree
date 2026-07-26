'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { NavItem } from './nav-config';

const STORAGE_KEYS = {
  collapsedGroups: 'sidebar-collapsed-groups',
  favorites: 'sidebar-favorites',
  recent: 'sidebar-recent',
  collapsed: 'sidebar-collapsed',
} as const;

const MAX_RECENT = 5;

function safeGetJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSetJSON(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* empty */ }
}

export function useCollapsibleGroups(defaultOpenGroupIds: string[]) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => {
    const stored = safeGetJSON<string[]>(STORAGE_KEYS.collapsedGroups, []);
    const collapsed = new Set(defaultOpenGroupIds);
    stored.forEach((id) => {
      if (defaultOpenGroupIds.includes(id)) {
        collapsed.delete(id);
      } else {
        collapsed.add(id);
      }
    });
    return collapsed;
  });

  const toggle = useCallback((groupId: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    safeSetJSON(STORAGE_KEYS.collapsedGroups, Array.from(collapsedIds));
  }, [collapsedIds]);

  const isExpanded = useCallback((groupId: string) => !collapsedIds.has(groupId), [collapsedIds]);

  const expand = useCallback((groupId: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      next.delete(groupId);
      return next;
    });
  }, []);

  return { isExpanded, toggle, expand } as const;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() =>
    safeGetJSON<string[]>(STORAGE_KEYS.favorites, []),
  );

  const toggleFavorite = useCallback((itemId: string) => {
    setFavorites((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      }
      return [...prev, itemId];
    });
  }, []);

  const isFavorite = useCallback((itemId: string) => favorites.includes(itemId), [favorites]);

  useEffect(() => {
    safeSetJSON(STORAGE_KEYS.favorites, favorites);
  }, [favorites]);

  return { favorites, toggleFavorite, isFavorite } as const;
}

export function useRecentlyVisited() {
  const [recent, setRecent] = useState<Array<{ id: string; label: string; href: string; icon: string }>>(() =>
    safeGetJSON(STORAGE_KEYS.recent, []),
  );

  const pathname = usePathname();

  const trackVisit = useCallback((item: NavItem) => {
    setRecent((prev) => {
      const filtered = prev.filter((r) => r.href !== item.href);
      const next = [
        { id: item.id, label: item.label, href: item.href, icon: item.icon.displayName || item.id },
        ...filtered,
      ].slice(0, MAX_RECENT);
      return next;
    });
  }, []);

  useEffect(() => {
    safeSetJSON(STORAGE_KEYS.recent, recent);
  }, [recent]);

  return { recent, trackVisit } as const;
}

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(() =>
    safeGetJSON<boolean>(STORAGE_KEYS.collapsed, false),
  );

  const toggle = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  useEffect(() => {
    safeSetJSON(STORAGE_KEYS.collapsed, collapsed);
  }, [collapsed]);

  return { collapsed, toggle } as const;
}

export function useSidebarSearch() {
  const [query, setQuery] = useState('');
  return { query, setQuery } as const;
}

export { useMediaQuery } from '@/hooks/use-media-query';
