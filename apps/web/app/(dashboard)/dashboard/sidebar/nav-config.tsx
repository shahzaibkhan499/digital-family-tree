'use client';

import {
  Home,
  Users,
  GitBranch,
  Clock,
  BookOpen,
  Globe,
  Layers,
  Compass,
  Search,
  Copy,
  FileText,
  Archive,
  Image,
  BookMarked,
  Bell,
  User,
  Settings,
  Star,
  History,
  Plus,
  BarChart3,
  Bookmark,
  Calendar,
  Layout,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Roles that can see this item. Empty = everyone. */
  roles?: string[];
  /** Additional roles that can access this item (OR logic with `roles`). */
  orRoles?: string[];
}

export interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Items that appear in this group when expanded. */
  items: NavItem[];
}

export type NavEntry = { type: 'item'; item: NavItem } | { type: 'group'; group: NavGroup };

export const NAV_CONFIG: NavEntry[] = [
  {
    type: 'item',
    item: {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
  },
  {
    type: 'group',
    group: {
      id: 'family',
      label: 'Family',
      icon: Users,
      items: [
        { id: 'families', label: 'My Families', href: '/dashboard/families', icon: Users },
        { id: 'tree', label: 'Family Tree', href: '/dashboard/tree', icon: GitBranch },
        { id: 'memories', label: 'Memories', href: '/dashboard/memories', icon: BookOpen },
      ],
    },
  },
  {
    type: 'group',
    group: {
      id: 'timeline',
      label: 'Timeline',
      icon: Clock,
      items: [
        { id: 'timeline-all', label: 'Timeline', href: '/dashboard/timeline', icon: Clock },
        { id: 'timeline-new', label: 'Create Event', href: '/dashboard/timeline/new', icon: Plus },
        {
          id: 'timeline-search',
          label: 'Search',
          href: '/dashboard/timeline/search',
          icon: Search,
        },
        {
          id: 'timeline-drafts',
          label: 'Drafts',
          href: '/dashboard/timeline/drafts',
          icon: FileText,
        },
        {
          id: 'timeline-analytics',
          label: 'Analytics',
          href: '/dashboard/timeline/analytics',
          icon: BarChart3,
        },
        {
          id: 'timeline-bookmarks',
          label: 'Bookmarks',
          href: '/dashboard/timeline/bookmarks',
          icon: Bookmark,
        },
        {
          id: 'timeline-calendar',
          label: 'Calendar',
          href: '/dashboard/timeline/calendar',
          icon: Calendar,
        },
        {
          id: 'timeline-templates',
          label: 'Templates',
          href: '/dashboard/timeline/templates',
          icon: Layout,
        },
        {
          id: 'timeline-settings',
          label: 'Settings',
          href: '/dashboard/timeline/settings',
          icon: Settings,
        },
      ],
    },
  },
  {
    type: 'group',
    group: {
      id: 'community',
      label: 'Community',
      icon: Globe,
      items: [
        { id: 'communities', label: 'Communities', href: '/dashboard/communities', icon: Globe },
        { id: 'clans', label: 'Clans', href: '/dashboard/clans', icon: Layers },
        { id: 'subclans', label: 'Sub Clans', href: '/dashboard/subclans/new', icon: Layers },
        { id: 'discover', label: 'Discover', href: '/dashboard/discover', icon: Compass },
      ],
    },
  },
  {
    type: 'group',
    group: {
      id: 'heritage',
      label: 'Heritage',
      icon: BookMarked,
      items: [
        { id: 'documents', label: 'Document Vault', href: '/dashboard/documents', icon: FileText },
        { id: 'collections', label: 'Collections', href: '/dashboard/collections', icon: Archive },
        { id: 'gallery', label: 'Gallery', href: '/dashboard/gallery', icon: Image },
        {
          id: 'knowledge-base',
          label: 'Knowledge Base',
          href: '/dashboard/knowledge-base',
          icon: BookMarked,
        },
        {
          id: 'document-timeline',
          label: 'Document Timeline',
          href: '/dashboard/documents/timeline',
          icon: Clock,
        },
      ],
    },
  },
  {
    type: 'group',
    group: {
      id: 'management',
      label: 'Management',
      icon: Search,
      items: [
        {
          id: 'duplicates',
          label: 'Duplicates',
          href: '/dashboard/duplicates',
          icon: Copy,
          roles: ['ADMIN', 'CLAN_ADMIN'],
        },
        {
          id: 'merge-history',
          label: 'Merge History',
          href: '/dashboard/merge/history',
          icon: History,
          roles: ['ADMIN', 'CLAN_ADMIN'],
        },
        {
          id: 'notifications',
          label: 'Notifications',
          href: '/dashboard/notifications',
          icon: Bell,
        },
      ],
    },
  },
  {
    type: 'group',
    group: {
      id: 'account',
      label: 'Account',
      icon: User,
      items: [
        { id: 'profile', label: 'Profile', href: '/dashboard/profile', icon: User },
        { id: 'settings', label: 'Settings', href: '/dashboard/settings', icon: Settings },
      ],
    },
  },
];

function roleMatch(
  itemRoles: string[] | undefined,
  orRoles: string[] | undefined,
  userRole: string,
): boolean {
  if (itemRoles && itemRoles.includes(userRole)) return true;
  if (orRoles && orRoles.includes(userRole)) return true;
  return false;
}

export function filterByRole(entries: NavEntry[], userRole?: string): NavEntry[] {
  if (!userRole) {
    return entries
      .map((entry) => {
        if (entry.type === 'item') {
          if (entry.item.roles && entry.item.roles.length > 0) return null;
          if (entry.item.orRoles && entry.item.orRoles.length > 0) return null;
          return entry;
        }
        const filteredItems = entry.group.items.filter(
          (item) =>
            (!item.roles || item.roles.length === 0) &&
            (!item.orRoles || item.orRoles.length === 0),
        );
        if (filteredItems.length === 0) return null;
        return { ...entry, group: { ...entry.group, items: filteredItems } };
      })
      .filter(Boolean) as NavEntry[];
  }

  return entries
    .map((entry) => {
      if (entry.type === 'item') {
        if (entry.item.roles || entry.item.orRoles) {
          if (!roleMatch(entry.item.roles, entry.item.orRoles, userRole)) return null;
        }
        return entry;
      }
      const filteredItems = entry.group.items.filter((item) => {
        if (!item.roles && !item.orRoles) return true;
        return roleMatch(item.roles, item.orRoles, userRole);
      });
      if (filteredItems.length === 0) return null;
      return { ...entry, group: { ...entry.group, items: filteredItems } };
    })
    .filter(Boolean) as NavEntry[];
}

export function findItemByHref(href: string): NavItem | undefined {
  for (const entry of NAV_CONFIG) {
    if (entry.type === 'item' && entry.item.href === href) return entry.item;
    if (entry.type === 'group') {
      const found = entry.group.items.find((item) => item.href === href);
      if (found) return found;
    }
  }
  return undefined;
}

export function searchNav(entries: NavEntry[], query: string): NavEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return entries;

  return entries
    .map((entry) => {
      if (entry.type === 'item') {
        if (entry.item.label.toLowerCase().includes(q)) return entry;
        return null;
      }
      const matchedItems = entry.group.items.filter((item) => item.label.toLowerCase().includes(q));
      if (matchedItems.length === 0) return null;
      return { ...entry, group: { ...entry.group, items: matchedItems } };
    })
    .filter(Boolean) as NavEntry[];
}
