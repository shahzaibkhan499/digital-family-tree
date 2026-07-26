'use client';

import { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ConnectionStatusBanner } from '@/components/ui/connection-status-banner';
import { ApiProvider } from '@/components/providers/api-provider';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ApiProvider>
      <ConnectionStatusBanner />
      <ErrorBoundary>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div className="flex min-h-screen flex-col">
          <nav aria-label="Main navigation" className="sr-only">
            <span>Navigation landmarks are managed by the application shell.</span>
          </nav>
          <main id="main-content" role="main" aria-label="Dashboard content" className="flex-1">
            {children}
          </main>
        </div>
      </ErrorBoundary>
    </ApiProvider>
  );
}
