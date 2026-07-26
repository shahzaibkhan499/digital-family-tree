'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Download, Eye } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Widget, SectionHeader, EmptyState, Badge, SkeletonWidget } from './dashboard-widgets';

export default function RecentDocuments() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.documentVault.recent(4)
      .then((res: any) => setDocs(Array.isArray(res) ? res : res?.documents || []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonWidget rows={2} />;

  return (
    <Widget>
      <SectionHeader title="Recent Documents" action="View All" actionHref="/dashboard/documents" />
      {docs.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8" />}
          title="No documents"
          description="Upload documents to preserve family records."
          action="Upload"
          actionHref="/dashboard/documents"
        />
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {docs.map((d: any, i: number) => (
            <Link
              key={d.id || i}
              href={`/dashboard/documents`}
              className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{d.title}</p>
                <p className="text-xs text-slate-500">
                  {d.documentType?.replace('_', ' ') || 'Document'}
                  {d.fileSize ? ` Â· ${(d.fileSize / 1024).toFixed(0)}KB` : ''}
                </p>
              </div>
              {d.verificationStatus === 'VERIFIED' && (
                <Badge variant="success">Verified</Badge>
              )}
            </Link>
          ))}
        </div>
      )}
    </Widget>
  );
}
