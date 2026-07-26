import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../neo4j.service';
import { QueryResult } from '../neo4j.types';
import { marriageQueries } from '../queries/marriage.queries';

@Injectable()
export class MarriageRepository {
  constructor(private readonly neo4jService: Neo4jService) {}

  async createMarriage(
    person1Id: string,
    person2Id: string,
    properties: Record<string, any>,
  ): Promise<QueryResult> {
    const { query, params } = marriageQueries.createMarriageRelationship(
      person1Id,
      person2Id,
      properties,
    );
    return this.neo4jService.writeQuery(query, params);
  }

  async updateStatus(
    person1Id: string,
    person2Id: string,
    status: string,
  ): Promise<QueryResult> {
    const { query, params } = marriageQueries.updateMarriageStatus(
      person1Id,
      person2Id,
      status,
    );
    return this.neo4jService.writeQuery(query, params);
  }

  async endMarriage(
    person1Id: string,
    person2Id: string,
    endedDate: string,
  ): Promise<QueryResult> {
    const { query, params } = marriageQueries.endMarriage(
      person1Id,
      person2Id,
      endedDate,
    );
    return this.neo4jService.writeQuery(query, params);
  }

  async getPersonMarriages(personId: string): Promise<QueryResult> {
    const { query, params } = marriageQueries.getPersonMarriages(personId);
    return this.neo4jService.readQuery(query, params);
  }

  async getAllMarriages(): Promise<QueryResult> {
    return this.neo4jService.readQuery(
      'MATCH (p1:Person)-[r:MARRIED_TO]->(p2:Person) RETURN p1, p2, r',
    );
  }

  async divorce(
    person1Id: string,
    person2Id: string,
    date: string,
  ): Promise<QueryResult> {
    const { query, params } = marriageQueries.createDivorceRelationship(
      person1Id,
      person2Id,
      date,
    );
    return this.neo4jService.writeQuery(query, params);
  }
}
