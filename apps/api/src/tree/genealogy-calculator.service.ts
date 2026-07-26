import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TreeNode } from './tree.types';

export interface RelationshipCalculationResult {
  found: boolean;
  relationshipType: string;
  relationshipLabel: string;
  degree: number;
  removal: number;
  commonAncestor?: {
    id: string;
    name: string;
  };
  path: {
    id: string;
    name: string;
    relationship: string;
  }[];
  pathLength: number;
  side: 'maternal' | 'paternal' | 'both' | 'unknown';
  nature: 'blood' | 'marriage' | 'adoption' | 'step' | 'foster' | 'legal' | 'unknown';
}

export interface GenealogyPerson {
  id: string;
  firstName: string;
  lastName: string;
  gender?: string;
  birthDate?: Date;
  deathDate?: Date;
  avatar?: string;
  occupation?: string;
  country?: string;
  isVerified: boolean;
}

export interface GenealogyMarriage {
  id: string;
  husbandId: string;
  wifeId: string;
  marriageDate?: Date;
  marriageLocation?: string;
  endedDate?: Date;
  status: 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'SEPARATED' | 'UNKNOWN';
  isCommonLaw?: boolean;
}

export interface GenealogyRelationship {
  id: string;
  fromId: string;
  toId: string;
  fromType: string;
  toType: string;
  type: string;
}

export interface TreeStatistics {
  totalPersons: number;
  totalMarriages: number;
  totalRelationships: number;
  livingCount: number;
  deceasedCount: number;
  maleCount: number;
  femaleCount: number;
  averageAge: number;
  oldestMember?: { id: string; name: string; age: number };
  youngestMember?: { id: string; name: string; age: number };
  generationCount: number;
  membersByGeneration: { generation: number; count: number }[];
  countryCount: number;
  occupationCount: number;
  countries: string[];
  occupations: string[];
  marriages: {
    total: number;
    current: number;
    divorced: number;
    widowed: number;
  };
  multipleMarriages: number;
  inbreeding: number;
}

const PARENT_FIGURE_TYPES = new Set([
  'FATHER', 'MOTHER', 'PARENT', 'GRANDFATHER', 'GRANDMOTHER', 'GRANDPARENT', 'GREAT_GRANDPARENT',
  'STEP_FATHER', 'STEP_MOTHER', 'STEP_PARENT',
  'ADOPTIVE_FATHER', 'ADOPTIVE_MOTHER', 'ADOPTIVE_PARENT',
  'FOSTER_FATHER', 'FOSTER_MOTHER', 'FOSTER_PARENT',
  'LEGAL_FATHER', 'LEGAL_MOTHER', 'LEGAL_GUARDIAN', 'GUARDIAN',
  'SURROGATE', 'SURROGATE_MOTHER',
  'FATHER_IN_LAW', 'MOTHER_IN_LAW',
  'GODFATHER', 'GODMOTHER',
]);

const CHILD_FIGURE_TYPES = new Set([
  'SON', 'DAUGHTER', 'CHILD', 'GRANDSON', 'GRANDDAUGHTER', 'GRANDCHILD', 'GREAT_GRANDCHILD',
  'STEP_SON', 'STEP_DAUGHTER', 'STEP_CHILD',
  'ADOPTIVE_SON', 'ADOPTIVE_DAUGHTER', 'ADOPTIVE_CHILD',
  'FOSTER_SON', 'FOSTER_DAUGHTER', 'FOSTER_CHILD',
  'GODSON', 'GODDAUGHTER',
  'SURROGATE_CHILD', 'WARD',
  'SON_IN_LAW', 'DAUGHTER_IN_LAW',
  'NEPHEW', 'NIECE',
]);

const SPOUSE_TYPES = new Set([
  'HUSBAND', 'WIFE', 'SPOUSE', 'EX_SPOUSE', 'PARTNER',
  'FIANCÉ', 'FIANCÉE', 'DIVORCED', 'DIVORCED_FROM',
  'WIDOW', 'WIDOWER', 'EX_HUSBAND', 'EX_WIFE',
]);

const SIBLING_TYPES = new Set([
  'BROTHER', 'SISTER', 'HALF_BROTHER', 'HALF_SISTER', 'HALF_SIBLING',
  'STEP_BROTHER', 'STEP_SISTER', 'STEP_SIBLING',
  'TWIN', 'TRIPLET', 'QUADRUPLET',
]);

const ADOPTION_TYPES = new Set([
  'ADOPTIVE_FATHER', 'ADOPTIVE_MOTHER', 'ADOPTIVE_PARENT',
  'ADOPTIVE_SON', 'ADOPTIVE_DAUGHTER', 'ADOPTIVE_CHILD',
]);

const STEP_TYPES = new Set([
  'STEP_FATHER', 'STEP_MOTHER', 'STEP_PARENT',
  'STEP_SON', 'STEP_DAUGHTER', 'STEP_CHILD',
  'STEP_BROTHER', 'STEP_SISTER', 'STEP_SIBLING',
]);

const FOSTER_TYPES = new Set([
  'FOSTER_FATHER', 'FOSTER_MOTHER', 'FOSTER_PARENT',
  'FOSTER_SON', 'FOSTER_DAUGHTER', 'FOSTER_CHILD',
]);

const LEGAL_TYPES = new Set([
  'GUARDIAN', 'WARD', 'LEGAL_FATHER', 'LEGAL_MOTHER', 'LEGAL_GUARDIAN',
]);

function getParentIdsFromRels(rels: { fromMemberId: string; toMemberId: string; type: string }[], memberId: string): string[] {
  const parents: string[] = [];
  for (const r of rels) {
    const t = r.type.toUpperCase();
    if (PARENT_FIGURE_TYPES.has(t) && r.toMemberId === memberId) {
      parents.push(r.fromMemberId);
    } else if (CHILD_FIGURE_TYPES.has(t) && r.fromMemberId === memberId) {
      parents.push(r.toMemberId);
    }
  }
  return parents;
}

function getChildIdsFromRels(rels: { fromMemberId: string; toMemberId: string; type: string }[], memberId: string): string[] {
  const children: string[] = [];
  for (const r of rels) {
    const t = r.type.toUpperCase();
    if (PARENT_FIGURE_TYPES.has(t) && r.fromMemberId === memberId) {
      children.push(r.toMemberId);
    } else if (CHILD_FIGURE_TYPES.has(t) && r.toMemberId === memberId) {
      children.push(r.fromMemberId);
    }
  }
  return children;
}

function getSpouseIdsFromRels(rels: { fromMemberId: string; toMemberId: string; type: string }[], memberId: string): string[] {
  const spouses: string[] = [];
  for (const r of rels) {
    const t = r.type.toUpperCase();
    if (SPOUSE_TYPES.has(t)) {
      if (r.fromMemberId === memberId) spouses.push(r.toMemberId);
      if (r.toMemberId === memberId) spouses.push(r.fromMemberId);
    }
  }
  return [...new Set(spouses)];
}

@Injectable()
export class GenealogyCalculatorService {
  constructor(private prisma: PrismaService) {}

  async calculateRelationship(
    memberIdA: string,
    memberIdB: string,
    maxDepth: number = 20,
  ): Promise<RelationshipCalculationResult> {
    if (memberIdA === memberIdB) {
      return {
        found: true,
        relationshipType: 'SELF',
        relationshipLabel: 'Self',
        degree: 0,
        removal: 0,
        path: [],
        pathLength: 0,
        side: 'both',
        nature: 'blood',
      };
    }

    const [memberA, memberB] = await Promise.all([
      this.prisma.familyMember.findUnique({ where: { id: memberIdA } }),
      this.prisma.familyMember.findUnique({ where: { id: memberIdB } }),
    ]);
    if (!memberA) throw new NotFoundException(`Member ${memberIdA} not found`);
    if (!memberB) throw new NotFoundException(`Member ${memberIdB} not found`);

    const getName = (m: { firstName: string; lastName?: string | null }) =>
      `${m.firstName} ${m.lastName || ''}`.trim();

    const adjacencyCache = new Map<string, Array<{ id: string; type: string }>>();
    const loadAdjacencies = async (memberId: string) => {
      if (adjacencyCache.has(memberId)) return;
      const rels = await this.prisma.relationship.findMany({
        where: {
          OR: [{ fromMemberId: memberId }, { toMemberId: memberId }],
        },
        take: 200,
      });
      adjacencyCache.set(
        memberId,
        rels.map((r) => ({
          id: r.fromMemberId === memberId ? r.toMemberId : r.fromMemberId,
          type: r.type,
        })),
      );
    };

    const parentA = new Map<string, string | null>();
    const parentB = new Map<string, string | null>();
    const relToA = new Map<string, string>();
    const relToB = new Map<string, string>();

    parentA.set(memberIdA, null);
    parentB.set(memberIdB, null);

    let queueA = [memberIdA];
    let queueB = [memberIdB];
    const visitedA = new Set<string>([memberIdA]);
    const visitedB = new Set<string>([memberIdB]);
    let meetingNode: string | null = null;
    let depthCount = 0;

    while (queueA.length > 0 && queueB.length > 0 && !meetingNode && depthCount < maxDepth) {
      const nextA: string[] = [];
      for (const node of queueA) {
        await loadAdjacencies(node);
        const neighbors = adjacencyCache.get(node) || [];
        for (const nb of neighbors) {
          if (!visitedA.has(nb.id)) {
            visitedA.add(nb.id);
            parentA.set(nb.id, node);
            relToA.set(nb.id, nb.type);
            nextA.push(nb.id);
            if (visitedB.has(nb.id)) {
              meetingNode = nb.id;
              break;
            }
          }
        }
        if (meetingNode) break;
      }
      if (meetingNode) break;

      const nextB: string[] = [];
      for (const node of queueB) {
        await loadAdjacencies(node);
        const neighbors = adjacencyCache.get(node) || [];
        for (const nb of neighbors) {
          if (!visitedB.has(nb.id)) {
            visitedB.add(nb.id);
            parentB.set(nb.id, node);
            relToB.set(nb.id, nb.type);
            nextB.push(nb.id);
            if (visitedA.has(nb.id)) {
              meetingNode = nb.id;
              break;
            }
          }
        }
        if (meetingNode) break;
      }
      queueA = nextA;
      queueB = nextB;
      depthCount++;
    }

    if (!meetingNode) {
      return {
        found: false,
        relationshipType: 'UNKNOWN',
        relationshipLabel: 'Unknown',
        degree: 0,
        removal: 0,
        path: [],
        pathLength: 0,
        side: 'unknown',
        nature: 'unknown',
      };
    }

    const pathA: string[] = [];
    let cur: string | null | undefined = meetingNode;
    while (cur !== null && cur !== undefined) {
      pathA.unshift(cur);
      cur = parentA.get(cur);
    }

    const pathB: string[] = [];
    cur = parentB.get(meetingNode);
    while (cur !== null && cur !== undefined) {
      pathB.push(cur);
      cur = parentB.get(cur);
    }

    const fullPath = [...pathA, ...pathB];
    const allIds = [...new Set(fullPath)];
    const members = await this.prisma.familyMember.findMany({
      where: { id: { in: allIds } },
    });
    const memberMap = new Map(members.map((m) => [m.id, m]));

    const pathNodes = fullPath.map((id, i) => {
      const m = memberMap.get(id);
      const rel = i > 0 ? relToA.get(id) || relToB.get(id) || '' : '';
      return {
        id,
        name: m ? getName(m) : 'Unknown',
        relationship: rel,
      };
    });

    const idxA = fullPath.indexOf(memberIdA);
    const idxB = fullPath.indexOf(memberIdB);
    const meetingIdx = fullPath.indexOf(meetingNode);
    const dA = meetingIdx - idxA;
    const dB = idxB - meetingIdx;

    const classification = this.classifyRelationship(dA, dB, fullPath, adjacencyCache, memberMap);

    return {
      found: true,
      ...classification,
      path: pathNodes,
      pathLength: fullPath.length - 1,
      commonAncestor:
        meetingNode !== memberIdA && meetingNode !== memberIdB
          ? {
              id: meetingNode,
              name: memberMap.get(meetingNode)
                ? getName(memberMap.get(meetingNode)!)
                : 'Unknown',
            }
          : undefined,
    };
  }

  private classifyRelationship(
    dA: number,
    dB: number,
    fullPath: string[],
    adjacencyCache: Map<string, Array<{ id: string; type: string }>>,
    memberMap: Map<string, { firstName: string; lastName?: string | null; gender?: string | null }>,
  ): {
    relationshipType: string;
    relationshipLabel: string;
    degree: number;
    removal: number;
    side: 'maternal' | 'paternal' | 'both' | 'unknown';
    nature: 'blood' | 'marriage' | 'adoption' | 'step' | 'foster' | 'legal' | 'unknown';
  } {
    const side = this.determineSide(fullPath, adjacencyCache, memberMap);
    const nature = this.determineNature(fullPath, adjacencyCache);

    if (dA === 0) {
      const labels: Record<number, string> = {
        1: 'Child', 2: 'Grandchild', 3: 'Great Grandchild',
        4: '2nd Great Grandchild', 5: '3rd Great Grandchild',
      };
      const label = labels[dB] || `${dB - 1}th Great Grandchild`;
      const type = dB === 1 ? 'CHILD' : dB === 2 ? 'GRANDCHILD' : 'GREAT_GRANDCHILD';
      return { relationshipType: type, relationshipLabel: label, degree: 0, removal: dB - 1, side, nature };
    }
    if (dB === 0) {
      const labels: Record<number, string> = {
        1: 'Parent', 2: 'Grandparent', 3: 'Great Grandparent',
        4: '2nd Great Grandparent', 5: '3rd Great Grandparent',
      };
      const label = labels[dA] || `${dA - 1}th Great Grandparent`;
      const type = dA === 1 ? 'PARENT' : dA === 2 ? 'GRANDPARENT' : 'GREAT_GRANDPARENT';
      return { relationshipType: type, relationshipLabel: label, degree: 0, removal: dA - 1, side, nature };
    }

    if (dA === 1 && dB === 1) {
      return {
        relationshipType: 'SIBLING',
        relationshipLabel: 'Sibling',
        degree: 0,
        removal: 0,
        side,
        nature,
      };
    }

    if (dA === 1 || dB === 1) {
      const isNibling = (dA === 1 && dB > 1) || (dB === 1 && dA > 1);
      if (isNibling) {
        const removal = Math.max(dA, dB) - 1;
        if (removal === 1) {
          return {
            relationshipType: 'AVUNCULAR',
            relationshipLabel: dB === 1 ? 'Aunt/Uncle' : 'Niece/Nephew',
            degree: 0,
            removal: 1,
            side,
            nature,
          };
        }
        const greatCount = removal - 1;
        const greatPrefix = greatCount === 1 ? 'Great ' : greatCount > 1 ? `${greatCount}th Great ` : '';
        return {
          relationshipType: 'AVUNCULAR',
          relationshipLabel: dB === 1
            ? `${greatPrefix}Aunt/Uncle`
            : `${greatPrefix}Niece/Nephew`,
          degree: 0,
          removal,
          side,
          nature,
        };
      }
    }

    if (dA > 1 && dB > 1) {
      const degree = Math.min(dA, dB) - 1;
      const removal = Math.abs(dA - dB);
      const degreeStr = degree === 1 ? '1st' : degree === 2 ? '2nd' : degree === 3 ? '3rd' : `${degree}th`;
      const removalStr = removal === 0 ? '' : removal === 1 ? ' Once Removed' : removal === 2 ? ' Twice Removed' : ` ${removal} Times Removed`;
      return {
        relationshipType: 'COUSIN',
        relationshipLabel: `${degreeStr} Cousin${removalStr}`,
        degree,
        removal,
        side,
        nature,
      };
    }

    return {
      relationshipType: 'OTHER',
      relationshipLabel: 'Relative',
      degree: 0,
      removal: 0,
      side,
      nature,
    };
  }

  private determineSide(
    fullPath: string[],
    adjacencyCache: Map<string, Array<{ id: string; type: string }>>,
    memberMap: Map<string, { firstName: string; lastName?: string | null; gender?: string | null }>,
  ): 'maternal' | 'paternal' | 'both' | 'unknown' {
    if (fullPath.length < 2) return 'both';
    const firstStep = fullPath[1];
    const firstMember = memberMap.get(firstStep);
    if (firstMember?.gender) {
      const g = firstMember.gender.toLowerCase();
      if (g === 'female' || g === 'f') return 'maternal';
      if (g === 'male' || g === 'm') return 'paternal';
    }
    return 'unknown';
  }

  private determineNature(
    fullPath: string[],
    adjacencyCache: Map<string, Array<{ id: string; type: string }>>,
  ): 'blood' | 'marriage' | 'adoption' | 'step' | 'foster' | 'legal' | 'unknown' {
    const types = new Set<string>();
    for (let i = 1; i < fullPath.length; i++) {
      const neighbors = adjacencyCache.get(fullPath[i - 1]) || [];
      const nb = neighbors.find((n) => n.id === fullPath[i]);
      if (nb) types.add(nb.type.toUpperCase());
    }
    for (const t of types) {
      if (ADOPTION_TYPES.has(t)) return 'adoption';
      if (STEP_TYPES.has(t)) return 'step';
      if (FOSTER_TYPES.has(t)) return 'foster';
      if (LEGAL_TYPES.has(t)) return 'legal';
    }
    for (const t of types) {
      if (SPOUSE_TYPES.has(t)) return 'marriage';
    }
    if (types.size > 0) return 'blood';
    return 'unknown';
  }

  async getDescendants(memberId: string, depth: number = 10): Promise<TreeNode[]> {
    const results: TreeNode[] = [];
    const visited = new Set<string>();

    const traverse = async (id: string, currentDepth: number) => {
      if (visited.has(id) || currentDepth > depth) return;
      visited.add(id);

      const member = await this.prisma.familyMember.findUnique({ where: { id } });
      if (!member) return;

      const rels = await this.prisma.relationship.findMany({
        where: {
          OR: [{ fromMemberId: id }, { toMemberId: id }],
        },
        take: 200,
      });
      const childIds = getChildIdsFromRels(rels, id);

      const now = new Date();
      let age: number | undefined;
      if (member.birthDate) {
        const bd = new Date(member.birthDate);
        age = member.deathDate
          ? Math.floor((new Date(member.deathDate).getTime() - bd.getTime()) / (365.25 * 24 * 3600 * 1000))
          : Math.floor((now.getTime() - bd.getTime()) / (365.25 * 24 * 3600 * 1000));
      }

      results.push({
        id: member.id,
        displayId: member.displayId,
        entityType: 'MEMBER',
        entityId: member.id,
        name: `${member.firstName} ${member.lastName || ''}`.trim(),
        gender: member.gender || undefined,
        birthDate: member.birthDate || undefined,
        deathDate: member.deathDate || undefined,
        age,
        depth: currentDepth,
        familyId: member.familyId,
        childIds,
        hasChildren: childIds.length > 0,
      });

      for (const cId of childIds) {
        await traverse(cId, currentDepth + 1);
      }
    };

    await traverse(memberId, 0);
    return results;
  }

  async getAncestors(memberId: string, depth: number = 10): Promise<TreeNode[]> {
    const results: TreeNode[] = [];
    const visited = new Set<string>();

    const traverse = async (id: string, currentDepth: number) => {
      if (visited.has(id) || currentDepth > depth) return;
      visited.add(id);

      const member = await this.prisma.familyMember.findUnique({ where: { id } });
      if (!member) return;

      const rels = await this.prisma.relationship.findMany({
        where: {
          OR: [{ fromMemberId: id }, { toMemberId: id }],
        },
        take: 200,
      });
      const parentIds = getParentIdsFromRels(rels, id);

      const now = new Date();
      let age: number | undefined;
      if (member.birthDate) {
        const bd = new Date(member.birthDate);
        age = member.deathDate
          ? Math.floor((new Date(member.deathDate).getTime() - bd.getTime()) / (365.25 * 24 * 3600 * 1000))
          : Math.floor((now.getTime() - bd.getTime()) / (365.25 * 24 * 3600 * 1000));
      }

      results.push({
        id: member.id,
        displayId: member.displayId,
        entityType: 'MEMBER',
        entityId: member.id,
        name: `${member.firstName} ${member.lastName || ''}`.trim(),
        gender: member.gender || undefined,
        birthDate: member.birthDate || undefined,
        deathDate: member.deathDate || undefined,
        age,
        depth: currentDepth,
        familyId: member.familyId,
      });

      for (const pId of parentIds) {
        await traverse(pId, currentDepth + 1);
      }
    };

    await traverse(memberId, 0);
    return results;
  }

  async getGenealogyTree(familyId: string): Promise<{
    persons: GenealogyPerson[];
    marriages: GenealogyMarriage[];
    relationships: GenealogyRelationship[];
  }> {
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      include: {
        members: {
          where: { deletedAt: null },
        },
      },
    });
    if (!family) throw new NotFoundException('Family not found');

    const memberIds = family.members.map((m) => m.id);
    const rels = await this.prisma.relationship.findMany({
      where: {
        OR: [{ fromMemberId: { in: memberIds } }, { toMemberId: { in: memberIds } }],
      },
    });

    const persons: GenealogyPerson[] = family.members.map((m) => ({
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      gender: m.gender || undefined,
      birthDate: m.birthDate || undefined,
      deathDate: m.deathDate || undefined,
      avatar: m.avatar || undefined,
      occupation: m.occupation || undefined,
      country: m.country || undefined,
      isVerified: true,
    }));

    const marriages: GenealogyMarriage[] = [];
    const relationships: GenealogyRelationship[] = [];
    const processedSpouses = new Set<string>();

    for (const r of rels) {
      const t = (r.type || '').toUpperCase();
      if (SPOUSE_TYPES.has(t)) {
        const key = [r.fromMemberId, r.toMemberId].sort().join(':');
        if (!processedSpouses.has(key)) {
          processedSpouses.add(key);
          const husbandId = t === 'WIFE' ? r.toMemberId : r.fromMemberId;
          const wifeId = t === 'HUSBAND' ? r.toMemberId : r.fromMemberId;
          const exSpouseTypes = new Set(['EX_SPOUSE', 'EX_HUSBAND', 'EX_WIFE', 'DIVORCED', 'DIVORCED_FROM']);
          const isCurrent = !exSpouseTypes.has(t);
          marriages.push({
            id: `marriage-${key}`,
            husbandId: t === 'WIFE' ? r.toMemberId : r.fromMemberId,
            wifeId: t === 'HUSBAND' ? r.toMemberId : r.fromMemberId,
            status: isCurrent ? 'MARRIED' : 'DIVORCED',
          });
        }
        relationships.push({
          id: r.id,
          fromId: r.fromMemberId,
          toId: r.toMemberId,
          fromType: 'PERSON',
          toType: 'PERSON',
          type: r.type,
        });
      } else {
        relationships.push({
          id: r.id,
          fromId: r.fromMemberId,
          toId: r.toMemberId,
          fromType: 'PERSON',
          toType: 'PERSON',
          type: r.type,
        });
      }
    }

    return { persons, marriages, relationships };
  }

  async getComprehensiveStats(familyId: string): Promise<TreeStatistics> {
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      include: {
        members: {
          where: { deletedAt: null },
        },
      },
    });
    if (!family) throw new NotFoundException('Family not found');

    const memberIds = family.members.map((m) => m.id);
    const rels = await this.prisma.relationship.findMany({
      where: {
        OR: [{ fromMemberId: { in: memberIds } }, { toMemberId: { in: memberIds } }],
      },
    });

    const members = family.members;
    const now = new Date();
    const persons = members.length;
    let livingCount = 0;
    let deceasedCount = 0;
    let maleCount = 0;
    let femaleCount = 0;
    let ageSum = 0;
    let ageCount = 0;
    let oldestMember: { id: string; name: string; age: number } | undefined;
    let youngestMember: { id: string; name: string; age: number } | undefined;
    const countriesSet = new Set<string>();
    const occupationsSet = new Set<string>();
    const spouseCountMap = new Map<string, number>();
    const inbreedingSet = new Set<string>();

    for (const m of members) {
      const g = (m.gender || '').toLowerCase();
      if (g === 'male' || g === 'm') maleCount++;
      else if (g === 'female' || g === 'f') femaleCount++;

      if (m.deathDate) deceasedCount++;
      else livingCount++;

      if (m.birthDate) {
        const bd = new Date(m.birthDate);
        const age = m.deathDate
          ? Math.floor((new Date(m.deathDate).getTime() - bd.getTime()) / (365.25 * 24 * 3600 * 1000))
          : Math.floor((now.getTime() - bd.getTime()) / (365.25 * 24 * 3600 * 1000));
        ageSum += age;
        ageCount++;

        if (!oldestMember || age > oldestMember.age) {
          oldestMember = { id: m.id, name: `${m.firstName} ${m.lastName || ''}`.trim(), age };
        }
        if (!youngestMember || age < youngestMember.age) {
          youngestMember = { id: m.id, name: `${m.firstName} ${m.lastName || ''}`.trim(), age };
        }
      }

      if (m.country) countriesSet.add(m.country);
      if (m.occupation) occupationsSet.add(m.occupation);
    }

    let marriageCount = 0;
    let currentMarriages = 0;
    let divorcedCount = 0;
    let widowedCount = 0;

    for (const r of rels) {
      const t = (r.type || '').toUpperCase();
      if (SPOUSE_TYPES.has(t)) {
        marriageCount++;
        spouseCountMap.set(r.fromMemberId, (spouseCountMap.get(r.fromMemberId) || 0) + 1);
        spouseCountMap.set(r.toMemberId, (spouseCountMap.get(r.toMemberId) || 0) + 1);

        if (['DIVORCED', 'DIVORCED_FROM', 'EX_SPOUSE', 'EX_HUSBAND', 'EX_WIFE'].includes(t)) {
          divorcedCount++;
        } else if (['WIDOW', 'WIDOWER'].includes(t)) {
          widowedCount++;
        } else {
          currentMarriages++;
        }
      }
    }

    let multipleMarriages = 0;
    for (const count of spouseCountMap.values()) {
      if (count > 1) multipleMarriages++;
    }
    multipleMarriages = Math.floor(multipleMarriages / 2);

    const membersByGeneration = [{ generation: 0, count: persons }];
    const generationCount = 1;

    return {
      totalPersons: persons,
      totalMarriages: marriageCount,
      totalRelationships: rels.length,
      livingCount,
      deceasedCount,
      maleCount,
      femaleCount,
      averageAge: ageCount > 0 ? Math.round(ageSum / ageCount) : 0,
      oldestMember,
      youngestMember,
      generationCount,
      membersByGeneration,
      countryCount: countriesSet.size,
      occupationCount: occupationsSet.size,
      countries: [...countriesSet],
      occupations: [...occupationsSet],
      marriages: {
        total: marriageCount,
        current: currentMarriages,
        divorced: divorcedCount,
        widowed: widowedCount,
      },
      multipleMarriages,
      inbreeding: 0,
    };
  }

  async linkProfileToMember(userId: string, memberId: string): Promise<void> {
    const existingMemberLink = await this.prisma.profileLink.findUnique({
      where: { memberId },
    });
    if (existingMemberLink) {
      throw new NotFoundException('This family member is already linked to a user profile');
    }

    const existingUserLink = await this.prisma.profileLink.findUnique({
      where: { userId },
    });
    if (existingUserLink) {
      throw new NotFoundException('This user already has a linked family member');
    }

    const member = await this.prisma.familyMember.findUnique({ where: { id: memberId } });
    if (!member) throw new NotFoundException('Family member not found');

    await this.prisma.profileLink.create({
      data: { userId, memberId },
    });
  }
}
