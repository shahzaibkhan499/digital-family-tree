import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import neo4j, { Driver, Session } from 'neo4j-driver';
import type { SessionMode } from 'neo4j-driver';
import { Neo4jConfig, QueryResult } from './neo4j.types';
import { createNeo4jConfig, NEO4J_DEFAULTS } from './neo4j.config';

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(Neo4jService.name);
  private driver: Driver | null = null;
  private config: Neo4jConfig;
  private connected = false;

  constructor() {
    this.config = createNeo4jConfig();
  }

  async onModuleInit() {
    if (!this.config.uri) {
      this.logger.warn('Neo4j URI not configured. Skipping connection.');
      return;
    }
    try {
      this.driver = neo4j.driver(
        this.config.uri,
        neo4j.auth.basic(this.config.username, this.config.password),
        {
          maxConnectionPoolSize: this.config.maxConnectionPoolSize || NEO4J_DEFAULTS.maxConnectionPoolSize,
          connectionTimeout: this.config.connectionTimeout || NEO4J_DEFAULTS.connectionTimeout,
        }
      );
      await this.driver.verifyConnectivity();
      this.connected = true;
      this.logger.log('Neo4j connected successfully');
    } catch (error) {
      this.connected = false;
      this.logger.warn('Neo4j not available - running without graph database. ' +
        'Set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD in .env to enable graph features.');
    }
  }

  async onModuleDestroy() {
    await this.close();
  }

  getDriver(): Driver | null {
    return this.driver;
  }

  getSession(mode?: SessionMode): Session {
    if (!this.driver) {
      throw new Error('Neo4j driver is not initialized. Check your Neo4j configuration.');
    }
    return this.driver.session({
      database: this.config.database || 'neo4j',
      defaultAccessMode: mode || neo4j.session.WRITE,
    });
  }

  async run(query: string, params?: Record<string, any>): Promise<QueryResult> {
    if (!this.driver || !this.connected) {
      return { records: [], summary: { query, parameters: params || {}, counters: {}, time: 0 } };
    }
    const session = this.getSession(neo4j.session.WRITE);
    const start = Date.now();
    try {
      const result = await session.run(query, params);
      return {
        records: result.records.map(r => r.toObject()),
        summary: {
          query,
          parameters: params || {},
          counters: result.summary.counters.updates() as Record<string, number>,
          time: Date.now() - start,
        },
      };
    } finally {
      await session.close();
    }
  }

  async readQuery(query: string, params?: Record<string, any>): Promise<QueryResult> {
    if (!this.driver || !this.connected) {
      return { records: [], summary: { query, parameters: params || {}, counters: {}, time: 0 } };
    }
    const session = this.getSession(neo4j.session.READ);
    const start = Date.now();
    try {
      const result = await session.run(query, params);
      return {
        records: result.records.map(r => r.toObject()),
        summary: {
          query,
          parameters: params || {},
          counters: result.summary.counters.updates() as Record<string, number>,
          time: Date.now() - start,
        },
      };
    } finally {
      await session.close();
    }
  }

  async writeQuery(query: string, params?: Record<string, any>): Promise<QueryResult> {
    return this.run(query, params);
  }

  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
      this.connected = false;
      this.logger.log('Neo4j connection closed');
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}
