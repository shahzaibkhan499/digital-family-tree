import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../neo4j.service';
import { Neo4jFamily, QueryResult } from '../neo4j.types';
import { familyQueries } from '../queries/family.queries';

@Injectable()
export class FamilyRepository {
  constructor(private readonly neo4jService: Neo4jService) {}

  async create(family: Neo4jFamily): Promise<QueryResult> {
    const { query, params } = familyQueries.createFamily(family);
    return this.neo4jService.writeQuery(query, params);
  }

  async update(id: string, updates: Partial<Neo4jFamily>): Promise<QueryResult> {
    const { query, params } = familyQueries.updateFamily(id, updates);
    return this.neo4jService.writeQuery(query, params);
  }

  async delete(id: string): Promise<QueryResult> {
    const { query, params } = familyQueries.deleteFamily(id);
    return this.neo4jService.writeQuery(query, params);
  }

  async findById(id: string): Promise<QueryResult> {
    const { query, params } = familyQueries.findFamilyById(id);
    return this.neo4jService.readQuery(query, params);
  }

  async getMembers(familyId: string): Promise<QueryResult> {
    const { query, params } = familyQueries.getFamilyMembers(familyId);
    return this.neo4jService.readQuery(query, params);
  }

  async linkPerson(personId: string, familyId: string): Promise<QueryResult> {
    const { query, params } = familyQueries.linkPersonToFamily(personId, familyId);
    return this.neo4jService.writeQuery(query, params);
  }

  async unlinkPerson(personId: string, familyId: string): Promise<QueryResult> {
    const { query, params } = familyQueries.unlinkPersonFromFamily(personId, familyId);
    return this.neo4jService.writeQuery(query, params);
  }

  async getTree(familyId: string, depth?: number): Promise<QueryResult> {
    const { query, params } = familyQueries.getFamilyTree(familyId, depth);
    return this.neo4jService.readQuery(query, params);
  }

  async getWithAncestors(familyId: string): Promise<QueryResult> {
    const { query, params } = familyQueries.getFamilyWithAncestors(familyId);
    return this.neo4jService.readQuery(query, params);
  }
}
