import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { FamilyMember, Relationship, Family, Clan, SubClan, Community, ProfileLink } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IdentityService } from '../common/identity.service';
import {
  CreateTreeViewDto, UpdateTreeViewDto, SaveLayoutCacheDto, ExpandNodeDto,
  CreateBookmarkDto, CreateSearchHistoryDto,
} from './dto/create-tree-view.dto';
import {
  TreeNode, TreeEdge, TreeData, TreeStats,
  MemberSummary, SubClanNodeData, FamilyNodeData, FamilyWithMemberCount,
  CommonAncestorResult, RelationshipPathResult,
} from './tree.types';
import { GenealogyCalculatorService } from './genealogy-calculator.service';


const PARENT_FIGURE_TYPES = new Set<string>([
  'FATHER', 'MOTHER', 'PARENT', 'GRANDFATHER', 'GRANDMOTHER', 'GRANDPARENT', 'GREAT_GRANDPARENT',
  'STEP_FATHER', 'STEP_MOTHER', 'STEP_PARENT',
  'ADOPTIVE_FATHER', 'ADOPTIVE_MOTHER', 'ADOPTIVE_PARENT',
  'FOSTER_FATHER', 'FOSTER_MOTHER', 'FOSTER_PARENT',
  'LEGAL_FATHER', 'LEGAL_MOTHER', 'LEGAL_GUARDIAN', 'GUARDIAN',
  'SURROGATE', 'SURROGATE_MOTHER',
  'FATHER_IN_LAW', 'MOTHER_IN_LAW',
  'GODFATHER', 'GODMOTHER',
]);

const CHILD_FIGURE_TYPES = new Set<string>([
  'SON', 'DAUGHTER', 'CHILD', 'GRANDSON', 'GRANDDAUGHTER', 'GRANDCHILD', 'GREAT_GRANDCHILD',
  'STEP_SON', 'STEP_DAUGHTER', 'STEP_CHILD',
  'ADOPTIVE_SON', 'ADOPTIVE_DAUGHTER', 'ADOPTIVE_CHILD',
  'FOSTER_SON', 'FOSTER_DAUGHTER', 'FOSTER_CHILD',
  'GODSON', 'GODDAUGHTER',
  'SURROGATE_CHILD', 'WARD',
  'SON_IN_LAW', 'DAUGHTER_IN_LAW',
  'NEPHEW', 'NIECE',
]);

const PURE_PARENT_TYPES = new Set<string>(
  [...PARENT_FIGURE_TYPES].filter((t: string) => !['FATHER_IN_LAW', 'MOTHER_IN_LAW', 'GODFATHER', 'GODMOTHER'].includes(t)),
);

const PURE_CHILD_TYPES = new Set<string>(
  [...CHILD_FIGURE_TYPES].filter((t: string) => !['NEPHEW', 'NIECE', 'SON_IN_LAW', 'DAUGHTER_IN_LAW', 'GODSON', 'GODDAUGHTER'].includes(t)),
);

const SPOUSE_TYPES = new Set<string>([
  'HUSBAND', 'WIFE', 'SPOUSE', 'EX_SPOUSE', 'PARTNER',
  'FIANCÉ', 'FIANCÉE', 'DIVORCED', 'DIVORCED_FROM',
  'WIDOW', 'WIDOWER', 'EX_HUSBAND', 'EX_WIFE',
]);

const SIBLING_TYPES = new Set<string>([
  'BROTHER', 'SISTER', 'HALF_BROTHER', 'HALF_SISTER', 'HALF_SIBLING',
  'STEP_BROTHER', 'STEP_SISTER', 'STEP_SIBLING',
  'TWIN', 'TRIPLET', 'QUADRUPLET',
]);

const PARENT_CHILD_TYPES = new Set<string>([...PARENT_FIGURE_TYPES, ...CHILD_FIGURE_TYPES]);

@Injectable()
export class TreeService {
  constructor(
    private prisma: PrismaService,
    private identityService: IdentityService,
    private genealogyCalculator: GenealogyCalculatorService,
  ) {}

  async getFamilyTree(familyId: string, depth: number = 10): Promise<TreeData> {
    const family = await this.prisma.family.findUnique({
      where: { id: familyId },
      include: {
        members: {
          where: { deletedAt: null },
          orderBy: { firstName: 'asc' },
        },
      },
    });

    if (!family) throw new NotFoundException('Family not found');

    const members: FamilyMember[] = family.members;
    const relationships: Relationship[] = await this.prisma.relationship.findMany({
      where: {
        OR: [
          { fromMemberId: { in: members.map((m: FamilyMember) => m.id) } },
          { toMemberId: { in: members.map((m: FamilyMember) => m.id) } },
        ],
      },
    });

    const nodes: TreeNode[] = [];
    const edges: TreeEdge[] = [];

    const childOf = new Map<string, string[]>();
    const parentOf = new Map<string, string[]>();
    const spouseOf = new Map<string, string[]>();

    members.forEach((m: FamilyMember) => {
      childOf.set(m.id, []);
      parentOf.set(m.id, []);
      spouseOf.set(m.id, []);
    });

    for (const r of relationships) {
      const t = (r.type || '').toUpperCase();
      if (CHILD_FIGURE_TYPES.has(t)) {
        childOf.get(r.fromMemberId)?.push(r.toMemberId);
        parentOf.get(r.toMemberId)?.push(r.fromMemberId);
      } else if (PARENT_FIGURE_TYPES.has(t)) {
        parentOf.get(r.fromMemberId)?.push(r.toMemberId);
        childOf.get(r.toMemberId)?.push(r.fromMemberId);
      } else if (SPOUSE_TYPES.has(t)) {
        spouseOf.get(r.fromMemberId)?.push(r.toMemberId);
        spouseOf.get(r.toMemberId)?.push(r.fromMemberId);
      } else if (SIBLING_TYPES.has(t)) {
        // siblings: treat as peer relationship
        spouseOf.get(r.fromMemberId)?.push(r.toMemberId);
        spouseOf.get(r.toMemberId)?.push(r.fromMemberId);
      }
    }

    const roots = members.filter((m: FamilyMember) => {
      const parents = (parentOf.get(m.id) || []).filter((p: string) => !spouseOf.get(m.id)?.includes(p));
      return parents.length === 0;
    });

    const visited = new Set<string>();
    const depthMap = new Map<string, number>();

    const bfs = (startIds: string[]) => {
      const queue = [...startIds];
      startIds.forEach((id: string) => depthMap.set(id, 0));
      let idx = 0;
      while (idx < queue.length && idx < 5000) {
        const id = queue[idx++];
        if (visited.has(id)) continue;
        visited.add(id);
        const currentDepth = depthMap.get(id) || 0;
        if (currentDepth >= depth) continue;

        const children = (childOf.get(id) || []).filter((c: string) => !visited.has(c));
        for (const c of children) {
          if (!depthMap.has(c) || depthMap.get(c)! > currentDepth + 1) {
            depthMap.set(c, currentDepth + 1);
            queue.push(c);
          }
        }
        const spouses = (spouseOf.get(id) || []).filter((s: string) => !visited.has(s));
        for (const s of spouses) {
          if (!depthMap.has(s)) {
            depthMap.set(s, currentDepth);
            queue.push(s);
          }
        }
        const parents = (parentOf.get(id) || []).filter((p: string) => !visited.has(p));
        for (const p of parents) {
          if (!depthMap.has(p) || depthMap.get(p)! > currentDepth - 1) {
            depthMap.set(p, currentDepth - 1);
            queue.push(p);
          }
        }
      }
    };

    if (roots.length > 0) {
      bfs(roots.map((r: FamilyMember) => r.id));
    } else if (members.length > 0) {
      bfs([members[0].id]);
    }

    for (const m of members) {
      if (!visited.has(m.id)) {
        depthMap.set(m.id, depth + 1);
        visited.add(m.id);
      }
    }

    let maxDepthVal = 0;
    for (const d of depthMap.values()) {
      if (d > maxDepthVal) maxDepthVal = d;
    }

    const profileLinkMap = await this.getProfileLinkMap(members.map((m: FamilyMember) => m.id));

    const now = new Date();
    for (const m of members) {
      const d = depthMap.get(m.id) || 0;
      if (d > maxDepthVal) maxDepthVal = d;

      let age: number | undefined;
      if (m.birthDate) {
        const bd = new Date(m.birthDate);
        if (m.deathDate) {
          age = Math.floor((new Date(m.deathDate).getTime() - bd.getTime()) / (365.25 * 24 * 3600 * 1000));
        } else {
          age = Math.floor((now.getTime() - bd.getTime()) / (365.25 * 24 * 3600 * 1000));
        }
      }

      const linkedUser = profileLinkMap?.get(m.id);
      nodes.push({
        id: m.id,
        displayId: m.displayId,
        entityType: 'MEMBER',
        entityId: m.id,
        name: `${m.firstName} ${m.lastName || ''}`.trim(),
        displayName: `${m.firstName} ${m.lastName || ''}`.trim(),
        gender: m.gender || undefined,
        birthDate: m.birthDate || undefined,
        deathDate: m.deathDate || undefined,
        age,
        occupation: m.occupation || undefined,
        profilePhoto: m.avatar || undefined,
        userId: linkedUser,
        status: 'ACTIVE',
        privacyLevel: 'FAMILY',
        depth: d,
        familyId: familyId,
        familyName: family.name,
        spouseIds: [...new Set(spouseOf.get(m.id) || [])],
        childIds: [...new Set(childOf.get(m.id) || [])],
        hasChildren: (childOf.get(m.id) || []).length > 0,
      });
    }

    for (const r of relationships) {
      const t = (r.type || '').toUpperCase();
      const isParentChild = PARENT_CHILD_TYPES.has(t);
      const isSpouse = SPOUSE_TYPES.has(t);
      const isSibling = SIBLING_TYPES.has(t);

      if (isParentChild) {
        const isParentFig = PARENT_FIGURE_TYPES.has(t);
        const parentId = isParentFig ? r.fromMemberId : r.toMemberId;
        const childId = isParentFig ? r.toMemberId : r.fromMemberId;
        edges.push({
          id: r.id,
          fromNodeId: parentId,
          toNodeId: childId,
          type: 'PARENT_CHILD',
          label: t,
        });
      } else if (isSpouse) {
        const idx = edges.findIndex((e: TreeEdge) =>
          e.type === 'SPOUSE' &&
          ((e.fromNodeId === r.fromMemberId && e.toNodeId === r.toMemberId) ||
           (e.fromNodeId === r.toMemberId && e.toNodeId === r.fromMemberId))
        );
        if (idx === -1) {
          edges.push({
            id: r.id,
            fromNodeId: r.fromMemberId,
            toNodeId: r.toMemberId,
            type: 'SPOUSE',
            label: t,
          });
        }
      } else if (isSibling) {
        edges.push({
          id: r.id,
          fromNodeId: r.fromMemberId,
          toNodeId: r.toMemberId,
          type: 'SIBLING',
          label: t,
        });
      } else {
        edges.push({
          id: r.id,
          fromNodeId: r.fromMemberId,
          toNodeId: r.toMemberId,
          type: 'OTHER',
          label: t,
        });
      }
    }

    return {
      nodes,
      edges,
      rootId: roots[0]?.id || members[0]?.id || '',
      totalNodes: nodes.length,
      maxDepth: maxDepthVal,
      metadata: {
        treeType: 'FAMILY',
        rootEntityType: 'FAMILY',
        rootEntityId: familyId,
        layout: 'VERTICAL',
        generatedAt: new Date().toISOString(),
      },
    };
  }

  async getClanTree(clanId: string, depth: number = 5): Promise<TreeData> {
    const clan = await this.prisma.clan.findUnique({
      where: { id: clanId },
      include: {
        subClans: {
          where: { deletedAt: null },
          include: {
            childSubClans: {
              where: { deletedAt: null },
              include: {
                childSubClans: {
                  where: { deletedAt: null },
                  include: {
                    childSubClans: {
                      where: { deletedAt: null },
                    },
                    families: {
                      where: { deletedAt: null },
                      include: {
                        members: {
                          where: { deletedAt: null },
                          take: 10,
                          orderBy: { firstName: 'asc' },
                        },
                      },
                    },
                  },
                },
                families: {
                  where: { deletedAt: null },
                  include: {
                    members: {
                      where: { deletedAt: null },
                      take: 10,
                      orderBy: { firstName: 'asc' },
                    },
                  },
                },
              },
            },
            families: {
              where: { deletedAt: null },
              include: {
                members: {
                  where: { deletedAt: null },
                  take: 10,
                  orderBy: { firstName: 'asc' },
                },
              },
            },
          },
        },
        families: {
          where: { deletedAt: null },
          include: {
            members: {
              where: { deletedAt: null },
              take: 10,
              orderBy: { firstName: 'asc' },
            },
          },
        },
      },
    });

    if (!clan) throw new NotFoundException('Clan not found');

    const nodes: TreeNode[] = [];
    const edges: TreeEdge[] = [];

    const clanNode: TreeNode = {
      id: clan.id,
      displayId: clan.displayId,
      entityType: 'CLAN',
      entityId: clan.id,
      name: clan.name,
      displayName: clan.name,
      gender: undefined,
      birthDate: undefined,
      deathDate: undefined,
      depth: 0,
      clanId: clan.id,
      clanName: clan.name,
      status: clan.status,
      privacyLevel: clan.privacy,
      hasChildren: (clan.subClans?.length || 0) + (clan.families?.length || 0) > 0,
      childIds: [
        ...(clan.subClans || []).map((s: SubClan) => s.id),
        ...(clan.families || []).map((f: Family) => f.id),
      ],
    };
    nodes.push(clanNode);

    const buildSubClanNode = (sc: SubClanNodeData, parentEntityId: string, d: number) => {
      const node: TreeNode = {
        id: sc.id,
        displayId: sc.displayId,
        entityType: 'SUBCLAN',
        entityId: sc.id,
        name: sc.name,
        displayName: sc.name,
        depth: d,
        clanId: clanId,
        clanName: clan.name,
        subClanId: sc.id,
        subClanName: sc.name,
        status: sc.status,
        privacyLevel: sc.privacy,
        hasChildren: (sc.childSubClans?.length || 0) + (sc.families?.length || 0) > 0,
        childIds: [
          ...(sc.childSubClans || []).map((c: SubClanNodeData) => c.id),
          ...(sc.families || []).map((f: FamilyNodeData) => f.id),
        ],
      };
      nodes.push(node);
      edges.push({
        id: `edge-${parentEntityId}-${sc.id}`,
        fromNodeId: parentEntityId,
        toNodeId: sc.id,
        type: 'PARENT_CHILD',
        label: 'SubClan',
      });

      for (const child of (sc.childSubClans || [])) {
        buildSubClanNode(child, sc.id, d + 1);
      }
      for (const fam of (sc.families || [])) {
        buildFamilyNode(fam, sc.id, d + 1);
      }
    };

    const buildFamilyNode = (fam: FamilyNodeData, parentEntityId: string, d: number) => {
      const familyMembers: FamilyMember[] = fam.members || [];
      const node: TreeNode = {
        id: fam.id,
        displayId: fam.displayId || '',
        entityType: 'FAMILY',
        entityId: fam.id,
        name: fam.name,
        displayName: fam.name,
        depth: d,
        clanId: clanId,
        clanName: clan.name,
        familyId: fam.id,
        familyName: fam.name,
        hasChildren: familyMembers.length > 0,
        childIds: familyMembers.map((m: FamilyMember) => m.id),
      };
      nodes.push(node);
      edges.push({
        id: `edge-${parentEntityId}-${fam.id}`,
        fromNodeId: parentEntityId,
        toNodeId: fam.id,
        type: 'PARENT_CHILD',
        label: 'Family',
      });

      for (const m of familyMembers) {
        const now = new Date();
        let age: number | undefined;
        if (m.birthDate) {
          const bd = new Date(m.birthDate);
          age = m.deathDate
            ? Math.floor((new Date(m.deathDate).getTime() - bd.getTime()) / (365.25 * 24 * 3600 * 1000))
            : Math.floor((now.getTime() - bd.getTime()) / (365.25 * 24 * 3600 * 1000));
        }
        const memberNode: TreeNode = {
          id: m.id,
          displayId: m.displayId,
          entityType: 'MEMBER',
          entityId: m.id,
          name: `${m.firstName} ${m.lastName || ''}`.trim(),
          displayName: `${m.firstName} ${m.lastName || ''}`.trim(),
          gender: m.gender || undefined,
          birthDate: m.birthDate || undefined,
          deathDate: m.deathDate || undefined,
          age,
          occupation: m.occupation || undefined,
          profilePhoto: m.avatar || undefined,
          depth: d + 1,
          familyId: fam.id,
          familyName: fam.name,
          clanId: clanId,
          clanName: clan.name,
        };
        nodes.push(memberNode);
        edges.push({
          id: `edge-${fam.id}-${m.id}`,
          fromNodeId: fam.id,
          toNodeId: m.id,
          type: 'PARENT_CHILD',
          label: 'Member',
        });
      }
    };

    for (const sc of (clan.subClans || [])) {
      buildSubClanNode(sc, clan.id, 1);
    }
    for (const fam of (clan.families || [])) {
      buildFamilyNode(fam, clan.id, 1);
    }

    const clanMemberIds = nodes.filter((n: TreeNode) => n.entityType === 'MEMBER').map((n: TreeNode) => n.entityId);
    const clanProfileLinkMap = await this.getProfileLinkMap(clanMemberIds);
    for (const n of nodes) {
      if (n.entityType === 'MEMBER') n.userId = clanProfileLinkMap.get(n.entityId);
    }

    return {
      nodes,
      edges,
      rootId: clan.id,
      totalNodes: nodes.length,
      maxDepth: Math.max(...nodes.map((n: TreeNode) => n.depth), 0),
      metadata: {
        treeType: 'CLAN',
        rootEntityType: 'CLAN',
        rootEntityId: clanId,
        layout: 'VERTICAL',
        generatedAt: new Date().toISOString(),
      },
    };
  }

  async getCommunityTree(communityId: string, depth: number = 4): Promise<TreeData> {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      include: {
        clans: {
          where: { deletedAt: null },
          include: {
            subClans: {
              where: { deletedAt: null },
              include: {
                childSubClans: {
                  where: { deletedAt: null },
                  take: 5,
                },
                families: {
                  where: { deletedAt: null },
                  take: 5,
                },
              },
            },
            families: {
              where: { deletedAt: null },
              take: 5,
            },
          },
        },
      },
    });

    if (!community) throw new NotFoundException('Community not found');

    const nodes: TreeNode[] = [];
    const edges: TreeEdge[] = [];

    const communityNode: TreeNode = {
      id: community.id,
      displayId: community.displayId,
      entityType: 'COMMUNITY',
      entityId: community.id,
      name: community.name,
      displayName: community.name,
      depth: 0,
      communityId: community.id,
      communityName: community.name,
      status: community.status,
      privacyLevel: community.privacy,
      hasChildren: (community.clans?.length || 0) > 0,
      childIds: (community.clans || []).map((c: Clan) => c.id),
    };
    nodes.push(communityNode);

    for (const clan of (community.clans || [])) {
      const clanNode: TreeNode = {
        id: clan.id,
        displayId: clan.displayId,
        entityType: 'CLAN',
        entityId: clan.id,
        name: clan.name,
        displayName: clan.name,
        depth: 1,
        communityId: communityId,
        communityName: community.name,
        clanId: clan.id,
        clanName: clan.name,
        status: clan.status,
        hasChildren: true,
      };
      nodes.push(clanNode);
      edges.push({
        id: `edge-${community.id}-${clan.id}`,
        fromNodeId: community.id,
        toNodeId: clan.id,
        type: 'PARENT_CHILD',
        label: 'Clan',
      });

      for (const sc of (clan.subClans || [])) {
        const scNode: TreeNode = {
          id: sc.id,
          displayId: sc.displayId,
          entityType: 'SUBCLAN',
          entityId: sc.id,
          name: sc.name,
          displayName: sc.name,
          depth: 2,
          communityId: communityId,
          communityName: community.name,
          clanId: clan.id,
          clanName: clan.name,
          subClanId: sc.id,
          subClanName: sc.name,
          hasChildren: true,
        };
        nodes.push(scNode);
        edges.push({
          id: `edge-${clan.id}-${sc.id}`,
          fromNodeId: clan.id,
          toNodeId: sc.id,
          type: 'PARENT_CHILD',
          label: 'SubClan',
        });
      }

      for (const fam of (clan.families || [])) {
        const famNode: TreeNode = {
          id: fam.id,
          displayId: fam.displayId || '',
          entityType: 'FAMILY',
          entityId: fam.id,
          name: fam.name,
          displayName: fam.name,
          depth: 2,
          communityId: communityId,
          communityName: community.name,
          clanId: clan.id,
          clanName: clan.name,
          familyId: fam.id,
          familyName: fam.name,
        };
        nodes.push(famNode);
        edges.push({
          id: `edge-${clan.id}-${fam.id}`,
          fromNodeId: clan.id,
          toNodeId: fam.id,
          type: 'PARENT_CHILD',
          label: 'Family',
        });
      }
    }

    const commMemberIds = nodes.filter((n: TreeNode) => n.entityType === 'MEMBER').map((n: TreeNode) => n.entityId);
    const commProfileLinkMap = await this.getProfileLinkMap(commMemberIds);
    for (const n of nodes) {
      if (n.entityType === 'MEMBER') n.userId = commProfileLinkMap.get(n.entityId);
    }

    return {
      nodes,
      edges,
      rootId: community.id,
      totalNodes: nodes.length,
      maxDepth: Math.max(...nodes.map((n: TreeNode) => n.depth), 0),
      metadata: {
        treeType: 'COMMUNITY',
        rootEntityType: 'COMMUNITY',
        rootEntityId: communityId,
        layout: 'VERTICAL',
        generatedAt: new Date().toISOString(),
      },
    };
  }

  async getAncestorTree(memberId: string, depth: number = 10): Promise<TreeData> {
    const member = await this.prisma.familyMember.findUnique({
      where: { id: memberId },
    });
    if (!member) throw new NotFoundException('Member not found');

    const nodes: TreeNode[] = [];
    const edges: TreeEdge[] = [];
    const visited = new Set<string>();

    const buildAncestors = async (mId: string, d: number) => {
      if (visited.has(mId) || d > depth) return;
      visited.add(mId);

      const m = mId === memberId ? member : await this.prisma.familyMember.findUnique({ where: { id: mId } });
      if (!m) return;

      const now = new Date();
      let age: number | undefined;
      if (m.birthDate) {
        const bd = new Date(m.birthDate);
        age = m.deathDate
          ? Math.floor((new Date(m.deathDate).getTime() - bd.getTime()) / (365.25 * 24 * 3600 * 1000))
          : Math.floor((now.getTime() - bd.getTime()) / (365.25 * 24 * 3600 * 1000));
      }

      nodes.push({
        id: m.id,
        displayId: m.displayId,
        entityType: 'MEMBER',
        entityId: m.id,
        name: `${m.firstName} ${m.lastName || ''}`.trim(),
        displayName: `${m.firstName} ${m.lastName || ''}`.trim(),
        gender: m.gender || undefined,
        birthDate: m.birthDate || undefined,
        deathDate: m.deathDate || undefined,
        age,
        occupation: m.occupation || undefined,
        profilePhoto: m.avatar || undefined,
        depth: d,
        familyId: m.familyId,
      });

      const rels = await this.prisma.relationship.findMany({
        where: {
          OR: [
            { fromMemberId: mId, type: { in: [...PURE_PARENT_TYPES] } },
            { toMemberId: mId, type: { in: [...PURE_CHILD_TYPES] } },
          ],
        },
      });

      for (const r of rels) {
        const isParentFigure = PURE_PARENT_TYPES.has(r.type) && r.fromMemberId === mId;
        const isChildFigure = PURE_CHILD_TYPES.has(r.type) && r.toMemberId === mId;
        const parentId = isParentFigure ? r.toMemberId : isChildFigure ? r.fromMemberId : null;
        const childId = isParentFigure ? r.fromMemberId : isChildFigure ? r.toMemberId : null;

        const ancestorId = r.fromMemberId === mId ? r.toMemberId : r.fromMemberId;
        const parentM = await this.prisma.familyMember.findUnique({ where: { id: ancestorId } });
        if (parentM && !visited.has(ancestorId)) {
          edges.push({
            id: r.id,
            fromNodeId: ancestorId,
            toNodeId: mId,
            type: 'PARENT_CHILD',
            label: r.type,
          });
          await buildAncestors(ancestorId, d + 1);
        }
      }
    };

    await buildAncestors(memberId, 0);

    const ancMemberIds = nodes.filter((n: TreeNode) => n.entityType === 'MEMBER').map((n: TreeNode) => n.entityId);
    const ancProfileLinkMap = await this.getProfileLinkMap(ancMemberIds);
    for (const n of nodes) {
      if (n.entityType === 'MEMBER') n.userId = ancProfileLinkMap.get(n.entityId);
    }

    return {
      nodes,
      edges,
      rootId: memberId,
      totalNodes: nodes.length,
      maxDepth: Math.max(...nodes.map((n: TreeNode) => n.depth), 0),
      metadata: {
        treeType: 'ANCESTOR',
        rootEntityType: 'MEMBER',
        rootEntityId: memberId,
        layout: 'VERTICAL',
        generatedAt: new Date().toISOString(),
      },
    };
  }

  async getDescendantTree(memberId: string, depth: number = 10): Promise<TreeData> {
    const member = await this.prisma.familyMember.findUnique({
      where: { id: memberId },
    });
    if (!member) throw new NotFoundException('Member not found');

    const nodes: TreeNode[] = [];
    const edges: TreeEdge[] = [];
    const visited = new Set<string>();

    const buildDescendants = async (mId: string, d: number) => {
      if (visited.has(mId) || d > depth) return;
      visited.add(mId);

      const m = mId === memberId ? member : await this.prisma.familyMember.findUnique({ where: { id: mId } });
      if (!m) return;

      const now = new Date();
      let age: number | undefined;
      if (m.birthDate) {
        const bd = new Date(m.birthDate);
        age = m.deathDate
          ? Math.floor((new Date(m.deathDate).getTime() - bd.getTime()) / (365.25 * 24 * 3600 * 1000))
          : Math.floor((now.getTime() - bd.getTime()) / (365.25 * 24 * 3600 * 1000));
      }

      nodes.push({
        id: m.id,
        displayId: m.displayId,
        entityType: 'MEMBER',
        entityId: m.id,
        name: `${m.firstName} ${m.lastName || ''}`.trim(),
        displayName: `${m.firstName} ${m.lastName || ''}`.trim(),
        gender: m.gender || undefined,
        birthDate: m.birthDate || undefined,
        deathDate: m.deathDate || undefined,
        age,
        occupation: m.occupation || undefined,
        profilePhoto: m.avatar || undefined,
        depth: d,
        familyId: m.familyId,
      });

      const childRels = await this.prisma.relationship.findMany({
        where: {
          OR: [
            { fromMemberId: mId, type: { in: [...PURE_CHILD_TYPES] } },
            { toMemberId: mId, type: { in: [...PURE_PARENT_TYPES] } },
          ],
        },
      });

      for (const r of childRels) {
        const isChildFigure = PURE_CHILD_TYPES.has(r.type) && r.fromMemberId === mId;
        const isParentFigure = PURE_PARENT_TYPES.has(r.type) && r.toMemberId === mId;
        const childId = isChildFigure ? r.toMemberId : isParentFigure ? r.fromMemberId : null;
        if (childId && !visited.has(childId)) {
          edges.push({
            id: r.id,
            fromNodeId: mId,
            toNodeId: childId,
            type: 'PARENT_CHILD',
            label: r.type,
          });
          await buildDescendants(childId, d + 1);
        }
      }
    };

    await buildDescendants(memberId, 0);

    const descMemberIds = nodes.filter((n: TreeNode) => n.entityType === 'MEMBER').map((n: TreeNode) => n.entityId);
    const descProfileLinkMap = await this.getProfileLinkMap(descMemberIds);
    for (const n of nodes) {
      if (n.entityType === 'MEMBER') n.userId = descProfileLinkMap.get(n.entityId);
    }

    return {
      nodes,
      edges,
      rootId: memberId,
      totalNodes: nodes.length,
      maxDepth: Math.max(...nodes.map((n: TreeNode) => n.depth), 0),
      metadata: {
        treeType: 'DESCENDANT',
        rootEntityType: 'MEMBER',
        rootEntityId: memberId,
        layout: 'VERTICAL',
        generatedAt: new Date().toISOString(),
      },
    };
  }

  async searchTree(query: string, entityType?: string, entityId?: string): Promise<TreeNode[]> {
    const results: TreeNode[] = [];
    const searchLimit = 50;

    if (!entityType || entityType === 'MEMBER') {
      const members = await this.prisma.familyMember.findMany({
        where: {
          deletedAt: null,
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
          ],
          ...(entityId ? { familyId: entityId } : {}),
        },
        take: searchLimit,
        orderBy: { firstName: 'asc' },
      });

      for (const m of members) {
        results.push({
          id: m.id,
          displayId: m.displayId,
          entityType: 'MEMBER',
          entityId: m.id,
          name: `${m.firstName} ${m.lastName || ''}`.trim(),
          displayName: `${m.firstName} ${m.lastName || ''}`.trim(),
          gender: m.gender || undefined,
          birthDate: m.birthDate || undefined,
          deathDate: m.deathDate || undefined,
          profilePhoto: m.avatar || undefined,
          depth: 0,
          familyId: m.familyId,
        });
      }
    }

    if (!entityType || entityType === 'FAMILY') {
      const families = await this.prisma.family.findMany({
        where: {
          deletedAt: null,
          name: { contains: query, mode: 'insensitive' },
        },
        take: searchLimit - results.length,
      });

      for (const f of families) {
        results.push({
          id: f.id,
          displayId: f.displayId,
          entityType: 'FAMILY',
          entityId: f.id,
          name: f.name,
          displayName: f.name,
          depth: 0,
          familyId: f.id,
          familyName: f.name,
        });
      }
    }

    return results;
  }

  async getStats(entityType: string, entityId: string): Promise<TreeStats> {
    let treeData: TreeData;

    switch (entityType) {
      case 'FAMILY':
        treeData = await this.getFamilyTree(entityId);
        break;
      case 'CLAN':
        treeData = await this.getClanTree(entityId);
        break;
      case 'COMMUNITY':
        treeData = await this.getCommunityTree(entityId);
        break;
      default:
        throw new BadRequestException(`Invalid entity type: ${entityType}`);
    }

    const memberNodes = treeData.nodes.filter((n: TreeNode) => n.entityType === 'MEMBER');

    let livingCount = 0;
    let deceasedCount = 0;
    let verifiedCount = 0;
    const genderBreakdown: Record<string, number> = {};

    for (const n of memberNodes) {
      const g = (n.gender || 'unknown').toLowerCase();
      genderBreakdown[g] = (genderBreakdown[g] || 0) + 1;

      if (n.deathDate) {
        deceasedCount++;
      } else {
        livingCount++;
      }

      if (n.verificationBadge) verifiedCount++;
    }

    const generationSet = new Set(memberNodes.map((n: TreeNode) => n.depth));

    return {
      totalNodes: treeData.totalNodes,
      totalEdges: treeData.edges.length,
      maxDepth: treeData.maxDepth,
      livingMembers: livingCount,
      deceasedMembers: deceasedCount,
      verifiedMembers: verifiedCount,
      genderBreakdown,
      generationCount: generationSet.size,
    };
  }

  async createView(userId: string, dto: CreateTreeViewDto) {
    const displayId = await this.identityService.generateTreeViewId();
    return this.prisma.treeView.create({
      data: {
        displayId,
        name: dto.name,
        description: dto.description,
        treeType: dto.treeType,
        rootEntityType: dto.rootEntityType,
        rootEntityId: dto.rootEntityId,
        layout: dto.layout || 'VERTICAL',
        filters: dto.filters || undefined,
        viewport: dto.viewport || undefined,
        isPublic: dto.isPublic || false,
        ownerId: userId,
      },
    });
  }

  async listViews(userId: string, page: number = 1, limit: number = 20) {
    const [views, total] = await Promise.all([
      this.prisma.treeView.findMany({
        where: { ownerId: userId },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.treeView.count({ where: { ownerId: userId } }),
    ]);

    return {
      views,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getView(id: string, userId: string) {
    const view = await this.prisma.treeView.findUnique({ where: { id } });
    if (!view) throw new NotFoundException('Tree view not found');
    if (view.ownerId !== userId && !view.isPublic) throw new ForbiddenException('Access denied');

    await this.prisma.treeView.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return view;
  }

  async updateView(id: string, userId: string, dto: UpdateTreeViewDto) {
    const view = await this.prisma.treeView.findUnique({ where: { id } });
    if (!view) throw new NotFoundException('Tree view not found');
    if (view.ownerId !== userId) throw new ForbiddenException('Only the owner can update this view');

    return this.prisma.treeView.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.layout !== undefined && { layout: dto.layout }),
        ...(dto.filters !== undefined && { filters: dto.filters }),
        ...(dto.viewport !== undefined && { viewport: dto.viewport }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      },
    });
  }

  async deleteView(id: string, userId: string) {
    const view = await this.prisma.treeView.findUnique({ where: { id } });
    if (!view) throw new NotFoundException('Tree view not found');
    if (view.ownerId !== userId) throw new ForbiddenException('Only the owner can delete this view');

    await this.prisma.treeView.delete({ where: { id } });
    return { message: 'Tree view deleted successfully' };
  }

  async saveLayoutCache(dto: SaveLayoutCacheDto) {
    const existing = await this.prisma.treeLayoutCache.findUnique({
      where: {
        entityType_entityId_treeType_layout: {
          entityType: dto.entityType,
          entityId: dto.entityId,
          treeType: dto.treeType,
          layout: dto.layout,
        },
      },
    });

    if (existing) {
      return this.prisma.treeLayoutCache.update({
        where: { id: existing.id },
        data: {
          nodePositions: dto.nodePositions,
          version: { increment: 1 },
        },
      });
    }

    return this.prisma.treeLayoutCache.create({
      data: {
        entityType: dto.entityType,
        entityId: dto.entityId,
        treeType: dto.treeType,
        layout: dto.layout,
        nodePositions: dto.nodePositions,
      },
    });
  }

  async getLayoutCache(entityType: string, entityId: string, treeType: string, layout: string) {
    return this.prisma.treeLayoutCache.findUnique({
      where: {
        entityType_entityId_treeType_layout: {
          entityType,
          entityId,
          treeType,
          layout,
        },
      },
    });
  }

  async expandNode(dto: ExpandNodeDto): Promise<{ nodes: TreeNode[]; edges: TreeEdge[] }> {
    const nodes: TreeNode[] = [];
    const edges: TreeEdge[] = [];

    if (dto.entityType === 'MEMBER') {
      const rels = await this.prisma.relationship.findMany({
        where: {
          OR: [
            { fromMemberId: dto.entityId },
            { toMemberId: dto.entityId },
          ],
        },
        take: 50,
      });

      const relatedIds = new Set<string>();
      for (const r of rels) {
        const relatedId = r.fromMemberId === dto.entityId ? r.toMemberId : r.fromMemberId;
        relatedIds.add(relatedId);
      }

      const relatedMembers = await this.prisma.familyMember.findMany({
        where: { id: { in: [...relatedIds] }, deletedAt: null },
      });

      const expandProfileLinkMap = await this.getProfileLinkMap(relatedMembers.map((m: FamilyMember) => m.id));
      const now = new Date();
      for (const m of relatedMembers) {
        let age: number | undefined;
        if (m.birthDate) {
          const bd = new Date(m.birthDate);
          age = m.deathDate
            ? Math.floor((new Date(m.deathDate).getTime() - bd.getTime()) / (365.25 * 24 * 3600 * 1000))
            : Math.floor((now.getTime() - bd.getTime()) / (365.25 * 24 * 3600 * 1000));
        }
        nodes.push({
          id: m.id,
          displayId: m.displayId,
          entityType: 'MEMBER',
          entityId: m.id,
          name: `${m.firstName} ${m.lastName || ''}`.trim(),
          displayName: `${m.firstName} ${m.lastName || ''}`.trim(),
          gender: m.gender || undefined,
          birthDate: m.birthDate || undefined,
          deathDate: m.deathDate || undefined,
          age,
          occupation: m.occupation || undefined,
          profilePhoto: m.avatar || undefined,
          userId: expandProfileLinkMap.get(m.id),
          depth: 1,
          familyId: m.familyId,
        });
      }

      for (const r of rels) {
        if (relatedIds.has(r.fromMemberId) || relatedIds.has(r.toMemberId)) {
          edges.push({
            id: r.id,
            fromNodeId: r.fromMemberId,
            toNodeId: r.toMemberId,
            type: 'OTHER',
            label: r.type,
          });
        }
      }
    }

    return { nodes, edges };
  }

  async getPublicViews(page: number = 1, limit: number = 20) {
    const [views, total] = await Promise.all([
      this.prisma.treeView.findMany({
        where: { isPublic: true },
        orderBy: { viewCount: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          owner: {
            select: { id: true, name: true, displayId: true },
          },
        },
      }),
      this.prisma.treeView.count({ where: { isPublic: true } }),
    ]);

    return {
      views,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPublicViewById(id: string) {
    const view = await this.prisma.treeView.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, displayId: true },
        },
      },
    });
    if (!view || !view.isPublic) throw new NotFoundException('Public tree view not found');
    await this.prisma.treeView.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
    return view;
  }

  async getSeoMetadata(entityType: string, entityId: string) {
    let name = '';
    let description = '';
    let image = '';

    if (entityType === 'FAMILY') {
      const family = await this.prisma.family.findUnique({ where: { id: entityId } });
      if (family) {
        name = family.name;
        description = `Explore the ${family.name} family tree on the Global Digital Family Platform.`;
      }
    } else if (entityType === 'CLAN') {
      const clan = await this.prisma.clan.findUnique({ where: { id: entityId } });
      if (clan) {
        name = clan.name;
        description = `Explore the ${clan.name} clan tree on the Global Digital Family Platform.`;
      }
    } else if (entityType === 'COMMUNITY') {
      const community = await this.prisma.community.findUnique({ where: { id: entityId } });
      if (community) {
        name = community.name;
        description = `Explore the ${community.name} community tree on the Global Digital Family Platform.`;
      }
    } else if (entityType === 'MEMBER') {
      const member = await this.prisma.familyMember.findUnique({ where: { id: entityId } });
      if (member) {
        name = `${member.firstName} ${member.lastName || ''}`.trim();
        description = `View ${name}'s family tree connections.`;
        image = member.avatar || '';
      }
    }

    return {
      title: name ? `${name} - Family Tree` : 'Family Tree',
      description,
      image,
      canonicalUrl: `/tree/${entityType.toLowerCase()}/${entityId}`,
      openGraph: {
        title: name ? `${name} - Family Tree` : 'Family Tree',
        description,
        image,
        type: 'website',
      },
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name,
        description,
      },
    };
  }

  async getEnhancedStats(entityType: string, entityId: string) {
    let treeData: TreeData;
    switch (entityType) {
      case 'FAMILY':
        treeData = await this.getFamilyTree(entityId);
        break;
      case 'CLAN':
        treeData = await this.getClanTree(entityId);
        break;
      case 'COMMUNITY':
        treeData = await this.getCommunityTree(entityId);
        break;
      default:
        throw new BadRequestException(`Invalid entity type: ${entityType}`);
    }

    const memberNodes = treeData.nodes.filter((n: TreeNode) => n.entityType === 'MEMBER');
    const familyNodes = treeData.nodes.filter((n: TreeNode) => n.entityType === 'FAMILY');

    let livingCount = 0;
    let deceasedCount = 0;
    const verifiedCount = 0;
    let oldestMember: MemberSummary | null = null;
    let youngestMember: MemberSummary | null = null;
    let oldestAge = -1;
    let youngestAge = Infinity;
    const genderBreakdown: Record<string, number> = {};
    const generationCounts: Record<number, number> = {};
    const familyDistribution: Record<string, number> = {};

    for (const n of memberNodes) {
      const g = (n.gender || 'unknown').toLowerCase();
      genderBreakdown[g] = (genderBreakdown[g] || 0) + 1;

      const gen = n.depth || 0;
      generationCounts[gen] = (generationCounts[gen] || 0) + 1;

      if (n.familyId) {
        familyDistribution[n.familyName || n.familyId] = (familyDistribution[n.familyName || n.familyId] || 0) + 1;
      }

      if (n.deathDate) {
        deceasedCount++;
      } else {
        livingCount++;
      }

      if (n.age !== undefined && n.age !== null) {
        if (n.age > oldestAge) {
          oldestAge = n.age;
          oldestMember = { id: n.id, name: n.name, age: n.age, birthDate: n.birthDate };
        }
        if (n.age < youngestAge) {
          youngestAge = n.age;
          youngestMember = { id: n.id, name: n.name, age: n.age, birthDate: n.birthDate };
        }
      }
    }

    const generationSet = Object.keys(generationCounts).map((k: string) => Number(k));
    const totalGenerations = generationSet.length;
    const largestBranchSize = Math.max(...Object.values(familyDistribution), 0);
    const largestBranchName = Object.entries(familyDistribution).find(([, v]: [string, number]) => v === largestBranchSize)?.[0] || '';

    return {
      totalNodes: treeData.totalNodes,
      totalEdges: treeData.edges.length,
      maxDepth: treeData.maxDepth,
      totalGenerations,
      totalFamilies: familyNodes.length,
      totalMembers: memberNodes.length,
      livingMembers: livingCount,
      deceasedMembers: deceasedCount,
      verifiedMembers: verifiedCount,
      genderBreakdown,
      generationCounts,
      familyDistribution,
      largestBranch: { name: largestBranchName, size: largestBranchSize },
      oldestMember,
      youngestMember,
      growthTimeline: generationCounts,
    };
  }

  async findCommonAncestor(memberIdA: string, memberIdB: string, maxDepth: number = 20) {
    const memberA = await this.prisma.familyMember.findUnique({ where: { id: memberIdA } });
    const memberB = await this.prisma.familyMember.findUnique({ where: { id: memberIdB } });
    if (!memberA) throw new NotFoundException('Member A not found');
    if (!memberB) throw new NotFoundException('Member B not found');

    const getAncestors = async (memberId: string): Promise<Map<string, { depth: number; member: FamilyMember }>> => {
      const ancestors = new Map<string, { depth: number; member: FamilyMember }>();
      const queue: { id: string; depth: number }[] = [{ id: memberId, depth: 0 }];
      const visited = new Set<string>();

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current.id) || current.depth > maxDepth) continue;
        visited.add(current.id);

        const m = await this.prisma.familyMember.findUnique({ where: { id: current.id } });
        if (!m) continue;

        ancestors.set(current.id, { depth: current.depth, member: m });

        const rels = await this.prisma.relationship.findMany({
          where: {
            OR: [
              { fromMemberId: current.id, type: { in: ['FATHER', 'MOTHER', 'GRANDFATHER', 'GRANDMOTHER', 'PARENT'] } },
              { toMemberId: current.id, type: { in: ['SON', 'DAUGHTER', 'GRANDSON', 'GRANDDAUGHTER', 'CHILD'] } },
            ],
          },
        });

        for (const r of rels) {
          const isFrom = r.fromMemberId === current.id;
          const parentId = isFrom ? r.toMemberId : r.fromMemberId;
          if (!visited.has(parentId)) {
            queue.push({ id: parentId, depth: current.depth + 1 });
          }
        }
      }

      return ancestors;
    };

    const ancestorsA = await getAncestors(memberIdA);
    const ancestorsB = await getAncestors(memberIdB);

    let commonAncestor: (FamilyMember & { depthFromA: number; depthFromB: number; totalDepth: number }) | null = null;
    let minTotalDepth = Infinity;

    for (const [id, a] of ancestorsA) {
      if (ancestorsB.has(id)) {
        const b = ancestorsB.get(id)!;
        const totalDepth = a.depth + b.depth;
        if (totalDepth < minTotalDepth) {
          minTotalDepth = totalDepth;
          commonAncestor = Object.assign(a.member, {
            depthFromA: a.depth,
            depthFromB: b.depth,
            totalDepth: totalDepth,
          });
        }
      }
    }

    if (!commonAncestor) {
      return {
        found: false,
        commonAncestor: null,
        pathA: [],
        pathB: [],
        generationDifference: 0,
        message: 'No common ancestor found within the specified depth',
      };
    }

    return {
      found: true,
      commonAncestor: {
        id: commonAncestor.id,
        displayId: commonAncestor.displayId,
        name: `${commonAncestor.firstName} ${commonAncestor.lastName || ''}`.trim(),
        gender: commonAncestor.gender,
        birthDate: commonAncestor.birthDate,
        deathDate: commonAncestor.deathDate,
        depthFromA: commonAncestor.depthFromA,
        depthFromB: commonAncestor.depthFromB,
        totalDepth: commonAncestor.totalDepth,
      },
      generationDifference: Math.abs(
        (ancestorsA.get(memberIdA)?.depth || 0) - (ancestorsB.get(memberIdB)?.depth || 0)
      ),
    };
  }

  async findRelationshipPath(memberIdA: string, memberIdB: string, maxDepth: number = 20) {
    const memberA = await this.prisma.familyMember.findUnique({ where: { id: memberIdA } });
    const memberB = await this.prisma.familyMember.findUnique({ where: { id: memberIdB } });
    if (!memberA) throw new NotFoundException('Member A not found');
    if (!memberB) throw new NotFoundException('Member B not found');

    const bfs = async (startId: string, targetId: string): Promise<string[] | null> => {
      const queue: { id: string; path: string[] }[] = [{ id: startId, path: [startId] }];
      const visited = new Set<string>();
      visited.add(startId);

      let iterations = 0;
      while (queue.length > 0 && iterations < 10000) {
        iterations++;
        const current = queue.shift()!;
        if (current.id === targetId) return current.path;

        const rels = await this.prisma.relationship.findMany({
          where: {
            OR: [
              { fromMemberId: current.id },
              { toMemberId: current.id },
            ],
          },
          take: 50,
        });

        for (const r of rels) {
          const nextId = r.fromMemberId === current.id ? r.toMemberId : r.fromMemberId;
          if (!visited.has(nextId) && current.path.length <= maxDepth) {
            visited.add(nextId);
            queue.push({ id: nextId, path: [...current.path, nextId] });
          }
        }
      }
      return null;
    };

    const path = await bfs(memberIdA, memberIdB);

    if (!path) {
      return {
        found: false,
        path: [],
        distance: -1,
        relationship: 'Unknown',
        relationshipType: 'UNKNOWN',
        relationshipLabel: 'Unknown',
        degree: 0,
        removal: 0,
        sharedAncestors: [],
        message: 'No relationship path found',
      };
    }

    const pathMembers: { id: string; displayId: string; name: string; gender: string | null; birthDate: Date | null; deathDate: Date | null }[] = [];
    for (const id of path) {
      const m = id === memberIdA ? memberA : await this.prisma.familyMember.findUnique({ where: { id } });
      if (m) {
        pathMembers.push({
          id: m.id,
          displayId: m.displayId,
          name: `${m.firstName} ${m.lastName || ''}`.trim(),
          gender: m.gender,
          birthDate: m.birthDate,
          deathDate: m.deathDate,
        });
      }
    }

    let relType = 'Related';
    const distance = path.length - 1;
    if (distance === 1) relType = 'Direct Relative';
    else if (distance === 2) relType = 'Close Relative';
    else if (distance <= 4) relType = 'Extended Family';
    else relType = 'Distant Relative';

    let relationshipType = 'UNKNOWN';
    let relationshipLabel = 'Unknown';
    let degree = 0;
    let removal = 0;

    try {
      const detailed = await this.genealogyCalculator.calculateRelationship(memberIdA, memberIdB, maxDepth);
      if (detailed.found) {
        relationshipType = detailed.relationshipType;
        relationshipLabel = detailed.relationshipLabel;
        degree = detailed.degree;
        removal = detailed.removal;
      }
    } catch {
      // fallback to basic classification if detailed calculation fails
    }

    return {
      found: true,
      path: pathMembers,
      distance,
      relationship: relType,
      relationshipType,
      relationshipLabel,
      degree,
      removal,
      memberA: { id: memberA.id, name: `${memberA.firstName} ${memberA.lastName || ''}`.trim() },
      memberB: { id: memberB.id, name: `${memberB.firstName} ${memberB.lastName || ''}`.trim() },
    };
  }

  async getTreeDiagnostics(entityType: string, entityId: string) {
    let treeData: TreeData;
    switch (entityType) {
      case 'FAMILY':
        treeData = await this.getFamilyTree(entityId);
        break;
      case 'CLAN':
        treeData = await this.getClanTree(entityId);
        break;
      case 'COMMUNITY':
        treeData = await this.getCommunityTree(entityId);
        break;
      default:
        throw new BadRequestException(`Invalid entity type: ${entityType}`);
    }

    const orphanNodes: { id: string; displayId: string; name: string }[] = [];
    const brokenRelationships: { edgeId: string; from: string; to: string; reason: string }[] = [];
    const duplicateEdges: { edgeId: string; from: string; to: string; type: string }[] = [];
    const memberNodes = treeData.nodes.filter((n: TreeNode) => n.entityType === 'MEMBER');
    const familyNodes = treeData.nodes.filter((n: TreeNode) => n.entityType === 'FAMILY');

    const nodeIds = new Set(treeData.nodes.map((n: TreeNode) => n.id));
    const edgeSeen = new Set<string>();

    for (const edge of treeData.edges) {
      if (!nodeIds.has(edge.fromNodeId)) {
        brokenRelationships.push({ edgeId: edge.id, from: edge.fromNodeId, to: edge.toNodeId, reason: 'Missing source node' });
      }
      if (!nodeIds.has(edge.toNodeId)) {
        brokenRelationships.push({ edgeId: edge.id, from: edge.fromNodeId, to: edge.toNodeId, reason: 'Missing target node' });
      }

      const key = `${edge.fromNodeId}->${edge.toNodeId}:${edge.type}`;
      const revKey = `${edge.toNodeId}->${edge.fromNodeId}:${edge.type}`;
      if (edgeSeen.has(key) || edgeSeen.has(revKey)) {
        duplicateEdges.push({ edgeId: edge.id, from: edge.fromNodeId, to: edge.toNodeId, type: edge.type });
      }
      edgeSeen.add(key);
    }

    for (const n of memberNodes) {
      const hasEdge = treeData.edges.some((e: TreeEdge) => e.fromNodeId === n.id || e.toNodeId === n.id);
      if (!hasEdge) {
        orphanNodes.push({ id: n.id, displayId: n.displayId, name: n.name });
      }
    }

    const healthScore = Math.max(0, 100 - brokenRelationships.length * 5 - duplicateEdges.length * 2 - orphanNodes.length * 3);

    return {
      entityType,
      entityId,
      totalNodes: treeData.totalNodes,
      totalEdges: treeData.edges.length,
      orphanNodes: orphanNodes.length,
      brokenRelationships: brokenRelationships.length,
      duplicateEdges: duplicateEdges.length,
      healthScore,
      healthStatus: healthScore >= 90 ? 'Excellent' : healthScore >= 70 ? 'Good' : healthScore >= 50 ? 'Fair' : 'Poor',
      details: {
        orphanNodes: orphanNodes.slice(0, 20),
        brokenRelationships: brokenRelationships.slice(0, 20),
        duplicateEdges: duplicateEdges.slice(0, 20),
      },
      generationStats: {
        totalGenerations: treeData.maxDepth + 1,
        membersPerGeneration: this.getMembersPerGeneration(memberNodes),
      },
      summary: {
        families: familyNodes.length,
        members: memberNodes.length,
        living: memberNodes.filter((n: TreeNode) => !n.deathDate).length,
        deceased: memberNodes.filter((n: TreeNode) => n.deathDate).length,
      },
    };
  }

  private getMembersPerGeneration(memberNodes: TreeNode[]): Record<number, number> {
    const counts: Record<number, number> = {};
    for (const n of memberNodes) {
      const gen = n.depth || 0;
      counts[gen] = (counts[gen] || 0) + 1;
    }
    return counts;
  }

  async createBookmark(userId: string, dto: CreateBookmarkDto) {
    const existing = await this.prisma.treeBookmark.findUnique({
      where: { userId_entityType_entityId: { userId, entityType: dto.entityType, entityId: dto.entityId } },
    });
    if (existing) throw new BadRequestException('Already bookmarked');

    const displayId = await this.identityService.generateTreeBookmarkId();
    return this.prisma.treeBookmark.create({
      data: {
        displayId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        entityName: dto.entityName,
        entityTypeRef: dto.entityTypeRef,
        color: dto.color,
        note: dto.note,
        userId,
      },
    });
  }

  async listBookmarks(userId: string, entityType?: string) {
    return this.prisma.treeBookmark.findMany({
      where: {
        userId,
        ...(entityType ? { entityType } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteBookmark(id: string, userId: string) {
    const bookmark = await this.prisma.treeBookmark.findUnique({ where: { id } });
    if (!bookmark) throw new NotFoundException('Bookmark not found');
    if (bookmark.userId !== userId) throw new ForbiddenException('Access denied');
    await this.prisma.treeBookmark.delete({ where: { id } });
    return { message: 'Bookmark deleted' };
  }

  async logSearchHistory(userId: string, dto: CreateSearchHistoryDto) {
    const displayId = await this.identityService.generateTreeSearchHistoryId();
    return this.prisma.treeSearchHistory.create({
      data: {
        displayId,
        query: dto.query,
        entityType: dto.entityType,
        entityId: dto.entityId,
        resultCount: dto.resultCount || 0,
        userId,
      },
    });
  }

  async getSearchHistory(userId: string, limit: number = 20) {
    return this.prisma.treeSearchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async deleteSearchHistoryEntry(id: string, userId: string) {
    const entry = await this.prisma.treeSearchHistory.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Entry not found');
    if (entry.userId !== userId) throw new ForbiddenException('Access denied');
    await this.prisma.treeSearchHistory.delete({ where: { id } });
    return { message: 'Entry deleted' };
  }

  async logViewHistory(userId: string, entityType: string, entityId: string, entityName?: string, treeType?: string, layout?: string) {
    const existing = await this.prisma.treeViewHistory.findUnique({
      where: { userId_entityType_entityId: { userId, entityType, entityId } },
    });
    if (existing) {
      return this.prisma.treeViewHistory.update({
        where: { id: existing.id },
        data: { entityName, treeType, layout, createdAt: new Date() },
      });
    }
    const displayId = await this.identityService.generateTreeViewHistoryId();
    return this.prisma.treeViewHistory.create({
      data: { displayId, entityType, entityId, entityName, treeType, layout, userId },
    });
  }

  async getViewHistory(userId: string, limit: number = 20) {
    return this.prisma.treeViewHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async deleteViewHistoryEntry(id: string, userId: string) {
    const entry = await this.prisma.treeViewHistory.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Entry not found');
    if (entry.userId !== userId) throw new ForbiddenException('Access denied');
    await this.prisma.treeViewHistory.delete({ where: { id } });
    return { message: 'Entry deleted' };
  }

  async getRecentlyAddedMembers(limit: number = 10) {
    return this.prisma.familyMember.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true, displayId: true, firstName: true, lastName: true,
        gender: true, birthDate: true, avatar: true, familyId: true, createdAt: true,
      },
    });
  }

  async getRecentlyUpdatedMembers(limit: number = 10) {
    return this.prisma.familyMember.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        id: true, displayId: true, firstName: true, lastName: true,
        gender: true, birthDate: true, avatar: true, familyId: true, updatedAt: true,
      },
    });
  }

  async getPopularBranches(limit: number = 10) {
    const families: FamilyWithMemberCount[] = await this.prisma.family.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: { members: { where: { deletedAt: null } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    return families
      .sort((a: FamilyWithMemberCount, b: FamilyWithMemberCount) => b._count.members - a._count.members)
      .slice(0, limit)
      .map((f: FamilyWithMemberCount) => ({
        id: f.id,
        displayId: f.displayId,
        name: f.name,
        memberCount: f._count.members,
      }));
  }

  async getTreeHealthOverview() {
    const totalViews = await this.prisma.treeView.count();
    const totalPublicViews = await this.prisma.treeView.count({ where: { isPublic: true } });
    const totalLayoutCaches = await this.prisma.treeLayoutCache.count();
    const totalBranches = await this.prisma.treeBranch.count();
    const totalBookmarks = await this.prisma.treeBookmark.count();
    const totalSearchHistory = await this.prisma.treeSearchHistory.count();
    const totalViewHistory = await this.prisma.treeViewHistory.count();

    const recentViews = await this.prisma.treeView.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, treeType: true, layout: true, viewCount: true, createdAt: true },
    });

    const totalFamilies = await this.prisma.family.count({ where: { deletedAt: null } });
    const totalClans = await this.prisma.clan.count({ where: { deletedAt: null } });
    const totalCommunities = await this.prisma.community.count({ where: { deletedAt: null } });
    const totalMembers = await this.prisma.familyMember.count({ where: { deletedAt: null } });

    const brokenRelationships = await this.prisma.relationship.count({
      where: {
        OR: [
          { fromMember: { deletedAt: { not: null } } },
          { toMember: { deletedAt: { not: null } } },
        ],
      },
    });

    return {
      totals: {
        views: totalViews,
        publicViews: totalPublicViews,
        layoutCaches: totalLayoutCaches,
        branches: totalBranches,
        bookmarks: totalBookmarks,
        searchHistory: totalSearchHistory,
        viewHistory: totalViewHistory,
        families: totalFamilies,
        clans: totalClans,
        communities: totalCommunities,
        members: totalMembers,
      },
      health: {
        brokenRelationships,
        healthScore: Math.max(0, 100 - brokenRelationships * 2),
        healthStatus: brokenRelationships === 0 ? 'Excellent' : brokenRelationships < 5 ? 'Good' : brokenRelationships < 20 ? 'Fair' : 'Poor',
      },
      recentViews,
    };
  }

  async getTreePerformanceStats() {
    const start = Date.now();
    const totalNodes = await this.prisma.familyMember.count({ where: { deletedAt: null } });
    const totalEdges = await this.prisma.relationship.count();
    const totalFamilies = await this.prisma.family.count({ where: { deletedAt: null } });
    const avgMembersPerFamily = totalFamilies > 0 ? Math.round(totalNodes / totalFamilies) : 0;
    const renderTime = Date.now() - start;

    return {
      totalNodes,
      totalEdges,
      totalFamilies,
      avgMembersPerFamily,
      serverResponseTimeMs: renderTime,
      estimatedRenderNodes: Math.min(totalNodes, 5000),
      virtualRenderingReady: totalNodes > 1000,
      recommendations: totalNodes > 5000 ? ['Enable virtual rendering', 'Use lazy expansion'] : totalNodes > 1000 ? ['Consider lazy expansion'] : [],
    };
  }

  private async getProfileLinkMap(memberIds: string[]): Promise<Map<string, string>> {
    if (memberIds.length === 0) return new Map();
    const links: ProfileLink[] = await this.prisma.profileLink.findMany({
      where: { memberId: { in: memberIds } },
    });
    return new Map(links.map((pl: ProfileLink) => [pl.memberId, pl.userId]));
  }
}
