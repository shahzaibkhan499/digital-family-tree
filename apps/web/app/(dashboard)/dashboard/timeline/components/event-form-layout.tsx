'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Save, Eye, Send, X, Check, CheckCircle2,
  Circle, Clock, LayoutDashboard, ChevronRight, FileText,
  User, Image, FolderOpen, Shield, Bell, SendHorizontal,
  PenLine, Activity, AlertCircle, Loader2,
} from 'lucide-react';
import { getEventConfig, STATUS_CONFIG, formatDate, formatRelative } from './constants';

export interface EventFormLayoutProps {
  eventType: string;
  eventId?: string;
  children: React.ReactNode;
  currentSection: string;
  completionPercent: number;
  isSaving: boolean;
  lastSaved: Date | null;
  errors?: Record<string, string>;
  onCreate?: () => void;
  onSave?: () => void;
  onPreview?: () => void;
  onPublish?: () => void;
  onCancel?: () => void;
  onNavigateToSection?: (section: string) => void;
}

const PROGRESS_SECTIONS = [
  { id: 'general', label: 'General', threshold: 20 },
  { id: 'people', label: 'People', threshold: 35 },
  { id: 'media', label: 'Media', threshold: 50 },
  { id: 'documents', label: 'Documents', threshold: 60 },
  { id: 'privacy', label: 'Privacy', threshold: 75 },
  { id: 'notifications', label: 'Notifications', threshold: 85 },
  { id: 'review', label: 'Review', threshold: 95 },
  { id: 'publish', label: 'Publish', threshold: 100 },
];

const SECTION_ICONS: Record<string, React.ComponentType<any>> = {
  general: FileText,
  people: User,
  media: Image,
  documents: FolderOpen,
  privacy: Shield,
  notifications: Bell,
  review: Eye,
  publish: Send,
};

function getProgressColor(percent: number): string {
  if (percent < 25) return 'from-red-500 to-rose-500';
  if (percent < 50) return 'from-amber-500 to-orange-500';
  if (percent < 75) return 'from-yellow-500 to-amber-500';
  return 'from-emerald-500 to-green-500';
}

function getProgressGradientBg(percent: number): string {
  if (percent < 25) return '#ef4444';
  if (percent < 50) return '#f59e0b';
  if (percent < 75) return '#eab308';
  return '#10b981';
}

export function EventFormHeader({
  eventType,
  eventId,
  isSaving,
  lastSaved,
}: {
  eventType: string;
  eventId?: string;
  isSaving: boolean;
  lastSaved: Date | null;
}) {
  const config = getEventConfig(eventType);
  const isEdit = !!eventId;

  return (
    <div className="mb-6">
      <Link
        href="/dashboard/timeline"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Timeline
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-sm ${config.color}`}
          >
            {config.icon}
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {isEdit ? 'Edit' : 'Create'} {config.label}
              </h1>
            </div>
            <div className="mt-0.5 flex items-center gap-3">
              <nav className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                <LayoutDashboard className="h-3 w-3" />
                <span>Dashboard</span>
                <ChevronRight className="h-3 w-3" />
                <span>Timeline</span>
                <ChevronRight className="h-3 w-3" />
                <span>{isEdit ? 'Edit' : 'New Event'}</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">{config.label}</span>
              </nav>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isSaving ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400"
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </motion.div>
            ) : lastSaved ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400"
              >
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Saved {formatRelative(lastSaved.toISOString())}</span>
              </motion.div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                <Circle className="h-3 w-3" />
                <span>Not saved yet</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EventFormProgress({
  currentSection,
  completionPercent,
}: {
  currentSection: string;
  completionPercent: number;
}) {
  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
          Form Progress
        </span>
        <span className="text-xs font-semibold text-slate-900 dark:text-white">
          {Math.round(completionPercent)}%
        </span>
      </div>

      <div className="relative mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <motion.div
          className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${getProgressColor(completionPercent)}`}
          initial={{ width: 0 }}
          animate={{ width: `${completionPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      <div className="flex items-center justify-between">
        {PROGRESS_SECTIONS.map((section) => {
          const Icon = SECTION_ICONS[section.id] || Circle;
          const isActive = section.id === currentSection;
          const isComplete = completionPercent >= section.threshold;

          return (
            <div key={section.id} className="flex flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/40'
                    : isComplete
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                }`}
              >
                {isComplete && !isActive ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              </div>
              <span
                className={`hidden text-[10px] font-medium sm:block ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : isComplete
                    ? 'text-slate-600 dark:text-slate-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {section.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EventFormSidebar({
  eventType,
  eventId,
  completionPercent,
  currentSection,
  errors,
  onNavigateToSection,
}: {
  eventType: string;
  eventId?: string;
  completionPercent: number;
  currentSection: string;
  errors?: Record<string, string>;
  onNavigateToSection?: (section: string) => void;
}) {
  const config = getEventConfig(eventType);
  const isEdit = !!eventId;

  const sectionStatuses = useMemo(() => {
    return PROGRESS_SECTIONS.map((s) => ({
      ...s,
      complete: completionPercent >= s.threshold,
      isCurrent: s.id === currentSection,
    }));
  }, [completionPercent, currentSection]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Overview</h3>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Event Type</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}>
              {config.icon} {config.label}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Mode</span>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {isEdit ? 'Editing' : 'Creating'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">Category</span>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{config.category}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Sections</h3>
        <div className="space-y-1">
          {sectionStatuses.map((section) => {
            const Icon = SECTION_ICONS[section.id] || Circle;
            return (
              <button
                key={section.id}
                onClick={() => onNavigateToSection?.(section.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                  section.isCurrent
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 font-medium'
                    : section.complete
                    ? 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                    : 'text-slate-400 hover:bg-slate-50 dark:text-slate-500 dark:hover:bg-slate-800'
                }`}
              >
                {section.complete ? (
                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                ) : (
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                )}
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {errors && Object.keys(errors).length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-900/10">
          <div className="mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-500" />
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
              {Object.keys(errors).length} Validation {Object.keys(errors).length === 1 ? 'Error' : 'Errors'}
            </span>
          </div>
          <ul className="space-y-1">
            {Object.entries(errors).slice(0, 5).map(([field, msg]) => (
              <li key={field} className="text-[11px] text-rose-600 dark:text-rose-400">
                {msg}
              </li>
            ))}
            {Object.keys(errors).length > 5 && (
              <li className="text-[11px] text-rose-400">
                +{Object.keys(errors).length - 5} more
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export function EventFormFooter({
  isSaving,
  onSave,
  onPreview,
  onPublish,
  onCancel,
}: {
  isSaving: boolean;
  onSave?: () => void;
  onPreview?: () => void;
  onPublish?: () => void;
  onCancel?: () => void;
}) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/95"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Draft
          </button>

          <button
            onClick={onPreview}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>

          <button
            onClick={onPublish}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 shadow-sm shadow-emerald-200 dark:shadow-emerald-900/40 transition-colors"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Publish
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function EventFormLayout({
  eventType,
  eventId,
  children,
  currentSection,
  completionPercent,
  isSaving,
  lastSaved,
  errors,
  onCreate,
  onSave,
  onPreview,
  onPublish,
  onCancel,
  onNavigateToSection,
}: EventFormLayoutProps) {
  return (
    <div className="mx-auto max-w-7xl pb-20">
      <EventFormHeader
        eventType={eventType}
        eventId={eventId}
        isSaving={isSaving}
        lastSaved={lastSaved}
      />

      <EventFormProgress
        currentSection={currentSection}
        completionPercent={completionPercent}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="min-w-0"
          >
            {children}
          </motion.div>
        </AnimatePresence>

        <div className="hidden lg:block">
          <div className="sticky top-6">
            <EventFormSidebar
              eventType={eventType}
              eventId={eventId}
              completionPercent={completionPercent}
              currentSection={currentSection}
              errors={errors}
              onNavigateToSection={onNavigateToSection}
            />
          </div>
        </div>
      </div>

      <EventFormFooter
        isSaving={isSaving}
        onSave={onSave}
        onPreview={onPreview}
        onPublish={onPublish}
        onCancel={onCancel}
      />
    </div>
  );
}
