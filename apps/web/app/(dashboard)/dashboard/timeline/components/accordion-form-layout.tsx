'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Check, CheckCircle2, AlertCircle, Save, Eye, Send,
  ArrowLeft, ArrowRight, Clock, FileText, Loader2,
} from 'lucide-react';

export interface FormSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description?: string;
  required?: boolean;
  fields: string[];
}

export interface AccordionFormLayoutProps {
  title: string;
  subtitle?: string;
  sections: FormSection[];
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  onSave: () => void;
  onPublish?: () => void;
  onPreview?: () => void;
  saving?: boolean;
  publishing?: boolean;
  children: (activeSection: string) => React.ReactNode;
  completionPercentage?: number;
  lastSaved?: Date | null;
  isDirty?: boolean;
  eventType?: string;
  errors?: Record<string, string>;
}

function isSectionComplete(section: FormSection, data: Record<string, any>): boolean {
  if (section.fields.length === 0) return true;
  return section.fields.every((f) => {
    const val = data[f];
    if (val === undefined || val === null) return false;
    if (typeof val === 'string') return val.trim().length > 0;
    if (Array.isArray(val)) return val.length > 0;
    return true;
  });
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString();
}

export default function AccordionFormLayout({
  title,
  subtitle,
  sections,
  data,
  onChange: _onChange,
  onSave,
  onPublish,
  onPreview,
  saving = false,
  publishing = false,
  children,
  completionPercentage = 0,
  lastSaved,
  eventType,
  errors,
}: AccordionFormLayoutProps) {
  const [expandedSection, setExpandedSection] = useState<string>(sections[0]?.id || '');

  const sectionStatuses = useMemo(
    () => sections.map((s) => ({ ...s, complete: isSectionComplete(s, data) })),
    [sections, data],
  );

  const completedCount = useMemo(
    () => sectionStatuses.filter((s) => s.complete).length,
    [sectionStatuses],
  );

  const currentIndex = useMemo(
    () => sections.findIndex((s) => s.id === expandedSection),
    [sections, expandedSection],
  );

  useEffect(() => {
    const firstIncomplete = sections.find((s) => !isSectionComplete(s, data));
    if (firstIncomplete && !sections.find((s) => s.id === expandedSection)) {
      setExpandedSection(firstIncomplete.id);
    }
  }, [sections, data, expandedSection]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) setExpandedSection(sections[currentIndex - 1].id);
  }, [currentIndex, sections]);

  const handleNext = useCallback(() => {
    if (currentIndex < sections.length - 1) setExpandedSection(sections[currentIndex + 1].id);
  }, [currentIndex, sections]);

  const activeTitle =
    sections.find((s) => s.id === expandedSection)?.title || sections[0]?.title || '';

  return (
    <div className="mx-auto max-w-4xl pb-24">
      {/* â”€â”€ Sticky Header â”€â”€ */}
      <div className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/80">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard/timeline"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-lg font-bold text-slate-900 dark:text-white">
                  {title}
                </h1>
                {eventType && (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 flex-shrink-0">
                    {eventType}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Auto-save indicator */}
            <div className="hidden items-center gap-1.5 text-xs sm:flex">
              {saving ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400"
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </motion.div>
              ) : lastSaved ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Saved {formatRelativeTime(lastSaved)}</span>
                </motion.div>
              ) : null}
            </div>

            {onPreview && (
              <button
                onClick={onPreview}
                className="rounded-xl border border-slate-200 bg-white/60 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Eye className="mr-1.5 inline h-4 w-4" />
                <span className="hidden sm:inline">Preview</span>
              </button>
            )}

            <button
              onClick={onSave}
              disabled={saving}
              className="rounded-xl border border-slate-200 bg-white/60 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {saving ? (
                <Loader2 className="mr-1.5 inline h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1.5 inline h-4 w-4" />
              )}
              <span className="hidden sm:inline">Save Draft</span>
            </button>

            {onPublish && (
              <button
                onClick={onPublish}
                disabled={saving || publishing}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-sm shadow-emerald-200 transition-all hover:bg-emerald-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50 dark:shadow-emerald-900/40"
              >
                {publishing ? (
                  <Loader2 className="mr-1.5 inline h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-1.5 inline h-4 w-4" />
                )}
                <span className="hidden sm:inline">Publish</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* â”€â”€ Progress Bar â”€â”€ */}
      <div className="border-b border-slate-100 bg-white/50 px-4 py-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50 sm:px-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Form Progress
          </span>
          <span className="text-xs font-semibold text-slate-900 dark:text-white">
            {Math.round(completionPercentage)}% Â· {completedCount}/{sections.length} sections
          </span>
        </div>

        <div className="relative mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <motion.div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        <div className="flex items-center justify-between">
          {sectionStatuses.map((section, i) => (
            <button
              key={section.id}
              onClick={() => setExpandedSection(section.id)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs transition-all duration-200 ${
                  section.id === expandedSection
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/40 scale-110'
                    : section.complete
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:group-hover:bg-slate-700'
                }`}
              >
                {section.complete && section.id !== expandedSection ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <span
                className={`hidden text-[10px] font-medium sm:block ${
                  section.id === expandedSection
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : section.complete
                    ? 'text-slate-600 dark:text-slate-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {section.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* â”€â”€ Accordion Body â”€â”€ */}
      <div className="px-4 pt-6 sm:px-6">
        <div className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
          {sectionStatuses.map((section, i) => {
            const isExpanded = expandedSection === section.id;
            const isComplete = section.complete;

            return (
              <div
                key={section.id}
                className={i > 0 ? 'border-t border-slate-100 dark:border-slate-800' : ''}
              >
                {/* Section Header */}
                <button
                  onClick={() => setExpandedSection(isExpanded ? '' : section.id)}
                  className={`flex w-full items-center justify-between p-5 text-left transition-colors ${
                    isExpanded
                      ? 'border-b border-slate-100 dark:border-slate-800'
                      : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                        isExpanded
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : isComplete
                          ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {section.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold ${
                            isExpanded
                              ? 'text-slate-900 dark:text-white'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {section.title}
                        </span>
                        {section.required && (
                          <span className="text-[10px] font-medium text-rose-400">Required</span>
                        )}
                      </div>
                      {section.description && (
                        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                          {section.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isComplete && !isExpanded && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      </motion.div>
                    )}
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </motion.div>
                  </div>
                </button>

                {/* Section Content */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key={`content-${section.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 py-5">
                        {errors && Object.keys(errors).length > 0 && (
                          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-900/40 dark:bg-rose-900/10">
                            <div className="mb-1 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-rose-500" />
                              <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                                {Object.keys(errors).length} validation{' '}
                                {Object.keys(errors).length === 1 ? 'error' : 'errors'}
                              </span>
                            </div>
                            <ul className="space-y-0.5">
                              {Object.entries(errors)
                                .slice(0, 3)
                                .map(([field, msg]) => (
                                  <li
                                    key={field}
                                    className="text-[11px] text-rose-600 dark:text-rose-400"
                                  >
                                    {msg}
                                  </li>
                                ))}
                              {Object.keys(errors).length > 3 && (
                                <li className="text-[11px] text-rose-400">
                                  +{Object.keys(errors).length - 3} more
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                        {children(section.id)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* â”€â”€ Sticky Footer â”€â”€ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/60 bg-white/90 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Step {currentIndex + 1} of {sections.length}
            </span>
            <span className="hidden sm:inline"> Â· {activeTitle}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex <= 0}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/60 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Prev
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex >= sections.length - 1}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/60 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="ml-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />

            <button
              onClick={onSave}
              disabled={saving}
              className="rounded-xl border border-slate-200 bg-white/60 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {saving ? (
                <Loader2 className="mr-1.5 inline h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1.5 inline h-4 w-4" />
              )}
              Save
            </button>

            {onPublish && (
              <button
                onClick={onPublish}
                disabled={saving || publishing}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-sm shadow-emerald-200 transition-all hover:bg-emerald-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50 dark:shadow-emerald-900/40"
              >
                {publishing ? (
                  <Loader2 className="mr-1.5 inline h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-1.5 inline h-4 w-4" />
                )}
                Publish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
