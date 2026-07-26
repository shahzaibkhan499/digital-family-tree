'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'dft-admin-secret-key-2024';

async function adminFetch(endpoint: string) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'X-Admin-Key': ADMIN_KEY },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

export default function AdminTreePage() {
  const [health, setHealth] = useState<any>(null);
  const [perf, setPerf] = useState<any>(null);
  const [families, setFamilies] = useState<any[]>([]);
  const [clans, setClans] = useState<any[]>([]);
  const [diagEntityType, setDiagEntityType] = useState('FAMILY');
  const [diagEntityId, setDiagEntityId] = useState('');
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [diagLoading, setDiagLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'diagnostics' | 'analytics'>('overview');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [healthData, perfData] = await Promise.all([
          adminFetch('/tree/health'),
          adminFetch('/tree/performance'),
        ]);
        setHealth(healthData);
        setPerf(perfData);
        try {
          const famRes = await adminFetch('/families');
          setFamilies(Array.isArray(famRes) ? famRes : []);
        } catch { setFamilies([]); }
        try {
          const clanRes = await adminFetch('/clans');
          const raw = Array.isArray(clanRes) ? clanRes : (clanRes?.clans || []);
          setClans(raw);
        } catch { setClans([]); }
      } catch (err: any) {
        setError(err?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDiagnose = async () => {
    if (!diagEntityId.trim()) return;
    setDiagLoading(true);
    try {
      const result = await adminFetch(`/tree/diagnostics/${diagEntityType}/${diagEntityId}`);
      setDiagnostics(result);
    } catch (err: any) {
      setDiagnostics({ error: err?.message || 'Diagnosis failed' });
    } finally {
      setDiagLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading tree diagnostics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tree Diagnostics & Health</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Monitor tree engine health, run diagnostics, and view analytics</p>
        </div>
      </div>

      <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800 w-fit">
        {(['overview', 'diagnostics', 'analytics'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-400' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}>
            {tab === 'overview' ? 'Health Overview' : tab === 'diagnostics' ? 'Diagnostics' : 'Analytics'}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {activeTab === 'overview' && health && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: 'Total Members', value: health.totals?.members || 0, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Total Families', value: health.totals?.families || 0, color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Total Clans', value: health.totals?.clans || 0, color: 'text-violet-600 dark:text-violet-400' },
              { label: 'Tree Views', value: health.totals?.views || 0, color: 'text-amber-600 dark:text-amber-400' },
              { label: 'Layout Caches', value: health.totals?.layoutCaches || 0, color: 'text-cyan-600 dark:text-cyan-400' },
              { label: 'Bookmarks', value: health.totals?.bookmarks || 0, color: 'text-pink-600 dark:text-pink-400' },
            ].map((stat, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs text-slate-400 dark:text-slate-500">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Health Status</h3>
              <div className="flex items-center gap-4">
                <div className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold ${
                  health.health?.healthStatus === 'Excellent' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  health.health?.healthStatus === 'Good' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  health.health?.healthStatus === 'Fair' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {health.health?.healthScore || 0}
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{health.health?.healthStatus || 'Unknown'}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{health.health?.brokenRelationships || 0} broken relationships</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Performance</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Total Nodes</span>
                  <span className="font-medium text-slate-900 dark:text-white">{perf?.totalNodes || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Total Edges</span>
                  <span className="font-medium text-slate-900 dark:text-white">{perf?.totalEdges || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Avg Members/Family</span>
                  <span className="font-medium text-slate-900 dark:text-white">{perf?.avgMembersPerFamily || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Virtual Rendering</span>
                  <span className={`font-medium ${perf?.virtualRenderingReady ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {perf?.virtualRenderingReady ? 'Recommended' : 'Not Needed'}
                  </span>
                </div>
                {perf?.recommendations?.length > 0 && (
                  <div className="mt-2 rounded-lg bg-amber-50 p-2 dark:bg-amber-900/10">
                    {perf.recommendations.map((rec: string, i: number) => (
                      <p key={i} className="text-xs text-amber-600 dark:text-amber-400">- {rec}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {health.recentViews?.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Recent Tree Views</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 dark:text-slate-500">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 dark:text-slate-500">Type</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 dark:text-slate-500">Layout</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 dark:text-slate-500">Views</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 dark:text-slate-500">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {health.recentViews.map((v: any, i: number) => (
                      <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50">
                        <td className="px-3 py-2 font-medium text-slate-900 dark:text-white">{v.name}</td>
                        <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{v.treeType}</td>
                        <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{v.layout}</td>
                        <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{v.viewCount}</td>
                        <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{new Date(v.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'diagnostics' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Run Diagnostics</h3>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Check for broken relationships, orphan nodes, and health issues</p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400 dark:text-slate-500">Entity Type</label>
                <select value={diagEntityType} onChange={(e) => setDiagEntityType(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                  <option value="FAMILY">Family</option>
                  <option value="CLAN">Clan</option>
                  <option value="COMMUNITY">Community</option>
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="mb-1 block text-xs text-slate-400 dark:text-slate-500">Entity ID</label>
                <select value={diagEntityId} onChange={(e) => setDiagEntityId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                  <option value="">Select entity...</option>
                  {diagEntityType === 'FAMILY' && families.map((f: any) => (
                    <option key={f.id} value={f.id}>{f.name || f.id}</option>
                  ))}
                  {diagEntityType === 'CLAN' && clans.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name || c.id}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleDiagnose} disabled={!diagEntityId || diagLoading}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                {diagLoading ? 'Running...' : 'Run Diagnostics'}
              </button>
            </div>
          </div>

          {diagnostics && !diagnostics.error && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-xs text-slate-400 dark:text-slate-500">Health Score</p>
                  <p className={`text-2xl font-bold ${
                    diagnostics.healthScore >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
                    diagnostics.healthScore >= 70 ? 'text-blue-600 dark:text-blue-400' :
                    diagnostics.healthScore >= 50 ? 'text-amber-600 dark:text-amber-400' :
                    'text-red-600 dark:text-red-400'
                  }`}>{diagnostics.healthScore}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-xs text-slate-400 dark:text-slate-500">Orphan Nodes</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{diagnostics.orphanNodes}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-xs text-slate-400 dark:text-slate-500">Broken Relationships</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{diagnostics.brokenRelationships}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-xs text-slate-400 dark:text-slate-500">Duplicate Edges</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{diagnostics.duplicateEdges}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                  <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Generation Stats</h4>
                  <div className="space-y-1">
                    {diagnostics.generationStats?.membersPerGeneration && Object.entries(diagnostics.generationStats.membersPerGeneration).map(([gen, count]: [string, any]) => (
                      <div key={gen} className="flex items-center gap-2">
                        <span className="w-8 text-xs text-slate-400 dark:text-slate-500">Gen {gen}</span>
                        <div className="h-4 rounded bg-emerald-100 dark:bg-emerald-900/30" style={{ width: `${Math.max(10, (count / diagnostics.totalNodes) * 100)}%` }} />
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                  <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Families</span>
                      <span className="font-medium text-slate-900 dark:text-white">{diagnostics.summary?.families}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Members</span>
                      <span className="font-medium text-slate-900 dark:text-white">{diagnostics.summary?.members}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Living</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">{diagnostics.summary?.living}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Deceased</span>
                      <span className="font-medium text-slate-500 dark:text-slate-400">{diagnostics.summary?.deceased}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Total Generations</span>
                      <span className="font-medium text-slate-900 dark:text-white">{diagnostics.generationStats?.totalGenerations}</span>
                    </div>
                  </div>
                </div>
              </div>

              {diagnostics.details?.brokenRelationships?.length > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-800 dark:bg-red-900/10">
                  <h4 className="mb-2 text-sm font-semibold text-red-700 dark:text-red-400">Broken Relationships</h4>
                  <div className="space-y-1">
                    {diagnostics.details.brokenRelationships.map((br: any, i: number) => (
                      <div key={i} className="text-xs text-red-600 dark:text-red-400">
                        Edge {br.edgeId}: {br.reason} (from: {br.from?.slice(0, 8)}... to: {br.to?.slice(0, 8)}...)
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {diagnostics.details?.orphanNodes?.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-900/10">
                  <h4 className="mb-2 text-sm font-semibold text-amber-700 dark:text-amber-400">Orphan Nodes</h4>
                  <div className="space-y-1">
                    {diagnostics.details.orphanNodes.map((on: any, i: number) => (
                      <div key={i} className="text-xs text-amber-600 dark:text-amber-400">
                        {on.displayId}: {on.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {diagnostics?.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">{diagnostics.error}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Engine Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Total Members</span>
                  <span className="font-medium text-slate-900 dark:text-white">{perf?.totalNodes || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Total Relationships</span>
                  <span className="font-medium text-slate-900 dark:text-white">{perf?.totalEdges || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Total Families</span>
                  <span className="font-medium text-slate-900 dark:text-white">{perf?.totalFamilies || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Avg Members/Family</span>
                  <span className="font-medium text-slate-900 dark:text-white">{perf?.avgMembersPerFamily || 0}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Tree View Analytics</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Total Views</span>
                  <span className="font-medium text-slate-900 dark:text-white">{health?.totals?.views || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Public Views</span>
                  <span className="font-medium text-slate-900 dark:text-white">{health?.totals?.publicViews || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Layout Caches</span>
                  <span className="font-medium text-slate-900 dark:text-white">{health?.totals?.layoutCaches || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Tree Branches</span>
                  <span className="font-medium text-slate-900 dark:text-white">{health?.totals?.branches || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Bookmarks</span>
                  <span className="font-medium text-slate-900 dark:text-white">{health?.totals?.bookmarks || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Search History</span>
                  <span className="font-medium text-slate-900 dark:text-white">{health?.totals?.searchHistory || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">View History</span>
                  <span className="font-medium text-slate-900 dark:text-white">{health?.totals?.viewHistory || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Architecture</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <h4 className="mb-1 text-xs font-medium text-slate-400 dark:text-slate-500">Supported Tree Types</h4>
                <div className="flex flex-wrap gap-1">
                  {['FAMILY', 'CLAN', 'COMMUNITY', 'ANCESTOR', 'DESCENDANT', 'RELATIONSHIP', 'BRANCH'].map(t => (
                    <span key={t} className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{t}</span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-1 text-xs font-medium text-slate-400 dark:text-slate-500">Layout Algorithms</h4>
                <div className="flex flex-wrap gap-1">
                  {['VERTICAL', 'HORIZONTAL', 'COMPACT', 'BALANCED'].map(l => (
                    <span key={l} className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{l}</span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-1 text-xs font-medium text-slate-400 dark:text-slate-500">Color Modes</h4>
                <div className="flex flex-wrap gap-1">
                  {['Gender', 'Generation', 'Entity'].map(c => (
                    <span key={c} className="rounded bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">{c}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <h4 className="mb-1 text-xs font-medium text-slate-400 dark:text-slate-500">Advanced Features</h4>
                <div className="flex flex-wrap gap-1">
                  {['MiniMap', 'Gen Navigator', 'Relationship Finder', 'Export SVG/PNG', 'Print', 'Hover Cards', 'Collapse/Expand'].map(f => (
                    <span key={f} className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{f}</span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-1 text-xs font-medium text-slate-400 dark:text-slate-500">SEO Features</h4>
                <div className="flex flex-wrap gap-1">
                  {['Public Views', 'SEO Metadata', 'Canonical URLs', 'OpenGraph'].map(f => (
                    <span key={f} className="rounded bg-cyan-100 px-2 py-0.5 text-[10px] font-medium text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">{f}</span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-1 text-xs font-medium text-slate-400 dark:text-slate-500">Data Features</h4>
                <div className="flex flex-wrap gap-1">
                  {['Bookmarks', 'Search History', 'View History', 'Layout Cache', 'Bookmarks'].map(f => (
                    <span key={f} className="rounded bg-pink-100 px-2 py-0.5 text-[10px] font-medium text-pink-700 dark:bg-pink-900/30 dark:text-pink-400">{f}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
