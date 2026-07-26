type HealthStatus = 'online' | 'degraded' | 'offline';

interface HealthResult {
  status: HealthStatus;
  latency: number;
  lastChecked: Date;
}

type StatusChangeCallback = (status: HealthResult) => void;

const HEALTH_ENDPOINT = '/api/nest/health';
const DEFAULT_PING_INTERVAL = 30_000;
const DEFAULT_CIRCUIT_BREAKER_THRESHOLD = 3;
const DEFAULT_CIRCUIT_BREAKER_RESET = 60_000;
const MAX_LATENCY_HISTORY = 5;
const DEGRAVED_THRESHOLD_MS = 3000;

class ApiHealthMonitor {
  private static instance: ApiHealthMonitor;

  private status: HealthStatus = 'online';
  private latencyHistory: number[] = [];
  private lastChecked: Date | null = null;
  private consecutiveFailures = 0;
  private isMonitoring = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private circuitBreakerUntil = 0;
  private listeners: Set<StatusChangeCallback> = new Set();
  private pingInterval = DEFAULT_PING_INTERVAL;

  private constructor() {}

  static getInstance(): ApiHealthMonitor {
    if (!ApiHealthMonitor.instance) {
      ApiHealthMonitor.instance = new ApiHealthMonitor();
    }
    return ApiHealthMonitor.instance;
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  private calculateBackoff(): number {
    const base = 1000;
    const max = 8000;
    const delay = Math.min(base * Math.pow(2, this.consecutiveFailures), max);
    return delay + Math.random() * 500;
  }

  private async ping(): Promise<void> {
    if (!this.isBrowser()) return;

    if (Date.now() < this.circuitBreakerUntil) return;

    const start = performance.now();
    try {
      const res = await fetch(HEALTH_ENDPOINT, {
        method: 'GET',
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      });
      const latency = Math.round(performance.now() - start);

      if (res.ok) {
        this.consecutiveFailures = 0;
        this.circuitBreakerUntil = 0;

        this.latencyHistory.push(latency);
        if (this.latencyHistory.length > MAX_LATENCY_HISTORY) {
          this.latencyHistory.shift();
        }

        const avgLatency = this.getAverageLatency();
        const newStatus: HealthStatus = avgLatency > DEGRAVED_THRESHOLD_MS ? 'degraded' : 'online';
        this.updateStatus(newStatus, latency);
      } else {
        this.handleFailure(latency);
      }
    } catch {
      const latency = Math.round(performance.now() - start);
      this.handleFailure(latency);
    }
  }

  private handleFailure(latency: number): void {
    this.consecutiveFailures++;
    this.latencyHistory.push(latency);
    if (this.latencyHistory.length > MAX_LATENCY_HISTORY) {
      this.latencyHistory.shift();
    }

    if (this.consecutiveFailures >= DEFAULT_CIRCUIT_BREAKER_THRESHOLD) {
      this.circuitBreakerUntil = Date.now() + DEFAULT_CIRCUIT_BREAKER_RESET;
      this.updateStatus('offline', latency);
    } else {
      const newStatus: HealthStatus = this.consecutiveFailures >= 2 ? 'degraded' : 'online';
      this.updateStatus(newStatus, latency);
    }
  }

  private updateStatus(newStatus: HealthStatus, latency: number): void {
    const changed = this.status !== newStatus;
    this.status = newStatus;
    this.lastChecked = new Date();

    if (changed) {
      this.emitStatus();
    }
  }

  private emitStatus(): void {
    const result = this.getHealthStatus();
    this.listeners.forEach((cb) => {
      try {
        cb(result);
      } catch { /* empty */ }
    });
  }

  private getAverageLatency(): number {
    if (this.latencyHistory.length === 0) return 0;
    const sum = this.latencyHistory.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.latencyHistory.length);
  }

  getHealthStatus(): HealthResult {
    return {
      status: this.status,
      latency: this.getAverageLatency(),
      lastChecked: this.lastChecked ?? new Date(),
    };
  }

  onStatusChange(callback: StatusChangeCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  startMonitoring(intervalMs?: number): void {
    if (!this.isBrowser()) return;
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.pingInterval = intervalMs ?? this.pingInterval;
    this.ping();

    this.intervalId = setInterval(() => {
      this.ping();
    }, this.pingInterval);
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getStatus(): HealthStatus {
    return this.status;
  }

  isOnline(): boolean {
    return this.status === 'online';
  }

  reset(): void {
    this.consecutiveFailures = 0;
    this.circuitBreakerUntil = 0;
    this.status = 'online';
    this.latencyHistory = [];
    this.lastChecked = null;
  }
}

export const apiHealthMonitor = ApiHealthMonitor.getInstance();
export type { HealthStatus, HealthResult, StatusChangeCallback };
