export interface Neo4jPerson {
  id: string;
  displayId: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  birthDate?: string;
  deathDate?: string;
  avatar?: string;
  occupation?: string;
  country?: string;
  isVerified: boolean;
  privacyLevel?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Neo4jFamily {
  id: string;
  displayId?: string;
  name: string;
  description?: string;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Neo4jMarriage {
  id: string;
  displayId?: string;
  status: 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'SEPARATED' | 'UNKNOWN';
  marriageDate?: string;
  endedDate?: string;
  location?: string;
  isCommonLaw: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Neo4jClan {
  id: string;
  displayId?: string;
  name: string;
  slug?: string;
  privacyLevel?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Neo4jCommunity {
  id: string;
  displayId?: string;
  name: string;
  slug?: string;
  privacyLevel?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Neo4jConfig {
  uri: string;
  username: string;
  password: string;
  database?: string;
  maxConnectionPoolSize?: number;
  connectionTimeout?: number;
}

export type Neo4jRelationshipType =
  | 'PARENT_OF' | 'CHILD_OF'
  | 'MARRIED_TO' | 'DIVORCED_FROM'
  | 'MEMBER_OF' | 'BELONGS_TO'
  | 'HAS_FAMILY' | 'HAS_CLAN' | 'HAS_COMMUNITY'
  | 'ADOPTED_BY' | 'STEP_PARENT_OF'
  | 'HALF_SIBLING_OF' | 'FOSTER_PARENT_OF'
  | 'GUARDIAN_OF' | 'SIBLING_OF'
  | 'ENGAGED_TO' | 'PARTNER_OF';

export interface Neo4jRelationship {
  type: Neo4jRelationshipType;
  fromId: string;
  toId: string;
  properties?: Record<string, any>;
}

export interface SyncResult {
  success: boolean;
  nodesCreated: number;
  nodesUpdated: number;
  nodesDeleted: number;
  relationshipsCreated: number;
  errors: string[];
}

export interface QueryResult<T = any> {
  records: T[];
  summary: {
    query: string;
    parameters: Record<string, any>;
    counters: Record<string, number>;
    time: number;
  };
}

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

export interface AncestorChainResult {
  id: string;
  name: string;
  generation: number;
  relationshipLabel: string;
}

export interface FamilyNetworkResult {
  parents: { id: string; name: string; type: string; label: string }[];
  siblings: { id: string; name: string; type: string; label: string }[];
  spouses: { id: string; name: string; status: string; label: string }[];
  children: { id: string; name: string; type: string; label: string }[];
}

export interface CousinResult {
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

export interface FormattedPath {
  nodes: { id: string; name: string; gender?: string; relationshipToNext?: string; relationshipFromPrev?: string }[];
  edges: { from: string; to: string; type: string; label: string }[];
  length: number;
  summary: string;
}

export interface GenerationResult {
  generationDifference: number;
  olderPerson: 'a' | 'b' | 'same';
  olderGeneration: number;
  youngerGeneration: number;
}

export interface KinshipResult {
  found: boolean;
  relationship: {
    type: string;
    label: string;
    category: string;
    degree: number;
    removal: number;
    generationDifference: number;
    confidence: number;
  };
  commonAncestor?: {
    id: string;
    name: string;
    generationA: number;
    generationB: number;
    path: string[];
  };
  lineage: {
    side: string;
    maternalAncestors: number;
    paternalAncestors: number;
  };
  path: {
    nodes: { id: string; name: string; gender?: string }[];
    edges: { from: string; to: string; type: string; label: string }[];
    length: number;
    summary: string;
  };
  generations: {
    personAGeneration: number;
    personBGeneration: number;
    commonAncestorGeneration: number;
    totalGenerationsFromA: number;
    totalGenerationsFromB: number;
  };
}

export interface GenerationDistribution {
  generations: { level: number; count: number; memberIds: string[] }[];
  maxDepth: number;
}

export interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
}

export interface LineageInfo {
  side: 'maternal' | 'paternal' | 'both' | 'unknown';
  maternalAncestors: number;
  paternalAncestors: number;
  maternalLine: { id: string; name: string; generation: number }[];
  paternalLine: { id: string; name: string; generation: number }[];
}
