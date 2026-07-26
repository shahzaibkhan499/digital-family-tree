import { Neo4jFamily } from '../neo4j.types';

export const familyQueries = {
  createFamily(family: Neo4jFamily): { query: string; params: Record<string, any> } {
    return {
      query: `
        CREATE (f:Family {
          id: $id,
          displayId: $displayId,
          name: $name,
          description: $description,
          ownerId: $ownerId,
          createdAt: $createdAt,
          updatedAt: $updatedAt
        })
        RETURN f
      `,
      params: {
        id: family.id,
        displayId: family.displayId || null,
        name: family.name,
        description: family.description || null,
        ownerId: family.ownerId || null,
        createdAt: family.createdAt,
        updatedAt: family.updatedAt,
      },
    };
  },

  updateFamily(id: string, updates: Partial<Neo4jFamily>): { query: string; params: Record<string, any> } {
    const setClauses: string[] = [];
    const params: Record<string, any> = { id };

    const fields: (keyof Neo4jFamily)[] = [
      'displayId', 'name', 'description', 'ownerId', 'updatedAt',
    ];

    for (const field of fields) {
      if (field in updates && updates[field] !== undefined) {
        setClauses.push(`f.${field} = $${field}`);
        params[field] = updates[field];
      }
    }

    if (setClauses.length === 0) {
      return { query: 'MATCH (f:Family {id: $id}) RETURN f', params };
    }

    return {
      query: `
        MATCH (f:Family {id: $id})
        SET ${setClauses.join(', ')}
        RETURN f
      `,
      params,
    };
  },

  deleteFamily(id: string): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH (f:Family {id: $id})
        DETACH DELETE f
      `,
      params: { id },
    };
  },

  findFamilyById(id: string): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH (f:Family {id: $id})
        RETURN f
      `,
      params: { id },
    };
  },

  linkPersonToFamily(personId: string, familyId: string): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH (p:Person {id: $personId})
        MATCH (f:Family {id: $familyId})
        CREATE (p)-[:MEMBER_OF]->(f)
        RETURN p, f
      `,
      params: { personId, familyId },
    };
  },

  unlinkPersonFromFamily(personId: string, familyId: string): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH (p:Person {id: $personId})-[r:MEMBER_OF]->(f:Family {id: $familyId})
        DELETE r
      `,
      params: { personId, familyId },
    };
  },

  getFamilyMembers(familyId: string): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH (p:Person)-[:MEMBER_OF]->(f:Family {id: $familyId})
        RETURN p
      `,
      params: { familyId },
    };
  },

  getFamilyTree(familyId: string, depth: number = 10): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH (f:Family {id: $familyId})
        MATCH (p:Person)-[:MEMBER_OF]->(f)
        OPTIONAL MATCH path = (p)-[:PARENT_OF|ADOPTED_BY|SIBLING_OF*0..$depth]-(relative:Person)
        WHERE relative <> p
        RETURN p, collect(DISTINCT relative) as relatives, collect(DISTINCT path) as paths
      `,
      params: { familyId, depth },
    };
  },

  getFamilyWithAncestors(familyId: string): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH (f:Family {id: $familyId})
        MATCH (p:Person)-[:MEMBER_OF]->(f)
        OPTIONAL MATCH ancestry = (p)<-[:PARENT_OF|ADOPTED_BY*]-(ancestor:Person)
        WHERE ancestor.id <> p.id
        RETURN f, p, collect(DISTINCT ancestor) as ancestors
      `,
      params: { familyId },
    };
  },
};
