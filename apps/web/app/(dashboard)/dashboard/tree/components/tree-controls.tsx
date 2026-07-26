'use client';

import React, { useState, useRef, useCallback } from 'react';

const LAYOUTS = [
  { key: 'VERTICAL', label: 'Vertical', icon: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
  )},
  { key: 'HORIZONTAL', label: 'Horizontal', icon: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m-4-4l4 4 4-4" /></svg>
  )},
  { key: 'COMPACT', label: 'Compact', icon: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z" /></svg>
  )},
  { key: 'BALANCED', label: 'Balanced', icon: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v18M3 9l9-6 9 6M3 15l9 6 9-6" /></svg>
  )},
];

const COLOR_MODES = [
  { key: 'gender', label: 'Gender Colors' },
  { key: 'generation', label: 'Generation Colors' },
  { key: 'entity', label: 'Entity Colors' },
];

interface TreeControlsProps {
  layout: string;
  colorMode?: string;
  onLayoutChange: (layout: string) => void;
  onColorModeChange?: (mode: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitScreen: () => void;
  onReset: () => void;
  onSaveView: () => void;
  onExportSVG?: () => void;
  onExportPNG?: () => void;
  onPrint?: () => void;
  onCollapseAll?: () => void;
  onExpandAll?: () => void;
  nodeCount: number;
  edgeCount: number;
  showGenLabels?: boolean;
  showMarriageNodes?: boolean;
  onToggleGenLabels?: () => void;
  onToggleMarriageNodes?: () => void;
  onRelationshipMode?: () => void;
  relationshipModeActive?: boolean;
  totalGenerations?: number;
  totalFamilies?: number;
}

export default function TreeControls({
  layout,
  colorMode = 'gender',
  onLayoutChange,
  onColorModeChange,
  onZoomIn,
  onZoomOut,
  onFitScreen,
  onReset,
  onSaveView,
  onExportSVG,
  onExportPNG,
  onPrint,
  onCollapseAll,
  onExpandAll,
  nodeCount,
  edgeCount,
  showGenLabels,
  showMarriageNodes,
  onToggleGenLabels,
  onToggleMarriageNodes,
  onRelationshipMode,
  relationshipModeActive,
  totalGenerations,
  totalFamilies,
}: TreeControlsProps) {
  const [showLayouts, setShowLayouts] = useState(false);
  const [showColorModes, setShowColorModes] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900 flex-wrap">
      <div className="relative">
        <button onClick={() => setShowLayouts(!showLayouts)}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
          {LAYOUTS.find((l) => l.key === layout)?.icon}
          <span className="hidden sm:inline">{LAYOUTS.find((l) => l.key === layout)?.label || layout}</span>
          <svg className="h-3 w-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showLayouts && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowLayouts(false)} />
            <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              {LAYOUTS.map((l) => (
                <button key={l.key} onClick={() => { onLayoutChange(l.key); setShowLayouts(false); }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
                    layout === l.key ? 'bg-emerald-50 font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}>
                  {l.icon}{l.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {onColorModeChange && (
        <div className="relative">
          <button onClick={() => setShowColorModes(!showColorModes)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            <span className="hidden sm:inline">{COLOR_MODES.find(m => m.key === colorMode)?.label || 'Colors'}</span>
          </button>
          {showColorModes && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowColorModes(false)} />
              <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {COLOR_MODES.map((m) => (
                  <button key={m.key} onClick={() => { onColorModeChange(m.key); setShowColorModes(false); }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
                      colorMode === m.key ? 'bg-emerald-50 font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

      <button onClick={onZoomIn} className="rounded-lg p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors" title="Zoom In">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" /></svg>
      </button>
      <button onClick={onZoomOut} className="rounded-lg p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors" title="Zoom Out">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" /></svg>
      </button>
      <button onClick={onFitScreen} className="rounded-lg p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors" title="Fit Screen">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
      </button>
      <button onClick={onReset} className="rounded-lg p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors" title="Reset View">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" /></svg>
      </button>

      {(onCollapseAll || onExpandAll) && (
        <>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
          {onExpandAll && (
            <button onClick={onExpandAll} className="rounded-lg p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors" title="Expand All">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 20.25v-4.5m0 4.5h-4.5m4.5 0L15 15" /></svg>
            </button>
          )}
          {onCollapseAll && (
            <button onClick={onCollapseAll} className="rounded-lg p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors" title="Collapse All">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" /></svg>
            </button>
          )}
        </>
      )}

      {onToggleGenLabels && (
        <>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
          <button
            onClick={onToggleGenLabels}
            className={`rounded-lg p-1 transition-colors ${
              showGenLabels ? 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={showGenLabels ? 'Hide Generation Labels' : 'Show Generation Labels'}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </>
      )}

      {onToggleMarriageNodes && (
        <button
          onClick={onToggleMarriageNodes}
          className={`rounded-lg p-1 transition-colors ${
            showMarriageNodes ? 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title={showMarriageNodes ? 'Hide Marriage Nodes' : 'Show Marriage Nodes'}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6" />
          </svg>
        </button>
      )}

      {onRelationshipMode && (
        <button
          onClick={onRelationshipMode}
          className={`rounded-lg p-1 transition-colors ${
            relationshipModeActive ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title={relationshipModeActive ? 'Exit Relationship Mode' : 'Relationship Mode (select two people)'}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a3 3 0 11-4.243 0 3 3 0 014.243 0zm-8.485 8.485a3 3 0 11-4.243 0 3 3 0 014.243 0zm0 0l4.242-4.243m0 0L9.88 9.879" />
          </svg>
        </button>
      )}

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

      <button onClick={onSaveView} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 transition-colors" title="Save View">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>
        <span className="hidden sm:inline">Save</span>
      </button>

      {(onExportSVG || onExportPNG || onPrint) && (
        <div className="relative" ref={exportRef}>
          <button onClick={() => setShowExport(!showExport)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors" title="Export">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            <span className="hidden sm:inline">Export</span>
          </button>
          {showExport && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowExport(false)} />
              <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {onExportSVG && (
                  <button onClick={() => { onExportSVG(); setShowExport(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    Export SVG
                  </button>
                )}
                {onExportPNG && (
                  <button onClick={() => { onExportPNG(); setShowExport(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
                    Export PNG
                  </button>
                )}
                {onPrint && (
                  <button onClick={() => { onPrint(); setShowExport(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" /></svg>
                    Print
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <div className="ml-auto flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
        {totalGenerations !== undefined && (
          <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
            {totalGenerations} gen{totalGenerations !== 1 ? 's' : ''}
          </span>
        )}
        <span>{nodeCount} nodes</span>
        <span>&middot;</span>
        <span>{edgeCount} edges</span>
      </div>
    </div>
  );
}
