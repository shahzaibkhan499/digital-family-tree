'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { motion } from 'framer-motion';

const STRATEGIES = [
  { value: 'KEEP_LEFT', label: 'Keep Left', desc: 'Keep the left member\'s data' },
  { value: 'KEEP_RIGHT', label: 'Keep Right', desc: 'Keep the right member\'s data' },
  { value: 'MERGE_BOTH', label: 'Merge Both', desc: 'Merge fields from both members' },
];

const FIELDS = [
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'gender', label: 'Gender' },
  { key: 'birthDate', label: 'Birth Date' },
  { key: 'deathDate', label: 'Death Date' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address' },
  { key: 'bio', label: 'Bio' },
  { key: 'notes', label: 'Notes' },
];

function MergePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sourceMemberId = searchParams.get('sourceMemberId') || '';
  const targetMemberId = searchParams.get('targetMemberId') || '';

  const [preview, setPreview] = useState<any>(null);
  const [leftMember, setLeftMember] = useState<any>(null);
  const [rightMember, setRightMember] = useState<any>(null);
  const [strategy, setStrategy] = useState('MERGE_BOTH');
  const [loading, setLoading] = useState(true);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    if (!sourceMemberId || !targetMemberId) {
      setError('Missing member IDs');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.merge.preview(sourceMemberId, targetMemberId);
      setPreview(data);
      setLeftMember(data?.source || data?.leftMember || data?.left);
      setRightMember(data?.target || data?.rightMember || data?.right);
    } catch (err: any) {
      setError(err.message || 'Failed to load merge preview');
    } finally {
      setLoading(false);
    }
  }, [sourceMemberId, targetMemberId]);

  useEffect(() => { loadPreview(); }, [loadPreview]);

  const handleMerge = async () => {
    setMerging(true);
    try {
      await api.merge.execute({ sourceMemberId, targetMemberId, strategy });
      router.push('/dashboard/merge/history');
    } catch (err: any) {
      setError(err.message || 'Failed to merge');
      setMerging(false);
    }
  };

  const getPreviewValue = (field: string) => {
    if (!preview) return '';
    const result = preview?.result || preview?.merged || preview;
    return result?.[field] || '';
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/duplicates" className="text-sm text-indigo-600 hover:text-indigo-700">â† Back</Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800/50 dark:bg-red-900/10">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/duplicates" className="text-sm text-indigo-600 hover:text-indigo-700">
            â† Back to duplicates
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Merge Preview</h1>
        </div>
        <Link
          href="/dashboard/merge/history"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Merge History
        </Link>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
              {leftMember?.firstName?.charAt(0) || '?'}{leftMember?.lastName?.charAt(0) || '?'}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Left Member</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{leftMember?.firstName} {leftMember?.lastName}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              {rightMember?.firstName?.charAt(0) || '?'}{rightMember?.lastName?.charAt(0) || '?'}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Right Member</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{rightMember?.firstName} {rightMember?.lastName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Field Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="px-4 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Field</th>
                <th className="px-4 py-2 text-left font-medium text-indigo-600 dark:text-indigo-400">Left</th>
                <th className="px-4 py-2 text-left font-medium text-purple-600 dark:text-purple-400">Right</th>
                <th className="px-4 py-2 text-left font-medium text-green-600 dark:text-green-400">Result</th>
              </tr>
            </thead>
            <tbody>
              {FIELDS.map((field) => {
                const leftVal = leftMember?.[field.key] || '';
                const rightVal = rightMember?.[field.key] || '';
                const resultVal = getPreviewValue(field.key);
                const isDifferent = leftVal !== rightVal;
                return (
                  <tr key={field.key} className={`border-b border-slate-100 dark:border-slate-800 ${isDifferent ? 'bg-amber-50/50 dark:bg-amber-900/5' : ''}`}>
                    <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-300">{field.label}</td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{leftVal || <span className="text-slate-300 dark:text-slate-700">â€”</span>}</td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{rightVal || <span className="text-slate-300 dark:text-slate-700">â€”</span>}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">{resultVal || <span className="text-slate-300 dark:text-slate-700">â€”</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Merge Strategy</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {STRATEGIES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStrategy(s.value)}
              className={`rounded-lg border-2 p-4 text-left transition ${
                strategy === s.value
                  ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/20'
                  : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
              }`}
            >
              <p className={`text-sm font-semibold ${strategy === s.value ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>{s.label}</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Back
        </button>
        <button
          onClick={handleMerge}
          disabled={merging}
          className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {merging ? 'Merging...' : 'Confirm Merge'}
        </button>
      </div>
    </div>
  );
}

export default function MergePage() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    }>
      <MergePageInner />
    </Suspense>
  );
}
