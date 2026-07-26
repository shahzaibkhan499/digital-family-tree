import { Injectable } from '@nestjs/common';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable()
export class Neo4jQueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL: number = 5 * 60 * 1000;

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs?: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTTL),
    });
  }

  invalidate(keyPattern?: string): void {
    if (!keyPattern) { this.cache.clear(); return; }
    for (const key of this.cache.keys()) {
      if (key.includes(keyPattern)) this.cache.delete(key);
    }
  }

  buildKey(prefix: string, ...args: (string | number)[]): string {
    return `${prefix}:${args.join(':')}`;
  }

  get size(): number { return this.cache.size; }
}
