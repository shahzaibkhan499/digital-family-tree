'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import TreeCanvas, { calcPositions } from './components/tree-canvas';
import TreeControls from './components/tree-controls';
import TreeSearch from './components/tree-search';
import TreeDetailPanel from './components/tree-detail-panel';
import TreeMinimap from './components/tree-minimap';
import TreeGenerationNavigator from './components/tree-generation-navigator';
import TreeRelationshipHighlight from './components/tree-relationship-highlight';
import TreeStatistics from './components/tree-statistics';

const ENTITY_TYPES = [
  { value: 'FAMILY', label: 'Family' },
  { value: 'CLAN', label: 'Clan' },
  { value: 'COMMUNITY', label: 'Community' },
];

export default function TreeExplorerPage() {
  const { user } = useAuth();
  const [entityType, setEntityType] = useState('FAMILY');
  const [entityId, setEntityId] = useState('');
  const [entitySearch, setEntitySearch] = useState('');
  const [entityList, setEntityList] = useState<any[]>([]);
  const [entityDropdownOpen, setEntityDropdownOpen] = useState(false);
  const [treeData, setTreeData] = useState<any>(null);
  const [layout, setLayout] = useState('VERTICAL');
  const [colorMode, setColorMode] = useState<'gender' | 'generation' | 'entity'>('gender');
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 1200, h: 800 });
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [enhancedStats, setEnhancedStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedViews, setSavedViews] = useState<any[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [viewName, setViewName] = useState('');
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showGenNav, setShowGenNav] = useState(true);
  const [showRelationshipPanel, setShowRelationshipPanel] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showGenLabels, setShowGenLabels] = useState(true);
  const [showMarriageNodes, setShowMarriageNodes] = useState(false);
  const [relationshipMode, setRelationshipMode] = useState(false);
  const [statsData, setStatsData] = useState<any>(null);
  const [pathResult, setPathResult] = useState<any>(null);
  const [commonAncestorResult, setCommonAncestorResult] = useState<any>(null);
  const [highlightPathIds, setHighlightPathIds] = useState<string[]>([]);
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set());
  const [viewHistory, setViewHistory] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'views' | 'history' | 'bookmarks'>('views');
  const entityDropdownRef = useRef<HTMLDivElement>(null);

  const nodes: any[] = treeData?.nodes || treeData?.members || [];
  const edges: any[] = treeData?.edges || treeData?.relationships || [];

  const positions = React.useMemo(() => calcPositions(layout, nodes, edges), [layout, nodes, edges]);

  useEffect(() => {
    const load = async () => {
      try {
        let items: any[] = [];
        if (entityType === 'FAMILY') {
          const res = await api.families.list();
          items = Array.isArray(res) ? res : [];
        } else if (entityType === 'CLAN') {
          const res = await api.clans.list();
          items = Array.isArray(res) ? (res as any).clans || res : [];
        } else {
          const res = await api.communities.list();
          items = Array.isArray(res) ? (res as any).communities || res : [];
        }
        setEntityList(items);
      } catch {
        setEntityList([]);
      }
    };
    load();
  }, [entityType]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (entityDropdownRef.current && !entityDropdownRef.current.contains(e.target as Node)) {
        setEntityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!entityId) { setTreeData(null); return; }
    setLoading(true);
    setError('');
    setSelectedNode(null);
    setDetailPanelOpen(false);
    setHighlightPathIds([]);
    setPathResult(null);
    setCommonAncestorResult(null);

    const loadTree = async () => {
      try {
        let data: any;
        if (entityType === 'FAMILY') {
          data = await api.tree.family(entityId);
        } else if (entityType === 'CLAN') {
          data = await api.tree.clan(entityId);
        } else {
          data = await api.tree.community(entityId);
        }
        setTreeData(data);

        api.tree.enhancedStats(entityType, entityId).then((res: any) => {
          setEnhancedStats(res);
          setStatsData(res);
        }).catch(() => {});

        try {
          await api.tree.viewHistory.list(20);
        } catch { /* empty */ }
      } catch (err: any) {
        setError(err?.message || 'Failed to load tree data');
      } finally {
        setLoading(false);
      }
    };
    loadTree();
  }, [entityType, entityId]);

  useEffect(() => {
    if (!entityId) return;
    api.tree.stats(entityType, entityId).then(setStats).catch(() => {});
  }, [entityType, entityId]);

  useEffect(() => {
    api.tree.views.list().then((res: any) => {
      setSavedViews(Array.isArray(res) ? res : res?.views || []);
    }).catch(() => {});
  }, []);

  const filteredEntities = entityList.filter((e: any) => {
    const name = e.name || e.title || '';
    return name.toLowerCase().includes(entitySearch.toLowerCase());
  });

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    try {
      const res = await api.tree.search(q, entityType, entityId);
      const items = res?.nodes || res?.results || res?.members || (Array.isArray(res) ? res : []);
      setSearchResults(items);
    } catch {
      setSearchResults([]);
    }
  }, [entityType, entityId]);

  const handleSelectSearchResult = useCallback((node: any) => {
    setSelectedNode(node);
    setDetailPanelOpen(true);
  }, []);

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
    setDetailPanelOpen(true);
  }, []);

  const handleAncestors = useCallback(async (nodeId: string) => {
    setLoading(true);
    try {
      const data = await api.tree.ancestors(nodeId);
      setTreeData(data);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDescendants = useCallback(async (nodeId: string) => {
    setLoading(true);
    try {
      const data = await api.tree.descendants(nodeId);
      setTreeData(data);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLocate = useCallback((node: any) => {
    setSelectedNode(node);
    setDetailPanelOpen(true);
    const pos = positions[node.id];
    if (pos) {
      setViewBox({ x: pos.x - 300, y: pos.y - 200, w: 600, h: 400 });
    }
  }, [positions]);

  const handleZoomIn = useCallback(() => {
    setViewBox((v) => {
      const f = 0.8;
      return { x: v.x + v.w * (1 - f) / 2, y: v.y + v.h * (1 - f) / 2, w: v.w * f, h: v.h * f };
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setViewBox((v) => {
      const f = 1.25;
      return { x: v.x + v.w * (1 - f) / 2, y: v.y + v.h * (1 - f) / 2, w: v.w * f, h: v.h * f };
    });
  }, []);

  const handleFitScreen = useCallback(() => {
    if (!nodes.length) return;
    const posValues = Object.values(positions).filter(Boolean) as { x: number; y: number }[];
    if (posValues.length === 0) return;
    const xs = posValues.map(p => p.x);
    const ys = posValues.map(p => p.y);
    const minX = Math.min(...xs) - 60;
    const minY = Math.min(...ys) - 60;
    const maxX = Math.max(...xs) + 180 + 80;
    const maxY = Math.max(...ys) + 88 + 80;
    setViewBox({ x: minX, y: minY, w: Math.max(400, maxX - minX), h: Math.max(300, maxY - minY) });
  }, [nodes, positions]);

  const handleReset = useCallback(() => {
    const posValues = Object.values(positions).filter(Boolean) as { x: number; y: number }[];
    if (posValues.length > 0) {
      const xs = posValues.map(p => p.x);
      const ys = posValues.map(p => p.y);
      const minX = Math.min(...xs) - 60;
      const minY = Math.min(...ys) - 60;
      const maxX = Math.max(...xs) + 180 + 80;
      const maxY = Math.max(...ys) + 88 + 80;
      setViewBox({ x: minX, y: minY, w: Math.max(400, maxX - minX), h: Math.max(300, maxY - minY) });
    } else {
      setViewBox({ x: 0, y: 0, w: 1200, h: 800 });
    }
    setSelectedNode(null);
    setDetailPanelOpen(false);
    setHighlightPathIds([]);
    setPathResult(null);
    setCommonAncestorResult(null);
  }, [positions]);

  const handleJumpToGeneration = useCallback((generation: number) => {
    const genNodes = nodes.filter(n => (n.depth || 0) === generation);
    if (genNodes.length === 0) return;
    const genPositions = genNodes.map(n => positions[n.id]).filter(Boolean);
    if (genPositions.length === 0) return;
    const minX = Math.min(...genPositions.map(p => p.x));
    const maxX = Math.max(...genPositions.map(p => p.x));
    const minY = Math.min(...genPositions.map(p => p.y));
    const maxY = Math.max(...genPositions.map(p => p.y));
    setViewBox({
      x: minX - 50,
      y: minY - 50,
      w: Math.max(400, maxX - minX + 250),
      h: Math.max(300, maxY - minY + 200),
    });
  }, [nodes, positions]);

  const handleCollapseAll = useCallback(() => {
    const newCollapsed = new Set<string>();
    nodes.forEach(n => {
      if ((n.childIds && n.childIds.length > 0) || n.hasChildren) {
        newCollapsed.add(n.id);
      }
    });
    setCollapsedNodeIds(newCollapsed);
  }, [nodes]);

  const handleExpandAll = useCallback(() => {
    setCollapsedNodeIds(new Set());
  }, []);

  const handleExportSVG = useCallback(() => {
    const svgEl = document.querySelector('.tree-canvas-container svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family-tree-${entityType}-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entityType]);

  const handleExportPNG = useCallback(() => {
    const svgEl = document.querySelector('.tree-canvas-container svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx && ctx.fillStyle !== '#ffffff') ctx.fillStyle = '#ffffff';
      ctx?.fillRect(0, 0, canvas.width, canvas.height);
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `family-tree-${entityType}-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      });
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, [entityType]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleSaveView = useCallback(async () => {
    if (!entityId) return;
    setShowSaveModal(true);
  }, [entityId]);

  const handleConfirmSave = useCallback(async () => {
    if (!entityId || !viewName.trim()) return;
    try {
      await api.tree.views.create({
        name: viewName.trim(),
        treeType: entityType,
        rootEntityType: entityType,
        rootEntityId: entityId,
        layout,
        viewport: viewBox,
        isPublic: false,
      });
      const res = await api.tree.views.list();
      setSavedViews(Array.isArray(res) ? res : res?.views || []);
      setShowSaveModal(false);
      setViewName('');
    } catch { /* empty */ }
  }, [entityId, entityType, layout, viewBox, viewName]);

  const handleFindPath = useCallback(async (memberIdA: string, memberIdB: string) => {
    try {
      const result = await api.tree.relationshipPath(memberIdA, memberIdB);
      setPathResult(result);
      if (result?.found && result.path) {
        setHighlightPathIds(result.path.map((m: any) => m.id));
      }
    } catch {
      setPathResult({ found: false });
    }
  }, []);

  const handleFindCommonAncestor = useCallback(async (memberIdA: string, memberIdB: string) => {
    try {
      const result = await api.tree.commonAncestor(memberIdA, memberIdB);
      setCommonAncestorResult(result);
      if (result?.found && result.commonAncestor) {
        setHighlightPathIds([memberIdA, memberIdB, result.commonAncestor.id]);
      }
    } catch {
      setCommonAncestorResult({ found: false });
    }
  }, []);

  const handleClearHighlight = useCallback(() => {
    setHighlightPathIds([]);
    setPathResult(null);
    setCommonAncestorResult(null);
  }, []);

  const handleToggleGenLabels = useCallback(() => setShowGenLabels(v => !v), []);
  const handleToggleMarriageNodes = useCallback(() => setShowMarriageNodes(v => !v), []);
  const handleRelationshipMode = useCallback(() => setRelationshipMode(v => !v), []);

  const searchHighlightIds = searchResults.map((r: any) => r.id).filter(Boolean);

  const isDeceased = (n: any) => !!n.deathDate || !!n.dod;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tree Explorer</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Visualize and explore family trees, clans, and communities</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              showStats ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            Statistics
          </button>
          <button
            onClick={() => setShowRelationshipPanel(!showRelationshipPanel)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              showRelationshipPanel ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Relationship
          </button>
          <Link href="/dashboard" className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium">
            &larr; Dashboard
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-4" style={{ height: 'calc(100vh - 200px)', minHeight: 500 }}>
        <div className="hidden lg:flex flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Select Entity</h3>
            <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
              {ENTITY_TYPES.map((et) => (
                <button key={et.value} onClick={() => { setEntityType(et.value); setEntityId(''); setEntitySearch(''); setEntityDropdownOpen(false); }}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    entityType === et.value ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-400' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}>
                  {et.label}
                </button>
              ))}
            </div>
          </div>

          <div ref={entityDropdownRef} className="relative px-4 pt-3">
            <div onClick={() => setEntityDropdownOpen(!entityDropdownOpen)}
              className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:border-slate-600">
              <span className={entityId ? '' : 'text-slate-400 dark:text-slate-500'}>
                {entityId ? entityList.find((e) => e.id === entityId)?.name || 'Selected' : `Choose a ${entityType.toLowerCase()}...`}
              </span>
              <svg className={`h-4 w-4 text-slate-400 transition-transform ${entityDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {entityDropdownOpen && (
              <div className="absolute left-4 right-4 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <div className="sticky top-0 border-b border-slate-100 bg-white px-2 py-1.5 dark:border-slate-800 dark:bg-slate-900">
                  <input type="text" value={entitySearch} onChange={(e) => setEntitySearch(e.target.value)} placeholder="Search..."
                    className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" autoFocus />
                </div>
                {filteredEntities.length > 0 ? (
                  filteredEntities.map((e: any) => (
                    <button key={e.id} onClick={() => { setEntityId(e.id); setEntityDropdownOpen(false); setEntitySearch(''); }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                        entityId === e.id ? 'bg-emerald-50 font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}>
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {e.name?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{e.name || e.title || 'Unnamed'}</p>
                        {e.memberCount !== undefined && <p className="text-[10px] text-slate-400 dark:text-slate-500">{e.memberCount} members</p>}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-4 text-center text-xs text-slate-400 dark:text-slate-500">No {entityType.toLowerCase()}s found</div>
                )}
              </div>
            )}
          </div>

          <div className="mt-3 flex-1 overflow-y-auto px-4">
            <div className="flex gap-1 mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">
              {(['views', 'history', 'bookmarks'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                    activeTab === tab ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}>
                  {tab === 'views' ? 'Saved Views' : tab === 'history' ? 'Recent' : 'Bookmarks'}
                </button>
              ))}
            </div>

            {activeTab === 'views' && (
              savedViews.length > 0 ? (
                <div className="space-y-1">
                  {savedViews.map((view: any) => (
                    <button key={view.id}
                      onClick={() => {
                        if (view.rootEntityType) setEntityType(view.rootEntityType);
                        if (view.rootEntityId) setEntityId(view.rootEntityId);
                        if (view.layout) setLayout(view.layout);
                        if (view.viewport) setViewBox(view.viewport);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
                      <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{view.name || 'Unnamed view'}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">{view.layout || 'Default'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic">No saved views yet</p>
              )
            )}

            {activeTab === 'history' && (
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">Recent tree views will appear here</p>
              </div>
            )}

            {activeTab === 'bookmarks' && (
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">Bookmarked nodes will appear here</p>
              </div>
            )}
          </div>

          {enhancedStats && (
            <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
              <h4 className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Quick Stats</h4>
              <div className="grid grid-cols-2 gap-1.5">
                {enhancedStats.totalMembers !== undefined && (
                  <div className="rounded bg-slate-50 px-2 py-1.5 dark:bg-slate-800">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Members</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{enhancedStats.totalMembers}</p>
                  </div>
                )}
                {enhancedStats.totalFamilies !== undefined && (
                  <div className="rounded bg-slate-50 px-2 py-1.5 dark:bg-slate-800">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Families</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{enhancedStats.totalFamilies}</p>
                  </div>
                )}
                {enhancedStats.totalGenerations !== undefined && (
                  <div className="rounded bg-slate-50 px-2 py-1.5 dark:bg-slate-800">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Generations</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{enhancedStats.totalGenerations}</p>
                  </div>
                )}
                {enhancedStats.livingMembers !== undefined && (
                  <div className="rounded bg-slate-50 px-2 py-1.5 dark:bg-slate-800">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Living</p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{enhancedStats.livingMembers}</p>
                  </div>
                )}
              </div>
              {enhancedStats.largestBranch?.name && (
                <div className="mt-2 rounded bg-amber-50 px-2 py-1.5 dark:bg-amber-900/10">
                  <p className="text-[10px] text-amber-600 dark:text-amber-400">Largest: {enhancedStats.largestBranch.name} ({enhancedStats.largestBranch.size} members)</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2 dark:border-slate-800">
            <TreeSearch onSearch={handleSearch} results={searchResults} onSelectResult={handleSelectSearchResult} totalResults={searchResults.length} />
          </div>

          <div className="px-4 py-2">
            <TreeControls
              layout={layout}
              colorMode={colorMode}
              onLayoutChange={setLayout}
              onColorModeChange={(mode) => setColorMode(mode as 'gender' | 'generation' | 'entity')}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onFitScreen={handleFitScreen}
              onReset={handleReset}
              onSaveView={handleSaveView}
              onExportSVG={handleExportSVG}
              onExportPNG={handleExportPNG}
              onPrint={handlePrint}
              onCollapseAll={handleCollapseAll}
              onExpandAll={handleExpandAll}
              nodeCount={nodes.length}
              edgeCount={edges.length}
              showGenLabels={showGenLabels}
              showMarriageNodes={showMarriageNodes}
              onToggleGenLabels={handleToggleGenLabels}
              onToggleMarriageNodes={handleToggleMarriageNodes}
              onRelationshipMode={handleRelationshipMode}
              relationshipModeActive={relationshipMode}
              totalGenerations={statsData?.totalGenerations || enhancedStats?.totalGenerations}
            />
          </div>

          <div className="flex-1 overflow-hidden relative tree-canvas-container">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">Loading tree...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center p-8">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                    <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
                  <button onClick={() => { setError(''); if (entityId) setEntityId(entityId); }} className="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                    Try again
                  </button>
                </div>
              </div>
            ) : !entityId ? (
              <div className="flex h-full items-center justify-center p-8">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <svg className="h-7 w-7 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Select an Entity</h3>
                  <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                    Choose a {entityType.toLowerCase()} from the left panel to visualize its tree structure.
                  </p>
                </div>
              </div>
            ) : nodes.length === 0 ? (
              <div className="flex h-full items-center justify-center p-8">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">No tree data available</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Add members and relationships to see the tree</p>
                </div>
              </div>
            ) : (
              <>
                <TreeCanvas
                  nodes={nodes}
                  edges={edges}
                  layout={layout}
                  viewBox={viewBox}
                  selectedNodeId={selectedNode?.id}
                  searchHighlightIds={searchHighlightIds}
                  highlightPathIds={highlightPathIds}
                  collapsedNodeIds={collapsedNodeIds}
                  colorMode={colorMode}
                  showGenerationLabels={showGenLabels}
                  showMarriageNodes={showMarriageNodes}
                  currentUserId={user?.id}
                  onNodeClick={handleNodeClick}
                  onViewBoxChange={setViewBox}
                />
                {showMinimap && (
                  <TreeMinimap
                    nodes={nodes}
                    edges={edges}
                    positions={positions}
                    viewBox={viewBox}
                    selectedNodeId={selectedNode?.id}
                    searchHighlightIds={searchHighlightIds}
                    onViewBoxChange={setViewBox}
                  />
                )}
                {showGenNav && (
                  <TreeGenerationNavigator
                    nodes={nodes}
                    positions={positions}
                    layout={layout}
                    onJumpToGeneration={handleJumpToGeneration}
                  />
                )}
              </>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2 dark:border-slate-800">
            <div className="flex items-center gap-4 text-[11px] text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" /> Male
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-pink-500" /> Female
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-violet-500" /> Other
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-3 w-3" viewBox="0 0 12 12"><line x1="0" y1="6" x2="12" y2="6" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 2" /></svg>
                Spouse
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-3 w-3" viewBox="0 0 12 12"><line x1="0" y1="6" x2="12" y2="6" stroke="#94a3b8" strokeWidth="2" /></svg>
                Parent/Child
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="h-3 w-3" viewBox="0 0 12 12"><line x1="0" y1="6" x2="12" y2="6" stroke="#10b981" strokeWidth="2" strokeDasharray="3 2" /></svg>
                Highlighted
              </span>
            </div>
            {stats && (
              <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
                <span>Total: <strong className="font-semibold text-slate-600 dark:text-slate-300">{stats.totalNodes || nodes.length}</strong></span>
                {stats.livingMembers !== undefined && <span>Living: <strong className="font-semibold text-emerald-600 dark:text-emerald-400">{stats.livingMembers}</strong></span>}
                {stats.deceasedMembers !== undefined && <span>Deceased: <strong className="font-semibold text-slate-500 dark:text-slate-400">{stats.deceasedMembers}</strong></span>}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {showRelationshipPanel && (
            <TreeRelationshipHighlight
              nodes={nodes}
              onFindPath={handleFindPath}
              onFindCommonAncestor={handleFindCommonAncestor}
              onClear={handleClearHighlight}
              pathResult={pathResult}
              commonAncestorResult={commonAncestorResult}
            />
          )}

          {showStats && (
            <TreeStatistics
              stats={statsData}
              loading={loading && !statsData}
            />
          )}

          {detailPanelOpen && selectedNode && (
            <div className="flex-1 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              <TreeDetailPanel
                node={selectedNode}
                onClose={() => { setDetailPanelOpen(false); setSelectedNode(null); }}
                onAncestors={handleAncestors}
                onDescendants={handleDescendants}
                onLocate={handleLocate}
              />
            </div>
          )}
        </div>
      </div>

      {detailPanelOpen && selectedNode && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setDetailPanelOpen(false); setSelectedNode(null); }} />
          <div className="relative ml-auto h-full w-full max-w-sm">
            <TreeDetailPanel
              node={selectedNode}
              onClose={() => { setDetailPanelOpen(false); setSelectedNode(null); }}
              onAncestors={handleAncestors}
              onDescendants={handleDescendants}
              onLocate={handleLocate}
            />
          </div>
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSaveModal(false)} />
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Save View</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Save the current tree view configuration</p>
            <input type="text" value={viewName} onChange={(e) => setViewName(e.target.value)} placeholder="View name..."
              className="mt-4 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmSave(); }} />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowSaveModal(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
              <button onClick={handleConfirmSave} disabled={!viewName.trim()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">
                Save View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
