import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../neo4j.service';

export interface FormattedPath {
  nodes: {
    id: string;
    name: string;
    gender?: string;
    relationshipToNext?: string;
    relationshipFromPrev?: string;
  }[];
  edges: { from: string; to: string; type: string; label: string }[];
  length: number;
  summary: string;
}

@Injectable()
export class PathService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async formatPath(
    nodeIds: string[],
    relationshipTypes: string[],
  ): Promise<FormattedPath> {
    if (!nodeIds || nodeIds.length === 0) {
      return { nodes: [], edges: [], length: 0, summary: 'No path' };
    }

    const personMap = await this.loadPersonDetails(nodeIds);

    const nodes = nodeIds.map((id, i) => {
      const person = personMap.get(id);
      const node: {
        id: string;
        name: string;
        gender?: string;
        relationshipToNext?: string;
        relationshipFromPrev?: string;
      } = {
        id,
        name: person ? person.name : 'Unknown',
      };

      if (person?.gender) node.gender = person.gender;

      if (i < relationshipTypes.length) {
        const relType = relationshipTypes[i];
        const nextPerson = personMap.get(nodeIds[i + 1]);
        node.relationshipToNext = this.getRelationshipLabel(relType, person?.gender);
        node.relationshipFromPrev = this.getRelationshipLabel(
          this.reverseRelationshipType(relType),
          nextPerson?.gender,
        );
      }

      return node;
    });

    const edges = relationshipTypes.map((type, i) => {
      const fromPerson = personMap.get(nodeIds[i]);
      const toPerson = personMap.get(nodeIds[i + 1]);
      return {
        from: nodeIds[i],
        to: nodeIds[i + 1],
        type,
        label: this.getRelationshipLabel(type, fromPerson?.gender),
      };
    });

    const summary = await this.generatePathSummary(nodeIds, relationshipTypes);

    return {
      nodes,
      edges,
      length: edges.length,
      summary,
    };
  }

  async generatePathSummary(nodeIds: string[], relationshipTypes: string[]): Promise<string> {
    if (!nodeIds || nodeIds.length === 0) return 'No path';

    const personMap = await this.loadPersonDetails(nodeIds);

    const names = nodeIds.map((id) => {
      const person = personMap.get(id);
      return person ? person.name : 'Unknown';
    });

    const parts: string[] = [names[0]];
    for (let i = 0; i < relationshipTypes.length; i++) {
      const label = this.getRelationshipLabel(relationshipTypes[i]);
      parts.push(`→ ${label}`);
      parts.push(`→ ${names[i + 1]}`);
    }

    return parts.join(' ');
  }

  analyzePath(relationshipTypes: string[]): {
    totalSteps: number;
    bloodSteps: number;
    marriageSteps: number;
    adoptionSteps: number;
    stepSteps: number;
    hasMultipleMarriages: boolean;
    hasAdoption: boolean;
    hasStepRelation: boolean;
  } {
    const bloodTypes = new Set(['PARENT_OF', 'CHILD_OF', 'SIBLING_OF', 'HALF_SIBLING_OF']);
    const marriageTypes = new Set(['MARRIED_TO', 'ENGAGED_TO', 'PARTNER_OF', 'DIVORCED_FROM']);
    const adoptionTypes = new Set(['ADOPTED_BY']);
    const stepTypes = new Set(['STEP_PARENT_OF']);

    let bloodSteps = 0;
    let marriageSteps = 0;
    let adoptionSteps = 0;
    let stepSteps = 0;

    for (const type of relationshipTypes) {
      if (bloodTypes.has(type)) bloodSteps++;
      else if (marriageTypes.has(type)) marriageSteps++;
      else if (adoptionTypes.has(type)) adoptionSteps++;
      else if (stepTypes.has(type)) stepSteps++;
    }

    return {
      totalSteps: relationshipTypes.length,
      bloodSteps,
      marriageSteps,
      adoptionSteps,
      stepSteps,
      hasMultipleMarriages: marriageSteps > 1,
      hasAdoption: adoptionSteps > 0,
      hasStepRelation: stepSteps > 0,
    };
  }

  getRelationshipLabel(relType: string, gender?: string): string {
    const upperGender = gender ? gender.toLowerCase() : undefined;
    const isMale = upperGender === 'male' || upperGender === 'm';
    const isFemale = upperGender === 'female' || upperGender === 'f';

    switch (relType) {
      case 'PARENT_OF':
        if (isMale) return 'Father';
        if (isFemale) return 'Mother';
        return 'Parent';
      case 'CHILD_OF':
        if (isMale) return 'Son';
        if (isFemale) return 'Daughter';
        return 'Child';
      case 'MARRIED_TO':
        if (isMale) return 'Husband';
        if (isFemale) return 'Wife';
        return 'Spouse';
      case 'SIBLING_OF':
        if (isMale) return 'Brother';
        if (isFemale) return 'Sister';
        return 'Sibling';
      case 'HALF_SIBLING_OF':
        if (isMale) return 'Half Brother';
        if (isFemale) return 'Half Sister';
        return 'Half Sibling';
      case 'STEP_PARENT_OF':
        if (isMale) return 'Step Father';
        if (isFemale) return 'Step Mother';
        return 'Step Parent';
      case 'ADOPTED_BY':
        if (isMale) return 'Adoptive Father';
        if (isFemale) return 'Adoptive Mother';
        return 'Adoptive Parent';
      case 'ENGAGED_TO':
        return 'Fianc\u00e9';
      case 'PARTNER_OF':
        return 'Partner';
      case 'DIVORCED_FROM':
        return 'Ex-Spouse';
      case 'FOSTER_PARENT_OF':
        if (isMale) return 'Foster Father';
        if (isFemale) return 'Foster Mother';
        return 'Foster Parent';
      case 'GUARDIAN_OF':
        return 'Guardian';
      default:
        return relType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
  }

  reverseRelationshipType(relType: string): string {
    const reverseMap: Record<string, string> = {
      'PARENT_OF': 'CHILD_OF',
      'CHILD_OF': 'PARENT_OF',
      'MARRIED_TO': 'MARRIED_TO',
      'DIVORCED_FROM': 'DIVORCED_FROM',
      'SIBLING_OF': 'SIBLING_OF',
      'HALF_SIBLING_OF': 'HALF_SIBLING_OF',
      'STEP_PARENT_OF': 'STEP_CHILD_OF',
      'STEP_CHILD_OF': 'STEP_PARENT_OF',
      'ADOPTED_BY': 'ADOPTED',
      'FOSTER_PARENT_OF': 'FOSTER_CHILD_OF',
      'ENGAGED_TO': 'ENGAGED_TO',
      'PARTNER_OF': 'PARTNER_OF',
      'GUARDIAN_OF': 'WARD_OF',
    };

    return reverseMap[relType] || relType;
  }

  private async loadPersonDetails(nodeIds: string[]): Promise<Map<string, { name: string; gender?: string }>> {
    if (!this.neo4jService.isConnected() || nodeIds.length === 0) {
      return new Map();
    }

    const query = `
      UNWIND $ids as id
      MATCH (p:Person {id: id})
      RETURN p.id as id,
             coalesce(p.firstName, '') + ' ' + coalesce(p.lastName, '') as name,
             p.gender as gender
    `;

    const result = await this.neo4jService.readQuery(query, { ids: nodeIds });
    const map = new Map<string, { name: string; gender?: string }>();

    for (const record of result.records || []) {
      map.set(record.id, {
        name: record.name,
        gender: record.gender || undefined,
      });
    }

    return map;
  }
}
