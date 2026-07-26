import { Injectable, Logger } from '@nestjs/common';
import { Neo4jService } from '../neo4j.service';
import { QueryResult, SyncResult } from '../neo4j.types';
import { getSchemaQueries } from '../queries/schema.queries';

@Injectable()
export class GraphRepository {
  private readonly logger = new Logger(GraphRepository.name);

  constructor(private readonly neo4jService: Neo4jService) {}

  async runRawQuery(query: string, params?: Record<string, any>): Promise<QueryResult> {
    return this.neo4jService.run(query, params);
  }

  async verifyConnectivity(): Promise<boolean> {
    return this.neo4jService.isConnected();
  }

  async applySchema(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      nodesCreated: 0,
      nodesUpdated: 0,
      nodesDeleted: 0,
      relationshipsCreated: 0,
      errors: [],
    };

    const queries = getSchemaQueries();

    for (const query of queries) {
      try {
        const queryResult = await this.neo4jService.run(query);
        if (queryResult.summary.counters) {
          result.nodesCreated += queryResult.summary.counters.nodesCreated || 0;
          result.nodesUpdated += queryResult.summary.counters.nodesUpdated || 0;
          result.relationshipsCreated += queryResult.summary.counters.relationshipsCreated || 0;
        }
      } catch (error: any) {
        result.success = false;
        result.errors.push(error.message || 'Unknown error applying schema');
        this.logger.error(`Schema query failed: ${error.message}`, error.stack);
      }
    }

    return result;
  }

  async clearDatabase(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      nodesCreated: 0,
      nodesUpdated: 0,
      nodesDeleted: 0,
      relationshipsCreated: 0,
      errors: [],
    };

    try {
      const queryResult = await this.neo4jService.run('MATCH (n) DETACH DELETE n');
      result.nodesDeleted = queryResult.summary.counters.nodesDeleted || 0;
    } catch (error: any) {
      result.success = false;
      result.errors.push(error.message || 'Unknown error clearing database');
    }

    return result;
  }

  async countNodes(label?: string): Promise<number> {
    const query = label
      ? `MATCH (n:${label}) RETURN count(n) as count`
      : 'MATCH (n) RETURN count(n) as count';
    const result = await this.neo4jService.run(query);
    if (result.records.length > 0) {
      const record = result.records[0] as Record<string, any>;
      return record.count?.toNumber ? record.count.toNumber() : (record.count as number);
    }
    return 0;
  }

  async countRelationships(type?: string): Promise<number> {
    const query = type
      ? `MATCH ()-[r:${type}]->() RETURN count(r) as count`
      : 'MATCH ()-[r]->() RETURN count(r) as count';
    const result = await this.neo4jService.run(query);
    if (result.records.length > 0) {
      const record = result.records[0] as Record<string, any>;
      return record.count?.toNumber ? record.count.toNumber() : (record.count as number);
    }
    return 0;
  }

  async getDatabaseInfo(): Promise<{
    nodeCount: number;
    relCount: number;
    labels: string[];
    relTypes: string[];
  }> {
    const nodeCount = await this.countNodes();
    const relCount = await this.countRelationships();

    const labelsResult = await this.neo4jService.run(
      'CALL db.labels() YIELD label RETURN label'
    );
    const labels = labelsResult.records.map(
      (r: any) => (typeof r === 'string' ? r : r.label)
    );

    const relTypesResult = await this.neo4jService.run(
      'CALL db.relationshipTypes() YIELD relationshipType RETURN relationshipType'
    );
    const relTypes = relTypesResult.records.map(
      (r: any) => (typeof r === 'string' ? r : r.relationshipType)
    );

    return { nodeCount, relCount, labels, relTypes };
  }
}
