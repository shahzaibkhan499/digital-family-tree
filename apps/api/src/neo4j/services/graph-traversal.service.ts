import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Neo4jService } from '../neo4j.service';
import { TreeRepository } from '../repositories/tree.repository';

@Injectable()
export class GraphTraversalService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly treeRepository: TreeRepository,
  ) {}

  async findShortestPath(
    personIdA: string,
    personIdB: string,
    maxDepth: number = 20,
  ): Promise<{
    found: boolean;
    path: { nodeId: string; nodeLabels: string[]; relationshipType: string | null }[];
    distance: number;
    nodeIds: string[];
    relationshipTypes: string[];
  }> {
    if (!this.neo4jService.isConnected()) {
      return { found: false, path: [], distance: 0, nodeIds: [], relationshipTypes: [] };
    }

    const query = `
      MATCH path = shortestPath((p1:Person {id: $personIdA})-[*1..$maxDepth]-(p2:Person {id: $personIdB}))
      RETURN [n IN nodes(path) | {id: n.id, labels: labels(n)}] as nodeInfos,
             [r IN relationships(path) | type(r)] as relTypes,
             length(path) as distance
    `;

    const result = await this.neo4jService.readQuery(query, {
      personIdA,
      personIdB,
      maxDepth: maxDepth || 20,
    });

    if (!result.records || result.records.length === 0) {
      return { found: false, path: [], distance: 0, nodeIds: [], relationshipTypes: [] };
    }

    const record = result.records[0];
    const nodeInfos: { id: string; labels: string[] }[] = record.nodeInfos;
    const relTypes: string[] = record.relTypes;
    const distance: number = record.distance;

    const path = nodeInfos.map((n, i) => ({
      nodeId: n.id,
      nodeLabels: n.labels,
      relationshipType: i > 0 ? relTypes[i - 1] : null,
    }));

    return {
      found: true,
      path,
      distance,
      nodeIds: nodeInfos.map(n => n.id),
      relationshipTypes: relTypes,
    };
  }

  async findCommonAncestors(
    personIdA: string,
    personIdB: string,
    maxDepth: number = 20,
  ): Promise<{
    found: boolean;
    commonAncestors: {
      id: string;
      name: string;
      distanceFromA: number;
      distanceFromB: number;
      combinedDistance: number;
    }[];
  }> {
    if (!this.neo4jService.isConnected()) {
      return { found: false, commonAncestors: [] };
    }

    const query = `
      MATCH (a:Person {id: $personIdA})-[:PARENT_OF*0..$maxDepth]->(ca:Person)<-[:PARENT_OF*0..$maxDepth]-(b:Person {id: $personIdB})
      WHERE a <> ca AND b <> ca
      WITH ca,
           length((a)-[:PARENT_OF*]->(ca)) as dA,
           length((b)-[:PARENT_OF*]->(ca)) as dB
      RETURN ca.id as id,
             coalesce(ca.firstName, '') + ' ' + coalesce(ca.lastName, '') as name,
             dA as distanceFromA,
             dB as distanceFromB,
             dA + dB as combinedDistance
      ORDER BY combinedDistance ASC
    `;

    const result = await this.neo4jService.readQuery(query, {
      personIdA,
      personIdB,
      maxDepth: maxDepth || 20,
    });

    if (!result.records || result.records.length === 0) {
      return { found: false, commonAncestors: [] };
    }

    return {
      found: true,
      commonAncestors: result.records.map((r: any) => ({
        id: r.id,
        name: r.name,
        distanceFromA: r.distanceFromA,
        distanceFromB: r.distanceFromB,
        combinedDistance: r.combinedDistance,
      })),
    };
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
    if (!this.neo4jService.isConnected()) {
      return { found: false };
    }

    const query = `
      MATCH (a:Person {id: $personIdA})-[:PARENT_OF*0..$maxDepth]->(ca:Person)<-[:PARENT_OF*0..$maxDepth]-(b:Person {id: $personIdB})
      WHERE a <> ca AND b <> ca
      WITH ca,
           length((a)-[:PARENT_OF*]->(ca)) as dA,
           length((b)-[:PARENT_OF*]->(ca)) as dB
      RETURN ca.id as id,
             coalesce(ca.firstName, '') + ' ' + coalesce(ca.lastName, '') as name,
             dA as distanceFromA,
             dB as distanceFromB,
             dA + dB as combinedDistance
      ORDER BY combinedDistance ASC
      LIMIT 1
    `;

    const result = await this.neo4jService.readQuery(query, {
      personIdA,
      personIdB,
      maxDepth: maxDepth || 20,
    });

    if (!result.records || result.records.length === 0) {
      return { found: false };
    }

    const r = result.records[0];
    return {
      found: true,
      ancestor: {
        id: r.id,
        name: r.name,
        distanceFromA: r.distanceFromA,
        distanceFromB: r.distanceFromB,
        combinedDistance: r.combinedDistance,
      },
    };
  }

  async getAncestors(
    personId: string,
    depth: number = 20,
  ): Promise<{ id: string; name: string; generation: number }[]> {
    if (!this.neo4jService.isConnected()) {
      return [];
    }

    const query = `
      MATCH path = (p:Person {id: $personId})<-[:PARENT_OF*1..$depth]-(ancestor:Person)
      WITH ancestor, length(path) as gen
      RETURN ancestor.id as id,
             coalesce(ancestor.firstName, '') + ' ' + coalesce(ancestor.lastName, '') as name,
             gen as generation
      ORDER BY gen ASC
    `;

    const result = await this.neo4jService.readQuery(query, {
      personId,
      depth: depth || 20,
    });

    return (result.records || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      generation: r.generation,
    }));
  }

  async getDescendants(
    personId: string,
    depth: number = 20,
  ): Promise<{ id: string; name: string; generation: number }[]> {
    if (!this.neo4jService.isConnected()) {
      return [];
    }

    const query = `
      MATCH path = (p:Person {id: $personId})-[:PARENT_OF*1..$depth]->(descendant:Person)
      WITH descendant, length(path) as gen
      RETURN descendant.id as id,
             coalesce(descendant.firstName, '') + ' ' + coalesce(descendant.lastName, '') as name,
             gen as generation
      ORDER BY gen ASC
    `;

    const result = await this.neo4jService.readQuery(query, {
      personId,
      depth: depth || 20,
    });

    return (result.records || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      generation: r.generation,
    }));
  }

  async getFamilyNetwork(personId: string): Promise<{
    parents: { id: string; name: string; type: string }[];
    siblings: { id: string; name: string; type: string }[];
    spouses: { id: string; name: string; status: string }[];
    children: { id: string; name: string }[];
  }> {
    if (!this.neo4jService.isConnected()) {
      return { parents: [], siblings: [], spouses: [], children: [] };
    }

    const query = `
      MATCH (p:Person {id: $personId})
      OPTIONAL MATCH (p)<-[r:PARENT_OF]-(parent:Person)
      WITH p, collect(DISTINCT {id: parent.id, name: coalesce(parent.firstName, '') + ' ' + coalesce(parent.lastName, ''), type: type(r)}) as parentList
      OPTIONAL MATCH (p)-[:PARENT_OF]->(child:Person)
      WITH p, parentList, collect(DISTINCT {id: child.id, name: coalesce(child.firstName, '') + ' ' + coalesce(child.lastName, '')}) as childList
      OPTIONAL MATCH (sibling:Person)-[:PARENT_OF]->(p)
      WHERE sibling.id <> p.id
      WITH p, parentList, childList, collect(DISTINCT {id: sibling.id, name: coalesce(sibling.firstName, '') + ' ' + coalesce(sibling.lastName, ''), type: 'SIBLING'}) as siblingList
      OPTIONAL MATCH (p)-[m:MARRIED_TO|ENGAGED_TO|PARTNER_OF]->(spouse:Person)
      WITH p, parentList, childList, siblingList, collect(DISTINCT {id: spouse.id, name: coalesce(spouse.firstName, '') + ' ' + coalesce(spouse.lastName, ''), status: case type(m) when 'MARRIED_TO' then 'MARRIED' when 'ENGAGED_TO' then 'ENGAGED' when 'PARTNER_OF' then 'PARTNER' else 'UNKNOWN' end}) as spouseList
      RETURN parentList as parents, siblingList as siblings, spouseList as spouses, childList as children
    `;

    const result = await this.neo4jService.readQuery(query, { personId });

    if (!result.records || result.records.length === 0) {
      return { parents: [], siblings: [], spouses: [], children: [] };
    }

    const r = result.records[0];
    return {
      parents: (r.parents || []).filter((x: any) => x.id),
      siblings: (r.siblings || []).filter((x: any) => x.id),
      spouses: (r.spouses || []).filter((x: any) => x.id),
      children: (r.children || []).filter((x: any) => x.id),
    };
  }

  async getAncestorChain(
    personId: string,
    generations: number = 15,
  ): Promise<{ id: string; name: string; generation: number; relationship: string }[]> {
    if (!this.neo4jService.isConnected()) {
      return [];
    }

    const query = `
      MATCH path = (p:Person {id: $personId})<-[:PARENT_OF*1..$generations]-(ancestor:Person)
      WITH ancestor, length(path) as gen
      ORDER BY gen ASC
      RETURN ancestor.id as id,
             coalesce(ancestor.firstName, '') + ' ' + coalesce(ancestor.lastName, '') as name,
             gen as generation
    `;

    const result = await this.neo4jService.readQuery(query, {
      personId,
      generations: generations || 15,
    });

    return (result.records || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      generation: r.generation,
      relationship: this.getGenerationRelationshipLabel(r.generation),
    }));
  }

  private getGenerationRelationshipLabel(generation: number): string {
    if (generation === 1) return 'Parent';
    if (generation === 2) return 'Grandparent';
    if (generation === 3) return 'Great Grandparent';
    if (generation === 4) return '2nd Great Grandparent';
    if (generation === 5) return '3rd Great Grandparent';
    return `${generation - 1}th Great Grandparent`;
  }

  async countGenerations(personId: string): Promise<{
    ancestorGenerations: number;
    descendantGenerations: number;
    totalGenerations: number;
  }> {
    if (!this.neo4jService.isConnected()) {
      return { ancestorGenerations: 0, descendantGenerations: 0, totalGenerations: 0 };
    }

    const query = `
      MATCH (p:Person {id: $personId})
      OPTIONAL MATCH ancPath = (p)<-[:PARENT_OF*]-(ancestor:Person)
      WITH p, max(length(ancPath)) as maxAnc
      OPTIONAL MATCH descPath = (p)-[:PARENT_OF*]->(descendant:Person)
      RETURN coalesce(maxAnc, 0) as ancestorGenerations,
             coalesce(max(length(descPath)), 0) as descendantGenerations
    `;

    const result = await this.neo4jService.readQuery(query, { personId });

    if (!result.records || result.records.length === 0) {
      return { ancestorGenerations: 0, descendantGenerations: 0, totalGenerations: 0 };
    }

    const r = result.records[0];
    const ancGen = r.ancestorGenerations || 0;
    const descGen = r.descendantGenerations || 0;

    return {
      ancestorGenerations: ancGen,
      descendantGenerations: descGen,
      totalGenerations: ancGen + descGen,
    };
  }

  async areConnected(personIdA: string, personIdB: string): Promise<boolean> {
    if (!this.neo4jService.isConnected()) {
      return false;
    }

    const query = `
      MATCH path = shortestPath((p1:Person {id: $personIdA})-[*]-(p2:Person {id: $personIdB}))
      RETURN length(path) as distance
      LIMIT 1
    `;

    const result = await this.neo4jService.readQuery(query, {
      personIdA,
      personIdB,
    });

    return result.records && result.records.length > 0;
  }

  async getPaternalLineage(personId: string, depth?: number): Promise<{ id: string; name: string; generation: number }[]> {
    if (!this.neo4jService.isConnected()) return [];

    const result = await this.treeRepository.getPaternalLineage(personId, depth);
    return (result.records || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      generation: r.generation,
    }));
  }

  async getMaternalLineage(personId: string, depth?: number): Promise<{ id: string; name: string; generation: number }[]> {
    if (!this.neo4jService.isConnected()) return [];

    const result = await this.treeRepository.getMaternalLineage(personId, depth);
    return (result.records || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      generation: r.generation,
    }));
  }

  async getOldestAncestor(personId: string): Promise<{ id: string; name: string; generation: number } | null> {
    if (!this.neo4jService.isConnected()) return null;

    const result = await this.treeRepository.getOldestAncestor(personId);
    if (!result.records || result.records.length === 0) return null;

    const r = result.records[0];
    return { id: r.id, name: r.name, generation: r.generation };
  }

  async getFamilyBranches(ancestorId: string, depth?: number): Promise<{ branchRoot: string; branchName: string; members: { id: string; name: string; generation: number }[] }[]> {
    if (!this.neo4jService.isConnected()) return [];

    const result = await this.treeRepository.getFamilyBranches(ancestorId, depth);
    return (result.records || []).map((r: any) => ({
      branchRoot: r.branchRoot,
      branchName: r.branchName,
      members: (r.members || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        generation: m.generation,
      })),
    }));
  }

  async getGenerationDistribution(familyId: string): Promise<{ level: number; count: number }[]> {
    if (!this.neo4jService.isConnected()) return [];

    const result = await this.treeRepository.getGenerationDistribution(familyId);
    if (!result.records || result.records.length === 0) return [];

    const depthMap = new Map<number, number>();
    for (const r of result.records) {
      const level = (r as any).totalDepth || 0;
      depthMap.set(level, (depthMap.get(level) || 0) + 1);
    }

    return Array.from(depthMap.entries())
      .map(([level, count]) => ({ level, count }))
      .sort((a, b) => a.level - b.level);
  }

  async getAncestorsByLevel(personId: string, level: number): Promise<{ id: string; name: string; generation: number; gender?: string; birthDate?: string; deathDate?: string }[]> {
    if (!this.neo4jService.isConnected()) return [];

    const result = await this.treeRepository.getAncestorsByLevel(personId, level);
    return (result.records || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      generation: r.generation,
      gender: r.gender,
      birthDate: r.birthDate,
      deathDate: r.deathDate,
    }));
  }

  async getAncestorCountByLevel(personId: string, depth?: number): Promise<{ generation: number; count: number }[]> {
    if (!this.neo4jService.isConnected()) return [];

    const result = await this.treeRepository.getAncestorCountByLevel(personId, depth);
    return (result.records || []).map((r: any) => ({
      generation: r.generation,
      count: r.count,
    }));
  }

  async getAllAncestorsWithPaths(personId: string, depth?: number): Promise<{ id: string; name: string; generation: number; gender?: string; pathIds: string[]; relTypes: string[]; pathNames: string[] }[]> {
    if (!this.neo4jService.isConnected()) return [];

    const result = await this.treeRepository.getAllAncestorsWithPaths(personId, depth);
    return (result.records || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      generation: r.generation,
      gender: r.gender,
      pathIds: r.pathIds,
      relTypes: r.relTypes,
      pathNames: r.pathNames,
    }));
  }
}
