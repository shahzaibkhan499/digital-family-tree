'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Calendar, Users, Bell, TreePine, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export default function DashboardHeader({ stats, unreadCount, loading }: { stats: any; unreadCount: number; loading: boolean }) {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res: any = await api.search.global(q, { limit: 6 });
      const results = [
        ...(res.users || []).map((u: any) => ({ name: u.displayName || u.name, type: 'Member', url: `/u/${u.displayId || u.id}` })),
        ...(res.families || []).map((f: any) => ({ name: f.name, type: 'Family', url: `/dashboard/families/${f.id}` })),
        ...(res.members || []).map((m: any) => ({ name: `${m.firstName} ${m.lastName}`, type: 'Member', url: `/u/${m.displayId || m.id}` })),
      ];
      setSearchResults(results.slice(0, 6));
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => handleSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, handleSearch]);

  const statItems = [
    { label: 'Families', value: stats?.totalFamilies ?? 0, icon: <Users className="h-4 w-4" />, color: 'text-emerald-600', href: '/dashboard/families' },
    { label: 'Members', value: stats?.totalMembers ?? 0, icon: <TreePine className="h-4 w-4" />, color: 'text-blue-600', href: '/dashboard/tree' },
    { label: 'Events', value: stats?.upcomingEvents ?? 0, icon: <Calendar className="h-4 w-4" />, color: 'text-amber-600', href: '/dashboard/timeline' },
    { label: 'Unread', value: unreadCount, icon: <Bell className="h-4 w-4" />, color: 'text-rose-600', href: '/dashboard/notifications' },
  ];

  return (
    <div className="relative">
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold sm:text-3xl"
            >
              {getGreeting()}, {user?.displayName || user?.name?.split(' ')[0] || 'there'}
            </motion.h1>
            <p className="mt-1 text-sm text-emerald-100">{formatDate()}</p>
          </div>

          <div className="relative w-full max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
                onFocus={() => setShowSearch(true)}
                placeholder="Search families, members, clans..."
                className="w-full rounded-xl border border-emerald-500/30 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white placeholder-emerald-200 backdrop-blur-sm transition-colors focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSearchResults([]); setShowSearch(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-300 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {showSearch && searchQuery.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full z-50 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
              >
                {searching ? (
                  <div className="p-4 text-center text-sm text-slate-500">Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500">No results found</div>
                ) : (
                  <div className="max-h-80 overflow-y-auto p-2">
                    {searchResults.map((r: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (r.url) router.push(r.url);
                          else if (r.href) router.push(r.href);
                          setShowSearch(false);
                          setSearchQuery('');
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">
                          <Search className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900 dark:text-white">{r.name || r.title || r.displayName || 'Result'}</p>
                          <p className="truncate text-xs text-slate-500">{r.type || r.entityType || ''}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statItems.map((s) => (
            <Link key={s.label} href={s.href} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm transition-colors hover:bg-white/20">
              <span className={s.color + ' opacity-80'}>{s.icon}</span>
              <div>
                <p className="text-lg font-bold">{loading ? '...' : s.value}</p>
                <p className="text-xs text-emerald-100">{s.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {showSearch && searchQuery.length >= 2 && (
        <div className="fixed inset-0 z-40" onClick={() => setShowSearch(false)} />
      )}
    </div>
  );
}
