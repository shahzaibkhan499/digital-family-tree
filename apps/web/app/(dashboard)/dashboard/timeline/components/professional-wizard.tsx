'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Check, Save, Send, Loader2, Clock,
} from 'lucide-react';

interface WizardStep {
  id: string;
  title: string;
  icon: React.ReactNode;
  description?: string;
  required?: boolean;
  fields?: string[];
}

interface ProfessionalWizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  completionPercentage: number;
  title: string;
  subtitle?: string;
  saving?: boolean;
  publishing?: boolean;
  lastSaved?: Date | null;
  isDirty?: boolean;
  eventType?: string;
  onSave?: () => void;
  onPublish?: () => void;
  children: (activeStep: string) => React.ReactNode;
}

function formatRelativeTime(date: Date | null): string {
  if (!date) return '';
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const EVENT_TYPE_BADGE: Record<string, string> = {
  BIRTH: 'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400',
  DEATH: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  MARRIAGE: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  ENGAGEMENT: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
  DIVORCE: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  GRADUATION: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  EDUCATION: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
  JOB: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  PROMOTION: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  CAREER: 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400',
  BUSINESS: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400',
  MIGRATION: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400',
  HOUSE_PURCHASE: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
  AWARD: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
  MILITARY_SERVICE: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
  RELIGIOUS_EVENT: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  TRAVEL: 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400',
  ACCIDENT: 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400',
  MEDICAL: 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400',
  RETIREMENT: 'bg-lime-50 text-lime-600 dark:bg-lime-900/20 dark:text-lime-400',
  DOCUMENT_ADDED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  MEMORY_ADDED: 'bg-pink-50 text-pink-500 dark:bg-pink-900/20 dark:text-pink-400',
  ANNIVERSARY: 'bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-900/20 dark:text-fuchsia-400',
  BIRTHDAY: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  FAMILY_REUNION: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  CLAN_GATHERING: 'bg-stone-50 text-stone-600 dark:bg-stone-900/20 dark:text-stone-400',
  COMMUNITY_EVENT: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
  ACHIEVEMENT: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
  HAJJ: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  UMRAH: 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400',
  MILITARY_ACHIEVEMENT: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
  CUSTOM_EVENT: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  BIRTH: 'Birth', DEATH: 'Death', MARRIAGE: 'Marriage', ENGAGEMENT: 'Engagement',
  DIVORCE: 'Divorce', GRADUATION: 'Graduation', EDUCATION: 'Education', JOB: 'Job',
  PROMOTION: 'Promotion', CAREER: 'Career', BUSINESS: 'Business', MIGRATION: 'Migration',
  HOUSE_PURCHASE: 'House Purchase', AWARD: 'Award', MILITARY_SERVICE: 'Military Service',
  RELIGIOUS_EVENT: 'Religious Event', TRAVEL: 'Travel', ACCIDENT: 'Accident',
  MEDICAL: 'Medical', RETIREMENT: 'Retirement', DOCUMENT_ADDED: 'Document Added',
  MEMORY_ADDED: 'Memory Added', ANNIVERSARY: 'Anniversary', BIRTHDAY: 'Birthday',
  FAMILY_REUNION: 'Family Reunion', CLAN_GATHERING: 'Clan Gathering',
  COMMUNITY_EVENT: 'Community Event', ACHIEVEMENT: 'Achievement', HAJJ: 'Hajj',
  UMRAH: 'Umrah', MILITARY_ACHIEVEMENT: 'Military Achievement', CUSTOM_EVENT: 'Custom Event',
};

export function ProfessionalWizard({
  steps,
  currentStep,
  onStepChange,
  completionPercentage,
  title,
  subtitle,
  saving = false,
  publishing = false,
  lastSaved,
  isDirty = false,
  eventType,
  onSave,
  onPublish,
  children,
}: ProfessionalWizardProps) {
  const [direction, setDirection] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const goNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      onStepChange(currentStep + 1);
    }
  }, [currentStep, steps.length, onStepChange]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      onStepChange(currentStep - 1);
    }
  }, [currentStep, onStepChange]);

  const goToStep = useCallback((idx: number) => {
    setDirection(idx > currentStep ? 1 : -1);
    onStepChange(idx);
  }, [currentStep, onStepChange]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goNext();
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev]);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const activeStep = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const saveStatusText = () => {
    if (saving) return 'Saving...';
    if (isDirty) return 'Unsaved changes';
    if (lastSaved) return `Saved ${formatRelativeTime(lastSaved)}`;
    return 'All changes saved';
  };

  const saveStatusColor = () => {
    if (saving) return 'text-amber-500';
    if (isDirty) return 'text-orange-500';
    return 'text-slate-400 dark:text-slate-500';
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="relative h-1 w-full bg-slate-100 dark:bg-slate-800">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
          initial={{ width: 0 }}
          animate={{ width: `${completionPercentage}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
      </div>

      <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{currentStep + 1}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
                {eventType && (
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${EVENT_TYPE_BADGE[eventType] || EVENT_TYPE_BADGE.CUSTOM_EVENT}`}>
                    {EVENT_TYPE_LABELS[eventType] || eventType}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="mt-0.5 text-sm text-slate-400 dark:text-slate-500">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onSave && (
              <button
                onClick={onSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Draft
              </button>
            )}
            {onPublish && (
              <button
                onClick={onPublish}
                disabled={publishing || completionPercentage < 50}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-emerald-200 transition-all hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg disabled:opacity-50 disabled:shadow-none dark:shadow-emerald-900/30"
              >
                {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Publish
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-100 px-6 py-3 dark:border-slate-800">
        {steps.map((step, idx) => {
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;
          const isUpcoming = idx > currentStep;

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => goToStep(idx)}
                className={`group flex items-center gap-2 rounded-xl px-3 py-2 transition-all ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-900/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200 dark:shadow-emerald-900/30'
                      : isActive
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200 ring-4 ring-emerald-100 dark:shadow-emerald-900/30 dark:ring-emerald-900/30'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="sm:hidden">{idx + 1}</span>
                  )}
                  {!isCompleted && (
                    <span className="hidden sm:inline">
                      {step.icon || idx + 1}
                    </span>
                  )}
                </div>
                <div className="hidden text-left sm:block">
                  <p className={`text-xs font-medium ${
                    isActive ? 'text-emerald-700 dark:text-emerald-300' : isCompleted ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{step.description}</p>
                  )}
                </div>
                {step.required && !isCompleted && (
                  <div className="hidden h-1.5 w-1.5 rounded-full bg-red-400 sm:block" />
                )}
              </button>
              {idx < steps.length - 1 && (
                <div className={`hidden h-px w-6 flex-shrink-0 sm:block ${
                  isCompleted ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-slate-200 dark:bg-slate-700'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div ref={contentRef} className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeStep.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="p-6"
          >
            {children(activeStep.id)}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <span className="font-medium">Step {currentStep + 1} of {steps.length}</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span>{activeStep.title}</span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px]">
          {saving ? (
            <span className="flex items-center gap-1 text-amber-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </span>
          ) : isDirty ? (
            <span className="flex items-center gap-1 text-orange-500">
              <div className="h-1.5 w-1.5 rounded-full bg-orange-400" />
              Unsaved changes
            </span>
          ) : lastSaved ? (
            <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
              <Check className="h-3 w-3 text-emerald-500" />
              Saved {formatRelativeTime(lastSaved)}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">All changes saved</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            disabled={isFirst}
            className="flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:pointer-events-none dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>
          <button
            onClick={goNext}
            disabled={isLast}
            className="flex items-center gap-1 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-emerald-200 transition-all hover:bg-emerald-600 hover:shadow-md disabled:opacity-30 disabled:pointer-events-none dark:shadow-emerald-900/30"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
