export const treeQueries = {
  findShortestPath(
    personIdA: string,
    personIdB: string,
    maxDepth: number = 20,
  ): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH path = shortestPath(
          (p1:Person {id: $personIdA})-[*..$maxDepth]-(p2:Person {id: $personIdB})
        )
        RETURN path,
               length(path) as distance,
               [n in nodes(path) | n.id] as nodeIds,
               [r in relationships(path) | type(r)] as relationshipTypes
      `,
      params: { personIdA, personIdB, maxDepth },
    };
  },

  findCommonAncestors(
    personIdA: string,
    personIdB: string,
    maxDepth: number = 20,
  ): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH pathA = (p1:Person {id: $personIdA})<-[:PARENT_OF|ADOPTED_BY*0..$maxDepth]-(ancestor:Person)
        MATCH pathB = (p2:Person {id: $personIdB})<-[:PARENT_OF|ADOPTED_BY*0..$maxDepth]-(ancestor)
        WHERE ancestor.id <> p1.id AND ancestor.id <> p2.id
        RETURN DISTINCT ancestor,
               length(pathA) as distanceFromA,
               length(pathB) as distanceFromB
        ORDER BY distanceFromA + distanceFromB ASC
      `,
      params: { personIdA, personIdB, maxDepth },
    };
  },

  getSubTree(
    personId: string,
    direction: 'ancestors' | 'descendants' | 'both' = 'both',
    depth: number = 5,
  ): { query: string; params: Record<string, any> } {
    let matchClause = '';
    if (direction === 'ancestors') {
      matchClause = `(p:Person {id: $personId})<-[:PARENT_OF|ADOPTED_BY*0..$depth]-(relative:Person)`;
    } else if (direction === 'descendants') {
      matchClause = `(p:Person {id: $personId})-[:PARENT_OF|ADOPTED_BY*0..$depth]->(relative:Person)`;
    } else {
      matchClause = `(p:Person {id: $personId})-[:PARENT_OF|ADOPTED_BY|SIBLING_OF*0..$depth]-(relative:Person)`;
    }

    return {
      query: `
        MATCH ${matchClause}
        WHERE relative.id <> $personId
        RETURN DISTINCT relative,
               length(path) as generation
        ORDER BY generation ASC
      `,
      params: { personId, depth },
    };
  },

  countGenerations(personId: string): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH (p:Person {id: $personId})
        OPTIONAL MATCH ancestorPath = (p)<-[:PARENT_OF|ADOPTED_BY*]-(:Person)
        OPTIONAL MATCH descendantPath = (p)-[:PARENT_OF|ADOPTED_BY*]->(:Person)
        RETURN
          max(length(ancestorPath)) as ancestorGenerations,
          max(length(descendantPath)) as descendantGenerations
      `,
      params: { personId },
    };
  },

  getPersonRelationship(
    personIdA: string,
    personIdB: string,
  ): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH path = shortestPath(
          (p1:Person {id: $personIdA})-[*..20]-(p2:Person {id: $personIdB})
        )
        RETURN
          length(path) as distance,
          [n in nodes(path) | labels(n)[0]] as nodeLabels,
          [n in nodes(path) | n.id] as nodeIds,
          [r in relationships(path) | type(r)] as relationshipTypes
      `,
      params: { personIdA, personIdB },
    };
  },

  detectCycles(personId: string): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH path = (p:Person {id: $personId})-[:PARENT_OF|ADOPTED_BY*2..]-(p)
        RETURN path,
               length(path) as cycleLength,
               [n in nodes(path) | n.id] as nodeIds
        LIMIT 10
      `,
      params: { personId },
    };
  },

  getIsolatedNodes(): { query: string; params: Record<string, any> } {
    return {
      query: `
        MATCH (n)
        WHERE NOT (n)--()
        RETURN n, labels(n)[0] as label
      `,
      params: {},
    };
  },

  getPaternalLineage(personId: string, depth: number = 10) {
    return {
      query: `
        MATCH path = (p:Person {id: $personId})<-[:PARENT_OF*1..$depth]-(ancestor:Person)
        WHERE ancestor.gender = 'male' OR ancestor.gender = 'm'
        WITH ancestor, length(path) as gen
        ORDER BY gen ASC
        RETURN ancestor.id as id,
               coalesce(ancestor.firstName, '') + ' ' + coalesce(ancestor.lastName, '') as name,
               gen as generation
      `,
      params: { personId, depth },
    };
  },

  getMaternalLineage(personId: string, depth: number = 10) {
    return {
      query: `
        MATCH path = (p:Person {id: $personId})<-[:PARENT_OF*1..$depth]-(ancestor:Person)
        WHERE ancestor.gender = 'female' OR ancestor.gender = 'f'
        WITH ancestor, length(path) as gen
        ORDER BY gen ASC
        RETURN ancestor.id as id,
               coalesce(ancestor.firstName, '') + ' ' + coalesce(ancestor.lastName, '') as name,
               gen as generation
      `,
      params: { personId, depth },
    };
  },

  getOldestAncestor(personId: string) {
    return {
      query: `
        MATCH path = (p:Person {id: $personId})<-[:PARENT_OF*]-(ancestor:Person)
        WITH ancestor, length(path) as gen
        ORDER BY gen DESC
        LIMIT 1
        RETURN ancestor.id as id,
               coalesce(ancestor.firstName, '') + ' ' + coalesce(ancestor.lastName, '') as name,
               gen as generation
      `,
      params: { personId },
    };
  },

  getFamilyBranches(ancestorId: string, depth: number = 10) {
    return {
      query: `
        MATCH (ancestor:Person {id: $ancestorId})
        MATCH path = (ancestor)-[:PARENT_OF*1..$depth]->(descendant:Person)
        WITH descendant, length(path) as gen,
             [n in nodes(path) | n.id] as nodeIds,
             [n in nodes(path) | coalesce(n.firstName, '') + ' ' + coalesce(n.lastName, '')] as nodeNames
        RETURN distinct nodeIds[0] as branchRoot,
               nodeNames[0] as branchName,
               collect({id: descendant.id, name: last(nodeNames), generation: gen, nodeIds: nodeIds}) as members
        ORDER BY branchName
      `,
      params: { ancestorId, depth },
    };
  },

  getGenerationDistribution(familyId: string) {
    return {
      query: `
        MATCH (f:Family {id: $familyId})<-[:MEMBER_OF]-(p:Person)
        OPTIONAL MATCH path = (p)<-[:PARENT_OF*]-(ancestor:Person)
        WITH p, max(length(path)) as ancestorDepth
        OPTIONAL MATCH descPath = (p)-[:PARENT_OF*]->(descendant:Person)
        WITH p, ancestorDepth, max(length(descPath)) as descDepth
        RETURN p.id as personId,
               coalesce(ancestorDepth, 0) as ancestorDepth,
               coalesce(descDepth, 0) as descDepth,
               coalesce(ancestorDepth, 0) + coalesce(descDepth, 0) as totalDepth
      `,
      params: { familyId },
    };
  },

  getAllAncestorsWithPaths(personId: string, depth: number = 10) {
    return {
      query: `
        MATCH path = (p:Person {id: $personId})<-[:PARENT_OF|ADOPTED_BY|STEP_PARENT_OF|FOSTER_PARENT_OF|GUARDIAN_OF*1..$depth]-(ancestor:Person)
        WITH ancestor, length(path) as gen,
             [n in nodes(path) | n.id] as pathIds,
             [r in relationships(path) | type(r)] as relTypes,
             [n in nodes(path) | coalesce(n.firstName, '') + ' ' + coalesce(n.lastName, '')] as pathNames
        RETURN ancestor.id as id,
               coalesce(ancestor.firstName, '') + ' ' + coalesce(ancestor.lastName, '') as name,
               gen as generation,
               ancestor.gender as gender,
               pathIds, relTypes, pathNames
        ORDER BY gen ASC
      `,
      params: { personId, depth },
    };
  },

  getAncestorsByLevel(personId: string, level: number) {
    return {
      query: `
        MATCH path = (p:Person {id: $personId})<-[:PARENT_OF*$level..$level]-(ancestor:Person)
        WITH ancestor, length(path) as gen
        RETURN ancestor.id as id,
               coalesce(ancestor.firstName, '') + ' ' + coalesce(ancestor.lastName, '') as name,
               gen as generation,
               ancestor.gender as gender,
               ancestor.birthDate as birthDate,
               ancestor.deathDate as deathDate
      `,
      params: { personId, level },
    };
  },

  getAncestorCountByLevel(personId: string, depth: number = 10) {
    return {
      query: `
        MATCH path = (p:Person {id: $personId})<-[:PARENT_OF*1..$depth]-(ancestor:Person)
        WITH length(path) as gen, collect(DISTINCT ancestor.id) as ids
        RETURN gen as generation, size(ids) as count
        ORDER BY gen ASC
      `,
      params: { personId, depth },
    };
  },
};
