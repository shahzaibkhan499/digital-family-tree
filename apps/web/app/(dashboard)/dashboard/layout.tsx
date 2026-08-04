'use client';

import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeft, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import NotificationBell from './components/notification-bell';
import {
  NAV_CONFIG,
  filterByRole,
  searchNav,
  type NavEntry,
  type NavItem,
} from './sidebar/nav-config';
import {
  useCollapsibleGroups,
  useFavorites,
  useRecentlyVisited,
  useSidebarCollapsed,
  useSidebarSearch,
  useMediaQuery,
} from './sidebar/hooks';
import SidebarSearch from './sidebar/sidebar-search';
import SidebarFavorites from './sidebar/sidebar-favorites';
import SidebarRecent from './sidebar/sidebar-recent';
import SidebarGroup from './sidebar/sidebar-group';
import SidebarItem from './sidebar/sidebar-item';
import { SidebarContext } from './sidebar-context';

function collectAllItems(entries: NavEntry[]): NavItem[] {
  const items: NavItem[] = [];
  for (const entry of entries) {
    if (entry.type === 'item') items.push(entry.item);
    else items.push(...entry.group.items);
  }
  return items;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isMobile = useMediaQuery('(max-width: 767px)');

  const { collapsed: sidebarCollapsed, toggle: toggleSidebarCollapse } = useSidebarCollapsed();
  const [mobileOpen, setMobileOpen] = useState(false);

  const collapsed = isDesktop ? sidebarCollapsed : false;

  const roleEntries = useMemo(() => filterByRole(NAV_CONFIG, user?.role), [user?.role]);
  const allNavItems = useMemo(() => collectAllItems(roleEntries), [roleEntries]);

  const defaultExpanded = useMemo(() => {
    const groups: string[] = [];
    for (const entry of roleEntries) {
      if (entry.type === 'group') {
        const hasActive = entry.group.items.some(
          (item) => pathname === item.href || pathname.startsWith(item.href + '/'),
        );
        if (hasActive) groups.push(entry.group.id);
      }
    }
    return groups;
  }, [roleEntries, pathname]);

  const { isExpanded, toggle, expand } = useCollapsibleGroups(defaultExpanded);

  useEffect(() => {
    for (const entry of roleEntries) {
      if (entry.type === 'group') {
        const hasActive = entry.group.items.some(
          (item) => pathname === item.href || pathname.startsWith(item.href + '/'),
        );
        if (hasActive) expand(entry.group.id);
      }
    }
  }, [pathname, roleEntries, expand]);

  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { recent, trackVisit } = useRecentlyVisited();
  const { query, setQuery } = useSidebarSearch();

  const filteredEntries = useMemo(() => searchNav(roleEntries, query), [roleEntries, query]);

  const handleNavClick = useCallback(
    (item: NavItem) => {
      trackVisit(item);
      setMobileOpen(false);
      setQuery('');
    },
    [trackVisit, setQuery],
  );

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="hidden w-64 shrink-0 border-r border-slate-200 p-4 lg:block dark:border-slate-800">
          <div className="space-y-4">
            <Skeleton variant="rounded" width="100%" height={32} />
            <div className="space-y-2 pt-4">
              <Skeleton variant="text" width="60%" height={14} count={1} />
              <Skeleton variant="text" width="80%" height={12} count={4} />
            </div>
            <div className="space-y-2 pt-4">
              <Skeleton variant="text" width="50%" height={14} count={1} />
              <Skeleton variant="text" width="75%" height={12} count={3} />
            </div>
            <div className="space-y-2 pt-4">
              <Skeleton variant="text" width="45%" height={14} count={1} />
              <Skeleton variant="text" width="70%" height={12} count={3} />
            </div>
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="flex items-center justify-between">
            <Skeleton variant="text" width={200} height={28} />
            <Skeleton variant="rounded" width={36} height={36} />
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const sidebarWidthClass = collapsed ? 'w-[68px]' : 'w-64';

  const sidebarContent = (
    <div
      className={`flex h-full flex-col bg-white dark:bg-slate-900 ${sidebarWidthClass} transition-[width] duration-200`}
    >
      {/* HEADER - fixed */}
      <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-4 dark:border-slate-800">
        {(!collapsed || isMobile) && (
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
              D
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white truncate">
              Family Tree
            </span>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="mx-auto" aria-label="Dashboard">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
              D
            </div>
          </Link>
        )}
        {!isMobile && (
          <button
            onClick={toggleSidebarCollapse}
            className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft
              className={`h-4 w-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
            />
          </button>
        )}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* SCROLLABLE NAV AREA */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 scrollbar-none"
        role="menu"
        aria-label="Main navigation"
      >
        <SidebarSearch query={query} onQueryChange={setQuery} collapsed={collapsed} />

        <SidebarFavorites
          favoriteIds={favorites}
          items={allNavItems}
          onToggleFavorite={toggleFavorite}
          collapsed={collapsed}
          onClick={() => {
            if (isMobile) setMobileOpen(false);
          }}
        />

        {favorites.length > 0 && query.length === 0 && (
          <div className="my-2 border-t border-slate-200 dark:border-slate-700" />
        )}

        {query.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {filteredEntries.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-slate-400 dark:text-slate-500">
                No results found
              </p>
            )}
            {filteredEntries.map((entry) => {
              if (entry.type === 'item') {
                return (
                  <SidebarItem
                    key={entry.item.id}
                    item={entry.item}
                    collapsed={collapsed}
                    isFavorite={isFavorite(entry.item.id)}
                    onToggleFavorite={toggleFavorite}
                    onClick={() => handleNavClick(entry.item)}
                  />
                );
              }
              return (
                <SidebarGroup
                  key={entry.group.id}
                  group={entry.group}
                  expanded={true}
                  onToggle={() => {}}
                  collapsed={collapsed}
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                  activeChildHref={pathname}
                  onClick={() => {
                    if (isMobile) setMobileOpen(false);
                  }}
                />
              );
            })}
          </div>
        )}

        {query.length === 0 && (
          <>
            {filteredEntries.map((entry) => {
              if (entry.type === 'item') {
                return (
                  <SidebarItem
                    key={entry.item.id}
                    item={entry.item}
                    collapsed={collapsed}
                    isFavorite={isFavorite(entry.item.id)}
                    onToggleFavorite={toggleFavorite}
                    onClick={() => handleNavClick(entry.item)}
                  />
                );
              }
              return (
                <SidebarGroup
                  key={entry.group.id}
                  group={entry.group}
                  expanded={isExpanded(entry.group.id)}
                  onToggle={toggle}
                  collapsed={collapsed}
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                  activeChildHref={pathname}
                  onClick={() => {
                    if (isMobile) setMobileOpen(false);
                  }}
                />
              );
            })}
          </>
        )}

        {query.length === 0 && recent.length > 0 && (
          <>
            <div className="my-2 border-t border-slate-200 dark:border-slate-700" />
            <SidebarRecent
              recent={recent}
              collapsed={collapsed}
              onClick={() => {
                if (isMobile) setMobileOpen(false);
              }}
            />
          </>
        )}
      </nav>

      {/* USER FOOTER - fixed */}
      <div className="shrink-0 border-t border-slate-200 p-3 dark:border-slate-800">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <Link
            href="/dashboard/profile"
            className="group flex items-center gap-3 min-w-0"
            aria-label="View profile"
          >
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400">
                    {user?.displayName || user?.name}
                  </p>
                  {user?.emailVerified && (
                    <svg
                      className="h-3.5 w-3.5 shrink-0 text-emerald-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
              </div>
            )}
          </Link>
          {!collapsed && (
            <button
              onClick={logout}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              title="Sign out"
              aria-label="Sign out"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <SidebarContext.Provider value={{ collapsed, toggleCollapse: toggleSidebarCollapse }}>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Desktop/Tablet sidebar */}
        {!isMobile && (
          <aside
            className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-slate-200 dark:border-slate-800 ${sidebarWidthClass} transition-[width] duration-200`}
            aria-label="Sidebar navigation"
          >
            {sidebarContent}
          </aside>
        )}

        {/* Mobile hamburger */}
        {isMobile && !mobileOpen && (
          <button
            onClick={() => setMobileOpen(true)}
            className="fixed left-4 top-4 z-50 rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Mobile overlay + drawer */}
        {isMobile && (
          <AnimatePresence>
            {mobileOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-40 bg-black/50"
                  onClick={() => setMobileOpen(false)}
                  aria-hidden="true"
                />
                <motion.aside
                  initial={{ x: -280 }}
                  animate={{ x: 0 }}
                  exit={{ x: -280 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 dark:border-slate-800"
                  aria-label="Sidebar navigation"
                >
                  {sidebarContent}
                </motion.aside>
              </>
            )}
          </AnimatePresence>
        )}

        {/* Main content */}
        <main
          className="flex-1 min-w-0"
          style={{
            marginLeft: isMobile ? 0 : collapsed ? 68 : 256,
            transition: 'margin-left 0.2s ease',
          }}
        >
          <div className="sticky top-0 z-20 flex h-16 items-center justify-end border-b border-slate-200 bg-white/80 px-6 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            <NotificationBell />
          </div>
          <ErrorBoundary>
            <div className="p-4 sm:p-6 lg:p-8">{children}</div>
          </ErrorBoundary>
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
