import { Neo4jPerson } from '../neo4j.types';

export const personQueries = {
  createPerson(person: Neo4jPerson): { query: string; params: Record<string, any> } {
    return {
      query: `
        MERGE (p:Person {id: $id})
        ON CREATE SET
          p.displayId = $displayId,
          p.firstName = $firstName,
          p.lastName = $lastName,
          p.gender = $gender,
          p.birthDate = $birthDate,
          p.deathDate = $deathDate,
          p.avatar = $avatar,
          p.occupation = $occupation,
          p.country = $country,
          p.isVerified = $isVerified,
          p.privacyLevel = $privacyLevel,
          p.createdAt = $createdAt,
          p.updatedAt = $updatedAt
        ON MATCH SET
          p.displayId = $displayId,
          p.firstName = $firstName,
          p.lastName = $lastName,
          p.gender = $gender,
          p.birthDate = $birthDate,
          p.deathDate = $deathDate,
          p.avatar = $avatar,
          p.occupation = $occupation,
          p.country = $country,
          p.isVerified = $isVerified,
          p.privacyLevel = $privacyLevel,
          p.updatedAt = $updatedAt
        RETURN p
      `,
      params: {
        id: person.id,
        displayId: person.displayId,
        firstName: person.firstName || null,
        lastName: person.lastName || null,
        gender: person.gender || null,
        birthDate: person.birthDate || null,
        deathDate: person.deathDate || null,
        avatar: person.avatar || null,
        occupation: person.occupation || null,
        country: person.country || null,
        isVerified: person.isVerified,
        privacyLevel: person.privacyLevel || null,
        createdAt: person.createdAt,
        updatedAt: person.updatedAt,
      },
    };
  },

  updatePerson(
    id: string,
    updates: Partial<Neo4jPerson>,
  ): { query: string; params: Record<string, any> } {
    const setClauses: string[] = [];
    const params: Record<string, any> = { id };

    const fields: (keyof Neo4jPerson)[] = [
      'displayId',
      'firstName',
      'lastName',
      'gender',
      'birthDate',
      'deathDate',
      'avatar',
      'occupation',
      'country',
      'isVerified',
      'privacyLevel',
      'updatedAt',
    ];

    for (const field of fields) {
      if (field in updates && updates[field] !== undefined) {
        setClauses.push(`p.${field} = $${field}`);
        params[field] = updates[field];
      }
    }

    if (setClauses.length === 0) {
      return { query: 'MATCH (p:Person {id: $id}) RETURN p', params };
    }

    return {
      query: `
        MATCH (p:Person {id: $id})
        SET ${setClauses.join(', ')}
        RETURN p
      `,
      params,
    };
  },

  deletePerson(id: string): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH (p:Person {id: $id})
        DETACH DELETE p
      `,
      params: { id },
    };
  },

  findPersonById(id: string): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH (p:Person {id: $id})
        RETURN p
      `,
      params: { id },
    };
  },

  findPersonByDisplayId(displayId: string): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH (p:Person {displayId: $displayId})
        RETURN p
      `,
      params: { displayId },
    };
  },

  searchPersons(query: string, limit: number = 20): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH (p:Person)
        WHERE p.firstName CONTAINS $query
           OR p.lastName CONTAINS $query
           OR p.displayId CONTAINS $query
        RETURN p
        LIMIT $limit
      `,
      params: { query, limit },
    };
  },

  getPersonWithRelationships(id: string): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH (p:Person {id: $id})
        OPTIONAL MATCH (p)-[r]-(connected)
        RETURN p, collect(r) as relationships, collect(connected) as connectedNodes
      `,
      params: { id },
    };
  },

  getPersonAncestors(
    id: string,
    depth: number = 10,
  ): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH (p:Person {id: $id})
        MATCH path = (p)<-[:PARENT_OF|ADOPTED_BY*0..$depth]-(ancestor:Person)
        WHERE ancestor.id <> p.id
        RETURN ancestor, length(path) as generation
        ORDER BY generation DESC
      `,
      params: { id, depth },
    };
  },

  getPersonDescendants(
    id: string,
    depth: number = 10,
  ): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH (p:Person {id: $id})
        MATCH path = (p)-[:PARENT_OF|ADOPTED_BY*0..$depth]->(descendant:Person)
        WHERE descendant.id <> p.id
        RETURN descendant, length(path) as generation
        ORDER BY generation ASC
      `,
      params: { id, depth },
    };
  },

  getPersonFamily(id: string): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH (p:Person {id: $id})-[:MEMBER_OF]->(f:Family)
        RETURN f
      `,
      params: { id },
    };
  },

  createParentChildRelationship(
    parentId: string,
    childId: string,
    type: string = 'PARENT_OF',
  ): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH (parent:Person {id: $parentId})
        MATCH (child:Person {id: $childId})
        MERGE (parent)-[r:${type}]->(child)
        RETURN r
      `,
      params: { parentId, childId, type },
    };
  },

  linkPersonToFamily(
    personId: string,
    familyId: string,
  ): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH (p:Person {id: $personId})
        MATCH (f:Family {id: $familyId})
        MERGE (p)-[:MEMBER_OF]->(f)
        RETURN p, f
      `,
      params: { personId, familyId },
    };
  },

  unlinkPersonFromFamily(
    personId: string,
    familyId: string,
  ): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH (p:Person {id: $personId})-[r:MEMBER_OF]->(f:Family {id: $familyId})
        DELETE r
      `,
      params: { personId, familyId },
    };
  },
};
