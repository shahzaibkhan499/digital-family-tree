import { Injectable, Optional } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';

@Injectable()
export class HealthService {
  constructor(@Optional() private neo4jService?: Neo4jService) {}

  check() {
    const neo4j = this.neo4jService ? { connected: this.neo4jService.isConnected() } : { connected: false, configured: false };
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'digital-family-tree-api',
      version: '0.1.0',
      uptime: process.uptime(),
      neo4j,
    };
  }
}
