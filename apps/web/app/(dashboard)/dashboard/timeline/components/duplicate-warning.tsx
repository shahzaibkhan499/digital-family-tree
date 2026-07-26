'use client';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ExternalLink } from 'lucide-react';
import { detectDuplicates } from './form-validation';
import { api } from '@/lib/api-client';
import Link from 'next/link';

interface DuplicateWarningProps {
  data: Record<string, any>;
  onDismiss?: () => void;
}

export function DuplicateWarning({ data, onDismiss }: DuplicateWarningProps) {
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (data.title && data.title.length >= 3) {
        const result = await detectDuplicates(data, api);
        if (result.isDuplicate) {
          setDuplicates(result.existingEvents);
          setShow(true);
        } else {
          setShow(false);
          setDuplicates([]);
        }
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [data.title, data.date, data.eventType]);

  if (!show || duplicates.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 backdrop-blur-xl dark:border-amber-800 dark:bg-amber-900/20"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Possible Duplicate Found
              </h4>
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                {duplicates.length} similar event(s) already exist:
              </p>
              <ul className="mt-2 space-y-1">
                {duplicates.map((e: any, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                    <Link
                      href={`/dashboard/timeline/${e.id}`}
                      target="_blank"
                      className="flex items-center gap-1 hover:underline"
                    >
                      {e.title} <ExternalLink className="h-3 w-3" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <button
            onClick={() => {
              setShow(false);
              onDismiss?.();
            }}
            className="rounded-lg p-1 text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
