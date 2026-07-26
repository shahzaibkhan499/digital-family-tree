'use client';

import { useState } from 'react';
import { Printer, Download, Share2, X, LayoutTemplate, FileText, BookOpen, Archive } from 'lucide-react';
import { api } from '@/lib/api-client';
import { formatDate, formatTime, getEventConfig, getStatusConfig } from './constants';

interface PrintPreviewProps {
  event: any;
  documents?: any[];
  participants?: any[];
  onClose: () => void;
}

type LayoutType = 'standard' | 'detailed' | 'research' | 'historical';

const LAYOUT_OPTIONS: { id: LayoutType; label: string; icon: any; description: string }[] = [
  { id: 'standard', label: 'Standard', icon: LayoutTemplate, description: 'Clean, balanced layout' },
  { id: 'detailed', label: 'Detailed', icon: FileText, description: 'Full details with sections' },
  { id: 'research', label: 'Research', icon: BookOpen, description: 'Academic citation format' },
  { id: 'historical', label: 'Historical', icon: Archive, description: 'Newspaper-style layout' },
];

export default function EventPrintPreview({ event, documents = [], participants = [], onClose }: PrintPreviewProps) {
  const [layout, setLayout] = useState<LayoutType>('standard');
  const [downloading, setDownloading] = useState(false);

  const cfg = getEventConfig(event?.eventType || 'CUSTOM_EVENT');
  const statusCfg = getStatusConfig(event?.status || 'PUBLISHED');

  const handlePrint = () => { window.print(); };

  const handleDownloadPdf = async () => {
    if (!event?.id) return;
    setDownloading(true);
    try {
      await api.timeline.exportPdf(event.id);
      window.open(`/dashboard/timeline/${event.id}/print`, '_blank');
    } catch { /* empty */ } finally { setDownloading(false); }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: event?.title, text: event?.summary || event?.description, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const accepted = participants.filter((p: any) => (p.rsvpStatus || '').toUpperCase() === 'ACCEPTED');
  const declined = participants.filter((p: any) => (p.rsvpStatus || '').toUpperCase() === 'DECLINED');
  const pending = participants.filter((p: any) => (p.rsvpStatus || '').toUpperCase() === 'PENDING');

  return (
    <>
      {/* Print-only overlay header */}
      <div className="no-print fixed inset-0 z-50 bg-black/60 p-4" onClick={onClose}>
        <div className="mx-auto flex h-full max-w-3xl flex-col" onClick={e => e.stopPropagation()}>
          {/* Controls bar */}
          <div className="flex items-center justify-between rounded-t-xl bg-white px-4 py-3 shadow-lg dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <Printer className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Print Preview</span>
            </div>
            <div className="flex items-center gap-2">
              {LAYOUT_OPTIONS.map(l => {
                const LIcon = l.icon;
                return (
                  <button key={l.id} onClick={() => setLayout(l.id)} title={l.description}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                      layout === l.id ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400'
                    }`}>
                    <LIcon className="h-3 w-3" /> {l.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={handlePrint}
                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors">
                <Printer className="h-3.5 w-3.5" /> Print
              </button>
              <button onClick={handleDownloadPdf} disabled={downloading}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-50">
                <Download className="h-3.5 w-3.5" /> {downloading ? 'Generating...' : 'PDF'}
              </button>
              <button onClick={handleShare}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
              <button onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Print content */}
          <div className="flex-1 overflow-y-auto rounded-b-xl bg-white shadow-lg dark:bg-slate-900">
            <div className="mx-auto max-w-2xl p-8">
              {layout === 'historical' ? (
                /* Historical / Newspaper layout */
                <div className="border-b-4 border-double border-slate-900 pb-6 dark:border-slate-100">
                  <h1 className="text-center text-3xl font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-slate-100 pb-3 mb-4">
                    {event?.title || 'Event'}
                  </h1>
                  <div className="flex justify-between text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
                    <span>{event?.date ? formatDate(event.date) : ''}</span>
                    <span>{cfg.label}</span>
                  </div>
                  {event?.summary && (
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3 leading-relaxed">{event.summary}</p>
                  )}
                  {event?.description && (
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-4 first-letter:text-4xl first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:mt-1">
                      {event.description}
                    </p>
                  )}
                  {event?.location && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 border-t border-slate-200 pt-3">
                      <span className="font-bold">Location:</span> {[event.venue, event.location].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              ) : layout === 'research' ? (
                /* Research / Citation layout */
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-300 pb-2">
                    {event?.title || 'Untitled Event'}
                  </h2>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                    <p>Type: {cfg.label} | Status: {statusCfg.label}</p>
                    <p>Date: {event?.date ? formatDate(event.date) : 'N/A'} {event?.time ? formatTime(event.time) : ''}</p>
                    {event?.location && <p>Location: {[event.venue, event.location].filter(Boolean).join(', ')}</p>}
                    <p>Source: Family Tree Project - Digital Archive</p>
                    <p>Accessed: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  {event?.summary && (
                    <div><h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Abstract</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{event.summary}</p></div>
                  )}
                  {event?.description && (
                    <div><h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{event.description}</p></div>
                  )}
                  {documents.length > 0 && (
                    <div><h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Attached Documents ({documents.length})</h3>
                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 ml-4 list-disc">
                      {documents.map((d: any, i: number) => <li key={i}>{d.title}{d.fileType ? ` (${d.fileType})` : ''}</li>)}
                    </ul></div>
                  )}
                </div>
              ) : layout === 'detailed' ? (
                /* Detailed layout */
                <div className="space-y-6">
                  <div>
                    <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${cfg.color} mb-2`}>{cfg.icon} {cfg.label}</div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{event?.title || 'Untitled Event'}</h1>
                    <div className="mt-1 flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                      <span>{event?.date ? formatDate(event.date) : ''}</span>
                      {event?.time && <span>{formatTime(event.time)}</span>}
                      <span className={`rounded-full px-2 py-0.5 text-xs ${statusCfg.color}`}>{statusCfg.label}</span>
                    </div>
                  </div>
                  {event?.location && (
                    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Location</span>
                      <p className="text-sm text-slate-800 dark:text-slate-200">{[event.venue, event.location].filter(Boolean).join(', ')}</p>
                    </div>
                  )}
                  {event?.summary && (
                    <div><h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Summary</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{event.summary}</p></div>
                  )}
                  {event?.description && (
                    <div><h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{event.description}</p></div>
                  )}
                  {documents.length > 0 && (
                    <div><h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Documents ({documents.length})</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {documents.map((d: any, i: number) => (
                        <div key={i} className="rounded-lg border border-slate-200 p-2 dark:border-slate-700">
                          <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{d.title}</p>
                          <p className="text-[10px] text-slate-400">{d.fileType || 'Document'}</p>
                        </div>
                      ))}
                    </div></div>
                  )}
                  {participants.length > 0 && (
                    <div><h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Guests ({participants.length})</h3>
                    <div className="space-y-1">
                      {participants.map((p: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-slate-700 dark:text-slate-300">{p.name || 'Guest'}</span>
                          <span className="text-slate-400">{p.rsvpStatus || 'Pending'}</span>
                        </div>
                      ))}
                    </div></div>
                  )}
                </div>
              ) : (
                /* Standard layout */
                <div className="space-y-4">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">{event?.title || 'Untitled Event'}</h1>
                  <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${cfg.color}`}>{cfg.icon} {cfg.label}</span>
                    {event?.date && <span>{formatDate(event.date)}</span>}
                    {event?.time && <span>{formatTime(event.time)}</span>}
                  </div>
                  {event?.location && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">ðŸ“ {[event.venue, event.location].filter(Boolean).join(', ')}</p>
                  )}
                  {event?.summary && <p className="text-sm text-slate-700 dark:text-slate-300">{event.summary}</p>}
                  {event?.description && <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{event.description}</p>}
                  {participants.length > 0 && (
                    <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Guests: {accepted.length} accepted, {pending.length} pending, {declined.length} declined</p>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="mt-8 border-t border-slate-200 pt-4 text-center text-[10px] text-slate-400 dark:border-slate-700 dark:text-slate-500">
                <p>Generated from Family Tree Project &middot; {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </>
  );
}
