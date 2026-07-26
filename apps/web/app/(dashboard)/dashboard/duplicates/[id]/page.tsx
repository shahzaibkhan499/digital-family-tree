'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { motion } from 'framer-motion';

interface DuplicateDetail {
  id: string;
  leftMember: any;
  rightMember: any;
  confidence: number;
  status: string;
  matchIndicators: Record<string, boolean>;
  matchFactors: string[];
  createdAt: string;
}

function MatchFactor({ label, matched }: { label: string; matched: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`flex h-5 w-5 items-center justify-center rounded-full ${matched ? 'bg-green-100 dark:bg-green-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
        {matched ? (
          <svg className="h-3 w-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="h-3 w-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
    </div>
  );
}

function MemberSide({ member, side }: { member: any; side: 'left' | 'right' }) {
  const color = side === 'left' ? 'indigo' : 'purple';
  return (
    <div className="flex-1 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3 mb-4">
        <div className={`flex h-14 w-14 items-center justify-center rounded-full bg-${color}-100 text-lg font-bold text-${color}-700 dark:bg-${color}-900/30 dark:text-${color}-400`}>
          {member?.firstName?.charAt(0) || '?'}{member?.lastName?.charAt(0) || '?'}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {member?.firstName} {member?.lastName}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {member?.family?.name || 'No family'}
          </p>
        </div>
      </div>

      <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
        {member?.gender && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Gender</span>
            <span className="font-medium capitalize text-slate-900 dark:text-white">{member.gender}</span>
          </div>
        )}
        {member?.birthDate && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Birth Date</span>
            <span className="font-medium text-slate-900 dark:text-white">{new Date(member.birthDate).toLocaleDateString()}</span>
          </div>
        )}
        {member?.deathDate && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Death Date</span>
            <span className="font-medium text-slate-900 dark:text-white">{new Date(member.deathDate).toLocaleDateString()}</span>
          </div>
        )}
        {member?.email && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Email</span>
            <span className="font-medium text-slate-900 dark:text-white">{member.email}</span>
          </div>
        )}
        {member?.phone && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Phone</span>
            <span className="font-medium text-slate-900 dark:text-white">{member.phone}</span>
          </div>
        )}
        {member?.address && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Address</span>
            <span className="font-medium text-slate-900 dark:text-white">{member.address}</span>
          </div>
        )}
        {member?.bio && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400">{member.bio}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DuplicateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [detail, setDetail] = useState<DuplicateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.duplicates.get(id);
      setDetail(data);
    } catch {
      router.push('/dashboard/duplicates');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  const handleReview = async (action: string) => {
    setActing(true);
    try {
      await api.duplicates.review(id, action);
      setDetail((prev) => prev ? { ...prev, status: action === 'approve' ? 'APPROVED' : 'REJECTED' } : prev);
    } catch {
      /* empty */
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!detail) return null;

  const indicators = detail.matchIndicators || {};
  const factors = detail.matchFactors || [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/duplicates" className="text-sm text-indigo-600 hover:text-indigo-700">
          â† Back to duplicates
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Duplicate Details</h1>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <MemberSide member={detail.leftMember} side="left" />

        <div className="flex flex-col items-center justify-center gap-4 lg:w-64">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative flex h-24 w-24 items-center justify-center"
          >
            <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-800" />
              <motion.circle
                cx="50" cy="50" r="42" fill="none" strokeWidth="8"
                stroke={detail.confidence >= 80 ? '#22c55e' : detail.confidence >= 60 ? '#f59e0b' : '#ef4444'}
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - detail.confidence / 100) }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <span className="absolute text-lg font-bold text-slate-900 dark:text-white">{detail.confidence}%</span>
          </motion.div>

          <div className="space-y-2">
            {Object.entries(indicators).map(([key, matched]) => (
              <MatchFactor key={key} label={key} matched={matched as boolean} />
            ))}
          </div>

          {factors.length > 0 && (
            <div className="w-full space-y-1.5 border-t border-slate-200 pt-4 dark:border-slate-800">
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Match Factors</p>
              {factors.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                  <svg className="h-3.5 w-3.5 shrink-0 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {f}
                </div>
              ))}
            </div>
          )}
        </div>

        <MemberSide member={detail.rightMember} side="right" />
      </div>

      <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <button
          onClick={() => handleReview('approve')}
          disabled={acting || detail.status === 'APPROVED'}
          className="rounded-lg bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          Approve as Duplicate
        </button>
        <button
          onClick={() => handleReview('reject')}
          disabled={acting || detail.status === 'REJECTED'}
          className="rounded-lg border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Reject
        </button>
        <Link
          href={`/dashboard/merge?sourceMemberId=${detail.leftMember?.id || ''}&targetMemberId=${detail.rightMember?.id || ''}`}
          className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Merge Members
        </Link>
      </div>
    </div>
  );
}
