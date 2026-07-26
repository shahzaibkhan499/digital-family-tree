'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/admin-api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { families: number };
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const loadUsers = useCallback(async (pageNum: number, searchQuery: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<{ users: User[]; page: number; totalPages: number; total: number }>(
        `/users?page=${pageNum}&limit=10&search=${encodeURIComponent(searchQuery)}`
      );
      setUsers(data.users || []);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      setError('Failed to load users. Is the API running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(1, ''); }, [loadUsers]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadUsers(1, search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, loadUsers]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage all registered users ({total} total)</p>
      </div>

      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search by name or email..."
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
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Families</th>
                  <th className="px-6 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-border/30 last:border-0">
                      <td className="px-6 py-3 font-medium">
                        <a href={`/users/${u.id}`} className="text-primary hover:underline">{u.name}</a>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.role === 'ADMIN' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-3">{u._count.families}</td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/60 px-6 py-3">
              <span className="text-xs text-muted-foreground">Page {page} of {totalPages} ({total} users)</span>
              <div className="flex gap-2">
                <button onClick={() => loadUsers(page - 1, search)} disabled={page <= 1} className="rounded border border-border/60 px-3 py-1 text-xs font-medium disabled:opacity-50">Prev</button>
                <button onClick={() => loadUsers(page + 1, search)} disabled={page >= totalPages} className="rounded border border-border/60 px-3 py-1 text-xs font-medium disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
