'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/admin-api';

interface FamilyOwner {
  id: string;
  name: string;
  email: string;
}

interface FamilyClan {
  id: string;
  name: string;
  slug: string;
}

interface FamilySubClan {
  id: string;
  name: string;
}

interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  gender: string | null;
  birthDate: string | null;
  isAlive: boolean;
}

interface Family {
  id: string;
  displayId: string;
  name: string;
  description: string | null;
  owner: FamilyOwner | null;
  clan: FamilyClan | null;
  subClan: FamilySubClan | null;
  members: FamilyMember[];
  _count: { members: number; relationships: number };
  createdAt: string;
  updatedAt: string;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export default function FamilyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchFamily = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<Family>(`/families/${id}`);
      setFamily(data);
    } catch {
      setError('Failed to load family details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchFamily(); }, [fetchFamily]);

  const handleDelete = async () => {
    if (!family) return;
    if (!confirm(`Permanently delete family "${family.name}"? This cannot be undone.`)) return;
    setActionLoading(true);
    try {
      await adminFetch(`/families/${family.id}`, { method: 'DELETE' });
      router.push('/families');
    } catch {
      setError('Failed to delete family.');
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error && !family) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-foreground">&larr; Back</button>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={fetchFamily} className="mt-2 text-sm font-medium text-primary hover:underline">Retry</button>
        </div>
      </div>
    );
  }

  if (!family) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">&larr;</button>
        <div>
          <h1 className="text-2xl font-bold">{family.name}</h1>
          <p className="text-sm text-muted-foreground font-mono">{family.displayId}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Members</p>
          <p className="mt-2 text-3xl font-bold">{family._count?.members ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Relationships</p>
          <p className="mt-2 text-3xl font-bold">{family._count?.relationships ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Clan</p>
          <p className="mt-2 text-lg font-bold">{family.clan?.name ?? '—'}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">SubClan</p>
          <p className="mt-2 text-lg font-bold">{family.subClan?.name ?? '—'}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Family Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Owner</span><span className="font-medium">{family.owner?.name ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{family.owner?.email ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span className="font-medium">{new Date(family.createdAt).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Updated</span><span className="font-medium">{new Date(family.updatedAt).toLocaleString()}</span></div>
            {family.description && (
              <div className="border-t pt-3 mt-3">
                <p className="text-muted-foreground mb-1">Description</p>
                <p>{family.description}</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Hierarchy</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Community:</span>
              <span className="font-medium">{family.clan ? 'Linked to clan' : '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Clan:</span>
              {family.clan ? (
                <a href={`/clans/${family.clan.id}`} className="font-medium text-primary hover:underline">{family.clan.name}</a>
              ) : (
                <span className="font-medium">—</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">SubClan:</span>
              {family.subClan ? (
                <span className="font-medium">{family.subClan.name}</span>
              ) : (
                <span className="font-medium">—</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
        <h3 className="font-semibold mb-4">Members ({family.members?.length ?? 0})</h3>
        {family.members && family.members.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Gender</th>
                  <th className="px-4 py-2 font-medium">Birth Date</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {family.members.map((member) => (
                  <tr key={member.id} className="border-b border-border/30 last:border-0">
                    <td className="px-4 py-2 font-medium">{member.firstName} {member.lastName}</td>
                    <td className="px-4 py-2 text-muted-foreground">{member.gender || '—'}</td>
                    <td className="px-4 py-2 text-muted-foreground">{member.birthDate || '—'}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${member.isAlive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {member.isAlive ? 'Living' : 'Deceased'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No members</p>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
        <h3 className="font-semibold mb-4">Actions</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDelete}
            disabled={actionLoading}
            className="rounded bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-white disabled:opacity-50"
          >
            Delete Family
          </button>
        </div>
      </div>
    </div>
  );
}
