'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { apiHealthMonitor, HealthStatus, HealthResult } from '@/lib/api-health-monitor';
import { apiOfflineQueue } from '@/lib/api-offline-queue';

interface ApiHealthContextType {
  status: HealthStatus;
  latency: number;
  isOnline: boolean;
  lastChecked: Date;
  retryConnection: () => void;
}

const ApiHealthContext = createContext<ApiHealthContextType | null>(null);

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium animate-in slide-in-from-right fade-in ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
          onClick={() => onDismiss(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export function ApiProvider({ children }: { children: ReactNode }) {
  const [health, setHealth] = useState<HealthResult>({
    status: 'online',
    latency: 0,
    lastChecked: new Date(),
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  const prevStatusRef = useRef<HealthStatus>('online');
  const restorationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = String(++toastIdRef.current);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const unsubscribe = apiHealthMonitor.onStatusChange((result) => {
      setHealth(result);

      const prevStatus = prevStatusRef.current;
      const newStatus = result.status;

      if (prevStatus !== 'online' && newStatus === 'online') {
        addToast('Connection restored', 'success');
        apiOfflineQueue.processQueue();
      } else if (prevStatus === 'online' && newStatus !== 'online') {
        if (newStatus === 'offline') {
          addToast('Server unavailable. Retrying...', 'error');
        } else {
          addToast('Connection is slow', 'error');
        }
      }

      prevStatusRef.current = newStatus;
    });

    apiHealthMonitor.startMonitoring();
    apiOfflineQueue.startAutoProcess();

    return () => {
      unsubscribe();
      apiHealthMonitor.stopMonitoring();
      if (restorationTimerRef.current) {
        clearTimeout(restorationTimerRef.current);
      }
    };
  }, [addToast]);

  const retryConnection = useCallback(() => {
    apiHealthMonitor.reset();
    apiHealthMonitor.stopMonitoring();
    apiHealthMonitor.startMonitoring();
  }, []);

  return (
    <ApiHealthContext.Provider
      value={{
        status: health.status,
        latency: health.latency,
        isOnline: health.status === 'online',
        lastChecked: health.lastChecked,
        retryConnection,
      }}
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {children}
    </ApiHealthContext.Provider>
  );
}

export function useApiHealth(): ApiHealthContextType {
  const context = useContext(ApiHealthContext);
  if (!context) {
    throw new Error('useApiHealth must be used within an ApiProvider');
  }
  return context;
}
