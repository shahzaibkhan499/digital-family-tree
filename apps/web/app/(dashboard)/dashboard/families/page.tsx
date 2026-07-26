'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';

const PAGE_SIZE = 10;

export default function FamiliesPage() {
  const [families, setFamilies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.families.list().then(setFamilies).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return families;
    const q = search.toLowerCase();
    return families.filter(
      (f) => f.name.toLowerCase().includes(q) || (f.description && f.description.toLowerCase().includes(q))
    );
  }, [families, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this family? This action cannot be undone.')) return;
    setDeleting(id);
    try {
      await api.families.delete(id);
      setFamilies((prev) => prev.filter((f) => f.id !== id));
    } catch {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete family');
      }
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Families</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Manage your family trees</p>
        </div>
        <Link
          href="/dashboard/families/new"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + New Family
        </Link>
      </div>

      {!loading && families.length > 0 && (
        <div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search families..."
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      ) : families.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-slate-900 dark:text-white">No families yet</p>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Create your first family tree to start building your heritage.
          </p>
          <Link
            href="/dashboard/families/new"
            className="mt-4 inline-block rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Create Family
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-lg font-medium text-slate-900 dark:text-white">No families match &ldquo;{search}&rdquo;</p>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Try a different search term.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginated.map((family) => (
              <div
                key={family.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <Link href={`/dashboard/families/${family.id}`} className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-slate-900 hover:text-emerald-600 dark:text-white">
                    {family.name}
                  </h3>
                  {family.description && (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {family.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    {family._count?.members || 0} members Â· Created {new Date(family.createdAt).toLocaleDateString()}
                  </p>
                </Link>
                <div className="flex gap-2 ml-4">
                  <Link
                    href={`/dashboard/families/${family.id}`}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(family.id)}
                    disabled={deleting === family.id}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    {deleting === family.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
