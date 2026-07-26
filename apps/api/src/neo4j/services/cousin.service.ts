import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../neo4j.service';

export interface CousinCalculation {
  degree: number;
  removal: number;
  label: string;
  commonAncestor?: {
    id: string;
    name: string;
    distanceToA: number;
    distanceToB: number;
  };
}

@Injectable()
export class CousinService {
  constructor(private readonly neo4jService: Neo4jService) {}

  calculateCousin(
    distanceFromCAtoA: number,
    distanceFromCAtoB: number,
    commonAncestor?: { id: string; name: string },
  ): CousinCalculation {
    const degree = this.calculateDegree(distanceFromCAtoA, distanceFromCAtoB);
    const removal = this.calculateRemoval(distanceFromCAtoA, distanceFromCAtoB);
    const label = this.getCousinLabel(degree, removal);

    const result: CousinCalculation = { degree, removal, label };

    if (commonAncestor) {
      result.commonAncestor = {
        id: commonAncestor.id,
        name: commonAncestor.name,
        distanceToA: distanceFromCAtoA,
        distanceToB: distanceFromCAtoB,
      };
    }

    return result;
  }

  getCousinLabel(degree: number, removal: number): string {
    if (degree < 1) return 'Sibling';

    const degreeStr = this.ordinal(degree) + ' Cousin';
    const removalStr = this.getRemovalSuffix(removal);

    return degreeStr + removalStr;
  }

  ordinal(n: number): string {
    if (n <= 0) return '0';
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  private getRemovalSuffix(removal: number): string {
    if (removal === 0) return '';
    if (removal === 1) return ' Once Removed';
    if (removal === 2) return ' Twice Removed';
    return ` ${removal} Times Removed`;
  }

  async checkSibling(
    personIdA: string,
    personIdB: string,
  ): Promise<{
    isSibling: boolean;
    type: 'full' | 'half' | 'step' | 'none';
    sharedParents: { id: string; name: string }[];
  }> {
    if (!this.neo4jService.isConnected()) {
      return { isSibling: false, type: 'none', sharedParents: [] };
    }

    const query = `
      MATCH (a:Person {id: $personIdA})<-[:PARENT_OF]-(parent:Person)-[:PARENT_OF]->(b:Person {id: $personIdB})
      WHERE a.id <> b.id
      RETURN parent.id as id,
             coalesce(parent.firstName, '') + ' ' + coalesce(parent.lastName, '') as name
    `;

    const result = await this.neo4jService.readQuery(query, {
      personIdA,
      personIdB,
    });

    const sharedParents = (result.records || []).map((r: any) => ({
      id: r.id,
      name: r.name,
    }));

    if (sharedParents.length === 0) {
      return { isSibling: false, type: 'none', sharedParents: [] };
    }

    return {
      isSibling: true,
      type: sharedParents.length >= 2 ? 'full' : 'half',
      sharedParents,
    };
  }

  calculateDegree(dA: number, dB: number): number {
    return Math.min(dA, dB) - 1;
  }

  calculateRemoval(dA: number, dB: number): number {
    return Math.abs(dA - dB);
  }
}
