import { Injectable } from '@nestjs/common';
import { GraphTraversalService } from './graph-traversal.service';
import { Neo4jService } from '../neo4j.service';

@Injectable()
export class AncestorService {
  constructor(
    private readonly graphTraversal: GraphTraversalService,
    private readonly neo4jService: Neo4jService,
  ) {}

  async getAncestorChain(
    personId: string,
    generations: number = 15,
  ): Promise<{
    id: string;
    name: string;
    generation: number;
    relationshipLabel: string;
  }[]> {
    const ancestors = await this.graphTraversal.getAncestorChain(personId, generations);

    return [
      {
        id: personId,
        name: 'Self',
        generation: 0,
        relationshipLabel: 'Self',
      },
      ...ancestors.map(a => ({
        id: a.id,
        name: a.name,
        generation: a.generation,
        relationshipLabel: a.relationship,
      })),
    ];
  }

  async findNearestCommonAncestor(
    personIdA: string,
    personIdB: string,
    maxDepth: number = 20,
  ): Promise<{
    found: boolean;
    ancestor?: {
      id: string;
      name: string;
      distanceFromA: number;
      distanceFromB: number;
      combinedDistance: number;
    };
  }> {
    return this.graphTraversal.findNearestCommonAncestor(personIdA, personIdB, maxDepth);
  }

  async getAncestorAtGeneration(
    personId: string,
    generation: number,
  ): Promise<{ id: string; name: string }[]> {
    if (!this.neo4jService.isConnected()) {
      return [];
    }

    if (generation === 0) {
      const query = `
        MATCH (p:Person {id: $personId})
        RETURN p.id as id,
               coalesce(p.firstName, '') + ' ' + coalesce(p.lastName, '') as name
      `;
      const result = await this.neo4jService.readQuery(query, { personId });
      if (!result.records || result.records.length === 0) return [];
      const r = result.records[0];
      return [{ id: r.id, name: r.name }];
    }

    const query = `
      MATCH path = (p:Person {id: $personId})<-[:PARENT_OF*1..$generation]-(ancestor:Person)
      WHERE length(path) = $generation
      RETURN ancestor.id as id,
             coalesce(ancestor.firstName, '') + ' ' + coalesce(ancestor.lastName, '') as name
    `;

    const result = await this.neo4jService.readQuery(query, {
      personId,
      generation,
    });

    return (result.records || []).map((r: any) => ({
      id: r.id,
      name: r.name,
    }));
  }

  async getAllAncestors(
    personId: string,
    maxDepth: number = 20,
  ): Promise<{ id: string; name: string; generation: number }[]> {
    return this.graphTraversal.getAncestors(personId, maxDepth);
  }

  async getGenerationDifference(
    personIdA: string,
    personIdB: string,
  ): Promise<{
    generationDifference: number;
    olderPerson: 'a' | 'b' | 'same';
    olderGeneration: number;
    youngerGeneration: number;
  }> {
    if (!this.neo4jService.isConnected()) {
      return { generationDifference: 0, olderPerson: 'same', olderGeneration: 0, youngerGeneration: 0 };
    }

    const query = `
      MATCH (a:Person {id: $personIdA}), (b:Person {id: $personIdB})
      OPTIONAL MATCH aPath = (a)<-[:PARENT_OF*]-(:Person)
      OPTIONAL MATCH bPath = (b)<-[:PARENT_OF*]-(:Person)
      WITH a, b,
           coalesce(max(length(aPath)), 0) as aDepth,
           coalesce(max(length(bPath)), 0) as bDepth
      RETURN aDepth, bDepth
    `;

    const result = await this.neo4jService.readQuery(query, {
      personIdA,
      personIdB,
    });

    if (!result.records || result.records.length === 0) {
      return { generationDifference: 0, olderPerson: 'same', olderGeneration: 0, youngerGeneration: 0 };
    }

    const r = result.records[0];
    const aDepth = r.aDepth || 0;
    const bDepth = r.bDepth || 0;
    const diff = aDepth - bDepth;

    return {
      generationDifference: Math.abs(diff),
      olderPerson: diff > 0 ? 'a' : diff < 0 ? 'b' : 'same',
      olderGeneration: Math.max(aDepth, bDepth),
      youngerGeneration: Math.min(aDepth, bDepth),
    };
  }

  async getPaternalLineage(personId: string, depth?: number): Promise<{ id: string; name: string; generation: number; relationshipLabel: string }[]> {
    const ancestors = await this.graphTraversal.getPaternalLineage(personId, depth);
    return ancestors.map(a => ({
      ...a,
      relationshipLabel: this.getRelationshipLabel(a.generation),
    }));
  }

  async getMaternalLineage(personId: string, depth?: number): Promise<{ id: string; name: string; generation: number; relationshipLabel: string }[]> {
    const ancestors = await this.graphTraversal.getMaternalLineage(personId, depth);
    return ancestors.map(a => ({
      ...a,
      relationshipLabel: this.getRelationshipLabel(a.generation),
    }));
  }

  async getGenerationA(personId: string): Promise<{ ancestorGenerations: number; descendantGenerations: number; totalGenerations: number }> {
    return this.graphTraversal.countGenerations(personId);
  }

  async getOldestAncestor(personId: string): Promise<{ id: string; name: string; generation: number } | null> {
    return this.graphTraversal.getOldestAncestor(personId);
  }

  async getFamilyBranches(ancestorId: string, depth?: number): Promise<{ branchRoot: string; branchName: string; members: { id: string; name: string; generation: number }[] }[]> {
    return this.graphTraversal.getFamilyBranches(ancestorId, depth);
  }

  async getAncestorsByLevel(personId: string, level: number): Promise<{ id: string; name: string; gender?: string; birthDate?: string; deathDate?: string }[]> {
    const ancestors = await this.graphTraversal.getAncestorsByLevel(personId, level);
    return ancestors.map(a => ({
      id: a.id,
      name: a.name,
      gender: a.gender,
      birthDate: a.birthDate,
      deathDate: a.deathDate,
    }));
  }

  private getRelationshipLabel(generation: number): string {
    if (generation === 0) return 'Self';
    if (generation === 1) return 'Parent';
    if (generation === 2) return 'Grandparent';
    if (generation === 3) return 'Great Grandparent';
    if (generation === 4) return '2nd Great Grandparent';
    if (generation === 5) return '3rd Great Grandparent';
    return `${generation - 1}th Great Grandparent`;
  }
}
