'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/admin-api';

interface UserFamily {
  id: string;
  name: string;
  _count?: { members: number };
}

interface LoginSession {
  id: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  lastActiveAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatarUrl: string | null;
  families: UserFamily[];
  sessions: LoginSession[];
  _count: { families: number; memberships: number };
  createdAt: string;
  updatedAt: string;
}

const ROLE_OPTIONS = ['USER', 'ADMIN'];
const STATUS_OPTIONS = ['ACTIVE', 'SUSPENDED', 'INACTIVE'];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  SUSPENDED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<User>(`/users/${id}`);
      setUser(data);
    } catch {
      setError('Failed to load user details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const handleRoleChange = async (newRole: string) => {
    if (!user) return;
    setActionLoading(true);
    try {
      await adminFetch(`/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      setUser((prev) => prev ? { ...prev, role: newRole } : null);
    } catch {
      setError('Failed to update role.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!user) return;
    setActionLoading(true);
    try {
      await adminFetch(`/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setUser((prev) => prev ? { ...prev, status: newStatus } : null);
    } catch {
      setError('Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (!confirm(`Permanently delete user "${user.name}"? This cannot be undone.`)) return;
    setActionLoading(true);
    try {
      await adminFetch(`/users/${user.id}`, { method: 'DELETE' });
      router.push('/users');
    } catch {
      setError('Failed to delete user.');
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error && !user) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-foreground">&larr; Back</button>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={fetchUser} className="mt-2 text-sm font-medium text-primary hover:underline">Retry</button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">&larr;</button>
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Role</p>
          <p className="mt-2">
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${user.role === 'ADMIN' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'}`}>{user.role}</span>
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Status</p>
          <p className="mt-2">
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[user.status] || 'bg-gray-100 text-gray-800'}`}>{user.status}</span>
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Families</p>
          <p className="mt-2 text-3xl font-bold">{user._count?.families ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Memberships</p>
          <p className="mt-2 text-3xl font-bold">{user._count?.memberships ?? 0}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
        <h3 className="font-semibold mb-4">User Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{user.name}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{user.email}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Joined</span><span className="font-medium">{new Date(user.createdAt).toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Last Updated</span><span className="font-medium">{new Date(user.updatedAt).toLocaleString()}</span></div>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
        <h3 className="font-semibold mb-4">Families ({user.families?.length ?? 0})</h3>
        {user.families && user.families.length > 0 ? (
          <div className="space-y-2">
            {user.families.map((fam) => (
              <div key={fam.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm">
                <a href={`/families/${fam.id}`} className="font-medium text-primary hover:underline">{fam.name}</a>
                <span className="text-muted-foreground text-xs">{fam._count?.members ?? 0} members</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No families</p>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
        <h3 className="font-semibold mb-4">Login Sessions ({user.sessions?.length ?? 0})</h3>
        {user.sessions && user.sessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-muted-foreground">
                  <th className="px-4 py-2 font-medium">IP</th>
                  <th className="px-4 py-2 font-medium">Device</th>
                  <th className="px-4 py-2 font-medium">Created</th>
                  <th className="px-4 py-2 font-medium">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {user.sessions.map((session) => (
                  <tr key={session.id} className="border-b border-border/30 last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">{session.ip}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground max-w-[200px] truncate">{session.userAgent}</td>
                    <td className="px-4 py-2 text-muted-foreground">{new Date(session.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2 text-muted-foreground">{new Date(session.lastActiveAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No login sessions</p>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
        <h3 className="font-semibold mb-4">Actions</h3>
        <div className="flex flex-wrap gap-2">
          <select
            value={user.role}
            onChange={(e) => handleRoleChange(e.target.value)}
            disabled={actionLoading}
            className="rounded border border-border/60 bg-background px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            value={user.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={actionLoading}
            className="rounded border border-border/60 bg-background px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={handleDelete}
            disabled={actionLoading}
            className="rounded bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-white disabled:opacity-50"
          >
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
}
