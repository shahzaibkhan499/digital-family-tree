import { Injectable, Logger } from '@nestjs/common';
import { Neo4jService } from '../neo4j.service';
import { PersonRepository } from '../repositories/person.repository';
import { FamilyRepository } from '../repositories/family.repository';
import { MarriageRepository } from '../repositories/marriage.repository';
import { GraphRepository } from '../repositories/graph.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { SyncResult } from '../neo4j.types';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private syncing = false;

  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly prisma: PrismaService,
    private readonly personRepo: PersonRepository,
    private readonly familyRepo: FamilyRepository,
    private readonly marriageRepo: MarriageRepository,
    private readonly graphRepo: GraphRepository,
  ) {}

  /**
   * Full synchronization: apply schema, then sync all data
   */
  async syncAll(): Promise<SyncResult> {
    if (!this.neo4jService.isConnected()) {
      this.logger.warn('Neo4j not connected. Skipping sync.');
      return { success: false, nodesCreated: 0, nodesUpdated: 0, nodesDeleted: 0, relationshipsCreated: 0, errors: ['Neo4j not connected'] };
    }

    if (this.syncing) {
      return { success: false, nodesCreated: 0, nodesUpdated: 0, nodesDeleted: 0, relationshipsCreated: 0, errors: ['Sync already in progress'] };
    }

    this.syncing = true;
    const result: SyncResult = { success: true, nodesCreated: 0, nodesUpdated: 0, nodesDeleted: 0, relationshipsCreated: 0, errors: [] };

    try {
      // 1. Apply schema (indexes + constraints)
      await this.graphRepo.applySchema();
      this.logger.log('Neo4j schema applied');

      // 2. Sync Families
      const families = await this.prisma.family.findMany({ where: { deletedAt: null } });
      for (const family of families) {
        try {
          await this.familyRepo.create({
            id: family.id,
            displayId: family.displayId,
            name: family.name,
            description: family.description || undefined,
            ownerId: family.ownerId,
            createdAt: family.createdAt.toISOString(),
            updatedAt: family.updatedAt.toISOString(),
          });
          result.nodesCreated++;
        } catch (err: any) {
          if (!err.message?.includes('already exists')) {
            result.errors.push(`Family ${family.id}: ${err.message}`);
          }
        }
      }
      this.logger.log(`Synced ${families.length} families`);

      // 3. Sync Members (Persons)
      const members = await this.prisma.familyMember.findMany({ where: { deletedAt: null } });
      for (const member of members) {
        try {
          await this.personRepo.create({
            id: member.id,
            displayId: member.displayId,
            firstName: member.firstName || undefined,
            lastName: member.lastName || undefined,
            gender: member.gender || undefined,
            birthDate: member.birthDate?.toISOString(),
            deathDate: member.deathDate?.toISOString(),
            avatar: member.avatar || undefined,
            occupation: member.occupation || undefined,
            country: member.country || undefined,
            isVerified: false,
            privacyLevel: undefined,
            createdAt: member.createdAt.toISOString(),
            updatedAt: member.updatedAt.toISOString(),
          });
          result.nodesCreated++;
        } catch (err: any) {
          if (!err.message?.includes('already exists')) {
            result.errors.push(`Person ${member.id}: ${err.message}`);
          }
        }

        // Link person to family
        try {
          await this.personRepo.linkToFamily(member.id, member.familyId);
          result.relationshipsCreated++;
        } catch (err: any) {
          // skip if relationship already exists
        }
      }
      this.logger.log(`Synced ${members.length} persons`);

      // 4. Sync Relationships (marriages, parent-child)
      const relationships = await this.prisma.relationship.findMany();
      for (const rel of relationships) {
        const type = rel.type.toUpperCase();
        try {
          if (['HUSBAND', 'WIFE', 'SPOUSE', 'PARTNER'].includes(type)) {
            // Create MARRIED_TO relationship
            const status = type === 'SPOUSE' ? 'UNKNOWN' : type === 'HUSBAND' ? 'MARRIED' : 'MARRIED';
            await this.marriageRepo.createMarriage(rel.fromMemberId, rel.toMemberId, {
              type,
              status,
            });
            result.relationshipsCreated++;
          } else if (['FATHER', 'MOTHER', 'PARENT'].includes(type)) {
            // Create PARENT_OF relationship
            await this.personRepo.createParentChild(rel.fromMemberId, rel.toMemberId, type);
            result.relationshipsCreated++;
          } else if (['SON', 'DAUGHTER', 'CHILD'].includes(type)) {
            // Inverse: child -> parent (CHILD_OF)
            await this.personRepo.createParentChild(rel.toMemberId, rel.fromMemberId, type === 'CHILD' ? 'PARENT' : type);
            result.relationshipsCreated++;
          }
          // Additional types like ADOPTIVE_FATHER, STEP_MOTHER etc will be handled
          // by future implementations
        } catch (err: any) {
          if (!err.message?.includes('already exists') && !err.message?.includes('already connected')) {
            result.errors.push(`Relationship ${rel.id}: ${err.message}`);
          }
        }
      }
      this.logger.log(`Synced ${relationships.length} relationships`);

      result.success = result.errors.length === 0;
      this.logger.log(`Sync complete: ${result.nodesCreated} nodes, ${result.relationshipsCreated} relationships`);
    } catch (err: any) {
      result.success = false;
      result.errors.push(`Sync failed: ${err.message}`);
      this.logger.error(`Sync failed: ${err.message}`);
    } finally {
      this.syncing = false;
    }

    return result;
  }

  /**
   * Sync a single person after PostgreSQL create/update
   */
  async syncPerson(personId: string): Promise<void> {
    if (!this.neo4jService.isConnected()) return;
    try {
      const member = await this.prisma.familyMember.findUnique({
        where: { id: personId },
      });
      if (!member || member.deletedAt) {
        await this.personRepo.delete(personId);
        return;
      }
      await this.personRepo.create({
        id: member.id,
        displayId: member.displayId,
        firstName: member.firstName || undefined,
        lastName: member.lastName || undefined,
        gender: member.gender || undefined,
        birthDate: member.birthDate?.toISOString(),
        deathDate: member.deathDate?.toISOString(),
        avatar: member.avatar || undefined,
        occupation: member.occupation || undefined,
        country: member.country || undefined,
        isVerified: false,
        createdAt: member.createdAt.toISOString(),
        updatedAt: member.updatedAt.toISOString(),
      });
      await this.personRepo.linkToFamily(member.id, member.familyId);
    } catch (err: any) {
      if (!err.message?.includes('already exists')) {
        this.logger.error(`Failed to sync person ${personId}: ${err.message}`);
      }
    }
  }

  /**
   * Sync a single relationship after PostgreSQL create/update
   */
  async syncRelationship(relationshipId: string): Promise<void> {
    if (!this.neo4jService.isConnected()) return;
    try {
      const rel = await this.prisma.relationship.findUnique({
        where: { id: relationshipId },
      });
      if (!rel) return;

      const type = rel.type.toUpperCase();
      if (['HUSBAND', 'WIFE', 'SPOUSE', 'PARTNER'].includes(type)) {
        await this.marriageRepo.createMarriage(rel.fromMemberId, rel.toMemberId, { type, status: 'UNKNOWN' });
      } else if (['FATHER', 'MOTHER', 'PARENT'].includes(type)) {
        await this.personRepo.createParentChild(rel.fromMemberId, rel.toMemberId, type);
      } else if (['SON', 'DAUGHTER', 'CHILD'].includes(type)) {
        await this.personRepo.createParentChild(rel.toMemberId, rel.fromMemberId, 'PARENT');
      }
    } catch (err: any) {
      if (!err.message?.includes('already exists') && !err.message?.includes('already connected')) {
        this.logger.error(`Failed to sync relationship ${relationshipId}: ${err.message}`);
      }
    }
  }

  /**
   * Remove a relationship from Neo4j
   */
  async removeRelationship(fromId: string, toId: string, type: string): Promise<void> {
    if (!this.neo4jService.isConnected()) return;
    try {
      const query = `
        MATCH (a:Person {id: $fromId})-[r ${type === 'HUSBAND' || type === 'WIFE' || type === 'SPOUSE' ? ':' + 'MARRIED_TO' : ':' + 'PARENT_OF'}]->(b:Person {id: $toId})
        DELETE r
      `;
      await this.neo4jService.writeQuery(query, { fromId, toId });
    } catch (err: any) {
      this.logger.error(`Failed to remove relationship: ${err.message}`);
    }
  }

  /**
   * Delete a person from Neo4j
   */
  async deletePerson(personId: string): Promise<void> {
    if (!this.neo4jService.isConnected()) return;
    await this.personRepo.delete(personId);
  }
}
