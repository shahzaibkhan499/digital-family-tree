import { Injectable } from '@nestjs/common';
import { GraphTraversalService } from './graph-traversal.service';
import { CousinService } from './cousin.service';
import { PathService } from './path.service';
import { Neo4jService } from '../neo4j.service';

export interface RelationshipResult {
  found: boolean;
  relationshipType: string;
  relationshipLabel: string;
  relationshipCategory: 'blood' | 'marriage' | 'adoption' | 'step' | 'foster' | 'legal' | 'unknown';
  degree: number;
  removal: number;
  generationDifference: number;
  nearestCommonAncestor?: {
    id: string;
    name: string;
    distanceFromA: number;
    distanceFromB: number;
  };
  path: {
    nodes: { id: string; name: string; gender?: string }[];
    edges: { fromId: string; toId: string; type: string; label: string }[];
    length: number;
  };
  side: 'maternal' | 'paternal' | 'both' | 'unknown';
  confidence: number;
}

@Injectable()
export class RelationshipService {
  constructor(
    private readonly graphTraversal: GraphTraversalService,
    private readonly cousinService: CousinService,
    private readonly pathService: PathService,
    private readonly neo4jService: Neo4jService,
  ) {}

  async calculateRelationship(
    personIdA: string,
    personIdB: string,
    maxDepth: number = 20,
  ): Promise<RelationshipResult> {
    if (personIdA === personIdB) {
      return {
        found: true,
        relationshipType: 'SELF',
        relationshipLabel: 'Self',
        relationshipCategory: 'blood',
        degree: 0,
        removal: 0,
        generationDifference: 0,
        path: { nodes: [], edges: [], length: 0 },
        side: 'both',
        confidence: 100,
      };
    }

    if (!this.neo4jService.isConnected()) {
      return {
        found: false,
        relationshipType: 'UNKNOWN',
        relationshipLabel: 'Unknown',
        relationshipCategory: 'unknown',
        degree: 0,
        removal: 0,
        generationDifference: 0,
        path: { nodes: [], edges: [], length: 0 },
        side: 'unknown',
        confidence: 0,
      };
    }

    const shortestPath = await this.graphTraversal.findShortestPath(personIdA, personIdB, maxDepth);

    if (!shortestPath.found || shortestPath.nodeIds.length < 2) {
      return {
        found: false,
        relationshipType: 'UNKNOWN',
        relationshipLabel: 'Unknown',
        relationshipCategory: 'unknown',
        degree: 0,
        removal: 0,
        generationDifference: 0,
        path: { nodes: [], edges: [], length: 0 },
        side: 'unknown',
        confidence: 0,
      };
    }

    const ncaResult = await this.graphTraversal.findNearestCommonAncestor(personIdA, personIdB, maxDepth);

    const idxA = ncaResult.found && ncaResult.ancestor
      ? 0
      : -1;

    let dA: number;
    let dB: number;

    if (ncaResult.found && ncaResult.ancestor) {
      dA = ncaResult.ancestor.distanceFromA;
      dB = ncaResult.ancestor.distanceFromB;
    } else {
      dA = 0;
      dB = shortestPath.distance;
    }

    const classification = await this.classifyRelationship(
      dA,
      dB,
      shortestPath.relationshipTypes,
      shortestPath.nodeIds,
    );

    const formattedPath = await this.pathService.formatPath(
      shortestPath.nodeIds,
      shortestPath.relationshipTypes,
    );

    return {
      found: true,
      relationshipType: classification.relationshipType,
      relationshipLabel: classification.relationshipLabel,
      relationshipCategory: classification.category,
      degree: classification.degree,
      removal: classification.removal,
      generationDifference: classification.removal,
      nearestCommonAncestor: ncaResult.found ? ncaResult.ancestor : undefined,
      path: {
        nodes: formattedPath.nodes.map(n => ({
          id: n.id,
          name: n.name,
          gender: n.gender,
        })),
        edges: formattedPath.edges.map(e => ({
          fromId: e.from,
          toId: e.to,
          type: e.type,
          label: e.label,
        })),
        length: formattedPath.length,
      },
      side: classification.side,
      confidence: classification.confidence,
    };
  }

  async getPersonRelationships(personId: string): Promise<{
    parents: { person: any; type: string; label: string }[];
    siblings: { person: any; type: string; label: string }[];
    spouses: { person: any; status: string; label: string }[];
    children: { person: any; type: string; label: string }[];
  }> {
    if (!this.neo4jService.isConnected()) {
      return { parents: [], siblings: [], spouses: [], children: [] };
    }

    const query = `
      MATCH (p:Person {id: $personId})
      OPTIONAL MATCH (p)<-[r:PARENT_OF]-(parent:Person)
      WITH p, collect(DISTINCT {
        id: parent.id,
        firstName: parent.firstName,
        lastName: parent.lastName,
        gender: parent.gender,
        type: type(r)
      }) as parentData
      OPTIONAL MATCH (p)-[:PARENT_OF]->(child:Person)
      WITH p, parentData, collect(DISTINCT {
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
        gender: child.gender
      }) as childData
      OPTIONAL MATCH (sibling:Person)-[:PARENT_OF]->(p)
      WHERE sibling.id <> p.id
      WITH p, parentData, childData, collect(DISTINCT {
        id: sibling.id,
        firstName: sibling.firstName,
        lastName: sibling.lastName,
        gender: sibling.gender
      }) as siblingData
      OPTIONAL MATCH (p)-[m:MARRIED_TO|ENGAGED_TO|PARTNER_OF]->(spouse:Person)
      WITH p, parentData, childData, siblingData, collect(DISTINCT {
        id: spouse.id,
        firstName: spouse.firstName,
        lastName: spouse.lastName,
        gender: spouse.gender,
        status: case type(m)
          when 'MARRIED_TO' then 'MARRIED'
          when 'ENGAGED_TO' then 'ENGAGED'
          when 'PARTNER_OF' then 'PARTNER'
          else 'UNKNOWN'
        end
      }) as spouseData
      RETURN parentData, siblingData, spouseData, childData
    `;

    const result = await this.neo4jService.readQuery(query, { personId });

    if (!result.records || result.records.length === 0) {
      return { parents: [], siblings: [], spouses: [], children: [] };
    }

    const r = result.records[0];
    const getName = (rec: any) =>
      `${rec.firstName || ''} ${rec.lastName || ''}`.trim() || 'Unknown';

    const mapParent = (rec: any) => ({
      person: { id: rec.id, name: getName(rec), gender: rec.gender },
      type: rec.type || 'PARENT_OF',
      label: this.pathService.getRelationshipLabel(rec.type || 'PARENT_OF', rec.gender),
    });

    const mapSibling = (rec: any) => ({
      person: { id: rec.id, name: getName(rec), gender: rec.gender },
      type: 'SIBLING',
      label: this.pathService.getRelationshipLabel('SIBLING_OF', rec.gender),
    });

    const mapSpouse = (rec: any) => ({
      person: { id: rec.id, name: getName(rec), gender: rec.gender },
      status: rec.status || 'UNKNOWN',
      label: this.pathService.getRelationshipLabel('MARRIED_TO', rec.gender),
    });

    const mapChild = (rec: any) => ({
      person: { id: rec.id, name: getName(rec), gender: rec.gender },
      type: 'CHILD_OF',
      label: this.pathService.getRelationshipLabel('CHILD_OF', rec.gender),
    });

    return {
      parents: (r.parentData || []).filter((x: any) => x.id).map(mapParent),
      siblings: (r.siblingData || []).filter((x: any) => x.id).map(mapSibling),
      spouses: (r.spouseData || []).filter((x: any) => x.id).map(mapSpouse),
      children: (r.childData || []).filter((x: any) => x.id).map(mapChild),
    };
  }

  private async classifyRelationship(
    dA: number,
    dB: number,
    pathEdgeTypes: string[],
    pathNodeIds: string[],
  ): Promise<{
    relationshipType: string;
    relationshipLabel: string;
    degree: number;
    removal: number;
    side: 'maternal' | 'paternal' | 'both' | 'unknown';
    category: 'blood' | 'marriage' | 'adoption' | 'step' | 'foster' | 'legal' | 'unknown';
    confidence: number;
  }> {
    const side = await this.determineSide(pathNodeIds);
    const category = this.determineCategory(pathEdgeTypes);
    const confidence = this.calculateConfidence(pathEdgeTypes, dA, dB);

    if (dA === 0) {
      const label = this.getAncestorLabel(dB, 'ancestor');
      return {
        relationshipType: this.getAncestorType(dB, 'ancestor'),
        relationshipLabel: label,
        degree: 0,
        removal: dB - 1,
        side,
        category,
        confidence,
      };
    }

    if (dB === 0) {
      const label = this.getAncestorLabel(dA, 'descendant');
      return {
        relationshipType: this.getAncestorType(dA, 'descendant'),
        relationshipLabel: label,
        degree: 0,
        removal: dA - 1,
        side,
        category,
        confidence,
      };
    }

    if (dA === 1 && dB === 1) {
      return {
        relationshipType: 'SIBLING',
        relationshipLabel: 'Sibling',
        degree: 0,
        removal: 0,
        side,
        category,
        confidence,
      };
    }

    if (dA === 1 && dB >= 2) {
      const removal = dB - 1;
      const prefix = this.getGreatPrefix(removal);
      return {
        relationshipType: 'AVUNCULAR',
        relationshipLabel: `${prefix}Aunt/Uncle`,
        degree: 0,
        removal,
        side,
        category,
        confidence,
      };
    }

    if (dB === 1 && dA >= 2) {
      const removal = dA - 1;
      const prefix = this.getGreatPrefix(removal);
      return {
        relationshipType: 'AVUNCULAR',
        relationshipLabel: `${prefix}Niece/Nephew`,
        degree: 0,
        removal,
        side,
        category,
        confidence,
      };
    }

    if (dA > 1 && dB > 1) {
      const degree = this.cousinService.calculateDegree(dA, dB);
      const removal = this.cousinService.calculateRemoval(dA, dB);
      const label = this.cousinService.getCousinLabel(degree, removal);

      return {
        relationshipType: 'COUSIN',
        relationshipLabel: label,
        degree,
        removal,
        side,
        category,
        confidence,
      };
    }

    return {
      relationshipType: 'OTHER',
      relationshipLabel: 'Relative',
      degree: 0,
      removal: 0,
      side,
      category,
      confidence: 50,
    };
  }

  private async determineSide(pathNodeIds: string[]): Promise<'maternal' | 'paternal' | 'both' | 'unknown'> {
    if (pathNodeIds.length < 2) return 'both';

    const firstStep = pathNodeIds[1];

    if (!this.neo4jService.isConnected()) return 'unknown';

    const query = `
      MATCH (p:Person {id: $personId})
      RETURN p.gender as gender
    `;
    const result = await this.neo4jService.readQuery(query, { personId: firstStep });

    if (!result || !result.records || result.records.length === 0) return 'unknown';

    const gender = (result.records[0].gender || '').toLowerCase();
    if (gender === 'female' || gender === 'f') return 'maternal';
    if (gender === 'male' || gender === 'm') return 'paternal';

    return 'unknown';
  }

  private determineCategory(edgeTypes: string[]): 'blood' | 'marriage' | 'adoption' | 'step' | 'foster' | 'legal' | 'unknown' {
    if (edgeTypes.length === 0) return 'unknown';

    for (const type of edgeTypes) {
      const upper = type.toUpperCase();
      if (upper === 'ADOPTED_BY') return 'adoption';
      if (upper === 'STEP_PARENT_OF') return 'step';
      if (upper === 'FOSTER_PARENT_OF') return 'foster';
      if (upper === 'GUARDIAN_OF') return 'legal';
    }

    for (const type of edgeTypes) {
      const upper = type.toUpperCase();
      if (['MARRIED_TO', 'ENGAGED_TO', 'PARTNER_OF', 'DIVORCED_FROM'].includes(upper)) {
        return 'marriage';
      }
    }

    const bloodTypes = new Set(['PARENT_OF', 'CHILD_OF', 'SIBLING_OF', 'HALF_SIBLING_OF']);
    for (const type of edgeTypes) {
      if (bloodTypes.has(type.toUpperCase())) return 'blood';
    }

    return 'unknown';
  }

  private calculateConfidence(edgeTypes: string[], dA: number, dB: number): number {
    if (dA === 0 || dB === 0) return 100;
    if (dA === 1 && dB === 1) return 100;

    let confidence = 100;

    for (const type of edgeTypes) {
      const upper = type.toUpperCase();
      if (upper === 'ADOPTED_BY') confidence -= 10;
      if (upper === 'STEP_PARENT_OF') confidence -= 15;
      if (upper === 'FOSTER_PARENT_OF') confidence -= 20;
      if (['MARRIED_TO', 'ENGAGED_TO', 'PARTNER_OF'].includes(upper)) confidence -= 5;
    }

    const totalSteps = dA + dB;
    if (totalSteps > 5) confidence -= 5;
    if (totalSteps > 10) confidence -= 10;

    return Math.max(0, confidence);
  }

  private getAncestorLabel(distance: number, direction: 'ancestor' | 'descendant'): string {
    if (distance === 1) return direction === 'ancestor' ? 'Parent' : 'Child';
    if (distance === 2) return direction === 'ancestor' ? 'Grandparent' : 'Grandchild';
    if (distance === 3) return direction === 'ancestor' ? 'Great Grandparent' : 'Great Grandchild';

    const greatCount = distance - 2;
    const prefix = this.getOrdinalPrefix(greatCount);
    return direction === 'ancestor'
      ? `${prefix} Great Grandparent`
      : `${prefix} Great Grandchild`;
  }

  private getAncestorType(distance: number, direction: 'ancestor' | 'descendant'): string {
    if (distance === 1) return direction === 'ancestor' ? 'PARENT' : 'CHILD';
    if (distance === 2) return direction === 'ancestor' ? 'GRANDPARENT' : 'GRANDCHILD';
    return direction === 'ancestor' ? 'GREAT_GRANDPARENT' : 'GREAT_GRANDCHILD';
  }

  private getGreatPrefix(removal: number): string {
    if (removal <= 1) return '';
    if (removal === 2) return 'Great ';
    if (removal === 3) return 'Great Great ';
    return `${removal - 1}x Great `;
  }

  private getOrdinalPrefix(n: number): string {
    if (n <= 1) return '';
    if (n === 2) return '2nd';
    if (n === 3) return '3rd';
    return `${n}th`;
  }

  private async determineSideFromPath(pathNodeIds: string[]): Promise<'maternal' | 'paternal' | 'both' | 'unknown'> {
    if (pathNodeIds.length < 2) return 'both';
    const firstStep = pathNodeIds[1];

    if (!this.neo4jService.isConnected()) return 'unknown';

    const query = `
      MATCH (p:Person {id: $personId})
      RETURN p.gender as gender
    `;

    const result = await this.neo4jService.readQuery(query, { personId: firstStep });

    if (!result.records || result.records.length === 0) return 'unknown';

    const gender = (result.records[0].gender || '').toLowerCase();
    if (gender === 'female' || gender === 'f') return 'maternal';
    if (gender === 'male' || gender === 'm') return 'paternal';

    return 'unknown';
  }
}
