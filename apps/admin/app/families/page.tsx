'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/admin-api';

interface Family {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  owner: { id: string; name: string; email: string };
  _count: { members: number };
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export default function FamiliesPage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadFamilies = useCallback(async (pageNum: number, searchQuery: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ families: Family[]; page: number; totalPages: number; total: number }>(
        `/families/all?page=${pageNum}&limit=10&search=${encodeURIComponent(searchQuery)}`
      );
      setFamilies(data.families || []);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      setError('Failed to load families. Is the API running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFamilies(1, ''); }, [loadFamilies]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadFamilies(1, search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, loadFamilies]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Family Management</h1>
        <p className="text-muted-foreground">Manage all family trees ({total} total)</p>
      </div>

      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search by name or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm flex-1 rounded-lg border border-border/60 bg-card px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="rounded-xl border border-border/60 bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Description</th>
                  <th className="px-6 py-3 font-medium">Owner</th>
                  <th className="px-6 py-3 font-medium">Members</th>
                  <th className="px-6 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {families.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No families found
                    </td>
                  </tr>
                ) : (
                  families.map((f) => (
                    <tr key={f.id} className="border-b border-border/30 last:border-0">
                      <td className="px-6 py-3 font-medium">
                        <a href={`/families/${f.id}`} className="text-primary hover:underline">{f.name}</a>
                      </td>
                      <td className="max-w-[200px] truncate px-6 py-3 text-muted-foreground">
                        {f.description || '-'}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">{f.owner?.name ?? 'Unknown'}</td>
                      <td className="px-6 py-3">{f._count.members}</td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {new Date(f.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/60 px-6 py-3">
              <span className="text-xs text-muted-foreground">Page {page} of {totalPages} ({total} families)</span>
              <div className="flex gap-2">
                <button onClick={() => loadFamilies(page - 1, search)} disabled={page <= 1} className="rounded border border-border/60 px-3 py-1 text-xs font-medium disabled:opacity-50">Prev</button>
                <button onClick={() => loadFamilies(page + 1, search)} disabled={page >= totalPages} className="rounded border border-border/60 px-3 py-1 text-xs font-medium disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
