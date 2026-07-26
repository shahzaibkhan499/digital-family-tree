import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../neo4j.service';
import { Neo4jPerson, QueryResult } from '../neo4j.types';
import { personQueries } from '../queries/person.queries';

@Injectable()
export class PersonRepository {
  constructor(private readonly neo4jService: Neo4jService) {}

  async create(person: Neo4jPerson): Promise<QueryResult> {
    const { query, params } = personQueries.createPerson(person);
    return this.neo4jService.writeQuery(query, params);
  }

  async update(id: string, updates: Partial<Neo4jPerson>): Promise<QueryResult> {
    const { query, params } = personQueries.updatePerson(id, updates);
    return this.neo4jService.writeQuery(query, params);
  }

  async delete(id: string): Promise<QueryResult> {
    const { query, params } = personQueries.deletePerson(id);
    return this.neo4jService.writeQuery(query, params);
  }

  async findById(id: string): Promise<QueryResult> {
    const { query, params } = personQueries.findPersonById(id);
    return this.neo4jService.readQuery(query, params);
  }

  async findByDisplayId(displayId: string): Promise<QueryResult> {
    const { query, params } = personQueries.findPersonByDisplayId(displayId);
    return this.neo4jService.readQuery(query, params);
  }

  async search(queryText: string, limit?: number): Promise<QueryResult> {
    const { query, params } = personQueries.searchPersons(queryText, limit);
    return this.neo4jService.readQuery(query, params);
  }

  async getWithRelationships(id: string): Promise<QueryResult> {
    const { query, params } = personQueries.getPersonWithRelationships(id);
    return this.neo4jService.readQuery(query, params);
  }

  async getAncestors(id: string, depth?: number): Promise<QueryResult> {
    const { query, params } = personQueries.getPersonAncestors(id, depth);
    return this.neo4jService.readQuery(query, params);
  }

  async getDescendants(id: string, depth?: number): Promise<QueryResult> {
    const { query, params } = personQueries.getPersonDescendants(id, depth);
    return this.neo4jService.readQuery(query, params);
  }

  async getFamily(id: string): Promise<QueryResult> {
    const { query, params } = personQueries.getPersonFamily(id);
    return this.neo4jService.readQuery(query, params);
  }

  async linkToFamily(personId: string, familyId: string): Promise<QueryResult> {
    const { query, params } = personQueries.linkPersonToFamily(personId, familyId);
    return this.neo4jService.writeQuery(query, params);
  }

  async unlinkFromFamily(personId: string, familyId: string): Promise<QueryResult> {
    const { query, params } = personQueries.unlinkPersonFromFamily(personId, familyId);
    return this.neo4jService.writeQuery(query, params);
  }

  async createParentChild(
    parentId: string,
    childId: string,
    type: string = 'PARENT_OF',
  ): Promise<QueryResult> {
    const { query, params } = personQueries.createParentChildRelationship(parentId, childId, type);
    return this.neo4jService.writeQuery(query, params);
  }
}
