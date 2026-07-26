export interface TreeNode {
  id: string;
  displayId: string;
  entityType: string;
  entityId: string;
  name: string;
  displayName?: string;
  gender?: string;
  birthDate?: Date;
  deathDate?: Date;
  age?: number;
  occupation?: string;
  profilePhoto?: string;
  userId?: string;
  profileLink?: string;
  verificationBadge?: boolean;
  relationshipLabel?: string;
  familyId?: string;
  familyName?: string;
  clanId?: string;
  clanName?: string;
  subClanId?: string;
  subClanName?: string;
  communityId?: string;
  communityName?: string;
  status?: string;
  privacyLevel?: string;
  sourceCount?: number;
  depth: number;
  parentId?: string;
  spouseIds?: string[];
  childIds?: string[];
  hasChildren?: boolean;
  hasMore?: boolean;
}

export interface TreeEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  type: string;
  label?: string;
}

export interface TreeData {
  nodes: TreeNode[];
  edges: TreeEdge[];
  rootId: string;
  totalNodes: number;
  maxDepth: number;
  metadata: {
    treeType: string;
    rootEntityType: string;
    rootEntityId: string;
    layout: string;
    generatedAt: string;
  };
}

export interface TreeStats {
  totalNodes: number;
  totalEdges: number;
  maxDepth: number;
  livingMembers: number;
  deceasedMembers: number;
  verifiedMembers: number;
  genderBreakdown: Record<string, number>;
  generationCount: number;
}
