import { apiHealthMonitor } from './api-health-monitor';

const STORAGE_KEY = 'api_offline_queue';
const MAX_QUEUE_SIZE = 50;

interface QueuedRequest {
  id: string;
  endpoint: string;
  method: string;
  body?: any;
  timestamp: number;
}

type QueueChangeListener = (size: number) => void;

class ApiOfflineQueue {
  private static instance: ApiOfflineQueue;

  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private listeners: Set<QueueChangeListener> = new Set();

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): ApiOfflineQueue {
    if (!ApiOfflineQueue.instance) {
      ApiOfflineQueue.instance = new ApiOfflineQueue();
    }
    return ApiOfflineQueue.instance;
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private loadFromStorage(): void {
    if (!this.isBrowser()) return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.queue = parsed;
        }
      }
    } catch {
      this.queue = [];
    }
  }

  private persistToStorage(): void {
    if (!this.isBrowser()) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch { /* empty */ }
  }

  private notifyListeners(): void {
    const size = this.queue.length;
    this.listeners.forEach((cb) => {
      try {
        cb(size);
      } catch { /* empty */ }
    });
  }

  enqueueRequest(request: Omit<QueuedRequest, 'id'>): boolean {
    if (this.queue.length >= MAX_QUEUE_SIZE) return false;

    const entry: QueuedRequest = {
      ...request,
      id: this.generateId(),
    };

    this.queue.push(entry);
    this.persistToStorage();
    this.notifyListeners();
    return true;
  }

  async processQueue(): Promise<{ succeeded: number; failed: number }> {
    if (this.isProcessing || this.queue.length === 0) {
      return { succeeded: 0, failed: 0 };
    }

    this.isProcessing = true;
    const token = this.isBrowser() ? localStorage.getItem('auth_token') : null;

    let succeeded = 0;
    let failed = 0;
    const remaining: QueuedRequest[] = [];

    for (const request of this.queue) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`/api/nest${request.endpoint}`, {
          method: request.method,
          headers,
          body: request.body ? JSON.stringify(request.body) : undefined,
        });

        if (res.ok) {
          succeeded++;
        } else {
          remaining.push(request);
          failed++;
        }
      } catch {
        remaining.push(request);
        failed++;
      }
    }

    this.queue = remaining.slice(-MAX_QUEUE_SIZE);
    this.persistToStorage();
    this.notifyListeners();
    this.isProcessing = false;

    return { succeeded, failed };
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getQueue(): readonly QueuedRequest[] {
    return [...this.queue];
  }

  clearQueue(): void {
    this.queue = [];
    this.persistToStorage();
    this.notifyListeners();
  }

  removeRequest(id: string): void {
    this.queue = this.queue.filter((r) => r.id !== id);
    this.persistToStorage();
    this.notifyListeners();
  }

  onQueueChange(callback: QueueChangeListener): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  startAutoProcess(): void {
    apiHealthMonitor.onStatusChange(async (result) => {
      if (result.status === 'online' && this.queue.length > 0) {
        await this.processQueue();
      }
    });
  }
}

export const apiOfflineQueue = ApiOfflineQueue.getInstance();
export type { QueuedRequest };
