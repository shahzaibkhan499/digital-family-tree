'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ClipboardCheck, Mail, Check, X, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Widget, SectionHeader, EmptyState, Avatar, Badge, SkeletonWidget } from './dashboard-widgets';

export default function PendingActions() {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [clanRequests, setClanRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.invitations.listReceived().catch(() => []),
      api.clanRequests.mine().catch(() => []),
    ])
      .then(([inv, cr]) => {
        setInvitations(inv.status === 'fulfilled' ? (Array.isArray(inv.value) ? inv.value : (inv.value as any)?.invitations || []) : []);
        setClanRequests(cr.status === 'fulfilled' ? (Array.isArray(cr.value) ? cr.value : []) : []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonWidget rows={2} />;

  const total = invitations.length + clanRequests.length;
  if (total === 0) return null;

  return (
    <Widget>
      <SectionHeader title="Pending Actions" />
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {invitations.slice(0, 3).map((inv: any, i: number) => (
          <motion.div
            key={inv.id || i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-5 py-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              <Mail className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {inv.family?.name || inv.entityName || 'Invitation'}
              </p>
              <p className="text-xs text-slate-500">
                {inv.message || 'You have been invited'}
              </p>
            </div>
            <Badge variant="info">Invitation</Badge>
          </motion.div>
        ))}
        {clanRequests.slice(0, 2).map((cr: any, i: number) => (
          <motion.div
            key={cr.id || i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-5 py-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
              <ClipboardCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{cr.clan?.name || 'Clan Request'}</p>
              <p className="text-xs text-slate-500">{cr.status || 'Pending review'}</p>
            </div>
            <Badge variant="warning">Request</Badge>
          </motion.div>
        ))}
      </div>
    </Widget>
  );
}
