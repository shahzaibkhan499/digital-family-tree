export const marriageQueries = {
  createMarriageRelationship(
    person1Id: string,
    person2Id: string,
    properties: Record<string, any>,
  ): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH (p1:Person {id: $person1Id})
        MATCH (p2:Person {id: $person2Id})
        MERGE (p1)-[r:MARRIED_TO]->(p2)
        ON CREATE SET
          r.status = $status,
          r.marriageDate = $marriageDate,
          r.location = $location,
          r.isCommonLaw = $isCommonLaw,
          r.createdAt = $createdAt,
          r.updatedAt = $updatedAt
        ON MATCH SET
          r.status = $status,
          r.marriageDate = $marriageDate,
          r.location = $location,
          r.isCommonLaw = $isCommonLaw,
          r.updatedAt = $updatedAt
        MERGE (p2)-[r2:MARRIED_TO]->(p1)
        ON CREATE SET
          r2.status = $status,
          r2.marriageDate = $marriageDate,
          r2.location = $location,
          r2.isCommonLaw = $isCommonLaw,
          r2.createdAt = $createdAt,
          r2.updatedAt = $updatedAt
        ON MATCH SET
          r2.status = $status,
          r2.marriageDate = $marriageDate,
          r2.location = $location,
          r2.isCommonLaw = $isCommonLaw,
          r2.updatedAt = $updatedAt
        RETURN r
      `,
      params: {
        person1Id,
        person2Id,
        status: properties.status || 'MARRIED',
        marriageDate: properties.marriageDate || null,
        location: properties.location || null,
        isCommonLaw: properties.isCommonLaw || false,
        createdAt: properties.createdAt || new Date().toISOString(),
        updatedAt: properties.updatedAt || new Date().toISOString(),
      },
    };
  },

  updateMarriageStatus(
    person1Id: string,
    person2Id: string,
    status: string,
  ): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH (p1:Person {id: $person1Id})-[r:MARRIED_TO]->(p2:Person {id: $person2Id})
        SET r.status = $status, r.updatedAt = $updatedAt
        WITH r
        MATCH (p2)-[r2:MARRIED_TO]->(p1)
        SET r2.status = $status, r2.updatedAt = $updatedAt
        RETURN r
      `,
      params: {
        person1Id,
        person2Id,
        status,
        updatedAt: new Date().toISOString(),
      },
    };
  },

  endMarriage(
    person1Id: string,
    person2Id: string,
    endedDate: string,
  ): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH (p1:Person {id: $person1Id})-[r:MARRIED_TO]->(p2:Person {id: $person2Id})
        SET r.status = 'DIVORCED', r.endedDate = $endedDate, r.updatedAt = $updatedAt
        WITH r
        MATCH (p2)-[r2:MARRIED_TO]->(p1)
        SET r2.status = 'DIVORCED', r2.endedDate = $endedDate, r2.updatedAt = $updatedAt
        RETURN r
      `,
      params: {
        person1Id,
        person2Id,
        endedDate,
        updatedAt: new Date().toISOString(),
      },
    };
  },

  getPersonMarriages(personId: string): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH (p:Person {id: $personId})-[r:MARRIED_TO]->(spouse:Person)
        RETURN spouse, r
      `,
      params: { personId },
    };
  },

  createDivorceRelationship(
    person1Id: string,
    person2Id: string,
    date: string,
  ): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH (p1:Person {id: $person1Id})
        MATCH (p2:Person {id: $person2Id})
        MERGE (p1)-[r:DIVORCED_FROM]->(p2)
        ON CREATE SET
          r.date = $date,
          r.createdAt = $createdAt
        MERGE (p2)-[r2:DIVORCED_FROM]->(p1)
        ON CREATE SET
          r2.date = $date,
          r2.createdAt = $createdAt
        RETURN r
      `,
      params: {
        person1Id,
        person2Id,
        date,
        createdAt: new Date().toISOString(),
      },
    };
  },
};
