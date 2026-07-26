import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../neo4j.service';
import { QueryResult } from '../neo4j.types';
import { treeQueries } from '../queries/tree.queries';

@Injectable()
export class TreeRepository {
  constructor(private readonly neo4jService: Neo4jService) {}

  async findShortestPath(
    personIdA: string,
    personIdB: string,
    maxDepth?: number,
  ): Promise<QueryResult> {
    const { query, params } = treeQueries.findShortestPath(
      personIdA,
      personIdB,
      maxDepth,
    );
    return this.neo4jService.readQuery(query, params);
  }

  async findCommonAncestors(
    personIdA: string,
    personIdB: string,
    maxDepth?: number,
  ): Promise<QueryResult> {
    const { query, params } = treeQueries.findCommonAncestors(
      personIdA,
      personIdB,
      maxDepth,
    );
    return this.neo4jService.readQuery(query, params);
  }

  async getSubTree(
    personId: string,
    direction: 'ancestors' | 'descendants' | 'both' = 'both',
    depth?: number,
  ): Promise<QueryResult> {
    const { query, params } = treeQueries.getSubTree(
      personId,
      direction,
      depth,
    );
    return this.neo4jService.readQuery(query, params);
  }

  async countGenerations(personId: string): Promise<QueryResult> {
    const { query, params } = treeQueries.countGenerations(personId);
    return this.neo4jService.readQuery(query, params);
  }

  async getRelationship(
    personIdA: string,
    personIdB: string,
  ): Promise<QueryResult> {
    const { query, params } = treeQueries.getPersonRelationship(
      personIdA,
      personIdB,
    );
    return this.neo4jService.readQuery(query, params);
  }

  async detectCycles(personId: string): Promise<QueryResult> {
    const { query, params } = treeQueries.detectCycles(personId);
    return this.neo4jService.readQuery(query, params);
  }

  async getIsolatedNodes(): Promise<QueryResult> {
    const { query, params } = treeQueries.getIsolatedNodes();
    return this.neo4jService.readQuery(query, params);
  }

  async getPaternalLineage(personId: string, depth?: number): Promise<QueryResult> {
    const { query, params } = treeQueries.getPaternalLineage(personId, depth);
    return this.neo4jService.readQuery(query, params);
  }

  async getMaternalLineage(personId: string, depth?: number): Promise<QueryResult> {
    const { query, params } = treeQueries.getMaternalLineage(personId, depth);
    return this.neo4jService.readQuery(query, params);
  }

  async getOldestAncestor(personId: string): Promise<QueryResult> {
    const { query, params } = treeQueries.getOldestAncestor(personId);
    return this.neo4jService.readQuery(query, params);
  }

  async getFamilyBranches(ancestorId: string, depth?: number): Promise<QueryResult> {
    const { query, params } = treeQueries.getFamilyBranches(ancestorId, depth);
    return this.neo4jService.readQuery(query, params);
  }

  async getGenerationDistribution(familyId: string): Promise<QueryResult> {
    const { query, params } = treeQueries.getGenerationDistribution(familyId);
    return this.neo4jService.readQuery(query, params);
  }

  async getAllAncestorsWithPaths(personId: string, depth?: number): Promise<QueryResult> {
    const { query, params } = treeQueries.getAllAncestorsWithPaths(personId, depth);
    return this.neo4jService.readQuery(query, params);
  }

  async getAncestorsByLevel(personId: string, level: number): Promise<QueryResult> {
    const { query, params } = treeQueries.getAncestorsByLevel(personId, level);
    return this.neo4jService.readQuery(query, params);
  }

  async getAncestorCountByLevel(personId: string, depth?: number): Promise<QueryResult> {
    const { query, params } = treeQueries.getAncestorCountByLevel(personId, depth);
    return this.neo4jService.readQuery(query, params);
  }
}
