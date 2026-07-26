'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  CloudOff,
  Inbox,
  RefreshCw,
  Search,
  ServerCrash,
  WifiOff,
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.25, ease: 'easeOut' },
};

function SkeletonBar({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}
    />
  );
}

export function PageSkeleton({ type = 'timeline' }: { type?: 'timeline' | 'detail' | 'form' | 'search' | 'calendar' }) {
  if (type === 'timeline') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <SkeletonBar className="h-8 w-48" />
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <SkeletonBar className="w-3 h-3 rounded-full" />
                {i < 3 && <SkeletonBar className="w-0.5 flex-1 mt-1" />}
              </div>
              <div className="flex-1 space-y-3 pb-8">
                <SkeletonBar className="h-4 w-24" />
                <SkeletonBar className="h-5 w-full" />
                <SkeletonBar className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'detail') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <SkeletonBar className="h-10 w-64" />
        <SkeletonBar className="h-4 w-40" />
        <div className="space-y-4 pt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <SkeletonBar className="h-4 w-28 shrink-0" />
              <SkeletonBar className="h-4 w-full" />
            </div>
          ))}
        </div>
        <SkeletonBar className="h-48 w-full mt-6" />
      </div>
    );
  }

  if (type === 'form') {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 space-y-6">
        <SkeletonBar className="h-8 w-48" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonBar className="h-4 w-28" />
            <SkeletonBar className="h-10 w-full" />
          </div>
        ))}
        <SkeletonBar className="h-10 w-32 mt-4" />
      </div>
    );
  }

  if (type === 'search') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <SkeletonBar className="h-12 w-full" />
        <div className="space-y-4 pt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <SkeletonBar className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <SkeletonBar className="h-4 w-40" />
                <SkeletonBar className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <SkeletonBar className="h-8 w-48" />
      <SkeletonBar className="h-10 w-full" />
      <div className="grid grid-cols-7 gap-1 pt-4">
        {Array.from({ length: 35 }).map((_, i) => (
          <SkeletonBar key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export function LoadingSpinner({
  size = 'md',
  label,
}: {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  const labelSizeMap = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

  return (
    <motion.div
      {...fadeUp}
      className="flex flex-col items-center justify-center gap-3"
    >
      <svg
        className={`${sizeMap[size]} text-blue-600 dark:text-blue-400 animate-spin`}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      {label && (
        <span className={`${labelSizeMap[size]} text-gray-500 dark:text-gray-400 font-medium`}>
          {label}
        </span>
      )}
    </motion.div>
  );
}

export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm"
      >
        <motion.div
          {...scaleIn}
          className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white dark:bg-gray-800 shadow-xl"
        >
          <LoadingSpinner size="lg" />
          {message && (
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium text-center max-w-xs">
              {message}
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <motion.div
      {...fadeUp}
      className="flex flex-col items-center justify-center text-center py-16 px-4 max-w-md mx-auto"
    >
      <div className="mb-5 w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium text-sm shadow-sm"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: Error | string;
  onRetry?: () => void;
}) {
  const message = typeof error === 'string' ? error : error.message;

  const isNetwork =
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('connect') ||
    message.includes('ECONNREFUSED') ||
    message.includes('Unable to connect') ||
    message.includes('timed out');

  return (
    <motion.div
      {...fadeUp}
      className="flex flex-col items-center justify-center text-center py-16 px-4 max-w-md mx-auto"
    >
      <div className="mb-5 w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
        {isNetwork ? (
          <WifiOff className="w-7 h-7 text-red-500" />
        ) : (
          <ServerCrash className="w-7 h-7 text-red-500" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
        {isNetwork ? 'Connection failed' : 'Something went wrong'}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
        {isNetwork
          ? 'Unable to reach the server. Please check your connection and try again.'
          : message || 'An unexpected error occurred. Please try again.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium text-sm shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </motion.div>
  );
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <motion.div
      {...fadeUp}
      className="flex flex-col items-center justify-center text-center py-16 px-4 max-w-md mx-auto"
    >
      <div className="mb-5 w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
        <CloudOff className="w-7 h-7 text-amber-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
        You are offline
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
        No internet connection detected. Some features may be unavailable until
        you are back online.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 active:bg-amber-800 transition-colors font-medium text-sm shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Reconnect
        </button>
      )}
    </motion.div>
  );
}

export function NotFoundState({
  resource = 'Page',
  onGoBack,
}: {
  resource?: string;
  onGoBack?: () => void;
}) {
  return (
    <motion.div
      {...fadeUp}
      className="flex flex-col items-center justify-center text-center py-16 px-4 max-w-md mx-auto"
    >
      <div className="mb-5 w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <Inbox className="w-7 h-7 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
        {resource} not found
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
        The {resource.toLowerCase()} you are looking for does not exist or may
        have been removed.
      </p>
      {onGoBack && (
        <button
          onClick={onGoBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      )}
    </motion.div>
  );
}
