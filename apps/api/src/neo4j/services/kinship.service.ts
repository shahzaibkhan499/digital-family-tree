import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../neo4j.service';
import { GraphTraversalService } from './graph-traversal.service';
import { RelationshipService } from './relationship.service';
import { CousinService } from './cousin.service';
import { AncestorService } from './ancestor.service';
import { PathService } from './path.service';
import { Neo4jQueryCache } from './cache.service';
import { KinshipResult } from '../neo4j.types';

interface ConfidenceInput {
  relationshipType: string;
  pathEdgeTypes: string[];
  dA: number;
  dB: number;
  marriageCount: number;
  hasAdoption: boolean;
  hasStep: boolean;
  hasFoster: boolean;
}

@Injectable()
export class KinshipService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly graphTraversalService: GraphTraversalService,
    private readonly relationshipService: RelationshipService,
    private readonly cousinService: CousinService,
    private readonly ancestorService: AncestorService,
    private readonly pathService: PathService,
    private readonly cache: Neo4jQueryCache,
  ) {}

  async calculateKinship(personIdA: string, personIdB: string, depth: number = 20): Promise<KinshipResult> {
    const relResult = await this.relationshipService.calculateRelationship(personIdA, personIdB, depth);

    if (!relResult.found) {
      return {
        found: false,
        relationship: {
          type: 'UNKNOWN',
          label: 'Unknown',
          category: 'unknown',
          degree: 0,
          removal: 0,
          generationDifference: 0,
          confidence: 0,
        },
        lineage: { side: 'unknown', maternalAncestors: 0, paternalAncestors: 0 },
        path: { nodes: [], edges: [], length: 0, summary: 'No connection found' },
        generations: {
          personAGeneration: 0,
          personBGeneration: 0,
          commonAncestorGeneration: 0,
          totalGenerationsFromA: 0,
          totalGenerationsFromB: 0,
        },
      };
    }

    const formattedPath = await this.pathService.formatPath(
      relResult.path.nodes.map(n => n.id),
      relResult.path.edges.map(e => e.type),
    );

    const commonAncestor = relResult.nearestCommonAncestor ? {
      id: relResult.nearestCommonAncestor.id,
      name: relResult.nearestCommonAncestor.name,
      generationA: relResult.nearestCommonAncestor.distanceFromA,
      generationB: relResult.nearestCommonAncestor.distanceFromB,
      path: [],
    } : undefined;

    const generationDifference = Math.abs(relResult.generationDifference);

    return {
      found: true,
      relationship: {
        type: relResult.relationshipType,
        label: relResult.relationshipLabel,
        category: relResult.relationshipCategory,
        degree: relResult.degree,
        removal: relResult.removal,
        generationDifference,
        confidence: relResult.confidence,
      },
      commonAncestor,
      lineage: {
        side: relResult.side,
        maternalAncestors: relResult.side === 'maternal' ? 1 : 0,
        paternalAncestors: relResult.side === 'paternal' ? 1 : 0,
      },
      path: {
        nodes: formattedPath.nodes.map(n => ({ id: n.id, name: n.name, gender: n.gender })),
        edges: formattedPath.edges.map(e => ({ from: e.from, to: e.to, type: e.type, label: e.label })),
        length: formattedPath.length,
        summary: formattedPath.summary,
      },
      generations: {
        personAGeneration: 0,
        personBGeneration: generationDifference,
        commonAncestorGeneration: commonAncestor ? Math.min(commonAncestor.generationA, commonAncestor.generationB) : 0,
        totalGenerationsFromA: relResult.path.length,
        totalGenerationsFromB: relResult.path.length,
      },
    };
  }

  calculateConfidenceScore(input: ConfidenceInput): number {
    let confidence: number;

    if (input.dA === 0 && input.dB === 1) {
      confidence = 100;
    } else if (input.dA === 1 && input.dB === 0) {
      confidence = 100;
    } else if (input.dA === 1 && input.dB === 1) {
      confidence = 95;
    } else if ((input.dA === 1 && input.dB === 2) || (input.dA === 2 && input.dB === 1)) {
      confidence = 90;
    } else if (input.dA > 1 && input.dB > 1) {
      const degree = this.cousinService.calculateDegree(input.dA, input.dB);
      if (degree === 1) confidence = 90;
      else if (degree === 2) confidence = 80;
      else if (degree === 3) confidence = 70;
      else if (degree === 4) confidence = 60;
      else confidence = 55;
    } else {
      confidence = input.dA === 0 || input.dB === 0 ? 100 : 85;
    }

    for (const type of input.pathEdgeTypes) {
      const upper = type.toUpperCase();
      if (upper === 'PARENT_OF' || upper === 'CHILD_OF' || upper === 'SIBLING_OF' || upper === 'HALF_SIBLING_OF') {
        continue;
      }
      if (['MARRIED_TO', 'ENGAGED_TO', 'PARTNER_OF', 'DIVORCED_FROM'].includes(upper)) {
        confidence -= 10;
      }
      if (upper === 'STEP_PARENT_OF' || upper === 'STEP_CHILD_OF') {
        confidence -= 15;
      }
      if (upper === 'ADOPTED_BY') {
        confidence -= 5;
      }
      if (upper === 'FOSTER_PARENT_OF') {
        confidence -= 20;
      }
      if (upper === 'GUARDIAN_OF') {
        confidence -= 20;
      }
    }

    if (input.marriageCount > 1) {
      confidence -= (input.marriageCount - 1) * 5;
    }

    const totalSteps = input.dA + input.dB;
    if (totalSteps > 15) confidence -= 5;
    if (totalSteps > 25) confidence -= 10;

    return Math.max(10, Math.min(100, Math.round(confidence)));
  }
}
